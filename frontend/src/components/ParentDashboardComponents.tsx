/**
 * Modern Child Management Components
 * For the Parent Dashboard - Creative, attractive UI for managing children
 */

import React, { useState } from 'react';
import { Card, Button, Badge, Avatar, EmptyState } from '../UILibrary';

/**
 * ModernChildCard
 * Beautiful card displaying child information with quick actions
 */
export const ModernChildCard: React.FC<{
  child: {
    id: number;
    name: string;
    dateOfBirth: string;
    relationship?: string;
  };
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isSelected?: boolean;
}> = ({ child, onSelect, onEdit, onDelete, isSelected = false }) => {
  const calculateAge = (dob: string) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const age = calculateAge(child.dateOfBirth);
  const initials = child.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const getAgeGroup = (age: number) => {
    if (age < 12) return '👧 Child';
    if (age < 15) return '👱‍♀️ Early Teen';
    if (age < 18) return '👩 Teen';
    return '👨‍👩‍👧 Young Adult';
  };

  return (
    <Card
      variant="elevated"
      className={`cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-rose-500 shadow-lg' : 'hover:shadow-lg'
      }`}
      onClick={onSelect}
      padding="lg"
    >
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <Avatar size="xl" initials={initials} />
        </div>
        <h3 className="text-xl font-bold text-gray-900">{child.name}</h3>
        <p className="text-sm text-gray-500 mb-2">{age} years old</p>
        <Badge variant="success" size="sm">
          {getAgeGroup(age)}
        </Badge>
      </div>

      {/* Health Quick Stats */}
      <div className="space-y-2 mb-6 text-sm">
        <div className="flex justify-between px-3 py-2 bg-gray-50 rounded-lg">
          <span className="text-gray-600">📅 Cycles:</span>
          <span className="font-semibold text-gray-900">12</span>
        </div>
        <div className="flex justify-between px-3 py-2 bg-gray-50 rounded-lg">
          <span className="text-gray-600">🍽️ Meals:</span>
          <span className="font-semibold text-gray-900">48</span>
        </div>
        <div className="flex justify-between px-3 py-2 bg-gray-50 rounded-lg">
          <span className="text-gray-600">📋 Appointments:</span>
          <span className="font-semibold text-gray-900">3</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <Button size="sm" variant="primary" onClick={() => onSelect?.()}>
          View
        </Button>
        <Button size="sm" variant="outline" onClick={() => onEdit?.()}>
          Edit
        </Button>
        <Button size="sm" variant="danger" onClick={() => onDelete?.()}>
          Delete
        </Button>
      </div>
    </Card>
  );
};

/**
 * ChildHealthPanel
 * Displays comprehensive health data for a selected child
 */
export const ChildHealthPanel: React.FC<{
  child: {
    id: number;
    name: string;
  };
  cycleData?: any;
  mealData?: any;
  appointmentData?: any;
}> = ({ child, cycleData, mealData, appointmentData }) => {
  const [activeTab, setActiveTab] = useState('cycle');

  return (
    <Card variant="elevated">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-900">{child.name}'s Health</h3>
        <Badge variant="success">Active Monitoring</Badge>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[
          { label: '📅 Cycles', value: 'cycle' },
          { label: '🍽️ Meals', value: 'meals' },
          { label: '📋 Appointments', value: 'appointments' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`pb-3 px-4 font-semibold transition-all border-b-2 ${
              activeTab === tab.value
                ? 'text-rose-600 border-rose-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'cycle' && cycleData && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-rose-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Last Period</p>
              <p className="text-2xl font-bold text-rose-600">
                {cycleData.lastPeriod || 'N/A'}
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Cycle Length</p>
              <p className="text-2xl font-bold text-purple-600">
                {cycleData.cycleLength || 'N/A'} days
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Next Period</p>
              <p className="text-2xl font-bold text-green-600">
                {cycleData.nextPeriod || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'meals' && mealData && (
        <div className="space-y-3">
          {mealData.recentMeals && mealData.recentMeals.length > 0 ? (
            mealData.recentMeals.map((meal: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-semibold text-gray-900 capitalize">{meal.type}</p>
                  <p className="text-sm text-gray-600">{meal.description}</p>
                </div>
                <span className="text-sm text-gray-500">{meal.date}</span>
              </div>
            ))
          ) : (
            <EmptyState
              icon="🍽️"
              title="No Meal Logs"
              description="No meal logs yet. Encourage regular logging!"
            />
          )}
        </div>
      )}

      {activeTab === 'appointments' && appointmentData && (
        <div className="space-y-3">
          {appointmentData.upcoming && appointmentData.upcoming.length > 0 ? (
            appointmentData.upcoming.map((appt: any, idx: number) => (
              <div key={idx} className="flex items-start justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">{appt.provider}</p>
                  <p className="text-sm text-gray-600">{appt.issue}</p>
                  <p className="text-xs text-gray-500 mt-1">{appt.date}</p>
                </div>
                <Badge variant={appt.status === 'confirmed' ? 'success' : 'warning'}>
                  {appt.status}
                </Badge>
              </div>
            ))
          ) : (
            <EmptyState
              icon="📋"
              title="No Appointments"
              description="No upcoming appointments scheduled"
              actionText="Schedule One"
            />
          )}
        </div>
      )}
    </Card>
  );
};

/**
 * ParentDashboardStats
 * Summary statistics for the parent dashboard
 */
export const ParentDashboardStats: React.FC<{
  childrenCount: number;
  activeCycles: number;
  totalAppointments: number;
  healthScore: number;
}> = ({ childrenCount, activeCycles, totalAppointments, healthScore }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        { label: 'Children', value: childrenCount, icon: '👶', color: 'rose' },
        { label: 'Active Cycles', value: activeCycles, icon: '📅', color: 'purple' },
        { label: 'Appointments', value: totalAppointments, icon: '📋', color: 'blue' },
        { label: 'Health Score', value: `${healthScore}%`, icon: '❤️', color: 'green' },
      ].map((stat) => (
        <Card
          key={stat.label}
          className={`bg-gradient-to-br ${
            stat.color === 'rose'
              ? 'from-rose-50 to-rose-100'
              : stat.color === 'purple'
              ? 'from-purple-50 to-purple-100'
              : stat.color === 'blue'
              ? 'from-blue-50 to-blue-100'
              : 'from-green-50 to-green-100'
          }`}
        >
          <div className="text-center">
            <span className="text-3xl block mb-2">{stat.icon}</span>
            <p className="text-xs uppercase text-gray-600 font-semibold mb-1">
              {stat.label}
            </p>
            <p
              className={`text-3xl font-bold ${
                stat.color === 'rose'
                  ? 'text-rose-600'
                  : stat.color === 'purple'
                  ? 'text-purple-600'
                  : stat.color === 'blue'
                  ? 'text-blue-600'
                  : 'text-green-600'
              }`}
            >
              {stat.value}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
};

/**
 * AddChildForm
 * Modern form for adding a new child
 */
export const AddChildForm: React.FC<{
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}> = ({ onSubmit, onCancel, isLoading = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    relationship: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card variant="elevated" className="bg-gradient-to-br from-green-50 to-emerald-50">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span>➕</span> Add a New Child
      </h3>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Child's Full Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Amara Johnson"
            className="w-full px-4 py-3 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Date of Birth
          </label>
          <input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            className="w-full px-4 py-3 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        {/* Relationship */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Relationship
          </label>
          <select
            value={formData.relationship}
            onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
            className="w-full px-4 py-3 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          >
            <option value="">Select relationship...</option>
            <option value="daughter">Daughter</option>
            <option value="sister">Sister</option>
            <option value="ward">Ward</option>
            <option value="niece">Niece</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button type="submit" fullWidth loading={isLoading}>
            💾 Add Child
          </Button>
          <Button type="button" variant="outline" fullWidth onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
};

/**
 * HealthReminder
 * Daily health reminders for parents
 */
export const HealthReminder: React.FC<{
  child: string;
  type: 'cycle' | 'appointment' | 'meal' | 'wellness';
  message: string;
  onDismiss: () => void;
}> = ({ child, type, message, onDismiss }) => {
  const icons = {
    cycle: '📅',
    appointment: '📋',
    meal: '🍽️',
    wellness: '💪',
  };

  const colors = {
    cycle: 'bg-rose-50 border-l-rose-500',
    appointment: 'bg-blue-50 border-l-blue-500',
    meal: 'bg-green-50 border-l-green-500',
    wellness: 'bg-purple-50 border-l-purple-500',
  };

  return (
    <Card className={`border-l-4 ${colors[type]}`}>
      <div className="flex items-start justify-between">
        <div className="flex gap-3 flex-1">
          <span className="text-2xl">{icons[type]}</span>
          <div>
            <p className="font-semibold text-gray-900">{child}</p>
            <p className="text-sm text-gray-600">{message}</p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600 text-xl"
        >
          ✕
        </button>
      </div>
    </Card>
  );
};
