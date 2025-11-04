import { useState } from 'react'
import { useStorage } from '@/hooks/useStorage'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookmarkSimple,
  Plus,
  X,
  Star,
  Pencil,
  Trash,
  Check,
  FloppyDisk
} from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { SavedSearch } from '@/lib/saved-search-types'
import type { DiscoveryPreferences } from '@/components/DiscoveryFilters'
import { toast } from 'sonner'
import { haptics } from '@/lib/haptics'

interface SavedSearchesManagerProps {
  currentPreferences: DiscoveryPreferences
  onApplySearch: (preferences: DiscoveryPreferences) => void
  onClose: () => void
}

export default function SavedSearchesManager({
  currentPreferences,
  onApplySearch,
  onClose
}: SavedSearchesManagerProps) {
  const [savedSearches, setSavedSearches] = useStorage<SavedSearch[]>('saved-searches', [])
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchName, setSearchName] = useState('')

  const handleSaveCurrentSearch = () => {
    if (!searchName.trim()) {
      toast.error('Please enter a name for this search')
      return
    }

    const newSearch: SavedSearch = {
      id: `search-${Date.now()}`,
      name: searchName.trim(),
      icon: '🔍',
      preferences: currentPreferences,
      isPinned: false,
      useCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    setSavedSearches(current => [...(current || []), newSearch])
    haptics.success()
    toast.success('Search saved!', { description: `"${searchName}" has been saved` })
    setSearchName('')
    setShowSaveForm(false)
  }

  const handleUpdateSearch = (id: string) => {
    if (!searchName.trim()) {
      toast.error('Please enter a name')
      return
    }

    setSavedSearches(current =>
      (current || []).map(s =>
        s.id === id
          ? {
              ...s,
              name: searchName.trim(),
              preferences: currentPreferences,
              updatedAt: new Date().toISOString()
            }
          : s
      )
    )
    haptics.light()
    toast.success('Search updated')
    setEditingId(null)
    setSearchName('')
  }

  const handleApplySearch = (search: SavedSearch) => {
    setSavedSearches(current =>
      (current || []).map(s =>
        s.id === search.id
          ? { ...s, useCount: s.useCount + 1, lastUsed: new Date().toISOString() }
          : s
      )
    )
    onApplySearch(search.preferences)
    haptics.selection()
    toast.success('Search applied', { description: `Filters updated to "${search.name}"` })
    onClose()
  }

  const handleTogglePin = (id: string) => {
    setSavedSearches(current =>
      (current || []).map(s => (s.id === id ? { ...s, isPinned: !s.isPinned } : s))
    )
    haptics.light()
  }

  const handleDeleteSearch = (id: string, name: string) => {
    setSavedSearches(current => (current || []).filter(s => s.id !== id))
    haptics.light()
    toast.info('Search deleted', { description: `"${name}" has been removed` })
  }

  const sortedSearches = [...(savedSearches || [])].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
    return b.useCount - a.useCount
  })

  const getPreferencesSummary = (prefs: DiscoveryPreferences) => {
    const parts: string[] = []
    if (prefs.minAge !== 0 || prefs.maxAge !== 15) {
      parts.push(`${prefs.minAge}-${prefs.maxAge}y`)
    }
    if (prefs.sizes.length < 4) {
      parts.push(`${prefs.sizes.length} sizes`)
    }
    if (prefs.maxDistance !== 50) {
      parts.push(`${prefs.maxDistance}km`)
    }
    if (prefs.personalities.length > 0) {
      parts.push(`${prefs.personalities.length} traits`)
    }
    return parts.length > 0 ? parts.join(' • ') : 'All filters'
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 overflow-auto"
    >
      <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <BookmarkSimple size={24} className="text-white" weight="fill" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Saved Searches</h1>
              <p className="text-sm text-muted-foreground">Quick access to your favorite filters</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={24} />
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Current Filters</CardTitle>
                <CardDescription>Save your current search criteria</CardDescription>
              </div>
              <Button onClick={() => setShowSaveForm(!showSaveForm)} size="sm">
                <Plus size={16} className="mr-2" />
                Save Current
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <AnimatePresence>
              {showSaveForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4"
                >
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label htmlFor="search-name" className="sr-only">
                        Search Name
                      </Label>
                      <Input
                        id="search-name"
                        placeholder="e.g., Active dogs under 5"
                        value={searchName}
                        onChange={e => setSearchName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSaveCurrentSearch()}
                      />
                    </div>
                    <Button onClick={handleSaveCurrentSearch}>
                      <FloppyDisk size={16} className="mr-2" />
                      Save
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="text-sm text-muted-foreground">
              {getPreferencesSummary(currentPreferences)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Saved Searches</CardTitle>
            <CardDescription>
              {sortedSearches.length === 0
                ? 'No saved searches yet'
                : `${sortedSearches.length} saved search${sortedSearches.length !== 1 ? 'es' : ''}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <AnimatePresence>
                {sortedSearches.length === 0 ? (
                  <div className="text-center py-12">
                    <BookmarkSimple size={48} className="mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No saved searches yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Save your current filters to quickly access them later
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sortedSearches.map((search, index) => (
                      <motion.div
                        key={search.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ delay: index * 0.05 }}
                        className="group p-4 rounded-lg border bg-card hover:shadow-md transition-all"
                      >
                        {editingId === search.id ? (
                          <div className="space-y-3">
                            <Input
                              value={searchName}
                              onChange={e => setSearchName(e.target.value)}
                              placeholder="Search name"
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleUpdateSearch(search.id)}
                                className="flex-1"
                              >
                                <Check size={16} className="mr-2" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingId(null)
                                  setSearchName('')
                                }}
                                className="flex-1"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">{search.icon}</span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold">{search.name}</h4>
                                    {search.isPinned && (
                                      <Star size={14} className="text-yellow-500" weight="fill" />
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {getPreferencesSummary(search.preferences)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleTogglePin(search.id)}
                                  className="h-8 w-8"
                                >
                                  <Star
                                    size={16}
                                    weight={search.isPinned ? 'fill' : 'regular'}
                                    className={search.isPinned ? 'text-yellow-500' : ''}
                                  />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingId(search.id)
                                    setSearchName(search.name)
                                  }}
                                  className="h-8 w-8"
                                >
                                  <Pencil size={16} />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleDeleteSearch(search.id, search.name)}
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                >
                                  <Trash size={16} />
                                </Button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="text-xs text-muted-foreground">
                                {search.useCount > 0 && `Used ${search.useCount} time${search.useCount !== 1 ? 's' : ''}`}
                                {search.lastUsed &&
                                  ` • Last: ${new Date(search.lastUsed).toLocaleDateString()}`}
                              </div>
                              <Button size="sm" onClick={() => handleApplySearch(search)}>
                                Apply
                              </Button>
                            </div>
                          </>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
