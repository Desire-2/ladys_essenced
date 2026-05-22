import React from 'react';
import { Lock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface PrivacyLockedPanelProps {
  childName: string;
  onBookAppointment?: () => void;
}

export function PrivacyLockedPanel({ childName, onBookAppointment }: PrivacyLockedPanelProps) {
  return (
    <Card className="p-8 text-center max-w-lg mx-auto">
      <Lock className="w-10 h-10 text-mauve mx-auto mb-4" />
      <h3 className="font-heading text-lg font-bold text-ink">
        {childName} has enabled privacy mode
      </h3>
      <p className="text-sm text-muted mt-3 leading-relaxed">
        {childName} has chosen to manage her own health data privately. You can still book
        appointments for her and receive appointment notifications.
      </p>
      <p className="text-xs text-muted mt-2">
        This is her right as she grows into managing her own health.
      </p>
      {onBookAppointment && (
        <Button className="mt-6" onClick={onBookAppointment}>
          Book Appointment for {childName}
        </Button>
      )}
    </Card>
  );
}
