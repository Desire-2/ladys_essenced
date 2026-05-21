import React from 'react';
import { Eye, EyeOff, ShieldCheck, ShieldAlert, Heart, Calendar, Utensils } from 'lucide-react';
import { Child } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';

interface ChildCardProps {
  child: Child;
  onSelect: (childId: number) => void;
  onBookAppointment: (childId: number) => void;
  selected?: boolean;
}

export const ChildCard: React.FC<ChildCardProps> = ({
  child,
  onSelect,
  onBookAppointment,
  selected = false,
}) => {
  return (
    <Card 
      onClick={() => child.allow_parent_access && onSelect(child.id)}
      className={`font-sans transition-all duration-300 ${child.allow_parent_access ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'} ${selected ? 'ring-2 ring-terracotta border-transparent' : ''}`}
    >
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
        
        {/* Child Initials Avatar */}
        <Avatar firstName={child.first_name} lastName={child.last_name} size="lg" className="flex-shrink-0" />
        
        {/* Core Profile */}
        <div className="text-center sm:text-left flex-grow space-y-2 select-none">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
            <div>
              <h3 className="text-lg font-bold text-ink font-heading">{child.first_name} {child.last_name}</h3>
              <p className="text-xs text-muted font-semibold">{child.age} Years Old • Adolescent Girl</p>
            </div>
            
            {/* Privacy indicator badge */}
            <div>
              {child.allow_parent_access ? (
                <Badge variant="sage" className="text-[10px] gap-1 px-2.5 py-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> ACCESS GRANTED BY CHILD
                </Badge>
              ) : (
                <Badge variant="mauve" className="text-[10px] gap-1 px-2.5 py-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> PRIVACY LOCKED
                </Badge>
              )}
            </div>
          </div>

          {child.allow_parent_access ? (
            <div className="space-y-2 mt-3 text-left">
              <p className="text-xs text-muted leading-relaxed">
                Click to explore {child.first_name}'s daily cycle predictions, wellness meal entries, and medical logs securely.
              </p>
              
              <div className="flex flex-wrap gap-2.5 pt-1">
                <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted bg-cream/50 px-2.5 py-1 rounded-md">
                  <Heart className="w-3 h-3 text-terracotta" /> Cycle Logs Active
                </div>
                <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted bg-cream/50 px-2.5 py-1 rounded-md">
                  <Utensils className="w-3 h-3 text-sage" /> Nutrition Monitored
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-mauve/5 rounded-xl border border-mauve/10 mt-3 text-left">
              <p className="text-[11px] text-mauve font-semibold flex items-center gap-1.5">
                <EyeOff className="w-3.5 h-3.5" /> Secure adolescent lock is active.
              </p>
              <p className="text-[10px] text-muted mt-0.5">
                Lady's Essence is a safe zone. Your daughter has toggled private access. She can grant visibility in her settings panel anytime.
              </p>
            </div>
          )}

          {/* Quick kids booking action */}
          <div className="flex justify-end pt-2">
            <Button
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation(); // Avoid triggering parent expand/select
                onBookAppointment(child.id);
              }}
              className="text-xs py-1.5 px-3 min-h-11"
            >
              <Calendar className="w-3.5 h-3.5 mr-1.5" /> Book Consultation
            </Button>
          </div>
        </div>

      </div>
    </Card>
  );
};
export default ChildCard;
