import { useEffect, useState } from 'react';
import { VerificationBanner } from '@/components/providers/VerificationBanner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import {
  useProviderProfile,
  useUpdateProviderProfile,
} from '@/hooks/providers/useProviderProfile';

export function ProviderProfilePage() {
  const { profile, isLoading, refetch } = useProviderProfile();
  const { mutate: save, isPending } = useUpdateProviderProfile(refetch);
  const [form, setForm] = useState({
    specialization: '',
    clinic_name: '',
    clinic_address: '',
    phone: '',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        specialization: profile.specialization || '',
        clinic_name: profile.clinic_name || '',
        clinic_address: profile.clinic_address || '',
        phone: profile.phone || '',
      });
    }
  }, [profile]);

  if (isLoading || !profile) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  const maskedLicense = profile.license_number
    ? profile.license_number.replace(/(.{3}).*(.{5})/, '$1*****$2')
    : '—';

  return (
    <div className="space-y-8 max-w-xl">
      {!profile.is_verified && <VerificationBanner />}

      <section className="space-y-3">
        <h2 className="font-heading font-bold text-lg">Professional information</h2>
        <p className="text-sm">
          <span className="text-muted">Name:</span> {profile.name}
        </p>
        <p className="text-sm">
          <span className="text-muted">Email:</span> {profile.email}
        </p>
        <p className="text-sm">
          <span className="text-muted">License:</span> {maskedLicense}
        </p>
        <label className="block text-xs text-muted">Specialization</label>
        <Input
          value={form.specialization}
          onChange={(e) => setForm({ ...form, specialization: e.target.value })}
        />
        <label className="block text-xs text-muted">Clinic name</label>
        <Input
          value={form.clinic_name}
          onChange={(e) => setForm({ ...form, clinic_name: e.target.value })}
        />
        <label className="block text-xs text-muted">Clinic address</label>
        <Input
          value={form.clinic_address}
          onChange={(e) => setForm({ ...form, clinic_address: e.target.value })}
        />
        <label className="block text-xs text-muted">Phone</label>
        <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Button type="button" disabled={isPending} onClick={() => save(form)}>
          Save profile
        </Button>
      </section>

      <section>
        <h2 className="font-heading font-bold text-lg mb-2">Verification status</h2>
        {profile.is_verified ? (
          <span className="inline-flex items-center gap-1 text-sage font-semibold text-sm">
            ✓ Verified
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-amber-800 font-semibold text-sm">
            ⏳ Pending verification
          </span>
        )}
      </section>

      <section className="border border-border rounded-xl p-4 text-sm text-muted bg-cream/30">
        <p className="font-semibold text-ink mb-1">Account changes</p>
        <p>
          To request account changes or deactivation, contact your system administrator.
        </p>
      </section>
    </div>
  );
}
