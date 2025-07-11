import React from 'react';

export interface AuthContextType {
  user: any;
  loading: boolean;
  error: string | null;
  login: (credentials: any) => Promise<any>;
  register: (userData: any) => Promise<any>;
  logout: () => void;
  updateProfile: (userData: any) => Promise<any>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  getUserDisplayName: () => string;
  getDashboardRoute: () => string;
  makeAuthenticatedRequest: (endpoint: string, options?: any) => Promise<any>;
}

export declare function useAuth(): AuthContextType;
export declare const AuthProvider: React.FC<{ children: React.ReactNode }>;
