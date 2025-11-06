'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import {
  Card,
  StatCard,
  Button,
  Tabs,
  Badge,
  EmptyState,
  Spinner,
  ProgressBar,
  GradientBg,
} from '../../components/UILibrary';

/**
 * Enhanced Adolescent Dashboard
 * Modern, visually appealing UI for young women to track health
 * Designed for low-literacy users with emphasis on visuals and emojis
 */

export default function EnhancedAdolescentDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Auth check
  useEffect(() => {
    if (!authLoading && (!user || (user.user_type !== 'adolescent' && user.user_type !== 'parent'))) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <GradientBg variant="cycle" className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </GradientBg>
    );
  }

  if (!user || (user.user_type !== 'adolescent' && user.user_type !== 'parent')) {
    return null;
  }

  const tabs = [
    { label: '📊 Dashboard', value: 'dashboard', icon: '📊' },
    { label: '📅 Cycle Tracker', value: 'cycle', icon: '📅' },
    { label: '😊 Wellness', value: 'wellness', icon: '😊' },
    { label: '🍽️ Nutrition', value: 'nutrition', icon: '🍽️' },
    { label: '📚 Learn', value: 'learn', icon: '📚' },
  ];

  return (
    <GradientBg variant="cycle" className="min-h-screen py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                Hey, {user.full_name || user.name || 'Beautiful'}! 👋
              </h1>
              <p className="text-lg text-gray-600">Your health journey, your way</p>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <StatCard label="Cycles Tracked" value="12" icon="📅" color="primary" />
            <StatCard label="Streak" value="28d" icon="🔥" color="success" />
            <StatCard label="Wellness Score" value="88%" icon="💪" color="info" />
            <StatCard label="Mood Status" value="Happy" icon="😊" color="warning" />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />
        </div>

        {/* Content Sections */}
        {activeTab === 'dashboard' && <DashboardSection />}
        {activeTab === 'cycle' && <CycleTrackerSection />}
        {activeTab === 'wellness' && <WellnessSection />}
        {activeTab === 'nutrition' && <NutritionSection />}
        {activeTab === 'learn' && <LearnSection />}
      </div>
    </GradientBg>
  );
}

/**
 * Main Dashboard Section
 */
function DashboardSection() {
  return (
    <div className="space-y-8">
      {/* Current Cycle Status */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Current Cycle 📅</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="elevated" className="border-l-4 border-l-rose-500">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Cycle Day</p>
              <p className="text-5xl font-bold text-rose-600">9</p>
              <div className="mt-4">
                <ProgressBar value={9} max={28} color="primary" showLabel />
              </div>
            </div>
          </Card>

          <Card variant="elevated">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Last Period Started</p>
              <p className="text-2xl font-bold text-gray-900">Mar 5</p>
              <Badge variant="success" size="sm" className="mt-3">
                ✓ Logged
              </Badge>
            </div>
          </Card>

          <Card variant="elevated" className="border-l-4 border-l-purple-500">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Next Period</p>
              <p className="text-2xl font-bold text-purple-600">Apr 2</p>
              <p className="text-xs text-gray-500 mt-2">24 days away</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Symptoms & Mood Tracker */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">How Are You Feeling? 😊</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card variant="elevated">
            <h3 className="font-bold text-gray-900 mb-4">Today's Symptoms</h3>
            <div className="flex flex-wrap gap-3">
              {['No Cramps', 'Light Energy', 'Happy', 'Good Appetite'].map((symptom) => (
                <Badge key={symptom} variant="success">
                  {symptom}
                </Badge>
              ))}
            </div>
            <Button fullWidth className="mt-6" size="sm" variant="outline">
              ➕ Add Symptoms
            </Button>
          </Card>

          <Card variant="elevated">
            <h3 className="font-bold text-gray-900 mb-4">Mood Check-In</h3>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {['😊', '😐', '😢', '😍'].map((emoji) => (
                <button
                  key={emoji}
                  className="text-4xl p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-600">How are you feeling today?</p>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button fullWidth icon="📅" className="h-24 flex flex-col justify-center">
            <span className="block mt-2">Log Period</span>
          </Button>
          <Button fullWidth icon="🍽️" variant="secondary" className="h-24 flex flex-col justify-center">
            <span className="block mt-2">Log Meal</span>
          </Button>
          <Button fullWidth icon="📋" variant="outline" className="h-24 flex flex-col justify-center">
            <span className="block mt-2">Book Appointment</span>
          </Button>
          <Button fullWidth icon="📚" variant="ghost" className="h-24 flex flex-col justify-center">
            <span className="block mt-2">Learn More</span>
          </Button>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Activity 📊</h2>
        <Card>
          <div className="space-y-4">
            {[
              { icon: '📅', action: 'Logged cycle data', time: '2 hours ago' },
              { icon: '🍽️', action: 'Logged breakfast', time: '5 hours ago' },
              { icon: '😊', action: 'Mood check-in', time: 'Yesterday' },
              { icon: '💧', action: 'Hydration reminder', time: '2 days ago' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <span className="text-3xl">{item.icon}</span>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{item.action}</p>
                  <p className="text-sm text-gray-500">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/**
 * Cycle Tracker Section
 */
function CycleTrackerSection() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Track Your Cycle 📅</h2>

      {/* Quick Logger */}
      <Card variant="elevated" className="bg-gradient-to-br from-rose-50 to-purple-50 border-l-4 border-l-rose-500">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Log</h3>
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="date"
              className="px-4 py-3 border border-rose-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="Start date"
            />
            <select className="px-4 py-3 border border-rose-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500">
              <option>Select flow...</option>
              <option>🩸 Light</option>
              <option>🩸🩸 Medium</option>
              <option>🩸🩸🩸 Heavy</option>
            </select>
            <Button type="submit" className="h-12">
              💾 Save
            </Button>
          </div>
        </form>
      </Card>

      {/* Symptoms */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Track Symptoms</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { emoji: '😣', label: 'Cramps', selected: true },
            { emoji: '🤢', label: 'Nausea', selected: false },
            { emoji: '😴', label: 'Tired', selected: false },
            { emoji: '🤕', label: 'Headache', selected: false },
            { emoji: '😤', label: 'Mood Swings', selected: false },
            { emoji: '🫧', label: 'Bloating', selected: false },
            { emoji: '🌶️', label: 'Hot Flashes', selected: false },
            { emoji: '😎', label: 'None', selected: false },
          ].map((symptom) => (
            <button
              key={symptom.label}
              className={`p-4 rounded-lg border-2 transition-all ${
                symptom.selected
                  ? 'bg-rose-100 border-rose-500 shadow-sm'
                  : 'bg-white border-gray-200 hover:border-rose-300'
              }`}
            >
              <span className="text-3xl block mb-2">{symptom.emoji}</span>
              <span className="text-sm font-semibold">{symptom.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Cycle History */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Cycles</h3>
        <Card>
          <div className="space-y-3">
            {[
              { start: 'Mar 5', end: 'Mar 10', flow: 'Medium' },
              { start: 'Feb 5', end: 'Feb 9', flow: 'Light' },
              { start: 'Jan 8', end: 'Jan 13', flow: 'Heavy' },
            ].map((cycle, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">{cycle.start}</p>
                  <p className="text-sm text-gray-600">Duration: 5 days • {cycle.flow} flow</p>
                </div>
                <span className="text-2xl">📅</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/**
 * Wellness Section - Mood and symptoms
 */
function WellnessSection() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Wellness 💪</h2>

      {/* Mood History */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Mood Tracker</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h4 className="font-bold text-gray-900 mb-4">Today's Mood</h4>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { emoji: '😍', label: 'Excellent' },
                { emoji: '😊', label: 'Good', selected: true },
                { emoji: '😐', label: 'Okay' },
                { emoji: '😔', label: 'Bad' },
              ].map((mood) => (
                <button
                  key={mood.label}
                  className={`p-3 rounded-lg transition-all ${
                    mood.selected ? 'bg-amber-100 scale-110' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-3xl">{mood.emoji}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <h4 className="font-bold text-gray-900 mb-4">Energy Level</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="radio" name="energy" defaultChecked />
                <span>⚡ High Energy</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="energy" />
                <span>⚙️ Normal</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="energy" />
                <span>🔋 Low Energy</span>
              </label>
            </div>
          </Card>
        </div>
      </div>

      {/* Wellness Tips */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Self-Care Tips This Week</h3>
        <div className="space-y-4">
          {[
            { emoji: '🧘‍♀️', tip: 'Try a 10-minute meditation to reduce stress' },
            { emoji: '🚶‍♀️', tip: 'Take a walk - light exercise helps with mood' },
            { emoji: '💤', tip: 'Get 8 hours of sleep for better mood regulation' },
            { emoji: '🌿', tip: 'Drink herbal tea to soothe your system' },
          ].map((item, idx) => (
            <Card key={idx} className="flex items-center gap-4">
              <span className="text-4xl">{item.emoji}</span>
              <p className="text-gray-900">{item.tip}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Nutrition Section
 */
function NutritionSection() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Nutrition & Health 🥗</h2>

      {/* Quick Log */}
      <Card variant="elevated" className="border-l-4 border-l-green-500">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Log Your Meal</h3>
        <form className="space-y-4">
          <select className="w-full px-4 py-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500">
            <option>🌅 Breakfast</option>
            <option>🍽️ Lunch</option>
            <option>🌙 Dinner</option>
            <option>🍿 Snack</option>
          </select>
          <input
            type="text"
            placeholder="What did you eat?"
            className="w-full px-4 py-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500"
          />
          <Button type="submit" variant="secondary" fullWidth>
            💾 Save Meal
          </Button>
        </form>
      </Card>

      {/* Nutrition Guide by Cycle Phase */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Nutrition Guide</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-l-4 border-l-green-500">
            <h4 className="font-bold text-gray-900 mb-3">Follicular Phase (Days 1-14)</h4>
            <div className="space-y-2 text-sm">
              <p>🥗 Focus on: Fresh vegetables, whole grains</p>
              <p>🍌 Eat: Bananas, spinach, berries</p>
              <p>💧 Drink: Plenty of water</p>
            </div>
          </Card>

          <Card className="border-l-4 border-l-rose-500">
            <h4 className="font-bold text-gray-900 mb-3">Luteal Phase (Days 15-28)</h4>
            <div className="space-y-2 text-sm">
              <p>🥩 Focus on: Iron-rich foods, protein</p>
              <p>🫘 Eat: Beans, nuts, red meat</p>
              <p>✨ Avoid: Excess caffeine</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Meals */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">This Week's Meals</h3>
        <Card>
          <div className="space-y-3">
            {[
              { emoji: '🌅', meal: 'Oatmeal with fruit', time: 'Today' },
              { emoji: '🍽️', meal: 'Rice and beans', time: 'Today' },
              { emoji: '🥗', meal: 'Vegetable salad', time: 'Yesterday' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 pb-3 border-b border-gray-100 last:border-0">
                <span className="text-3xl">{item.emoji}</span>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{item.meal}</p>
                  <p className="text-sm text-gray-600">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/**
 * Learning Section - Educational content
 */
function LearnSection() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Health Education 📚</h2>

      <div className="space-y-6">
        {[
          {
            title: 'Understanding Your Cycle',
            description: 'Learn about the 4 phases of your menstrual cycle',
            category: 'Health',
            duration: '5 min read',
            icon: '📅',
          },
          {
            title: 'Period Nutrition Tips',
            description: 'Eat right to feel better during your period',
            category: 'Nutrition',
            duration: '3 min read',
            icon: '🥗',
          },
          {
            title: 'Managing Cramps',
            description: 'Natural ways to manage menstrual cramps',
            category: 'Wellness',
            duration: '4 min read',
            icon: '💪',
          },
          {
            title: 'Reproductive Health FAQs',
            description: 'Common questions about your reproductive health',
            category: 'FAQ',
            duration: '10 min read',
            icon: '❓',
          },
        ].map((article, idx) => (
          <Card key={idx} variant="elevated" className="hover:shadow-lg transition-shadow">
            <div className="flex gap-4">
              <span className="text-5xl">{article.icon}</span>
              <div className="flex-1">
                <Badge variant="primary" size="sm" className="mb-2">
                  {article.category}
                </Badge>
                <h4 className="text-lg font-bold text-gray-900 mb-1">{article.title}</h4>
                <p className="text-gray-600 mb-3">{article.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">📖 {article.duration}</span>
                  <Button size="sm" variant="outline">
                    Read Now →
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Ask a Question */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-l-4 border-l-purple-500">
        <div className="text-center">
          <span className="text-5xl block mb-4">💬</span>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Have Questions?</h3>
          <p className="text-gray-600 mb-4">
            Ask our health providers anything about your health
          </p>
          <Button>Ask a Question</Button>
        </div>
      </Card>
    </div>
  );
}
