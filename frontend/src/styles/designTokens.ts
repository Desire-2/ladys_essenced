/**
 * Design Tokens for Lady's Essence
 * Modern healthcare-focused color palette and design system
 */

export const designTokens = {
  // Primary Colors - Health & Wellness Focused
  colors: {
    // Primary Palette (Health/Wellness)
    primary: {
      50: '#FEF3F2',   // Very light rose
      100: '#FDE8E5',  // Light rose
      200: '#FBCEC6',  // Lighter rose
      300: '#F8B5A7',  // Light rose
      400: '#F39C88',  // Medium-light rose
      500: '#EB5E52',  // Primary rose - brand color
      600: '#C94D42',  // Darker rose
      700: '#A73D32',  // Dark rose
      800: '#852D22',  // Darker rose
      900: '#631D12',  // Very dark rose
    },

    // Secondary Palette (Wellness/Nature)
    secondary: {
      50: '#F0FDF4',   // Very light green
      100: '#DCFCE7',  // Light green
      200: '#BBFBDB',  // Lighter green
      300: '#86EFAC',  // Light green
      400: '#4ADE80',  // Medium green
      500: '#22C55E',  // Secondary green - wellness
      600: '#16A34A',  // Dark green
      700: '#15803D',  // Darker green
      800: '#166534',  // Very dark green
      900: '#134E4A',  // Forest green
    },

    // Accent Palette (Cycle/Insights)
    accent: {
      50: '#FEF3C7',   // Light yellow
      100: '#FCD34D',  // Lighter yellow
      200: '#FBBF24',  // Light amber
      300: '#F59E0B',  // Amber
      400: '#D97706',  // Dark amber
      500: '#B45309',  // Darker amber
      600: '#92400E',  // Very dark amber
      700: '#78350F',  // Forest amber
    },

    // Health Status Colors
    status: {
      success: '#10B981',    // Green - Good
      warning: '#F59E0B',    // Amber - Caution
      danger: '#EF4444',     // Red - Alert
      info: '#3B82F6',       // Blue - Info
      neutral: '#6B7280',    // Gray - Neutral
    },

    // Period/Cycle Colors
    period: {
      light: '#FCA5A5',      // Light flow
      medium: '#F87171',     // Medium flow
      heavy: '#DC2626',      // Heavy flow
      predicted: '#A78BFA',  // Predicted period
      fertile: '#34D399',    // Fertile window
    },

    // Mood/Sentiment Colors
    mood: {
      happy: '#FFD93D',      // Happy
      neutral: '#A8B5D1',    // Neutral
      sad: '#64748B',        // Sad
      energy_high: '#34D399', // High energy
      energy_low: '#94A3B8',  // Low energy
      stress_high: '#EF4444', // Stressed
      stress_low: '#10B981',  // Relaxed
    },

    // Backgrounds
    background: {
      white: '#FFFFFF',
      light: '#F9FAFB',
      lighter: '#F3F4F6',
      dark: '#1F2937',
      gradient_start: '#FEF3F2',
      gradient_end: '#EDE9FE',
    },

    // Text Colors
    text: {
      primary: '#111827',    // Very dark gray - main text
      secondary: '#6B7280',  // Medium gray - secondary text
      tertiary: '#9CA3AF',   // Light gray - tertiary text
      light: '#E5E7EB',      // Very light gray - light backgrounds
      white: '#FFFFFF',      // White
    },

    // Border Colors
    border: {
      light: '#E5E7EB',
      medium: '#D1D5DB',
      dark: '#9CA3AF',
    },

    // Shadow Colors
    shadow: {
      xs: 'rgba(0, 0, 0, 0.05)',
      sm: 'rgba(0, 0, 0, 0.1)',
      md: 'rgba(0, 0, 0, 0.15)',
      lg: 'rgba(0, 0, 0, 0.2)',
      xl: 'rgba(0, 0, 0, 0.25)',
    },
  },

  // Typography Scale
  typography: {
    // Font Families
    fonts: {
      body: "'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      heading: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      mono: "'Menlo', 'Monaco', monospace",
    },

    // Font Sizes
    sizes: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
      '5xl': '3rem',     // 48px
    },

    // Font Weights
    weights: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },

    // Line Heights
    lineHeights: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },

    // Letter Spacing
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
  },

  // Spacing Scale
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
  },

  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.375rem',   // 6px
    base: '0.5rem',   // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
    xl: '1.5rem',     // 24px
    '2xl': '2rem',    // 32px
    '3xl': '3rem',    // 48px
    full: '9999px',
  },

  // Shadow System
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  },

  // Z-Index Scale
  zIndex: {
    hide: '-1',
    auto: 'auto',
    base: '0',
    dropdown: '1000',
    sticky: '1100',
    fixed: '1200',
    backdrop: '1300',
    modal: '1400',
    popover: '1500',
    tooltip: '1600',
  },

  // Breakpoints (Mobile-first)
  breakpoints: {
    xs: '320px',   // Extra small
    sm: '640px',   // Small
    md: '768px',   // Medium
    lg: '1024px',  // Large
    xl: '1280px',  // Extra large
    '2xl': '1536px', // 2XL
  },

  // Transitions
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '350ms cubic-bezier(0.4, 0, 0.2, 1)',
    slower: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Gradients
  gradients: {
    // Primary gradient - Rose to Purple
    primary: 'linear-gradient(135deg, #EB5E52 0%, #C084FC 100%)',
    // Health gradient - Green to Blue
    health: 'linear-gradient(135deg, #22C55E 0%, #06B6D4 100%)',
    // Cycle gradient - Purple to Pink
    cycle: 'linear-gradient(135deg, #A78BFA 0%, #EC4899 100%)',
    // Wellness gradient - Green to Yellow
    wellness: 'linear-gradient(135deg, #10B981 0%, #FBBF24 100%)',
    // Subtle gradient - Light rose to light purple
    subtle: 'linear-gradient(135deg, #FEF3F2 0%, #F3E8FF 100%)',
  },

  // Touch targets (min 44px for accessibility)
  touchTarget: {
    small: '40px',
    base: '44px',
    large: '48px',
    xlarge: '56px',
  },
};

// Utility function to get contrast color for text
export const getContrastColor = (hexColor: string): string => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#111827' : '#FFFFFF';
};

// Utility function for responsive values
export const responsive = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
};

export default designTokens;
