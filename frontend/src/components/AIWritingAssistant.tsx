'use client';

import { useState, useEffect } from 'react';
import { apiGet } from '../config/api';

interface AIWritingAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onSuggestionApply: (suggestion: string) => void;
  currentContent: string;
  contentType: string;
}

interface Suggestion {
  title: string;
  description: string;
  category: string;
  avg_views: number;
  trending_score: number;
}

interface AnalyticsData {
  performance: {
    total_views: number;
    total_likes: number;
    avg_rating: number;
  };
  trends: {
    views_last_30_days: number;
    engagement_rate: number;
    top_performing_category: string;
  };
  recommendations: string[];
}

interface ToneAnalysis {
  current: string;
  suggestions: string[];
  score: number;
}

export default function AIWritingAssistant({ 
  isOpen, 
  onClose, 
  onSuggestionApply, 
  currentContent,
  contentType 
}: AIWritingAssistantProps) {
  const [activeTab, setActiveTab] = useState('suggestions');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [toneAnalysis, setToneAnalysis] = useState<ToneAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [writingStyle, setWritingStyle] = useState('professional');
  const [targetAudience, setTargetAudience] = useState('general');
  const [contentGoal, setContentGoal] = useState('inform');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchSuggestions();
      analyzeTone();
    }
  }, [isOpen]);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiGet('/api/content-writer/suggestions');
      if (response.status === 'success' && response.suggestions) {
        setSuggestions(response.suggestions);
      } else {
        throw new Error('Failed to load suggestions');
      }
    } catch (error: any) {
      console.error('Error fetching suggestions:', error);
      setError(error.message || 'Failed to load AI suggestions. Please try again.');
      // Fallback to local suggestions
      setSuggestions([
        {
          title: 'Women\'s Health Nutrition Guide',
          description: 'Create comprehensive content about nutrition for women\'s reproductive health',
          category: 'Health & Nutrition',
          avg_views: 850,
          trending_score: 7.5
        },
        {
          title: 'Managing Menstrual Symptoms Naturally',
          description: 'Share tips and remedies for natural menstrual symptom management',
          category: 'Wellness',
          avg_views: 920,
          trending_score: 8.0
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiGet('/api/content-writer/analytics');
      if (response.status === 'success' && response.analytics) {
        setAnalytics(response.analytics);
      }
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      setError(error.message || 'Failed to load analytics data.');
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeTone = async () => {
    try {
      // Mock tone analysis
      const mockToneAnalysis: ToneAnalysis = {
        current: 'professional',
        suggestions: ['conversational', 'friendly', 'authoritative'],
        score: 0.78
      };
      setToneAnalysis(mockToneAnalysis);
    } catch (error) {
      console.error('Error analyzing tone:', error);
    }
  };

  const generateContent = async () => {
    if (!prompt.trim()) {
      setError('Please enter a content prompt');
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    try {
      // For now, generate structured content based on prompt
      const generatedContent = `# ${prompt}\n\n## Introduction\n\nThis content is tailored for ${targetAudience} with a ${writingStyle} writing style, aiming to ${contentGoal}.\n\n## Key Points\n\n- Comprehensive information about the topic\n- Evidence-based recommendations\n- Practical application tips\n\n## Conclusion\n\nSummary and call-to-action for readers.\n\n---\n*Generated with AI Writing Assistant*`;
      
      onSuggestionApply(generatedContent);
      setSuccessMessage('Content generated successfully!');
      setPrompt('');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('Error generating content:', error);
      setError(error.message || 'Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const applySuggestion = (suggestion: Suggestion) => {
    const formattedContent = `# ${suggestion.title}\n\n${suggestion.description}\n\n**Category:** ${suggestion.category}\n**Trending Score:** ${suggestion.trending_score.toFixed(1)}/10\n\nThis topic has an average of ${suggestion.avg_views} views and is currently trending. Consider creating comprehensive content around this theme.`;
    
    onSuggestionApply(formattedContent);
    setSuccessMessage('Suggestion applied!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const showAnalytics = () => {
    setActiveTab('optimize');
    if (!analytics) {
      fetchAnalytics();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-50 to-pink-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-3xl">✨</span>
              AI Writing Assistant
            </h2>
            <p className="text-sm text-gray-600 mt-1">Get smart suggestions and analytics for your content</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-200 transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800">
            <span className="text-xl">✓</span>
            <span>{successMessage}</span>
          </div>
        )}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
            <span className="text-xl">⚠</span>
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800">×</button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b bg-gray-50 overflow-x-auto">
          {[
            { id: 'suggestions', label: 'Smart Suggestions', icon: '💡' },
            { id: 'generate', label: 'Generate Content', icon: '✍️' },
            { id: 'tone', label: 'Tone Analysis', icon: '🎭' },
            { id: 'optimize', label: 'Analytics', icon: '📊' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'optimize' && !analytics) {
                  fetchAnalytics();
                }
              }}
              className={`px-6 py-3 font-medium whitespace-nowrap flex items-center gap-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-purple-500 text-purple-600 bg-white'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'suggestions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Trending Content Ideas</h3>
                  <p className="text-sm text-gray-600">AI-powered suggestions based on trends and analytics</p>
                </div>
                <button
                  onClick={fetchSuggestions}
                  disabled={isLoading}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin">⟳</span>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <span>🔄</span>
                      <span>Refresh</span>
                    </>
                  )}
                </button>
              </div>
              
              {isLoading ? (
                // Skeleton loader
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border rounded-lg p-4 animate-pulse">
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6 mb-3"></div>
                      <div className="flex gap-2">
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {suggestions.map((suggestion, index) => {
                    // Calculate trending indicator color
                    const getTrendingColor = (score: number) => {
                      if (score >= 8) return 'text-red-600 bg-red-50';
                      if (score >= 6) return 'text-orange-600 bg-orange-50';
                      return 'text-yellow-600 bg-yellow-50';
                    };
                    
                    return (
                      <div 
                        key={index} 
                        className="group border border-gray-200 rounded-xl p-5 hover:shadow-xl hover:border-purple-400 transition-all duration-300 bg-white relative overflow-hidden"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        {/* Trending Badge - Top Right */}
                        {suggestion.trending_score >= 7.5 && (
                          <div className="absolute top-3 right-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${getTrendingColor(suggestion.trending_score)}`}>
                              <span className="animate-pulse">🔥</span>
                              <span>HOT</span>
                            </span>
                          </div>
                        )}
                        
                        {/* Content */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1 pr-16">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-2xl">📝</span>
                              <h4 className="font-bold text-gray-900 text-lg group-hover:text-purple-700 transition-colors">
                                {suggestion.title}
                              </h4>
                            </div>
                            <p className="text-gray-600 text-sm leading-relaxed mb-3">
                              {suggestion.description}
                            </p>
                          </div>
                        </div>
                        
                        {/* Metrics and Action */}
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-4 flex-wrap">
                            {/* Category Badge */}
                            <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 font-semibold text-xs shadow-sm">
                              {suggestion.category}
                            </span>
                            
                            {/* Views Metric */}
                            <div className="flex items-center gap-1.5 text-sm">
                              <span className="text-lg">👁️</span>
                              <span className="font-semibold text-gray-700">
                                {suggestion.avg_views.toLocaleString()}
                              </span>
                              <span className="text-gray-500 text-xs">views</span>
                            </div>
                            
                            {/* Trending Score */}
                            <div className={`flex items-center gap-1.5 text-sm px-2 py-1 rounded-lg ${getTrendingColor(suggestion.trending_score)}`}>
                              <span className="text-base">📈</span>
                              <span className="font-bold">{suggestion.trending_score.toFixed(1)}</span>
                              <span className="text-xs opacity-75">/10</span>
                            </div>
                          </div>
                          
                          {/* Action Button */}
                          <button
                            onClick={() => applySuggestion(suggestion)}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-5 py-2.5 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-semibold text-sm flex items-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105"
                          >
                            <span className="text-base">✨</span>
                            <span>Use This</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {suggestions.length === 0 && !isLoading && (
                    <div className="text-center py-16 text-gray-500">
                      <div className="inline-block animate-bounce mb-4">
                        <span className="text-6xl">💡</span>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">No Suggestions Yet</h3>
                      <p className="text-sm text-gray-500 mb-6">Click refresh to discover trending content ideas</p>
                      <button
                        onClick={fetchSuggestions}
                        className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center gap-2 mx-auto shadow-md"
                      >
                        <span>🔄</span>
                        <span>Load Suggestions</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'generate' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <span>✍️</span>
                  <span>Generate Content</span>
                </h3>
                <p className="text-sm text-gray-600 mt-1">Create AI-powered content tailored to your needs</p>
              </div>
              
              {/* Content Generation Settings */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-5 border-2 border-blue-200 shadow-sm">
                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span>⚙️</span>
                  <span>Content Settings</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <span>🎨</span>
                      <span>Writing Style</span>
                    </label>
                    <select
                      value={writingStyle}
                      onChange={(e) => setWritingStyle(e.target.value)}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 bg-white hover:border-purple-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all font-medium text-gray-700"
                    >
                      <option value="professional">👔 Professional</option>
                      <option value="casual">😊 Casual</option>
                      <option value="academic">🎓 Academic</option>
                      <option value="creative">🎨 Creative</option>
                      <option value="technical">⚙️ Technical</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <span>👥</span>
                      <span>Target Audience</span>
                    </label>
                    <select
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 bg-white hover:border-purple-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all font-medium text-gray-700"
                    >
                      <option value="general">🌍 General Public</option>
                      <option value="experts">🎯 Industry Experts</option>
                      <option value="beginners">🌱 Beginners</option>
                      <option value="students">📚 Students</option>
                      <option value="professionals">💼 Professionals</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <span>🎯</span>
                      <span>Content Goal</span>
                    </label>
                    <select
                      value={contentGoal}
                      onChange={(e) => setContentGoal(e.target.value)}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 bg-white hover:border-purple-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all font-medium text-gray-700"
                    >
                      <option value="inform">📢 Inform</option>
                      <option value="persuade">🎤 Persuade</option>
                      <option value="entertain">🎭 Entertain</option>
                      <option value="educate">📖 Educate</option>
                      <option value="inspire">✨ Inspire</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Prompt Input */}
              <div className="bg-white rounded-xl p-5 border-2 border-gray-200 shadow-sm hover:border-purple-300 transition-colors">
                <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span>💭</span>
                  <span>Content Prompt</span>
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="✨ Describe what you want to write about...\n\nExample: 'Write an article about women's health nutrition for adolescents, focusing on iron-rich foods and their benefits during menstruation.'"
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 h-40 resize-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all text-gray-700 leading-relaxed"
                />
                <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <span>💡</span>
                    <span>Tip: Be specific for better results</span>
                  </span>
                  <span className={`font-medium ${prompt.length > 20 ? 'text-green-600' : 'text-gray-400'}`}>
                    {prompt.length} characters
                  </span>
                </div>
              </div>

              {/* Settings Preview Card */}
              {prompt.trim() && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                  <h5 className="font-semibold text-purple-900 mb-2 flex items-center gap-2 text-sm">
                    <span>📋</span>
                    <span>Generation Preview</span>
                  </h5>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="bg-white px-3 py-1.5 rounded-full border border-purple-200 font-medium">
                      Style: <strong className="text-purple-700">{writingStyle}</strong>
                    </span>
                    <span className="bg-white px-3 py-1.5 rounded-full border border-purple-200 font-medium">
                      Audience: <strong className="text-purple-700">{targetAudience}</strong>
                    </span>
                    <span className="bg-white px-3 py-1.5 rounded-full border border-purple-200 font-medium">
                      Goal: <strong className="text-purple-700">{contentGoal}</strong>
                    </span>
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={generateContent}
                disabled={isGenerating || !prompt.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none"
              >
                {isGenerating ? (
                  <>
                    <span className="animate-spin text-2xl">⚙️</span>
                    <span>Generating Amazing Content...</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">✨</span>
                    <span>Generate Content</span>
                    <span className="text-2xl">🚀</span>
                  </>
                )}
              </button>

              {/* Quick Tips */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <h5 className="font-semibold text-blue-900 mb-3 flex items-center gap-2 text-sm">
                  <span>💡</span>
                  <span>Quick Tips for Better Results</span>
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-blue-800">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 flex-shrink-0">✓</span>
                    <span>Be specific about your topic and goals</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 flex-shrink-0">✓</span>
                    <span>Include target keywords if needed</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 flex-shrink-0">✓</span>
                    <span>Mention desired length or format</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 flex-shrink-0">✓</span>
                    <span>Specify any tone preferences</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tone' && (
            <div className="space-y-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <span>🎭</span>
                  <span>Tone Analysis</span>
                </h3>
                <p className="text-sm text-gray-600 mt-1">Analyze and adjust your content's tone for better engagement</p>
              </div>
              
              {toneAnalysis ? (
                <div className="space-y-6">
                  {/* Current Tone Card */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200 shadow-sm">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <span>📊</span>
                      <span>Current Tone</span>
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="capitalize font-bold text-lg text-purple-700">
                          {toneAnalysis.current}
                        </span>
                        <span className="text-2xl font-bold text-purple-600">
                          {Math.round(toneAnalysis.score * 100)}%
                        </span>
                      </div>
                      <div className="relative bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${toneAnalysis.score * 100}%` }}
                        >
                          <div className="absolute inset-0 bg-white opacity-30 animate-pulse"></div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        {toneAnalysis.score >= 0.8 ? '✅ Excellent tone match!' : 
                         toneAnalysis.score >= 0.6 ? '👍 Good tone, consider minor adjustments' : 
                         '⚠️ Consider adjusting tone for better engagement'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Suggested Tones */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <span>💡</span>
                      <span>Suggested Alternative Tones</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {toneAnalysis.suggestions.map((tone, index) => (
                        <button
                          key={index}
                          onClick={() => onSuggestionApply(`Adjust the tone to be more ${tone}.`)}
                          className="group p-4 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 transition-all duration-300 capitalize text-left shadow-sm hover:shadow-md transform hover:scale-105"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl">🎨</span>
                            <span className="text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                          </div>
                          <span className="font-semibold text-gray-800 group-hover:text-purple-700 text-base">
                            {tone}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="inline-block animate-pulse mb-4">
                    <span className="text-6xl">🎭</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Analyzing Tone...</h3>
                  <p className="text-sm text-gray-500">Add content to see tone analysis</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'optimize' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Performance Analytics</h3>
                  <p className="text-sm text-gray-600">Track your content performance and engagement</p>
                </div>
                <button
                  onClick={fetchAnalytics}
                  disabled={isLoading}
                  className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center gap-1"
                >
                  {isLoading ? 'Loading...' : '🔄 Refresh'}
                </button>
              </div>
              
              {isLoading ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-4 border rounded-lg animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : analytics ? (
                <>
                  {/* Performance Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="group bg-gradient-to-br from-blue-50 via-blue-100 to-cyan-100 rounded-xl p-6 border-2 border-blue-200 hover:border-blue-400 transition-all duration-300 hover:shadow-xl transform hover:scale-105">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-blue-600">
                          <span className="text-3xl">👁️</span>
                          <span className="text-sm font-semibold uppercase tracking-wide">Total Views</span>
                        </div>
                      </div>
                      <div className="text-4xl font-extrabold text-gray-900 mb-1">
                        {analytics.performance.total_views.toLocaleString()}
                      </div>
                      <div className="text-xs text-blue-600 font-medium">All-time engagement</div>
                    </div>
                    
                    <div className="group bg-gradient-to-br from-purple-50 via-purple-100 to-pink-100 rounded-xl p-6 border-2 border-purple-200 hover:border-purple-400 transition-all duration-300 hover:shadow-xl transform hover:scale-105">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-purple-600">
                          <span className="text-3xl">❤️</span>
                          <span className="text-sm font-semibold uppercase tracking-wide">Total Likes</span>
                        </div>
                      </div>
                      <div className="text-4xl font-extrabold text-gray-900 mb-1">
                        {analytics.performance.total_likes.toLocaleString()}
                      </div>
                      <div className="text-xs text-purple-600 font-medium">Community appreciation</div>
                    </div>
                    
                    <div className="group bg-gradient-to-br from-orange-50 via-orange-100 to-yellow-100 rounded-xl p-6 border-2 border-orange-200 hover:border-orange-400 transition-all duration-300 hover:shadow-xl transform hover:scale-105">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-orange-600">
                          <span className="text-3xl">⭐</span>
                          <span className="text-sm font-semibold uppercase tracking-wide">Avg Rating</span>
                        </div>
                      </div>
                      <div className="text-4xl font-extrabold text-gray-900 mb-1">
                        {analytics.performance.avg_rating.toFixed(1)}
                        <span className="text-2xl text-gray-600">/5.0</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-orange-600 font-medium">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < Math.round(analytics.performance.avg_rating) ? 'opacity-100' : 'opacity-30'}>
                            ⭐
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Trends */}
                  <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm hover:shadow-lg transition-shadow">
                    <h4 className="font-bold text-gray-800 mb-5 flex items-center gap-2 text-lg">
                      <span>📈</span>
                      <span>Recent Trends</span>
                    </h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">📅</span>
                          <span className="text-gray-700 font-medium">Views (Last 30 Days)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-blue-600">
                            {analytics.trends.views_last_30_days.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-100">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">💚</span>
                          <span className="text-gray-700 font-medium">Engagement Rate</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-green-600">
                            {analytics.trends.engagement_rate.toFixed(1)}%
                          </span>
                          <span className="text-xs text-green-600 font-semibold bg-green-100 px-2 py-1 rounded-full">
                            {analytics.trends.engagement_rate > 10 ? '🔥 HOT' : '📊'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border border-purple-100">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">🏆</span>
                          <span className="text-gray-700 font-medium">Top Category</span>
                        </div>
                        <span className="text-lg font-bold text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
                          {analytics.trends.top_performing_category}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 rounded-xl p-6 border-2 border-purple-300 shadow-md">
                    <h5 className="font-bold text-purple-900 mb-4 flex items-center gap-2 text-lg">
                      <span className="text-2xl">💡</span>
                      <span>AI-Powered Recommendations</span>
                    </h5>
                    <div className="space-y-3">
                      {analytics.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-white bg-opacity-60 rounded-lg border border-purple-200 hover:border-purple-400 transition-colors">
                          <span className="text-purple-600 font-bold text-lg flex-shrink-0">✓</span>
                          <span className="text-gray-700 text-sm leading-relaxed">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-16">
                  <div className="inline-block animate-bounce mb-4">
                    <span className="text-7xl">📊</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Analytics Data Yet</h3>
                  <p className="text-sm text-gray-500 mb-6">Load your performance data to see insights</p>
                  <button
                    onClick={fetchAnalytics}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-semibold flex items-center gap-2 mx-auto shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <span>📊</span>
                    <span>Load Analytics Data</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
