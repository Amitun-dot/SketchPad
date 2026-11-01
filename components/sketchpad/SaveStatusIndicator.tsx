'use client';

import { Check, Cloud, CloudOff, LoaderCircle } from 'lucide-react';
import { useSketchStore, type SaveStatus } from '@/lib/store/sketch-store';
import { cn } from '@/lib/utils';

const STATUS_LABELS: Record<SaveStatus, string> = {
  idle: 'Saved',
  saved: 'Saved',
  unsaved: 'Unsaved changes',
  saving: 'Saving...',
  error: 'Not saved',
};

export function SaveStatusIndicator() {
  const status = useSketchStore((state) => state.saveStatus);
  const error = useSketchStore((state) => state.saveError);

  const icon =
    status === 'saving' ? (
      <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
    ) : status === 'error' ? (
      <CloudOff className="h-3.5 w-3.5" aria-hidden="true" />
    ) : status === 'unsaved' ? (
      <Cloud className="h-3.5 w-3.5" aria-hidden="true" />
    ) : (
      <Check className="h-3.5 w-3.5" aria-hidden="true" />
    );

  return (
    <div
      role="status"
      aria-live="polite"
      title={error ?? undefined}
      className={cn(
        'hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium sm:flex',
        status === 'error' ? 'bg-destructive/10 text-destructive' : 'text-muted-foreground'
      )}
    >
      {icon}
      <span>{STATUS_LABELS[status]}</span>
    </div>
  );
}
