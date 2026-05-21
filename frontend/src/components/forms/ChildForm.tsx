import React, { useState } from 'react';
import { UserPlus, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface ChildFormProps {
  onSubmit: (data: {
    first_name: string;
    last_name: string;
    age: number;
    gender: 'female' | 'male';
  }) => void;
  isLoading?: boolean;
}

export const ChildForm: React.FC<ChildFormProps> = ({
  onSubmit,
  isLoading,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'female' | 'male'>('female');
  const [errorMsg, setErrorMsg] = useState('');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!firstName || !lastName || !age) {
       setErrorMsg('Please fill in child first name, last name, and age.');
       return;
    }

    const numericAge = parseInt(age, 10);
    if (isNaN(numericAge) || numericAge <= 0 || numericAge > 100) {
      setErrorMsg('Please provide a valid age in years.');
       return;
    }

    onSubmit({
      first_name: firstName,
      last_name: lastName,
      age: numericAge,
      gender,
    });
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4 text-left font-sans">
      
      {errorMsg && (
        <div className="p-3 bg-mauve/10 text-mauve rounded-xl text-xs font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-mauve" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="First name * (Izina ry’irijya)"
          placeholder="e.g. Kezia"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
        <Input
          label="Last name * (Izina ry’umuryango)"
          placeholder="e.g. Uwase"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          type="number"
          label="Age in Years * (Agaciro k’imyaka)"
          placeholder="e.g. 14"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          required
        />

        <div className="text-left font-sans">
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
            Gender (Igitsina)
          </label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value as 'female' | 'male')}
            className="block w-full h-[40px] rounded-md border border-border bg-surface px-4 text-xs font-semibold text-ink focus:border-terracotta focus:ring-1 focus:ring-terracotta focus:outline-none"
          >
            <option value="female">Female • Umukobwa</option>
            <option value="male">Male • Umuhungu</option>
          </select>
        </div>
      </div>

      <div className="p-3 bg-cream/30 border border-border rounded-xl text-xs text-muted/80 leading-relaxed font-sans mt-2">
        <strong>Privacy note:</strong> Adding your child creates a profile linked to your account. Kezia will be guided safely to consent to wellness sharing during her cycle overview settings.
      </div>

      <div className="pt-2">
        <Button type="submit" isLoading={isLoading} className="w-full h-11">
          <UserPlus className="w-4 h-4 mr-1.5" /> Save Child Profile • Gika Umwirondoro
        </Button>
      </div>

    </form>
  );
};
export default ChildForm;
