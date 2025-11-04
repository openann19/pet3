import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus } from '@phosphor-icons/react'

interface CreateAdoptionListingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateAdoptionListingDialog({ open, onOpenChange, onSuccess }: CreateAdoptionListingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus size={24} weight="bold" />
            Create Adoption Listing
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-muted-foreground">
            Listing creation form will be implemented in the next iteration.
          </p>
          <Button onClick={onSuccess}>
            Create Listing (Demo)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
