'use client';

import { useState, useEffect } from 'react';

interface AnalyticsProps {
  userId?: string;
  dateRange?: string;
}

interface AnalyticsData {
  overview: {
    total_views: number;
    total_engagement: number;
    total_shares: number;
    avg_reading_time: number;
    content_performance_score: number;
  };
  content_performance: Array<{
    id: number;
    title: string;
    views: number;
    engagement_rate: number;
    shares: number;
    comments: number;
    likes: number;
    reading_completion: number;
    published_date: string;
  }>;
  audience_insights: {
    demographics: {
      age_groups: Array<{ range: string; percentage: number }>;
      gender: Array<{ type: string; percentage: number }>;
      locations: Array<{ country: string; percentage: number }>;
    };
    behavior: {
      peak_hours: Array<{ hour: number; activity: number }>;
      device_types: Array<{ device: string; percentage: number }>;
      traffic_sources: Array<{ source: string; percentage: number }>;
    };
  };
  trending_topics: Array<{
    topic: string;
    popularity_score: number;
    growth_rate: number;
    suggested_keywords: string[];
  }>;
  seo_performance: {
    avg_ranking: number;
    total_keywords: number;
    organic_traffic: number;
    click_through_rate: number;
    top_keywords: Array<{
      keyword: string;
      position: number;
      clicks: number;
      impressions: number;
    }>;
  };
  social_metrics: {
    platforms: Array<{
      platform: string;
      followers: number;
      engagement_rate: number;
      reach: number;
      shares: number;
    }>;
  };
  revenue_analytics: {
    total_earnings: number;
    content_value: number;
    performance_bonus: number;
    monthly_trend: Array<{
      month: string;
      earnings: number;
      content_count: number;
    }>;
  };
}

export default function AnalyticsDashboard({ userId, dateRange = '30d' }: AnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDateRange, setSelectedDateRange] = useState(dateRange);
  const [compareMode, setCompareMode] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedDateRange, userId]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // Mock analytics data - in real implementation, this would be an API call
      const mockData: AnalyticsData = {
        overview: {
          total_views: 15420,
          total_engagement: 8765,
          total_shares: 1234,
          avg_reading_time: 4.2,
          content_performance_score: 87
        },
        content_performance: [
          {
            id: 1,
            title: "10 Essential Beauty Tips for Glowing Skin",
            views: 3245,
            engagement_rate: 8.5,
            shares: 234,
            comments: 45,
            likes: 567,
            reading_completion: 78,
            published_date: "2024-01-15"
          },
          {
            id: 2,
            title: "The Ultimate Guide to Natural Skincare",
            views: 2890,
            engagement_rate: 9.2,
            shares: 189,
            comments: 67,
            likes: 456,
            reading_completion: 82,
            published_date: "2024-01-12"
          },
          {
            id: 3,
            title: "Makeup Trends for 2024",
            views: 2156,
            engagement_rate: 7.8,
            shares: 145,
            comments: 32,
            likes: 345,
            reading_completion: 65,
            published_date: "2024-01-10"
          }
        ],
        audience_insights: {
          demographics: {
            age_groups: [
              { range: "18-24", percentage: 25 },
              { range: "25-34", percentage: 35 },
              { range: "35-44", percentage: 22 },
              { range: "45-54", percentage: 12 },
              { range: "55+", percentage: 6 }
            ],
            gender: [
              { type: "Female", percentage: 78 },
              { type: "Male", percentage: 20 },
              { type: "Other", percentage: 2 }
            ],
            locations: [
              { country: "United States", percentage: 45 },
              { country: "United Kingdom", percentage: 18 },
              { country: "Canada", percentage: 12 },
              { country: "Australia", percentage: 8 },
              { country: "Other", percentage: 17 }
            ]
          },
          behavior: {
            peak_hours: [
              { hour: 9, activity: 65 },
              { hour: 12, activity: 78 },
              { hour: 15, activity: 82 },
              { hour: 18, activity: 95 },
              { hour: 21, activity: 88 }
            ],
            device_types: [
              { device: "Mobile", percentage: 68 },
              { device: "Desktop", percentage: 25 },
              { device: "Tablet", percentage: 7 }
            ],
            traffic_sources: [
              { source: "Organic Search", percentage: 42 },
              { source: "Social Media", percentage: 28 },
              { source: "Direct", percentage: 18 },
              { source: "Referral", percentage: 12 }
            ]
          }
        },
        trending_topics: [
          {
            topic: "Sustainable Beauty",
            popularity_score: 95,
            growth_rate: 23,
            suggested_keywords: ["eco-friendly", "natural", "sustainable", "green beauty"]
          },
          {
            topic: "Skincare Routines",
            popularity_score: 88,
            growth_rate: 15,
            suggested_keywords: ["morning routine", "night routine", "skincare steps"]
          },
          {
            topic: "Clean Beauty",
            popularity_score: 82,
            growth_rate: 31,
            suggested_keywords: ["clean ingredients", "toxic-free", "natural makeup"]
          }
        ],
        seo_performance: {
          avg_ranking: 12.5,
          total_keywords: 245,
          organic_traffic: 8967,
          click_through_rate: 4.2,
          top_keywords: [
            { keyword: "natural skincare", position: 3, clicks: 456, impressions: 8900 },
            { keyword: "beauty tips", position: 7, clicks: 289, impressions: 5600 },
            { keyword: "makeup tutorial", position: 5, clicks: 234, impressions: 4200 }
          ]
        },
        social_metrics: {
          platforms: [
            { platform: "Instagram", followers: 12450, engagement_rate: 6.8, reach: 45600, shares: 234 },
            { platform: "TikTok", followers: 8900, engagement_rate: 9.2, reach: 67800, shares: 567 },
            { platform: "YouTube", followers: 5600, engagement_rate: 4.5, reach: 23400, shares: 123 }
          ]
        },
        revenue_analytics: {
          total_earnings: 2450.00,
          content_value: 1890.00,
          performance_bonus: 560.00,
          monthly_trend: [
            { month: "Jan", earnings: 2450, content_count: 12 },
            { month: "Dec", earnings: 2180, content_count: 10 },
            { month: "Nov", earnings: 1980, content_count: 9 }
          ]
        }
      };

      setAnalyticsData(mockData);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    console.log(`Exporting analytics data as ${exportFormat}`);
    // Implementation for data export
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h2>
        <div className="flex items-center space-x-4">
          <select
            value={selectedDateRange}
            onChange={(e) => setSelectedDateRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          
          <button
            onClick={() => setCompareMode(!compareMode)}
            className={`px-4 py-2 rounded-lg ${
              compareMode ? 'bg-blue-600 text-white' : 'border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Compare
          </button>
          
          <div className="flex items-center space-x-2">
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
            </select>
            <button
              onClick={exportData}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-blue-600">
                {analyticsData.overview.total_views.toLocaleString()}
              </p>
            </div>
            <div className="text-blue-500">👁️</div>
          </div>
          <p className="text-sm text-green-600 mt-2">+12% from last period</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Engagement</p>
              <p className="text-2xl font-bold text-green-600">
                {analyticsData.overview.total_engagement.toLocaleString()}
              </p>
            </div>
            <div className="text-green-500">💬</div>
          </div>
          <p className="text-sm text-green-600 mt-2">+8% from last period</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Shares</p>
              <p className="text-2xl font-bold text-purple-600">
                {analyticsData.overview.total_shares.toLocaleString()}
              </p>
            </div>
            <div className="text-purple-500">📤</div>
          </div>
          <p className="text-sm text-green-600 mt-2">+15% from last period</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Reading Time</p>
              <p className="text-2xl font-bold text-orange-600">
                {analyticsData.overview.avg_reading_time}m
              </p>
            </div>
            <div className="text-orange-500">⏱️</div>
          </div>
          <p className="text-sm text-green-600 mt-2">+5% from last period</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Performance Score</p>
              <p className="text-2xl font-bold text-indigo-600">
                {analyticsData.overview.content_performance_score}/100
              </p>
            </div>
            <div className="text-indigo-500">🎯</div>
          </div>
          <p className="text-sm text-green-600 mt-2">Excellent performance</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {['overview', 'content', 'audience', 'seo', 'social', 'revenue'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'seo' ? 'SEO' : tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trending Topics */}
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold mb-4">Trending Topics</h3>
              <div className="space-y-4">
                {analyticsData.trending_topics.map((topic, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{topic.topic}</span>
                        <span className="text-sm text-green-600">+{topic.growth_rate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${topic.popularity_score}%` }}
                        ></div>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {topic.suggested_keywords.map((keyword, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Device Usage */}
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold mb-4">Device Usage</h3>
              <div className="space-y-4">
                {analyticsData.audience_insights.behavior.device_types.map((device, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span>{device.device}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${device.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{device.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="bg-white rounded-lg shadow border">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Content Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Title</th>
                      <th className="text-right py-3 px-4">Views</th>
                      <th className="text-right py-3 px-4">Engagement</th>
                      <th className="text-right py-3 px-4">Shares</th>
                      <th className="text-right py-3 px-4">Completion</th>
                      <th className="text-right py-3 px-4">Published</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.content_performance.map((content) => (
                      <tr key={content.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium">{content.title}</div>
                        </td>
                        <td className="text-right py-3 px-4">{content.views.toLocaleString()}</td>
                        <td className="text-right py-3 px-4">{content.engagement_rate}%</td>
                        <td className="text-right py-3 px-4">{content.shares}</td>
                        <td className="text-right py-3 px-4">{content.reading_completion}%</td>
                        <td className="text-right py-3 px-4">
                          {new Date(content.published_date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'audience' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Demographics */}
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold mb-4">Age Demographics</h3>
              <div className="space-y-3">
                {analyticsData.audience_insights.demographics.age_groups.map((group, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span>{group.range}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${group.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{group.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Traffic Sources */}
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold mb-4">Traffic Sources</h3>
              <div className="space-y-3">
                {analyticsData.audience_insights.behavior.traffic_sources.map((source, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span>{source.source}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${source.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{source.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'seo' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SEO Overview */}
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold mb-4">SEO Performance</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {analyticsData.seo_performance.avg_ranking}
                  </p>
                  <p className="text-sm text-gray-600">Average Ranking</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {analyticsData.seo_performance.total_keywords}
                  </p>
                  <p className="text-sm text-gray-600">Total Keywords</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {analyticsData.seo_performance.organic_traffic.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Organic Traffic</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {analyticsData.seo_performance.click_through_rate}%
                  </p>
                  <p className="text-sm text-gray-600">CTR</p>
                </div>
              </div>
            </div>

            {/* Top Keywords */}
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold mb-4">Top Keywords</h3>
              <div className="space-y-3">
                {analyticsData.seo_performance.top_keywords.map((keyword, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{keyword.keyword}</div>
                      <div className="text-sm text-gray-600">
                        Position {keyword.position} • {keyword.clicks} clicks
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{keyword.impressions.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">impressions</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'social' && (
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold mb-4">Social Media Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {analyticsData.social_metrics.platforms.map((platform, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h4 className="font-medium text-lg mb-3">{platform.platform}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Followers</span>
                      <span className="font-medium">{platform.followers.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Engagement Rate</span>
                      <span className="font-medium">{platform.engagement_rate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reach</span>
                      <span className="font-medium">{platform.reach.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shares</span>
                      <span className="font-medium">{platform.shares}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'revenue' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Overview */}
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold mb-4">Revenue Overview</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Earnings</span>
                  <span className="text-2xl font-bold text-green-600">
                    ${analyticsData.revenue_analytics.total_earnings.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Content Value</span>
                  <span className="font-medium">
                    ${analyticsData.revenue_analytics.content_value.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Performance Bonus</span>
                  <span className="font-medium text-blue-600">
                    ${analyticsData.revenue_analytics.performance_bonus.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Monthly Trend */}
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold mb-4">Monthly Trend</h3>
              <div className="space-y-3">
                {analyticsData.revenue_analytics.monthly_trend.map((month, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span>{month.month}</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">
                        {month.content_count} articles
                      </span>
                      <span className="font-medium">
                        ${month.earnings.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
