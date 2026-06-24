import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Lightbulb, Heart, CheckCircle2, X,
  Clock, MessageCircle,
} from 'lucide-react';
import { Card } from '../ui/Card';
import type { UmwariHealthContext } from '../../types/umwari';

/* ───────────────────────────────────────────────
   Props
   ─────────────────────────────────────────────── */

interface UmwariInsightsPanelProps {
  aiInsights: NonNullable<UmwariHealthContext['aiInsights']>;
  isOpen: boolean;
  onClose: () => void;
}

/* ───────────────────────────────────────────────
   Component
   ─────────────────────────────────────────────── */

export const UmwariInsightsPanel: React.FC<UmwariInsightsPanelProps> = ({
  aiInsights,
  isOpen,
  onClose,
}) => {
  const { inyunganizi, icyo_wakora, ihumure, language, generated_at } = aiInsights;
  const isKinyarwanda = language === 'kinyarwanda';

  const formattedDate = generated_at
    ? new Date(generated_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            key="insights-modal-card"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-lg max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="p-0 overflow-hidden bg-white shadow-2xl border border-[#7A4F6D]/20">
              
              {/* ── Header ── */}
              <div className="bg-gradient-to-r from-[#7A4F6D] to-[#C4785A] p-5 text-white relative">
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-all"
                  type="button"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
                    <Sparkles className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wide">
                      {isKinyarwanda ? 'Inyunganizi Ku Buzima' : 'AI Health Insights'}
                    </h3>
                    {formattedDate && (
                      <p className="text-[10px] text-white/70 font-semibold mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formattedDate}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-white/60 font-semibold mt-3 border-t border-white/10 pt-3">
                  {isKinyarwanda
                    ? 'Izi nyunganizi zishingiye ku makuru y\'ubuzima bwawe asuzumwe n\'ubwenge bw\'ikoranabuhanga (AI).'
                    : 'These insights are generated from your health data using AI-powered analysis.'}
                </p>
              </div>

              {/* ── Body ── */}
              <div className="p-5 space-y-5">

                {/* SECTION: Health Analysis */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-full bg-[#7A4F6D]/10 flex items-center justify-center text-[#7A4F6D] shrink-0">
                      <Lightbulb className="w-3.5 h-3.5" />
                    </div>
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-[#7A4F6D]">
                      {isKinyarwanda ? 'Isesengura ry\'Ubuzima' : 'Health Analysis'}
                    </h4>
                  </div>
                  <div className="bg-[#FAF9F6] border border-[#E8DDD4] rounded-xl p-4">
                    <p className="text-[12.5px] text-ink leading-relaxed font-medium">
                      {inyunganizi || (
                        isKinyarwanda
                          ? 'Nta makuru ahagije yo gutanga isesengura.'
                          : 'Insufficient data to provide analysis.'
                      )}
                    </p>
                  </div>
                </div>

                {/* SECTION: Recommendations */}
                {icyo_wakora.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-full bg-[#8FAF8A]/20 flex items-center justify-center text-[#5D7A5D] shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <h4 className="text-[11px] font-black uppercase tracking-widest text-[#5D7A5D]">
                        {isKinyarwanda ? 'Icyo Wakora' : 'What to Do Next'}
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {icyo_wakora.map((rec, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 bg-[#FAF9F6] border border-[#E8DDD4] rounded-xl p-3.5 hover:bg-sage/5 transition-colors"
                        >
                          <div className="w-5 h-5 rounded-full bg-[#8FAF8A]/15 flex items-center justify-center text-[10px] font-extrabold text-[#5D7A5D] shrink-0 mt-0.5">
                            {i + 1}
                          </div>
                          <p className="text-[12px] text-ink font-semibold leading-relaxed">
                            {rec}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SECTION: Encouragement */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-full bg-[#C4785A]/15 flex items-center justify-center text-[#C4785A] shrink-0">
                      <Heart className="w-3.5 h-3.5" />
                    </div>
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-[#C4785A]">
                      {isKinyarwanda ? 'Amagambo y\'Ihumure' : 'Words of Encouragement'}
                    </h4>
                  </div>
                  <div className="bg-gradient-to-br from-[#C4785A]/5 to-[#C4785A]/[0.02] border border-[#C4785A]/15 rounded-xl p-4">
                    <p className="text-[12.5px] text-ink leading-relaxed font-medium italic">
                      &ldquo;{ihumure || (
                        isKinyarwanda
                          ? 'Komeza gukurikirana ubuzima bwawe neza!'
                          : 'Keep taking great care of your health!'
                      )}&rdquo;
                    </p>
                  </div>
                </div>

                {/* ── Footer CTA ── */}
                <div className="pt-2 border-t border-border/10">
                  <button
                    onClick={onClose}
                    className="w-full h-10 bg-gradient-to-r from-[#7A4F6D] to-[#C4785A] hover:from-[#68415C] hover:to-[#B0684A] text-white rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md"
                    type="button"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {isKinyarwanda
                      ? 'Komeza Ukikanye na Umwari'
                      : 'Continue Chatting with Umwari'}
                  </button>
                  <p className="text-[9px] text-muted font-medium text-center mt-2">
                    {isKinyarwanda
                      ? 'Izi nyunganizi zifasha gusa. Reba umuganga w\'inzobere kubijyanye n\'ubuvuzi.'
                      : 'These insights are for informational purposes. Always consult a healthcare provider for medical advice.'}
                  </p>
                </div>

              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UmwariInsightsPanel;
