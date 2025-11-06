'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { useParent } from '../../../contexts/ParentContext';
import {
  Card,
  StatCard,
  Button,
  Tabs,
  Badge,
  EmptyState,
  Spinner,
  Alert,
  GradientBg,
  Avatar,
} from '../../../components/UILibrary';

/**
 * Enhanced Parent Dashboard
 * Modern, attractive UI for parents to manage and monitor children's health
 */

export default function EnhancedParentDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddChildModal, setShowAddChildModal] = useState(false);

  // Auth check
  useEffect(() => {
    if (!authLoading && (!user || user.user_type !== 'parent')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <GradientBg variant="subtle" className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </GradientBg>
    );
  }

  if (!user || user.user_type !== 'parent') {
    return null;
  }

  const tabs = [
    { label: '📊 Overview', value: 'overview', icon: '📊' },
    { label: '👶 My Children', value: 'children', icon: '👶' },
    { label: '🩺 Health Monitoring', value: 'monitoring', icon: '🩺' },
    { label: '📚 Resources', value: 'resources', icon: '📚' },
  ];

  return (
    <GradientBg variant="subtle" className="min-h-screen py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                Welcome, {user.full_name || user.name || 'Parent'}! 👋
              </h1>
              <p className="text-lg text-gray-600">
                Manage and monitor your children's health journey
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                localStorage.removeItem('access_token');
                router.push('/login');
              }}
              icon="🚪"
            >
              Logout
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              label="Children"
              value="3"
              icon="👶"
              color="primary"
            />
            <StatCard
              label="Active Cycles"
              value="2"
              icon="📅"
              color="success"
              trend={{ value: 33, direction: 'up' }}
            />
            <StatCard
              label="Appointments"
              value="5"
              icon="📋"
              color="warning"
            />
            <StatCard
              label="Health Score"
              value="92%"
              icon="❤️"
              color="info"
              trend={{ value: 5, direction: 'up' }}
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
            variant="pills"
          />
        </div>

        {/* Content Sections */}
        {activeTab === 'overview' && <OverviewSection />}
        {activeTab === 'children' && <ChildrenSection />}
        {activeTab === 'monitoring' && <MonitoringSection />}
        {activeTab === 'resources' && <ResourcesSection />}
      </div>
    </GradientBg>
  );
}

/**
 * Overview Section - Quick insights and recent activity
 */
function OverviewSection() {
  return (
    <div className="space-y-8">
      {/* Children Overview */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Children</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'Amara', age: 15, avatar: 'A', status: 'Active' },
            { name: 'Zainab', age: 13, avatar: 'Z', status: 'Active' },
            { name: 'Fátima', age: 14, avatar: 'F', status: 'Active' },
          ].map((child) => (
            <Card key={child.name} variant="elevated" padding="lg">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar size="lg" initials={child.avatar} />
                  <div>
                    <h3 className="font-bold text-gray-900">{child.name}</h3>
                    <p className="text-sm text-gray-500">{child.age} years old</p>
                  </div>
                </div>
                <Badge variant="success" icon="✓">
                  {child.status}
                </Badge>
              </div>

              <div className="space-y-3 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Last cycle log:</span>
                  <span className="font-semibold">5 days ago</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Next period:</span>
                  <span className="font-semibold text-rose-600">Mar 15</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Recent meals:</span>
                  <span className="font-semibold">8 this week</span>
                </div>
              </div>

              <Button fullWidth size="sm" variant="outline">
                View Details →
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
        <Card>
          <div className="space-y-4">
            {[
              {
                child: 'Amara',
                action: 'Logged cycle data',
                time: '2 hours ago',
                icon: '📅',
              },
              {
                child: 'Zainab',
                action: 'Completed meal logging',
                time: '5 hours ago',
                icon: '🍽️',
              },
              {
                child: 'Fátima',
                action: 'Appointment scheduled',
                time: 'Yesterday',
                icon: '📋',
              },
            ].map((activity, idx) => (
              <div key={idx} className="flex items-center gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <span className="text-3xl">{activity.icon}</span>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {activity.child} {activity.action}
                  </p>
                  <p className="text-sm text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Wellness Tips */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">📚 Wellness Tips This Week</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              title: 'Iron-Rich Foods During Period',
              description: 'Include more iron-rich foods like spinach, beans, and lean meat during heavy flow days.',
              icon: '🥗',
            },
            {
              title: 'Stay Hydrated',
              description: 'Drinking enough water helps reduce cramps and bloating symptoms.',
              icon: '💧',
            },
          ].map((tip, idx) => (
            <Card key={idx} className="border-l-4 border-l-rose-500">
              <div className="flex gap-4">
                <span className="text-4xl">{tip.icon}</span>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">{tip.title}</h4>
                  <p className="text-sm text-gray-600">{tip.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Children Section - Manage children
 */
function ChildrenSection() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Manage Children</h2>
        <Button onClick={() => setShowForm(!showForm)} icon="➕">
          {showForm ? 'Cancel' : 'Add Child'}
        </Button>
      </div>

      {showForm && (
        <Card className="border-l-4 border-l-green-500 bg-green-50">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Child</h3>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Full Name"
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                type="date"
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
              <option>Select Relationship...</option>
              <option>Daughter</option>
              <option>Sister</option>
              <option>Ward</option>
            </select>
            <div className="flex gap-3">
              <Button type="submit" size="sm">
                Save Child
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Children Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { name: 'Amara', age: 15, dob: 'Dec 15, 2008' },
          { name: 'Zainab', age: 13, dob: 'Aug 22, 2010' },
          { name: 'Fátima', age: 14, dob: 'Mar 10, 2009' },
        ].map((child) => (
          <Card key={child.name} variant="elevated">
            <div className="text-center mb-6">
              <Avatar size="xl" initials={child.name[0]} />
              <h3 className="text-xl font-bold text-gray-900 mt-4">{child.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{child.age} years old</p>
              <Badge variant="success" size="sm">
                ✓ Active
              </Badge>
            </div>

            <div className="space-y-2 text-sm mb-4 text-center">
              <p className="text-gray-600">DOB: {child.dob}</p>
              <p className="text-gray-600">Status: Good</p>
            </div>

            <div className="flex gap-2">
              <Button fullWidth size="sm" variant="primary">
                View Profile
              </Button>
              <Button fullWidth size="sm" variant="outline">
                Edit
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * Monitoring Section - Health data monitoring
 */
function MonitoringSection() {
  const [monitoringTab, setMonitoringTab] = useState('cycle');

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900">Health Monitoring</h2>

      <Tabs
        tabs={[
          { label: '📅 Cycle Tracking', value: 'cycle', icon: '📅' },
          { label: '🍽️ Nutrition', value: 'nutrition', icon: '🍽️' },
          { label: '📋 Appointments', value: 'appointments', icon: '📋' },
        ]}
        activeTab={monitoringTab}
        onChange={setMonitoringTab}
        variant="pills"
      />

      {monitoringTab === 'cycle' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cycle Stats */}
          {[
            { label: 'Last Period', value: 'Mar 5', color: 'primary' },
            { label: 'Cycle Length', value: '28 days', color: 'success' },
            { label: 'Next Period', value: 'Apr 2', color: 'warning' },
          ].map((stat, idx) => (
            <Card key={idx}>
              <p className="text-sm text-gray-600 mb-2">{stat.label}</p>
              <p className={`text-2xl font-bold ${
                stat.color === 'primary' ? 'text-rose-600' :
                stat.color === 'success' ? 'text-green-600' :
                'text-amber-600'
              }`}>
                {stat.value}
              </p>
            </Card>
          ))}
        </div>
      )}

      {monitoringTab === 'nutrition' && (
        <Card>
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900">Recent Meal Logs</h3>
            {['Amara logged breakfast', 'Zainab logged lunch', 'Fátima logged dinner'].map((log, idx) => (
              <div key={idx} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                <span className="text-2xl">🍽️</span>
                <p className="flex-1">{log}</p>
                <span className="text-sm text-gray-500">Today</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {monitoringTab === 'appointments' && (
        <Card>
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900">Upcoming Appointments</h3>
            {[
              { child: 'Amara', date: 'Mar 18', provider: 'Dr. Sarah', status: 'Confirmed' },
              { child: 'Zainab', date: 'Mar 20', provider: 'Dr. James', status: 'Pending' },
            ].map((appt, idx) => (
              <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-semibold text-gray-900">{appt.child}</p>
                  <p className="text-sm text-gray-600">{appt.provider} • {appt.date}</p>
                </div>
                <Badge variant={appt.status === 'Confirmed' ? 'success' : 'warning'}>
                  {appt.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/**
 * Resources Section - Educational content
 */
function ResourcesSection() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900">Health Resources & Education</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          {
            title: 'Understanding Menstrual Health',
            description: 'A comprehensive guide for parents about menstrual health.',
            category: 'Health Guide',
            icon: '📚',
          },
          {
            title: 'Nutrition During Menstruation',
            description: 'Learn about proper nutrition during different cycle phases.',
            category: 'Nutrition',
            icon: '🥗',
          },
          {
            title: 'Managing Cycle Symptoms',
            description: 'Tips and remedies for common menstrual symptoms.',
            category: 'Wellness',
            icon: '💪',
          },
          {
            title: 'Supporting Your Teen',
            description: 'How to communicate about health and reproductive wellness.',
            category: 'Parenting',
            icon: '💬',
          },
        ].map((resource, idx) => (
          <Card key={idx} variant="elevated" className="hover:shadow-lg transition-shadow">
            <div className="flex gap-4">
              <span className="text-4xl">{resource.icon}</span>
              <div className="flex-1">
                <div className="mb-2">
                  <Badge variant="primary" size="sm">
                    {resource.category}
                  </Badge>
                </div>
                <h4 className="font-bold text-gray-900 mb-2">{resource.title}</h4>
                <p className="text-sm text-gray-600 mb-4">{resource.description}</p>
                <Button size="sm" variant="outline">
                  Read More →
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Emergency Support */}
      <Card className="bg-red-50 border-l-4 border-l-red-500">
        <div className="flex items-start gap-4">
          <span className="text-4xl">🆘</span>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-2">Emergency Support</h3>
            <p className="text-gray-600 mb-4">
              If you have urgent health concerns, please contact your local healthcare provider or emergency services.
            </p>
            <Button size="sm" variant="danger">
              View Emergency Contacts
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
