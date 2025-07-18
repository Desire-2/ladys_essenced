export interface ProviderStats {
  appointment_stats: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    today: number;
    this_week: number;
    urgent: number;
  };
  recent_appointments: Array<{
    id: number;
    patient_name: string;
    issue: string;
    appointment_date: string | null;
    status: string;
    priority: string;
    created_at: string;
  }>;
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

export interface Appointment {
  id: number;
  patient_name: string;
  patient_phone: string;
  patient_email: string;
  issue: string;
  appointment_date: string | null;
  preferred_date: string | null;
  status: string;
  priority: string;
  notes: string;
  provider_notes: string;
  created_at: string;
}

export interface UnassignedAppointment {
  id: number;
  patient_name: string;
  issue: string;
  preferred_date: string | null;
  priority: string;
  created_at: string;
}

export interface Patient {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  total_appointments: number;
  last_appointment: string | null;
  last_appointment_status: string | null;
}

export interface PatientHistory {
  patient: Patient;
  appointments: Appointment[];
}

export interface HealthProvider {
  id: number;
  name: string;
  email: string;
  specialization: string;
  clinic_name: string;
  clinic_address: string;
  phone: string;
  license_number: string;
  is_verified: boolean;
  created_at: string;
}

export interface AvailabilitySchedule {
  is_available: boolean;
  start_time: string;
  end_time: string;
}

export interface WeeklyAvailability {
  [key: string]: AvailabilitySchedule;
}

export interface TimeSlot {
  time: string;
  is_available: boolean;
  appointment_id?: number;
}

export interface Analytics {
  status_breakdown: Record<string, number>;
  priority_breakdown: Record<string, number>;
  success_rate: number;
  total_appointments: number;
  completed_appointments: number;
  average_rating: number;
  daily_counts: Record<string, number>;
  // Additional properties for enhanced analytics
  appointment_trends?: Array<{ date: string; total: number; completed: number; }>;
  patient_demographics?: Record<string, number>;
  total_unique_patients?: number;
  peak_hours?: Array<{ hour: string; count: number; }>;
}

export interface AppointmentForm {
  appointment_date: string;
  status: string;
  priority: string;
  provider_notes: string;
}

export type TabType = 'overview' | 'appointments' | 'unassigned' | 'schedule' | 'patients' | 'book-appointment' | 'profile' | 'analytics' | 'availability';
