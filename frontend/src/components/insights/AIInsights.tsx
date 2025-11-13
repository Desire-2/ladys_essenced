'use client';

import React, { useState, useEffect } from 'react';
import { insightsApi, InsightData } from '../../lib/api/insights';
import { useAuth } from '../../contexts/AuthContext';

interface AIInsightsProps {
  selectedChildId?: number | null;
  userType?: string;
  className?: string;
}

export default function AIInsights({ selectedChildId, userType, className = '' }: AIInsightsProps) {
  const { user } = useAuth();
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [language, setLanguage] = useState<'kinyarwanda' | 'english'>('kinyarwanda');
  const [cached, setCached] = useState(false);

  const generateInsights = async (selectedLanguage?: 'kinyarwanda' | 'english') => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const requestLanguage = selectedLanguage || language;
      const response = await insightsApi.generateInsight({
        user_id: selectedChildId || user.id,
        language: requestLanguage
      });

      setInsights(response.insights);
      setCached(response.cached);
      setLanguage(requestLanguage);
    } catch (err: any) {
      console.error('Failed to generate insights:', err);
      setError(err.message || 'Failed to generate insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (newLanguage: 'kinyarwanda' | 'english') => {
    if (newLanguage !== language) {
      generateInsights(newLanguage);
    }
  };

  const getGreeting = () => {
    if (language === 'kinyarwanda') {
      if (userType === 'parent') {
        return selectedChildId ? "Amakuru y'umwana wawe n'ubuzima bwe" : "Inyunganizi ku buzima bwawe";
      } else if (userType === 'health_provider') {
        return "Inyunganizi zishingiye ku makuru y'abarwayi";
      } else {
        return "Inyunganizi ku buzima bwawe uyu munsi";
      }
    } else {
      if (userType === 'parent') {
        return selectedChildId ? "Your Child's Health Insights" : "Your Health Insights";
      } else if (userType === 'health_provider') {
        return "Patient Health Summary Insights";
      } else {
        return "Your Daily Health Insights";
      }
    }
  };

  const renderInsightContent = () => {
    if (loading) {
      return (
        <div className="text-center py-4">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">
              {language === 'kinyarwanda' ? 'Gukora inyunganizi...' : 'Generating insights...'}
            </span>
          </div>
          <p className="text-muted">
            {language === 'kinyarwanda' 
              ? 'Turimo gukoresha AI kugira ngo tuzane inyunganizi ku buzima bwawe...'
              : 'Using AI to analyze your health data and generate personalized insights...'}
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="alert alert-warning" role="alert">
          <div className="d-flex align-items-center mb-2">
            <i className="fas fa-exclamation-triangle me-2"></i>
            <strong>
              {language === 'kinyarwanda' ? 'Ikibazo cyo gukora inyunganizi' : 'Insight Generation Error'}
            </strong>
          </div>
          <p className="mb-3">{error}</p>
          <button 
            className="btn btn-outline-primary btn-sm"
            onClick={() => generateInsights()}
          >
            <i className="fas fa-redo me-1"></i>
            {language === 'kinyarwanda' ? 'Ongera ugerageze' : 'Try Again'}
          </button>
        </div>
      );
    }

    if (!insights) {
      return (
        <div className="text-center py-4">
          <div className="mb-3">
            <i className="fas fa-brain fa-3x text-muted mb-3"></i>
            <h5 className="text-muted">
              {language === 'kinyarwanda' ? 'Nta nyunganizi iracyahari' : 'No insights yet'}
            </h5>
            <p className="text-muted">
              {language === 'kinyarwanda' 
                ? 'Kanda buto hanyuma tuzane inyunganizi ku buzima bwawe' 
                : 'Click the button below to generate AI-powered health insights'}
            </p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => generateInsights()}
          >
            <i className="fas fa-sparkles me-2"></i>
            {language === 'kinyarwanda' ? 'Kora Inyunganizi' : 'Generate Insights'}
          </button>
        </div>
      );
    }

    return (
      <div className="insight-content">
        {cached && (
          <div className="alert alert-info alert-sm mb-3" role="alert">
            <i className="fas fa-clock me-1"></i>
            <small>
              {language === 'kinyarwanda' 
                ? 'Inyunganizi zirangiye gusuzugurwa (6 amasaha gusa)' 
                : 'Recently generated insights (cached for 6 hours)'}
            </small>
          </div>
        )}

        {/* Main Insight */}
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body">
            <div className="d-flex align-items-center mb-3">
              <div className="insight-icon me-3">
                <i className="fas fa-lightbulb text-warning fa-lg"></i>
              </div>
              <h6 className="card-title mb-0">
                {language === 'kinyarwanda' ? 'Inyunganizi ku Buzima' : 'Health Insight'}
              </h6>
            </div>
            <p className="card-text text-dark">{insights.inyunganizi}</p>
          </div>
        </div>

        {/* Action Items */}
        {insights.icyo_wakora && insights.icyo_wakora.length > 0 && (
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body">
              <div className="d-flex align-items-center mb-3">
                <div className="insight-icon me-3">
                  <i className="fas fa-tasks text-success fa-lg"></i>
                </div>
                <h6 className="card-title mb-0">
                  {language === 'kinyarwanda' ? 'Icyo Wakora' : 'What to Do Next'}
                </h6>
              </div>
              <ul className="list-unstyled mb-0">
                {insights.icyo_wakora.map((action, index) => (
                  <li key={index} className="d-flex align-items-start mb-2">
                    <div className="me-2 mt-1">
                      <i className="fas fa-check-circle text-success"></i>
                    </div>
                    <span className="text-dark">{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Encouragement */}
        {insights.ihumure && (
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body">
              <div className="d-flex align-items-center mb-3">
                <div className="insight-icon me-3">
                  <i className="fas fa-heart text-danger fa-lg"></i>
                </div>
                <h6 className="card-title mb-0">
                  {language === 'kinyarwanda' ? 'Amagambo y\'Ihumure' : 'Words of Encouragement'}
                </h6>
              </div>
              <p className="card-text text-dark font-italic">{insights.ihumure}</p>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <div className="text-center">
          <button 
            className="btn btn-outline-primary btn-sm"
            onClick={() => generateInsights()}
            disabled={loading}
          >
            <i className="fas fa-refresh me-1"></i>
            {language === 'kinyarwanda' ? 'Vugurura Inyunganizi' : 'Refresh Insights'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`ai-insights ${className}`}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">
          <i className="fas fa-brain me-2 text-primary"></i>
          {getGreeting()}
        </h5>
        
        {/* Language Toggle */}
        <div className="btn-group" role="group">
          <input 
            type="radio" 
            className="btn-check" 
            name="language" 
            id="kinyarwanda"
            autoComplete="off"
            checked={language === 'kinyarwanda'}
            onChange={() => handleLanguageChange('kinyarwanda')}
          />
          <label className="btn btn-outline-secondary btn-sm" htmlFor="kinyarwanda">
            Kiny.
          </label>
          
          <input 
            type="radio" 
            className="btn-check" 
            name="language" 
            id="english"
            autoComplete="off"
            checked={language === 'english'}
            onChange={() => handleLanguageChange('english')}
          />
          <label className="btn btn-outline-secondary btn-sm" htmlFor="english">
            Eng.
          </label>
        </div>
      </div>

      {renderInsightContent()}

      {insights && (
        <div className="mt-3">
          <small className="text-muted">
            <i className="fas fa-robot me-1"></i>
            {language === 'kinyarwanda' 
              ? 'Ikorwa na AI • Gishingiye ku makuru yawe y\'ubuzima' 
              : 'AI-Generated • Based on your health data'}
          </small>
        </div>
      )}
    </div>
  );
}