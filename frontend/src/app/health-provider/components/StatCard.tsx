import React from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: string;
  colorClass?: string;
  subtitle?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
    period: string;
  };
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  colorClass = 'bg-primary', 
  subtitle,
  trend,
  onClick 
}) => (
  <div 
    className={`card ${colorClass} text-white h-100 ${onClick ? 'card-hover cursor-pointer' : ''}`}
    onClick={onClick}
    style={onClick ? { cursor: 'pointer' } : {}}
  >
    <div className="card-body">
      <div className="d-flex justify-content-between align-items-start">
        <div className="flex-grow-1">
          <h4 className="mb-1">{value}</h4>
          <p className="mb-0 text-white-75">{title}</p>
          {subtitle && <small className="text-white-50">{subtitle}</small>}
          {trend && (
            <div className="mt-2">
              <small className="text-white-75">
                <i className={`fas fa-arrow-${trend.direction} me-1`}></i>
                {trend.value}% {trend.period}
              </small>
            </div>
          )}
        </div>
        <div className="fs-1 text-white-50">
          <i className={icon}></i>
        </div>
      </div>
    </div>
  </div>
);

export default StatCard;
