'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

// Enhanced interfaces for real backend data
interface WriterStats {
  content_stats: {
    total: number;
    published: number;
    draft: number;
    pending_review: number;
    rejected: number;
    total_views: number;
    total_likes: number;
    total_comments: number;
    avg_rating: number;
  };
  recent_content: Array<{
    id: number;
    title: string;
    status: string;
    views: number;
    likes: number;
    comments: number;
    rating: number;
    created_at: string;
  }>;
  monthly_performance: Array<{
    month: string;
    content_created: number;
    total_views: number;
    total_engagement: number;
  }>;
  writer_info: {
    specialization: string;
    is_approved: boolean;
    rank: string;
    experience_level: string;
    total_earnings: number;
  };
  trending_topics: Array<{
    topic: string;
    demand: number;
    avg_views: number;
  }>;
}

interface ContentItem {
  id: number;
  title: string;
  summary: string;
  content: string;
  status: string;
  views: number;
  likes: number;
  comments: number;
  rating: number;
  category: string;
  category_id: number;
  tags: string[];
  seo_keywords: string[];
  word_count: number;
  reading_time: number;
  created_at: string;
  updated_at: string;
  published_at: string;
  review_notes: string;
  featured_image: string;
}

interface Category {
  id: number;
  name: string;
  description: string;
}

interface Profile {
  name: string;
  email: string;
  specialization: string;
  bio: string;
  is_approved: boolean;
  rank: string;
  experience_level: string;
  total_earnings: number;
  rating: number;
  portfolio_url: string;
  social_links: {
    twitter: string;
    linkedin: string;
    website: string;
  };
  preferences: {
    email_notifications: boolean;
    content_suggestions: boolean;
    performance_alerts: boolean;
  };
  created_at: string;
}

interface ContentSuggestion {
  topic: string;
  description: string;
  category: string;
  demand: number;
  avg_views: number;
  title: string;
}

interface PerformanceInsights {
  recommendations: Array<{
    type: string;
    title: string;
    description: string;
    action: string;
  }>;
  performance_summary: {
    best_performing: ContentItem | null;
    most_engaging: ContentItem | null;
    improvement_areas: string[];
  };
}

interface AnalyticsData {
  performance: {
    total_articles: number;
    total_views: number;
    total_likes: number;
    total_comments: number;
    avg_rating: number;
  };
  engagement: {
    avg_time_on_page: string;
    bounce_rate: string;
    social_shares: number;
  };
  trends: {
    monthly_growth: string;
    reader_retention: string;
    content_completion: string;
  };
}

export default function ContentWriterDashboard() {
  // API utility function
  const buildContentWriterApiUrl = (endpoint: string) => {
    return `/api/content-writer${endpoint}`;
  };

  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<WriterStats | null>(null);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Enhanced form states
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    category_id: '',
    tags: [] as string[],
    seo_keywords: [] as string[],
    featured_image: ''
  });
  const [tagInput, setTagInput] = useState('');
  const [seoKeywordInput, setSeoKeywordInput] = useState('');
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Advanced features
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [contentSuggestions, setContentSuggestions] = useState<ContentSuggestion[]>([]);
  const [performanceInsights, setPerformanceInsights] = useState<PerformanceInsights | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const router = useRouter();
  const { user, loading: authLoading, hasRole, getDashboardRoute } = useAuth();

  // Utility functions
  const resetFormData = () => ({
    title: '',
    summary: '',
    content: '',
    category_id: '',
    tags: [] as string[],
    seo_keywords: [] as string[],
    featured_image: ''
  });

  // Enhanced API call function with better error handling
  const makeApiCall = useCallback(async (url: string, options?: RequestInit) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      throw new Error('No authentication token');
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('access_token');
          router.push('/login');
          throw new Error('Session expired');
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `API call failed: ${response.statusText}`);
      }

      return response.json();
    } catch (error: any) {
      console.error('API call error:', error);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }, [router]);

  // Auto-save functionality
  const saveDraft = useCallback(async () => {
    if (!formData.title && !formData.content) return;
    
    try {
      const url = editingContent 
        ? buildContentWriterApiUrl(`/content/${editingContent.id}`)
        : buildContentWriterApiUrl('/content/draft');
      
      await makeApiCall(url, {
        method: editingContent ? 'PUT' : 'POST',
        body: JSON.stringify({
          ...formData,
          status: 'draft',
          auto_save: true
        })
      });
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [formData, editingContent, makeApiCall]);

  // Data loading functions
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const statsData = await makeApiCall(buildContentWriterApiUrl('/dashboard/stats'));
      setStats(statsData);
      
    } catch (err: any) {
      console.error('Failed to load content writer dashboard:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [makeApiCall]);

  const loadContent = useCallback(async () => {
    try {
      const data = await makeApiCall(buildContentWriterApiUrl('/content'));
      setContent(data.content || []);
    } catch (err: any) {
      console.error('Failed to load content:', err);
      setError(err.message || 'Failed to load content');
    }
  }, [makeApiCall]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await makeApiCall(buildContentWriterApiUrl('/categories'));
      setCategories(data.categories || []);
    } catch (err: any) {
      console.error('Failed to load categories:', err);
    }
  }, [makeApiCall]);

  const loadProfile = useCallback(async () => {
    try {
      const data = await makeApiCall(buildContentWriterApiUrl('/profile'));
      setProfile(data.profile || data);
    } catch (err: any) {
      console.error('Failed to load profile:', err);
      setError(err.message || 'Failed to load profile');
    }
  }, [makeApiCall]);

  const loadContentSuggestions = useCallback(async () => {
    try {
      const data = await makeApiCall(buildContentWriterApiUrl('/suggestions'));
      setContentSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Failed to load content suggestions:', error);
    }
  }, [makeApiCall]);

  const loadAnalytics = useCallback(async () => {
    try {
      const data = await makeApiCall(buildContentWriterApiUrl('/analytics'));
      setAnalyticsData(data.analytics);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  }, [makeApiCall]);

  const loadPerformanceInsights = useCallback(async () => {
    try {
      const data = await makeApiCall(buildContentWriterApiUrl('/insights'));
      setPerformanceInsights(data.insights);
    } catch (error) {
      console.error('Failed to load performance insights:', error);
    }
  }, [makeApiCall]);

  // Content management functions
  const handleCreateContent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      await makeApiCall(buildContentWriterApiUrl('/content'), {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      setFormData(resetFormData());
      setSuccess('Content created successfully!');
      
      loadContent();
      loadDashboardData();
      
    } catch (err: any) {
      console.error('Failed to create content:', err);
      setError(err.message || 'Failed to create content');
    }
  };

  const handleUpdateContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContent) return;

    try {
      setError('');
      await makeApiCall(buildContentWriterApiUrl(`/content/${editingContent.id}`), {
        method: 'PUT',
        body: JSON.stringify(formData)
      });

      setFormData(resetFormData());
      setEditingContent(null);
      setSuccess('Content updated successfully!');
      
      loadContent();
      loadDashboardData();
      
    } catch (err: any) {
      console.error('Failed to update content:', err);
      setError(err.message || 'Failed to update content');
    }
  };

  const submitForReview = async (contentId: number) => {
    try {
      setActionLoading({...actionLoading, [`submit-${contentId}`]: true});
      
      await makeApiCall(buildContentWriterApiUrl(`/content/${contentId}/submit`), {
        method: 'PATCH'
      });

      setSuccess('Content submitted for review successfully!');
      loadContent();
      loadDashboardData();
      
    } catch (err: any) {
      console.error('Failed to submit content:', err);
      setError(err.message || 'Failed to submit content for review');
    } finally {
      setActionLoading({...actionLoading, [`submit-${contentId}`]: false});
    }
  };

  const deleteContent = async (contentId: number) => {
    if (!window.confirm('Are you sure you want to delete this content? This action cannot be undone.')) return;

    try {
      setActionLoading({...actionLoading, [`delete-${contentId}`]: true});
      
      await makeApiCall(buildContentWriterApiUrl(`/content/${contentId}`), {
        method: 'DELETE'
      });

      setSuccess('Content deleted successfully!');
      loadContent();
      loadDashboardData();
      
    } catch (err: any) {
      console.error('Failed to delete content:', err);
      setError(err.message || 'Failed to delete content');
    } finally {
      setActionLoading({...actionLoading, [`delete-${contentId}`]: false});
    }
  };

  const startEditing = (item: ContentItem) => {
    setEditingContent(item);
    setFormData({
      title: item.title,
      summary: item.summary,
      content: item.content || '',
      category_id: item.category_id?.toString() || '',
      tags: item.tags || [],
      seo_keywords: item.seo_keywords || [],
      featured_image: item.featured_image || ''
    });
    setActiveTab('create');
    setSuccess(`Editing: ${item.title}`);
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      await makeApiCall(buildContentWriterApiUrl('/profile'), {
        method: 'PUT',
        body: JSON.stringify({
          specialization: profile?.specialization,
          bio: profile?.bio
        })
      });

      setSuccess('Profile updated successfully!');
      loadProfile();
      
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setError(err.message || 'Failed to update profile');
    }
  };

  // Word count and reading time calculation
  const wordCount = useMemo(() => {
    return formData.content.split(/\s+/).filter(word => word.length > 0).length;
  }, [formData.content]);

  const readingTime = useMemo(() => {
    return Math.ceil(wordCount / 200);
  }, [wordCount]);

  // Filtered and sorted content
  const filteredContent = useMemo(() => {
    let filtered = content.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.summary.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      let aValue = a[sortBy as keyof ContentItem];
      let bValue = b[sortBy as keyof ContentItem];
      
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [content, searchTerm, statusFilter, sortBy, sortOrder]);

  // Effects
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    
    if (!authLoading && user && !hasRole('content_writer')) {
      const correctRoute = getDashboardRoute();
      router.push(correctRoute);
      return;
    }
    
    if (!authLoading && user && hasRole('content_writer')) {
      loadDashboardData();
      loadCategories();
      loadContentSuggestions();
    }
  }, [user, authLoading, router, hasRole, getDashboardRoute, loadDashboardData, loadCategories, loadContentSuggestions]);

  useEffect(() => {
    if (activeTab === 'content') {
      loadContent();
    } else if (activeTab === 'profile') {
      loadProfile();
    } else if (activeTab === 'analytics') {
      loadAnalytics();
      loadPerformanceInsights();
    }
  }, [activeTab, loadContent, loadProfile, loadAnalytics, loadPerformanceInsights]);

  // Auto-save effect
  useEffect(() => {
    if (autoSaveEnabled && (formData.title || formData.content) && editingContent) {
      const autoSaveTimer = setTimeout(() => {
        saveDraft();
      }, 30000);

      return () => clearTimeout(autoSaveTimer);
    }
  }, [autoSaveEnabled, formData.title, formData.content, editingContent, saveDraft]);

  // Auto-hide messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Dark mode effect
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Render loading state
  if (loading) {
    return (
      <div className={`min-h-screen d-flex align-items-center justify-content-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{width: '3rem', height: '3rem'}}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className={darkMode ? 'text-white' : 'text-gray-800'}>Loading Content Writer Dashboard...</h5>
          <p className={`text-muted ${darkMode ? 'text-gray-300' : ''}`}>Please wait while we prepare your workspace</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error && !stats) {
    return (
      <div className={`min-h-screen d-flex align-items-center justify-content-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div className="card border-danger">
                <div className="card-body text-center">
                  <i className="fas fa-exclamation-triangle text-danger fa-3x mb-3"></i>
                  <h5 className="card-title text-danger">Dashboard Error</h5>
                  <p className="card-text">{error}</p>
                  <button 
                    className="btn btn-primary me-2"
                    onClick={() => {
                      setError('');
                      loadDashboardData();
                    }}
                  >
                    <i className="fas fa-redo me-2"></i>
                    Retry
                  </button>
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      localStorage.removeItem('access_token');
                      router.push('/login');
                    }}
                  >
                    <i className="fas fa-sign-out-alt me-2"></i>
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container py-4">
        {/* Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
          <div className="mb-3 mb-md-0">
            <h1 className={`mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              <span className="d-none d-md-inline">Content Writer Dashboard</span>
              <span className="d-md-none">Writer Dashboard</span>
            </h1>
            <p className={`mb-0 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <span className="d-none d-lg-inline">Create, manage, and optimize your content with advanced tools</span>
              <span className="d-lg-none">Manage your content and tools</span>
            </p>
          </div>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`btn ${darkMode ? 'btn-outline-light' : 'btn-outline-dark'}`}
              title="Toggle Dark Mode"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            
            {/* Notifications */}
            <div className="position-relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="btn btn-outline-primary position-relative"
                title="Notifications"
              >
                <i className="fas fa-bell"></i>
                {notifications.length > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {notifications.length}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className="position-absolute end-0 mt-2 w-80 bg-white shadow-lg rounded-lg border z-50">
                  <div className="p-3 border-bottom">
                    <h6 className="mb-0">Notifications</h6>
                  </div>
                  <div className="max-h-80 overflow-auto">
                    {notifications.length > 0 ? notifications.map((notification, index) => (
                      <div key={index} className="p-3 border-bottom hover:bg-gray-50">
                        <div className="d-flex align-items-start">
                          <div className="flex-shrink-0 me-3">
                            <span className="badge bg-primary">!</span>
                          </div>
                          <div className="flex-grow-1">
                            <p className="mb-1 small">{notification.message}</p>
                            <small className="text-muted">{notification.time}</small>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="p-4 text-center text-muted">
                        No new notifications
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* User Menu */}
            <button 
              className="btn btn-outline-secondary"
              onClick={() => {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user_id');
                localStorage.removeItem('user_type');
                router.push('/login');
              }}
              title="Logout"
            >
              <i className="fas fa-sign-out-alt me-2 d-none d-md-inline"></i>
              <span className="d-none d-md-inline">Logout</span>
              <i className="fas fa-sign-out-alt d-md-none"></i>
            </button>
          </div>
        </div>

        {/* Approval Status Alert */}
        {stats && !stats.writer_info.is_approved && (
          <div className="alert alert-warning mb-4" role="alert">
            <i className="fas fa-exclamation-triangle me-2"></i>
            Your content writer account is pending approval. You can create content, but it won&apos;t be published until your account is approved.
          </div>
        )}

        {/* Navigation */}
        <div className="card mb-4">
          <div className="card-body">
            <ul className="nav nav-pills nav-fill flex-column flex-md-row">
              <li className="nav-item mb-2 mb-md-0">
                <button 
                  className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('overview')}
                >
                  <i className="fas fa-tachometer-alt me-2"></i>
                  Overview
                </button>
              </li>
              <li className="nav-item mb-2 mb-md-0">
                <button 
                  className={`nav-link ${activeTab === 'content' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('content')}
                >
                  <i className="fas fa-file-alt me-2"></i>
                  My Content
                </button>
              </li>
              <li className="nav-item mb-2 mb-md-0">
                <button 
                  className={`nav-link ${activeTab === 'create' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('create')}
                >
                  <i className="fas fa-plus me-2"></i>
                  Create Content
                </button>
              </li>
              <li className="nav-item mb-2 mb-md-0">
                <button 
                  className={`nav-link ${activeTab === 'analytics' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('analytics')}
                >
                  <i className="fas fa-chart-line me-2"></i>
                  Analytics
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('profile')}
                >
                  <i className="fas fa-user me-2"></i>
                  Profile
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div>
            {/* Statistics Cards */}
            <div className="row mb-4">
              <div className="col-md-3 mb-3">
                <div className="card bg-primary text-white h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h4>{stats.content_stats.total}</h4>
                        <p className="mb-0">Total Content</p>
                      </div>
                      <div className="fs-1">
                        <i className="fas fa-file-alt"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card bg-success text-white h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h4>{stats.content_stats.published}</h4>
                        <p className="mb-0">Published</p>
                      </div>
                      <div className="fs-1">
                        <i className="fas fa-check-circle"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card bg-warning text-white h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h4>{stats.content_stats.draft}</h4>
                        <p className="mb-0">Drafts</p>
                      </div>
                      <div className="fs-1">
                        <i className="fas fa-edit"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card bg-info text-white h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h4>{stats.content_stats.total_views}</h4>
                        <p className="mb-0">Total Views</p>
                      </div>
                      <div className="fs-1">
                        <i className="fas fa-eye"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Suggestions */}
            {contentSuggestions.length > 0 && (
              <div className="row mb-4">
                <div className="col-12">
                  <div className="card">
                    <div className="card-header">
                      <h5><i className="fas fa-lightbulb me-2"></i>Content Suggestions</h5>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        {contentSuggestions.slice(0, 3).map((suggestion, index) => (
                          <div key={index} className="col-md-4 mb-3">
                            <div className="card h-100">
                              <div className="card-body">
                                <h6 className="card-title">{suggestion.title}</h6>
                                <p className="card-text small">{suggestion.description}</p>
                                <div className="d-flex justify-content-between align-items-center">
                                  <span className="badge bg-primary">{suggestion.category}</span>
                                  <small className="text-muted">{suggestion.avg_views} avg views</small>
                                </div>
                                <button 
                                  className="btn btn-sm btn-outline-primary mt-2 w-100"
                                  onClick={() => {
                                    setFormData({
                                      ...resetFormData(),
                                      title: suggestion.title
                                    });
                                    setActiveTab('create');
                                  }}
                                >
                                  Start Writing
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Content and Performance */}
            <div className="row">
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header">
                    <h5>Recent Content</h5>
                  </div>
                  <div className="card-body">
                    {stats.recent_content.map(item => (
                      <div key={item.id} className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                        <div>
                          <strong>{item.title}</strong>
                          <br />
                          <span className={`badge bg-${item.status === 'published' ? 'success' : 'warning'}`}>
                            {item.status}
                          </span>
                          <small className="text-muted ms-2">{item.views} views</small>
                        </div>
                        <small>{new Date(item.created_at).toLocaleDateString()}</small>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header">
                    <h5>Monthly Performance</h5>
                  </div>
                  <div className="card-body">
                    {stats.monthly_performance.map((month, index) => (
                      <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                        <div>
                          <strong>{month.month}</strong>
                        </div>
                        <div className="text-end">
                          <div>{month.content_created} articles</div>
                          <small className="text-muted">{month.total_views} views</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Management Tab */}
        {activeTab === 'content' && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5><i className="fas fa-file-alt me-2"></i>My Content</h5>
              <button 
                className="btn btn-primary"
                onClick={() => setActiveTab('create')}
              >
                <i className="fas fa-plus me-2"></i>Create New
              </button>
            </div>

            {/* Search and Filters */}
            <div className="card mb-4">
              <div className="card-body">
                <div className="row">
                  <div className="col-md-4">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search content..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="col-md-3">
                    <select
                      className="form-select"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">All Status</option>
                      <option value="draft">Draft</option>
                      <option value="pending_review">Pending Review</option>
                      <option value="published">Published</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <select
                      className="form-select"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="created_at">Created Date</option>
                      <option value="title">Title</option>
                      <option value="views">Views</option>
                      <option value="status">Status</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    <button
                      className="btn btn-outline-secondary w-100"
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="card-body">
                {filteredContent.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Category</th>
                          <th>Status</th>
                          <th>Views</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredContent.map(item => (
                          <tr key={item.id}>
                            <td>
                              <strong>{item.title}</strong>
                              <br />
                              <small className="text-muted">{item.summary?.substring(0, 50)}...</small>
                            </td>
                            <td>{item.category}</td>
                            <td>
                              <span className={`badge bg-${
                                item.status === 'published' ? 'success' : 
                                item.status === 'draft' ? 'warning' : 
                                item.status === 'pending_review' ? 'info' : 'secondary'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                            <td>{item.views}</td>
                            <td>{new Date(item.created_at).toLocaleDateString()}</td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <button 
                                  className="btn btn-outline-primary"
                                  onClick={() => startEditing(item)}
                                >
                                  Edit
                                </button>
                                {item.status === 'draft' && (
                                  <button 
                                    className="btn btn-outline-success"
                                    onClick={() => submitForReview(item.id)}
                                    disabled={actionLoading[`submit-${item.id}`]}
                                  >
                                    {actionLoading[`submit-${item.id}`] ? (
                                      <span className="spinner-border spinner-border-sm" />
                                    ) : (
                                      'Submit'
                                    )}
                                  </button>
                                )}
                                <button 
                                  className="btn btn-outline-danger"
                                  onClick={() => deleteContent(item.id)}
                                  disabled={actionLoading[`delete-${item.id}`]}
                                >
                                  {actionLoading[`delete-${item.id}`] ? (
                                    <span className="spinner-border spinner-border-sm" />
                                  ) : (
                                    'Delete'
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <i className="fas fa-file-alt fa-3x text-muted mb-3"></i>
                    <p>No content found</p>
                    <button 
                      className="btn btn-primary"
                      onClick={() => setActiveTab('create')}
                    >
                      Create Your First Article
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Create/Edit Content Tab */}
        {activeTab === 'create' && (
          <div className="card">
            <div className="card-header">
              <h5>{editingContent ? 'Edit Content' : 'Create New Content'}</h5>
            </div>
            <div className="card-body">
              <form onSubmit={editingContent ? handleUpdateContent : handleCreateContent}>
                <div className="row">
                  <div className="col-md-8">
                    <div className="mb-3">
                      <label htmlFor="title" className="form-label">Title</label>
                      <input
                        type="text"
                        className="form-control"
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="summary" className="form-label">Summary</label>
                      <textarea
                        className="form-control"
                        id="summary"
                        rows={3}
                        value={formData.summary}
                        onChange={(e) => setFormData({...formData, summary: e.target.value})}
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="content" className="form-label">Content</label>
                      <textarea
                        className="form-control"
                        id="content"
                        rows={15}
                        value={formData.content}
                        onChange={(e) => setFormData({...formData, content: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label htmlFor="category" className="form-label">Category</label>
                      <select
                        className="form-select"
                        id="category"
                        value={formData.category_id}
                        onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                        required
                      >
                        <option value="">Select category</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Tags</label>
                      <div className="input-group mb-2">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Add tag"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
                                setFormData({
                                  ...formData,
                                  tags: [...formData.tags, tagInput.trim()]
                                });
                                setTagInput('');
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => {
                            if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
                              setFormData({
                                ...formData,
                                tags: [...formData.tags, tagInput.trim()]
                              });
                              setTagInput('');
                            }
                          }}
                        >
                          Add
                        </button>
                      </div>
                      <div className="d-flex flex-wrap gap-1">
                        {formData.tags.map((tag, index) => (
                          <span key={index} className="badge bg-primary">
                            {tag}
                            <button
                              type="button"
                              className="btn-close btn-close-white ms-1"
                              style={{fontSize: '0.6em'}}
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  tags: formData.tags.filter((_, i) => i !== index)
                                });
                              }}
                            ></button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">SEO Keywords</label>
                      <div className="input-group mb-2">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Add SEO keyword"
                          value={seoKeywordInput}
                          onChange={(e) => setSeoKeywordInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (seoKeywordInput.trim() && !formData.seo_keywords.includes(seoKeywordInput.trim())) {
                                setFormData({
                                  ...formData,
                                  seo_keywords: [...formData.seo_keywords, seoKeywordInput.trim()]
                                });
                                setSeoKeywordInput('');
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => {
                            if (seoKeywordInput.trim() && !formData.seo_keywords.includes(seoKeywordInput.trim())) {
                              setFormData({
                                ...formData,
                                seo_keywords: [...formData.seo_keywords, seoKeywordInput.trim()]
                              });
                              setSeoKeywordInput('');
                            }
                          }}
                        >
                          Add
                        </button>
                      </div>
                      <div className="d-flex flex-wrap gap-1">
                        {formData.seo_keywords.map((keyword, index) => (
                          <span key={index} className="badge bg-success">
                            {keyword}
                            <button
                              type="button"
                              className="btn-close btn-close-white ms-1"
                              style={{fontSize: '0.6em'}}
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  seo_keywords: formData.seo_keywords.filter((_, i) => i !== index)
                                });
                              }}
                            ></button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Featured Image URL</label>
                      <input
                        type="url"
                        className="form-control"
                        placeholder="https://example.com/image.jpg"
                        value={formData.featured_image}
                        onChange={(e) => setFormData({...formData, featured_image: e.target.value})}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Content Statistics</label>
                      <div className="card">
                        <div className="card-body p-2">
                          <div className="row text-center">
                            <div className="col-6">
                              <div className="text-primary">
                                <strong>{wordCount}</strong>
                              </div>
                              <small className="text-muted">Words</small>
                            </div>
                            <div className="col-6">
                              <div className="text-success">
                                <strong>{readingTime}</strong>
                              </div>
                              <small className="text-muted">Min Read</small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="autoSaveCheck"
                          checked={autoSaveEnabled}
                          onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="autoSaveCheck">
                          <i className="fas fa-save me-1"></i>
                          Enable auto-save
                        </label>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label">Preview</label>
                      <div className="border rounded p-3 bg-light">
                        <h6>{formData.title || 'Content Title'}</h6>
                        <p className="text-muted small">
                          {formData.summary || 'Content summary will appear here...'}
                        </p>
                        {formData.featured_image && (
                          <img 
                            src={formData.featured_image} 
                            alt="Preview" 
                            className="img-fluid rounded mb-2"
                            style={{maxHeight: '100px', width: '100%', objectFit: 'cover'}}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                    </div>
                    
                    <div className="d-grid gap-2">
                      <button type="submit" className="btn btn-primary">
                        {editingContent ? 'Update Content' : 'Save as Draft'}
                      </button>
                      
                      {editingContent && (
                        <button 
                          type="button" 
                          className="btn btn-secondary"
                          onClick={() => {
                            setEditingContent(null);
                            setFormData(resetFormData());
                          }}
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div>
            <h4 className="mb-4">
              <i className="fas fa-chart-line me-2"></i>
              Content Analytics
            </h4>
            
            {analyticsData ? (
              <div>
                <div className="row mb-4">
                  <div className="col-md-4 mb-3">
                    <div className="card">
                      <div className="card-body text-center">
                        <h3 className="text-primary">{analyticsData.performance.total_views}</h3>
                        <p className="mb-0">Total Views</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="card">
                      <div className="card-body text-center">
                        <h3 className="text-success">{analyticsData.performance.total_likes}</h3>
                        <p className="mb-0">Total Likes</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="card">
                      <div className="card-body text-center">
                        <h3 className="text-info">{analyticsData.performance.avg_rating}</h3>
                        <p className="mb-0">Avg Rating</p>
                      </div>
                    </div>
                  </div>
                </div>

                {performanceInsights && (
                  <div className="row">
                    <div className="col-md-6">
                      <div className="card">
                        <div className="card-header">
                          <h5>Performance Insights</h5>
                        </div>
                        <div className="card-body">
                          {performanceInsights.recommendations.map((rec, index) => (
                            <div key={index} className="mb-3 p-3 border rounded">
                              <h6 className="text-primary">{rec.title}</h6>
                              <p className="mb-1">{rec.description}</p>
                              <small className="text-muted">{rec.action}</small>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card">
                        <div className="card-header">
                          <h5>Engagement Metrics</h5>
                        </div>
                        <div className="card-body">
                          <div className="mb-3">
                            <div className="d-flex justify-content-between">
                              <span>Avg Time on Page:</span>
                              <strong>{analyticsData.engagement.avg_time_on_page}</strong>
                            </div>
                          </div>
                          <div className="mb-3">
                            <div className="d-flex justify-content-between">
                              <span>Bounce Rate:</span>
                              <strong>{analyticsData.engagement.bounce_rate}</strong>
                            </div>
                          </div>
                          <div className="mb-3">
                            <div className="d-flex justify-content-between">
                              <span>Social Shares:</span>
                              <strong>{analyticsData.engagement.social_shares}</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="spinner-border text-primary mb-3" role="status">
                  <span className="visually-hidden">Loading analytics...</span>
                </div>
                <p>Loading analytics data...</p>
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && profile && (
          <div className="card">
            <div className="card-header">
              <h5>Writer Profile</h5>
            </div>
            <div className="card-body">
              <form onSubmit={updateProfile}>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Name</label>
                      <input type="text" className="form-control" value={profile.name} readOnly />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Email</label>
                      <input type="email" className="form-control" value={profile.email} readOnly />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Specialization</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={profile.specialization || ''}
                        onChange={(e) => setProfile({...profile, specialization: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Bio</label>
                      <textarea 
                        className="form-control" 
                        rows={5} 
                        value={profile.bio || ''}
                        onChange={(e) => setProfile({...profile, bio: e.target.value})}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Status</label>
                      <div>
                        <span className={`badge bg-${profile.is_approved ? 'success' : 'warning'}`}>
                          {profile.is_approved ? 'Approved' : 'Pending Approval'}
                        </span>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Rank</label>
                      <div>
                        <span className="badge bg-info">{profile.rank}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary">Update Profile</button>
              </form>
            </div>
          </div>
        )}

        {/* Success/Error Messages */}
        {success && (
          <div className="position-fixed top-0 end-0 p-3" style={{zIndex: 9999}}>
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              <i className="fas fa-check-circle me-2"></i>
              {success}
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setSuccess('')}
              ></button>
            </div>
          </div>
        )}

        {error && (
          <div className="position-fixed top-0 end-0 p-3" style={{zIndex: 9999}}>
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              <i className="fas fa-exclamation-circle me-2"></i>
              {error}
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setError('')}
              ></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
