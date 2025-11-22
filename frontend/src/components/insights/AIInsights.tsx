'use client';

import React, { useState, useEffect, ReactElement } from 'react';
import { insightsApi, InsightData } from '../../lib/api/insights';
import { useAuth } from '../../contexts/AuthContext';

// Utility function to parse and format text with markdown-style formatting
const formatText = (text: string): ReactElement[] => {
  if (!text) return [];
  
  // Split text by lines to handle different formatting types
  const lines = text.split('\n');
  const elements: ReactElement[] = [];
  let listItems: ReactElement[] = [];
  
  lines.forEach((line, index) => {
    if (!line.trim()) {
      // Empty line - add spacing
      elements.push(<br key={`br-${index}`} />);
      return;
    }
    
    let formattedLine: ReactElement;
    
    // Check for headers
    if (line.startsWith('###')) {
      const content = line.replace(/^###\s*/, '').trim();
      formattedLine = (
        <div key={index} className="header-section level-3 mt-3 mb-2">
          <h6 className="fw-bold text-primary d-flex align-items-center mb-0">
            <div className="header-icon me-2">
              <i className="fas fa-lightbulb text-warning"></i>
            </div>
            <span className="header-text">{processInlineFormatting(content)}</span>
            <div className="header-decoration ms-auto"></div>
          </h6>
        </div>
      );
    } else if (line.startsWith('##')) {
      const content = line.replace(/^##\s*/, '').trim();
      formattedLine = (
        <div key={index} className="header-section level-2 mt-4 mb-3">
          <h5 className="fw-bold text-dark d-flex align-items-center mb-0">
            <div className="header-icon me-3">
              <i className="fas fa-star text-warning"></i>
            </div>
            <span className="header-text flex-grow-1">{processInlineFormatting(content)}</span>
            <div className="header-line"></div>
          </h5>
        </div>
      );
    } else if (line.startsWith('#')) {
      const content = line.replace(/^#\s*/, '').trim();
      formattedLine = (
        <div key={index} className="header-section level-1 mt-4 mb-4">
          <h4 className="fw-bold text-primary d-flex align-items-center mb-0">
            <div className="header-icon me-3">
              <div className="crown-icon">
                <i className="fas fa-crown text-gold"></i>
              </div>
            </div>
            <span className="header-text flex-grow-1">{processInlineFormatting(content)}</span>
            <div className="sparkle-decoration">
              <i className="fas fa-sparkles text-warning"></i>
            </div>
          </h4>
        </div>
      );
    } else if (line.startsWith('**') && line.endsWith('**')) {
      // Full line bold
      const content = line.replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
      formattedLine = (
        <p key={index} className="fw-bold text-dark mb-2">
          <i className="fas fa-arrow-right me-2 text-success small"></i>
          {processInlineFormatting(content)}
        </p>
      );
    } else if (line.startsWith('*') && line.endsWith('*')) {
      // Full line italic
      const content = line.replace(/^\*/, '').replace(/\*$/, '').trim();
      formattedLine = (
        <p key={index} className="fst-italic text-muted mb-2">
          <i className="fas fa-quote-left me-2 small"></i>
          {processInlineFormatting(content)}
        </p>
      );
    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      // Bullet point - collect for grouped list
      const content = line.replace(/^[-•]\s*/, '').trim();
      listItems.push(
        <li key={`list-${index}`} className="insight-list-item mb-3">
          <div className="d-flex align-items-start">
            <div className="bullet-icon me-3">
              <div className="pulse-dot"></div>
            </div>
            <div className="bullet-content flex-grow-1">
              {processInlineFormatting(content)}
            </div>
          </div>
        </li>
      );
      // Don't add formattedLine yet, will be processed later
      return;
    } else if (/^\d+\.\s/.test(line)) {
      // Numbered list item
      const match = line.match(/^(\d+)\.(\s+)(.*)/);
      if (match) {
        const [, number, , content] = match;
        formattedLine = (
          <div key={index} className="numbered-item mb-3">
            <div className="d-flex align-items-start">
              <div className="number-badge me-3">
                <span className="number">{number}</span>
              </div>
              <div className="numbered-content flex-grow-1">
                {processInlineFormatting(content)}
              </div>
            </div>
          </div>
        );
      } else {
        formattedLine = (
          <p key={index} className="insight-paragraph text-dark mb-3 lh-lg">
            {processInlineFormatting(line)}
          </p>
        );
      }
    } else if (line.trim()) {
      // Regular paragraph
      formattedLine = (
        <p key={index} className="insight-paragraph text-dark mb-3 lh-lg">
          {processInlineFormatting(line)}
        </p>
      );
    } else {
      // Empty line - add spacing
      formattedLine = <div key={index} className="paragraph-spacer" />;
    }
    
    elements.push(formattedLine);
  });
  
  // Add collected list items as a single list
  if (listItems.length > 0) {
    elements.push(
      <ul key="collected-list" className="insight-list mb-4">
        {listItems}
      </ul>
    );
  }
  
  return elements;
};

// Process inline formatting like **bold** and *italic*
const processInlineFormatting = (text: string): (string | ReactElement)[] => {
  const parts: (string | ReactElement)[] = [];
  let currentIndex = 0;
  let elementKey = 0;
  
  // Process **bold** text
  let boldRegex = /\*\*(.*?)\*\*/g;
  let match;
  
  while ((match = boldRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > currentIndex) {
      parts.push(text.substring(currentIndex, match.index));
    }
    
    // Add the bold text with enhanced styling
    parts.push(
      <strong key={`bold-${elementKey++}`} className="fw-bold text-dark highlight-text">
        {match[1]}
      </strong>
    );
    
    currentIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (currentIndex < text.length) {
    const remaining = text.substring(currentIndex);
    
    // Process *italic* in the remaining text
    const italicParts: (string | ReactElement)[] = [];
    let italicIndex = 0;
    const italicRegex = /\*(.*?)\*/g;
    let italicMatch;
    
    while ((italicMatch = italicRegex.exec(remaining)) !== null) {
      // Add text before the italic match
      if (italicMatch.index > italicIndex) {
        italicParts.push(remaining.substring(italicIndex, italicMatch.index));
      }
      
      // Add the italic text with enhanced styling
      italicParts.push(
        <em key={`italic-${elementKey++}`} className="fst-italic text-primary emphasis-text">
          {italicMatch[1]}
        </em>
      );
      
      italicIndex = italicMatch.index + italicMatch[0].length;
    }
    
    // Add remaining text after italic processing
    if (italicIndex < remaining.length) {
      italicParts.push(remaining.substring(italicIndex));
    }
    
    parts.push(...italicParts);
  }
  
  return parts.length > 0 ? parts : [text];
};

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
        <div className="card border-0 shadow-lg mb-4 main-insight-card">
          <div className="card-header border-0 bg-gradient-primary text-white position-relative overflow-hidden">
            <div className="floating-particles"></div>
            <div className="d-flex align-items-center position-relative">
              <div className="insight-icon-large me-3">
                <div className="icon-wrapper">
                  <i className="fas fa-brain fa-lg"></i>
                </div>
              </div>
              <div>
                <h6 className="card-title mb-1 fw-bold">
                  {language === 'kinyarwanda' ? 'Inyunganizi ku Buzima' : 'Health Insight'}
                </h6>
                <small className="opacity-90">
                  {language === 'kinyarwanda' ? 'Ubwenge bwihuse bwashingiye ku makuru yawe' : 'AI-powered personalized analysis'}
                </small>
              </div>
              <div className="ms-auto">
                <div className="insight-badge">
                  <i className="fas fa-sparkles me-1"></i>
                  <span>AI</span>
                </div>
              </div>
            </div>
          </div>
          <div className="card-body p-4">
            <div className="insight-content">
              {formatText(insights.inyunganizi)}
            </div>
          </div>
        </div>

        {/* Action Items */}
        {insights.icyo_wakora && insights.icyo_wakora.length > 0 && (
          <div className="card border-0 shadow-lg mb-4 action-items-card">
            <div className="card-header border-0 bg-gradient-success text-white position-relative">
              <div className="d-flex align-items-center">
                <div className="action-icon-wrapper me-3">
                  <i className="fas fa-clipboard-check fa-lg"></i>
                </div>
                <div>
                  <h6 className="card-title mb-1 fw-bold">
                    {language === 'kinyarwanda' ? 'Icyo Wakora' : 'Action Steps'}
                  </h6>
                  <small className="opacity-90">
                    {language === 'kinyarwanda' ? 'Intambwe zo gukurikiza' : 'Recommended next steps'}
                  </small>
                </div>
                <div className="ms-auto">
                  <span className="badge bg-white bg-opacity-20">
                    {insights.icyo_wakora.length} {language === 'kinyarwanda' ? 'ibikorwa' : 'items'}
                  </span>
                </div>
              </div>
            </div>
            <div className="card-body p-4">
              <div className="actions-grid">
                {insights.icyo_wakora.map((action, index) => (
                  <div key={index} className="action-item mb-3">
                    <div className="action-card p-3">
                      <div className="d-flex align-items-start">
                        <div className="action-number me-3">
                          <span className="number">{index + 1}</span>
                        </div>
                        <div className="flex-grow-1 action-content">
                          {formatText(action)}
                        </div>
                        <div className="action-status">
                          <i className="fas fa-arrow-right text-success"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Encouragement */}
        {insights.ihumure && (
          <div className="card border-0 shadow-lg mb-4 encouragement-card position-relative overflow-hidden">
            <div className="encouragement-background"></div>
            <div className="card-header border-0 bg-transparent position-relative">
              <div className="d-flex align-items-center">
                <div className="heart-icon-wrapper me-3">
                  <div className="beating-heart">
                    <i className="fas fa-heart"></i>
                  </div>
                </div>
                <div>
                  <h6 className="card-title mb-1 fw-bold text-white">
                    {language === 'kinyarwanda' ? 'Amagambo y\'Ihumure' : 'Words of Encouragement'}
                  </h6>
                  <small className="text-white opacity-90">
                    {language === 'kinyarwanda' ? 'Ubunyangamugayo n\'ikizere' : 'Motivation and support'}
                  </small>
                </div>
                <div className="ms-auto">
                  <div className="encouragement-stars">
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                  </div>
                </div>
              </div>
            </div>
            <div className="card-body p-4 position-relative">
              <div className="encouragement-quote">
                <div className="quote-mark-start">
                  <i className="fas fa-quote-left"></i>
                </div>
                <div className="encouragement-text">
                  {formatText(insights.ihumure)}
                </div>
                <div className="quote-mark-end">
                  <i className="fas fa-quote-right"></i>
                </div>
              </div>
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
      <style jsx>{`
        /* Main Card Enhancements */
        .main-insight-card {
          border-radius: 20px;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
        }
        
        .main-insight-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0,0,0,0.15) !important;
        }
        
        .bg-gradient-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .bg-gradient-success {
          background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        }
        
        .floating-particles {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: radial-gradient(2px 2px at 20px 30px, rgba(255,255,255,0.3), transparent),
                            radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.2), transparent),
                            radial-gradient(1px 1px at 90px 40px, rgba(255,255,255,0.3), transparent);
          animation: float 6s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .insight-icon-large .icon-wrapper {
          width: 50px;
          height: 50px;
          background: rgba(255,255,255,0.2);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.1);
        }
        
        .insight-badge {
          background: rgba(255,255,255,0.15);
          padding: 4px 12px;
          border-radius: 20px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.1);
          font-size: 0.8rem;
          font-weight: 600;
        }
        
        /* Header Styling */
        .header-section {
          position: relative;
          margin: 1rem 0;
        }
        
        .header-section.level-1 {
          padding: 1rem;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 10%, #4facfe 100%);
          border-radius: 15px;
          color: white;
          box-shadow: 0 8px 32px rgba(79, 172, 254, 0.3);
        }
        
        .header-section.level-2 {
          padding: 0.8rem 0;
          border-left: 4px solid #ffd700;
          padding-left: 1rem;
          background: linear-gradient(90deg, rgba(255, 215, 0, 0.1) 0%, transparent 100%);
        }
        
        .crown-icon {
          animation: bounce 2s infinite;
        }
        
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-5px); }
          60% { transform: translateY(-3px); }
        }
        
        .header-line {
          height: 2px;
          background: linear-gradient(90deg, #ffd700 0%, transparent 100%);
          flex-grow: 1;
          margin-left: 1rem;
        }
        
        /* Text Formatting */
        .highlight-text {
          background: linear-gradient(120deg, #a8edea 0%, #fed6e3 100%);
          padding: 2px 6px;
          border-radius: 4px;
          color: #2d3436 !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .emphasis-text {
          background: linear-gradient(120deg, #d299c2 0%, #fef9d7 100%);
          padding: 1px 4px;
          border-radius: 3px;
          color: #6c5ce7 !important;
        }
        
        .insight-paragraph {
          line-height: 1.8;
          color: #2d3436;
          text-align: justify;
          text-justify: inter-word;
        }
        
        /* List Styling */
        .insight-list {
          list-style: none;
          padding: 0;
        }
        
        .insight-list-item {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 10px;
          padding: 1rem;
          margin-bottom: 0.8rem;
          border-left: 4px solid #28a745;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          transition: all 0.3s ease;
        }
        
        .insight-list-item:hover {
          transform: translateX(5px);
          box-shadow: 0 4px 15px rgba(40, 167, 69, 0.2);
        }
        
        .bullet-icon {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .pulse-dot {
          width: 8px;
          height: 8px;
          background: #28a745;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(40, 167, 69, 0); }
          100% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0); }
        }
        
        /* Numbered Items */
        .numbered-item {
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
          border-radius: 12px;
          padding: 1rem;
          border: 1px solid #2196f3;
          box-shadow: 0 3px 10px rgba(33, 150, 243, 0.1);
        }
        
        .number-badge {
          width: 30px;
          height: 30px;
          background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 0.9rem;
          box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
        }
        
        /* Action Items */
        .action-items-card {
          border-radius: 18px;
          overflow: hidden;
        }
        
        .action-icon-wrapper {
          width: 45px;
          height: 45px;
          background: rgba(255,255,255,0.2);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
        }
        
        .action-card {
          background: linear-gradient(135deg, #f8fff4 0%, #e8f8f5 100%);
          border-radius: 12px;
          border: 1px solid rgba(40, 167, 69, 0.2);
          transition: all 0.3s ease;
        }
        
        .action-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(40, 167, 69, 0.15);
          border-color: rgba(40, 167, 69, 0.4);
        }
        
        .action-number {
          width: 28px;
          height: 28px;
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 0.85rem;
        }
        
        .action-status {
          opacity: 0.6;
          transition: all 0.3s ease;
        }
        
        .action-card:hover .action-status {
          opacity: 1;
          transform: translateX(3px);
        }
        
        /* Encouragement Section */
        .encouragement-card {
          border-radius: 20px;
        }
        
        .encouragement-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%);
          opacity: 0.9;
        }
        
        .heart-icon-wrapper {
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .beating-heart {
          color: #fff;
          font-size: 1.5rem;
          animation: heartbeat 1.5s ease-in-out infinite;
        }
        
        @keyframes heartbeat {
          0% { transform: scale(1); }
          14% { transform: scale(1.1); }
          28% { transform: scale(1); }
          42% { transform: scale(1.1); }
          70% { transform: scale(1); }
        }
        
        .encouragement-stars i {
          color: #ffd700;
          margin: 0 2px;
          animation: twinkle 2s ease-in-out infinite;
        }
        
        .encouragement-stars i:nth-child(2) { animation-delay: 0.5s; }
        .encouragement-stars i:nth-child(3) { animation-delay: 1s; }
        
        @keyframes twinkle {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        
        .encouragement-quote {
          position: relative;
          background: rgba(255,255,255,0.95);
          border-radius: 15px;
          padding: 2rem;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          backdrop-filter: blur(10px);
        }
        
        .quote-mark-start, .quote-mark-end {
          position: absolute;
          font-size: 2rem;
          color: rgba(255, 154, 158, 0.6);
        }
        
        .quote-mark-start {
          top: -5px;
          left: 10px;
        }
        
        .quote-mark-end {
          bottom: -5px;
          right: 10px;
        }
        
        .encouragement-text {
          font-size: 1.1rem;
          line-height: 1.8;
          color: #2d3436;
          text-align: center;
          font-weight: 500;
        }
        
        /* General Enhancements */
        .paragraph-spacer {
          height: 1rem;
        }
        
        .text-gold {
          color: #f39c12 !important;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .main-insight-card:hover {
            transform: translateY(-4px) scale(1.01);
          }
          
          .encouragement-quote {
            padding: 1.5rem;
          }
          
          .action-card:hover {
            transform: none;
          }
        }
      `}</style>
    <div className={`ai-insights-content ${className}`}>
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
    </div>
  );
}