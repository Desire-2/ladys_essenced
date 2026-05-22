Core Design Philosophy: This is not a standard "parent monitoring" dashboard. This is a Family Health Hub — designed for households in underserved East African communities where one mobile device serves an entire family. One parent manages multiple children's health records, books appointments, tracks cycles, and receives all notifications on a single device. No child needs their own phone to be protected by this system.

Read This First: The Real User
Before writing a single line of code, understand who is using this:
Uwase's mother has one smartphone. She has three daughters — ages 12, 15, and 17. None of them own phones. She manages their health on her device, switches between their profiles, logs their cycles for them, books their appointments, and receives health alerts on their behalf. When her 15-year-old turns 18 and gets her own phone, she will create her own account and decide whether her mother can continue seeing her data.
This is a proxy health management system disguised as a family dashboard. Every design decision must serve this mental model:

Switching between family member profiles must feel like switching between tabs on a family health record
Every notification must be attributable to a specific child, not "a notification"
Adding a child must feel like adding a family member, not "creating a user account"
The privacy handover (child gets own phone → own account) must be graceful, not disruptive

Backend Improvements Required (Do These First)
Before building frontend, make these backend fixes. Several are blocking.
Fix 1 — Unify the Two Parallel Parent Systems
The backend has two separate blueprint systems for parents that overlap and conflict:

parents_bp at /api/parents/ — manages children and their health data
parent_appointments_bp at /api/parent/ — manages appointment booking

The frontend must work with both, but the backend should expose a consistent interface. Add these missing endpoints without breaking existing ones:
python# ADD to parents_bp (/api/parents/):

# Missing: health summary per child (exists in parent_appointments_bp but not parents_bp)

GET /api/parents/children/{adolescent_id}/health-summary

# Returns: cycle stats, meal stats, appointment summary for one child

# Missing: update child's phone number separately (for when child gets own phone)

PATCH /api/parents/children/{adolescent_id}/phone

# Body: { "phone_number": "+250788..." }

# Side effect: sends verification to the new number if possible

# Missing: toggle child phone number ownership

# When child gets own number, parent updates it + system creates

# an independent adolescent login credential

POST /api/parents/children/{adolescent_id}/grant-independence

# Body: { "phone_number": "+250788...", "send_invite": true }

# Creates: adolescent login via phone_number, sets allow_parent_access=true by default

# Sends: SMS/notification invite to the child if send_invite=true

# Missing: bulk health overview (all children in one call)

GET /api/parents/dashboard

# Returns: all children with their latest cycle status, next predicted period,

# upcoming appointments, any anomalies — in one efficient query

Fix 2 — Appointment Model Gaps
The Appointment model in the backend report shows for_user_id (who it's for) and user_id (who booked it). Verify these columns exist and add them if missing:
python# In Appointment model, ensure these exist:
for_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
booked_for_child = db.Column(db.Boolean, default=False)
parent_consent_date = db.Column(db.DateTime, nullable=True)
priority = db.Column(db.String(20), default='normal')  # low|normal|high|urgent
is_telemedicine = db.Column(db.Boolean, default=False)
issue = db.Column(db.Text, nullable=True)
provider_notes = db.Column(db.Text, nullable=True)
appointment_type_id = db.Column(db.Integer, nullable=True)
payment_method = db.Column(db.String(50), nullable=True)
location_notes = db.Column(db.Text, nullable=True)

# Run migration:

# flask db migrate -m "Add parent appointment fields"

# flask db upgrade

Fix 3 — Child Creation Without Phone Number
Currently POST /api/parents/children requires a phone number per the schema. Change this to truly optional:
python# In the child creation endpoint:

# phone_number: OPTIONAL — null by default

# email: OPTIONAL — auto-generate as child_{user_id}@family.ladysessence.local if not provided

# This allows creating profiles for children who do not own phones

# The child user record should be flagged:

# is_phone_verified = False (when no phone provided)

# account_type = 'family_managed' (new field — distinguishes from self-registered users)

Add account_type to the User model:
pythonaccount_type = db.Column(db.String(20), default='self_registered')

# Values: 'self_registered' | 'family_managed'

# family_managed = created by a parent, may not have own phone

Fix 4 — Parent Dashboard Aggregation Endpoint
python# backend/app/routes/parents.py — ADD this endpoint

@parents_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def parent_dashboard():
    """
    Returns all children with their health status in one call.
    Designed for the family hub overview — avoids N+1 HTTP requests.
    """
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if user.user_type != 'parent':
        return jsonify({'message': 'Parent access required'}), 403

```
parent = Parent.query.filter_by(user_id=current_user_id).first()
if not parent:
    return jsonify({'message': 'Parent profile not found'}), 404

children_data = []
relations = ParentChild.query.filter_by(parent_id=parent.id).all()

for relation in relations:
    adolescent = Adolescent.query.get(relation.adolescent_id)
    if not adolescent:
        continue
    child_user = User.query.get(adolescent.user_id)
    if not child_user:
        continue

    # Access status
    access_granted = child_user.allow_parent_access

    # Latest cycle data (only if access granted)
    cycle_summary = None
    next_period = None
    has_anomaly = False
    if access_granted:
        latest_cycles = CycleLog.query.filter_by(
            user_id=adolescent.user_id
        ).order_by(CycleLog.start_date.desc()).limit(10).all()

        if latest_cycles:
            latest = latest_cycles[0]
            cycle_summary = {
                'last_period_start': latest.start_date.isoformat() if latest.start_date else None,
                'flow_intensity': latest.flow_intensity,
                'total_logs': len(latest_cycles),
            }
            # Try to get prediction
            try:
                from app.routes.cycle_logs import CyclePredictionEngine
                cycle_data = CyclePredictionEngine.extract_cycle_lengths_robust(latest_cycles)
                if cycle_data.get('lengths'):
                    preds = CyclePredictionEngine.predict_next_cycles(latest_cycles, 1)
                    if preds.get('predictions'):
                        next_period = preds['predictions'][0]['predicted_start']
                    anomalies = CyclePredictionEngine.detect_health_anomalies(
                        cycle_data,
                        CyclePredictionEngine.compute_period_lengths(latest_cycles)
                    )
                    has_anomaly = anomalies.get('risk_level') in ('medium', 'high')
            except Exception:
                pass

    # Upcoming appointments
    from datetime import datetime
    upcoming_appts = Appointment.query.filter(
        Appointment.for_user_id == adolescent.user_id,
        Appointment.scheduled_datetime >= datetime.utcnow(),
        Appointment.status.in_(['pending', 'confirmed'])
    ).order_by(Appointment.scheduled_datetime.asc()).limit(2).all()

    # Unread notifications for this child
    unread_notifs = Notification.query.filter_by(
        user_id=adolescent.user_id,
        is_read=False
    ).count()

    children_data.append({
        'adolescent_id': adolescent.id,
        'user_id': adolescent.user_id,
        'name': child_user.first_name or child_user.name,
        'date_of_birth': adolescent.date_of_birth.isoformat() if adolescent.date_of_birth else None,
        'relationship_type': relation.relationship_type,
        'account_type': getattr(child_user, 'account_type', 'family_managed'),
        'has_own_phone': bool(child_user.phone_number),
        'access_granted': access_granted,
        'cycle_summary': cycle_summary,
        'next_period_predicted': next_period,
        'has_health_anomaly': has_anomaly,
        'upcoming_appointments': [
            {
                'id': a.id,
                'date': a.scheduled_datetime.isoformat(),
                'status': a.status,
                'type': a.appointment_type,
            }
            for a in upcoming_appts
        ],
        'unread_notifications': unread_notifs,
    })

# Parent's own unread notifications
parent_unread = Notification.query.filter_by(
    user_id=current_user_id,
    is_read=False
).count()

return jsonify({
    'children': children_data,
    'total_children': len(children_data),
    'parent_unread_notifications': parent_unread,
}), 200
```

Frontend Architecture  
Folder Structure  
All parent pages live under src/dashboard/parent/. This is non-negotiable — they must not bleed into other role directories.  
src/  
└── dashboard/  
    └── parent/  
        ├── layout.tsx                          ← Parent layout (sidebar + family switcher)  
        ├── page.tsx                            ← Family Hub overview  
        ├── children/  
        │   ├── page.tsx                        ← All children overview cards  
        │   ├── add/  
        │   │   └── page.tsx                    ← Add new child wizard  
        │   └── [adolescentId]/  
        │       ├── page.tsx                    ← Individual child overview  
        │       ├── cycle/  
        │       │   └── page.tsx                ← Child's cycle history + log  
        │       ├── meals/  
        │       │   └── page.tsx                ← Child's meal logs  
        │       ├── appointments/  
        │       │   └── page.tsx                ← Child's appointments  
        │       └── settings/  
        │           └── page.tsx                ← Child profile + privacy settings  
        ├── appointments/  
        │   ├── page.tsx                        ← All appointments across all children  
        │   └── book/  
        │       └── page.tsx                    ← Appointment booking wizard  
        └── notifications/  
            └── page.tsx                        ← All family notifications

components/
└── parent/
    ├── ParentGuard.tsx                         ← Role guard
    ├── ParentLayout.tsx
    ├── ParentSidebar.tsx
    ├── FamilySwitcher.tsx                      ← KEY COMPONENT — switch active child
    ├── ChildCard.tsx                           ← Family member card on overview
    ├── ChildHealthBadge.tsx                    ← Compact cycle status badge
    ├── AddChildWizard.tsx                      ← Multi-step add child form
    ├── GrantIndependenceModal.tsx              ← When child gets own phone
    ├── AppointmentBookingWizard.tsx            ← 4-step booking
    ├── AppointmentCard.tsx
    ├── CycleLogForm.tsx                        ← Parent logs cycle for child
    ├── ChildCycleCalendar.tsx
    ├── ChildHealthTimeline.tsx                 ← Combined health events timeline
    ├── FamilyNotificationCenter.tsx            ← All family notifs grouped by child
    └── PrivacyStatusBadge.tsx                  ← Shows access granted/denied

hooks/parent/
    ├── useParentDashboard.ts                   ← Calls GET /api/parents/dashboard
    ├── useChildren.ts                          ← CRUD for children
    ├── useChildHealth.ts                       ← Cycle + meal data per child
    ├── useParentAppointments.ts                ← All appointment operations
    └── useChildNotifications.ts               ← Notifications per child

stores/
└── parentStore.ts                             ← Active child selection + family state

types/
└── parent.ts                                  ← All parent TypeScript types

TypeScript Types
typescript// types/parent.ts

export interface ChildProfile {
  adolescent_id: number;
  user_id: number;
  name: string;
  date_of_birth?: string;
  relationship_type: 'mother' | 'father' | 'guardian';
  account_type: 'self_registered' | 'family_managed';
  has_own_phone: boolean;
  access_granted: boolean;

  // Health status (from dashboard aggregation)
  cycle_summary?: {
    last_period_start?: string;
    flow_intensity?: string;
    total_logs: number;
  };
  next_period_predicted?: string;
  has_health_anomaly: boolean;
  upcoming_appointments: Array<{
    id: number;
    date: string;
    status: string;
    type: string;
  }>;
  unread_notifications: number;
}

export interface ChildDetail {
  id: number;
  user_id: number;
  name: string;
  email?: string;
  phone_number?: string;
  date_of_birth?: string;
  personal_cycle_length?: number;
  personal_period_length?: number;
  has_provided_cycle_info: boolean;
  created_at: string;
  health_summary: {
    total_appointments: number;
    completed_appointments: number;
    upcoming_appointments: number;
    last_appointment?: {
      date: string;
      provider: string;
      notes?: string;
    };
  };
}

export interface ParentAppointment {
  id: number;
  for_user_id: number;
  child_name?: string;
  provider_id?: number;
  provider_name?: string;
  provider_specialization?: string;
  appointment_date: string;
  issue: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  notes?: string;
  provider_notes?: string;
  booked_for_child: boolean;
  parent_consent_date?: string;
  is_telemedicine: boolean;
  created_at: string;
}

export interface AddChildPayload {
  name: string;
  password: string;
  relationship_type: 'mother' | 'father' | 'guardian';
  date_of_birth?: string;
  phone_number?: string;
  email?: string;
}

export interface BookAppointmentPayload {
  provider_id: number;
  child_id: number;
  appointment_date: string;
  issue: string;
  appointment_type_id: number;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  notes?: string;
  is_telemedicine?: boolean;
}

export interface ParentStore {
  activeChildId: number | null;
  children: ChildProfile[];
  setActiveChild: (id: number | null) => void;
  setChildren: (children: ChildProfile[]) => void;
}

Zustand Store — Family State
typescript// stores/parentStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChildProfile, ParentStore } from '@/types/parent';

export const useParentStore = create()(
  persist(
    (set) => ({
      activeChildId: null,      // null = viewing "all family" overview
      children: [],

```
  setActiveChild: (id) => set({ activeChildId: id }),
  setChildren: (children) => set({ children }),
}),
{
  name: 'parent-family-state',
  partialize: (state) => ({ activeChildId: state.activeChildId }),
  // Persist which child was active — restores on app reload
}
```

  )
);

API Hooks
hooks/parent/useParentDashboard.ts
typescriptimport { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import api from '@/lib/axios';
import { useParentStore } from '@/stores/parentStore';
import type { ChildProfile } from '@/types/parent';

export function useParentDashboard() {
  const setChildren = useParentStore((s) => s.setChildren);

  const query = useQuery<{ children: ChildProfile[]; total_children: number; parent_unread_notifications: number }>({
    queryKey: ['parent', 'dashboard'],
    queryFn: async () => {
      const res = await api.get('/api/parents/dashboard');
      return res.data;
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  // Keep Zustand store in sync with server data
  useEffect(() => {
    if (query.data?.children) {
      setChildren(query.data.children);
    }
  }, [query.data]);

  return query;
}
hooks/parent/useChildren.ts
typescriptimport { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import type { ChildDetail, AddChildPayload } from '@/types/parent';

// ── List all children ──────────────────────────────────────────────────────
export function useChildren() {
  return useQuery<ChildDetail[]>({
    queryKey: ['parent', 'children'],
    queryFn: async () => {
      const res = await api.get('/api/parents/children');
      return res.data;
    },
  });
}

// ── Single child detail ────────────────────────────────────────────────────
export function useChild(adolescentId: number) {
  return useQuery({
    queryKey: ['parent', 'children', adolescentId],
    queryFn: async () => {
      const res = await api.get(`/api/parent/children/${adolescentId}/details`);
      return res.data.child ?? res.data;
    },
    enabled: !!adolescentId,
  });
}

// ── Add child ──────────────────────────────────────────────────────────────
export function useAddChild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: AddChildPayload) => {
      const res = await api.post('/api/parents/children', data);
      return res.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['parent'] });
      toast.success(`${data.child?.name || 'Child'} added to your family`);
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message;
      if (msg?.includes('Phone number already registered')) {
        toast.error('This phone number is already registered in the system.');
        return;
      }
      toast.error(msg || 'Failed to add child. Please try again.');
    },
  });
}

// ── Update child ───────────────────────────────────────────────────────────
export function useUpdateChild(adolescentId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial) => {
      const res = await api.put(`/api/parents/children/${adolescentId}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parent', 'children', adolescentId] });
      qc.invalidateQueries({ queryKey: ['parent', 'dashboard'] });
      toast.success('Profile updated');
    },
    onError: () => toast.error('Failed to update profile'),
  });
}

// ── Delete child ───────────────────────────────────────────────────────────
export function useDeleteChild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (adolescentId: number) => {
      const res = await api.delete(`/api/parents/children/${adolescentId}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parent'] });
      toast.success('Profile removed from family');
    },
    onError: () => toast.error('Failed to remove profile'),
  });
}

// ── Grant independence (child gets own phone) ──────────────────────────────
export function useGrantIndependence(adolescentId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { phone_number: string; send_invite: boolean }) => {
      const res = await api.post(
        `/api/parents/children/${adolescentId}/grant-independence`,
        data
      );
      return res.data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['parent'] });
      toast.success(
        vars.send_invite
          ? 'Independence granted and invite sent to their phone'
          : 'Independence granted — they can now log in with their phone number'
      );
    },
    onError: () => toast.error('Failed to grant independence'),
  });
}
hooks/parent/useChildHealth.ts
typescriptimport { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

// ── Cycle logs ─────────────────────────────────────────────────────────────
export function useChildCycleLogs(adolescentId: number, page = 1) {
  return useQuery({
    queryKey: ['parent', 'children', adolescentId, 'cycle-logs', page],
    queryFn: async () => {
      const res = await api.get(
        `/api/parents/children/${adolescentId}/cycle-logs?page=${page}&per_page=10`
      );
      return res.data;
    },
    enabled: !!adolescentId,
  });
}

export function useCreateChildCycleLog(adolescentId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post(
        `/api/parents/children/${adolescentId}/cycle-logs`,
        data
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parent', 'children', adolescentId] });
      qc.invalidateQueries({ queryKey: ['parent', 'dashboard'] });
      toast.success('Cycle log saved');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message;
      if (msg?.includes('disabled parent access')) {
        toast.error('This profile has privacy mode enabled. You cannot log data for them.');
        return;
      }
      toast.error('Failed to save cycle log');
    },
  });
}

// ── Meal logs ──────────────────────────────────────────────────────────────
export function useChildMealLogs(adolescentId: number, page = 1) {
  return useQuery({
    queryKey: ['parent', 'children', adolescentId, 'meal-logs', page],
    queryFn: async () => {
      const res = await api.get(
        `/api/parents/children/${adolescentId}/meal-logs?page=${page}&per_page=10`
      );
      return res.data;
    },
    enabled: !!adolescentId,
  });
}
hooks/parent/useParentAppointments.ts
typescriptimport { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import type { BookAppointmentPayload, ParentAppointment } from '@/types/parent';

export function useChildAppointments(childId: number, filters?: {
  status?: string; date_from?: string; date_to?: string;
}) {
  return useQuery({
    queryKey: ['parent', 'children', childId, 'appointments', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.date_from) params.set('date_from', filters.date_from);
      if (filters?.date_to) params.set('date_to', filters.date_to);
      const res = await api.get(
        `/api/parent/children/${childId}/appointments?${params.toString()}`
      );
      return res.data;
    },
    enabled: !!childId,
  });
}

export function useBookAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: BookAppointmentPayload) => {
      const res = await api.post('/api/parent/book-appointment-for-child', data);
      return res.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['parent'] });
      toast.success(`Appointment booked for ${data.appointment?.child_name}`);
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message;
      if (msg?.includes('Time slot no longer available') || error?.response?.status === 409) {
        toast.error('That time slot is no longer available. Please choose another time.');
        return;
      }
      if (msg?.includes('appointment in past') || msg?.includes('past')) {
        toast.error('Appointment date must be in the future.');
        return;
      }
      toast.error(msg || 'Booking failed. Please try again.');
    },
  });
}

export function useCancelAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (appointmentId: number) => {
      const res = await api.post(`/api/parent/appointments/${appointmentId}/cancel`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parent'] });
      toast.success('Appointment cancelled');
    },
    onError: (error: any) => {
      const status = error?.response?.status;
      const msg = error?.response?.data?.message;
      if (status === 410) {
        if (msg?.includes('24 hours')) {
          toast.error('Appointments must be cancelled at least 24 hours in advance.');
        } else {
          toast.error('This appointment has already passed.');
        }
        return;
      }
      toast.error('Failed to cancel appointment');
    },
  });
}

export function useRescheduleAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ appointmentId, newDate }: { appointmentId: number; newDate: string }) => {
      const res = await api.post(`/api/parent/appointments/${appointmentId}/reschedule`, {
        new_appointment_date: newDate,
      });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parent'] });
      toast.success('Appointment rescheduled');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message;
      if (msg?.includes('already cancelled') || msg?.includes('cannot be rescheduled')) {
        toast.error('This appointment cannot be rescheduled in its current state.');
        return;
      }
      toast.error('Failed to reschedule. Please try again.');
    },
  });
}

Page Designs
Page 1: /dashboard/parent — Family Hub
This is the heart of the entire parent experience. It must answer one question at a glance: How is each member of my family doing right now?
Data: GET /api/parents/dashboard — one call, all children.
Layout:
Top: Greeting + parent's own notification bell (parent's unread count)
     "Mwaramutse, Uwase's Mother ❤"
     "You are caring for 3 family members"

Middle: Family Member Cards (horizontal scroll on mobile, grid on desktop)
     [Card: Amina, 17]  [Card: Grace, 15]  [Card: Bella, 12]  [+ Add Member]

Bottom: Timeline — Today's events across ALL family members combined
     sorted by time
     "Amina: Period predicted today 🌸"
     "Grace: Appointment with Dr. Uwimana at 2:00 PM 📅"
     "Bella: Cycle log due (last logged 32 days ago)"
ChildCard component — the most important UI element in the entire parent section:
┌──────────────────────────────────────────────┐
│  [Avatar: initials in mauve circle]           │
│  Amina                              [notif 2] │
│  17 years  •  Daughter                        │
│                                               │
│  Next period: Jun 3                      🌸   │
│  ━━━━━━━━━━━━━━━━━━━━━░░░░  18 days away      │
│                                               │
│  Appointment: Tomorrow 2PM       📅  Pending  │
│                                               │
│  [⚠ Health pattern changed]   ← shown if anomaly │
│                                               │
│  [View Profile →]                             │
└──────────────────────────────────────────────┘
For a child with privacy mode ON (access_granted: false):
┌──────────────────────────────────────────────┐
│  [Avatar: faded/muted]                        │
│  Grace                                        │
│  15 years  •  Daughter                        │
│                                               │
│  🔒 Privacy mode is on                        │
│  Grace has chosen to manage her own           │
│  health data privately.                       │
│                                               │
│  [View Profile →]  (limited — no health data) │
└──────────────────────────────────────────────┘
For a child without a phone number (has_own_phone: false):
┌──────────────────────────────────────────────┐
│  [Avatar]                                     │
│  Bella                                        │
│  12 years  •  Daughter                        │
│                                               │
│  [health data as normal]                      │
│                                               │
│  Managed account  •  No phone yet             │
│  [Add phone number when ready]                │
└──────────────────────────────────────────────┘

Page 2: /dashboard/parent/children — All Family Members
Full-width grid of all children with expanded stats. Each card is clickable to navigate to that child's individual profile.
"+ Add Family Member" button (terracotta, top right) opens the Add Child Wizard.

Page 3: /dashboard/parent/children/add — Add Family Member Wizard
This is not a "create user" form. It is "add a family member." Language matters.
4-step wizard with progress indicator:
Step 1 of 4: Who are you adding?
────────────────────────────────────────
[Large illustrated role selector]

  [👨‍👧 Daughter]    [👨‍👦 Son (future scope)]
     ← Select relationship type

  Your relationship: [Mother ▾] / [Father ▾] / [Guardian ▾]

[Next →]

────────────────────────────────────────
Step 2 of 4: About her
────────────────────────────────────────
Full name *           [***]
Date of birth         [***]  ← date picker

Phone number          [___________________]
(optional — add now or later when she gets a phone)

[← Back]  [Next →]

────────────────────────────────────────
Step 3 of 4: Set up her account
────────────────────────────────────────
"Create a password she can use to log in on her own phone when she's ready."

Password *            [***]
Confirm password *    [***]

Password tip: Something easy to remember when she is ready to log in herself.

[← Back]  [Next →]

────────────────────────────────────────
Step 4 of 4: Review & add
────────────────────────────────────────
Name:          Amina
Relationship:  Daughter (Mother)
Date of birth: May 15, 2007 (17 years old)
Phone:         Not added yet

"Amina will be added to your family. You can log her health data, book appointments,
and manage her profile. She can add her own phone number and take control of her 
account whenever she is ready."

[← Back]  [✓ Add Amina to Family]
API: POST /api/parents/children
After success: redirect to /dashboard/parent/children/{adolescent_id} with a welcome banner.

Page 4: /dashboard/parent/children/[adolescentId] — Individual Child Profile
This is the child-specific dashboard. Accessed when parent taps a child card.
Top section — child header:
← Back to Family                                          [Edit Profile] [⋮ More]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Large avatar: initials]   Amina
                           17 years old  •  Daughter
                           Managed by you  [🔒 Privacy: On/Off indicator]
4 tab sections:
Tab 1: Overview

Cycle status card (next period prediction, regularity, last logged)
Last 3 appointments timeline
Upcoming: next predicted period + upcoming appointment
Health alerts (anomalies if any)
Nutrition summary (meals this week)
"+ Log Period" and "+ Book Appointment" action buttons

Tab 2: Cycle & Health → /dashboard/parent/children/[id]/cycle

Mini calendar highlighting period days
Cycle logs table (paginated from GET /api/parents/children/{id}/cycle-logs)
"+ Log New Period" button → CycleLogForm modal
Stats: average cycle, regularity, predictions

Tab 3: Meals → /dashboard/parent/children/[id]/meals

Meal log list (from GET /api/parents/children/{id}/meal-logs)
Weekly nutrition summary

Tab 4: Appointments → /dashboard/parent/children/[id]/appointments

Filter by status
Each appointment card: provider, date, status, actions (cancel/reschedule)
"+ Book Appointment" → booking wizard

Page 5: /dashboard/parent/children/[adolescentId]/cycle — Log Cycle for Child
Data: GET /api/parents/children/{id}/cycle-logs
Layout: Same as adolescent cycle tracker but clearly labeled "Amina's Cycle History"
Log form fields (parent logging for child):
Period start date *      [date picker]
Period end date          [date picker]
Flow intensity           [Light] [Medium] [Heavy]
Symptoms                 [multi-select chips: Cramps, Headache, Mood Swings,
                          Back Pain, Fatigue, Bloating, Nausea]
Mood                     [😔 Very Low] [😐 Low] [😊 Neutral] [😄 Good] [🌟 Very Good]
Energy level             [Very Low] [Low] [Moderate] [High]
Sleep quality            [Poor] [Fair] [Good] [Excellent]
Stress level             [Low] [Moderate] [High] [Very High]
Exercise                 [Walking] [Running] [Yoga] [Other...]
Notes                    [text area]
Important UX note: When access_granted: false, this entire page shows:
┌─────────────────────────────────────────────────────┐
│  🔒 Grace has enabled privacy mode                  │
│                                                      │
│  Grace has chosen to manage her own health data      │
│  privately. You can still book appointments for her  │
│  and receive appointment notifications.              │
│                                                      │
│  This is her right as she grows into managing her    │
│  own health.                                         │
│                                                      │
│  [Book Appointment for Grace]                        │
└─────────────────────────────────────────────────────┘
API: POST /api/parents/children/{id}/cycle-logs

Page 6: /dashboard/parent/appointments — All Family Appointments
Purpose: See every appointment across all children in one place.
Filters:
[All children ▾]  [All statuses ▾]  [Date range]
Grouped by child:
── Amina ─────────────────────────────────────────
  [Appointment card]
  [Appointment card]

── Grace ─────────────────────────────────────────
  [Appointment card]

[+ Book New Appointment]
AppointmentCard component:
┌──────────────────────────────────────────────────┐
│  For: Amina               📅 Feb 15, 2026 2:00PM │
│  Dr. Uwimana  •  Gynecology                       │
│  Concern: Irregular periods                       │
│  [Confirmed ✓]                                    │
│                                  [Cancel] [⋮]    │
└──────────────────────────────────────────────────┘
Status badge colors:

pending → amber background
confirmed → sage background
completed → mauve background
cancelled → muted/strikethrough

Cancel/Reschedule actions call respective mutations with 24h-enforcement handled in error toast.

Page 7: /dashboard/parent/appointments/book — Appointment Booking Wizard
4-step booking wizard. The most complex form in the parent section.
Step 1 of 4: Who is this appointment for?
────────────────────────────────────────
[Child profile cards — tap to select]
  [Amina, 17 ✓ selected]  [Grace, 15]  [Bella, 12]

Step 2 of 4: What is the concern?
────────────────────────────────────────
Health concern *          [text area — describe the issue]
Appointment type *        [Checkup ▾] / [Consultation ▾] / [Vaccination ▾]
Priority                  [Normal ▾]  ← default
                          Low / Normal / High / Urgent

Is this a telemedicine (remote) appointment?
  [ ] No, in person    [✓] Yes, remote call

Step 3 of 4: Choose a doctor
────────────────────────────────────────
[Search providers: "gynecology", "Dr. ..."]

[Provider cards from GET /api/health-provider/providers]

  Dr. Uwimana Aline
  Gynecology & Hormonal Health
  King Faisal Hospital
  ⭐ Verified  •  Available

  [Select →]

Step 4 of 4: Choose a date and time
────────────────────────────────────────
[Calendar — future dates only, grayed-out unavailable]

Available times on Feb 15:
  [9:00 AM]  [10:30 AM]  [2:00 PM ✓]  [3:30 PM]

Notes for the doctor (optional):
[text area]

─────────────────────────────────────
Review:
  For: Amina
  Doctor: Dr. Uwimana Aline
  Date: February 15, 2026 at 2:00 PM
  Concern: Irregular periods for 3 months
  Type: Consultation

  ☑ I consent to this appointment being booked on behalf of Amina

[← Back]  [✓ Book Appointment]
API: POST /api/parent/book-appointment-for-child
After success: redirect to /dashboard/parent/appointments with success banner showing the booked appointment.

Page 8: /dashboard/parent/children/[id]/settings — Child Profile & Privacy
Purpose: Edit child information AND handle the "independence handover" scenario.
Sections:
Profile:

Name, date of birth, relationship type
Phone number (with "Add phone number" CTA if none)

Account Status:
Account type: Managed Family Account

Amina does not yet have her own phone number registered.
When she gets her own phone, you can add it here and she
will be able to log in on her own.

[+ Add Phone Number for Amina]
When phone is already set:
Phone: +250 788 *** ***  [Update]

Independence:
Amina can log in on her own with this phone number.
She currently allows you to view her health data.
[Amina's privacy setting: Full Access ✓]

When Amina turns 18 or chooses to manage her own account,
she can change her privacy settings from her own login.
Grant Independence Modal (GrantIndependenceModal.tsx):
┌──────────────────────────────────────────────────────────┐
│  Give Amina her own account                               │
│                                                           │
│  Amina's phone number: [+250 788......]                   │
│                                                           │
│  This will:                                               │
│  ✓ Let Amina log in with her own phone number             │
│  ✓ Keep your access to her data (she can change this)    │
│  ✓ Send her an invite message if you choose              │
│                                                           │
│  [ ] Send Amina an invitation message                     │
│                                                           │
│  [Cancel]          [Give Amina her own account →]         │
└──────────────────────────────────────────────────────────┘
API: POST /api/parents/children/{id}/grant-independence
Danger Zone:
Remove from family
─────────────────
This will remove Amina from your family dashboard.
Her health data will not be deleted.

[Remove Amina from family]
→ DELETE /api/parents/children/{adolescentId} with ConfirmModal.

Page 9: /dashboard/parent/notifications — Family Notification Center
Purpose: All notifications, clearly attributed to the right family member.
Layout: Grouped by family member with individual badges:
Filter: [All] [Amina] [Grace] [Bella] [Mine]

── Today ───────────────────────────────────────

  [🌸 Amina]  Cycle prediction updated
              Next period expected June 3 · 2h ago     [unread dot]

  [📅 Grace]  Appointment confirmed
              Dr. Uwimana on Feb 15 at 2PM · 4h ago

── Yesterday ───────────────────────────────────

  [⚠ Bella]   Health pattern alert
              An irregular pattern was detected · 1d ago

  [👤 You]    Appointment booked successfully
              Booked for Grace with Dr. Uwimana · 1d ago
Each notification shows:

Colored avatar pill: child's initial in their assigned color, or "You" for parent's own
Title bold, message 2-line truncated
Time ago
Unread dot (filled terracotta circle)
On click: mark read + navigate to action_data.route

Child color assignment — generate a consistent color per child from their adolescent_id:
typescriptconst CHILD_COLORS = [
  { bg: 'rgba(196,120,90,0.2)',  text: '#C4785A' },  // terracotta
  { bg: 'rgba(122,79,109,0.2)',  text: '#7A4F6D' },  // mauve
  { bg: 'rgba(143,175,138,0.2)', text: '#5A8F56' },  // sage
  { bg: 'rgba(232,168,56,0.2)',  text: '#B8860B' },  // amber
];

export function getChildColor(adolescentId: number) {
  return CHILD_COLORS[adolescentId % CHILD_COLORS.length];
}

Key Component: FamilySwitcher
This component appears in the sidebar of the parent layout at all times. It lets the parent instantly switch their active context between family members.
┌─────────────────────────────┐
│  FAMILY                      │
│                              │
│  [● All Members]  ← selected │
│                              │
│  [A] Amina          [notif 2]│
│  [G] Grace          🔒       │
│  [B] Bella                   │
│                              │
│  [+ Add member]              │
└─────────────────────────────┘
Selecting a child sets useParentStore().activeChildId. The parent layout reads this and:

Highlights the active child in the sidebar
Shows child-specific content in the main area
Contextualizes breadcrumbs and page titles

typescript// components/parent/FamilySwitcher.tsx
'use client';
import { useParentStore } from '@/stores/parentStore';
import { useParentDashboard } from '@/hooks/parent/useParentDashboard';
import { useRouter, usePathname } from 'next/navigation';
import { getChildColor } from '@/lib/utils';

export function FamilySwitcher() {
  const { activeChildId, setActiveChild } = useParentStore();
  const { data } = useParentDashboard();
  const router = useRouter();

  const handleSelectChild = (id: number | null) => {
    setActiveChild(id);
    if (id === null) {
      router.push('/dashboard/parent');
    } else {
      router.push(`/dashboard/parent/children/${id}`);
    }
  };

  return (
    
      FAMILY

```
  <button
    onClick={() => handleSelectChild(null)}
    className={`family-switcher-item ${!activeChildId ? 'active' : ''}`}
  >
    <span className="switcher-dot all" />
    All Members
  </button>

  {data?.children.map((child) => {
    const color = getChildColor(child.adolescent_id);
    return (
      <button
        key={child.adolescent_id}
        onClick={() => handleSelectChild(child.adolescent_id)}
        className={`family-switcher-item ${activeChildId === child.adolescent_id ? 'active' : ''}`}
      >
        <span
          className="switcher-avatar"
          style={{ background: color.bg, color: color.text }}
        >
          {child.name.charAt(0).toUpperCase()}
        </span>
        <span className="switcher-name">{child.name}</span>
        {!child.access_granted && <span className="switcher-lock">🔒</span>}
        {child.unread_notifications > 0 && (
          <span className="switcher-badge">{child.unread_notifications}</span>
        )}
      </button>
    );
  })}

  <button
    className="family-switcher-add"
    onClick={() => router.push('/dashboard/parent/children/add')}
  >
    + Add member
  </button>
</nav>
```

  );
}

Parent Layout
tsx// app/dashboard/parent/layout.tsx
'use client';
import { ParentGuard } from '@/components/parent/ParentGuard';
import { ParentSidebar } from '@/components/parent/ParentSidebar';
import { FamilySwitcher } from '@/components/parent/FamilySwitcher';
import { TopBar } from '@/components/layout/TopBar';

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    
      
        {/* Left sidebar: nav + family switcher */}
        

```
    {/* Main content */}
    <div className="parent-main">
      <TopBar />
      <main className="parent-content">{children}</main>
    </div>
  </div>
</ParentGuard>
```

  );
}
Parent sidebar nav items:
typescriptconst PARENT_NAV = [
  { label: 'Family Hub',      href: '/dashboard/parent',              icon: Home },
  { label: 'Family Members',  href: '/dashboard/parent/children',     icon: Users },
  { label: 'Appointments',    href: '/dashboard/parent/appointments', icon: Calendar },
  { label: 'Notifications',   href: '/dashboard/parent/notifications',icon: Bell,   badge: true },
  { label: 'Settings',        href: '/settings',                      icon: Settings },
];

Privacy & Access State: Handle Every Case
The system has 3 access states for a child. Every page must handle all 3:
typescripttype ChildAccessState =
  | 'full_access'          // access_granted: true, has_own_phone: false (family managed)
  | 'full_access_own'      // access_granted: true, has_own_phone: true (child has phone but allows access)
  | 'privacy_locked';      // access_granted: false (child disabled access)

function getAccessState(child: ChildProfile): ChildAccessState {
  if (!child.access_granted) return 'privacy_locked';
  if (child.has_own_phone) return 'full_access_own';
  return 'full_access';
}
Render states:

full_access → full data + all actions
full_access_own → full data + note "Amina manages this account" + all actions
privacy_locked → privacy screen (no health data visible) + only "Book Appointment" allowed

Error Handling Reference
Wire these specific error codes to specific user-facing messages:
typescriptconst PARENT_ERROR_MESSAGES: Record<number, string> = {
  403: 'This family member has enabled privacy mode.',
  404: 'This family member was not found.',
  409: 'That time slot is no longer available.',
  410: 'This appointment cannot be changed (either passed or within 24 hours).',
};

function getParentErrorMessage(error: any): string {
  const status = error?.response?.status;
  const msg = error?.response?.data?.message || '';

  if (msg.includes('disabled parent access') || msg.includes('privacy')) {
    return 'This family member has enabled privacy mode.';
  }
  if (msg.includes('24 hours')) {
    return 'Appointments must be cancelled at least 24 hours in advance.';
  }
  if (msg.includes('not associated')) {
    return 'This family member is not linked to your account.';
  }
  return PARENT_ERROR_MESSAGES[status] || 'Something went wrong. Please try again.';
}

Checklist: Definition of Done
Backend Additions

 GET /api/parents/dashboard endpoint returns all children with health summaries
 POST /api/parents/children accepts null phone_number without error
 User.account_type field added with migration
 PATCH /api/parents/children/{id}/phone endpoint works
 POST /api/parents/children/{id}/grant-independence works and sets account_type='self_registered'
 Appointment model has all extended fields (for_user_id, booked_for_child, priority, etc.)
 All appointment error responses include meaningful messages (24h rule, past date, etc.)

Frontend — Structure

 All parent pages live under app/dashboard/parent/
 ParentGuard redirects non-parent users to their own dashboard
 FamilySwitcher in sidebar works and persists active child selection
 Parent layout uses dark warm sidebar, cream content area

Frontend — Pages

 /dashboard/parent — Family Hub with all child cards and daily timeline
 /dashboard/parent/children — All family members grid
 /dashboard/parent/children/add — 4-step wizard, phone optional
 /dashboard/parent/children/[id] — Individual child profile with 4 tabs
 /dashboard/parent/children/[id]/cycle — Cycle logs + log form
 /dashboard/parent/children/[id]/meals — Meal logs view
 /dashboard/parent/children/[id]/appointments — Child's appointments
 /dashboard/parent/children/[id]/settings — Profile edit + independence handover
 /dashboard/parent/appointments — All family appointments
 /dashboard/parent/appointments/book — 4-step booking wizard
 /dashboard/parent/notifications — Family notifications grouped by child

Frontend — Behavior

 Privacy mode (access_granted: false) shows appropriate locked state on all pages
 Children without phone numbers (has_own_phone: false) show "managed account" indicator
 GrantIndependenceModal works and updates child profile correctly
 Appointment booking wizard respects provider availability (409 error handled)
 24-hour cancellation rule is enforced in UI (disable cancel button for <24h appointments) AND handled in error toast
 Child color coding is consistent across all components (same color per child)
 Parent can switch between children via sidebar without page reload
 useParentDashboard single call powers the family hub overview
 All mutations show optimistic updates OR at minimum disable button + show loading state
 Empty states for all lists (no cycles logged yet, no appointments, etc.)

The Core Principle
A mother in rural Rwanda should be able to pick up the family's one phone, open Lady's Essence, see that Amina's period is predicted in 5 days, see that Grace has an appointment tomorrow, notice that Bella's cycle pattern has changed, and book Bella an appointment — all in under 3 minutes, without confusion, without technical friction, and with the confidence that her daughters' health is being watched over.
Build that experience.