/**
 * Admin Dashboard Types
 * Complete TypeScript definitions for all admin-related data structures
 */

export interface AdminStats {
  total_users: number;
  active_users: number;
  total_adolescents: number;
  total_parents: number;
  total_providers: number;
  total_content_writers: number;
  pending_verifications: number;
  pending_content: number;
  total_appointments: number;
  appointments_today: number;
  new_users_this_week: number;
  new_users_this_month: number;
}

export interface AdminUser {
  id: number;
  first_name: string;
  last_name: string;
  name?: string;
  phone_number: string;
  email?: string;
  user_type: 'adolescent' | 'parent' | 'health_provider' | 'content_writer' | 'admin';
  is_active: boolean;
  allow_parent_access: boolean;
  created_at: string;
  updated_at?: string;
  profile?: {
    specialization?: string;      // health_provider
    clinic_name?: string;         // health_provider
    is_verified?: boolean;        // health_provider
    license_number?: string;      // health_provider
    bio?: string;                 // content_writer
    age?: number;                 // adolescent
    school_name?: string;         // adolescent
    occupation?: string;          // parent
  };
}

export interface AdminProvider {
  id: number;
  user_id: number;
  user: AdminUser;
  license_number: string;
  specialization: string;
  clinic_name: string;
  clinic_address: string;
  clinic_phone: string;
  qualification: string;
  is_verified: boolean;
  created_at: string;
  total_appointments?: number;
  upcoming_appointments?: number;
}

export interface AdminContentItem {
  id: number;
  title: string;
  description: string;
  content: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  category_id: number;
  category_name?: string;
  language: string;
  is_featured: boolean;
  writer_id?: number;
  writer_name?: string;
  created_at: string;
  updated_at: string;
  rejection_reason?: string;
}

export interface AdminAppointment {
  id: number;
  user_id: number;
  patient_name: string;
  health_provider_id?: number;
  provider_name?: string;
  appointment_type: string;
  scheduled_datetime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
}

export interface SystemLog {
  id: number;
  user_id?: number;
  user_name?: string;
  user_type?: string;
  action: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface AnalyticsReport {
  report_type: string;
  period: { start: string; end: string };
  summary: Record<string, number | string>;
  [key: string]: any;  // Different report types have different shapes
}

export interface AdminPermissions {
  manage_users: boolean;
  manage_content: boolean;
  view_analytics: boolean;
  manage_appointments: boolean;
  view_system_logs: boolean;
  all: boolean;
}

export interface PaginatedResponse<T> {
  items?: T[];
  users?: T[];
  providers?: T[];
  data?: T[];
  total: number;
  pages: number;
  current_page: number;
  per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

export type ReportType =
  | 'overview'
  | 'user_activity'
  | 'user_registrations'
  | 'content_performance'
  | 'appointments'
  | 'health_tracking'
  | 'engagement';

export interface BroadcastPayload {
  title: string;
  message: string;
  role?: 'adolescent' | 'parent' | 'health_provider' | 'content_writer' | null;
  severity: 'info' | 'success' | 'warning' | 'error';
}
