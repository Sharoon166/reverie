'use client';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type MotivationRotatorProps = {
  messages: string[];
  interval?: number; // in ms
  className?: string;
  textClassName?: string;
  textStyle?: React.CSSProperties;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.03 },
  },
  exit: {
    opacity: 0,
    transition: { staggerChildren: 0.02, staggerDirection: -1 },
  },
};

const charVariants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(20px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -20, filter: 'blur(20px)' },
};

export default function MotivationRotator({
  messages,
  interval = 5000,
  className = '',
  textClassName = '',
  textStyle = {},
}: MotivationRotatorProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (messages.length === 0) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, interval);

    return () => clearInterval(timer);
  }, [messages, interval]);

  const currentMessage = messages[index] ?? '';

  return (
    <div className={cn(`relative`, className)}>
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          className={cn('absolute flex gap-0', textClassName)}
          style={textStyle}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {currentMessage.split('').map((char, i) => (
            <motion.span key={i} variants={charVariants}>
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
