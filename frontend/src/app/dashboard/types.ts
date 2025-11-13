// Dashboard Types and Interfaces
export interface User {
  id: number;
  name: string;
  user_type: 'parent' | 'adolescent';
}

export interface Child {
  id: number;
  name: string;
  date_of_birth?: string;
  user_id: number; // Required for proper parent-child relationships
  relationship?: string;
  phone_number?: string;
}

export interface CycleData {
  nextPeriod: string | null;
  lastPeriod: string | null;
  cycleLength: number | null;
  periodLength: number | null;
  totalLogs: number;
}

export interface MealLog {
  id: number;
  date?: string;
  meal_time?: string;
  meal_type: string;
  details?: string;
  description?: string;
}

export interface Appointment {
  id: number;
  date?: string;
  appointment_date?: string;
  issue: string;
  status: string;
  for_user?: string;
}

export interface Notification {
  id: number;
  message: string;
  date: string;
  is_read: boolean;
}

// Data loading states
export interface DataLoadingStates {
  children: boolean;
  cycle: boolean;
  meals: boolean;
  appointments: boolean;
  notifications: boolean;
  calendar: boolean;
}

export interface DataErrors {
  children: string;
  cycle: string;
  meals: string;
  appointments: string;
  notifications: string;
  calendar: string;
}

export interface DataAvailability {
  children: boolean;
  cycle: boolean;
  meals: boolean;
  appointments: boolean;
  notifications: boolean;
  calendar: boolean;
}

// Form data interfaces
export interface CycleLogData {
  start_date: string;
  end_date?: string;
  flow_intensity?: string;
  symptoms?: string[];
  notes: string;
  user_id?: number;
}

export interface MealLogData {
  meal_type: string;
  meal_time: string;
  description: string;
  user_id?: number;
}

export interface AppointmentData {
  issue: string;
  preferred_date: string;
  appointment_date?: string;
  for_user_id?: number;
}

export interface ChildData {
  name: string;
  date_of_birth: string;
  relationship_type: string;
  phone_number?: string;
  password?: string;
}

// Component props interfaces
export interface DataSectionProps {
  title: string;
  dataType: keyof DataLoadingStates;
  children: React.ReactNode;
  icon?: string;
  showRetry?: boolean;
  isLoading?: boolean;
  error?: string;
  hasData?: boolean;
  onRetry?: () => void;
}

export interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export interface TabContentProps {
  user: User | null;
  children: Child[];
  selectedChild: number | null;
  setSelectedChild: (id: number | null) => void;
  setActiveTab: (tab: string) => void;
}

// Calendar and cycle specific types
export interface CalendarData {
  [key: string]: any; // Define based on your specific calendar data structure
}

export type ActiveTab = 'overview' | 'cycle' | 'meals' | 'appointments' | 'children';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type FlowIntensity = 'light' | 'medium' | 'heavy';
export type AppointmentStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled';
export type RelationshipType = 'mother' | 'father' | 'guardian';