/**
import { motion } from 'framer-motion';
 * Notification Group Item Component
 *
 * Displays a group of similar notifications
 */

import { useState, useEffect, memo } from 'react';
import { motion, useMotionValue, animate, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Archive } from '@phosphor-icons/react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { formatDistanceToNow } from 'date-fns';
import { useHoverLift } from '@/effects/framer-motion/hooks';
import { springConfigs, motionDurations } from '@/effects/framer-motion/variants';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';
import type { NotificationGroup, PremiumNotification, NotificationPreferences } from '../types';
import type { GetIconFunction, GetPriorityStylesFunction } from './NotificationItem';

export interface NotificationGroupItemProps {
  group: NotificationGroup;
  index: number;
  onMarkAsRead: (groupId: string) => void;
  onArchive: (groupId: string) => void;
  onDelete: (groupId: string) => void;
  getIcon: GetIconFunction;
  getPriorityStyles: GetPriorityStylesFunction;
  preferences: NotificationPreferences | null;
}

export function NotificationGroupItem({
  group,
  index: _index,
  onMarkAsRead,
  onArchive,
  onDelete: _onDelete,
  getIcon,
  getPriorityStyles: _getPriorityStyles,
  preferences: _preferences,
}: NotificationGroupItemProps): JSX.Element | null {
  const [isExpanded, setIsExpanded] = useState(false);
  const latestNotification = group.notifications[0];
  if (!latestNotification) return null;

  const reducedMotion = useReducedMotion();
  const itemOpacity = useMotionValue(0);
  const itemTranslateY = useMotionValue(20);
  const groupHover = useHoverLift({
    scale: reducedMotion ? 1 : 1.005,
    translateY: 0,
  });
  const iconHover = useHoverLift({
    scale: reducedMotion ? 1 : 1.05,
    translateY: 0,
  });

  useEffect(() => {
    void animate(itemOpacity, 1, {
      duration: motionDurations.smooth,
      ease: [0.2, 0, 0, 1],
    });
    void animate(itemTranslateY, 0, {
      type: 'spring',
      damping: springConfigs.smooth.damping,
      stiffness: springConfigs.smooth.stiffness,
    });
  }, [itemOpacity, itemTranslateY]);

  const combinedScale = useTransform(
    [groupHover.scale],
    ([h]: number[]) => h ?? 1
  );

  const unreadDotScale = useMotionValue(group.read ? 0 : 1);

  useEffect(() => {
    void animate(unreadDotScale, group.read ? 0 : 1, {
      type: 'spring',
      damping: springConfigs.bouncy.damping,
      stiffness: springConfigs.bouncy.stiffness,
    });
  }, [group.read, unreadDotScale]);

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <motion.div
        style={{
          opacity: itemOpacity,
          y: itemTranslateY,
          scale: combinedScale,
        }}
        onMouseEnter={groupHover.handleEnter}
        onMouseLeave={groupHover.handleLeave}
        className={cn(
          'relative rounded-xl overflow-hidden transition-all bg-card border border-border/50',
          !group.read && 'ring-2 ring-primary/20'
        )}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            <motion.div
              style={{ scale: iconHover.scale }}
              onMouseEnter={iconHover.handleEnter}
              onMouseLeave={iconHover.handleLeave}
              className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 relative"
            >
              {getIcon(group.type as PremiumNotification['type'], latestNotification.priority)}
              {group.notifications.length > 1 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full text-xs font-bold"
                >
                  {group.notifications.length}
                </Badge>
              )}
            </motion.div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm leading-tight">{group.title}</h4>
                  <p className="text-sm mt-1 text-muted-foreground leading-relaxed">
                    {group.summary}
                  </p>
                </div>

                {!group.read && (
                  <motion.div
                    style={{ scale: unreadDotScale }}
                    className="shrink-0 w-2 h-2 rounded-full bg-primary mt-1"
                  >
                    {null}
                  </motion.div>
                )}
              </div>

              <div className="flex items-center justify-between mt-3 gap-2">
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(group.timestamp, { addSuffix: true })}
                </span>

                <div className="flex items-center gap-1">
                  {!group.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => { onMarkAsRead(group.id); }}
                    >
                      <Check size={16} />
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => { onArchive(group.id); }}
                  >
                    <Archive size={16} />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {group.notifications.length > 1 && (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full mt-2 text-xs">
                {isExpanded ? 'Show less' : `Show ${group.notifications.length - 1} more`}
              </Button>
            </CollapsibleTrigger>
          )}
        </div>

        {group.notifications.length > 1 && (
          <CollapsibleContent>
            <div className="border-t border-border/50 px-4 py-2 space-y-2">
              {group.notifications.slice(1).map((notification) => (
                <div key={notification.id} className="text-sm text-muted-foreground">
                  {notification.message}
                </div>
              ))}
            </div>
          </CollapsibleContent>
        )}
      </motion.div>
    </Collapsible>
  );
}

// Memoize to prevent unnecessary re-renders
export const MemoizedNotificationGroupItem = memo(NotificationGroupItem);
