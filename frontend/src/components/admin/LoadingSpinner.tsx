'use client';

interface LoadingSpinnerProps {
  size?: 'small' | 'default' | 'large';
  color?: string;
  text?: string;
  fullPage?: boolean;
}

export default function LoadingSpinner({ 
  size = 'default', 
  color = '#667eea', 
  text,
  fullPage = false 
}: LoadingSpinnerProps) {
  const sizeMap = {
    small: { width: 20, height: 20, fontSize: '12px' },
    default: { width: 40, height: 40, fontSize: '14px' },
    large: { width: 60, height: 60, fontSize: '16px' }
  };

  const { width, height, fontSize } = sizeMap[size];

  const spinner = (
    <div className="d-flex flex-column align-items-center justify-content-center gap-3">
      <div
        className="spinner-border"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          borderColor: `${color}30`,
          borderTopColor: color,
          borderWidth: size === 'small' ? '2px' : '3px'
        }}
        role="status"
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      {text && (
        <p className="mb-0 text-muted" style={{ fontSize }}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div
        className="d-flex align-items-center justify-content-center"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255,255,255,0.9)',
          zIndex: 9999
        }}
      >
        {spinner}
      </div>
    );
  }

  return spinner;
}
