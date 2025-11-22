// Dashboard Utility Functions

/**
 * Helper function to safely access localStorage
 */
export const getStorageItem = (key: string): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(key);
  }
  return null;
};

/**
 * Helper function to safely format dates
 */
export const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return 'Invalid Date';
  }
};

/**
 * Generate random phone number for child
 */
export const generateRandomPhone = (): string => {
  const prefix = '250'; // Rwanda country code
  const randomDigits = Math.floor(Math.random() * 900000000) + 100000000; // 9 digits
  return `${prefix}${randomDigits}`;
};

/**
 * Generate random password for child
 */
export const generateRandomPassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

/**
 * Calculate age from date of birth
 */
export const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Get badge class for appointment status
 */
export const getAppointmentStatusBadgeClass = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'confirmed':
      return 'bg-success';
    case 'pending':
      return 'bg-warning';
    case 'completed':
      return 'bg-info';
    case 'cancelled':
      return 'bg-danger';
    default:
      return 'bg-secondary';
  }
};

/**
 * Get badge class for meal type
 */
export const getMealTypeBadgeClass = (mealType: string): string => {
  switch (mealType.toLowerCase()) {
    case 'breakfast':
      return 'bg-warning';
    case 'lunch':
      return 'bg-success';
    case 'dinner':
      return 'bg-info';
    case 'snack':
      return 'bg-secondary';
    default:
      return 'bg-secondary';
  }
};

/**
 * Clear all dashboard-related localStorage items
 */
export const clearDashboardStorage = (): void => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_id');
  localStorage.removeItem('user_type');
  localStorage.removeItem('accessed_child_id');
};

/**
 * Debounce function for API calls
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Validate form data before submission
 */
export const validateCycleForm = (formData: FormData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const startDate = formData.get('startDate') as string;
  
  if (!startDate) {
    errors.push('Start date is required');
  }
  
  const endDate = formData.get('endDate') as string;
  if (endDate && new Date(endDate) < new Date(startDate)) {
    errors.push('End date cannot be before start date');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate meal form data
 */
export const validateMealForm = (formData: FormData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  const mealType = formData.get('mealType') as string;
  if (!mealType) {
    errors.push('Meal type is required');
  }
  
  const mealDate = formData.get('mealDate') as string;
  if (!mealDate) {
    errors.push('Meal date and time is required');
  }
  
  const mealDetails = formData.get('mealDetails') as string;
  if (!mealDetails || mealDetails.trim().length < 3) {
    errors.push('Meal details must be at least 3 characters long');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate child form data
 */
export const validateChildForm = (data: {
  name: string;
  dob: string;
  relationship: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  
  if (!data.dob) {
    errors.push('Date of birth is required');
  } else {
    const birthDate = new Date(data.dob);
    const today = new Date();
    if (birthDate > today) {
      errors.push('Date of birth cannot be in the future');
    }
  }
  
  if (!data.relationship) {
    errors.push('Relationship type is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Navigate to period logs management
 */
export const navigateToPeriodLogs = (source: string = 'dashboard'): void => {
  // Create a custom event for period logs navigation
  const event = new CustomEvent('openPeriodLogs', { 
    detail: { 
      source,
      timestamp: new Date().toISOString(),
      userAction: true
    }
  });
  
  // Store navigation context
  if (typeof window !== 'undefined') {
    localStorage.setItem('periodLogsNavigation', JSON.stringify({
      source,
      timestamp: new Date().toISOString()
    }));
  }
  
  // Dispatch the event
  window.dispatchEvent(event);
  
  // Log for debugging
  console.log(`Period logs navigation triggered from: ${source}`);
};

/**
 * Get period log statistics for display
 */
export const getPeriodLogStats = (): {
  thisMonth: number;
  accuracy: number;
  streak: number;
} => {
  // This would normally fetch from API or local storage
  // For now, return mock data
  return {
    thisMonth: Math.floor(Math.random() * 20) + 5,
    accuracy: Math.floor(Math.random() * 10) + 90,
    streak: Math.floor(Math.random() * 40) + 10
  };
};

/**
 * Format period management button stats
 */
export const formatPeriodStats = (stats: { thisMonth: number; accuracy: number; streak: number }) => {
  return {
    thisMonth: `${stats.thisMonth} logs`,
    accuracy: `${stats.accuracy}%`,
    streak: `${stats.streak} days`
  };
};