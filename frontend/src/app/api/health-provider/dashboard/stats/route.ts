import { NextRequest, NextResponse } from 'next/server';

// TypeScript types for the backend response
interface AppointmentStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  today: number;
  this_week: number;
  urgent: number;
}

interface RecentAppointment {
  id: number;
  patient_name: string;
  issue: string;
  appointment_date: string | null;
  status: string;
  priority: string;
  created_at: string;
}

interface MonthlyTrend {
  month: string;
  total_appointments: number;
  completed_appointments: number;
}

interface ProviderInfo {
  name: string;
  specialization: string;
  clinic_name: string;
  is_verified: boolean;
}

export interface HealthProviderDashboardStats {
  appointment_stats: AppointmentStats;
  recent_appointments: RecentAppointment[];
  monthly_trends: MonthlyTrend[];
  provider_info: ProviderInfo;
}

export async function GET(req: NextRequest) {
  try {
    // Forward the JWT token if present
    const token = req.headers.get('authorization') || '';
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const res = await fetch(`${backendUrl}/api/health-provider/dashboard/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': token } : {}),
      },
      credentials: 'include',
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      return NextResponse.json({ error: error.error || 'Failed to fetch stats from backend' }, { status: res.status });
    }

    const data: HealthProviderDashboardStats = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
