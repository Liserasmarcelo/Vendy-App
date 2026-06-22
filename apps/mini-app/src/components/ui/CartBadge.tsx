/**
 * CartBadge.tsx
 * Badge de cantidad con pop animation (scale 0 → 1.2 → 1).
 * Usado en ProductCard y Cart icon.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  count: number;
  className?: string;
}

export function CartBadge({ count, className = '' }: Props) {
  return (
    <AnimatePresence mode="popLayout">
      {count > 0 && (
        <motion.span
          key={count}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 15
          }}
          className={`
            absolute -top-2 -right-2
            min-w-[20px] h-5
            bg-vendy-primary text-white
            rounded-full flex items-center justify-center
            text-xs font-bold px-1
            ${className}
          `}
        >
          {count > 99 ? '99+' : count}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
