import { useCallback } from 'react';
import { useUmwariStore } from '../stores/umwariStore';
import { useAuthStore } from '../stores/authStore';
import { buildSystemPrompt, getTimeOfDay } from '../lib/gemini';
import { API_BASE_URL } from '../lib/axios';
import { useUmwariContext } from './useUmwariContext';
import type { UmwariMessage } from '../types/umwari';
import { nanoid } from 'nanoid';

// Cache the last system prompt + context fingerprint so we don't re-send it on every message
let _lastSystemPrompt = '';
let _lastContextFingerprint = '';

function _fingerprint(healthContext: any): string {
  if (!healthContext) return '';
  const cycle = healthContext.cycleSummary;
  return [
    healthContext.user?.firstName || '',
    cycle?.totalLogs ?? 0,
    cycle?.lastPeriodStart || '',
    cycle?.nextPredictedPeriod || '',
    cycle?.regularityStatus || '',
    healthContext.mealSummary?.logsThisWeek ?? 0,
    healthContext.appointmentSummary?.upcoming?.length ?? 0,
  ].join('|');
}

export function useUmwari() {
  const {
    apiKey,
    language,
    addMessage,
    updateLastMessage,
    setStreaming,
  } = useUmwariStore();
  const { data: healthContext, refetch: refetchContext } = useUmwariContext();

  const sendMessage = useCallback(async (userText: string) => {
    // Refresh context on message send to ensure up-to-date data
    const freshContext = await refetchContext();

    // Create a normalized health context from fresh data
    const baseContext = freshContext || healthContext;
    const resolvedContext = baseContext
      ? {
          ...baseContext,
          user: {
            ...baseContext.user,
            firstName: freshContext?.user?.firstName && freshContext.user.firstName !== 'Friend'
              ? freshContext.user.firstName
              : healthContext?.user?.firstName || baseContext.user.firstName || 'Friend',
          },
        }
      : { user: { firstName: 'Friend', userType: 'adolescent' } };

    // Only rebuild the system prompt if the health context has changed
    const fp = _fingerprint(resolvedContext);
    let systemPrompt: string;
    if (fp !== _lastContextFingerprint || !_lastSystemPrompt) {
      systemPrompt = buildSystemPrompt(resolvedContext, language);
      _lastSystemPrompt = systemPrompt;
      _lastContextFingerprint = fp;
    } else {
      systemPrompt = _lastSystemPrompt;
    }
    // If it's a real user message (not the behind-the-scenes greeting trigger), add it
    let userMsg: UmwariMessage | null = null;
    if (userText !== '__GREETING__') {
      userMsg = {
        id: nanoid(),
        role: 'user',
        content: userText,
        timestamp: new Date().toISOString(),
      };
      addMessage(userMsg);
    }

    setStreaming(true);

    // Add empty placeholder Umwari message that we will stream text into
    const umwariMsg: UmwariMessage = {
      id: nanoid(),
      role: 'umwari',
      content: '',
      timestamp: new Date().toISOString(),
    };
    addMessage(umwariMsg);

    try {
      // Build safe conversation history — exclude the current placeholder response
      const currentMessages = useUmwariStore.getState().messages;
      const history = currentMessages
        .filter((m) => m.id !== umwariMsg.id && (userMsg ? m.id !== userMsg.id : m.content !== '__GREETING__'))
        .filter((m) => m.content.trim().length > 0 && m.content !== '__GREETING__')
        .map((m) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content.trim() }],
        }));

      // For greeting — inject user's name and time-of-day so Gemini can use them
      const promptToSend = userText === '__GREETING__'
        ? `Hello! It is currently ${getTimeOfDay()} where I am. Please greet me warmly using my name and the appropriate time of day. My name is ${resolvedContext.user.firstName}. Begin our session with your structured, warm greeting tailored to my data.`
        : userText;

      // Only include the system prompt on the first message of a session
      // For subsequent messages, the model already has the context
      const contents = history.length === 0
        ? [
            { role: 'user', parts: [{ text: `[System Context]\n${systemPrompt}\n\n---\n\n${promptToSend}` }] },
          ]
        : [
            ...history,
            { role: 'user', parts: [{ text: promptToSend }] },
          ];

      const token = useAuthStore.getState().accessToken;

      const response = await fetch(`${API_BASE_URL}/umwari/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          parts: contents,
          modelName: 'gemini-2.5-flash',
          apiKey: apiKey?.trim() || undefined,
          config: {}
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunkText = decoder.decode(value, { stream: true });
          
          if (chunkText.includes('[ServerError:')) {
            const errMatch = chunkText.match(/\[ServerError:\s*([\s\S]*?)\]/);
            throw new Error(errMatch?.[1]?.trim() || 'Gemini request failed');
          }
          
          updateLastMessage(chunkText);
        }
      }

    } catch (err: any) {
      console.error('Umwari Gemini Error:', err);
      
      const msg = String(err?.message ?? '').toLowerCase();
      const isConfigErr =
        msg.includes('configured') ||
        msg.includes('api key') ||
        msg.includes('apikey') ||
        msg.includes('quota exceeded');
      
      let errorMsg = language === 'rw'
        ? 'Mumbabarire, hari ikibazo cyakarere kibaye muri sisitemu. Nyamuneka mugerageze mukanya.'
        : 'Something went wrong while connecting with Gemini. Please try again in a moment.';

      if (isConfigErr) {
        errorMsg = language === 'rw'
          ? 'Mumbabarire cyane, serivisi ya AI ya Umwari ntabwo irasozwa gusanwa cyangwa gushyirwaho neza. Nyamuneka reba niba urufunguzo rwa Gemini API key ruri muri Settings > Secrets.'
          : 'I sincerely apologize, but the Umwari AI services are not fully configured yet on the backend server. Please verify the Gemini API key inside Settings > Secrets.';
      }

      updateLastMessage(errorMsg);
    } finally {
      setStreaming(false);
    }
  }, [healthContext, refetchContext, language, apiKey, addMessage, updateLastMessage, setStreaming]);

  return { sendMessage };
}

