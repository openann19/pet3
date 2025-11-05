import type {
  AdoptionListing,
  AdoptionApplication,
  AdoptionListingFilters,
  CreateAdoptionListingData,
  AdoptionListingStatus,
  AdoptionApplicationStatus
} from '@/lib/adoption-marketplace-types'
import { generateULID } from '@/lib/utils'
import type { UpdateAdoptionListingData } from '@/api/types'

/**
 * Adoption Marketplace API Service
 * Implements REST API endpoints as specified:
 * POST   /adoption/listings            // create (pending_review)
 * GET    /adoption/listings            // query + filters
 * GET    /adoption/listings/:id
 * PUT    /adoption/listings/:id        // owner edit (if active/pending)
 * PATCH  /adoption/listings/:id/status // withdraw/reactivate
 * POST   /adoption/applications        // apply to listing
 * GET    /adoption/applications?mine=1
 * PATCH  /adoption/applications/:id    // owner/admin move status
 */
export class AdoptionAPI {
  private async getListings(): Promise<AdoptionListing[]> {
    return await spark.kv.get<AdoptionListing[]>('adoption-listings') || []
  }

  private async setListings(listings: AdoptionListing[]): Promise<void> {
    await spark.kv.set('adoption-listings', listings)
  }

  private async getApplications(): Promise<AdoptionApplication[]> {
    return await spark.kv.get<AdoptionApplication[]>('adoption-applications') || []
  }

  private async setApplications(applications: AdoptionApplication[]): Promise<void> {
    await spark.kv.set('adoption-applications', applications)
  }

  /**
   * POST /adoption/listings
   * Create a new adoption listing (status: pending_review)
   */
  async createListing(
    data: CreateAdoptionListingData & { ownerId: string; ownerName: string; ownerAvatar?: string }
  ): Promise<AdoptionListing> {
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
      status: 'pending_review', // Requires admin approval
      fee: data.fee || null,
      location: {
        city: data.locationCity,
        country: data.locationCountry,
        lat: data.locationLat,
        lon: data.locationLon,
        privacyRadiusM: 1000 // Default 1km blur
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

  /**
   * GET /adoption/listings
   * Query listings with filters (breed, age, city, radius)
   */
  async queryListings(
    filters?: AdoptionListingFilters & { cursor?: string; limit?: number }
  ): Promise<{ listings: AdoptionListing[]; nextCursor?: string; total: number }> {
    let listings = await this.getListings()
    
    // Filter by status - only show active listings to public
    listings = listings.filter(l => l.status === 'active')

    if (filters) {
      if (filters.species && filters.species.length > 0) {
        listings = listings.filter(l => filters.species!.includes(l.petSpecies))
      }

      if (filters.breed && filters.breed.length > 0) {
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

      // Distance filter (if user location provided)
      if (filters.userLocation && filters.maxDistance) {
        listings = listings.filter(l => {
          if (!l.location.lat || !l.location.lon) return false
          const distance = this.calculateDistance(
            filters.userLocation!.lat,
            filters.userLocation!.lon,
            l.location.lat,
            l.location.lon
          )
          return distance <= filters.maxDistance!
        })
      }

      if (filters.goodWithKids !== undefined) {
        listings = listings.filter(l => l.goodWithKids === filters.goodWithKids)
      }

      if (filters.goodWithPets !== undefined) {
        listings = listings.filter(l => l.goodWithPets === filters.goodWithPets)
      }

      if (filters.goodWithCats !== undefined) {
        listings = listings.filter(l => l.goodWithCats === filters.goodWithCats)
      }

      if (filters.goodWithDogs !== undefined) {
        listings = listings.filter(l => l.goodWithDogs === filters.goodWithDogs)
      }

      if (filters.energyLevel && filters.energyLevel.length > 0) {
        listings = listings.filter(l => filters.energyLevel!.includes(l.energyLevel))
      }

      if (filters.temperament && filters.temperament.length > 0) {
        listings = listings.filter(l =>
          filters.temperament!.some(trait => l.temperament.includes(trait))
        )
      }

      if (filters.vaccinated !== undefined) {
        listings = listings.filter(l => l.vaccinated === filters.vaccinated)
      }

      if (filters.spayedNeutered !== undefined) {
        listings = listings.filter(l => l.spayedNeutered === filters.spayedNeutered)
      }

      if (filters.feeMax !== undefined) {
        listings = listings.filter(l =>
          !l.fee || l.fee.amount <= filters.feeMax!
        )
      }

      if (filters.featured) {
        listings = listings.filter(l => l.featured)
      }

      // Sort
      if (filters.sortBy) {
        switch (filters.sortBy) {
          case 'recent':
            listings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            break
          case 'distance':
            if (filters.userLocation) {
              listings.sort((a, b) => {
                const distA = a.location.lat && a.location.lon
                  ? this.calculateDistance(filters.userLocation!.lat, filters.userLocation!.lon, a.location.lat, a.location.lon)
                  : Infinity
                const distB = b.location.lat && b.location.lon
                  ? this.calculateDistance(filters.userLocation!.lat, filters.userLocation!.lon, b.location.lat, b.location.lon)
                  : Infinity
                return distA - distB
              })
            }
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
        // Default: featured first, then recent
        listings.sort((a, b) => {
          if (a.featured && !b.featured) return -1
          if (!a.featured && b.featured) return 1
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
      }
    } else {
      // Default sort: featured first, then recent
      listings.sort((a, b) => {
        if (a.featured && !b.featured) return -1
        if (!a.featured && b.featured) return 1
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
    }

    const total = listings.length
    const limit = filters?.limit || 20
    const startIndex = filters?.cursor ? parseInt(filters.cursor, 10) : 0
    const endIndex = startIndex + limit
    const paginated = listings.slice(startIndex, endIndex)
    const nextCursor = endIndex < total ? endIndex.toString() : undefined

    return {
      listings: paginated,
      nextCursor,
      total
    }
  }

  /**
   * GET /adoption/listings/:id
   */
  async getListingById(id: string): Promise<AdoptionListing | null> {
    const listings = await this.getListings()
    const listing = listings.find(l => l.id === id)
    
    if (listing) {
      // Increment view count
      await this.incrementViewCount(id)
    }
    
    return listing || null
  }

  /**
   * PUT /adoption/listings/:id
   * Owner edit (if active/pending)
   */
  async updateListing(
    id: string,
    data: UpdateAdoptionListingData,
    ownerId: string
  ): Promise<AdoptionListing> {
    const listings = await this.getListings()
    const listing = listings.find(l => l.id === id)
    
    if (!listing) {
      throw new Error('Listing not found')
    }
    
    // Only owner can edit, and only if active or pending
    if (listing.ownerId !== ownerId) {
      throw new Error('Unauthorized: Only listing owner can edit')
    }

    if (listing.status !== 'active' && listing.status !== 'pending_review') {
      throw new Error('Cannot edit listing: must be active or pending review')
    }

    // Update fields - undefined explicitly means "clear this field"
    if (data.petName !== undefined) listing.petName = data.petName ?? undefined
    if (data.petBreed !== undefined) listing.petBreed = data.petBreed ?? undefined
    if (data.petAge !== undefined) listing.petAge = data.petAge ?? undefined
    if (data.petGender !== undefined) listing.petGender = data.petGender ?? undefined
    if (data.petSize !== undefined) listing.petSize = data.petSize ?? undefined
    if (data.petSpecies !== undefined) listing.petSpecies = data.petSpecies ?? undefined
    if (data.petColor !== undefined) listing.petColor = data.petColor ?? undefined
    if (data.petPhotos !== undefined) listing.petPhotos = data.petPhotos ?? undefined
    if (data.petDescription !== undefined) listing.petDescription = data.petDescription ?? undefined
    if (data.fee !== undefined) listing.fee = data.fee ?? undefined
    if (data.locationCity !== undefined) listing.location.city = data.locationCity ?? undefined
    if (data.locationCountry !== undefined) listing.location.country = data.locationCountry ?? undefined
    if (data.locationLat !== undefined) listing.location.lat = data.locationLat ?? undefined
    if (data.locationLon !== undefined) listing.location.lon = data.locationLon ?? undefined
    if (data.requirements !== undefined) listing.requirements = data.requirements ?? undefined
    if (data.vetDocuments !== undefined) listing.vetDocuments = data.vetDocuments ?? undefined
    if (data.vaccinated !== undefined) listing.vaccinated = data.vaccinated ?? undefined
    if (data.spayedNeutered !== undefined) listing.spayedNeutered = data.spayedNeutered ?? undefined
    if (data.microchipped !== undefined) listing.microchipped = data.microchipped ?? undefined
    if (data.goodWithKids !== undefined) listing.goodWithKids = data.goodWithKids ?? undefined
    if (data.goodWithPets !== undefined) listing.goodWithPets = data.goodWithPets ?? undefined
    if (data.goodWithCats !== undefined) listing.goodWithCats = data.goodWithCats ?? undefined
    if (data.goodWithDogs !== undefined) listing.goodWithDogs = data.goodWithDogs ?? undefined
    if (data.energyLevel !== undefined) listing.energyLevel = data.energyLevel ?? undefined
    if (data.temperament !== undefined) listing.temperament = data.temperament ?? undefined
    if (data.specialNeeds !== undefined) listing.specialNeeds = data.specialNeeds ?? undefined
    if (data.reasonForAdoption !== undefined) listing.reasonForAdoption = data.reasonForAdoption ?? undefined

    listing.updatedAt = new Date().toISOString()
    
    // If was pending and now has changes, reset to pending_review
    if (listing.status === 'active' && listing.approvedAt) {
      // Keep as active, but mark as updated
    }

    await this.setListings(listings)
    
    return listing
  }

  /**
   * PATCH /adoption/listings/:id/status
   * Withdraw/reactivate (owner) or approve/reject (admin)
   */
  async updateListingStatus(
    id: string,
    status: AdoptionListingStatus,
    userId: string,
    isAdmin: boolean = false,
    reason?: string
  ): Promise<AdoptionListing> {
    const listings = await this.getListings()
    const listing = listings.find(l => l.id === id)
    
    if (!listing) {
      throw new Error('Listing not found')
    }

    // Owner can withdraw/reactivate
    if (listing.ownerId === userId) {
      if (status === 'withdrawn' || (status === 'active' && listing.status === 'withdrawn')) {
        listing.status = status
        listing.updatedAt = new Date().toISOString()
        if (status === 'withdrawn') {
          listing.rejectedAt = new Date().toISOString()
          listing.rejectionReason = reason
        }
      } else {
        throw new Error('Owner can only withdraw or reactivate their own listing')
      }
    } else if (isAdmin) {
      // Admin can approve/reject
      if (status === 'active') {
        listing.status = 'active'
        listing.approvedAt = new Date().toISOString()
        listing.approvedBy = userId
        listing.rejectedAt = undefined
        listing.rejectionReason = undefined
      } else if (status === 'withdrawn') {
        listing.status = 'withdrawn'
        listing.rejectedAt = new Date().toISOString()
        listing.rejectionReason = reason
      }
      listing.updatedAt = new Date().toISOString()
    } else {
      throw new Error('Unauthorized')
    }

    await this.setListings(listings)
    
    return listing
  }

  /**
   * POST /adoption/applications
   * Apply to a listing
   */
  async createApplication(
    data: Omit<AdoptionApplication, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'reviewedAt' | 'reviewedBy' | 'reviewNotes' | 'ownerNotes'>
  ): Promise<AdoptionApplication> {
    const applications = await this.getApplications()
    const listings = await this.getListings()
    
    // Verify listing exists and is active
    const listing = listings.find(l => l.id === data.listingId)
    if (!listing) {
      throw new Error('Listing not found')
    }
    if (listing.status !== 'active') {
      throw new Error('Cannot apply to inactive listing')
    }

    // Check if user already applied
    const existingApp = applications.find(
      a => a.listingId === data.listingId && a.applicantId === data.applicantId
    )
    if (existingApp) {
      throw new Error('You have already applied to this listing')
    }
    
    const application: AdoptionApplication = {
      ...data,
      id: generateULID(),
      status: 'submitted',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    applications.push(application)
    await this.setApplications(applications)

    // Increment listing applications count
    const listingForApp = listings.find(l => l.id === data.listingId)
    if (listingForApp) {
      listingForApp.applicationsCount++
      await this.setListings(listings)
    }

    return application
  }

  /**
   * GET /adoption/applications?mine=1
   */
  async queryApplications(userId?: string, listingId?: string): Promise<AdoptionApplication[]> {
    let applications = await this.getApplications()
    
    if (userId) {
      applications = applications.filter(a => a.applicantId === userId)
    }
    
    if (listingId) {
      applications = applications.filter(a => a.listingId === listingId)
    }
    
    return applications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  /**
   * PATCH /adoption/applications/:id
   * Owner/admin move status
   */
  async updateApplicationStatus(
    id: string,
    status: AdoptionApplicationStatus,
    userId: string,
    isAdmin: boolean = false,
    notes?: string
  ): Promise<AdoptionApplication> {
    const applications = await this.getApplications()
    const listings = await this.getListings()
    const application = applications.find(a => a.id === id)
    
    if (!application) {
      throw new Error('Application not found')
    }

    const listing = listings.find(l => l.id === application.listingId)

    // Owner can accept/reject applications to their listings
    if (listing && listing.ownerId === userId) {
      application.status = status
      application.updatedAt = new Date().toISOString()
      application.reviewedAt = new Date().toISOString()
      application.reviewedBy = userId
      application.ownerNotes = notes

      // If accepted, mark listing as adopted
      if (status === 'accepted' && listing) {
        await this.updateListingStatus(listing.id, 'adopted', userId, false)
      }
    } else if (isAdmin) {
      // Admin can update any application
      application.status = status
      application.updatedAt = new Date().toISOString()
      application.reviewedAt = new Date().toISOString()
      application.reviewedBy = userId
      application.reviewNotes = notes
    } else {
      throw new Error('Unauthorized')
    }

    await this.setApplications(applications)
    
    return application
  }

  // Helper methods

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

  private async incrementViewCount(listingId: string): Promise<void> {
    const listings = await this.getListings()
    const listing = listings.find(l => l.id === listingId)
    
    if (listing) {
      listing.viewsCount++
      await this.setListings(listings)
    }
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth radius in km
    const dLat = this.toRad(lat2 - lat1)
    const dLon = this.toRad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180)
  }
}

export const adoptionAPI = new AdoptionAPI()

