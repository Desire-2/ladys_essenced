import React from 'react';
import { useUmwariStore } from '../../stores/umwariStore';
import { UMWARI_LANGUAGES, UmwariLanguageCode } from '../../types/umwari';

interface UmwariLanguagePickerProps {
  compact?: boolean;
}

export const UmwariLanguagePicker: React.FC<UmwariLanguagePickerProps> = ({ compact = false }) => {
  const { language, setLanguage } = useUmwariStore();

  if (compact) {
    return (
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as UmwariLanguageCode)}
        className="text-xs bg-transparent font-medium text-ink/80 focus:outline-none cursor-pointer border-none p-1 rounded-md"
        id="umwari-lang-select-compact"
      >
        {UMWARI_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2" id="umwari-lang-grid">
      {UMWARI_LANGUAGES.map((lang) => {
        const isSelected = language === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => setLanguage(lang.code)}
            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
              isSelected
                ? 'bg-terracotta/10 border-terracotta text-ink font-bold shadow-sm'
                : 'bg-white border-ink/10 hover:border-terracotta/40 text-muted/90'
            }`}
          >
            <span className="text-xl shrink-0" role="img" aria-label={lang.label}>
              {lang.flag}
            </span>
            <div className="min-w-0">
              <span className="block text-xs font-bold leading-tight">{lang.nativeName}</span>
              <span className="block text-[10px] text-muted leading-none">{lang.label}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
export default UmwariLanguagePicker;
