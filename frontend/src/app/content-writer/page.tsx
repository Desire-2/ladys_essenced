'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';

// Interfaces
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

interface Module {
  id: number;
  course_id: number;
  title: string;
  description: string;
  order: number;
  order_index?: number;
  duration: string;
  video_url?: string;
  resources?: string[];
  status: string;
  views: number;
  completion_rate: number;
  chapters?: Chapter[];
  created_at: string;
  updated_at: string;
}

interface Chapter {
  id: number;
  module_id: number;
  title: string;
  content: string;
  content_type: 'video' | 'text' | 'quiz' | 'assignment' | 'audio' | 'document';
  order: number;
  order_index?: number;
  duration: string;
  video_url?: string;
  audio_url?: string;
  document_url?: string;
  resources?: string[];
  status: string;
  views: number;
  completion_rate: number;
  created_at: string;
  updated_at: string;
}

interface Course {
  id: number;
  title: string;
  description: string;
  instructor: string;
  category: string;
  category_id: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  price: number;
  featured_image: string;
  status: string;
  enrollment_count: number;
  rating: number;
  created_at: string;
  updated_at: string;
  modules: Module[];
}

// Modal component props interface
interface ContentViewModalProps {
  content: ContentItem | null;
  onClose: () => void;
  onRequestEdit: () => void;
  showRequestEdit: boolean;
  requestEditLoading: boolean;
}

interface CourseViewModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  onRequestEdit: (course: Course) => void;
}

// Modal component for viewing content
function ContentViewModal({ content, onClose, onRequestEdit, showRequestEdit, requestEditLoading }: ContentViewModalProps) {
  if (!content) return null;
  return (
    <div className="modal fade show" style={{display: 'block', background: 'rgba(0,0,0,0.5)'}} tabIndex={-1}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">View Content</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <h4>{content.title}</h4>
            <p className="text-muted">{content.summary}</p>
            <div className="mb-2">
              <span className={`badge bg-${
                content.status === 'published' ? 'success' : 
                content.status === 'draft' ? 'warning' : 
                content.status === 'pending_review' ? 'info' : 
                content.status === 'rejected' ? 'danger' : 'secondary'
              }`}>
                {content.status === 'pending_review' ? 'Pending Review' : content.status}
              </span>
              <span className="badge bg-secondary ms-2">{content.category}</span>
            </div>
            {content.featured_image && (
              <img src={content.featured_image} alt="Featured" className="img-fluid rounded mb-3" style={{maxHeight: 200}} />
            )}
            <div style={{whiteSpace: 'pre-line'}}>{content.content}</div>
            <div className="mt-3">
              <strong>Tags:</strong> {content.tags?.join(', ') || 'None'}
            </div>
            <div className="mt-1">
              <strong>SEO Keywords:</strong> {content.seo_keywords?.join(', ') || 'None'}
            </div>
            <div className="mt-1">
              <strong>Created:</strong> {new Date(content.created_at).toLocaleString()}
            </div>
            <div className="mt-1">
              <strong>Last Updated:</strong> {new Date(content.updated_at).toLocaleString()}
            </div>
          </div>
          <div className="modal-footer">
            {showRequestEdit && (
              <button className="btn btn-warning me-auto" onClick={onRequestEdit} disabled={requestEditLoading}>
                {requestEditLoading ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="fas fa-edit me-2"></i>}
                Request Edit
              </button>
            )}
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Course View Modal Component
function CourseViewModal({ course, isOpen, onClose, onRequestEdit }: CourseViewModalProps) {
  if (!course || !isOpen) return null;
  return (
    <div className="modal fade show" style={{display: 'block', background: 'rgba(0,0,0,0.5)'}} tabIndex={-1}>
      <div className="modal-dialog modal-xl modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">View Course</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body" style={{maxHeight: '80vh', overflowY: 'auto'}}>
            <div className="row">
              <div className="col-md-8">
                <h4>{course.title}</h4>
                <p className="text-muted">{course.description}</p>
                <div className="mb-3">
                  <span className={`badge bg-${
                    course.status === 'published' ? 'success' : 
                    course.status === 'draft' ? 'warning' : 
                    course.status === 'pending_review' ? 'info' : 
                    course.status === 'rejected' ? 'danger' : 'secondary'
                  }`}>
                    {course.status === 'pending_review' ? 'Pending Review' : course.status}
                  </span>
                  <span className="badge bg-primary ms-2">{course.level}</span>
                  <span className="badge bg-secondary ms-2">{course.category}</span>
                </div>
                
                {/* Course Modules */}
                <h5>Course Modules</h5>
                {course.modules && course.modules.length > 0 ? (
                  <div className="accordion" id="moduleAccordion">
                    {course.modules.map((module, moduleIndex) => (
                      <div key={module.id} className="accordion-item">
                        <h2 className="accordion-header">
                          <button 
                            className="accordion-button collapsed" 
                            type="button" 
                            data-bs-toggle="collapse" 
                            data-bs-target={`#module-${module.id}`}
                          >
                            Module {moduleIndex + 1}: {module.title}
                            <span className="badge bg-info ms-2">{module.chapters?.length || 0} chapters</span>
                          </button>
                        </h2>
                        <div id={`module-${module.id}`} className="accordion-collapse collapse">
                          <div className="accordion-body">
                            <p>{module.description}</p>
                            <p><strong>Duration:</strong> {module.duration}</p>
                            
                            {/* Module Chapters */}
                            {module.chapters && module.chapters.length > 0 && (
                              <div className="mt-3">
                                <h6>Chapters:</h6>
                                <div className="list-group">
                                  {module.chapters.map((chapter, chapterIndex) => (
                                    <div key={chapter.id} className="list-group-item">
                                      <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                          <h6 className="mb-1">Chapter {chapterIndex + 1}: {chapter.title}</h6>
                                          <p className="mb-1 text-muted">Type: {chapter.content_type}</p>
                                          <small>Duration: {chapter.duration}</small>
                                        </div>
                                        <span className="badge bg-light text-dark">{chapter.views} views</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">No modules added yet.</p>
                )}
              </div>
              
              <div className="col-md-4">
                {course.featured_image && (
                  <img src={course.featured_image} alt="Course" className="img-fluid rounded mb-3" />
                )}
                <div className="card">
                  <div className="card-body">
                    <h6>Course Details</h6>
                    <p><strong>Instructor:</strong> {course.instructor}</p>
                    <p><strong>Price:</strong> ${course.price}</p>
                    <p><strong>Duration:</strong> {course.duration}</p>
                    <p><strong>Enrollments:</strong> {course.enrollment_count}</p>
                    <p><strong>Rating:</strong> {course.rating}/5</p>
                    <p><strong>Created:</strong> {new Date(course.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button 
              className="btn btn-warning me-auto" 
              onClick={() => course && onRequestEdit(course)}
            >
              <i className="fas fa-edit me-2"></i>
              Edit Course
            </button>
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
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
  course_stats: {
    total_courses: number;
    published_courses: number;
    draft_courses: number;
    total_modules: number;
    total_chapters: number;
    total_enrollments: number;
    avg_course_rating: number;
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
    type: 'article' | 'course';
  }>;
  monthly_performance: Array<{
    month: string;
    content_created: number;
    courses_created: number;
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
  // Modal state for viewing content
  const [viewedContent, setViewedContent] = useState<ContentItem | null>(null);
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [requestEditLoading, setRequestEditLoading] = useState(false);

  // Course creation state
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseFormData, setCourseFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    duration: '',
    price: 0,
    featured_image: ''
  });

  // Module and Chapter management
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [workingOnContent, setWorkingOnContent] = useState<'module' | 'chapter' | null>(null);
  const [showModuleEditor, setShowModuleEditor] = useState(false);
  const [showChapterEditor, setShowChapterEditor] = useState(false);
  
  // Module form data
  const [moduleFormData, setModuleFormData] = useState({
    title: '',
    description: '',
    duration: '',
    order_index: 0
  });

  // Chapter form data
  const [chapterFormData, setChapterFormData] = useState({
    title: '',
    content: '',
    content_type: 'text' as 'video' | 'text' | 'quiz' | 'assignment' | 'audio' | 'document',
    duration: '',
    video_url: '',
    audio_url: '',
    document_url: '',
    order_index: 0
  });
  // Handler for requesting edit
  const handleRequestEdit = async (content: ContentItem) => {
    setRequestEditLoading(true);
    try {
      // Here you could make an API call to request edit permission or notify admin
      // For now, just show a success message
      setSuccess('Edit request sent to admin!');
    } catch (err) {
      setError('Failed to request edit.');
    } finally {
      setRequestEditLoading(false);
    }
  };
  // API utility function
  const buildContentWriterApiUrl = (endpoint: string) => {
    return `/api/content-writer${endpoint}`;
  };

  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<WriterStats | null>(null);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [contentTypeFilter, setContentTypeFilter] = useState('all'); // New filter for content type
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

  const loadCourses = useCallback(async () => {
    try {
      const data = await makeApiCall(buildContentWriterApiUrl('/courses'));
      setCourses(data.courses || []);
    } catch (err: any) {
      console.error('Failed to load courses:', err);
      setError(err.message || 'Failed to load courses');
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
      setActionLoading(prev => ({...prev, [`submit-${contentId}`]: true}));
      
      await makeApiCall(buildContentWriterApiUrl(`/content/${contentId}/submit`), {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'pending_review'
        })
      });

      // Update local state immediately for better UX
      setContent(prevContent => 
        prevContent.map(item => 
          item.id === contentId 
            ? { ...item, status: 'pending_review' }
            : item
        )
      );

      setSuccess('Content submitted for review successfully!');
      
      // Reload data to ensure consistency
      await loadContent();
      await loadDashboardData();
      
    } catch (err: any) {
      console.error('Failed to submit content:', err);
      setError(err.message || 'Failed to submit content for review');
    } finally {
      setActionLoading(prev => ({...prev, [`submit-${contentId}`]: false}));
    }
  };

  const deleteContent = async (contentId: number) => {
    if (!window.confirm('Are you sure you want to delete this content? This action cannot be undone.')) return;

    try {
      setActionLoading(prev => ({...prev, [`delete-${contentId}`]: true}));
      
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
      setActionLoading(prev => ({...prev, [`delete-${contentId}`]: false}));
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
    
    // Set appropriate message based on content status
    if (item.status === 'pending_review') {
      setSuccess(`Viewing content in review: ${item.title}`);
    } else if (item.status === 'published') {
      setSuccess(`Viewing published content: ${item.title}`);
    } else {
      setSuccess(`Editing: ${item.title}`);
    }
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

  // Course Management Functions
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      await makeApiCall(buildContentWriterApiUrl('/courses'), {
        method: 'POST',
        body: JSON.stringify(courseFormData)
      });

      setCourseFormData({
        title: '',
        description: '',
        category_id: '',
        level: 'beginner',
        duration: '',
        price: 0,
        featured_image: ''
      });
      setSuccess('Course created successfully!');
      
      loadCourses();
      loadDashboardData();
      
    } catch (err: any) {
      console.error('Failed to create course:', err);
      setError(err.message || 'Failed to create course');
    }
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;

    try {
      setError('');
      await makeApiCall(buildContentWriterApiUrl(`/courses/${editingCourse.id}`), {
        method: 'PUT',
        body: JSON.stringify(courseFormData)
      });

      setCourseFormData({
        title: '',
        description: '',
        category_id: '',
        level: 'beginner',
        duration: '',
        price: 0,
        featured_image: ''
      });
      setEditingCourse(null);
      setSuccess('Course updated successfully!');
      
      loadCourses();
      loadDashboardData();
      
    } catch (err: any) {
      console.error('Failed to update course:', err);
      setError(err.message || 'Failed to update course');
    }
  };

  const submitCourseForReview = async (courseId: number) => {
    try {
      setActionLoading(prev => ({...prev, [`submit-course-${courseId}`]: true}));
      
      await makeApiCall(buildContentWriterApiUrl(`/courses/${courseId}/submit`), {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'pending_review'
        })
      });

      // Update local state immediately for better UX
      setCourses(prevCourses => 
        prevCourses.map(course => 
          course.id === courseId 
            ? { ...course, status: 'pending_review' }
            : course
        )
      );

      setSuccess('Course submitted for review successfully!');
      
      // Reload data to ensure consistency
      await loadCourses();
      await loadDashboardData();
      
    } catch (err: any) {
      console.error('Failed to submit course:', err);
      setError(err.message || 'Failed to submit course for review');
    } finally {
      setActionLoading(prev => ({...prev, [`submit-course-${courseId}`]: false}));
    }
  };

  const deleteCourse = async (courseId: number) => {
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;

    try {
      setActionLoading(prev => ({...prev, [`delete-course-${courseId}`]: true}));
      
      await makeApiCall(buildContentWriterApiUrl(`/courses/${courseId}`), {
        method: 'DELETE'
      });

      setSuccess('Course deleted successfully!');
      loadCourses();
      loadDashboardData();
      
    } catch (err: any) {
      console.error('Failed to delete course:', err);
      setError(err.message || 'Failed to delete course');
    } finally {
      setActionLoading(prev => ({...prev, [`delete-course-${courseId}`]: false}));
    }
  };

  const startEditingCourse = (course: Course) => {
    setEditingCourse(course);
    setCourseFormData({
      title: course.title,
      description: course.description,
      category_id: course.category_id?.toString() || '',
      level: course.level,
      duration: course.duration,
      price: course.price,
      featured_image: course.featured_image || ''
    });
    setActiveTab('create-course');
    
    // Set appropriate message based on course status
    if (course.status === 'pending_review') {
      setSuccess(`Viewing course in review: ${course.title}`);
    } else if (course.status === 'published') {
      setSuccess(`Viewing published course: ${course.title}`);
    } else {
      setSuccess(`Editing course: ${course.title}`);
    }
  };

  // Course content management functions
  const selectCourseForWork = (course: Course) => {
    setSelectedCourse(course);
    setModules(course.modules || []);
    setActiveTab('course-work');
  };

  const selectModuleForWork = (module: Module) => {
    setSelectedModule(module);
    setChapters(module.chapters || []);
    setWorkingOnContent('module');
    setModuleFormData({
      title: module.title,
      description: module.description,
      duration: module.duration,
      order_index: module.order
    });
    setShowModuleEditor(true);
  };

  const selectChapterForWork = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setWorkingOnContent('chapter');
    setChapterFormData({
      title: chapter.title,
      content: chapter.content,
      content_type: chapter.content_type,
      duration: chapter.duration,
      video_url: chapter.video_url || '',
      audio_url: chapter.audio_url || '',
      document_url: chapter.document_url || '',
      order_index: chapter.order
    });
    setShowChapterEditor(true);
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
                  className={`nav-link ${activeTab === 'courses' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('courses')}
                >
                  <i className="fas fa-graduation-cap me-2"></i>
                  My Courses
                </button>
              </li>
              <li className="nav-item mb-2 mb-md-0">
                <button 
                  className={`nav-link ${activeTab === 'course-work' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('course-work')}
                  disabled={!selectedCourse}
                >
                  <i className="fas fa-tasks me-2"></i>
                  Course Work
                  {selectedCourse && <span className="badge bg-info ms-1">{selectedCourse.title.substring(0, 10)}...</span>}
                </button>
              </li>
              <li className="nav-item mb-2 mb-md-0">
                <button 
                  className={`nav-link ${activeTab === 'create-course' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('create-course')}
                >
                  <i className="fas fa-plus-circle me-2"></i>
                  {editingCourse ? 'Edit Course' : 'Create Course'}
                </button>
              </li>
              <li className="nav-item mb-2 mb-md-0">
                <button 
                  className={`nav-link ${activeTab === 'create' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('create')}
                >
                  <i className="fas fa-plus me-2"></i>
                  Create Article
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
                                item.status === 'pending_review' ? 'info' : 
                                item.status === 'rejected' ? 'danger' : 'secondary'
                              }`}>
                                {item.status === 'pending_review' ? 'Pending Review' : item.status}
                              </span>
                            </td>
                            <td>{item.views}</td>
                            <td>{new Date(item.created_at).toLocaleDateString()}</td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                {item.status === 'pending_review' || item.status === 'published' ? (
                                  <button
                                    className="btn btn-outline-info"
                                    onClick={() => setViewedContent(item)}
                                  >
                                    View
                                  </button>
                                ) : (
                                  <button
                                    className="btn btn-outline-primary"
                                    onClick={() => startEditing(item)}
                                  >
                                    Edit
                                  </button>
                                )}
        {/* Content View Modal */}
        {viewedContent && (
          <ContentViewModal
            content={viewedContent}
            onClose={() => setViewedContent(null)}
            onRequestEdit={() => handleRequestEdit(viewedContent)}
            showRequestEdit={viewedContent.status === 'pending_review' || viewedContent.status === 'published'}
            requestEditLoading={requestEditLoading}
          />
        )}
                                {item.status === 'draft' && (
                                  <button 
                                    className="btn btn-outline-success"
                                    onClick={() => submitForReview(item.id)}
                                    disabled={actionLoading[`submit-${item.id}`] || item.status !== 'draft'}
                                  >
                                    {actionLoading[`submit-${item.id}`] ? (
                                      <>
                                        <span className="spinner-border spinner-border-sm me-2" />
                                        Submitting...
                                      </>
                                    ) : (
                                      'Submit for Review'
                                    )}
                                  </button>
                                )}
                                {(item.status === 'draft' || item.status === 'rejected') && (
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
                                )}
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

        {/* My Courses Tab */}
        {activeTab === 'courses' && (
          <div>
            <div className="row mb-4">
              <div className="col-12 d-flex justify-content-between align-items-center">
                <h4><i className="fas fa-graduation-cap me-2"></i>My Courses</h4>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setEditingCourse(null);
                    setCourseFormData({
                      title: '',
                      description: '',
                      category_id: '',
                      level: 'beginner',
                      duration: '',
                      price: 0,
                      featured_image: ''
                    });
                    setActiveTab('create-course');
                  }}
                >
                  <i className="fas fa-plus me-2"></i>Create New Course
                </button>
              </div>
            </div>

            {/* Course Cards */}
            <div className="row">
              {courses.map((course) => (
                <div key={course.id} className="col-lg-6 col-xl-4 mb-4">
                  <div className="card h-100">
                    {course.featured_image && (
                      <img 
                        src={course.featured_image} 
                        className="card-img-top" 
                        alt={course.title}
                        style={{ height: '200px', objectFit: 'cover' }}
                      />
                    )}
                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title">{course.title}</h5>
                      <p className="card-text text-muted small mb-2">
                        <i className="fas fa-signal me-1"></i>{course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                        <span className="mx-2">•</span>
                        <i className="fas fa-clock me-1"></i>{course.duration}
                        {course.price > 0 && (
                          <>
                            <span className="mx-2">•</span>
                            <i className="fas fa-dollar-sign me-1"></i>${course.price}
                          </>
                        )}
                      </p>
                      <p className="card-text flex-grow-1">
                        {course.description.length > 100 
                          ? `${course.description.substring(0, 100)}...` 
                          : course.description
                        }
                      </p>
                      
                      <div className="mb-3">
                        <span className={`badge ${
                          course.status === 'published' ? 'bg-success' :
                          course.status === 'pending_review' ? 'bg-warning' :
                          'bg-secondary'
                        }`}>
                          {course.status === 'pending_review' ? 'Pending Review' : 
                           course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                        </span>
                      </div>

                      <div className="mt-auto">
                        <div className="d-grid gap-2 mb-2">
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => selectCourseForWork(course)}
                          >
                            <i className="fas fa-tasks me-1"></i>Work on Course
                          </button>
                        </div>
                        
                        <div className="btn-group w-100" role="group">
                          <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => {
                              setViewingCourse(course);
                              setShowCourseModal(true);
                            }}
                          >
                            <i className="fas fa-eye me-1"></i>View
                          </button>
                          
                          <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => startEditingCourse(course)}
                          >
                            <i className="fas fa-edit me-1"></i>Edit
                          </button>

                          {course.status === 'draft' && (
                            <button
                              className="btn btn-outline-success btn-sm"
                              onClick={() => submitCourseForReview(course.id)}
                              disabled={actionLoading[`submit-course-${course.id}`]}
                            >
                              {actionLoading[`submit-course-${course.id}`] ? (
                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                              ) : (
                                <i className="fas fa-paper-plane me-1"></i>
                              )}
                              Submit
                            </button>
                          )}

                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => deleteCourse(course.id)}
                            disabled={actionLoading[`delete-course-${course.id}`]}
                          >
                            {actionLoading[`delete-course-${course.id}`] ? (
                              <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                            ) : (
                              <i className="fas fa-trash me-1"></i>
                            )}
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {courses.length === 0 && (
              <div className="text-center py-5">
                <i className="fas fa-graduation-cap fa-3x text-muted mb-3"></i>
                <h5 className="text-muted">No courses yet</h5>
                <p className="text-muted mb-4">Start creating your first course to share knowledge with learners!</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setEditingCourse(null);
                    setCourseFormData({
                      title: '',
                      description: '',
                      category_id: '',
                      level: 'beginner',
                      duration: '',
                      price: 0,
                      featured_image: ''
                    });
                    setActiveTab('create-course');
                  }}
                >
                  <i className="fas fa-plus me-2"></i>Create Your First Course
                </button>
              </div>
            )}
          </div>
        )}

        {/* Course Work Tab */}
        {activeTab === 'course-work' && selectedCourse && (
          <div>
            <div className="row mb-4">
              <div className="col-12">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4><i className="fas fa-tasks me-2"></i>Working on: {selectedCourse.title}</h4>
                    <p className="text-muted mb-0">Manage modules and chapters for this course</p>
                  </div>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setSelectedCourse(null);
                      setSelectedModule(null);
                      setSelectedChapter(null);
                      setActiveTab('courses');
                    }}
                  >
                    <i className="fas fa-arrow-left me-2"></i>Back to Courses
                  </button>
                </div>
              </div>
            </div>

            <div className="row">
              {/* Modules List */}
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5><i className="fas fa-layer-group me-2"></i>Modules</h5>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setSelectedModule(null);
                        setModuleFormData({
                          title: '',
                          description: '',
                          duration: '',
                          order_index: modules.length + 1
                        });
                        setShowModuleEditor(true);
                      }}
                    >
                      <i className="fas fa-plus me-1"></i>Add Module
                    </button>
                  </div>
                  <div className="card-body">
                    {modules.length > 0 ? (
                      <div className="list-group">
                        {modules.map((module, index) => (
                          <div key={module.id} className="list-group-item">
                            <div className="d-flex justify-content-between align-items-start">
                              <div className="flex-grow-1">
                                <h6 className="mb-1">
                                  Module {index + 1}: {module.title}
                                  <span className="badge bg-info ms-2">{module.chapters?.length || 0} chapters</span>
                                </h6>
                                <p className="mb-1 text-muted small">{module.description}</p>
                                <small className="text-muted">Duration: {module.duration}</small>
                              </div>
                              <div className="btn-group btn-group-sm">
                                <button
                                  className="btn btn-outline-primary"
                                  onClick={() => selectModuleForWork(module)}
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button
                                  className="btn btn-outline-success"
                                  onClick={() => {
                                    setSelectedModule(module);
                                    setChapters(module.chapters || []);
                                  }}
                                >
                                  <i className="fas fa-list"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <i className="fas fa-layer-group fa-2x text-muted mb-3"></i>
                        <p className="text-muted">No modules yet</p>
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            setSelectedModule(null);
                            setModuleFormData({
                              title: '',
                              description: '',
                              duration: '',
                              order_index: 1
                            });
                            setShowModuleEditor(true);
                          }}
                        >
                          <i className="fas fa-plus me-2"></i>Create First Module
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Chapters List */}
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5>
                      <i className="fas fa-book me-2"></i>Chapters
                      {selectedModule && <span className="text-muted"> - {selectedModule.title}</span>}
                    </h5>
                    {selectedModule && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setSelectedChapter(null);
                          setChapterFormData({
                            title: '',
                            content: '',
                            content_type: 'text',
                            duration: '',
                            video_url: '',
                            audio_url: '',
                            document_url: '',
                            order_index: chapters.length + 1
                          });
                          setShowChapterEditor(true);
                        }}
                      >
                        <i className="fas fa-plus me-1"></i>Add Chapter
                      </button>
                    )}
                  </div>
                  <div className="card-body">
                    {selectedModule ? (
                      chapters.length > 0 ? (
                        <div className="list-group">
                          {chapters.map((chapter, index) => (
                            <div key={chapter.id} className="list-group-item">
                              <div className="d-flex justify-content-between align-items-start">
                                <div className="flex-grow-1">
                                  <h6 className="mb-1">
                                    Chapter {index + 1}: {chapter.title}
                                    <span className="badge bg-secondary ms-2">{chapter.content_type}</span>
                                  </h6>
                                  <small className="text-muted">Duration: {chapter.duration}</small>
                                </div>
                                <div className="btn-group btn-group-sm">
                                  <button
                                    className="btn btn-outline-primary"
                                    onClick={() => selectChapterForWork(chapter)}
                                  >
                                    <i className="fas fa-edit"></i>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <i className="fas fa-book fa-2x text-muted mb-3"></i>
                          <p className="text-muted">No chapters in this module</p>
                          <button
                            className="btn btn-primary"
                            onClick={() => {
                              setSelectedChapter(null);
                              setChapterFormData({
                                title: '',
                                content: '',
                                content_type: 'text',
                                duration: '',
                                video_url: '',
                                audio_url: '',
                                document_url: '',
                                order_index: 1
                              });
                              setShowChapterEditor(true);
                            }}
                          >
                            <i className="fas fa-plus me-2"></i>Create First Chapter
                          </button>
                        </div>
                      )
                    ) : (
                      <div className="text-center py-4 text-muted">
                        <i className="fas fa-arrow-left fa-2x mb-3"></i>
                        <p>Select a module to view chapters</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create/Edit Course Tab */}
        {activeTab === 'create-course' && (
          <div>
            <div className="row">
              <div className="col-lg-8 mx-auto">
                <div className="card">
                  <div className="card-header">
                    <h4 className="mb-0">
                      <i className="fas fa-graduation-cap me-2"></i>
                      {editingCourse ? 'Edit Course' : 'Create New Course'}
                    </h4>
                  </div>
                  <div className="card-body">
                    <form onSubmit={editingCourse ? handleUpdateCourse : handleCreateCourse}>
                      <div className="mb-3">
                        <label htmlFor="courseTitle" className="form-label">Course Title *</label>
                        <input
                          type="text"
                          className="form-control"
                          id="courseTitle"
                          value={courseFormData.title}
                          onChange={(e) => setCourseFormData({...courseFormData, title: e.target.value})}
                          required
                          placeholder="Enter course title..."
                        />
                      </div>

                      <div className="mb-3">
                        <label htmlFor="courseDescription" className="form-label">Course Description *</label>
                        <textarea
                          className="form-control"
                          id="courseDescription"
                          rows={4}
                          value={courseFormData.description}
                          onChange={(e) => setCourseFormData({...courseFormData, description: e.target.value})}
                          required
                          placeholder="Describe what students will learn in this course..."
                        ></textarea>
                      </div>

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label htmlFor="courseLevel" className="form-label">Course Level *</label>
                          <select
                            className="form-select"
                            id="courseLevel"
                            value={courseFormData.level}
                            onChange={(e) => setCourseFormData({...courseFormData, level: e.target.value as 'beginner' | 'intermediate' | 'advanced'})}
                            required
                          >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                          </select>
                        </div>

                        <div className="col-md-6 mb-3">
                          <label htmlFor="courseDuration" className="form-label">Duration *</label>
                          <input
                            type="text"
                            className="form-control"
                            id="courseDuration"
                            value={courseFormData.duration}
                            onChange={(e) => setCourseFormData({...courseFormData, duration: e.target.value})}
                            required
                            placeholder="e.g., 4 weeks, 2 hours, 10 sessions"
                          />
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label htmlFor="coursePrice" className="form-label">Price (USD)</label>
                          <input
                            type="number"
                            className="form-control"
                            id="coursePrice"
                            min="0"
                            step="0.01"
                            value={courseFormData.price}
                            onChange={(e) => setCourseFormData({...courseFormData, price: parseFloat(e.target.value) || 0})}
                            placeholder="0.00 for free course"
                          />
                        </div>

                        <div className="col-md-6 mb-3">
                          <label htmlFor="courseFeaturedImage" className="form-label">Featured Image URL</label>
                          <input
                            type="url"
                            className="form-control"
                            id="courseFeaturedImage"
                            value={courseFormData.featured_image}
                            onChange={(e) => setCourseFormData({...courseFormData, featured_image: e.target.value})}
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>
                      </div>

                      <div className="d-flex gap-2">
                        <button 
                          type="submit" 
                          className="btn btn-primary"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              {editingCourse ? 'Updating...' : 'Creating...'}
                            </>
                          ) : (
                            <>
                              <i className={`fas ${editingCourse ? 'fa-save' : 'fa-plus'} me-2`}></i>
                              {editingCourse ? 'Update Course' : 'Create Course'}
                            </>
                          )}
                        </button>
                        
                        <button 
                          type="button" 
                          className="btn btn-secondary"
                          onClick={() => {
                            setEditingCourse(null);
                            setCourseFormData({
                              title: '',
                              description: '',
                              category_id: '',
                              level: 'beginner',
                              duration: '',
                              price: 0,
                              featured_image: ''
                            });
                            setActiveTab('courses');
                          }}
                        >
                          <i className="fas fa-times me-2"></i>Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create/Edit Content Tab */}
        {activeTab === 'create' && (
          <div className="card">
            <div className="card-header">
              <h5>
                {editingContent 
                  ? (editingContent.status === 'pending_review' || editingContent.status === 'published') 
                    ? `View Content - ${editingContent.status === 'pending_review' ? 'Pending Review' : 'Published'}`
                    : 'Edit Content'
                  : 'Create New Content'
                }
              </h5>
              {editingContent && (editingContent.status === 'pending_review' || editingContent.status === 'published') && (
                <div className="alert alert-info mt-2 mb-0">
                  <i className="fas fa-info-circle me-2"></i>
                  This content is {editingContent.status === 'pending_review' ? 'under review' : 'published'} and cannot be edited.
                </div>
              )}
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
                        readOnly={!!(editingContent && (editingContent.status === 'pending_review' || editingContent.status === 'published'))}
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
                        readOnly={!!(editingContent && (editingContent.status === 'pending_review' || editingContent.status === 'published'))}
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
                        readOnly={!!(editingContent && (editingContent.status === 'pending_review' || editingContent.status === 'published'))}
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
                        disabled={!!(editingContent && (editingContent.status === 'pending_review' || editingContent.status === 'published'))}
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
                          readOnly={!!(editingContent && (editingContent.status === 'pending_review' || editingContent.status === 'published'))}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (tagInput.trim() && !formData.tags.includes(tagInput.trim()) && 
                                  !(editingContent && (editingContent.status === 'pending_review' || editingContent.status === 'published'))) {
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
                          disabled={!!(editingContent && (editingContent.status === 'pending_review' || editingContent.status === 'published'))}
                          onClick={() => {
                            if (tagInput.trim() && !formData.tags.includes(tagInput.trim()) &&
                                !(editingContent && (editingContent.status === 'pending_review' || editingContent.status === 'published'))) {
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
                            {!(editingContent && (editingContent.status === 'pending_review' || editingContent.status === 'published')) && (
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
                            )}
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
                          readOnly={!!(editingContent && (editingContent.status === 'pending_review' || editingContent.status === 'published'))}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (seoKeywordInput.trim() && !formData.seo_keywords.includes(seoKeywordInput.trim()) &&
                                  !(editingContent && (editingContent.status === 'pending_review' || editingContent.status === 'published'))) {
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
                          disabled={!!(editingContent && (editingContent.status === 'pending_review' || editingContent.status === 'published'))}
                          onClick={() => {
                            if (seoKeywordInput.trim() && !formData.seo_keywords.includes(seoKeywordInput.trim()) &&
                                !(editingContent && (editingContent.status === 'pending_review' || editingContent.status === 'published'))) {
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
                            {!(editingContent && (editingContent.status === 'pending_review' || editingContent.status === 'published')) && (
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
                            )}
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
                        readOnly={!!(editingContent && (editingContent.status === 'pending_review' || editingContent.status === 'published'))}
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
                          disabled={!!(editingContent && (editingContent.status === 'pending_review' || editingContent.status === 'published'))}
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
                      {!(editingContent && (editingContent.status === 'pending_review' || editingContent.status === 'published')) && (
                        <button type="submit" className="btn btn-primary">
                          {editingContent ? 'Update Content' : 'Save as Draft'}
                        </button>
                      )}
                      
                      {editingContent && (
                        <button 
                          type="button" 
                          className="btn btn-secondary"
                          onClick={() => {
                            setEditingContent(null);
                            setFormData(resetFormData());
                          }}
                        >
                          {(editingContent.status === 'pending_review' || editingContent.status === 'published') ? 'Back to Content List' : 'Cancel Edit'}
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

        {/* Course View Modal */}
        <CourseViewModal
          course={viewingCourse}
          isOpen={showCourseModal}
          onClose={() => {
            setShowCourseModal(false);
            setViewingCourse(null);
          }}
          onRequestEdit={(course) => {
            setShowCourseModal(false);
            setViewingCourse(null);
            startEditingCourse(course);
          }}
        />

        {/* Module Editor Modal */}
        {showModuleEditor && (
          <div className="modal fade show" style={{display: 'block', background: 'rgba(0,0,0,0.5)'}} tabIndex={-1}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {selectedModule ? 'Edit Module' : 'Create New Module'}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowModuleEditor(false)}></button>
                </div>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  // Simulate creating/updating module
                  const newModule: Module = {
                    id: selectedModule?.id || Date.now(),
                    course_id: selectedCourse?.id || 1,
                    title: moduleFormData.title,
                    description: moduleFormData.description,
                    order: moduleFormData.order_index,
                    order_index: moduleFormData.order_index,
                    duration: moduleFormData.duration,
                    video_url: '',
                    resources: [],
                    status: 'draft',
                    views: 0,
                    completion_rate: 0,
                    chapters: selectedModule?.chapters || [],
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  };
                  
                  if (selectedModule) {
                    setModules(modules.map(m => m.id === selectedModule.id ? newModule : m));
                    setSuccess('Module updated successfully!');
                  } else {
                    setModules([...modules, newModule]);
                    setSuccess('Module created successfully!');
                  }
                  
                  setShowModuleEditor(false);
                  setSelectedModule(null);
                  setModuleFormData({
                    title: '',
                    description: '',
                    duration: '',
                    order_index: 0
                  });
                }}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Module Title *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={moduleFormData.title}
                        onChange={(e) => setModuleFormData({...moduleFormData, title: e.target.value})}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={moduleFormData.description}
                        onChange={(e) => setModuleFormData({...moduleFormData, description: e.target.value})}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Duration</label>
                      <input
                        type="text"
                        className="form-control"
                        value={moduleFormData.duration}
                        onChange={(e) => setModuleFormData({...moduleFormData, duration: e.target.value})}
                        placeholder="e.g., 2 weeks, 5 hours"
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModuleEditor(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {selectedModule ? 'Update Module' : 'Create Module'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Chapter Editor Modal */}
        {showChapterEditor && (
          <div className="modal fade show" style={{display: 'block', background: 'rgba(0,0,0,0.5)'}} tabIndex={-1}>
            <div className="modal-dialog modal-xl modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {selectedChapter ? 'Edit Chapter' : 'Create New Chapter'}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowChapterEditor(false)}></button>
                </div>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!selectedModule) return;
                  
                  // Simulate creating/updating chapter
                  const newChapter: Chapter = {
                    id: selectedChapter?.id || Date.now(),
                    module_id: selectedModule.id,
                    title: chapterFormData.title,
                    content: chapterFormData.content,
                    content_type: chapterFormData.content_type,
                    order: chapterFormData.order_index,
                    order_index: chapterFormData.order_index,
                    duration: chapterFormData.duration,
                    video_url: chapterFormData.video_url,
                    audio_url: chapterFormData.audio_url,
                    document_url: chapterFormData.document_url,
                    resources: [],
                    status: 'draft',
                    views: 0,
                    completion_rate: 0,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  };
                  
                  if (selectedChapter) {
                    setChapters(chapters.map(c => c.id === selectedChapter.id ? newChapter : c));
                    setSuccess('Chapter updated successfully!');
                  } else {
                    setChapters([...chapters, newChapter]);
                    setSuccess('Chapter created successfully!');
                  }
                  
                  setShowChapterEditor(false);
                  setSelectedChapter(null);
                  setChapterFormData({
                    title: '',
                    content: '',
                    content_type: 'text',
                    duration: '',
                    video_url: '',
                    audio_url: '',
                    document_url: '',
                    order_index: 0
                  });
                }}>
                  <div className="modal-body">
                    <div className="row">
                      <div className="col-md-8">
                        <div className="mb-3">
                          <label className="form-label">Chapter Title *</label>
                          <input
                            type="text"
                            className="form-control"
                            value={chapterFormData.title}
                            onChange={(e) => setChapterFormData({...chapterFormData, title: e.target.value})}
                            required
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Chapter Content</label>
                          <textarea
                            className="form-control"
                            rows={10}
                            value={chapterFormData.content}
                            onChange={(e) => setChapterFormData({...chapterFormData, content: e.target.value})}
                            placeholder="Enter chapter content, lesson instructions, or descriptions..."
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label">Content Type</label>
                          <select
                            className="form-select"
                            value={chapterFormData.content_type}
                            onChange={(e) => setChapterFormData({...chapterFormData, content_type: e.target.value as any})}
                          >
                            <option value="text">Text/Article</option>
                            <option value="video">Video</option>
                            <option value="audio">Audio</option>
                            <option value="document">Document</option>
                          </select>
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Duration</label>
                          <input
                            type="text"
                            className="form-control"
                            value={chapterFormData.duration}
                            onChange={(e) => setChapterFormData({...chapterFormData, duration: e.target.value})}
                            placeholder="e.g., 15 minutes"
                          />
                        </div>
                        {chapterFormData.content_type === 'video' && (
                          <div className="mb-3">
                            <label className="form-label">Video URL</label>
                            <input
                              type="url"
                              className="form-control"
                              value={chapterFormData.video_url}
                              onChange={(e) => setChapterFormData({...chapterFormData, video_url: e.target.value})}
                              placeholder="https://..."
                            />
                          </div>
                        )}
                        {chapterFormData.content_type === 'audio' && (
                          <div className="mb-3">
                            <label className="form-label">Audio URL</label>
                            <input
                              type="url"
                              className="form-control"
                              value={chapterFormData.audio_url}
                              onChange={(e) => setChapterFormData({...chapterFormData, audio_url: e.target.value})}
                              placeholder="https://..."
                            />
                          </div>
                        )}
                        {chapterFormData.content_type === 'document' && (
                          <div className="mb-3">
                            <label className="form-label">Document URL</label>
                            <input
                              type="url"
                              className="form-control"
                              value={chapterFormData.document_url}
                              onChange={(e) => setChapterFormData({...chapterFormData, document_url: e.target.value})}
                              placeholder="https://..."
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowChapterEditor(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {selectedChapter ? 'Update Chapter' : 'Create Chapter'}
                    </button>
                  </div>
                </form>
              </div>
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
