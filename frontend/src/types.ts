export type UserType = 'parent' | 'adolescent' | 'health_provider' | 'admin' | 'content_writer';

export interface User {
  id: number;
  phone_number: string;
  first_name: string;
  last_name: string;
  email?: string;
  user_type: UserType;
  allow_parent_access: boolean;
  enable_pin_auth?: boolean;
  is_active: boolean;
  created_at: string;
}

export interface CycleLog {
  id: number;
  user_id: number;
  start_date: string;
  end_date?: string;
  end_date_estimated?: string | null;
  end_date_is_inferred?: boolean;
  flow_level: 'light' | 'medium' | 'heavy';
  symptoms: string[];
  notes?: string;
  confidence_score?: number;
  mood?: string | null;
  energy_level?: string | null;
  sleep_quality?: string | null;
  stress_level?: string | null;
  exercise_activities?: string | null;
  created_at: string;
}

export interface MealLog {
  id: number;
  user_id: number;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food_items: string[];
  protein?: number;
  carbs?: number;
  fats?: number;
  calories?: number;
  mood_after?: string;
  created_at: string;
}

export interface Appointment {
  id: number;
  user_id: number;
  user_name?: string;
  health_provider_id?: number;
  health_provider_name?: string;
  appointment_type: 'checkup' | 'consultation' | 'vaccination';
  scheduled_datetime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: 'appointment' | 'cycle' | 'health' | 'system';
  is_read: boolean;
  created_at: string;
}

export interface ContentItem {
  id: number;
  title: string;
  body: string;
  category: string;
  language: 'English' | 'Kinyarwanda' | 'French';
  media_url?: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  views: number;
  likes: number;
  created_at: string;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  modules_count: number;
  status: 'draft' | 'pending' | 'approved';
  created_at: string;
}

export interface ProviderAvailability {
  day_of_week: string; // "Monday", etc.
  slots: string[]; // ["09:00", "10:30"]
}

export interface Child {
  id: number;
  user_id?: number;
  first_name: string;
  last_name: string;
  age: number;
  allow_parent_access: boolean;
  gender: 'female' | 'male';
}

export interface SystemLog {
  id: number;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  action_by?: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
