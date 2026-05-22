Scope: Build the complete Admin frontend at /dashboard/admin, fully wired to every backend endpoint documented in the Admin architecture report. This is the operational control center for the entire Lady's Essence platform — it must be authoritative, data-dense, and deeply functional.


Context: Read All of This Before Writing Code
You are integrating the frontend for the Admin user type — the single role that has visibility across every other role in the system. The admin manages:

All users across 5 roles (adolescent, parent, health_provider, content_writer, admin)
Health provider verification and management
Content moderation queue (approve/reject)
System analytics and 7 report types
Activity audit logs
Platform-wide notification broadcasting
Bulk user operations and role changes

This dashboard runs on the same design system as the rest of Lady's Essence:

--color-terracotta: #C4785A / --color-cream: #F5EDE0 / --color-mauve: #7A4F6D / --color-sage: #8FAF8A / --color-ink: #2C2C2C
Fonts: Playfair Display (headings) + DM Sans (body/UI)
But the Admin dashboard adopts a darker, more authoritative tone — deep ink backgrounds, precise data tables, sharper edges, and reduced warmth compared to the adolescent/parent dashboards. The admin is not a patient. She is an operator.

Admin-specific design direction: Deep ink #1A1A2E background for the sidebar and top chrome. Cream content areas. Terracotta as the primary action color. Sage for positive metrics. Warm amber #E8A838 for pending/warning states. Muted rose #C0392B for danger/error states. No decorative blob shapes. Precision grid layout. Data is the aesthetic.

Tech Stack (Same as Main Frontend)
Framework:         Next.js 15 (App Router)
Language:          TypeScript
Styling:           Tailwind CSS + CSS Modules
State:             Zustand
Data fetching:     TanStack Query (React Query v5) + Axios
Forms:             React Hook Form + Zod
Charts:            Recharts
Icons:             Lucide React
Animations:        Framer Motion
Toasts:            react-hot-toast
Date:              date-fns
Tables:            @tanstack/react-table v8

Authentication & Guard
Admin Route Guard
Every admin page must be wrapped in a strict role guard. Non-admin users redirected to their own dashboard.
typescript// components/admin/AdminGuard.tsx
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, accessToken } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!accessToken) {
      router.replace('/login');
      return;
    }
    if (user && user.user_type !== 'admin') {
      // Redirect to their own dashboard
      const roleRoutes: Record<string, string> = {
        adolescent: '/dashboard',
        parent: '/dashboard/parent',
        health_provider: '/dashboard/provider',
        content_writer: '/dashboard/writer',
      };
      router.replace(roleRoutes[user.user_type] || '/dashboard');
    }
  }, [user, accessToken, router]);

  if (!user || user.user_type !== 'admin') {
    return (
      <div className="admin-guard-loading">
        {/* Minimal centered spinner */}
      </div>
    );
  }

  return <>{children}</>;
}
Admin Axios Instance
The admin uses the shared Axios instance with JWT interceptors. No separate instance needed — same token, same refresh logic.
typescript// All admin API calls use the shared lib/axios.ts instance
// Authorization: Bearer <access_token>  ← automatically injected by interceptor

File Structure
app/
└── dashboard/
    └── admin/
        ├── layout.tsx                    ← Admin layout (dark sidebar + topbar)
        ├── page.tsx                      ← Overview dashboard
        ├── users/
        │   └── page.tsx                  ← User management table
        ├── providers/
        │   └── page.tsx                  ← Health provider management
        ├── content/
        │   └── page.tsx                  ← Content moderation queue
        ├── analytics/
        │   └── page.tsx                  ← Analytics & reports
        ├── appointments/
        │   └── page.tsx                  ← All appointments management
        └── logs/
            └── page.tsx                  ← System activity logs

components/
└── admin/
    ├── AdminGuard.tsx
    ├── AdminLayout.tsx
    ├── AdminSidebar.tsx
    ├── AdminTopBar.tsx
    ├── AdminStatCard.tsx
    ├── AdminDataTable.tsx               ← Generic TanStack Table wrapper
    ├── UserRoleBadge.tsx
    ├── StatusBadge.tsx
    ├── UserActionMenu.tsx               ← Dropdown: edit, toggle status, change role, delete
    ├── ProviderActionMenu.tsx
    ├── ContentActionMenu.tsx
    ├── ConfirmModal.tsx                 ← Reusable danger confirmation dialog
    ├── BroadcastModal.tsx               ← Admin notification broadcast modal
    ├── UserCreateModal.tsx
    ├── ProviderVerifyModal.tsx
    ├── ContentRejectModal.tsx           ← With reason textarea
    ├── RoleChangeModal.tsx
    ├── BulkActionBar.tsx                ← Appears when rows are selected
    ├── AnalyticsChart.tsx               ← Recharts wrapper
    ├── LogEntry.tsx
    └── DateRangePicker.tsx

hooks/admin/
    ├── useAdminStats.ts
    ├── useAdminUsers.ts
    ├── useAdminProviders.ts
    ├── useAdminContent.ts
    ├── useAdminAnalytics.ts
    ├── useAdminAppointments.ts
    └── useAdminLogs.ts

types/
└── admin.ts                             ← All admin-specific TypeScript types

TypeScript Types
typescript// types/admin.ts

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
  // Role-specific profile data (when available)
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

API Integration Layer
Create one hook file per admin section. All hooks follow the same pattern.
hooks/admin/useAdminStats.ts
typescriptimport { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { AdminStats } from '@/types/admin';

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const res = await api.get('/api/admin/dashboard/stats');
      return res.data.data ?? res.data;
    },
    staleTime: 60_000,        // 1 min — stats refresh often
    refetchInterval: 120_000, // Auto-refresh every 2 min
  });
}
hooks/admin/useAdminUsers.ts
typescriptimport { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import type { AdminUser, PaginatedResponse } from '@/types/admin';

interface UserFilters {
  page?: number;
  per_page?: number;
  user_type?: string;
  search?: string;
  is_active?: boolean;
}

// ── Queries ────────────────────────────────────────────────────────────────

export function useAdminUsers(filters: UserFilters = {}) {
  return useQuery<PaginatedResponse<AdminUser>>({
    queryKey: ['admin', 'users', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.page) params.set('page', String(filters.page));
      if (filters.per_page) params.set('per_page', String(filters.per_page));
      if (filters.user_type) params.set('user_type', filters.user_type);
      if (filters.search) params.set('search', filters.search);
      if (filters.is_active !== undefined) params.set('is_active', String(filters.is_active));
      const res = await api.get(`/api/admin/users?${params.toString()}`);
      return res.data;
    },
    placeholderData: (prev) => prev,  // Keep old data while fetching new page
  });
}

export function useAdminUser(userId: number) {
  return useQuery<AdminUser>({
    queryKey: ['admin', 'users', userId],
    queryFn: async () => {
      const res = await api.get(`/api/admin/users/${userId}`);
      return res.data.data ?? res.data;
    },
    enabled: !!userId,
  });
}

export function useUserStats() {
  return useQuery({
    queryKey: ['admin', 'user-statistics'],
    queryFn: async () => {
      const res = await api.get('/api/admin/users/statistics');
      return res.data.data ?? res.data;
    },
    staleTime: 300_000,
  });
}

// ── Mutations ──────────────────────────────────────────────────────────────

export function useToggleUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: number) => {
      const res = await api.patch(`/api/admin/users/${userId}/toggle-status`);
      return res.data;
    },
    onSuccess: (_, userId) => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User status updated');
    },
    onError: () => toast.error('Failed to update user status'),
  });
}

export function useChangeUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, newRole }: { userId: number; newRole: string }) => {
      const res = await api.patch(`/api/admin/users/${userId}/change-role`, {
        new_role: newRole,
      });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User role updated');
    },
    onError: () => toast.error('Failed to change user role'),
  });
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: async (userId: number) => {
      const res = await api.patch(`/api/admin/users/${userId}/reset-password`);
      return res.data;
    },
    onSuccess: () => toast.success('Password reset email sent'),
    onError: () => toast.error('Failed to reset password'),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: number) => {
      const res = await api.delete(`/api/admin/users/${userId}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success('User deleted successfully');
    },
    onError: () => toast.error('Failed to delete user'),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userData: Partial<AdminUser> & { password: string }) => {
      const res = await api.post('/api/admin/users/create', userData);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success('User created successfully');
    },
    onError: () => toast.error('Failed to create user'),
  });
}

export function useBulkUserAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      action,
      userIds,
      value,
    }: {
      action: 'activate' | 'deactivate' | 'delete' | 'change_role';
      userIds: number[];
      value?: string;
    }) => {
      const res = await api.post('/api/admin/users/bulk-action', {
        action,
        user_ids: userIds,
        value,
      });
      return res.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success(`Bulk action completed on ${data.affected ?? ''} users`);
    },
    onError: () => toast.error('Bulk action failed'),
  });
}
hooks/admin/useAdminProviders.ts
typescriptimport { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import type { AdminProvider, PaginatedResponse } from '@/types/admin';

export function useAdminProviders(filters: { page?: number; search?: string } = {}) {
  return useQuery<PaginatedResponse<AdminProvider>>({
    queryKey: ['admin', 'providers', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.page) params.set('page', String(filters.page));
      if (filters.search) params.set('search', filters.search);
      const res = await api.get(`/api/admin/health-providers?${params.toString()}`);
      return res.data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useProviderStats() {
  return useQuery({
    queryKey: ['admin', 'provider-statistics'],
    queryFn: async () => {
      const res = await api.get('/api/admin/health-providers/statistics');
      return res.data.data ?? res.data;
    },
  });
}

export function useVerifyProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (providerId: number) => {
      const res = await api.post(`/api/admin/health-providers/${providerId}/verify`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'providers'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success('Provider verified successfully');
    },
    onError: () => toast.error('Failed to verify provider'),
  });
}

export function useDeleteProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (providerId: number) => {
      const res = await api.delete(`/api/admin/health-providers/${providerId}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'providers'] });
      toast.success('Provider removed');
    },
    onError: () => toast.error('Failed to remove provider'),
  });
}

export function useProviderAppointments(providerId: number) {
  return useQuery({
    queryKey: ['admin', 'providers', providerId, 'appointments'],
    queryFn: async () => {
      const res = await api.get(`/api/admin/health-providers/${providerId}/appointments`);
      return res.data.data ?? res.data;
    },
    enabled: !!providerId,
  });
}
hooks/admin/useAdminContent.ts
typescriptimport { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import type { AdminContentItem, PaginatedResponse } from '@/types/admin';

export function usePendingContent() {
  return useQuery<AdminContentItem[]>({
    queryKey: ['admin', 'content', 'pending'],
    queryFn: async () => {
      const res = await api.get('/api/admin/content/pending');
      return res.data.data ?? res.data.items ?? res.data;
    },
    refetchInterval: 60_000,  // Check for new submissions every minute
  });
}

export function useApproveContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (contentId: number) => {
      const res = await api.patch(`/api/admin/content/${contentId}/approve`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'content'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success('Content approved and published');
    },
    onError: () => toast.error('Failed to approve content'),
  });
}

export function useRejectContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ contentId, reason }: { contentId: number; reason: string }) => {
      const res = await api.patch(`/api/admin/content/${contentId}/reject`, { reason });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'content'] });
      toast.success('Content rejected — writer notified');
    },
    onError: () => toast.error('Failed to reject content'),
  });
}

export function useCourseStats() {
  return useQuery({
    queryKey: ['admin', 'courses', 'stats'],
    queryFn: async () => {
      const res = await api.get('/api/admin/courses/stats');
      return res.data.data ?? res.data;
    },
  });
}

export function useAdminCourses(filters: { page?: number; status?: string } = {}) {
  return useQuery({
    queryKey: ['admin', 'courses', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.page) params.set('page', String(filters.page));
      if (filters.status) params.set('status', filters.status);
      const res = await api.get(`/api/admin/courses?${params.toString()}`);
      return res.data;
    },
  });
}

export function useUpdateCourseStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ courseId, status }: { courseId: number; status: string }) => {
      const res = await api.patch(`/api/admin/courses/${courseId}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'courses'] });
      toast.success('Course status updated');
    },
  });
}
hooks/admin/useAdminAnalytics.ts
typescriptimport { useMutation, useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { AnalyticsReport } from '@/types/admin';

export type ReportType =
  | 'overview'
  | 'user_activity'
  | 'user_registrations'
  | 'content_performance'
  | 'appointments'
  | 'health_tracking'
  | 'engagement';

export function useGenerateReport() {
  return useMutation<AnalyticsReport, Error, {
    report_type: ReportType;
    start_date?: string;
    end_date?: string;
  }>({
    mutationFn: async (payload) => {
      const res = await api.post('/api/admin/analytics/generate', payload);
      return res.data.data ?? res.data;
    },
  });
}
hooks/admin/useAdminLogs.ts
typescriptimport { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { SystemLog, PaginatedResponse } from '@/types/admin';

export function useSystemLogs(filters: {
  page?: number;
  per_page?: number;
  action?: string;
  user_id?: number;
  start_date?: string;
  end_date?: string;
} = {}) {
  return useQuery<PaginatedResponse<SystemLog>>({
    queryKey: ['admin', 'logs', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== '') params.set(k, String(v));
      });
      const res = await api.get(`/api/admin/system/logs?${params.toString()}`);
      return res.data;
    },
    placeholderData: (prev) => prev,
  });
}

Page Implementations
Page 1: /dashboard/admin — Overview
Layout: 4-column stat cards top row → 2-column charts middle → 3-column activity panels bottom.
Stat cards (from GET /api/admin/dashboard/stats):
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Total Users │ │  Providers   │ │ Pending      │ │ Appts Today  │
│    1,247     │ │   34 / 8 ✓  │ │  Content: 6  │ │     12       │
│  +23 this wk │ │ unverified  │ │ Verify: 3    │ │  4 pending   │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
Each stat card: top-left colored accent bar, large number in Playfair Display, sub-label in DM Sans, trend arrow (up/down from last week). Click navigates to relevant section.
Charts row:

Left (2/3 width): Line chart — new user registrations by day for last 30 days, series split by user_type (adolescent, parent, provider, writer). Use Recharts LineChart with custom dot and tooltip.
Right (1/3 width): Donut chart — user type distribution (5 segments, one per role). Center shows total active users.

Bottom panels:

Left: "Pending Actions" — merged list of pending content submissions + unverified providers, each with one-click approve/verify button
Center: "Recent Appointments" — last 5 appointments across all users with status badges
Right: "Recent System Activity" — last 10 SystemLog entries, each showing action, user, and time-ago

Data fetching:
typescript// Use parallel queries for all sections
const stats = useAdminStats();
const pendingContent = usePendingContent();
const providers = useAdminProviders({ page: 1 });
// Generate overview report on mount
const { mutate: generateReport, data: overviewReport } = useGenerateReport();
useEffect(() => {
  generateReport({
    report_type: 'overview',
    start_date: subDays(new Date(), 30).toISOString(),
    end_date: new Date().toISOString(),
  });
}, []);

Page 2: /dashboard/admin/users — User Management
The most complex admin page. Requires a fully-featured data table.
Top bar:
[Search input — filter by name/phone/email]   [Role filter dropdown]   [Status filter: All/Active/Inactive]   [+ Create User]
Table columns (using @tanstack/react-table):
#ColumnSourceNotes✓Checkboxselectionmulti-select for bulk actions1Userfirst_name + last_name + phone_numberAvatar (initials) + name + phone below2Roleuser_type<UserRoleBadge> colored pill3Statusis_activeGreen "Active" / Red "Inactive" dot + label4Joinedcreated_atFormatted date5Profilerole-specific data"Verified ✓" for providers, school for adolescents6Actions—<UserActionMenu> — 3-dot dropdown
UserActionMenu options (per row):

View Profile → opens side panel with full user details
Toggle Status (Activate/Deactivate) → calls PATCH /api/admin/users/{id}/toggle-status
Change Role → opens <RoleChangeModal> → calls PATCH /api/admin/users/{id}/change-role
Reset Password → calls PATCH /api/admin/users/{id}/reset-password with confirm dialog
Delete → opens <ConfirmModal> (danger, explains cascade) → calls DELETE /api/admin/users/{id}

Bulk Action Bar — appears when ≥1 row selected:
[3 users selected]   [Activate]  [Deactivate]  [Change Role ▾]  [Delete (danger)]  [✕ Clear]
Calls POST /api/admin/users/bulk-action with { action, user_ids, value? }
Pagination:
typescript// Controlled pagination state
const [page, setPage] = useState(1);
const [perPage, setPerPage] = useState(20);
const [filters, setFilters] = useState({ user_type: '', search: '', is_active: undefined });

// Debounce search input (300ms)
const debouncedSearch = useDebounce(filters.search, 300);
User Detail Side Panel:
Slides in from the right (Framer Motion x: 400 → 0). Shows:

Avatar (large initials circle)
Full name, phone, email, user type badge, is_active toggle (live)
Role-specific profile data
Recent activity: last 3 notifications, last appointment
"Edit" / "Delete" / "Close" buttons

Wire to: GET /api/admin/users, GET /api/admin/users/{id}, GET /api/admin/users/statistics

Page 3: /dashboard/admin/providers — Health Provider Management
Purpose: Verify new providers, monitor existing providers, manage appointments per provider.
Top summary row:
┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
│  Total Providers   │  │    Verified        │  │   Unverified       │
│       34           │  │       26           │  │       8  ← urgent  │
└────────────────────┘  └────────────────────┘  └────────────────────┘
Provider table columns:
ColumnSourceProviderName + clinic name belowSpecializationspecializationCredentialslicense_number + qualificationStatusis_verified — "Verified ✓" (sage) / "Pending" (amber)Appointmentstotal_appointments countJoinedcreated_atActions<ProviderActionMenu>
ProviderActionMenu:

Verify → opens <ProviderVerifyModal> showing full credentials → calls POST /api/admin/health-providers/{id}/verify
View Appointments → expands row to show appointment list from GET /api/admin/health-providers/{id}/appointments
Edit → opens edit form → calls PUT /api/admin/health-providers/{id}
Remove → confirm → calls DELETE /api/admin/health-providers/{id}

Unverified providers alert banner (shown when pending_verifications > 0):
⚠ 8 health providers are awaiting credential verification.
   [Review Now →]
Clicking "Review Now" scrolls to and highlights unverified rows.
Wire to: GET /api/admin/health-providers, GET /api/admin/health-providers/statistics, POST /api/admin/health-providers/{id}/verify, DELETE /api/admin/health-providers/{id}, GET /api/admin/health-providers/{id}/appointments

Page 4: /dashboard/admin/content — Content Moderation
Layout: Two tabs — "Pending Review" and "All Content"
Pending Review tab:
Each content item card shows:
┌────────────────────────────────────────────────────────────────┐
│  📖 [Category Badge]  [Language: EN]          Submitted 2h ago  │
│                                                                  │
│  "Understanding Your Menstrual Cycle: A Guide for Teenagers"    │
│  By: Amina Uwimana (Content Writer)                             │
│                                                                  │
│  "Menstrual health is an important aspect of overall..."        │
│  [Read full content ↓]                                          │
│                                                                  │
│  [✓ Approve]                              [✕ Reject with reason]│
└────────────────────────────────────────────────────────────────┘
Approve: Single click → PATCH /api/admin/content/{id}/approve → card disappears with success animation → writer notified.
Reject: Opens <ContentRejectModal> with:

Content title (read-only)
Reason textarea (required, min 20 chars)
Guidance text: "The writer will be notified with your reason. Be specific and constructive."
[Cancel] [Send Rejection]
→ PATCH /api/admin/content/{id}/reject with { reason }

Courses tab (sub-tab within content):
typescript// GET /api/admin/courses + GET /api/admin/courses/stats
// PATCH /api/admin/courses/{id}/status
// DELETE /api/admin/courses/{id}
Wire to: GET /api/admin/content/pending, PATCH /api/admin/content/{id}/approve, PATCH /api/admin/content/{id}/reject, GET /api/admin/courses, GET /api/admin/courses/stats

Page 5: /dashboard/admin/analytics — Analytics & Reports
Layout: Report controls top → dynamic chart canvas below.
Report type selector:
Seven report cards in a horizontal scroll row. Each shows icon, name, and description. Selected card has terracotta border.
[📊 Overview]  [👥 User Activity]  [📈 Registrations]  [📖 Content]
[📅 Appointments]  [🩺 Health Tracking]  [💫 Engagement]
Date range picker:
[Last 7 days]  [Last 30 days]  [Last 90 days]  [Custom range...]   [Generate Report]
Dynamic chart canvas (rendered based on report_type):
typescript// overview report → show summary cards + monthly_growth LineChart + user_types BarChart
// user_activity → show daily_active_users LineChart
// user_registrations → show registrations_by_day AreaChart + breakdown BarChart
// content_performance → show content_views BarChart + category_breakdown PieChart
// appointments → show appointments_by_status BarChart + by_type BarChart
// health_tracking → show tracking_logs_by_day LineChart
// engagement → show engagement_metrics RadarChart or composite

function ReportCanvas({ report }: { report: AnalyticsReport | null }) {
  if (!report) return <EmptyReportState />;

  switch (report.report_type) {
    case 'overview': return <OverviewReport data={report} />;
    case 'user_activity': return <UserActivityReport data={report} />;
    case 'user_registrations': return <RegistrationsReport data={report} />;
    case 'content_performance': return <ContentReport data={report} />;
    case 'appointments': return <AppointmentsReport data={report} />;
    case 'health_tracking': return <HealthTrackingReport data={report} />;
    case 'engagement': return <EngagementReport data={report} />;
    default: return null;
  }
}
Each report component takes the raw API response and renders the appropriate Recharts visualization. All charts use the Lady's Essence color palette:

Terracotta #C4785A for primary series
Mauve #7A4F6D for secondary series
Sage #8FAF8A for positive/growth series
Amber #E8A838 for warnings/pending series

Export button (stretch goal): renders report as a printable view with window.print().
Wire to: POST /api/admin/analytics/generate

Page 6: /dashboard/admin/appointments — Appointment Management
Purpose: Admin-level view of all appointments across the platform.
Top filters:
[Date range]  [Status: All/Pending/Confirmed/Completed/Cancelled]  [Provider filter]  [Type filter]
Table columns:
ColumnSourcePatientpatient_name + user_type badgeProviderprovider_name or "Unassigned"Typeappointment_type pillDate/Timescheduled_datetime formattedStatus<StatusBadge>ActionsView detail, Cancel, Reassign provider
Wire to: GET /api/admin/appointments/manage

Page 7: /dashboard/admin/logs — System Activity Logs
Purpose: Audit trail for all admin actions and system events.
Layout: Full-width log viewer with filters.
Filters:
[Search by action]  [Filter by user]  [Date range]  [Clear filters]
Log entry component:
┌──────────────────────────────────────────────────────────────────┐
│  🛡 delete_user                              Nov 22, 2025 14:35   │
│  Admin: Kagabo Eric  •  IP: 192.168.1.100                        │
│  Details: deleted user "John Doe" (id: 42, role: adolescent)     │
└──────────────────────────────────────────────────────────────────┘
Action color coding:

delete_* actions → rose left border
verify_* actions → sage left border
create_* actions → terracotta left border
view_* actions → neutral muted border
update_* / change_* → mauve left border

Auto-refresh every 30 seconds when the page is open (refetchInterval).
Wire to: GET /api/admin/system/logs

Page 8: Broadcast Notification Modal
Accessible from: Admin TopBar → "📣 Broadcast" button (visible only to admin)
typescript// BroadcastModal.tsx
// POST /api/notifications/admin/broadcast

interface BroadcastPayload {
  title: string;
  message: string;
  role?: 'adolescent' | 'parent' | 'health_provider' | 'content_writer' | null; // null = all
  severity: 'info' | 'success' | 'warning' | 'error';
}
UI:
┌────────────────────────────────────────────┐
│  📣 Broadcast Notification                  │
│                                             │
│  Target audience:                           │
│  [All users ▾] [Adolescents] [Parents]      │
│  [Providers]   [Writers]                    │
│                                             │
│  Severity: [info] [success] [⚡ warning] [🔴 error]│
│                                             │
│  Title:  [________________________]        │
│  Message: [                       ]        │
│           [                       ]        │
│                                             │
│  Preview:                                  │
│  ┌──────────────────────────────────────┐  │
│  │ [icon] Title                         │  │
│  │ Message text here...                 │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  [Cancel]              [Send to X users →]  │
└────────────────────────────────────────────┘
Live preview updates as admin types. Shows estimated recipient count based on selected target.

Admin Layout
File: app/dashboard/admin/layout.tsx
tsx'use client';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminTopBar } from '@/components/admin/AdminTopBar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="admin-shell">
        <AdminSidebar />
        <div className="admin-main">
          <AdminTopBar />
          <main className="admin-content">{children}</main>
        </div>
      </div>
    </AdminGuard>
  );
}
AdminSidebar design:
css/* Dark ink sidebar — distinct from user-facing cream dashboards */
.admin-sidebar {
  background: #1A1A2E;
  color: rgba(245, 237, 224, 0.9);  /* cream at 90% */
  width: 240px;
  min-height: 100vh;
  border-right: 1px solid rgba(196, 120, 90, 0.2);
}

/* Active nav item */
.admin-nav-item.active {
  background: rgba(196, 120, 90, 0.15);
  border-left: 3px solid var(--color-terracotta);
  color: var(--color-terracotta);
}

/* Logo area */
.admin-sidebar-logo {
  font-family: var(--font-heading);
  font-size: 20px;
  color: var(--color-cream);
  padding: 24px 20px;
  border-bottom: 1px solid rgba(196, 120, 90, 0.15);
}
Sidebar nav items:
typescriptconst ADMIN_NAV = [
  { label: 'Overview',      href: '/dashboard/admin',              icon: LayoutDashboard },
  { label: 'Users',         href: '/dashboard/admin/users',        icon: Users,         badge: 'total_users' },
  { label: 'Providers',     href: '/dashboard/admin/providers',    icon: Stethoscope,   badge: 'pending_verifications' },
  { label: 'Content',       href: '/dashboard/admin/content',      icon: FileText,      badge: 'pending_content' },
  { label: 'Analytics',     href: '/dashboard/admin/analytics',    icon: BarChart2 },
  { label: 'Appointments',  href: '/dashboard/admin/appointments', icon: Calendar },
  { label: 'Audit Logs',    href: '/dashboard/admin/logs',         icon: ScrollText },
];
Badges (numeric pills) on sidebar items pull from useAdminStats() — pending verifications on Providers, pending content on Content.
AdminTopBar:

Left: page title (dynamic based on route)
Right: [📣 Broadcast] button + [🔔 NotificationBell] + admin avatar + name + role badge "ADMIN"


Reusable Component Specs
<AdminDataTable>
Generic TanStack Table v8 wrapper. Every admin table uses this.
typescriptinterface AdminDataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading: boolean;
  pagination?: {
    page: number;
    total: number;
    perPage: number;
    onPageChange: (page: number) => void;
  };
  onRowSelect?: (rows: T[]) => void;
  emptyMessage?: string;
  searchPlaceholder?: string;
}
Features:

Skeleton rows while isLoading (5 rows of animated shimmer matching column widths)
Row hover state (subtle cream background shift)
Checkbox column for multi-select
Column sorting (click header)
Empty state with illustration when no data

<UserRoleBadge>
typescriptconst ROLE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  adolescent:      { bg: 'rgba(143,175,138,0.2)',  text: '#4A7A45',  label: 'Adolescent' },
  parent:          { bg: 'rgba(196,120,90,0.15)',  text: '#8A4A2A',  label: 'Parent' },
  health_provider: { bg: 'rgba(122,79,109,0.15)',  text: '#5A2F4D',  label: 'Provider' },
  content_writer:  { bg: 'rgba(232,168,56,0.2)',   text: '#8A6010',  label: 'Writer' },
  admin:           { bg: 'rgba(192,57,43,0.15)',   text: '#8A1A0A',  label: 'Admin' },
};
<StatusBadge>
Used for appointment status, content status, user active status.
typescriptconst STATUS_STYLES = {
  // User status
  active:     { color: 'var(--color-sage)',       dot: true },
  inactive:   { color: '#C0392B',                 dot: true },
  // Appointment status
  pending:    { color: '#E8A838',                 dot: false },
  confirmed:  { color: 'var(--color-sage)',       dot: false },
  completed:  { color: 'var(--color-mauve)',      dot: false },
  cancelled:  { color: '#C0392B',                 dot: false },
  // Content status
  approved:   { color: 'var(--color-sage)',       dot: false },
  rejected:   { color: '#C0392B',                 dot: false },
  pending_review: { color: '#E8A838',             dot: false },
};
<ConfirmModal> — Danger Actions
Used before every destructive action (delete user, delete provider, bulk delete).
tsxinterface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  dangerLabel?: string;    // Default: "Delete"
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  consequences?: string[]; // e.g. ["All cycle logs will be deleted", "All appointments removed"]
}
For user deletion, show the cascade consequences from the backend doc:
typescriptconst getUserDeletionConsequences = (userType: string): string[] => {
  const base = ['All notifications deleted', 'All session data cleared'];
  const roleSpecific: Record<string, string[]> = {
    parent:          ['Removed from all parent-child relationships'],
    adolescent:      ['All cycle logs deleted', 'All meal logs deleted', 'All appointments deleted'],
    health_provider: ['All appointments reassigned (provider removed)', 'Account removed from provider list'],
    content_writer:  ['Content items will become authorless (not deleted)'],
  };
  return [...base, ...(roleSpecific[userType] || [])];
};

Error Handling
Every admin mutation must handle the specific error patterns the backend returns:
typescript// In each mutation's onError:
onError: (error: any) => {
  const msg = error?.response?.data?.message || error?.response?.data?.error;
  
  if (msg?.includes('Admin access required')) {
    toast.error('Admin access required. Your session may have changed.');
    return;
  }
  if (msg?.includes('Cannot delete admin users')) {
    toast.error('Admin accounts cannot be deleted through the dashboard.');
    return;
  }
  if (msg?.includes('Insufficient permissions')) {
    toast.error('You do not have permission for this action.');
    return;
  }
  
  toast.error(msg || 'An unexpected error occurred. Please try again.');
}

Performance Requirements

Stats page must load in under 1 second (data already cached 60s, parallel queries)
User table must be paginated — never load more than 20 rows at once
Bulk operations must show progress feedback — loading state on the bulk action bar
Analytics charts must show skeleton while useGenerateReport is pending
Real-time log updates via 30s auto-refetch, not polling — use refetchInterval on the logs query
Sidebar badges pull from the same cached useAdminStats() call — no duplicate requests


Testing Checklist
Authentication

 Non-admin user navigating to /dashboard/admin is redirected to their own dashboard
 Expired token triggers refresh flow correctly before admin API calls
 Admin with is_active=false is rejected at login

User Management

 User table loads, paginates, and filters by role correctly
 Search input is debounced (no request per keystroke)
 Toggle status updates the row immediately (optimistic) then confirms
 Delete user shows cascade consequences in confirm modal
 Bulk action bar appears only when rows are selected
 Bulk delete handles partial failures gracefully

Provider Management

 Unverified providers show amber "Pending" status
 Verify action updates status to "Verified ✓" without page reload
 Provider appointment sub-list loads on row expand

Content Moderation

 Pending queue shows real submission count (not mocked)
 Approve removes card with success animation
 Reject modal validates reason is non-empty before submitting

Analytics

 All 7 report types generate without error
 Charts render with correct Lady's Essence colors
 Date range picker passes ISO strings to backend

Broadcast

 Broadcast modal restricted to admin role only
 Live preview updates as admin types
 Recipient count reflects selected target role

System Logs

 Logs auto-refresh every 30 seconds
 Action color coding is correct
 Detail JSON is readable (formatted, not raw string)


The Admin's Experience
The admin opens this dashboard to operate the platform — not to experience it. Every interaction must be fast, predictable, and authoritative. She should be able to verify a health provider, approve a content submission, and check today's appointment count in under 60 seconds from opening the dashboard.
The design is deliberately darker and more structured than the adolescent or parent dashboards. She is an operator. Build her tools accordingly.