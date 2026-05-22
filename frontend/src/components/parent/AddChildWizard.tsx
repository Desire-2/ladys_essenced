import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { AddChildPayload, ChildRelationship } from '@/types/parent';

interface AddChildWizardProps {
  onSubmit: (data: AddChildPayload) => Promise<void>;
  isLoading?: boolean;
}

const STEPS = ['Who are you adding?', 'About her', 'Set up her account', 'Review & add'];

export function AddChildWizard({ onSubmit, isLoading }: AddChildWizardProps) {
  const [step, setStep] = useState(0);
  const [relationshipType, setRelationshipType] = useState<ChildRelationship>('mother');
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const next = () => {
    setError('');
    if (step === 0) {
      setStep(1);
      return;
    }
    if (step === 1) {
      if (!name.trim()) {
        setError('Full name is required');
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!password || password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      setStep(3);
    }
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

  const handleSubmit = async () => {
    setError('');
    await onSubmit({
      name: name.trim(),
      password,
      relationship_type: relationshipType,
      date_of_birth: dateOfBirth || undefined,
      phone_number: phoneNumber.trim() || undefined,
    });
  };

  return (
    <div className="max-w-lg mx-auto text-left">
      <div className="flex gap-2 mb-6">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={`flex-1 h-1 rounded-full ${i <= step ? 'bg-terracotta' : 'bg-border'}`}
            title={label}
          />
        ))}
      </div>
      <p className="text-xs text-muted mb-1">
        Step {step + 1} of {STEPS.length}
      </p>
      <h3 className="font-heading text-xl font-bold text-ink mb-4">{STEPS[step]}</h3>

      {error && (
        <p className="text-sm text-mauve font-medium mb-4 p-3 bg-mauve/5 rounded-lg">{error}</p>
      )}

      {step === 0 && (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            You are adding a family member to your household health record — not creating a
            separate account they must use today.
          </p>
          <div className="p-4 rounded-xl border-2 border-terracotta/30 bg-terracotta/5">
            <span className="text-2xl">👧</span>
            <p className="font-semibold text-ink mt-2">Daughter</p>
          </div>
          <label className="block text-sm font-medium text-ink">
            Your relationship
            <select
              className="mt-1 w-full border border-border rounded-lg px-3 py-2 bg-surface"
              value={relationshipType}
              onChange={(e) => setRelationshipType(e.target.value as ChildRelationship)}
            >
              <option value="mother">Mother</option>
              <option value="father">Father</option>
              <option value="guardian">Guardian</option>
            </select>
          </label>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <Input label="Full name *" value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            label="Date of birth"
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
          />
          <Input
            label="Phone number (optional)"
            placeholder="Add now or when she gets a phone"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Create a password she can use to log in on her own phone when she&apos;s ready.
          </p>
          <Input
            label="Password *"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            label="Confirm password *"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
      )}

      {step === 3 && (
        <div className="space-y-2 text-sm">
          <p>
            <span className="text-muted">Name:</span> {name}
          </p>
          <p>
            <span className="text-muted">Relationship:</span> Daughter ({relationshipType})
          </p>
          <p>
            <span className="text-muted">Date of birth:</span> {dateOfBirth || 'Not set'}
          </p>
          <p>
            <span className="text-muted">Phone:</span> {phoneNumber || 'Not added yet'}
          </p>
          <p className="text-muted text-xs mt-4 leading-relaxed">
            {name} will be added to your family. You can log her health data, book appointments,
            and manage her profile. She can add her own phone number whenever she is ready.
          </p>
        </div>
      )}

      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <Button variant="secondary" type="button" onClick={back}>
            ← Back
          </Button>
        )}
        {step < 3 ? (
          <Button type="button" onClick={next} className="ml-auto">
            Next →
          </Button>
        ) : (
          <Button type="button" onClick={handleSubmit} disabled={isLoading} className="ml-auto">
            {isLoading ? 'Adding…' : `✓ Add ${name.split(' ')[0] || 'member'} to Family`}
          </Button>
        )}
      </div>
    </div>
  );
}
