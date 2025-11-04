import { useStorage } from '@/hooks/useStorage'
import type {
  AdoptionListing,
  AdoptionApplication,
  AdoptionListingFilters,
  CreateAdoptionListingData,
  AdoptionListingStatus,
  AdoptionApplicationStatus
} from './adoption-marketplace-types'
import { generateULID } from './utils'

class AdoptionMarketplaceService {
  private async getListings(): Promise<AdoptionListing[]> {
    return await spark.kv.get<AdoptionListing[]>('adoption-marketplace-listings') || []
  }

  private async setListings(listings: AdoptionListing[]): Promise<void> {
    await spark.kv.set('adoption-marketplace-listings', listings)
  }

  private async getApplications(): Promise<AdoptionApplication[]> {
    return await spark.kv.get<AdoptionApplication[]>('adoption-marketplace-applications') || []
  }

  private async setApplications(applications: AdoptionApplication[]): Promise<void> {
    await spark.kv.set('adoption-marketplace-applications', applications)
  }

  async createListing(data: CreateAdoptionListingData & { ownerId: string; ownerName: string; ownerAvatar?: string }): Promise<AdoptionListing> {
    const listings = await this.getListings()
    
    const listing: AdoptionListing = {
      id: generateULID(),
      ownerId: data.ownerId,
      ownerName: data.ownerName,
      ownerAvatar: data.ownerAvatar,
      petId: data.petId || generateULID(),
      petName: data.petName,
      petBreed: data.petBreed,
      petAge: data.petAge,
      petGender: data.petGender,
      petSize: data.petSize,
      petSpecies: data.petSpecies,
      petColor: data.petColor,
      petPhotos: data.petPhotos,
      petDescription: data.petDescription,
      status: 'pending_review',
      fee: data.fee,
      location: {
        city: data.locationCity,
        country: data.locationCountry,
        lat: data.locationLat,
        lon: data.locationLon,
        privacyRadiusM: 1000
      },
      requirements: data.requirements,
      vetDocuments: data.vetDocuments,
      vaccinated: data.vaccinated,
      spayedNeutered: data.spayedNeutered,
      microchipped: data.microchipped,
      goodWithKids: data.goodWithKids,
      goodWithPets: data.goodWithPets,
      goodWithCats: data.goodWithCats,
      goodWithDogs: data.goodWithDogs,
      energyLevel: data.energyLevel,
      temperament: data.temperament,
      specialNeeds: data.specialNeeds,
      reasonForAdoption: data.reasonForAdoption,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewsCount: 0,
      applicationsCount: 0,
      featured: false
    }

    listings.push(listing)
    await this.setListings(listings)
    
    return listing
  }

  async getListingById(id: string): Promise<AdoptionListing | undefined> {
    const listings = await this.getListings()
    return listings.find(l => l.id === id)
  }

  async getActiveListings(filters?: AdoptionListingFilters): Promise<AdoptionListing[]> {
    let listings = await this.getListings()
    
    listings = listings.filter(l => l.status === 'active' || l.status === 'pending_review')

    if (!filters) {
      return listings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    if (filters.species && filters.species.length > 0) {
      listings = listings.filter(l => filters.species!.includes(l.petSpecies))
    }

    if (filters.breed) {
      listings = listings.filter(l =>
        filters.breed!.some(breed => l.petBreed.toLowerCase().includes(breed.toLowerCase()))
      )
    }

    if (filters.ageMin !== undefined) {
      listings = listings.filter(l => l.petAge >= filters.ageMin!)
    }

    if (filters.ageMax !== undefined) {
      listings = listings.filter(l => l.petAge <= filters.ageMax!)
    }

    if (filters.size && filters.size.length > 0) {
      listings = listings.filter(l => filters.size!.includes(l.petSize))
    }

    if (filters.location) {
      listings = listings.filter(l =>
        l.location.city.toLowerCase().includes(filters.location!.toLowerCase()) ||
        l.location.country.toLowerCase().includes(filters.location!.toLowerCase())
      )
    }

    if (filters.goodWithKids) {
      listings = listings.filter(l => l.goodWithKids)
    }

    if (filters.goodWithPets) {
      listings = listings.filter(l => l.goodWithPets)
    }

    if (filters.goodWithCats) {
      listings = listings.filter(l => l.goodWithCats === true)
    }

    if (filters.goodWithDogs) {
      listings = listings.filter(l => l.goodWithDogs === true)
    }

    if (filters.energyLevel && filters.energyLevel.length > 0) {
      listings = listings.filter(l => filters.energyLevel!.includes(l.energyLevel))
    }

    if (filters.temperament && filters.temperament.length > 0) {
      listings = listings.filter(l =>
        filters.temperament!.some(trait => l.temperament.includes(trait))
      )
    }

    if (filters.vaccinated) {
      listings = listings.filter(l => l.vaccinated)
    }

    if (filters.spayedNeutered) {
      listings = listings.filter(l => l.spayedNeutered)
    }

    if (filters.feeMax !== undefined) {
      listings = listings.filter(l =>
        !l.fee || l.fee.amount <= filters.feeMax!
      )
    }

    if (filters.featured) {
      listings = listings.filter(l => l.featured)
    }

    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'recent':
          listings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          break
        case 'age':
          listings.sort((a, b) => a.petAge - b.petAge)
          break
        case 'fee_low':
          listings.sort((a, b) => (a.fee?.amount || 0) - (b.fee?.amount || 0))
          break
        case 'fee_high':
          listings.sort((a, b) => (b.fee?.amount || 0) - (a.fee?.amount || 0))
          break
      }
    } else {
      listings.sort((a, b) => {
        if (a.featured && !b.featured) return -1
        if (!a.featured && b.featured) return 1
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
    }

    return listings
  }

  async getUserListings(userId: string): Promise<AdoptionListing[]> {
    const listings = await this.getListings()
    return listings.filter(l => l.ownerId === userId)
  }

  async updateListingStatus(
    listingId: string,
    status: AdoptionListingStatus,
    adminId?: string,
    reason?: string
  ): Promise<void> {
    const listings = await this.getListings()
    const index = listings.findIndex(l => l.id === listingId)
    
    if (index === -1) {
      throw new Error('Listing not found')
    }

    listings[index].status = status
    listings[index].updatedAt = new Date().toISOString()

    if (status === 'active') {
      listings[index].approvedAt = new Date().toISOString()
      listings[index].approvedBy = adminId
    } else if (status === 'withdrawn') {
      listings[index].rejectedAt = new Date().toISOString()
      listings[index].rejectionReason = reason
    }

    await this.setListings(listings)
  }

  async incrementViewCount(listingId: string): Promise<void> {
    const listings = await this.getListings()
    const index = listings.findIndex(l => l.id === listingId)
    
    if (index !== -1) {
      listings[index].viewsCount++
      await this.setListings(listings)
    }
  }

  async createApplication(data: Omit<AdoptionApplication, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<AdoptionApplication> {
    const applications = await this.getApplications()
    
    const application: AdoptionApplication = {
      ...data,
      id: generateULID(),
      status: 'submitted',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    applications.push(application)
    await this.setApplications(applications)

    const listings = await this.getListings()
    const listingIndex = listings.findIndex(l => l.id === data.listingId)
    if (listingIndex !== -1) {
      listings[listingIndex].applicationsCount++
      await this.setListings(listings)
    }

    return application
  }

  async getApplicationById(id: string): Promise<AdoptionApplication | undefined> {
    const applications = await this.getApplications()
    return applications.find(a => a.id === id)
  }

  async getListingApplications(listingId: string): Promise<AdoptionApplication[]> {
    const applications = await this.getApplications()
    return applications.filter(a => a.listingId === listingId)
  }

  async getUserApplications(userId: string): Promise<AdoptionApplication[]> {
    const applications = await this.getApplications()
    return applications.filter(a => a.applicantId === userId)
  }

  async updateApplicationStatus(
    applicationId: string,
    status: AdoptionApplicationStatus,
    reviewerId?: string,
    notes?: string
  ): Promise<void> {
    const applications = await this.getApplications()
    const index = applications.findIndex(a => a.id === applicationId)
    
    if (index === -1) {
      throw new Error('Application not found')
    }

    applications[index].status = status
    applications[index].updatedAt = new Date().toISOString()
    applications[index].reviewedAt = new Date().toISOString()
    applications[index].reviewedBy = reviewerId
    applications[index].reviewNotes = notes

    await this.setApplications(applications)

    if (status === 'accepted') {
      const listings = await this.getListings()
      const listing = listings.find(l => l.id === applications[index].listingId)
      if (listing) {
        await this.updateListingStatus(listing.id, 'adopted')
      }
    }
  }

  async getPendingListings(): Promise<AdoptionListing[]> {
    const listings = await this.getListings()
    return listings.filter(l => l.status === 'pending_review')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }

  async getPendingApplications(): Promise<AdoptionApplication[]> {
    const applications = await this.getApplications()
    return applications.filter(a => a.status === 'submitted' || a.status === 'under_review')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }
}

export const adoptionMarketplaceService = new AdoptionMarketplaceService()
