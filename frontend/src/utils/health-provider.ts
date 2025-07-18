// Helper function to handle API responses safely
export const handleApiResponse = async (response: Response, errorMessage: string = 'API request failed') => {
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`${errorMessage}:`, response.status, errorText);
    throw new Error(`${errorMessage}: ${response.status}`);
  }

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    console.error(`Expected JSON but received:`, text.substring(0, 200));
    throw new Error(`Expected JSON response but received: ${contentType || 'unknown content type'}`);
  }

  try {
    return await response.json();
  } catch (parseError) {
    const text = await response.text();
    console.error('JSON parse error:', parseError, 'Response text:', text.substring(0, 200));
    throw new Error('Invalid JSON response from server');
  }
};

// Provider filtering functions
export const getUniqueSpecializations = (providers: any[]) => {
  const specializations = providers.map(p => p.specialization).filter(Boolean);
  return [...new Set(specializations)];
};

export const getUniqueLocations = (providers: any[]) => {
  const locations = providers.map(p => p.clinic_address?.split(',')[0]).filter(Boolean);
  return [...new Set(locations)];
};

// Date formatting utilities
export const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Not scheduled';
  return new Date(dateString).toLocaleDateString();
};

export const formatDateTime = (dateString: string | null) => {
  if (!dateString) return 'Not scheduled';
  return new Date(dateString).toLocaleString();
};

// Priority and status badge utilities
export const getPriorityBadgeClass = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'bg-danger';
    case 'high': return 'bg-warning';
    case 'normal': return 'bg-info';
    case 'low': return 'bg-secondary';
    default: return 'bg-secondary';
  }
};

export const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'confirmed': return 'bg-success';
    case 'pending': return 'bg-warning';
    case 'completed': return 'bg-info';
    case 'cancelled': return 'bg-secondary';
    default: return 'bg-secondary';
  }
};

// Time calculation utilities
export const calculateTotalWeeklyHours = (availability: any) => {
  return Object.values(availability)
    .filter((schedule: any) => schedule.is_available)
    .reduce((total: number, schedule: any) => {
      const start = new Date(`2024-01-01 ${schedule.start_time}`);
      const end = new Date(`2024-01-01 ${schedule.end_time}`);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return total + hours;
    }, 0);
};

export const getAvailableDaysCount = (availability: any) => {
  return Object.values(availability).filter((schedule: any) => schedule.is_available).length;
};
