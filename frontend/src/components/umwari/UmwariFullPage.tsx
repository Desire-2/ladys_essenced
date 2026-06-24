import React, { useState, useRef, useEffect } from 'react';
import { useUmwariStore } from '../../stores/umwariStore';
import { useUmwari } from '../../hooks/useUmwari';
import { useUmwariContext } from '../../hooks/useUmwariContext';
import { UmwariMessage } from './UmwariMessage';
import { UmwariTyping } from './UmwariTyping';
import { UmwariLanguagePicker } from './UmwariLanguagePicker';
import { UmwariOnboarding } from './UmwariOnboarding';
import { UmwariInsightsPanel } from './UmwariInsightsPanel';
import { 
  Send, Sparkles, RefreshCw, MessageSquareX, LayoutDashboard, 
  ShieldCheck, Calendar, Heart, Compass, ClipboardList, Info, Trash2, 
  Lightbulb
} from 'lucide-react';
import { Card } from '../ui/Card';

export const UmwariFullPage: React.FC = () => {
  const store = useUmwariStore();
  const { sendMessage } = useUmwari();
  const { data: healthContext, isLoading: contextLoading, refetch } = useUmwariContext();
  const [inputText, setInputText] = useState('');
  const [insightsOpen, setInsightsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const SUGGESTED_PROMPTS = {
    en: [
      "Generate my health insights",
      "Review my recent cycle logs regularity",
      "Are there any nutritional gaps in my diet?",
      "When is my next fertile window?",
    ],
    rw: [
      "Nshyira inyunganizi ku buzima bwanjye",
      "Suzuma kubahiriza inshuro zanjye",
      "Haba hari imirire mibi ngira mu biryo?",
      "Ni ryari igihe cyanjye cyiza cyo gusama?",
    ],
    fr: [
      "Générez mes conseils santé",
      "Vérifiez la régularité de mes cycles récents",
      "Y a-t-il des carences nutritionnelles dans mon alimentation?",
      "Quelle est ma période de fertilité maximale?",
    ],
    sw: [
      "Nipatie maarifa yangu ya afya",
      "Angalia usawa wa mzunguko wangu",
      "Kuna pengo lolote la lishe kwenye chakula changu?",
      "Je, siku zangu za rutuba kuu zinatabiriwa lini?",
    ],
  };

  const prompts = SUGGESTED_PROMPTS[store.language] || SUGGESTED_PROMPTS.rw;

  // Auto-scroll inside chat canvas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [store.messages, store.isStreaming]);

  // Special proactive system trigger if conversation has clean sheet
  useEffect(() => {
    if (store.isConfigured && store.messages.length === 0 && !contextLoading && healthContext) {
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

  // If key is not configured, show gorgeous fullscreen onboarding modal
  if (!store.isConfigured) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md shadow-2xl rounded-3xl overflow-hidden border border-[#7A4F6D]/10">
          <UmwariOnboarding />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[calc(100vh-160px)] font-sans select-none text-ink" id="umwari-full-page">
      
      {/* LEFT COLUMN: Health Summaries & Config panel */}
      <div className="lg:col-span-4 flex flex-col gap-4 select-none">
        
        {/* Companion bio Card */}
        <Card className="p-5 border-l-4 border-l-mauve bg-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Sparkles className="w-24 h-24" />
          </div>
          <div className="flex items-center gap-3.5 mb-4 relative z-10">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#7A4F6D] to-[#C4785A] flex items-center justify-center text-3xl shadow">
              🌸
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-ink uppercase leading-none">Umwari</h2>
              <span className="block text-[11px] text-muted font-bold tracking-wide uppercase mt-1">Reproductive Health AI Guide</span>
            </div>
          </div>
          
          <p className="text-xs text-muted leading-relaxed font-semibold mb-4 border-t border-border/10 pt-3">
            Umwari (&ldquo;the trusted healthcare older sister&rdquo;) listens unconditionally, reads your private local logs safely, and suggests lifestyle balances or verified doctors instantly.
          </p>

          <div className="space-y-3">
            <div className="flex justify-between items-center bg-[#FAF9F6] p-2.5 rounded-xl border border-border/15">
              <span className="text-[10px] font-bold text-muted uppercase">Preferred Conversing Language</span>
              <UmwariLanguagePicker compact />
            </div>

            <div className="flex justify-between items-center bg-[#FAF9F6] p-2.5 rounded-xl border border-border/15 text-xs text-muted font-semibold">
              <span className="text-[10.5px] font-bold text-muted uppercase">Onboarded Security Status</span>
              <span className="flex items-center gap-1 text-emerald-600 font-extrabold uppercase text-[10px]">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> Local Encrypt
              </span>
            </div>
          </div>
        </Card>

        {/* Dynamic Context Metrics Card */}
        <Card className="p-5 bg-white space-y-4">
          <h3 className="text-xs font-black tracking-widest text-[#7A4F6D]/95 uppercase border-b border-border/10 pb-2">
            Loaded Health Context Overview
          </h3>

          {!healthContext && contextLoading ? (
            <div className="py-8 text-center text-xs text-muted font-semibold">
              Syncing latest logging metrics...
            </div>
          ) : healthContext ? (
            <div className="space-y-3">
              
              {/* Cycle Log Indicator */}
              <div className="p-3 bg-[#7A4F6D]/5 border border-[#7A4F6D]/10 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-mauve/10 text-mauve flex items-center justify-center shrink-0">
                  <Heart className="w-4 h-4 fill-mauve/10" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] uppercase font-black text-muted leading-none">Cycle Regularity</span>
                  <span className="block text-xs font-bold text-ink truncate mt-1">
                    {healthContext.cycleSummary?.regularityStatus
                      ? healthContext.cycleSummary.regularityStatus.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                      : healthContext.cycleSummary?.totalLogs && healthContext.cycleSummary.totalLogs > 0
                        ? `${healthContext.cycleSummary.totalLogs} log${healthContext.cycleSummary.totalLogs > 1 ? 's' : ''} recorded`
                        : 'No records added yet'}
                  </span>
                </div>
              </div>

              {/* Fertile window indicator */}
              <div className="p-3 bg-[#C4785A]/5 border border-[#C4785A]/10 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#C4785A]/10 text-[#C4785A] flex items-center justify-center shrink-0">
                  <Compass className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] uppercase font-black text-muted leading-none">Fertile Period Window</span>
                  <span className="block text-xs font-bold text-ink truncate mt-1">
                    {healthContext.cycleSummary?.nextPredictedPeriod ? 'Cycle active' : 'Log a flow to predict'}
                  </span>
                </div>
              </div>

              {/* Clinic checkup booking stats */}
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] uppercase font-black text-muted leading-none">Upcoming Clinic Appointments</span>
                  <span className="block text-xs font-bold text-ink truncate mt-1">
                    {healthContext.appointmentSummary?.upcoming.length || 0} Scheduled cases
                  </span>
                </div>
              </div>

              {healthContext.availableProviders && healthContext.availableProviders.length > 0 && (
                <div className="p-3 bg-sage/5 border border-sage/15 rounded-xl space-y-2">
                  <span className="block text-[10px] uppercase font-black text-muted leading-none">
                    Verified clinicians ({healthContext.availableProviders.length})
                  </span>
                  {healthContext.availableProviders.slice(0, 3).map((p) => (
                    <p key={p.id} className="text-[10px] font-bold text-ink leading-snug">
                      {p.name} — {p.specialization}
                    </p>
                  ))}
                </div>
              )}

              {healthContext.cycleSummary?.anomalyDetected && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 space-y-1">
                  <span className="text-[10px] uppercase font-black block">Medical Flag</span>
                  <p className="text-[10px] font-bold leading-relaxed">
                    Menstrual cycle frequency anomalies flagged. Consider booking a consultation with a verified clinician.
                  </p>
                </div>
              )}

            </div>
          ) : (
            <div className="text-center p-4">
              <span className="text-xs text-muted font-bold">No logs parsed. Begin logging inputs to see overview.</span>
            </div>
          )}

          {/* View Full Insights Button */}
          {healthContext?.aiInsights && (
            <button
              onClick={() => setInsightsOpen(true)}
              type="button"
              className="w-full h-9 bg-gradient-to-r from-[#7A4F6D]/10 to-[#C4785A]/10 hover:from-[#7A4F6D]/20 hover:to-[#C4785A]/20 border border-[#7A4F6D]/20 hover:border-[#7A4F6D]/40 text-[#7A4F6D] text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>View Full Insights</span>
            </button>
          )}

          <button
            onClick={refetch}
            type="button"
            className="w-full h-9 bg-[#FAF9F6] border border-ink/5 hover:border-terracotta/20 text-muted hover:text-ink text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 transition-all mt-3"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync health metrics</span>
          </button>
        </Card>

      </div>

      {/* RIGHT COLUMN: Chat console canvas */}
      <div className="lg:col-span-8 bg-white border border-[#7A4F6D]/15 rounded-3xl flex flex-col justify-between h-[620px] shadow-lg overflow-hidden relative">
        
        {/* Messenger Header navigation bar */}
        <div className="p-4 bg-gradient-to-r from-[#7A4F6D] to-[#C4785A] text-white flex justify-between items-center shadow-md select-none shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🌸</span>
            <div>
              <h3 className="text-xs font-black uppercase tracking-tight leading-none text-white">Interactive Companion Terminal</h3>
              <p className="text-[9px] text-white/70 font-bold leading-none mt-1">Secure Peer-to-Peer local environment</p>
            </div>
          </div>

          <button
            onClick={store.clearChat}
            className="h-8 px-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-black tracking-wide uppercase transition-all flex items-center gap-1"
            title="Reset history"
            type="button"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear conversation</span>
          </button>
        </div>

        {/* Messages scroll zone */}
        <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-[#FAF9F6] via-white to-[#FAF9F6]" id="full-page-messages-list">
          {store.messages.length === 0 && !store.isStreaming ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto space-y-4">
              <div className="w-14 h-14 rounded-full bg-mauve/5 flex items-center justify-center text-mauve">
                <Compass className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-sm font-black text-ink uppercase tracking-wide">Ready to assist reproductive wellness</h4>
                <p className="text-xs text-muted leading-relaxed font-semibold mt-1">
                  Type questions about cramp relief, iron depletion, predicted ovulation dates, and personalized nutrition directly below.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col space-y-4">
              {store.messages
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

        {/* Suggestion prompts row */}
        {store.messages.length <= 1 && (
          <div className="px-4 py-2 border-t border-border/5 bg-[#FAF9F6] flex gap-2 overflow-x-auto select-none grow-0 shrink-0">
            {prompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(prompt)}
                disabled={store.isStreaming}
                className="px-3 py-1.5 bg-white border border-[#7A4F6D]/15 hover:border-[#7A4F6D]/45 text-[10px] font-bold text-ink rounded-full whitespace-nowrap transition-all shadow-sm hover:translate-y-[-1px]"
                type="button"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Text Input controller foot */}
        <form onSubmit={handleSend} className="p-4 border-t border-[#7A4F6D]/5 bg-white flex gap-2.5 items-center select-none grow-0 shrink-0">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={store.isStreaming}
            placeholder={
              store.language === 'rw' 
                ? 'Andika ubutumwa bwawe bwa Umwari unyure hasi hano...' 
                : 'Message Umwari about menstrual symptoms, nutrition, and appointments advice...'
            }
            className="flex-1 px-4 py-3 bg-[#FAF9F6] text-xs font-semibold rounded-2xl border border-border/15 focus:outline-none focus:border-[#7A4F6D] transition-full"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || store.isStreaming}
            className="h-11 px-5 bg-[#7A4F6D] hover:bg-[#68415C] text-white rounded-2xl text-xs font-black uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 shrink-0 shadow-md"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

      </div>
      {/* Insights Modal Panel */}
      {healthContext?.aiInsights && (
        <UmwariInsightsPanel
          aiInsights={healthContext.aiInsights}
          isOpen={insightsOpen}
          onClose={() => setInsightsOpen(false)}
        />
      )}
    </div>
  );
};
export default UmwariFullPage;
