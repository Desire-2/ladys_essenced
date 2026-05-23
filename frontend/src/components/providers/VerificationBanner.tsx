import { Clock } from 'lucide-react';

export function VerificationBanner() {
  return (
    <div
      className="mb-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950"
      role="status"
    >
      <Clock className="h-5 w-5 shrink-0 text-amber-700 mt-0.5" aria-hidden />
      <div>
        <p className="font-semibold font-heading">Account pending verification</p>
        <p className="mt-1 text-amber-900/90 leading-relaxed">
          Your credentials are being reviewed by our team. You will receive full access to
          appointments and patient management once verified. This typically takes 1–2 business
          days.
        </p>
      </div>
    </div>
  );
}
