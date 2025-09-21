'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { useState } from 'react';

export default function AnimatedArrow() {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative bg-white p-2 rounded-full w-8 h-8 flex items-center justify-center overflow-hidden"
    >
      <AnimatePresence initial={false}>
        {!hovered ? (
          <motion.div
            key="arrow-normal"
            initial={{ opacity: 0, x: -6, y: 6, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 6, y: -6, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="absolute"
          >
            <ArrowUpRight className="h-4 w-4 text-gray-700" />
          </motion.div>
        ) : (
          <motion.div
            key="arrow-hover"
            initial={{ opacity: 0, x: -6, y: 6, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 6, y: -6, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="absolute"
          >
            <ArrowUpRight className="h-4 w-4 text-gray-700" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
