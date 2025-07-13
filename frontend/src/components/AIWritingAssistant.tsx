'use client';

import { useState, useEffect } from 'react';

interface AIWritingAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onSuggestionApply: (suggestion: string) => void;
  currentContent: string;
  contentType: string;
}

interface Suggestion {
  id: string;
  type: 'improvement' | 'continuation' | 'alternative' | 'tone';
  title: string;
  content: string;
  confidence: number;
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
  const [toneAnalysis, setToneAnalysis] = useState<ToneAnalysis | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [writingStyle, setWritingStyle] = useState('professional');
  const [targetAudience, setTargetAudience] = useState('general');
  const [contentGoal, setContentGoal] = useState('inform');

  useEffect(() => {
    if (isOpen && currentContent) {
      generateSuggestions();
      analyzeTone();
    }
  }, [isOpen, currentContent]);

  const generateSuggestions = async () => {
    setIsGenerating(true);
    try {
      // Mock AI suggestions - in real implementation, this would call an AI API
      const mockSuggestions: Suggestion[] = [
        {
          id: '1',
          type: 'improvement',
          title: 'Enhance Introduction',
          content: 'Consider starting with a compelling hook that immediately engages your readers. Try using a thought-provoking question or surprising statistic.',
          confidence: 0.87
        },
        {
          id: '2',
          type: 'continuation',
          title: 'Continue Writing',
          content: 'Based on your current content, you might want to explore the benefits and practical applications of your topic in more detail.',
          confidence: 0.92
        },
        {
          id: '3',
          type: 'alternative',
          title: 'Alternative Approach',
          content: 'Consider restructuring this section to follow a problem-solution format for better reader engagement.',
          confidence: 0.75
        },
        {
          id: '4',
          type: 'tone',
          title: 'Tone Adjustment',
          content: 'Your content could benefit from a more conversational tone to better connect with your audience.',
          confidence: 0.81
        }
      ];
      setSuggestions(mockSuggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setIsGenerating(false);
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
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    try {
      // Mock AI content generation
      const generatedContent = `Here's AI-generated content based on your prompt: "${prompt}"\n\nThis is a sample generated paragraph that would be created by an AI writing assistant. The content would be tailored to your specified writing style (${writingStyle}), target audience (${targetAudience}), and content goal (${contentGoal}).`;
      
      onSuggestionApply(generatedContent);
      setPrompt('');
    } catch (error) {
      console.error('Error generating content:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">AI Writing Assistant</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {['suggestions', 'generate', 'tone', 'optimize'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium capitalize ${
                activeTab === tab
                  ? 'border-b-2 border-purple-500 text-purple-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'suggestions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Smart Suggestions</h3>
                <button
                  onClick={generateSuggestions}
                  disabled={isGenerating}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {isGenerating ? 'Generating...' : 'Refresh'}
                </button>
              </div>
              
              {suggestions.map((suggestion) => (
                <div key={suggestion.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-800">{suggestion.title}</h4>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        suggestion.type === 'improvement' ? 'bg-blue-100 text-blue-800' :
                        suggestion.type === 'continuation' ? 'bg-green-100 text-green-800' :
                        suggestion.type === 'alternative' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {suggestion.type}
                      </span>
                      <span className="text-sm text-gray-500">
                        {Math.round(suggestion.confidence * 100)}% confidence
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-3">{suggestion.content}</p>
                  <button
                    onClick={() => onSuggestionApply(suggestion.content)}
                    className="text-purple-600 hover:text-purple-800 font-medium"
                  >
                    Apply Suggestion
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'generate' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Generate Content</h3>
              
              {/* Content Generation Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Writing Style
                  </label>
                  <select
                    value={writingStyle}
                    onChange={(e) => setWritingStyle(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="academic">Academic</option>
                    <option value="creative">Creative</option>
                    <option value="technical">Technical</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Audience
                  </label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="general">General Public</option>
                    <option value="experts">Industry Experts</option>
                    <option value="beginners">Beginners</option>
                    <option value="students">Students</option>
                    <option value="professionals">Professionals</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content Goal
                  </label>
                  <select
                    value={contentGoal}
                    onChange={(e) => setContentGoal(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="inform">Inform</option>
                    <option value="persuade">Persuade</option>
                    <option value="entertain">Entertain</option>
                    <option value="educate">Educate</option>
                    <option value="inspire">Inspire</option>
                  </select>
                </div>
              </div>

              {/* Prompt Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content Prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what you want to write about..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 h-32 resize-none"
                />
              </div>

              <button
                onClick={generateContent}
                disabled={isGenerating || !prompt.trim()}
                className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
              >
                {isGenerating ? 'Generating Content...' : 'Generate Content'}
              </button>
            </div>
          )}

          {activeTab === 'tone' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Tone Analysis</h3>
              
              {toneAnalysis && (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">Current Tone</h4>
                    <div className="flex items-center space-x-3">
                      <span className="capitalize font-medium text-purple-600">
                        {toneAnalysis.current}
                      </span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${toneAnalysis.score * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500">
                        {Math.round(toneAnalysis.score * 100)}%
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">Suggested Tones</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {toneAnalysis.suggestions.map((tone, index) => (
                        <button
                          key={index}
                          onClick={() => onSuggestionApply(`Adjust the tone to be more ${tone}.`)}
                          className="p-3 border border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors capitalize"
                        >
                          {tone}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'optimize' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Content Optimization</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-800">SEO Optimization</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Keyword Density</span>
                      <span className="text-sm font-medium">2.3%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Readability Score</span>
                      <span className="text-sm font-medium text-green-600">85/100</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Meta Description</span>
                      <span className="text-sm font-medium text-yellow-600">Missing</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-800">Content Quality</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Word Count</span>
                      <span className="text-sm font-medium">{currentContent.length || 0} words</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Reading Time</span>
                      <span className="text-sm font-medium">
                        {Math.ceil((currentContent.length || 0) / 200)} min
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Engagement Score</span>
                      <span className="text-sm font-medium text-blue-600">78/100</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4">
                <h5 className="font-medium text-blue-800 mb-2">Optimization Suggestions</h5>
                <ul className="space-y-1 text-sm text-blue-700">
                  <li>• Add more transition words to improve flow</li>
                  <li>• Include relevant internal links</li>
                  <li>• Add a compelling call-to-action</li>
                  <li>• Consider adding visual elements</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
