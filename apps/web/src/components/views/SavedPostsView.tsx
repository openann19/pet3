'use client';

import { PostCard } from '@/components/community/PostCard';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { ScreenErrorBoundary } from '@/components/error/ScreenErrorBoundary';
import { PostDetailView } from '@/components/community/PostDetailView';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { communityService } from '@/lib/community-service';
import type { Post } from '@/lib/community-types';
import { createLogger } from '@/lib/logger';
import { ArrowLeft, BookmarkSimple } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { motionDurations, staggerContainerVariants, staggerItemVariants, getVariantsWithReducedMotion } from '@/effects/framer-motion/variants';
import { PageTransitionWrapper } from '@/components/ui/page-transition-wrapper';
import { useCallback, useEffect, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { toast } from 'sonner';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { getTypographyClasses, getSpacingClassesFromConfig, getColorClasses, focusRing } from '@/lib/design-token-utils';
import { cn } from '@/lib/utils';

const logger = createLogger('SavedPostsView');

interface SavedPostsViewProps {
  onBack?: () => void;
  onAuthorClick?: (authorId: string) => void;
}

function SavedPostsViewContent({ onBack, onAuthorClick }: SavedPostsViewProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const loadSavedPosts = useCallback(async () => {
    setLoading(true);
    try {
      const savedPosts = await communityService.getSavedPosts();
      setPosts(Array.isArray(savedPosts) ? savedPosts : []);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to load saved posts', err);
      toast.error('Failed to load saved posts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSavedPosts();
  }, [loadSavedPosts]);

  const handlePostClick = useCallback((postId: string) => {
    if (postId) {
      setSelectedPostId(postId);
    }
  }, []);

  const handlePostKeyDown = useCallback(
    (e: KeyboardEvent, postId: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handlePostClick(postId);
      }
    },
    [handlePostClick]
  );

  const postsCount = Array.isArray(posts) ? posts.length : 0;

  return (
    <PageTransitionWrapper key="saved-posts-view" direction="up">
      <main aria-label="Saved posts" className="flex flex-col h-full bg-background">
        {/* Header Section */}
        <header className={cn(
          'flex items-center border-b bg-card',
          getSpacingClassesFromConfig({ gap: 'lg', padding: 'lg' })
        )}>
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="rounded-full"
              aria-label="Go back to previous page"
            >
              <ArrowLeft size={20} aria-hidden="true" />
            </Button>
          )}
          <div className={cn('flex items-center flex-1', getSpacingClassesFromConfig({ gap: 'md' }))}>
            <div
              className="w-10 h-10 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center"
              aria-hidden="true"
            >
              <BookmarkSimple size={24} className="text-white" weight="fill" aria-hidden="true" />
            </div>
            <div>
              <h1 className={cn(getTypographyClasses('h1'))}>Saved Posts</h1>
              <p className={cn(getTypographyClasses('bodySmall'), getColorClasses('mutedForeground', 'text'))}>
                {postsCount} {postsCount === 1 ? 'post' : 'posts'} saved
              </p>
            </div>
          </div>
        </header>

        {/* Content */}
        <ScrollArea className="flex-1">
          <section aria-label="Saved posts list" className={getSpacingClassesFromConfig({ padding: 'lg' })}>
            {loading ? (
              <div className="space-y-4" role="status" aria-live="polite" aria-label="Loading saved posts">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="h-64 w-full rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : postsCount === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: prefersReducedMotion ? 0 : motionDurations.smooth,
                  ease: 'easeOut',
                }}
                className={cn(
                  'flex flex-col items-center justify-center text-center',
                  getSpacingClassesFromConfig({ paddingY: '2xl' })
                )}
                role="status"
                aria-live="polite"
                aria-label="Empty state: No saved posts"
              >
                <div
                  className={cn(
                    'w-24 h-24 rounded-full flex items-center justify-center',
                    getColorClasses('muted', 'bg'),
                    getSpacingClassesFromConfig({ marginY: 'lg' })
                  )}
                  aria-hidden="true"
                >
                  <BookmarkSimple size={48} className={getColorClasses('mutedForeground', 'text')} />
                </div>
                <h2 className={cn(
                  getTypographyClasses('h2'),
                  getSpacingClassesFromConfig({ marginY: 'sm' })
                )}>No saved posts yet</h2>
                <p className={cn(
                  getTypographyClasses('bodySmall'),
                  getColorClasses('mutedForeground', 'text'),
                  'max-w-sm'
                )}>
                  Posts you save will appear here for easy access later
                </p>
              </motion.div>
            ) : (
              <motion.ul
                className={getSpacingClassesFromConfig({ spaceY: 'lg' })}
                role="list"
                aria-label="List of saved posts"
                variants={getVariantsWithReducedMotion(staggerContainerVariants, prefersReducedMotion)}
                initial="hidden"
                animate="visible"
              >
                <AnimatePresence mode="popLayout">
                  {Array.isArray(posts) && posts.map((post, index) => {
                    const postId = typeof post?.id === 'string' ? post.id : String(post?.id ?? index);
                    if (!post?.id) return null;

                    const postText = typeof post.text === 'string' ? post.text : '';
                    const postPreview = postText.length > 50 ? postText.substring(0, 50) + '...' : postText || 'Post';

                    return (
                      <motion.li
                        key={postId}
                        variants={getVariantsWithReducedMotion(staggerItemVariants, prefersReducedMotion)}
                        layout
                        transition={{
                          delay: prefersReducedMotion ? 0 : index * 0.05,
                          duration: prefersReducedMotion ? 0 : motionDurations.smooth,
                        }}
                      >
                        <Card
                          clickable
                          onClick={() => handlePostClick(postId)}
                          onKeyDown={(e) => handlePostKeyDown(e, postId)}
                          aria-label={`View saved post: ${postPreview}`}
                          className={cn('transition-all motion-reduce:transition-none', focusRing)}
                        >
                          <ErrorBoundary
                            fallback={
                              <div className={cn(
                                getSpacingClassesFromConfig({ padding: 'lg' }),
                                getTypographyClasses('bodySmall'),
                                getColorClasses('mutedForeground', 'text')
                              )}>
                                Failed to load post. Please refresh.
                              </div>
                            }
                          >
                            <PostCard
                              post={post}
                              {...(onAuthorClick ? { onAuthorClick } : {})}
                              onPostClick={handlePostClick}
                            />
                          </ErrorBoundary>
                        </Card>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </motion.ul>
            )}
          </section>
        </ScrollArea>

        {/* Post Detail Dialog */}
        {selectedPostId && (
          <PostDetailView
            open={Boolean(selectedPostId)}
            onOpenChange={(open) => {
              if (!open) setSelectedPostId(null);
            }}
            postId={selectedPostId}
            {...(onAuthorClick ? { onAuthorClick } : {})}
          />
        )}
      </main>
    </PageTransitionWrapper>
  );
}

export default function SavedPostsView(props: SavedPostsViewProps) {
  return (
    <ScreenErrorBoundary screenName="Saved Posts" enableNavigation={true} enableReporting={false}>
      <SavedPostsViewContent {...props} />
    </ScreenErrorBoundary>
  );
}
