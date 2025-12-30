'use client';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  gradient: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
}

export default function StatsCard({ title, value, subtitle, icon, gradient, trend, onClick }: StatsCardProps) {
  return (
    <div
      className="card border-0 shadow-sm h-100 stats-card"
      style={{
        background: gradient,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        overflow: 'hidden',
        position: 'relative'
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)';
      }}
    >
      {/* Decorative circles */}
      <div
        style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.1)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-30px',
          left: '-30px',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.08)',
        }}
      />

      <div className="card-body text-white p-4 position-relative" style={{ zIndex: 1 }}>
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className="flex-grow-1">
            <p className="mb-1 opacity-90" style={{ fontSize: '14px', fontWeight: '500' }}>
              {title}
            </p>
            <h2 className="mb-0 fw-bold" style={{ fontSize: '32px', lineHeight: '1.2' }}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </h2>
          </div>
          <div
            className="rounded-circle d-flex align-items-center justify-content-center"
            style={{
              width: '56px',
              height: '56px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <i className={`${icon} fa-xl`}></i>
          </div>
        </div>

        {(subtitle || trend) && (
          <div className="d-flex justify-content-between align-items-center">
            {subtitle && (
              <small className="opacity-90" style={{ fontSize: '13px' }}>
                <i className="fas fa-info-circle me-1"></i>
                {subtitle}
              </small>
            )}
            {trend && (
              <small
                className="d-flex align-items-center"
                style={{
                  fontSize: '13px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  padding: '4px 10px',
                  borderRadius: '20px',
                }}
              >
                <i className={`fas fa-arrow-${trend.isPositive ? 'up' : 'down'} me-1`}></i>
                {Math.abs(trend.value)}%
              </small>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
