'use client';

import type { ReactNode } from 'react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

export function PanelSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

interface SliderFieldProps {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

export function SliderField({ label, value, display, min, max, step, onChange }: SliderFieldProps) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-xs tabular-nums text-foreground">{display}</span>
      </div>
      <Slider min={min} max={max} step={step} value={[value]} onValueChange={([next]) => onChange(next)} />
    </div>
  );
}

interface SegmentedFieldProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

export function SegmentedField<T extends string>({ label, value, options, onChange }: SegmentedFieldProps<T>) {
  return (
    <div className="space-y-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div role="radiogroup" aria-label={label} className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option.value)}
              className={cn(
                'h-7 rounded-lg text-xs font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
