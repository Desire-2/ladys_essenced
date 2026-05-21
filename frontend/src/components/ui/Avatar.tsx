import React from 'react';
import { cn } from '../../lib/utils';

export interface AvatarProps {
  firstName: string;
  lastName: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Avatar: React.FC<AvatarProps> = ({
  firstName = '',
  lastName = '',
  className,
  size = 'md',
}) => {
  const initials = `${firstName.charAt(0) || ''}${lastName.charAt(0) || ''}`.toUpperCase() || '?';
  
  // Deterministic background color based on name characters
  const charCodeSum = (firstName.charCodeAt(0) || 0) + (lastName.charCodeAt(0) || 0);
  const colorIndex = charCodeSum % 3;
  const colors = [
    'bg-terracotta/20 text-terracotta border-terracotta/30',
    'bg-mauve/20 text-mauve border-mauve/30',
    'bg-sage/20 text-sage border-sage/30',
  ];
  
  return (
    <div
      className={cn(
        'flex items-center justify-center font-semibold font-sans rounded-full border',
        size === 'sm' && 'w-8 h-8 text-xs',
        size === 'md' && 'w-10 h-10 text-sm',
        size === 'lg' && 'w-14 h-14 text-lg',
        colors[colorIndex],
        className
      )}
    >
      {initials}
    </div>
  );
};
export default Avatar;
