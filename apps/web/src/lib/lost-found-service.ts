import type {
  LostAlert,
  Sighting,
  LostAlertFilters,
  LostAlertStatus
} from './lost-found-types'
import { generateULID } from './utils'
import { createLogger } from './logger'

const logger = createLogger('LostFoundService')

interface CreateLostAlertData {
  petSummary: LostAlert['petSummary']
  lastSeen: LostAlert['lastSeen']
  reward?: number
  rewardCurrency?: string
  contactMask: string
  photos: string[]
}

class LostFoundService {
  private async getAlerts(): Promise<LostAlert[]> {
    return await spark.kv.get<LostAlert[]>('lost-found-alerts') || []
  }

  private async setAlerts(alerts: LostAlert[]): Promise<void> {
    await spark.kv.set('lost-found-alerts', alerts)
  }

  private async getSightings(): Promise<Sighting[]> {
    return await spark.kv.get<Sighting[]>('lost-found-sightings') || []
  }

  private async setSightings(sightings: Sighting[]): Promise<void> {
    await spark.kv.set('lost-found-sightings', sightings)
  }

  async createAlert(userId: string, data: CreateLostAlertData, ownerName: string): Promise<LostAlert> {
    const alerts = await this.getAlerts()

    const alert: LostAlert = {
      id: generateULID(),
      ownerId: userId,
      ownerName,
      petSummary: data.petSummary,
      lastSeen: data.lastSeen,
      ...(data.reward !== undefined ? { reward: data.reward } : {}),
      rewardCurrency: data.rewardCurrency || 'USD',
      contactMask: data.contactMask,
      photos: data.photos,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notificationsSent: 0,
      viewsCount: 0,
      sightingsCount: 0
    }

    alerts.push(alert)
    await this.setAlerts(alerts)

    await this.triggerGeofenceNotifications(alert)

    return alert
  }

  async getAlertById(id: string): Promise<LostAlert | undefined> {
    const alerts = await this.getAlerts()
    return alerts.find(a => a.id === id)
  }

  async getActiveAlerts(filters?: LostAlertFilters): Promise<LostAlert[]> {
    let alerts = await this.getAlerts()

    alerts = alerts.filter(a => a.status === 'active')

    if (!filters) {
      return alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    if (filters.species && filters.species.length > 0) {
      alerts = alerts.filter(a => filters.species!.includes(a.petSummary.species))
    }

    if (filters.location && filters.location.lat && filters.location.lon) {
      alerts = alerts.filter(a => {
        if (!a.lastSeen.lat || !a.lastSeen.lon) return false
        const distance = this.calculateDistance(
          filters.location!.lat,
          filters.location!.lon,
          a.lastSeen.lat,
          a.lastSeen.lon
        )
        return distance <= filters.location!.radiusKm
      })
    }

    if (filters.status && filters.status.length > 0) {
      alerts = alerts.filter(a => filters.status!.includes(a.status))
    }

    if (filters.dateFrom) {
      alerts = alerts.filter(a => new Date(a.lastSeen.whenISO) >= new Date(filters.dateFrom!))
    }

    if (filters.dateTo) {
      alerts = alerts.filter(a => new Date(a.lastSeen.whenISO) <= new Date(filters.dateTo!))
    }

    return alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  async getUserAlerts(userId: string): Promise<LostAlert[]> {
    const alerts = await this.getAlerts()
    return alerts.filter(a => a.ownerId === userId)
  }

  async updateAlertStatus(alertId: string, status: LostAlertStatus): Promise<void> {
    const alerts = await this.getAlerts()
    const index = alerts.findIndex(a => a.id === alertId)

    if (index === -1) {
      throw new Error('Alert not found')
    }

    const alert = alerts[index]
    if (!alert) {
      throw new Error('Alert not found')
    }

    alert.status = status
    alert.updatedAt = new Date().toISOString()

    if (status === 'found') {
      alert.foundAt = new Date().toISOString()
    }

    await this.setAlerts(alerts)
  }

  async incrementViewCount(alertId: string): Promise<void> {
    const alerts = await this.getAlerts()
    const index = alerts.findIndex(a => a.id === alertId)

    if (index !== -1) {
      const alert = alerts[index]
      if (alert) {
        alert.viewsCount++
        await this.setAlerts(alerts)
      }
    }
  }

  async createSighting(data: Omit<Sighting, 'id' | 'createdAt' | 'verified'>): Promise<Sighting> {
    const sightings = await this.getSightings()

    const sighting: Sighting = {
      ...data,
      id: generateULID(),
      verified: false,
      createdAt: new Date().toISOString()
    }

    sightings.push(sighting)
    await this.setSightings(sightings)

    const alerts = await this.getAlerts()
    const alert = alerts.find(a => a.id === data.alertId)
    if (alert && alert.lastSeen.lat && alert.lastSeen.lon) {
      await this.notifyOwnerOfSighting(alert, sighting)
    }

    return sighting
  }

  async getAlertSightings(alertId: string): Promise<Sighting[]> {
    const sightings = await this.getSightings()
    return sightings.filter(s => s.alertId === alertId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  async verifySighting(sightingId: string, verified: boolean): Promise<void> {
    const sightings = await this.getSightings()
    const index = sightings.findIndex(s => s.id === sightingId)

    if (index !== -1) {
      const sighting = sightings[index]
      if (sighting) {
        sighting.verified = verified
        await this.setSightings(sightings)
      }
    }
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371
    const dLat = this.deg2rad(lat2 - lat1)
    const dLon = this.deg2rad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c
    return distance
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180)
  }

  private async triggerGeofenceNotifications(alert: LostAlert): Promise<void> {
    const alerts = await this.getAlerts()
    const index = alerts.findIndex(a => a.id === alert.id)

    if (index !== -1) {
      const foundAlert = alerts[index]
      if (foundAlert) {
        foundAlert.notificationsSent = (foundAlert.notificationsSent || 0) + 1
        await this.setAlerts(alerts)
      }
    }
  }

  private async notifyOwnerOfSighting(alert: LostAlert, sighting: Sighting): Promise<void> {
    logger.info('Notifying owner of sighting', { alertId: alert.id, sightingId: sighting.id })
  }

  async getNearbyAlerts(lat: number, lon: number, radiusKm: number): Promise<LostAlert[]> {
    const alerts = await this.getAlerts()

    return alerts
      .filter(a => {
        if (a.status !== 'active') return false
        if (!a.lastSeen.lat || !a.lastSeen.lon) return false

        const distance = this.calculateDistance(lat, lon, a.lastSeen.lat, a.lastSeen.lon)
        return distance <= radiusKm
      })
      .sort((a, b) => {
        const distA = this.calculateDistance(lat, lon, a.lastSeen.lat!, a.lastSeen.lon!)
        const distB = this.calculateDistance(lat, lon, b.lastSeen.lat!, b.lastSeen.lon!)
        return distA - distB
      })
  }
}

export const lostFoundService = new LostFoundService()
