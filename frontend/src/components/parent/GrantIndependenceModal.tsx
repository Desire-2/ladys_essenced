import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface GrantIndependenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  childName: string;
  onSubmit: (data: { phone_number: string; send_invite: boolean }) => Promise<void>;
  isLoading?: boolean;
}

export function GrantIndependenceModal({
  isOpen,
  onClose,
  childName,
  onSubmit,
  isLoading,
}: GrantIndependenceModalProps) {
  const [phone, setPhone] = useState('');
  const [sendInvite, setSendInvite] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    await onSubmit({ phone_number: phone.trim(), send_invite: sendInvite });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Give ${childName} her own account`}>
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <Input
          label={`${childName}'s phone number`}
          placeholder="+250788..."
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <ul className="text-sm text-muted space-y-1 list-disc pl-5">
          <li>Let {childName} log in with her own phone number</li>
          <li>Keep your access to her data (she can change this later)</li>
          <li>Send her an invite message if you choose</li>
        </ul>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={sendInvite}
            onChange={(e) => setSendInvite(e.target.checked)}
          />
          Send {childName} an invitation message
        </label>
        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving…' : `Give ${childName} her own account →`}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
