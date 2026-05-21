import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { UmwariMessage as IUmwariMessage } from '../../types/umwari';
import { UmwariDoctorCard } from './UmwariDoctorCard';

interface UmwariMessageProps {
  message: IUmwariMessage;
}

export const UmwariMessage: React.FC<UmwariMessageProps> = ({ message }) => {
  const isUmwari = message.role === 'umwari';

  // Extract recommended doctors from JSON blocks inline safely
  const extractRecommendations = (text: string) => {
    const matches = text.match(/\{"umwari_recommend":\s*(\{[^}]+\})\}/g) ?? [];
    return matches.map((m) => {
      try {
        const cleaned = m.replace(/[\n\r]/g, '');
        const parsed = JSON.parse(cleaned);
        return parsed.umwari_recommend;
      } catch (e) {
        console.error('Error parsing doctor recommendation block:', e);
        return null;
      }
    }).filter(Boolean);
  };

  // Strip JSON blocks out of raw text to avoid rendering raw code blocks to the user
  const cleanContent = (text: string) => {
    return text.replace(/\{"umwari_recommend":\s*\{[^}]+\}\}/g, '').trim();
  };

  const recommendations = isUmwari ? extractRecommendations(message.content) : [];
  const cleanedText = isUmwari ? cleanContent(message.content) : message.content;

  // Format timestamp safely
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${isUmwari ? 'self-start' : 'self-end'}`} id={`message-${message.id}`}>
      
      {/* Speaker Tag */}
      <span className={`text-[9px] font-extrabold uppercase tracking-widest text-[#7A4F6D]/50 mb-1 ml-1 ${!isUmwari ? 'text-right mr-1' : ''}`}>
        {isUmwari ? '🌸 Umwari' : 'You'}
      </span>

      {/* Main text box */}
      <div
        className={`p-3.5 rounded-2xl shadow-sm leading-relaxed text-xs font-semibold ${
          isUmwari
            ? 'bg-white text-ink border-l-[3.5px] border-l-[#7A4F6D] rounded-tl-none border border-border/10'
            : 'bg-gradient-to-br from-[#7A4F6D] to-[#C4785A] text-white rounded-tr-none'
        }`}
      >
        {isUmwari ? (
          <div className="markdown-body text-ink leading-relaxed prose prose-sm space-y-1">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{cleanedText}</ReactMarkdown>
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{cleanedText}</p>
        )}
      </div>

      {/* Recommendations Cards list */}
      {recommendations.length > 0 && (
        <div className="space-y-3 mt-2 w-full">
          {recommendations.map((rec: any, idx: number) => (
            <UmwariDoctorCard
              key={`${rec.providerId}-${idx}`}
              providerId={rec.providerId}
              name={rec.name || 'Clinical Specialist'}
              specialization={rec.specialization || 'Gynecology & reproductive support'}
              clinic={rec.clinic || 'Kigali Health Center'}
              reason={rec.reason}
              urgency={rec.urgency || 'routine'}
            />
          ))}
        </div>
      )}

      {/* Timestamp */}
      <span className={`text-[9px] text-muted/60 mt-1 ml-1 ${!isUmwari ? 'text-right mr-1' : ''}`}>
        {formattedTime}
      </span>
    </div>
  );
};
export default UmwariMessage;
