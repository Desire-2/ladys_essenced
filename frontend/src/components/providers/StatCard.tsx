interface StatCardProps {
  label: string;
  value: number;
  highlight?: boolean;
  sublabel?: string;
}

export function StatCard({ label, value, highlight, sublabel }: StatCardProps) {
  return (
    <div
      className={`rounded-xl border p-4 bg-surface shadow-card ${
        highlight ? 'border-amber-300 bg-amber-50/40' : 'border-border'
      }`}
    >
      <p className="text-2xl font-bold font-heading text-ink tabular-nums">{value}</p>
      <p className="text-xs text-muted mt-1 font-medium">{label}</p>
      {sublabel && <p className="text-[10px] text-muted mt-0.5">{sublabel}</p>}
    </div>
  );
}
