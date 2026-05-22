export type ChildRelationship = 'mother' | 'father' | 'guardian';
export type AccountType = 'self_registered' | 'family_managed';
export type ChildAccessState = 'full_access' | 'full_access_own' | 'privacy_locked';

export interface ChildProfile {
  adolescent_id: number;
  user_id: number;
  name: string;
  date_of_birth?: string;
  relationship_type?: ChildRelationship | string;
  account_type: AccountType;
  has_own_phone: boolean;
  access_granted: boolean;
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

export interface ParentDashboardData {
  children: ChildProfile[];
  total_children: number;
  parent_unread_notifications: number;
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
  has_provided_cycle_info?: boolean;
  created_at?: string;
  relationship_type?: string;
  account_type?: AccountType;
  access_granted?: boolean;
  health_summary?: {
    total_appointments: number;
    completed_appointments: number;
    upcoming_appointments: number;
    last_appointment?: {
      date: string;
      provider?: string;
      notes?: string;
    };
  };
}

export interface ParentAppointment {
  id: number;
  for_user_id?: number;
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
  booked_for_child?: boolean;
  parent_consent_date?: string;
  is_telemedicine?: boolean;
  created_at?: string;
}

export interface AddChildPayload {
  name: string;
  password: string;
  relationship_type: ChildRelationship;
  date_of_birth?: string;
  phone_number?: string;
  email?: string;
}

export interface BookAppointmentPayload {
  provider_id: number;
  child_id: number;
  appointment_date: string;
  issue: string;
  appointment_type_id?: number;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  notes?: string;
  is_telemedicine?: boolean;
}

export interface ParentStoreState {
  activeChildId: number | null;
  children: ChildProfile[];
  setActiveChild: (id: number | null) => void;
  setChildren: (children: ChildProfile[]) => void;
}
