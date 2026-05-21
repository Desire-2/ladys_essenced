import React from 'react';
import { Moon, Sparkles, Droplet, Coffee } from 'lucide-react';
import { Card } from '../ui/Card';

export interface InsightItem {
  id: number;
  title: string;
  card_type: 'rest' | 'iron' | 'water' | 'general';
  message: string;
}

interface InsightCardProps {
  insight: InsightItem;
}

export const InsightCard: React.FC<InsightCardProps> = ({ insight }) => {
  const isRest = insight.card_type === 'rest';
  const isIron = insight.card_type === 'iron';
  const isWater = insight.card_type === 'water';

  return (
    <Card 
      className={`font-sans relative overflow-hidden transition-all duration-300 border-l-4 ${
        isRest && 'border-l-mauve bg-mauve/5'
      } ${
        isIron && 'border-l-sage bg-sage/5'
      } ${
        isWater && 'border-l-terracotta bg-terracotta/5'
      } hover:shadow-md`}
    >
      <div className="flex gap-4.5 text-left items-start select-none">
        
        {/* Dynamic Context Icons */}
        <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
          isRest && 'bg-mauve/15 text-mauve'
        } ${
          isIron && 'bg-sage/15 text-sage'
        } ${
          isWater && 'bg-terracotta/15 text-terracotta'
        }`}>
          {isRest && <Moon className="w-5.5 h-5.5" />}
          {isIron && <Sparkles className="w-5.5 h-5.5" />}
          {isWater && <Droplet className="w-5.5 h-5.5" />}
          {!isRest && !isIron && !isWater && <Coffee className="w-5.5 h-5.5" />}
        </div>

        {/* Text descriptions */}
        <div className="space-y-1">
          <h4 className="font-heading font-extrabold text-base text-ink">
            {insight.title}
          </h4>
          <p className="text-xs text-muted/90 leading-relaxed">
            {insight.message}
          </p>
        </div>
      </div>
    </Card>
  );
};
export default InsightCard;
