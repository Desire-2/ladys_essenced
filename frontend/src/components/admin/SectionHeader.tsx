'use client';

import { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  actions?: ReactNode;
  color?: string;
}

export default function SectionHeader({ title, subtitle, icon, actions, color = '#667eea' }: SectionHeaderProps) {
  return (
    <div className="mb-4">
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
        <div className="flex-grow-1">
          <div className="d-flex align-items-center mb-2">
            {icon && (
              <div
                className="rounded-circle d-flex align-items-center justify-content-center me-3"
                style={{
                  width: '48px',
                  height: '48px',
                  background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
                  color: 'white',
                }}
              >
                <i className={`${icon} fa-lg`}></i>
              </div>
            )}
            <div>
              <h3 className="mb-1 fw-bold" style={{ color: '#2d3748', fontSize: '24px' }}>
                {title}
              </h3>
              {subtitle && (
                <p className="mb-0 text-muted" style={{ fontSize: '14px' }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
        {actions && <div className="d-flex gap-2 align-items-center">{actions}</div>}
      </div>
      <hr className="my-3" style={{ opacity: 0.1 }} />
    </div>
  );
}
