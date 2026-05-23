import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface ClinicalNotesEditorProps {
  initialNotes?: string;
  onSave: (notes: string) => Promise<void>;
}

export function ClinicalNotesEditor({ initialNotes = '', onSave }: ClinicalNotesEditorProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await onSave(notes);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <textarea
        className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[120px]"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={() => {
          if (notes !== initialNotes) save();
        }}
      />
      <div className="flex justify-between items-center text-[10px] text-muted">
        <span>Markdown supported. Patient will not see these notes.</span>
        <span>{notes.length} characters</span>
      </div>
      <Button type="button" className="text-xs py-2 px-4" onClick={save} disabled={saving}>
        Save notes
      </Button>
    </div>
  );
}
