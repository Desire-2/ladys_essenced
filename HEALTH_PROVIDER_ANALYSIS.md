Scope: Build the complete Health Provider frontend in src/pages/providers/, eliminate ALL mock data from the existing provider-related files, wire every component to the real backend, and implement features the current frontend scaffold is missing. The provider dashboard is the clinical nerve center of the platform — it must feel professional, fast, and trust-worthy to a doctor.


Read This First: The Current State Problem
You have existing frontend files for the health provider section. Before building anything new:
Step 1 — Audit Every Existing Provider File
Scan the entire codebase for any file that:

Imports or defines mock data arrays (e.g. const mockAppointments = [...], const DEMO_PROVIDERS = [...])
Uses setTimeout to simulate API delays
Hardcodes provider names, patient names, or appointment data
Has // TODO: connect to API or // temp data comments
Uses Math.random() or Date.now() to generate fake statistics

List every such file. Then replace all of it. Zero mock data tolerance.
Step 2 — Identify What Exists vs What's Missing
The existing frontend likely has:

✅ Some dashboard layout/shell
✅ Possibly a providers list component
✅ Some appointment display components
❌ No real API connection
❌ No availability management UI
❌ No claim-appointment workflow
❌ No clinical notes entry
❌ No real schedule/calendar view
❌ No patient management
❌ No unassigned appointment queue

This prompt covers building all of it from scratch where missing and replacing mock data where it exists.

Backend Fixes Required (Do Before Frontend Work)
Several backend issues must be resolved before the frontend can work correctly.
Fix 1 — Remove All Test Endpoints from Production Code
The backend has /api/health-provider/test/* endpoints with no authentication:

GET /api/health-provider/test/providers
GET /api/health-provider/test/dashboard/stats
GET /api/health-provider/test/appointments
GET /api/health-provider/test/schedule

These are a security risk and a source of mock-data confusion. The frontend may be accidentally hitting these instead of the real authenticated endpoints.
python# In backend/app/routes/health_provider.py:
# REMOVE the entire /test/* route group
# OR: move them behind @health_provider_required during development
# OR: gate them with FLASK_ENV == 'development' check

if current_app.config.get('FLASK_ENV') == 'development':
    @health_provider_bp.route('/test/providers', methods=['GET'])
    def test_providers():
        # ... only available in dev
Mark all test endpoints clearly and ensure the frontend NEVER calls them.
Fix 2 — Standardize Appointment Response Shape
The appointment response from GET /api/health-provider/appointments returns patient_name as a string, but GET /api/health-provider/appointments/{id} returns child_name as a User.id integer. This is a backend bug.
python# In the appointment detail endpoint, fix the response:
# WRONG (current):
"child_name": 456  # This is a user_id, not a name!

# CORRECT:
# Resolve the actual name from the for_user_id or user_id
patient_user = User.query.get(appointment.for_user_id or appointment.user_id)
patient_name = f"{patient_user.first_name} {patient_user.last_name}" if patient_user else "Unknown"

return jsonify({
    "id": appointment.id,
    "patient_name": patient_name,          # ← Fixed
    "patient_user_id": patient_user.id if patient_user else None,
    "provider_name": f"Dr. {provider_user.last_name}",
    # ... rest of fields
})
Apply this fix consistently across all appointment endpoints.
Fix 3 — Add Missing Appointment Fields to API Responses
The appointment model has appointment_type_id, payment_method, location_notes, appointment_for but these are missing from the list response. Add them:
python# In get_provider_appointments() response, include:
{
    "id": appointment.id,
    "patient_name": patient_name,
    "patient_phone": patient_user.phone_number if patient_user else None,
    "patient_email": patient_user.email if patient_user else None,
    "issue": appointment.issue,
    "appointment_date": appointment.appointment_date.isoformat(),
    "preferred_date": appointment.preferred_date.isoformat() if appointment.preferred_date else None,
    "status": appointment.status,
    "priority": appointment.priority,
    "notes": appointment.notes,
    "provider_notes": appointment.provider_notes,
    "is_telemedicine": appointment.is_telemedicine,
    "booked_for_child": appointment.booked_for_child,
    "payment_method": appointment.payment_method,
    "location_notes": appointment.location_notes,
    "created_at": appointment.created_at.isoformat(),
    "updated_at": appointment.updated_at.isoformat() if appointment.updated_at else None,
}
Fix 4 — Add Appointment Status no_show to Frontend Type
The backend supports 'pending'|'confirmed'|'cancelled'|'completed'|'no_show'|'rescheduled' but the frontend may only handle 4. Ensure all 6 are handled.
Fix 5 — Availability Endpoint Needs to Accept Updates
Add PUT /api/health-provider/availability if not fully implemented:
python@health_provider_bp.route('/availability', methods=['GET', 'PUT'])
@health_provider_required
def manage_availability():
    provider = g.provider_profile

    if request.method == 'GET':
        availability = provider.availability_hours or {}
        return jsonify(availability), 200

    if request.method == 'PUT':
        data = request.get_json()
        # Validate structure before saving
        required_days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
        availability = data.get('availability_hours', {})

        # Sanitize: ensure each day has start, end, enabled keys
        for day in required_days:
            if day in availability:
                day_config = availability[day]
                if not isinstance(day_config.get('enabled'), bool):
                    availability[day]['enabled'] = False

        provider.availability_hours = data
        db.session.commit()
        return jsonify({'message': 'Availability updated successfully'}), 200
Fix 6 — Next Available Slot Computation
The endpoint GET /api/health-provider/appointments/next-available-slot must compute real availability from the provider's schedule, not return mock data. Wire it properly:
python@health_provider_bp.route('/appointments/next-available-slot', methods=['GET'])
@health_provider_required
def get_next_available_slot():
    provider = g.provider_profile
    availability = provider.availability_hours or {}
    slot_duration = availability.get('slot_duration', 30)
    buffer_time = availability.get('buffer_time', 15)
    advance_days = availability.get('advance_booking_days', 30)

    from datetime import datetime, timedelta, time as dtime
    now = datetime.utcnow()

    for day_offset in range(advance_days):
        check_date = now.date() + timedelta(days=day_offset + 1)
        day_name = check_date.strftime('%A').lower()
        day_config = availability.get('availability_hours', {}).get(day_name, {})

        if not day_config.get('enabled', False):
            continue

        start_str = day_config.get('start', '09:00')
        end_str = day_config.get('end', '17:00')
        start_h, start_m = map(int, start_str.split(':'))
        end_h, end_m = map(int, end_str.split(':'))

        # Find existing appointments on this date
        day_start = datetime.combine(check_date, dtime(start_h, start_m))
        day_end = datetime.combine(check_date, dtime(end_h, end_m))

        existing = Appointment.query.filter(
            Appointment.provider_id == provider.id,
            Appointment.appointment_date >= day_start,
            Appointment.appointment_date < day_end,
            Appointment.status.in_(['pending', 'confirmed'])
        ).order_by(Appointment.appointment_date).all()

        booked_times = [(a.appointment_date, a.appointment_date + timedelta(minutes=slot_duration + buffer_time))
                        for a in existing]

        slot_time = day_start
        while slot_time + timedelta(minutes=slot_duration) <= day_end:
            # Check break times
            in_break = False
            for b in availability.get('break_times', []):
                b_start = datetime.combine(check_date, dtime(*map(int, b['start'].split(':'))))
                b_end = datetime.combine(check_date, dtime(*map(int, b['end'].split(':'))))
                if b_start <= slot_time < b_end:
                    in_break = True
                    break

            # Check conflicts
            conflict = any(s <= slot_time < e for s, e in booked_times)

            if not in_break and not conflict and slot_time > now:
                return jsonify({
                    'next_available': slot_time.isoformat(),
                    'date': check_date.isoformat(),
                    'time': slot_time.strftime('%H:%M'),
                    'day': day_name.capitalize(),
                }), 200

            slot_time += timedelta(minutes=slot_duration + buffer_time)

    return jsonify({'message': 'No available slots in the next 30 days'}), 404

Architecture
Routing Philosophy
The project uses src/pages/ structure. All provider files live here:
src/
└── pages/
    └── providers/
        ├── index.tsx                        ← Provider dashboard home
        ├── appointments/
        │   ├── index.tsx                    ← All appointments
        │   ├── [id].tsx                     ← Appointment detail
        │   └── unassigned.tsx               ← Claim queue
        ├── schedule/
        │   └── index.tsx                    ← Calendar/schedule view
        ├── patients/
        │   └── index.tsx                    ← Patient list
        ├── availability/
        │   └── index.tsx                    ← Availability management
        ├── notifications/
        │   └── index.tsx                    ← Provider notifications
        └── profile/
            └── index.tsx                    ← Profile management

src/
└── components/
    └── providers/
        ├── ProviderGuard.tsx
        ├── ProviderLayout.tsx
        ├── ProviderSidebar.tsx
        ├── ProviderTopBar.tsx
        ├── StatCard.tsx
        ├── AppointmentCard.tsx
        ├── AppointmentTable.tsx
        ├── AppointmentDetailPanel.tsx
        ├── AppointmentStatusBadge.tsx
        ├── PriorityBadge.tsx
        ├── ClaimAppointmentModal.tsx
        ├── UpdateAppointmentModal.tsx
        ├── ClinicalNotesEditor.tsx
        ├── PatientCard.tsx
        ├── ScheduleCalendar.tsx
        ├── WeekView.tsx
        ├── DayColumn.tsx
        ├── AppointmentSlot.tsx
        ├── AvailabilityEditor.tsx
        ├── DayAvailabilityRow.tsx
        ├── BreakTimeManager.tsx
        ├── BlockedDatesManager.tsx
        └── VerificationBanner.tsx

src/
└── hooks/
    └── providers/
        ├── useProviderDashboard.ts
        ├── useProviderAppointments.ts
        ├── useProviderSchedule.ts
        ├── useProviderPatients.ts
        ├── useProviderAvailability.ts
        ├── useProviderProfile.ts
        └── useProviderNotifications.ts

src/
└── types/
    └── provider.ts

src/
└── services/
    └── providerApi.ts               ← All provider API calls in one place

TypeScript Types
typescript// src/types/provider.ts

export interface ProviderProfile {
  id: number;
  user_id: number;
  name: string;
  email: string;
  license_number: string;
  specialization: string;
  clinic_name: string;
  clinic_address: string;
  phone: string;
  is_verified: boolean;
  availability_hours: AvailabilityConfig;
  created_at: string;
}

export interface AvailabilityConfig {
  availability_hours: Record<Weekday, DayConfig>;
  break_times: BreakTime[];
  custom_slots: Record<string, DayConfig>;      // "YYYY-MM-DD" → DayConfig
  blocked_slots: Record<string, DayConfig>;     // "YYYY-MM-DD" → DayConfig
  slot_duration: number;                        // minutes
  advance_booking_days: number;
  buffer_time: number;                          // minutes between appointments
  timezone: string;
}

export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface DayConfig {
  start: string;   // "HH:MM"
  end: string;     // "HH:MM"
  enabled: boolean;
}

export interface BreakTime {
  start: string;   // "HH:MM"
  end: string;     // "HH:MM"
  label?: string;  // e.g. "Lunch break"
}

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'no_show'
  | 'rescheduled';

export type AppointmentPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface ProviderAppointment {
  id: number;
  patient_name: string;
  patient_phone?: string;
  patient_email?: string;
  patient_user_id?: number;
  issue: string;
  appointment_date: string;
  preferred_date?: string;
  status: AppointmentStatus;
  priority: AppointmentPriority;
  notes?: string;
  provider_notes?: string;
  is_telemedicine: boolean;
  booked_for_child: boolean;
  payment_method?: string;
  location_notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface UnassignedAppointment {
  id: number;
  patient_name: string;
  issue: string;
  preferred_date?: string;
  priority: AppointmentPriority;
  created_at: string;
}

export interface ScheduleDay {
  [date: string]: ScheduleAppointment[];
}

export interface ScheduleAppointment {
  id: number;
  patient_name: string;
  issue: string;
  time: string;   // "HH:MM"
  status: AppointmentStatus;
  priority: AppointmentPriority;
}

export interface Patient {
  id: number;                       // User.id
  name: string;
  phone_number?: string;
  email?: string;
  total_appointments: number;
  last_appointment?: string;
  last_appointment_status?: AppointmentStatus;
}

export interface DashboardStats {
  appointment_stats: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    today: number;
    this_week: number;
    urgent: number;
  };
  recent_appointments: ProviderAppointment[];
  monthly_trends: Array<{
    month: string;
    total_appointments: number;
    completed_appointments: number;
  }>;
  provider_info: {
    name: string;
    specialization: string;
    clinic_name: string;
    is_verified: boolean;
  };
}

export interface UpdateAppointmentPayload {
  appointment_date?: string;
  status?: AppointmentStatus;
  priority?: AppointmentPriority;
  provider_notes?: string;
}

API Service Layer
Create a single API service file. No API calls scattered in components.
typescript// src/services/providerApi.ts
import api from '@/lib/axios';
import type {
  DashboardStats, ProviderAppointment, UnassignedAppointment,
  ScheduleDay, Patient, ProviderProfile, AvailabilityConfig,
  UpdateAppointmentPayload
} from '@/types/provider';

// ── Dashboard ─────────────────────────────────────────────────────────────

export const providerApi = {

  getDashboardStats: async (): Promise<DashboardStats> => {
    // REAL endpoint — NOT the /test/ version
    const res = await api.get('/api/health-provider/dashboard/stats');
    return res.data;
  },

  // ── Appointments ──────────────────────────────────────────────────────

  getAppointments: async (params: {
    page?: number;
    per_page?: number;
    status?: string;
    priority?: string;
    date_filter?: string;
  } = {}): Promise<{ appointments: ProviderAppointment[]; total: number; pages: number; current_page: number }> => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') searchParams.set(k, String(v));
    });
    const res = await api.get(`/api/health-provider/appointments?${searchParams.toString()}`);
    return res.data;
  },

  getAppointment: async (id: number): Promise<ProviderAppointment> => {
    const res = await api.get(`/api/health-provider/appointments/${id}`);
    return res.data;
  },

  getUnassignedAppointments: async (): Promise<{ appointments: UnassignedAppointment[] }> => {
    const res = await api.get('/api/health-provider/appointments/unassigned');
    return res.data;
  },

  claimAppointment: async (appointmentId: number): Promise<{ message: string }> => {
    const res = await api.patch(`/api/health-provider/appointments/${appointmentId}/claim`);
    return res.data;
  },

  updateAppointment: async (
    appointmentId: number,
    payload: UpdateAppointmentPayload
  ): Promise<{ message: string }> => {
    const res = await api.patch(
      `/api/health-provider/appointments/${appointmentId}/update`,
      payload
    );
    return res.data;
  },

  getNextAvailableSlot: async (): Promise<{ next_available: string; date: string; time: string; day: string } | null> => {
    try {
      const res = await api.get('/api/health-provider/appointments/next-available-slot');
      return res.data;
    } catch {
      return null;
    }
  },

  // ── Schedule ──────────────────────────────────────────────────────────

  getSchedule: async (startDate?: string, endDate?: string): Promise<{
    schedule: ScheduleDay;
    provider_info: { name: string; specialization: string; clinic_name: string };
  }> => {
    const params = new URLSearchParams();
    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);
    const res = await api.get(`/api/health-provider/schedule?${params.toString()}`);
    return res.data;
  },

  // ── Patients ──────────────────────────────────────────────────────────

  getPatients: async (): Promise<{ patients: Patient[] }> => {
    const res = await api.get('/api/health-provider/patients');
    return res.data;
  },

  // ── Availability ──────────────────────────────────────────────────────

  getAvailability: async (): Promise<AvailabilityConfig> => {
    const res = await api.get('/api/health-provider/availability');
    return res.data;
  },

  updateAvailability: async (config: AvailabilityConfig): Promise<{ message: string }> => {
    const res = await api.put('/api/health-provider/availability', config);
    return res.data;
  },

  // ── Profile ───────────────────────────────────────────────────────────

  getProfile: async (): Promise<{ profile: ProviderProfile }> => {
    const res = await api.get('/api/health-provider/profile');
    return res.data;
  },

  updateProfile: async (data: Partial<ProviderProfile>): Promise<{ message: string }> => {
    const res = await api.put('/api/health-provider/profile', data);
    return res.data;
  },

  // ── Notifications ─────────────────────────────────────────────────────

  getNotifications: async (page = 1, perPage = 10) => {
    const res = await api.get(`/api/health-provider/notifications?page=${page}&per_page=${perPage}`);
    return res.data;
  },

  markNotificationRead: async (notificationId: number) => {
    const res = await api.patch(`/api/health-provider/notifications/${notificationId}/read`);
    return res.data;
  },

  markAllNotificationsRead: async () => {
    const res = await api.patch('/api/health-provider/notifications/read-all');
    return res.data;
  },
};

Hooks
typescript// src/hooks/providers/useProviderDashboard.ts
import { useQuery } from '@tanstack/react-query';
import { providerApi } from '@/services/providerApi';

export function useProviderDashboard() {
  return useQuery({
    queryKey: ['provider', 'dashboard'],
    queryFn: providerApi.getDashboardStats,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}

// src/hooks/providers/useProviderAppointments.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { providerApi } from '@/services/providerApi';
import toast from 'react-hot-toast';

export function useProviderAppointments(filters: {
  page?: number; status?: string; priority?: string; date_filter?: string;
} = {}) {
  return useQuery({
    queryKey: ['provider', 'appointments', filters],
    queryFn: () => providerApi.getAppointments(filters),
    placeholderData: (prev) => prev,
  });
}

export function useProviderAppointment(id: number) {
  return useQuery({
    queryKey: ['provider', 'appointments', id],
    queryFn: () => providerApi.getAppointment(id),
    enabled: !!id,
  });
}

export function useUnassignedAppointments() {
  return useQuery({
    queryKey: ['provider', 'appointments', 'unassigned'],
    queryFn: providerApi.getUnassignedAppointments,
    refetchInterval: 60_000,  // Check for new unassigned every minute
  });
}

export function useClaimAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (appointmentId: number) => providerApi.claimAppointment(appointmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['provider', 'appointments'] });
      qc.invalidateQueries({ queryKey: ['provider', 'dashboard'] });
      toast.success('Appointment claimed successfully');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message;
      if (msg?.includes('already assigned')) {
        toast.error('This appointment was just claimed by another provider.');
        return;
      }
      toast.error('Failed to claim appointment. Please try again.');
    },
  });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateAppointmentPayload }) =>
      providerApi.updateAppointment(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['provider', 'appointments', id] });
      qc.invalidateQueries({ queryKey: ['provider', 'appointments'] });
      qc.invalidateQueries({ queryKey: ['provider', 'dashboard'] });
      qc.invalidateQueries({ queryKey: ['provider', 'schedule'] });
      toast.success('Appointment updated');
    },
    onError: () => toast.error('Failed to update appointment'),
  });
}

// src/hooks/providers/useProviderSchedule.ts
import { useQuery } from '@tanstack/react-query';
import { providerApi } from '@/services/providerApi';
import { format, addDays } from 'date-fns';

export function useProviderSchedule(startDate?: Date, endDate?: Date) {
  const start = startDate ? format(startDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
  const end = endDate ? format(endDate, 'yyyy-MM-dd') : format(addDays(new Date(), 6), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['provider', 'schedule', start, end],
    queryFn: () => providerApi.getSchedule(start, end),
    staleTime: 30_000,
  });
}

// src/hooks/providers/useProviderAvailability.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { providerApi } from '@/services/providerApi';
import toast from 'react-hot-toast';

export function useProviderAvailability() {
  return useQuery({
    queryKey: ['provider', 'availability'],
    queryFn: providerApi.getAvailability,
    staleTime: 300_000,
  });
}

export function useUpdateAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: providerApi.updateAvailability,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['provider', 'availability'] });
      toast.success('Availability updated successfully');
    },
    onError: () => toast.error('Failed to update availability'),
  });
}

Page Implementations
Page 1: src/pages/providers/index.tsx — Provider Dashboard
Data source: GET /api/health-provider/dashboard/stats — REAL endpoint only.
Unverified provider state: When is_verified === false, show a prominent banner at the top before all other content:
tsx// VerificationBanner.tsx
{!profile?.is_verified && (
  <div className="verification-banner">
    <div className="verification-banner-icon">⏳</div>
    <div className="verification-banner-content">
      <h3>Account Pending Verification</h3>
      <p>
        Your credentials are being reviewed by our team. You will receive full
        access to appointments and patient management once verified.
        This typically takes 1–2 business days.
      </p>
    </div>
  </div>
)}
Layout (verified provider):
┌─────────────────────────────────────────────────────────────────┐
│  Good morning, Dr. Uwimana 🩺           [Clinic: King Faisal]   │
│  Gynecology & Hormonal Health                        Verified ✓  │
└─────────────────────────────────────────────────────────────────┘

Stat cards row:
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Today's     │ │  Pending    │ │  This Week  │ │  Urgent     │
│     2       │ │     3       │ │     8       │ │     1 ⚠     │
│ Appointments│ │  Awaiting   │ │  Scheduled  │ │  Priority   │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘

Two-column middle:
Left (2/3): Today's Schedule
  ── 09:30 ─────────────────────────────────────
  Sarah Johnson  •  Menstrual pain  •  [Confirmed]
  ── 11:00 ─────────────────────────────────────
  Amina Uwase  •  Irregular cycles  •  [Pending]

Right (1/3): Quick Actions
  [📥 Unassigned Queue (3)]
  [📅 View Full Schedule]
  [👤 Patient List]
  
  Next available slot:
  Wednesday Feb 20 at 10:30 AM

Bottom: Monthly Trends Chart (Recharts BarChart)
  Total vs Completed appointments per month (last 6 months)
Data wiring:
typescriptconst { data: stats, isLoading } = useProviderDashboard();
// stats.appointment_stats.today → "Today's Appointments" card
// stats.appointment_stats.pending → "Pending" card
// stats.appointment_stats.this_week → "This Week" card
// stats.appointment_stats.urgent → "Urgent" card (show warning if > 0)
// stats.recent_appointments → today's schedule section
// stats.monthly_trends → BarChart data
// stats.provider_info → greeting + header
Replace ALL mock data. If isLoading, show skeleton cards. If isError, show error state with retry button.

Page 2: src/pages/providers/appointments/index.tsx — Appointment Management
The primary working view for a provider. She spends 80% of her time here.
Filter bar:
[Search patient name]   [Status: All ▾]   [Priority: All ▾]   [Filter: Today | Week | Month | All]
Table columns:
ColumnSourceNotesPatientpatient_nameBold name, show phone below in mutedConcernissueTruncate at 40 charsDate/Timeappointment_dateFormatted: "Feb 15, 2026 at 2:00 PM"Typeis_telemedicine🖥 Remote / 🏥 In PersonPrioritypriority<PriorityBadge>Statusstatus<AppointmentStatusBadge>Actions—[View] + status-dependent buttons
Status badge color system:
typescriptconst STATUS_STYLES: Record<AppointmentStatus, { bg: string; text: string; label: string }> = {
  pending:     { bg: 'rgba(232,168,56,0.15)',  text: '#8A6010', label: 'Pending' },
  confirmed:   { bg: 'rgba(143,175,138,0.2)',  text: '#3D6B39', label: 'Confirmed' },
  completed:   { bg: 'rgba(122,79,109,0.15)',  text: '#4A2F5A', label: 'Completed' },
  cancelled:   { bg: 'rgba(192,57,43,0.12)',   text: '#8A1A0A', label: 'Cancelled' },
  no_show:     { bg: 'rgba(44,44,44,0.1)',     text: '#555555', label: 'No Show' },
  rescheduled: { bg: 'rgba(196,120,90,0.15)',  text: '#7A3A1A', label: 'Rescheduled' },
};
Priority badge:
typescriptconst PRIORITY_STYLES: Record<AppointmentPriority, { color: string; icon: string }> = {
  low:    { color: 'var(--color-sage)',       icon: '↓' },
  normal: { color: 'var(--color-muted)',      icon: '→' },
  high:   { color: '#E8A838',                icon: '↑' },
  urgent: { color: '#C0392B',                icon: '⚠' },
};
Row actions (contextual — shown based on current status):
typescriptfunction getAvailableActions(status: AppointmentStatus) {
  switch (status) {
    case 'pending':
      return ['confirm', 'reschedule', 'cancel'];
    case 'confirmed':
      return ['complete', 'no_show', 'reschedule', 'add_notes'];
    case 'completed':
      return ['view_notes', 'add_notes'];
    case 'rescheduled':
      return ['confirm', 'cancel'];
    default:
      return ['view'];
  }
}
UpdateAppointmentModal — appears when provider clicks any action:
┌───────────────────────────────────────────────────────┐
│  Update: Sarah Johnson's appointment                   │
│  Feb 15, 2026 at 2:00 PM                              │
│                                                        │
│  Change status:                                        │
│  [Confirm] [Complete] [No Show] [Cancel] [Reschedule] │
│                                    ← shown contextually│
│                                                        │
│  Reschedule to: [date + time picker]                  │
│                                                        │
│  Clinical notes:                                       │
│  [                                                   ] │
│  [                                                   ] │
│  [                                                   ] │
│  Markdown supported. Patient will not see these notes. │
│                                                        │
│  [Cancel]                    [Save changes]            │
└───────────────────────────────────────────────────────┘
API: PATCH /api/health-provider/appointments/{id}/update

Page 3: src/pages/providers/appointments/unassigned.tsx — Claim Queue
Purpose: Show all pending appointments with no assigned provider. Provider can browse and claim.
Alert banner at top:
📥 {count} appointments are waiting for a provider
   These patients have no assigned doctor yet. Claiming an appointment
   notifies the patient immediately.
Claim card:
┌──────────────────────────────────────────────────────────────┐
│  [URGENT]                                    Posted 2h ago    │
│                                                               │
│  Mary Uwase  •  15 years old                                  │
│  Concern: "Has been experiencing severe menstrual pain        │
│  for the past two weeks with no relief..."                    │
│                                                               │
│  Preferred date: Feb 18, 2026                                 │
│                                                               │
│  [Claim this appointment →]                                   │
└──────────────────────────────────────────────────────────────┘
Claim button opens ClaimAppointmentModal:
┌─────────────────────────────────────────────────────────┐
│  Claim appointment                                       │
│                                                          │
│  Patient: Mary Uwase                                     │
│  Concern: Severe menstrual pain                          │
│  Preferred date: Feb 18, 2026                            │
│                                                          │
│  By claiming this appointment:                           │
│  ✓ You become the assigned provider                      │
│  ✓ The patient is notified immediately                   │
│  ✓ The appointment moves to your appointments list       │
│                                                          │
│  [Cancel]             [Claim appointment →]              │
└─────────────────────────────────────────────────────────┘
After claiming: appointment disappears from unassigned list (optimistic update), toast success, and the appointments list refreshes.
API: PATCH /api/health-provider/appointments/{id}/claim

Page 4: src/pages/providers/appointments/[id].tsx — Appointment Detail
Full detail view for a single appointment.
← Back to Appointments

┌─────────────────────────────────────┬─────────────────────────┐
│  APPOINTMENT DETAIL                 │  PATIENT                │
│                                     │                         │
│  #1001                  [Confirmed] │  Sarah Johnson          │
│  Feb 15, 2026 at 2:00 PM            │  +250 788 *** ***       │
│  🏥 In person                       │  sarah@email.com        │
│                                     │                         │
│  Concern:                           │  APPOINTMENT HISTORY    │
│  "Irregular menstrual cycles for    │  5 total appointments   │
│  3 months, pain during period"      │  4 completed            │
│                                     │  Last: Jan 15, 2026     │
│  Patient notes:                     │                         │
│  "Prescribed iron tablets already   │  [View patient history] │
│  but no improvement"                │                         │
│                                     │  BOOKED BY:             │
│  Priority: [High ↑]                 │  Parent (Uwase's Mother)│
│                                     │  Booked Feb 10, 2026    │
└─────────────────────────────────────┴─────────────────────────┘

CLINICAL NOTES                                     [Edit notes]
─────────────────────────────────────────────────────────────────
[No clinical notes yet. Add your observations, diagnosis, and    ]
[recommended follow-up after the appointment.                    ]

ACTIONS
─────────────────────────────────────────────────────────────────
[✓ Mark as Confirmed]  [✓ Mark as Completed]  [Mark No Show]  [Cancel]
                               [Reschedule to another time]
ClinicalNotesEditor — appears when provider clicks "Edit notes":

Rich text area (min 3 rows)
Character count display
Auto-save on blur (calls update mutation with provider_notes)
"Markdown supported" hint
"Patient will not see these notes" confidentiality note


Page 5: src/pages/providers/schedule/index.tsx — Week Calendar View
The visual schedule. Shows a 7-day week with appointments as colored blocks.
Week navigation:
[← Previous Week]   Feb 17 – Feb 23, 2026   [Next Week →]   [Today]
Week grid:
       MON 17   TUE 18   WED 19   THU 20   FRI 21   SAT 22   SUN 23
       ───────  ───────  ───────  ───────  ───────  ───────  ───────
09:00  ┌──────┐
       │Sarah │
09:30  │J.    │
       │Conf. │
10:00  └──────┘
10:30           ┌──────┐
                │Mary  │
11:00           │S.    │
                │Pend. │
11:30           └──────┘
...
Each appointment block:

Background color by status (green=confirmed, amber=pending, muted=completed)
Shows patient first name + last initial
Click → opens appointment detail panel (slide-in from right)
Drag would be stretch goal (not required)

Implementation:
typescript// WeekView.tsx
// Data from: useProviderSchedule(weekStart, weekEnd)
// schedule["2026-02-17"] → array of appointments for that day
// Each ScheduleAppointment has: id, patient_name, issue, time, status, priority

// Time slots: render from provider's availability start to end time
// Default: 08:00 to 18:00 in 30-minute slots
// Each appointment block positioned absolutely based on time

function timeToPixels(time: string, dayStartHour: number = 8): number {
  const [h, m] = time.split(':').map(Number);
  const minutesFromStart = (h - dayStartHour) * 60 + m;
  return (minutesFromStart / 30) * 60; // 60px per 30-min slot
}
Mobile fallback: On screens < 768px, show day-by-day list view instead of the grid.
API: GET /api/health-provider/schedule?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD

Page 6: src/pages/providers/patients/index.tsx — Patient List
Simple but important. Every patient the provider has ever seen.
Search bar:
[Search by name or phone number]
Patient cards/table:
┌──────────────────────────────────────────────────────────────┐
│  SJ  Sarah Johnson                    5 appointments         │
│      +250 788 *** ***                 Last: Jan 25, 2026     │
│      sarah@email.com                  Status: Completed       │
└──────────────────────────────────────────────────────────────┘
Click a patient card → opens a side panel showing:

Patient name, contact
Full appointment history with this provider (call GET /api/health-provider/appointments?patient_search=... or filter from existing appointments data)
Last clinical notes (if any)

API: GET /api/health-provider/patients

Page 7: src/pages/providers/availability/index.tsx — Availability Management
The most complex form in the provider section. Lets providers set exactly when they're available.
Layout:
Working Hours
─────────────────────────────────────────────────────────
         Enabled    Start     End
Monday    [✓]      [09:00]  [17:00]
Tuesday   [✓]      [09:00]  [17:00]
Wednesday [✓]      [09:00]  [17:00]
Thursday  [✓]      [09:00]  [17:00]
Friday    [✓]      [09:00]  [15:00]
Saturday  [ ]      [──]     [──]     ← disabled, grayed
Sunday    [ ]      [──]     [──]

Appointment Settings
─────────────────────────────────────────────────────────
Slot duration:        [30 ▾] minutes
Buffer between appts: [15 ▾] minutes
Advance booking:      [30 ▾] days ahead allowed

Break Times
─────────────────────────────────────────────────────────
[Lunch break]  12:00 – 13:00  [Remove]
               [+ Add break time]

Block Dates (Vacation / Unavailable)
─────────────────────────────────────────────────────────
2026-03-15  All day blocked  [Remove]
            [+ Block a date]

[Save Availability]
DayAvailabilityRow component:
typescriptinterface DayAvailabilityRowProps {
  day: Weekday;
  config: DayConfig;
  onChange: (day: Weekday, config: DayConfig) => void;
}

// When enabled toggle is OFF: disable the time inputs and gray them out
// Time inputs: HTML time input type="time"
// Validate: start must be before end
// Validate: minimum 1 hour between start and end
BreakTimeManager component:
typescript// List of existing break times with delete buttons
// "Add break time" button adds a new row with start/end time inputs
// Validate: break times must be within working hours
BlockedDatesManager component:
typescript// Calendar date picker to select a date to block
// List of blocked dates with remove buttons
// Show blocked dates as chips: "Mar 15, 2026 [×]"
Auto-save behavior: Show a "Save Availability" button that is disabled when no changes have been made. On save, call PUT /api/health-provider/availability. Show success/error toast.
API:

GET /api/health-provider/availability — load current settings
PUT /api/health-provider/availability — save changes


Page 8: src/pages/providers/notifications/index.tsx — Notifications
Full notification list using the shared notification components, but filtered to the provider's notifications.
API: GET /api/health-provider/notifications
Notification types for providers:

appointment_assigned → "New appointment: Sarah Johnson (Feb 15)"
appointment_cancelled → "Appointment cancelled: Mary Smith (Feb 18)"
appointment_update → "Appointment updated"
appointment_completed → "Appointment marked complete"

Mark all read button → PATCH /api/health-provider/notifications/read-all

Page 9: src/pages/providers/profile/index.tsx — Profile Management
Sections:
Professional Information:

Name, email, phone
License number (show with masking for display: LIC/*****/12345)
Specialization (text field or dropdown from common specializations)
Clinic name, clinic address, clinic phone

Verification Status:
Account Status:  ✓ Verified                    [Verified badge in sage]
                 or
Account Status:  ⏳ Pending verification        [Amber badge with explanation]
Unverified provider: show what info is needed and that an admin will review.
Danger zone:
No account deletion for providers (admin-controlled). Show: "To request account changes or deactivation, contact your system administrator."
API:

GET /api/health-provider/profile — load profile
PUT /api/health-provider/profile — save changes


Provider Layout & Guard
typescript// src/components/providers/ProviderGuard.tsx
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export function ProviderGuard({ children }: { children: React.ReactNode }) {
  const { user, accessToken } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!accessToken) { router.replace('/login'); return; }
    if (user && user.user_type !== 'health_provider') {
      const routes: Record<string, string> = {
        adolescent: '/dashboard',
        parent: '/dashboard/parent',
        admin: '/dashboard/admin',
        content_writer: '/dashboard/writer',
      };
      router.replace(routes[user.user_type] || '/dashboard');
    }
  }, [user, accessToken]);

  if (!user || user.user_type !== 'health_provider') return null;
  return <>{children}</>;
}
Provider sidebar design: Uses the system's main sidebar pattern but with provider-specific nav items and the Lady's Essence warm color palette (NOT the dark admin theme — providers are practitioners, not operators).
typescriptconst PROVIDER_NAV = [
  { label: 'Dashboard',     href: '/providers',                      icon: LayoutDashboard },
  { label: 'Appointments',  href: '/providers/appointments',         icon: Calendar,        badge: 'pending' },
  { label: 'Claim Queue',   href: '/providers/appointments/unassigned', icon: Inbox,        badge: 'unassigned' },
  { label: 'Schedule',      href: '/providers/schedule',             icon: CalendarDays },
  { label: 'Patients',      href: '/providers/patients',             icon: Users },
  { label: 'Availability',  href: '/providers/availability',         icon: Clock },
  { label: 'Notifications', href: '/providers/notifications',        icon: Bell,            badge: 'unread' },
  { label: 'Profile',       href: '/providers/profile',             icon: UserCircle },
];
Sidebar badges:

pending → count from dashboard_stats.appointment_stats.pending
unassigned → count from unassigned appointments query
unread → unread notification count


Mock Data Elimination Checklist
Search the codebase for every instance of the following patterns and replace with real API calls:
bash# Search patterns to find and eliminate:
grep -r "mockAppointments\|mockProviders\|DEMO_DATA\|fakeData\|sampleData" src/
grep -r "setTimeout.*resolve\|setTimeout.*reject" src/pages/providers/
grep -r "Math.random()\|Date.now()" src/pages/providers/
grep -r "\/test\/providers\|\/test\/appointments\|\/test\/dashboard" src/
grep -r "hardcoded\|// TODO.*API\|temp data\|dummy" src/pages/providers/
grep -r "provider_id.*=.*1\b" src/pages/providers/  # Hardcoded provider ID
For every match:

Identify the real API endpoint from providerApi.ts
Replace with the appropriate hook (useProviderDashboard, etc.)
Add proper loading state (isLoading → skeleton)
Add proper error state (isError → error card with retry)
Add proper empty state (no data → illustrated empty state)


Verification State — Handle Everywhere
Every provider page must handle the unverified state:
typescript// In each page component:
const { data: profile } = useProviderProfile();

// Show VerificationBanner at top of every page if not verified
// Some pages should be fully restricted (e.g. appointments management)
// Some pages available even unverified (e.g. profile, availability setup)

const PAGES_RESTRICTED_TO_VERIFIED = [
  '/providers/appointments',
  '/providers/patients',
  '/providers',  // dashboard stats
];

// VerificationBanner in unverified state on restricted pages:
if (!profile?.is_verified && isRestrictedPage) {
  return (
    <VerificationBanner />
    // No other content shown
  );
}

Testing Checklist
Mock Data Elimination

 Zero files in src/pages/providers/ use hardcoded data arrays
 Zero calls to /api/health-provider/test/* endpoints in frontend
 All provider statistics come from GET /api/health-provider/dashboard/stats
 All appointment data comes from GET /api/health-provider/appointments
 Schedule view comes from GET /api/health-provider/schedule

Functionality

 Dashboard shows real stats from backend (not 0s or fake numbers)
 Unverified provider sees verification banner and restricted content
 Appointment status changes propagate to dashboard stats immediately (query invalidation)
 Claiming an appointment moves it from unassigned queue to appointments list
 Clinical notes save on blur (auto-save pattern) or on button click
 Week calendar renders appointments at correct time positions
 Availability editor saves all fields correctly (check JSON structure in DB)
 Break times added/removed persist after page reload
 Blocked dates added/removed persist after page reload
 Notification badge counts update in sidebar
 Mark all read clears all notification badges

Error States

 Dashboard shows error state when backend unreachable (not blank page)
 Claiming a race-condition appointment shows appropriate error toast
 Profile update failure shows specific error message
 Schedule for a date with no appointments shows "No appointments scheduled"

Backend Integration

 GET /api/health-provider/appointments/{id} returns patient_name as string (not integer)
 PUT /api/health-provider/availability accepts and stores full availability JSON
 GET /api/health-provider/appointments/next-available-slot returns real computed slot
 /test/* endpoints are disabled or gated in production


The Provider's Experience
A verified gynecologist opens Lady's Essence on her tablet at 8:45 AM. She sees her 3 appointments for today, confirms the morning patient, and notices a new urgent unassigned appointment in the claim queue. She claims it and it's immediately on her schedule. Between patients she adds clinical notes to the morning appointment. Before leaving, she blocks next Friday from her availability calendar for a conference.
She never saw a loading spinner longer than half a second. She never saw a hardcoded number. Every stat reflected reality.
Build that.