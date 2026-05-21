import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUmwariStore } from '../../stores/umwariStore';
import { Sparkles, X } from 'lucide-react';

export const UmwariFab: React.FC = () => {
  const { isOpen, isConfigured, toggleOpen } = useUmwariStore();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 select-none" id="umwari-fab-container">
      {/* Tooltip label */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="umwari-fab-label px-3.5 py-1.5 bg-ink text-white font-sans text-[11px] font-extrabold rounded-full shadow-lg"
          >
            {isConfigured ? 'Chat with Umwari • Ganira' : 'Meet Umwari AI Companion'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB button */}
      <motion.button
        onClick={toggleOpen}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="umwari-fab w-14 h-14 rounded-full bg-gradient-to-tr from-mauve to-terracotta text-white border-none cursor-pointer flex items-center justify-center shadow-xl relative"
        aria-label="Open Umwari AI Health Companion"
      >
        {/* Pulse ring animation */}
        <span className="umwari-fab-ring block absolute inset-[-6px] rounded-full border-2 border-mauve/30 animate-pulse pointer-events-none" />

        {isOpen ? (
          <X className="w-5 h-5 shrink-0" strokeWidth={2.5} />
        ) : (
          <Sparkles className="w-5.5 h-5.5 shrink-0 animate-pulse text-white" strokeWidth={2} />
        )}
      </motion.button>
    </div>
  );
};
export default UmwariFab;
