import { useEffect, useState } from 'react';
import type { AvailabilityConfig, BreakTime, DayConfig, Weekday } from '@/types/provider';
import { WEEKDAYS } from '@/types/provider';
import { Button } from '@/components/ui/Button';

function DayAvailabilityRow({
  day,
  config,
  onChange,
}: {
  day: Weekday;
  config: DayConfig;
  onChange: (day: Weekday, config: DayConfig) => void;
}) {
  const disabled = !config.enabled;
  return (
    <tr className={disabled ? 'opacity-50' : ''}>
      <td className="py-2 capitalize font-medium text-sm">{day}</td>
      <td className="py-2">
        <input
          type="checkbox"
          checked={config.enabled}
          onChange={(e) => onChange(day, { ...config, enabled: e.target.checked })}
        />
      </td>
      <td className="py-2">
        <input
          type="time"
          disabled={disabled}
          value={config.start}
          onChange={(e) => onChange(day, { ...config, start: e.target.value })}
          className="border border-border rounded px-2 py-1 text-sm"
        />
      </td>
      <td className="py-2">
        <input
          type="time"
          disabled={disabled}
          value={config.end}
          onChange={(e) => onChange(day, { ...config, end: e.target.value })}
          className="border border-border rounded px-2 py-1 text-sm"
        />
      </td>
    </tr>
  );
}

function BreakTimeManager({
  breaks,
  onChange,
}: {
  breaks: BreakTime[];
  onChange: (b: BreakTime[]) => void;
}) {
  return (
    <div className="space-y-2">
      {breaks.map((b, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2 text-sm">
          <input
            className="border border-border rounded px-2 py-1 flex-1 min-w-[100px]"
            placeholder="Label"
            value={b.label || ''}
            onChange={(e) => {
              const next = [...breaks];
              next[i] = { ...b, label: e.target.value };
              onChange(next);
            }}
          />
          <input
            type="time"
            value={b.start}
            onChange={(e) => {
              const next = [...breaks];
              next[i] = { ...b, start: e.target.value };
              onChange(next);
            }}
            className="border border-border rounded px-2 py-1"
          />
          <span className="text-muted">–</span>
          <input
            type="time"
            value={b.end}
            onChange={(e) => {
              const next = [...breaks];
              next[i] = { ...b, end: e.target.value };
              onChange(next);
            }}
            className="border border-border rounded px-2 py-1"
          />
          <Button
            type="button"
            variant="ghost"
            className="text-xs"
            onClick={() => onChange(breaks.filter((_, j) => j !== i))}
          >
            Remove
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        className="text-xs"
        onClick={() => onChange([...breaks, { start: '12:00', end: '13:00', label: 'Break' }])}
      >
        + Add break time
      </Button>
    </div>
  );
}

function BlockedDatesManager({
  blocked,
  onChange,
}: {
  blocked: Record<string, DayConfig>;
  onChange: (b: Record<string, DayConfig>) => void;
}) {
  const dates = Object.keys(blocked).sort();
  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap">
        {dates.map((d) => (
          <span
            key={d}
            className="inline-flex items-center gap-1 bg-cream border border-border rounded-full px-3 py-1 text-xs"
          >
            {d}
            <button
              type="button"
              className="text-muted hover:text-ink"
              onClick={() => {
                const next = { ...blocked };
                delete next[d];
                onChange(next);
              }}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        type="date"
        className="border border-border rounded px-2 py-1 text-sm"
        onChange={(e) => {
          if (!e.target.value) return;
          onChange({
            ...blocked,
            [e.target.value]: { start: '00:00', end: '23:59', enabled: false },
          });
          e.target.value = '';
        }}
      />
      <p className="text-[10px] text-muted">Pick a date to block (vacation / unavailable).</p>
    </div>
  );
}

interface AvailabilityEditorProps {
  initial: AvailabilityConfig;
  onSave: (config: AvailabilityConfig) => Promise<void>;
  isSaving?: boolean;
}

export function AvailabilityEditor({ initial, onSave, isSaving }: AvailabilityEditorProps) {
  const [config, setConfig] = useState(initial);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setConfig(initial);
    setDirty(false);
  }, [initial]);

  const updateDay = (day: Weekday, dayConfig: DayConfig) => {
    setConfig((c) => ({
      ...c,
      availability_hours: { ...c.availability_hours, [day]: dayConfig },
    }));
    setDirty(true);
  };

  return (
    <div className="space-y-8">
      <section>
        <h3 className="font-heading font-bold text-lg mb-3">Working hours</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted border-b border-border">
              <th className="pb-2">Day</th>
              <th>Enabled</th>
              <th>Start</th>
              <th>End</th>
            </tr>
          </thead>
          <tbody>
            {WEEKDAYS.map((day) => (
              <DayAvailabilityRow
                key={day}
                day={day}
                config={config.availability_hours[day]}
                onChange={updateDay}
              />
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h3 className="font-heading font-bold text-lg mb-3">Appointment settings</h3>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <label>
            <span className="text-xs text-muted block mb-1">Slot duration (min)</span>
            <select
              className="w-full border border-border rounded-lg px-2 py-2"
              value={config.slot_duration}
              onChange={(e) => {
                setConfig({ ...config, slot_duration: Number(e.target.value) });
                setDirty(true);
              }}
            >
              {[15, 20, 30, 45, 60].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-xs text-muted block mb-1">Buffer (min)</span>
            <select
              className="w-full border border-border rounded-lg px-2 py-2"
              value={config.buffer_time}
              onChange={(e) => {
                setConfig({ ...config, buffer_time: Number(e.target.value) });
                setDirty(true);
              }}
            >
              {[0, 10, 15, 20, 30].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-xs text-muted block mb-1">Advance booking (days)</span>
            <select
              className="w-full border border-border rounded-lg px-2 py-2"
              value={config.advance_booking_days}
              onChange={(e) => {
                setConfig({ ...config, advance_booking_days: Number(e.target.value) });
                setDirty(true);
              }}
            >
              {[7, 14, 30, 60, 90].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section>
        <h3 className="font-heading font-bold text-lg mb-3">Break times</h3>
        <BreakTimeManager
          breaks={config.break_times}
          onChange={(break_times) => {
            setConfig({ ...config, break_times });
            setDirty(true);
          }}
        />
      </section>

      <section>
        <h3 className="font-heading font-bold text-lg mb-3">Block dates</h3>
        <BlockedDatesManager
          blocked={config.blocked_slots}
          onChange={(blocked_slots) => {
            setConfig({ ...config, blocked_slots });
            setDirty(true);
          }}
        />
      </section>

      <Button
        type="button"
        disabled={!dirty || isSaving}
        onClick={() => onSave(config).then(() => setDirty(false))}
      >
        Save availability
      </Button>
    </div>
  );
}
