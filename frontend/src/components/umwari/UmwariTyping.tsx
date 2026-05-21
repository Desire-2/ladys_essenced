import React from 'react';
import { motion } from 'framer-motion';

export const UmwariTyping: React.FC = () => {
  const containerVariants = {
    start: {
      transition: {
        staggerChildren: 0.15,
      },
    },
    end: {
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const dotVariants = {
    start: {
      y: '0%',
    },
    end: {
      y: '-80%',
    },
  };

  const dotTransition = {
    duration: 0.5,
    repeat: Infinity,
    repeatType: "reverse" as const,
    ease: "easeInOut" as const,
  };

  return (
    <div className="flex items-center gap-2.5 bg-gradient-to-br from-[#FAF9F6] to-white p-3.5 rounded-2xl rounded-tl-sm w-fit border border-[#7A4F6D]/5 shadow-sm" id="umwari-typing-indicator">
      {/* Tiny flower emblem */}
      <span className="text-[10px] animate-pulse shrink-0">🌸</span>
      
      {/* Floating dot circles */}
      <motion.div
        className="flex gap-1.25 items-center justify-center py-1"
        variants={containerVariants}
        initial="start"
        animate="end"
      >
        <motion.span
          className="w-1.5 h-1.5 rounded-full bg-[#7A4F6D]"
          variants={dotVariants}
          transition={dotTransition}
        />
        <motion.span
          className="w-1.5 h-1.5 rounded-full bg-[#C4785A]"
          variants={dotVariants}
          transition={dotTransition}
        />
        <motion.span
          className="w-1.5 h-1.5 rounded-full bg-mauve/60"
          variants={dotVariants}
          transition={dotTransition}
        />
      </motion.div>
    </div>
  );
};
export default UmwariTyping;
