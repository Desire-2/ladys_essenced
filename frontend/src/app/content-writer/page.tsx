'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

interface WriterStats {
  content_stats: {
    total: number;
    published: number;
    draft: number;
    total_views: number;
  };
  recent_content: Array<{
    id: number;
    title: string;
    status: string;
    views: number;
    created_at: string;
  }>;
  monthly_performance: Array<{
    month: string;
    content_created: number;
    total_views: number;
  }>;
  writer_info: {
    specialization: string;
    is_approved: boolean;
  };
}

interface ContentItem {
  id: number;
  title: string;
  summary: string;
  status: string;
  views: number;
  category: string;
  created_at: string;
  updated_at: string;
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
  created_at: string;
}

export default function ContentWriterDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<WriterStats | null>(null);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [isCreating, setIsCreating] = useState(false);
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    category_id: '',
    tags: []
  });

  const router = useRouter();
  const { user, loading: authLoading, hasRole, getDashboardRoute } = useAuth();

  // Role-based access control
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    
    if (!authLoading && user && !hasRole('content_writer')) {
      // Redirect to appropriate dashboard based on user type
      const correctRoute = getDashboardRoute();
      router.push(correctRoute);
      return;
    }
    
    if (!authLoading && user && hasRole('content_writer')) {
      loadDashboardData();
      loadCategories();
    }
  }, [user, authLoading, router, hasRole, getDashboardRoute]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      const statsResponse = await fetch('/api/content-writer/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      setError('');
    } catch (err: any) {
      console.error('Failed to load content writer dashboard:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadContent = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/content-writer/content', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setContent(data.content);
      }
    } catch (err) {
      console.error('Failed to load content:', err);
    }
  };

  const loadCategories = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/content-writer/categories', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/content-writer/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  const handleCreateContent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/content-writer/content', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setFormData({ title: '', summary: '', content: '', category_id: '', tags: [] });
        setIsCreating(false);
        loadContent();
        loadDashboardData();
      }
    } catch (err) {
      console.error('Failed to create content:', err);
    }
  };

  const handleUpdateContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContent) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/content-writer/content/${editingContent.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setFormData({ title: '', summary: '', content: '', category_id: '', tags: [] });
        setEditingContent(null);
        loadContent();
        loadDashboardData();
      }
    } catch (err) {
      console.error('Failed to update content:', err);
    }
  };

  const submitForReview = async (contentId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/content-writer/content/${contentId}/submit`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        loadContent();
        loadDashboardData();
      }
    } catch (err) {
      console.error('Failed to submit content:', err);
    }
  };

  const deleteContent = async (contentId: number) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/content-writer/content/${contentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        loadContent();
        loadDashboardData();
      }
    } catch (err) {
      console.error('Failed to delete content:', err);
    }
  };

  const startEditing = (item: ContentItem) => {
    setEditingContent(item);
    setFormData({
      title: item.title,
      summary: item.summary,
      content: '', // You might want to fetch full content
      category_id: '', // Set from item.category
      tags: []
    });
  };

  useEffect(() => {
    if (activeTab === 'content') {
      loadContent();
    } else if (activeTab === 'profile') {
      loadProfile();
    }
  }, [activeTab]);

  if (loading) {
    return (
      <div className="container py-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Content Writer Dashboard</h1>
        <button 
          className="btn btn-outline-secondary"
          onClick={() => {
            localStorage.removeItem('access_token');
            router.push('/login');
          }}
        >
          Logout
        </button>
      </div>

      {/* Approval Status Alert */}
      {stats && !stats.writer_info.is_approved && (
        <div className="alert alert-warning mb-4" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          Your content writer account is pending approval. You can create content, but it won't be published until your account is approved.
        </div>
      )}

      {/* Navigation */}
      <div className="card mb-4">
        <div className="card-body">
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <a 
                className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`} 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('overview');
                }}
              >
                Overview
              </a>
            </li>
            <li className="nav-item">
              <a 
                className={`nav-link ${activeTab === 'content' ? 'active' : ''}`} 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('content');
                }}
              >
                My Content
              </a>
            </li>
            <li className="nav-item">
              <a 
                className={`nav-link ${activeTab === 'create' ? 'active' : ''}`} 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('create');
                }}
              >
                Create Content
              </a>
            </li>
            <li className="nav-item">
              <a 
                className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`} 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('profile');
                }}
              >
                Profile
              </a>
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
            <h5>My Content</h5>
            <button 
              className="btn btn-primary"
              onClick={() => setActiveTab('create')}
            >
              <i className="fas fa-plus me-2"></i>Create New
            </button>
          </div>
          
          <div className="card">
            <div className="card-body">
              {content.length > 0 ? (
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
                      {content.map(item => (
                        <tr key={item.id}>
                          <td>
                            <strong>{item.title}</strong>
                            <br />
                            <small className="text-muted">{item.summary?.substring(0, 50)}...</small>
                          </td>
                          <td>{item.category}</td>
                          <td>
                            <span className={`badge bg-${item.status === 'published' ? 'success' : item.status === 'draft' ? 'warning' : 'secondary'}`}>
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
                                >
                                  Submit
                                </button>
                              )}
                              <button 
                                className="btn btn-outline-danger"
                                onClick={() => deleteContent(item.id)}
                              >
                                Delete
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
                  <p>No content created yet</p>
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
                      className="form-control"
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
                    <label className="form-label">Preview</label>
                    <div className="border rounded p-3 bg-light">
                      <h6>{formData.title || 'Content Title'}</h6>
                      <p className="text-muted small">
                        {formData.summary || 'Content summary will appear here...'}
                      </p>
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
                          setFormData({ title: '', summary: '', content: '', category_id: '', tags: [] });
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

      {/* Profile Tab */}
      {activeTab === 'profile' && profile && (
        <div className="card">
          <div className="card-header">
            <h5>Writer Profile</h5>
          </div>
          <div className="card-body">
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
                  <input type="text" className="form-control" value={profile.specialization || ''} />
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Bio</label>
                  <textarea className="form-control" rows={5} value={profile.bio || ''}></textarea>
                </div>
                <div className="mb-3">
                  <label className="form-label">Status</label>
                  <div>
                    <span className={`badge bg-${profile.is_approved ? 'success' : 'warning'}`}>
                      {profile.is_approved ? 'Approved' : 'Pending Approval'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <button className="btn btn-primary">Update Profile</button>
          </div>
        </div>
      )}
    </div>
  );
}
