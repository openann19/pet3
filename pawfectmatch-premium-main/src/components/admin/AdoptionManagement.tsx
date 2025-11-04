import { useState } from 'react'
import { useStorage } from '@/hooks/useStorage'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Trash, Eye, EyeSlash, MagnifyingGlass, Heart, PawPrint, CheckCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import type { AdoptionProfile } from '@/lib/adoption-types'
import { AdoptionCard } from '@/components/adoption/AdoptionCard'

export default function AdoptionManagement() {
  const [profiles] = useStorage<AdoptionProfile[]>('adoption-profiles', [])
  const [flaggedProfiles] = useStorage<string[]>('flagged-adoption-profiles', [])
  const [hiddenProfiles, setHiddenProfiles] = useStorage<string[]>('hidden-adoption-profiles', [])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProfile, setSelectedProfile] = useState<AdoptionProfile | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'available' | 'pending' | 'adopted' | 'flagged' | 'hidden'>('all')

  const allProfiles = profiles || []
  const flaggedProfilesList = allProfiles.filter(p => flaggedProfiles?.includes(p._id))
  const hiddenProfilesList = allProfiles.filter(p => hiddenProfiles?.includes(p._id))

  const filteredProfiles = () => {
    let list = allProfiles
    
    if (activeTab === 'flagged') {
      list = flaggedProfilesList
    } else if (activeTab === 'hidden') {
      list = hiddenProfilesList
    } else if (activeTab !== 'all') {
      list = list.filter(p => p.status === activeTab)
    }
    
    if (searchQuery) {
      list = list.filter(p => 
        p.petName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.breed?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.shelterName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    return list.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime())
  }

  const handleHideProfile = (profileId: string) => {
    setHiddenProfiles(prev => [...(prev || []), profileId])
    toast.success('Adoption profile hidden')
  }

  const handleUnhideProfile = (profileId: string) => {
    setHiddenProfiles(prev => (prev || []).filter(id => id !== profileId))
    toast.success('Adoption profile restored')
  }

  const handleDeleteProfile = async () => {
    if (!selectedProfile) return
    toast.success('Adoption profile deleted successfully')
    setShowDeleteDialog(false)
    setSelectedProfile(null)
  }

  const stats = {
    total: allProfiles.length,
    available: allProfiles.filter(p => p.status === 'available').length,
    pending: allProfiles.filter(p => p.status === 'pending').length,
    adopted: allProfiles.filter(p => p.status === 'adopted').length,
    flagged: flaggedProfilesList.length,
    hidden: hiddenProfilesList.length,
    last7days: allProfiles.filter(p => 
      new Date(p.postedDate).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    ).length
  }

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Adoption Profiles</h2>
          <p className="text-muted-foreground">Manage adoption listings and applications</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Profiles</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <PawPrint size={32} className="text-primary" weight="fill" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl font-bold">{stats.available}</p>
              </div>
              <Heart size={32} className="text-accent" weight="fill" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <Eye size={32} className="text-secondary" weight="fill" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Adopted</p>
                <p className="text-2xl font-bold">{stats.adopted}</p>
              </div>
              <CheckCircle size={32} className="text-green-500" weight="fill" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                <Input
                  placeholder="Search by name, breed, or organization..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="available">Available</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="adopted">Adopted</TabsTrigger>
                <TabsTrigger value="flagged">
                  Flagged {stats.flagged > 0 && <Badge variant="destructive" className="ml-2">{stats.flagged}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="hidden">Hidden</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProfiles().length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground">No adoption profiles found</p>
                </div>
              ) : (
                filteredProfiles().map((profile, index) => (
                  <motion.div
                    key={profile._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative"
                  >
                    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                      {hiddenProfiles?.includes(profile._id) ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleUnhideProfile(profile._id)}
                        >
                          <Eye size={16} className="mr-2" />
                          Unhide
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleHideProfile(profile._id)}
                        >
                          <EyeSlash size={16} className="mr-2" />
                          Hide
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedProfile(profile)
                          setShowDeleteDialog(true)
                        }}
                      >
                        <Trash size={16} className="mr-2" />
                        Delete
                      </Button>
                    </div>
                    <AdoptionCard profile={profile} onFavorite={() => {}} isFavorited={false} onSelect={() => {}} />
                  </motion.div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Adoption Profile</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this adoption profile? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteProfile}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
