/**
 * Adoption API with strict optional handling
 * 
 * This is an example of how to use OptionalWithUndef<T> in API layer
 * for update/patch operations where undefined explicitly means "clear this field".
 * 
 * @example
 * ```ts
 * // Clear a field explicitly
 * await api.updateListing(id, { fee: undefined }, ownerId)
 * 
 * // Omit a field (don't change it)
 * await api.updateListing(id, { petName: "New Name" }, ownerId)
 * ```
 */

import type { UpdateAdoptionListingData } from '@/api/types'
import type { AdoptionListing } from '@/lib/adoption-marketplace-types'

/**
 * Adoption API with strict optional semantics
 * 
 * Uses OptionalWithUndef<T> to distinguish between:
 * - Omitted property: field is not updated
 * - Undefined value: field is explicitly cleared
 */
export class AdoptionAPIStrict {
  private async getListings(): Promise<AdoptionListing[]> {
    return await spark.kv.get<AdoptionListing[]>('adoption-listings') || []
  }

  private async setListings(listings: AdoptionListing[]): Promise<void> {
    await spark.kv.set('adoption-listings', listings)
  }

  /**
   * PUT /adoption/listings/:id
   * Update listing with strict optional handling
   * 
   * @param id - Listing ID
   * @param data - Update data (undefined values explicitly clear fields)
   * @param ownerId - Owner ID for authorization
   */
  async updateListing(
    id: string,
    data: UpdateAdoptionListingData,
    ownerId: string
  ): Promise<AdoptionListing> {
    const listings = await this.getListings()
    const listing = listings.find(l => l.id === id)

    if (!listing) {
      throw new Error(`Listing ${id} not found`)
    }

    if (listing.ownerId !== ownerId) {
      throw new Error('Unauthorized: Only owner can update listing')
    }

    // Update fields - undefined explicitly means "clear this field"
    if (data.petName !== undefined) {
      listing.petName = data.petName ?? undefined
    }
    if (data.fee !== undefined) {
      listing.fee = data.fee ?? undefined
    }
    if (data.petDescription !== undefined) {
      listing.petDescription = data.petDescription ?? undefined
    }
    // ... other fields

    listing.updatedAt = new Date().toISOString()

    await this.setListings(listings)
    return listing
  }
}

