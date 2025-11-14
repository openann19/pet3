/**
 * Date Group Component
 *
 * Date separator for grouped messages
 */

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { AnimatedView } from '@/hooks/use-animated-style-value';
import { useEntryAnimation } from '@/effects/reanimated/use-entry-animation';
import { useUIConfig } from "@/hooks/use-ui-config";

export interface DateGroupProps {
  date: string;
  delay: number;
}

export function DateGroup({ date, delay }: DateGroupProps): JSX.Element {
    const _uiConfig = useUIConfig();
    const animation = useEntryAnimation({ initialY: -10, delay });

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={animation.variants}
      className="flex items-center justify-center my-4"
    >
      <Badge variant="secondary" className="text-xs px-3 py-1">
        {date}
      </Badge>
    </motion.div>
  );
}
