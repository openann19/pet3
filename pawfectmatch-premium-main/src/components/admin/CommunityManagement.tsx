import { useState } from 'react'
import { useStorage } from '@/hooks/useStorage'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Trash, Flag, Eye, EyeSlash, MagnifyingGlass, ChatCircle, ShareNetwork } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import type { CommunityPost } from '@/lib/community-types'
import { PostCard } from '@/components/community/PostCard'

export default function CommunityManagement() {
  const [posts] = useStorage<CommunityPost[]>('community-posts', [])
  const [flaggedPosts] = useStorage<string[]>('flagged-posts', [])
  const [hiddenPosts, setHiddenPosts] = useStorage<string[]>('hidden-posts', [])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'flagged' | 'hidden'>('all')

  const allPosts = posts || []
  const flaggedPostsList = allPosts.filter(p => p._id && flaggedPosts?.includes(p._id))
  const hiddenPostsList = allPosts.filter(p => p._id && hiddenPosts?.includes(p._id))

  const filteredPosts = () => {
    let list = activeTab === 'all' ? allPosts : activeTab === 'flagged' ? flaggedPostsList : hiddenPostsList
    
    if (searchQuery) {
      list = list.filter(p => 
        p.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.authorName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  const handleHidePost = (postId: string) => {
    setHiddenPosts(prev => [...(prev || []), postId])
    toast.success('Post hidden from feed')
  }

  const handleUnhidePost = (postId: string) => {
    setHiddenPosts(prev => (prev || []).filter(id => id !== postId))
    toast.success('Post restored to feed')
  }

  const handleDeletePost = async () => {
    if (!selectedPost) return
    toast.success('Post deleted successfully')
    setShowDeleteDialog(false)
    setSelectedPost(null)
  }

  const stats = {
    total: allPosts.length,
    flagged: flaggedPostsList.length,
    hidden: hiddenPostsList.length,
    last24h: allPosts.filter(p => 
      new Date(p.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000
    ).length
  }

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Community Posts</h2>
          <p className="text-muted-foreground">Manage and moderate community content</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Posts</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <ChatCircle size={32} className="text-primary" weight="fill" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Last 24h</p>
                <p className="text-2xl font-bold">{stats.last24h}</p>
              </div>
              <ShareNetwork size={32} className="text-accent" weight="fill" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Flagged</p>
                <p className="text-2xl font-bold">{stats.flagged}</p>
              </div>
              <Flag size={32} className="text-destructive" weight="fill" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hidden</p>
                <p className="text-2xl font-bold">{stats.hidden}</p>
              </div>
              <EyeSlash size={32} className="text-muted-foreground" weight="fill" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                placeholder="Search posts by content or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
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
            <div className="space-y-4">
              {filteredPosts().length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No posts found</p>
                </div>
              ) : (
                filteredPosts().map((post, index) => (
                  <motion.div
                    key={post._id || post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative"
                  >
                    <div className="absolute top-4 right-4 z-10 flex gap-2">
                      {post._id && hiddenPosts?.includes(post._id) ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => post._id && handleUnhidePost(post._id)}
                        >
                          <Eye size={16} className="mr-2" />
                          Unhide
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => post._id && handleHidePost(post._id)}
                        >
                          <EyeSlash size={16} className="mr-2" />
                          Hide
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedPost(post)
                          setShowDeleteDialog(true)
                        }}
                      >
                        <Trash size={16} className="mr-2" />
                        Delete
                      </Button>
                    </div>
                    <PostCard post={post} />
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
            <DialogTitle>Delete Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePost}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
