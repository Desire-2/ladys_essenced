import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUmwariStore } from '../../stores/umwariStore';
import { useUmwari } from '../../hooks/useUmwari';
import { useUmwariContext } from '../../hooks/useUmwariContext';
import { api } from '../../lib/axios';
import { UmwariMessage } from './UmwariMessage';
import { UmwariTyping } from './UmwariTyping';
import { UmwariOnboarding } from './UmwariOnboarding';
import { UmwariLanguagePicker } from './UmwariLanguagePicker';
import { UmwariInsightsPanel } from './UmwariInsightsPanel';
import { 
  Send, Sparkles, X, Minimize2, Maximize2, RefreshCw, 
  HelpCircle, Settings, MessageSquareX, Compass, Lightbulb 
} from 'lucide-react';

export const UmwariChat: React.FC = () => {
  const store = useUmwariStore();
  const { sendMessage } = useUmwari();
  const { data: healthContext, isLoading: contextLoading } = useUmwariContext();
  const [inputText, setInputText] = useState('');
  const [insightsOpen, setInsightsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const SUGGESTED_PROMPTS = {
    en: [
      "Generate my health insights",
      "How is my cycle looking?",
      "I've been feeling tired lately",
      "When is my next fertile window?",
    ],
    rw: [
      "Nshyira inyunganizi ku buzima bwanjye",
      "Inshuro zanjye zisa bite?",
      "Nakoraga umunaniro benshi vuba",
      "Ni ryari igihe cy'imfura gukurikira?",
    ],
    fr: [
      "Générez mes conseils santé",
      "Comment se présente mon cycle?",
      "Je me sens fatiguée ces derniers temps",
      "Quand est ma prochaine fenêtre fertile?",
    ],
    sw: [
      "Nipatie maarifa yangu ya afya",
      "Mzunguko wangu unaonekana vipi?",
      "Nimekuwa nikihisi uchovu hivi karibuni",
      "Wakati wangu wa rutuba wa pili ni lini?",
    ],
  };

  const prompts = SUGGESTED_PROMPTS[store.language] || SUGGESTED_PROMPTS.rw;

  // Auto scroll messages area to the bottom whenever a new stream chunk arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [store.messages, store.isStreaming]);

  // If backend has GEMINI_API_KEY in .env, skip requiring a browser-stored key
  useEffect(() => {
    if (store.isConfigured) return;
    api.get('/umwari/config-status')
      .then((res) => {
        if (res.data?.configured && res.data?.source === 'env') {
          store.completeOnboarding();
        }
      })
      .catch(() => {});
  }, [store.isConfigured]);

  // Proactive welcome greeting — only once per session (reset when chat is cleared)
  const greetingSentRef = useRef(false);
  useEffect(() => {
    if (store.messages.length === 0) {
      greetingSentRef.current = false; // Reset when chat is cleared
    }
    if (store.isConfigured && store.messages.length === 0 && !contextLoading && healthContext && !greetingSentRef.current) {
      greetingSentRef.current = true;
      sendMessage('__GREETING__');
    }
  }, [store.isConfigured, store.messages.length, contextLoading, healthContext, sendMessage]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || store.isStreaming) return;

    const text = inputText;
    setInputText('');
    await sendMessage(text);
  };

  const handleSuggestionClick = async (prompt: string) => {
    if (store.isStreaming) return;
    await sendMessage(prompt);
  };

  const toFullPage = () => {
    store.setOpen(false);
    window.location.hash = '/dashboard/umwari';
  };

  // If the key is not set up, show onboarding directly in the chat panel overlay
  if (!store.isConfigured) {
    return (
      <div className="fixed bottom-24 right-6 z-50 w-[360px] sm:w-[400px] h-[550px] shadow-2xl rounded-3xl border border-[#7A4F6D]/15 overflow-hidden bg-[#FAF9F6]">
        <UmwariOnboarding onClose={() => store.setOpen(false)} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 30, scale: 0.95 }}
      className="fixed bottom-24 right-6 z-50 w-[92vw] sm:w-[400px] h-[580px] bg-[#FAF9F6] border border-[#7A4F6D]/15 shadow-2xl rounded-3xl flex flex-col justify-between overflow-hidden text-ink font-sans"
      id="umwari-chat-panel"
    >
      
      {/* Active companion header panel */}
      <div className="bg-gradient-to-r from-[#7A4F6D] via-[#8B5D7C] to-[#C4785A] text-white p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-xl shadow-inner select-none animate-pulse">
            🌸
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-black tracking-tight leading-none uppercase">Umwari</h3>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            </div>
            <p className="text-[10px] text-white/70 font-semibold mt-0.5 leading-none">Your Trusted AI Sister</p>
          </div>
        </div>

        {/* Action controllers */}
        <div className="flex items-center gap-2.5">
          <UmwariLanguagePicker compact />

          {healthContext?.aiInsights && (
            <button
              onClick={() => setInsightsOpen(true)}
              className="p-1 hover:bg-white/10 rounded-md transition-all text-white/80 hover:text-white relative"
              title="View Full Health Insights"
              type="button"
            >
              <Lightbulb className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={toFullPage}
            className="p-1 hover:bg-white/10 rounded-md transition-all text-white/80 hover:text-white"
            title="Open Full Page View"
            type="button"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={store.clearChat}
            className="p-1 hover:bg-white/10 rounded-md transition-all text-white/80 hover:text-white"
            title="Reset Conversation"
            type="button"
          >
            <MessageSquareX className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => store.setOpen(false)}
            className="p-1 hover:bg-white/10 rounded-md transition-all text-white/80 hover:text-white"
            type="button"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main flow of messages scroll container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-[#FAF9F6] via-white to-[#FAF9F6]">
        {store.messages.length === 0 && !store.isStreaming ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#7A4F6D]/5 flex items-center justify-center text-[#7A4F6D]">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase text-ink/80 tracking-wide">Ready to talk Reproductive Education</h4>
              <p className="text-[11px] text-muted leading-relaxed font-semibold mt-1">
                Ask cycles info, period hygiene practices, nutrition suggestions, or checkups schedule.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            {store.messages
          // Hide behind-the-scenes greeting trigger if visible
          .filter(m => m.content !== '__GREETING__')
              .map((msg) => (
                <UmwariMessage key={msg.id} message={msg} />
              ))
            }
            {store.isStreaming && store.messages[store.messages.length - 1]?.content === '' && (
              <UmwariTyping />
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts chips drawer */}
      {store.messages.length <= 1 && (
        <div className="px-3.5 py-2 border-t border-[#7A4F6D]/5 bg-[#FAF9F6] flex gap-2 overflow-x-auto select-none no-scrollbar">
          {prompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(prompt)}
              disabled={store.isStreaming}
              className="px-3 py-1.5 bg-white border border-[#7A4F6D]/10 hover:border-[#7A4F6D]/45 text-[10px] font-bold text-ink rounded-full whitespace-nowrap transition-all shadow-sm hover:translate-y-[-1px]"
              type="button"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Floating text input controller block */}
      <form onSubmit={handleSend} className="p-3 border-t border-[#7A4F6D]/5 bg-white flex gap-2 items-center">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            store.language === 'rw' 
              ? 'Andika ubutumwa bwawe hano...' 
              : 'Ask Umwari anything about your health...'
          }
          disabled={store.isStreaming}
          className="flex-1 px-4 py-2.5 bg-[#FAF9F6] text-xs font-semibold rounded-xl border border-border/20 focus:outline-none focus:border-[#7A4F6D] transition-all"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || store.isStreaming}
          className="w-10 h-10 bg-[#7A4F6D] hover:bg-[#68415C] text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-50 shrink-0 shadow-md"
          aria-label="Send Message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Insights Modal Panel */}
      {healthContext?.aiInsights && (
        <UmwariInsightsPanel
          aiInsights={healthContext.aiInsights}
          isOpen={insightsOpen}
          onClose={() => setInsightsOpen(false)}
        />
      )}
    </motion.div>
  );
};
export default UmwariChat;
