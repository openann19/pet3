import { useStorage } from '@/hooks/useStorage'
import type { AdoptionProfile, AdoptionApplication, Shelter } from './adoption-types'
import { safeParseAdoptionProfiles, safeParseAdoptionApplications, isShelterArray } from './type-guards'

export const adoptionService = {
  async getAdoptionProfiles(filters?: {
    status?: string
    breed?: string
    minAge?: number
    maxAge?: number
    size?: string[]
    location?: string
    goodWithKids?: boolean
    goodWithPets?: boolean
    cursor?: string
    limit?: number
  }): Promise<{ profiles: AdoptionProfile[]; hasMore: boolean; nextCursor?: string }> {
    const allProfiles = await this.getAllProfiles()
    let filtered = allProfiles

    if (filters?.status) {
      filtered = filtered.filter(p => p.status === filters.status)
    }
    if (filters?.breed) {
      filtered = filtered.filter(p => 
        p.breed.toLowerCase().includes(filters.breed!.toLowerCase())
      )
    }
    if (filters?.size && filters.size.length > 0) {
      filtered = filtered.filter(p => filters.size!.includes(p.size))
    }
    if (filters?.goodWithKids !== undefined) {
      filtered = filtered.filter(p => p.goodWithKids === filters.goodWithKids)
    }
    if (filters?.goodWithPets !== undefined) {
      filtered = filtered.filter(p => p.goodWithPets === filters.goodWithPets)
    }

    const limit = filters?.limit || 20
    const startIndex = filters?.cursor ? parseInt(filters.cursor) : 0
    const profiles = filtered.slice(startIndex, startIndex + limit)
    const hasMore = startIndex + limit < filtered.length
    const nextCursor = hasMore ? String(startIndex + limit) : undefined

    return { profiles, hasMore, nextCursor }
  },

  async getProfileById(id: string): Promise<AdoptionProfile | null> {
    const profiles = await this.getAllProfiles()
    return profiles.find(p => p._id === id) || null
  },

  async getAllProfiles(): Promise<AdoptionProfile[]> {
    const profiles = await spark.kv.get<unknown>('adoption-profiles')
    return safeParseAdoptionProfiles(profiles)
  },

  async submitApplication(application: Omit<AdoptionApplication, '_id' | 'submittedAt' | 'status'>): Promise<AdoptionApplication> {
    const newApplication: AdoptionApplication = {
      ...application,
      _id: `app-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      submittedAt: new Date().toISOString(),
      status: 'pending'
    }

    const applications = safeParseAdoptionApplications(await spark.kv.get<unknown>('adoption-applications'))
    applications.push(newApplication)
    await spark.kv.set('adoption-applications', applications)

    return newApplication
  },

  async getUserApplications(userId: string): Promise<AdoptionApplication[]> {
    const applications = safeParseAdoptionApplications(await spark.kv.get<unknown>('adoption-applications'))
    return applications.filter(app => app.applicantId === userId)
  },

  async getShelters(): Promise<Shelter[]> {
    const shelters = await spark.kv.get<unknown>('adoption-shelters')
    return isShelterArray(shelters) ? shelters : []
  },

  async createAdoptionProfile(profile: Omit<AdoptionProfile, '_id' | 'postedDate'>): Promise<AdoptionProfile> {
    const newProfile: AdoptionProfile = {
      ...profile,
      _id: `adopt-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      postedDate: new Date().toISOString()
    }

    const profiles = await this.getAllProfiles()
    profiles.push(newProfile)
    await spark.kv.set('adoption-profiles', profiles)

    return newProfile
  },

  async updateProfileStatus(profileId: string, status: AdoptionProfile['status']): Promise<void> {
    const profiles = await this.getAllProfiles()
    const index = profiles.findIndex(p => p._id === profileId)
    if (index !== -1) {
      profiles[index].status = status
      await spark.kv.set('adoption-profiles', profiles)
    }
  },

  async getAllApplications(): Promise<AdoptionApplication[]> {
    const applications = await spark.kv.get<unknown>('adoption-applications')
    return safeParseAdoptionApplications(applications)
  },

  async updateApplicationStatus(
    applicationId: string, 
    status: AdoptionApplication['status'],
    reviewNotes?: string
  ): Promise<void> {
    const applications = await this.getAllApplications()
    const index = applications.findIndex(app => app._id === applicationId)
    if (index !== -1) {
      applications[index].status = status
      applications[index].reviewedAt = new Date().toISOString()
      if (reviewNotes) {
        applications[index].reviewNotes = reviewNotes
      }
      await spark.kv.set('adoption-applications', applications)
    }
  },

  async getApplicationsByProfile(profileId: string): Promise<AdoptionApplication[]> {
    const applications = await this.getAllApplications()
    return applications.filter(app => app.adoptionProfileId === profileId)
  }
}
