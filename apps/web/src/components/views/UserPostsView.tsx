'use client';

import { communityAPI } from '@/api/community-api';
import { PostCard } from '@/components/community/PostCard';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { ScreenErrorBoundary } from '@/components/error/ScreenErrorBoundary';
import { PostDetailView } from '@/components/community/PostDetailView';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import type { Post } from '@/lib/community-types';
import { createLogger } from '@/lib/logger';
import { ArrowLeft, User } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { motionDurations, staggerContainerVariants, staggerItemVariants, getVariantsWithReducedMotion } from '@/effects/framer-motion/variants';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { PageTransitionWrapper } from '@/components/ui/page-transition-wrapper';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { toast } from 'sonner';
import { getTypographyClasses, getSpacingClassesFromConfig, getColorClasses, focusRing } from '@/lib/design-token-utils';
import { cn } from '@/lib/utils';
import { safeArrayAccess } from '@/lib/runtime-safety';

const logger = createLogger('UserPostsView');

interface UserPostsViewProps {
  userId: string;
  userName?: string;
  userAvatar?: string;
  onBack?: () => void;
  onAuthorClick?: (authorId: string) => void;
}

function UserPostsViewContent({
  userId,
  userName,
  userAvatar,
  onBack,
  onAuthorClick,
}: UserPostsViewProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>();
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState(userName ?? 'User');
  const [authorAvatar, setAuthorAvatar] = useState(userAvatar);
  const observerTarget = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const loadPosts = useCallback(
    async (loadMore = false) => {
      if (loadingRef.current) return;

      try {
        loadingRef.current = true;
        setLoading(true);

        const feedFilters: Parameters<typeof communityAPI.queryFeed>[0] = {
          authorId: userId,
          limit: 20,
        };
        if (loadMore && cursor) {
          feedFilters.cursor = cursor;
        }
        const response = await communityAPI.queryFeed(feedFilters);

        // Extract author info from first post if available
        if (Array.isArray(response.posts) && response.posts.length > 0 && !userName) {
          const firstPost = safeArrayAccess(response.posts, 0);
          if (firstPost && typeof firstPost === 'object') {
            if (typeof firstPost.authorName === 'string' && firstPost.authorName.length > 0) {
              setAuthorName(firstPost.authorName);
            }
            if (typeof firstPost.authorAvatar === 'string' && firstPost.authorAvatar.length > 0) {
              setAuthorAvatar(firstPost.authorAvatar);
            }
          }
        }

        if (loadMore) {
          setPosts((currentPosts: Post[] | undefined): Post[] => {
            const current = Array.isArray(currentPosts) ? currentPosts : [];
            const newPosts = Array.isArray(response.posts) ? response.posts : [];
            return [...current, ...newPosts];
          });
        } else {
          setPosts(Array.isArray(response.posts) ? response.posts : []);
        }

        setHasMore(Boolean(response.nextCursor));
        setCursor(response.nextCursor);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to load user posts', err, { userId });
        toast.error('Failed to load posts');
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [userId, userName, cursor]
  );

  useEffect(() => {
    void loadPosts();
  }, [userId, loadPosts]);

  useEffect(() => {
    if (!hasMore || loading || loadingRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = safeArrayAccess(entries, 0);
        if (entry?.isIntersecting) {
          void loadPosts(true);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadPosts]);

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
  const prefersReducedMotion = useReducedMotion();

  const authorNameSafe = typeof authorName === 'string' && authorName.length > 0 ? authorName : 'User';

  return (
    <PageTransitionWrapper key="user-posts-view" direction="up">
      <main aria-label={`${authorNameSafe}'s posts`} className="flex flex-col h-full bg-background">
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
            <Avatar {...(typeof authorAvatar === 'string' && authorAvatar.length > 0 ? { src: authorAvatar } : {})} className="w-10 h-10">
              <User size={20} aria-hidden="true" />
            </Avatar>
            <div>
              <h1 className={cn(getTypographyClasses('h1'))}>{authorNameSafe}'s Posts</h1>
              <p className={cn(getTypographyClasses('bodySmall'), getColorClasses('mutedForeground', 'text'))}>
                {postsCount} {postsCount === 1 ? 'post' : 'posts'}
              </p>
            </div>
          </div>
        </header>

        {/* Content */}
        <ScrollArea className="flex-1">
          <section aria-label="User posts list" className={getSpacingClassesFromConfig({ padding: 'lg' })}>
            {loading && postsCount === 0 ? (
              <div className="space-y-4" role="status" aria-live="polite" aria-label="Loading posts">
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
                aria-label="Empty state: No posts"
              >
                <div
                  className={cn(
                    'w-24 h-24 rounded-full flex items-center justify-center',
                    getColorClasses('muted', 'bg'),
                    getSpacingClassesFromConfig({ marginY: 'lg' })
                  )}
                  aria-hidden="true"
                >
                  <User size={48} className={getColorClasses('mutedForeground', 'text')} />
                </div>
                <h2 className={cn(
                  getTypographyClasses('h2'),
                  getSpacingClassesFromConfig({ marginY: 'sm' })
                )}>No posts yet</h2>
                <p className={cn(
                  getTypographyClasses('bodySmall'),
                  getColorClasses('mutedForeground', 'text'),
                  'max-w-sm'
                )}>
                  {authorNameSafe} hasn't shared any posts yet
                </p>
              </motion.div>
            ) : (
              <motion.ul
                className={getSpacingClassesFromConfig({ spaceY: 'lg' })}
                role="list"
                aria-label={`List of ${authorNameSafe}'s posts`}
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
                          aria-label={`View post: ${postPreview}`}
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
            <div ref={observerTarget} className="h-4" aria-hidden="true" />
            {loading && postsCount > 0 && (
              <div className={cn('flex justify-center', getSpacingClassesFromConfig({ paddingY: 'lg' }))} role="status" aria-live="polite">
                <Skeleton className="h-64 w-full rounded-xl" />
              </div>
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

export default function UserPostsView(props: UserPostsViewProps) {
  return (
    <ScreenErrorBoundary screenName="User Posts" enableNavigation={true} enableReporting={false}>
      <UserPostsViewContent {...props} />
    </ScreenErrorBoundary>
  );
}
