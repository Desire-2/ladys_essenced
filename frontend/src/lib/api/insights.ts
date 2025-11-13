import { apiCall, apiPost } from '../../config/api';

export interface InsightData {
  inyunganizi: string;
  icyo_wakora: string[];
  ihumure: string;
  language: string;
  generated_at: string;
}

export interface GenerateInsightRequest {
  user_id?: number;
  language?: 'kinyarwanda' | 'english';
}

export interface GenerateInsightResponse {
  message: string;
  insights: InsightData;
  cached: boolean;
  target_user: {
    id: number;
    name: string;
    user_type: string;
  };
  language: string;
}

export interface SupportedLanguage {
  code: string;
  name: string;
  native_name: string;
}

export interface LanguagesResponse {
  supported_languages: SupportedLanguage[];
  default: string;
}

export const insightsApi = {
  /**
   * Generate AI insights for a user
   */
  generateInsight: async (request: GenerateInsightRequest): Promise<GenerateInsightResponse> => {
    const response = await apiPost('/api/insights/generate', request);
    return response;
  },

  /**
   * Get supported languages for insights
   */
  getSupportedLanguages: async (): Promise<LanguagesResponse> => {
    const response = await apiCall('/api/insights/languages');
    return response;
  },

  /**
   * Check insights service health
   */
  checkHealth: async (): Promise<any> => {
    const response = await apiCall('/api/insights/health');
    return response;
  }
};