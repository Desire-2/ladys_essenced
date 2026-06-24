import { useCallback } from 'react';
import { useUmwariStore } from '../stores/umwariStore';
import { useAuthStore } from '../stores/authStore';
import { buildSystemPrompt, getTimeOfDay } from '../lib/gemini';
import { API_BASE_URL } from '../lib/axios';
import { useUmwariContext } from './useUmwariContext';
import type { UmwariMessage } from '../types/umwari';
import { nanoid } from 'nanoid';

export function useUmwari() {
  const store = useUmwariStore();
  const { data: healthContext, refetch: refetchContext } = useUmwariContext();

  const sendMessage = useCallback(async (userText: string) => {
    // Refresh context on message send to ensure up-to-date data
    // Await the refetch so we always use the freshest data
    const freshContext = await refetchContext();

    // Create a normalized health context from fresh data (fall back to closure, then generic).
    // IMPORTANT: If the fresh fetch succeeds as a whole object but the profile sub-call failed,
    // freshContext.user.firstName will be 'Friend' (fallback in UmwariContextProvider). In that
    // case we MUST prefer healthContext's name (which we know is correct because the greeting
    // useEffect only fires when healthContext is truthy).
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

    // If it's a real user message (not the behind-the-scenes greeting trigger), add it
    let userMsg: UmwariMessage | null = null;
    if (userText !== '__GREETING__') {
      userMsg = {
        id: nanoid(),
        role: 'user',
        content: userText,
        timestamp: new Date().toISOString(),
      };
      store.addMessage(userMsg);
    }

    store.setStreaming(true);

    // Add empty placeholder Umwari message that we will stream text into
    const umwariMsg: UmwariMessage = {
      id: nanoid(),
      role: 'umwari',
      content: '',
      timestamp: new Date().toISOString(),
    };
    store.addMessage(umwariMsg);

    try {
      const systemPrompt = buildSystemPrompt(resolvedContext, store.language);

      // Build safe conversation history for Gemini chat thread
      // Exclude the currently created empty model response and the current user message (will be sent in chat history)
      const history = store.messages
        .filter((m) => m.id !== umwariMsg.id && (userMsg ? m.id !== userMsg.id : m.content !== '__GREETING__'))
        .filter((m) => m.content.trim().length > 0)
        .map((m) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content.trim() }],
        }));

      // Special handling for GREETING prompt — inject user's name and time-of-day so Gemini can use them
      const promptToSend = userText === '__GREETING__'
        ? `Hello! It is currently ${getTimeOfDay()} where I am. Please greet me warmly using my name and the appropriate time of day. My name is ${resolvedContext.user.firstName}. Begin our session with your structured, warm greeting tailored to my data.`
        : userText;

      const contents = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'Mwaramutse! Ndi Umwari, inshuti yawe yizewe ku bujyanama bw\'ubuzima. Mbafashe iki uyu munsi? Hello! I am Umwari, your trusted health companion. How can I help you today?' }] },
        ...history,
        { role: 'user', parts: [{ text: promptToSend }] }
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
          // Fallback only when backend/.env has no GEMINI_API_KEY
          apiKey: store.apiKey?.trim() || undefined,
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
          
          store.updateLastMessage(chunkText);
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
      
      let errorMsg = store.language === 'rw'
        ? 'Mumbabarire, hari ikibazo cyakarere kibaye muri sisitemu. Nyamuneka mugerageze mukanya.'
        : 'Something went wrong while connecting with Gemini. Please try again in a moment.';

      if (isConfigErr) {
        errorMsg = store.language === 'rw'
          ? 'Mumbabarire cyane, serivisi ya AI ya Umwari ntabwo irasozwa gusanwa cyangwa gushyirwaho neza. Nyamuneka reba niba urufunguzo rwa Gemini API key ruri muri Settings > Secrets.'
          : 'I sincerely apologize, but the Umwari AI services are not fully configured yet on the backend server. Please verify the Gemini API key inside Settings > Secrets.';
      }

      store.updateLastMessage(errorMsg);
    } finally {
      store.setStreaming(false);
    }
  }, [store, store.apiKey, healthContext, refetchContext]);

  // Safely parse doctor recommendations JSON anywhere inside the generated response
  const extractDoctorRecommendations = useCallback((content: string) => {
    const matches = content.match(/\{"umwari_recommend":\s*(\{[^}]+\})\}/g) ?? [];
    return matches.map((m) => {
      try {
        const cleanedMatch = m.replace(/[\n\r]/g, '');
        const parsed = JSON.parse(cleanedMatch);
        return parsed.umwari_recommend;
      } catch (e) {
        console.error('Error parsing doctor recommendation block:', e);
        return null;
      }
    }).filter(Boolean);
  }, []);

  // Strips off recommendations JSON to keep text bubble clean and professional
  const cleanContent = useCallback((content: string) => {
    return content.replace(/\{"umwari_recommend":\s*\{[^}]+\}\}/g, '').trim();
  }, []);

  return { sendMessage, extractDoctorRecommendations, cleanContent };
}

