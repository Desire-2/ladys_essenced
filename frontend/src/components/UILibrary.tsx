/**
 * Modern UI Components Library
 * Reusable components for Lady's Essence Dashboards
 */

import React from 'react';
import { designTokens } from '../styles/designTokens';

// Card Component - Modern, with subtle shadow and rounded corners
export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined';
  onClick?: () => void;
  padding?: 'sm' | 'md' | 'lg';
}> = ({ children, className = '', variant = 'default', onClick, padding = 'md' }) => {
  const paddingMap = { sm: 'p-3', md: 'p-4', lg: 'p-6' };
  const variantClasses = {
    default: 'bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow',
    elevated: 'bg-white shadow-lg',
    outlined: 'bg-white border-2 border-gray-200',
  };

  return (
    <div
      className={`rounded-xl ${variantClasses[variant]} ${paddingMap[padding]} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
};

// Badge Component - Status indicators
export const Badge: React.FC<{
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}> = ({ children, variant = 'primary', size = 'md', icon }) => {
  const variantClasses = {
    primary: 'bg-rose-100 text-rose-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${variantClasses[variant]} ${sizeClasses[size]}`}
    >
      {icon && <span className="text-lg">{icon}</span>}
      {children}
    </span>
  );
};

// Stat Card Component - For displaying metrics
export const StatCard: React.FC<{
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: number; direction: 'up' | 'down' };
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}> = ({ label, value, icon, trend, color = 'primary', className = '' }) => {
  const colorClasses = {
    primary: 'text-rose-600 bg-rose-50 border-rose-100',
    success: 'text-green-600 bg-green-50 border-green-100',
    warning: 'text-amber-600 bg-amber-50 border-amber-100',
    danger: 'text-red-600 bg-red-50 border-red-100',
    info: 'text-blue-600 bg-blue-50 border-blue-100',
  };

  return (
    <Card className={`border ${colorClasses[color]} ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 font-medium mb-1">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {trend && (
              <span className={`text-sm font-semibold ${trend.direction === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
            )}
          </div>
        </div>
        {icon && <div className={`text-4xl ${colorClasses[color]}`}>{icon}</div>}
      </div>
    </Card>
  );
};

// Button Component - Modern button with variants
export const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
}> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  className = '',
  type = 'button',
  fullWidth = false,
}) => {
  const variantClasses = {
    primary: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800',
    secondary: 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800',
    outline: 'border-2 border-rose-600 text-rose-600 hover:bg-rose-50',
    ghost: 'text-rose-600 hover:bg-rose-50',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 rounded-lg font-semibold
        transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]} ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''} ${className}
      `}
    >
      {loading && <span className="inline-block animate-spin">⟳</span>}
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
};

// Input Component - Modern form input
export const Input: React.FC<{
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  label?: string;
  error?: string;
  className?: string;
}> = ({ type = 'text', placeholder, value, onChange, disabled, icon, label, error, className = '' }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>}
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">{icon}</span>}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          className={`
            w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-base
            transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent
            ${icon ? 'pl-10' : ''} ${error ? 'border-red-500 focus:ring-red-500' : ''}
            ${className}
          `}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

// Tab Component - Tab navigation
export const Tabs: React.FC<{
  tabs: Array<{ label: string; value: string; icon?: React.ReactNode }>;
  activeTab: string;
  onChange: (value: string) => void;
  variant?: 'default' | 'pills' | 'underline';
}> = ({ tabs, activeTab, onChange, variant = 'default' }) => {
  if (variant === 'pills') {
    return (
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={`
              px-4 py-2 rounded-md font-semibold transition-all flex items-center gap-2
              ${
                activeTab === tab.value
                  ? 'bg-white text-rose-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            {tab.icon && <span>{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>
    );
  }

  if (variant === 'underline') {
    return (
      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => onChange(tab.value)}
              className={`
                pb-4 font-semibold transition-all border-b-2 flex items-center gap-2
                ${
                  activeTab === tab.value
                    ? 'text-rose-600 border-rose-600'
                    : 'text-gray-600 border-transparent hover:text-gray-900'
                }
              `}
            >
              {tab.icon && <span>{tab.icon}</span>}
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`
            px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2
            ${
              activeTab === tab.value
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }
          `}
        >
          {tab.icon && <span>{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
};

// Modal Component - Dialog/Modal
export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}> = ({ isOpen, onClose, title, children, actions }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 z-50">
        {/* Header */}
        {title && (
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-4">{children}</div>

        {/* Actions */}
        {actions && <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">{actions}</div>}
      </div>
    </div>
  );
};

// Empty State Component
export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}> = ({ icon, title, description, action }) => {
  return (
    <div className="text-center py-12 px-4">
      {icon && <div className="text-6xl mb-4 opacity-50">{icon}</div>}
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6">{description}</p>
      {action && (
        <Button onClick={action.onClick} variant="primary">
          {action.label}
        </Button>
      )}
    </div>
  );
};

// Loading Spinner Component
export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = { sm: 'w-6 h-6', md: 'w-10 h-10', lg: 'w-16 h-16' };
  return (
    <div className={`${sizeClasses[size]} animate-spin`}>
      <div className="w-full h-full border-4 border-gray-200 border-t-rose-600 rounded-full" />
    </div>
  );
};

// Progress Bar Component
export const ProgressBar: React.FC<{
  value: number;
  max?: number;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
  animated?: boolean;
}> = ({ value, max = 100, color = 'primary', showLabel = false, animated = false }) => {
  const percentage = (value / max) * 100;
  const colorClasses = {
    primary: 'bg-rose-600',
    success: 'bg-green-600',
    warning: 'bg-amber-600',
    danger: 'bg-red-600',
  };

  return (
    <div className="w-full">
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} transition-all ${animated ? 'animate-pulse' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && <p className="text-sm text-gray-600 mt-1">{Math.round(percentage)}%</p>}
    </div>
  );
};

// Alert Component
export const Alert: React.FC<{
  type?: 'success' | 'warning' | 'danger' | 'info';
  title?: string;
  message: string;
  onClose?: () => void;
}> = ({ type = 'info', title, message, onClose }) => {
  const typeClasses = {
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    danger: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const icons = {
    success: '✓',
    warning: '⚠',
    danger: '✕',
    info: 'ℹ',
  };

  return (
    <div className={`border-l-4 p-4 rounded-lg ${typeClasses[type]}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{icons[type]}</span>
          <div>
            {title && <h4 className="font-bold">{title}</h4>}
            <p className="text-sm">{message}</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="ml-4 text-xl opacity-70 hover:opacity-100">
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

// Gradient Background
export const GradientBg: React.FC<{
  variant?: 'primary' | 'health' | 'cycle' | 'wellness' | 'subtle';
  children: React.ReactNode;
  className?: string;
}> = ({ variant = 'primary', children, className = '' }) => {
  const gradients = {
    primary: 'from-rose-50 to-purple-50',
    health: 'from-green-50 to-cyan-50',
    cycle: 'from-purple-50 to-pink-50',
    wellness: 'from-green-50 to-yellow-50',
    subtle: 'from-gray-50 to-gray-100',
  };

  return (
    <div className={`bg-gradient-to-br ${gradients[variant]} ${className}`}>
      {children}
    </div>
  );
};

// Avatar Component
export const Avatar: React.FC<{
  src?: string;
  initials?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
}> = ({ src, initials, size = 'md', color = 'rose' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  if (src) {
    return (
      <img
        src={src}
        alt="Avatar"
        className={`rounded-full object-cover ${sizeClasses[size]}`}
      />
    );
  }

  const colorClasses = {
    rose: 'bg-rose-100 text-rose-700',
    green: 'bg-green-100 text-green-700',
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
    amber: 'bg-amber-100 text-amber-700',
  };

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold ${sizeClasses[size]} ${colorClasses[color as keyof typeof colorClasses]}`}
    >
      {initials}
    </div>
  );
};
