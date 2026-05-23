export interface ProviderProfile {
  id: number;
  user_id?: number;
  name: string;
  email: string;
  license_number: string;
  specialization: string;
  clinic_name: string;
  clinic_address: string;
  phone: string;
  is_verified: boolean;
  availability_hours?: AvailabilityConfig;
  created_at: string;
}

export interface AvailabilityConfig {
  availability_hours: Record<Weekday, DayConfig>;
  break_times: BreakTime[];
  custom_slots: Record<string, DayConfig>;
  blocked_slots: Record<string, DayConfig>;
  slot_duration: number;
  advance_booking_days: number;
  buffer_time: number;
  timezone: string;
}

export type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export const WEEKDAYS: Weekday[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export interface DayConfig {
  start: string;
  end: string;
  enabled: boolean;
}

export interface BreakTime {
  start: string;
  end: string;
  label?: string;
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
  appointment_type_id?: number;
  appointment_for?: string;
  created_at: string;
  updated_at?: string;
  booked_by_name?: string;
  booked_by_user_id?: number;
  provider_name?: string;
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
  time: string;
  status: AppointmentStatus;
  priority: AppointmentPriority;
}

export interface Patient {
  id: number;
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

export interface ProviderNotification {
  id: number;
  message: string;
  type: string;
  created_at: string;
  is_read: boolean;
}

export interface NextAvailableSlot {
  next_available: string;
  date: string;
  time: string;
  day: string;
}

export const STATUS_STYLES: Record<
  AppointmentStatus,
  { bg: string; text: string; label: string }
> = {
  pending: { bg: 'rgba(232,168,56,0.15)', text: '#8A6010', label: 'Pending' },
  confirmed: { bg: 'rgba(143,175,138,0.2)', text: '#3D6B39', label: 'Confirmed' },
  completed: { bg: 'rgba(122,79,109,0.15)', text: '#4A2F5A', label: 'Completed' },
  cancelled: { bg: 'rgba(192,57,43,0.12)', text: '#8A1A0A', label: 'Cancelled' },
  no_show: { bg: 'rgba(44,44,44,0.1)', text: '#555555', label: 'No Show' },
  rescheduled: { bg: 'rgba(196,120,90,0.15)', text: '#7A3A1A', label: 'Rescheduled' },
};

export const PRIORITY_STYLES: Record<
  AppointmentPriority,
  { color: string; icon: string }
> = {
  low: { color: 'var(--color-sage)', icon: '↓' },
  normal: { color: 'var(--color-muted)', icon: '→' },
  high: { color: '#E8A838', icon: '↑' },
  urgent: { color: '#C0392B', icon: '⚠' },
};

export const DEFAULT_AVAILABILITY: AvailabilityConfig = {
  availability_hours: {
    monday: { start: '09:00', end: '17:00', enabled: true },
    tuesday: { start: '09:00', end: '17:00', enabled: true },
    wednesday: { start: '09:00', end: '17:00', enabled: true },
    thursday: { start: '09:00', end: '17:00', enabled: true },
    friday: { start: '09:00', end: '17:00', enabled: true },
    saturday: { start: '10:00', end: '14:00', enabled: false },
    sunday: { start: '10:00', end: '14:00', enabled: false },
  },
  break_times: [{ start: '12:00', end: '13:00', label: 'Lunch break' }],
  custom_slots: {},
  blocked_slots: {},
  slot_duration: 30,
  advance_booking_days: 30,
  buffer_time: 15,
  timezone: 'UTC',
};
