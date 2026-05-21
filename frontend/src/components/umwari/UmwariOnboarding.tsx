import React from 'react';
import { motion } from 'framer-motion';
import { useUmwariStore } from '../../stores/umwariStore';
import { UmwariLanguagePicker } from './UmwariLanguagePicker';
import { Sparkles, ChevronRight, X } from 'lucide-react';
import { UmwariLanguageCode } from '../../types/umwari';
import toast from 'react-hot-toast';

interface UmwariOnboardingProps {
  onClose?: () => void;
}

export const UmwariOnboarding: React.FC<UmwariOnboardingProps> = ({ onClose }) => {
  const { completeOnboarding, language } = useUmwariStore();

  // Translate basic onboarding strings dynamically based on selected language
  const translations = {
    rw: {
      hello: "Muraho, Ndi Umwari. 🌸",
      subtitle: "Ndi umujyanama wawe wizewe ku buzima bw'imyororokere n'umuryango. Mvuga ururimi rwawe kandi nkayobora amateka yawe y'ubuzima neza.",
      chooseLang: "Hitamo ururimi rwawe:",
      startChat: "Tangira ikiganiro",
      successMsg: "Mwaramutse! Umwari yiteguye kugufasha."
    },
    en: {
      hello: "Hello, I'm Umwari. 🌸",
      subtitle: "I'm your personal health & reproductive wellness companion. I speak your language and understand your unique journey.",
      chooseLang: "Choose your language:",
      startChat: "Start Chatting with Umwari",
      successMsg: "Welcome! Umwari is configured and ready to chat."
    },
    fr: {
      hello: "Bonjour, je m'appelle Umwari. 🌸",
      subtitle: "Je suis votre compagne personnelle pour la santé reproductive. Je parle votre langue et comprends votre parcours unique.",
      chooseLang: "Choisissez votre langue :",
      startChat: "Commencer à discuter",
      successMsg: "Bienvenue ! Umwari est configurée et prête à discuter."
    },
    sw: {
      hello: "Jambo, mimi ni Umwari. 🌸",
      subtitle: "Mimi ni mwenza wako wa afya ya uzazi na uzima. Nazungumza lugha yako na kuelewa safari yako ya kipekee ya afya.",
      chooseLang: "Chagua lugha yako:",
      startChat: "Anza Kuzungumza na Umwari",
      successMsg: "Karibu! Umwari imesanidiwa na iko tayari kuzungumza."
    }
  };

  const t = translations[language as UmwariLanguageCode] || translations.en;

  const handleStart = () => {
    completeOnboarding();
    toast.success(t.successMsg);
    if (onClose) onClose();
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF9F6] text-ink font-sans p-6 rounded-3xl min-h-[440px] max-h-[560px] justify-between relative overflow-hidden" id="umwari-onboarding-card">
      
      {/* Dynamic Background subtle accents */}
      <div className="absolute top-[-30px] right-[-30px] w-28 h-28 rounded-full bg-[#7A4F6D]/5 blur-xl pointer-events-none" />
      <div className="absolute bottom-[-30px] left-[-30px] w-36 h-36 rounded-full bg-[#C4785A]/5 blur-xl pointer-events-none" />

      {/* Header controls */}
      <div className="flex justify-between items-center w-full relative z-10">
        <div className="flex items-center gap-1 bg-[#7A4F6D]/5 px-3 py-1 rounded-full text-[#7A4F6D] text-[10px] font-bold tracking-wider uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Umwari AI Companion</span>
        </div>
        {onClose && (
          <button 
            onClick={onClose} 
            type="button"
            className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center text-muted shrink-0 transition-all"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex-grow flex flex-col justify-center items-center py-6 text-center space-y-6"
      >
        {/* Illustrated Abstract Figure */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#7A4F6D] to-[#C4785A] flex items-center justify-center text-white relative shadow-lg">
          <span className="text-3xl">🌸</span>
          <span className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center text-[9px] text-white">✓</span>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-ink">{t.hello}</h2>
          <p className="text-xs text-muted leading-relaxed font-semibold max-w-sm px-4">{t.subtitle}</p>
        </div>

        <div className="w-full text-left space-y-2">
          <span className="block text-xs font-bold text-ink/75 ml-1">{t.chooseLang}</span>
          <UmwariLanguagePicker />
        </div>

        <button
          onClick={handleStart}
          type="button"
          className="w-full py-3.5 px-5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-[#7A4F6D] to-[#C4785A] hover:opacity-95 text-white flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
          id="onboarding-save-btn"
        >
          <span>{t.startChat}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </motion.div>

      {/* Trust Signifier */}
      <div className="flex justify-center text-[10px] text-muted/80 font-semibold tracking-wide relative z-10 uppercase">
        ⚡ Secure • Powered by Private Gemini AI
      </div>
    </div>
  );
};

export default UmwariOnboarding;
