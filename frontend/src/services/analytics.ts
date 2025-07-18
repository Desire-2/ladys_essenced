'use client';

import { apiClient, AnalyticsAPI } from '../utils/apiClient';
import { isFeatureEnabled } from '../utils/apiUrl';

import { useAuth } from '../contexts/AuthContext';

export interface DashboardAnalytics {
  cycleHealth: {
    score: number;
    trend: 'up' | 'down' | 'stable';
    insights: string[];
  };
  nutritionHealth: {
    score: number;
    trend: 'up' | 'down' | 'stable';
    insights: string[];
  };
  mentalHealth: {
    score: number;
    trend: 'up' | 'down' | 'stable';
    insights: string[];
  };
  overallHealth: {
    score: number;
    trend: 'up' | 'down' | 'stable';
    recommendations: string[];
  };
  chartData: {
    cycleData: Array<{ date: string; cycleDay: number; flow: number; mood: number; }>;
    nutritionData: Array<{ date: string; calories: number; nutrition: number; }>;
    appointmentData: Array<{ month: string; appointments: number; completed: number; }>;
  };
  predictions: {
    nextPeriod: string;
    fertileWindow: { start: string; end: string; };
    ovulationDate: string;
  };
}

export interface HealthProviderAnalytics {
  stats: {
    totalAppointments: number;
    completedAppointments: number;
    pendingAppointments: number;
    cancelledAppointments: number;
    averageRating: number;
    responseTime: string;
  };
  trends: {
    appointmentTrends: Array<{ date: string; total: number; completed: number; }>;
    patientSatisfaction: Array<{ month: string; rating: number; }>;
    busyHours: Array<{ hour: string; count: number; }>;
  };
  insights: {
    peakDays: string[];
    mostCommonIssues: Array<{ issue: string; count: number; }>;
    patientDemographics: Array<{ ageGroup: string; percentage: number; }>;
  };
}

class AnalyticsService {
  private baseUrl: string;
  
  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? (process.env.NEXT_PUBLIC_API_URL || 'https://ladys-essenced.onrender.com')
      : '';
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    
    const response = await fetch(`${this.baseUrl}/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async getDashboardAnalytics(userId?: number): Promise<DashboardAnalytics> {
    try {
      const params = userId ? `?user_id=${userId}` : '';
      const data = await this.makeRequest(`/analytics/dashboard${params}`);
      return data;
    } catch (error) {
      console.error('Failed to fetch dashboard analytics:', error);
      // Return mock data as fallback
      return this.getMockDashboardAnalytics();
    }
  }

  async getHealthProviderAnalytics(providerId?: number): Promise<HealthProviderAnalytics> {
    try {
      const params = providerId ? `?provider_id=${providerId}` : '';
      const data = await this.makeRequest(`/health-provider/analytics${params}`);
      return data;
    } catch (error) {
      console.error('Failed to fetch health provider analytics:', error);
      // Return mock data as fallback
      return this.getMockHealthProviderAnalytics();
    }
  }

  async getHealthInsights(userId?: number) {
    try {
      const params = userId ? `?user_id=${userId}` : '';
      const data = await this.makeRequest(`/analytics/health-insights${params}`);
      return data;
    } catch (error) {
      console.error('Failed to fetch health insights:', error);
      return this.getMockHealthInsights();
    }
  }

  async getCyclePredictions(userId?: number) {
    try {
      const params = userId ? `?user_id=${userId}` : '';
      const data = await this.makeRequest(`/analytics/cycle-predictions${params}`);
      return data;
    } catch (error) {
      console.error('Failed to fetch cycle predictions:', error);
      return this.getMockCyclePredictions();
    }
  }

  async getNotificationInsights() {
    try {
      const data = await this.makeRequest('/notifications/insights');
      return data;
    } catch (error) {
      console.error('Failed to fetch notification insights:', error);
      return { unreadCount: 0, urgentCount: 0, recentNotifications: [] };
    }
  }

  // Mock data methods for fallback
  private getMockDashboardAnalytics(): DashboardAnalytics {
    return {
      cycleHealth: {
        score: 85,
        trend: 'up',
        insights: [
          'Your cycle has been regular for the past 3 months',
          'Average cycle length is within normal range',
          'Period duration is consistent'
        ]
      },
      nutritionHealth: {
        score: 78,
        trend: 'stable',
        insights: [
          'Balanced meal logging detected',
          'Good protein intake during menstrual phase',
          'Consider increasing iron-rich foods'
        ]
      },
      mentalHealth: {
        score: 72,
        trend: 'up',
        insights: [
          'Mood patterns show improvement',
          'Better sleep quality reported',
          'Stress levels appear manageable'
        ]
      },
      overallHealth: {
        score: 78,
        trend: 'up',
        recommendations: [
          'Continue regular cycle tracking',
          'Maintain current nutrition habits',
          'Consider scheduling routine check-up'
        ]
      },
      chartData: {
        cycleData: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          cycleDay: (i % 28) + 1,
          flow: i % 28 < 5 ? Math.random() * 3 + 1 : 0,
          mood: Math.random() * 5 + 3
        })),
        nutritionData: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
          calories: Math.floor(Math.random() * 500) + 1800,
          nutrition: Math.floor(Math.random() * 40) + 60
        })),
        appointmentData: Array.from({ length: 6 }, (_, i) => ({
          month: new Date(Date.now() - (5 - i) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short' }),
          appointments: Math.floor(Math.random() * 10) + 5,
          completed: Math.floor(Math.random() * 8) + 3
        }))
      },
      predictions: {
        nextPeriod: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        fertileWindow: {
          start: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        ovulationDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    };
  }

  private getMockHealthProviderAnalytics(): HealthProviderAnalytics {
    return {
      stats: {
        totalAppointments: 247,
        completedAppointments: 198,
        pendingAppointments: 32,
        cancelledAppointments: 17,
        averageRating: 4.6,
        responseTime: 'Same day'
      },
      trends: {
        appointmentTrends: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          total: Math.floor(Math.random() * 10) + 5,
          completed: Math.floor(Math.random() * 8) + 3
        })),
        patientSatisfaction: Array.from({ length: 6 }, (_, i) => ({
          month: new Date(Date.now() - (5 - i) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short' }),
          rating: Math.random() * 1 + 4
        })),
        busyHours: Array.from({ length: 12 }, (_, i) => ({
          hour: `${i + 8}:00`,
          count: Math.floor(Math.random() * 15) + 5
        }))
      },
      insights: {
        peakDays: ['Monday', 'Wednesday', 'Friday'],
        mostCommonIssues: [
          { issue: 'Routine Check-up', count: 45 },
          { issue: 'Menstrual Issues', count: 32 },
          { issue: 'Pregnancy Consultation', count: 28 },
          { issue: 'Contraception Advice', count: 21 }
        ],
        patientDemographics: [
          { ageGroup: '18-25', percentage: 35 },
          { ageGroup: '26-35', percentage: 40 },
          { ageGroup: '36-45', percentage: 20 },
          { ageGroup: '46+', percentage: 5 }
        ]
      }
    };
  }

  private getMockHealthInsights() {
    return {
      riskFactors: [
        { factor: 'Irregular cycle', risk: 'low', recommendation: 'Continue monitoring' },
        { factor: 'Stress levels', risk: 'medium', recommendation: 'Consider stress management techniques' }
      ],
      healthScore: 82,
      nextActions: [
        'Schedule annual gynecological exam',
        'Track mood patterns for next cycle',
        'Maintain current nutrition habits'
      ]
    };
  }

  private getMockCyclePredictions() {
    return {
      nextPeriod: {
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        confidence: 0.85
      },
      fertileWindow: {
        start: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        confidence: 0.78
      },
      ovulation: {
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        confidence: 0.82
      }
    };
  }
}

export const analyticsService = new AnalyticsService();
