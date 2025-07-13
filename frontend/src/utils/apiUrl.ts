// Centralized API URL configuration
export const getApiUrl = (endpoint: string): string => {
  // In production, use the full backend URL
  // In development, use relative URLs for Next.js rewrites
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? (process.env.NEXT_PUBLIC_API_URL || 'https://ladys-essenced.onrender.com')
    : '';
  
  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  return `${baseUrl}${normalizedEndpoint}`;
};

// For backward compatibility
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? (process.env.NEXT_PUBLIC_API_URL || 'https://ladys-essenced.onrender.com')
  : '';
