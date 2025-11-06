'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useParent } from '@/contexts/ParentContext';

export default function CollectChildrenPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { childrenList, fetchChildren } = useParent();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (user.user_type !== 'parent') {
      router.push(user.user_type === 'adolescent' ? '/dashboard' : '/');
      return;
    }

    // If parent already has children, redirect to main dashboard
    if (childrenList && childrenList.length > 0) {
      router.push('/dashboard/parent');
      return;
    }
  }, [user, authLoading, childrenList, router]);

  const handleSkip = () => {
    router.push('/dashboard/parent');
  };

  const handleAddChildren = () => {
    router.push('/dashboard/parent?tab=add-child');
  };

  if (authLoading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-gradient">
        <div className="text-center">
          <div className="spinner-border text-primary mb-4" style={{ width: '4rem', height: '4rem' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="text-muted">Loading...</h5>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-vh-100 d-flex align-items-center" style={{
      background: 'linear-gradient(135deg, rgb(3, 5, 86) 0%, rgb(2, 25, 92) 100%)'
    }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card border-0 shadow-lg overflow-hidden">
              <div className="card-body p-5">
                {/* Header */}
                <div className="text-center mb-5">
                  <div className="mb-4">
                    <i className="fas fa-child fa-5x text-primary"></i>
                  </div>
                  <h1 className="display-6 fw-bold mb-3">Welcome to Your Family Dashboard</h1>
                  <p className="lead text-muted mb-4">
                    Get started by adding your children to monitor their health and wellness
                  </p>
                </div>

                {/* Feature Cards */}
                <div className="row mb-5">
                  <div className="col-md-6 mb-3">
                    <div className="feature-card p-4 border rounded-3 h-100 text-center">
                      <i className="fas fa-heartbeat fa-2x text-danger mb-3"></i>
                      <h5 className="fw-bold mb-2">Health Tracking</h5>
                      <p className="text-muted small">Monitor menstrual cycles and health metrics</p>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="feature-card p-4 border rounded-3 h-100 text-center">
                      <i className="fas fa-utensils fa-2x text-success mb-3"></i>
                      <h5 className="fw-bold mb-2">Nutrition</h5>
                      <p className="text-muted small">Track meals and nutritional intake</p>
                    </div>
                  </div>
                </div>

                <div className="row mb-5">
                  <div className="col-md-6 mb-3">
                    <div className="feature-card p-4 border rounded-3 h-100 text-center">
                      <i className="fas fa-calendar fa-2x text-info mb-3"></i>
                      <h5 className="fw-bold mb-2">Appointments</h5>
                      <p className="text-muted small">Schedule healthcare consultations</p>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="feature-card p-4 border rounded-3 h-100 text-center">
                      <i className="fas fa-lock fa-2x text-warning mb-3"></i>
                      <h5 className="fw-bold mb-2">Privacy</h5>
                      <p className="text-muted small">Secure family health information</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="d-grid gap-3">
                  <button
                    className="btn btn-primary btn-lg fw-bold"
                    onClick={handleAddChildren}
                    disabled={isLoading}
                  >
                    <i className="fas fa-plus me-2"></i>
                    Add Your First Child
                  </button>
                  <button
                    className="btn btn-outline-secondary btn-lg fw-bold"
                    onClick={handleSkip}
                    disabled={isLoading}
                  >
                    Skip for Now
                  </button>
                </div>

                {/* Info Text */}
                <p className="text-center text-muted mt-4 mb-0">
                  <small>
                    You can add children anytime from your dashboard. We'll help you get started in just a few steps.
                  </small>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .feature-card {
          transition: all 0.3s ease;
        }
        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}
