import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { AdoptionListingFilters } from '@/lib/adoption-marketplace-types'

interface AdoptionFiltersSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: AdoptionListingFilters
  onFiltersChange: (filters: AdoptionListingFilters) => void
}

export function AdoptionFiltersSheet({ open, onOpenChange }: AdoptionFiltersSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">Filter options coming soon</p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
