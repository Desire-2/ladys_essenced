export interface UmwariMessage {
  id: string;
  role: 'user' | 'umwari';
  content: string;
  timestamp: string; // Serialized Date for store compatibility
  metadata?: {
    type?: 'doctor_recommendation' | 'health_alert' | 'tip' | 'general';
    doctorIds?: number[];          // Provider IDs from backend (for booking CTAs)
    appointmentType?: string;
  };
}

export type UmwariLanguageCode = 'rw' | 'en' | 'fr' | 'sw';

export interface UmwariLanguage {
  code: UmwariLanguageCode;
  label: string;
  nativeName: string;
  flag: string;
}

export const UMWARI_LANGUAGES: readonly UmwariLanguage[] = [
  { code: 'rw', label: 'Kinyarwanda', nativeName: 'Ikinyarwanda', flag: '🇷🇼' },
  { code: 'en', label: 'English',     nativeName: 'English',       flag: '🇬🇧' },
  { code: 'fr', label: 'French',      nativeName: 'Français',      flag: '🇫🇷' },
  { code: 'sw', label: 'Swahili',     nativeName: 'Kiswahili',     flag: '🇹🇿' },
] as const;

export interface UmwariDoctorRecommendation {
  providerId: number;
  name: string;
  specialization: string;
  clinic: string;
  reason: string;                  // Why Umwari is recommending this doctor
  urgency: 'routine' | 'soon' | 'urgent';
}

export interface UmwariHealthContext {
  user: {
    firstName: string;
    age?: number;
    userType: string;
  };
  cycleSummary?: {
    totalLogs: number;
    averageCycleLength?: number;
    averagePeriodLength?: number;
    lastPeriodStart?: string;
    nextPredictedPeriod?: string;
    regularityStatus?: string;
    recentSymptoms: string[];
    anomalyDetected: boolean;
    fertileWindowStart?: string;
    fertileWindowEnd?: string;
    regularityScore?: number;
    confidenceLevel?: string;
    healthInsightsCount?: number;
  };
  wellnessSummary?: {
    dominantMood?: string;
    negativeMoodPercentage?: number;
    highStressPercentage?: number;
    poorSleepPercentage?: number;
    lowEnergyPercentage?: number;
    exerciseConsistency?: number;
    hasWellnessData: boolean;
  };
  mealSummary?: {
    logsThisWeek: number;
    averageCalories?: number;
    nutritionGaps: string[];       // e.g. ['low protein', 'low iron']
    recentMoods: string[];
  };
  appointmentSummary?: {
    upcoming: Array<{ type: string; date: string; providerName?: string }>;
    lastAppointmentDate?: string;
    hasUpcomingCheckup: boolean;
  };
  availableProviders?: Array<{
    id: number;
    name: string;
    specialization: string;
    clinic: string;
    isVerified: boolean;
  }>;
  /** AI-generated health insights (from backend KinyarwandaInsightService) */
  aiInsights?: {
    inyunganizi: string;          // Health insight text
    icyo_wakora: string[];        // Recommendations
    ihumure: string;              // Encouragement
    language: string;
    generated_at: string;
  };
}

export interface UmwariState {
  // Setup
  isConfigured: boolean;
  apiKey: string | null;
  language: UmwariLanguageCode;

  // Chat
  messages: UmwariMessage[];
  isStreaming: boolean;
  isLoadingContext: boolean;
  error: string | null;

  // UI
  isOpen: boolean;

  // Actions
  completeOnboarding: () => void;
  setApiKey: (key: string) => void;
  setLanguage: (lang: UmwariLanguageCode) => void;
  addMessage: (msg: UmwariMessage) => void;
  updateLastMessage: (chunk: string) => void;
  setStreaming: (val: boolean) => void;
  clearChat: () => void;
  toggleOpen: () => void;
  setOpen: (val: boolean) => void;
}
