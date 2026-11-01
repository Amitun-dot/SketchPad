'use client';

import { Switch } from '@/components/ui/switch';
import { useSketchStore } from '@/lib/store/sketch-store';
import { PanelSection, SegmentedField, SliderField } from './PanelControls';

const LEVEL_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
] as const;

const RESPONSE_OPTIONS = [
  { value: 'fast', label: 'Fast' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'smooth', label: 'Smooth' },
] as const;

export function HandwritingControls() {
  const handwriting = useSketchStore((state) => state.preferences.handwriting);
  const updateHandwriting = useSketchStore((state) => state.updateHandwriting);

  return (
    <PanelSection title="Handwriting">
      <SegmentedField
        label="Smoothing"
        value={handwriting.smoothing}
        options={[...LEVEL_OPTIONS]}
        onChange={(smoothing) => updateHandwriting({ smoothing })}
      />
      <SegmentedField
        label="Stabilization"
        value={handwriting.stabilization}
        options={[...LEVEL_OPTIONS]}
        onChange={(stabilization) => updateHandwriting({ stabilization })}
      />
      <SegmentedField
        label="Response"
        value={handwriting.response}
        options={[...RESPONSE_OPTIONS]}
        onChange={(response) => updateHandwriting({ response })}
      />
      <SliderField
        label="Pressure sensitivity"
        value={Math.round(handwriting.thicknessSensitivity * 100)}
        display={`${Math.round(handwriting.thicknessSensitivity * 100)}%`}
        min={0}
        max={100}
        step={1}
        onChange={(percent) => updateHandwriting({ thicknessSensitivity: percent / 100 })}
      />
      <div className="flex items-start justify-between gap-4 rounded-xl border border-border/70 p-3">
        <div className="space-y-0.5">
          <label htmlFor="natural-ink" className="text-sm font-medium">
            Natural ink
          </label>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Varies line width by stroke speed when your device does not report pressure.
          </p>
        </div>
        <Switch
          id="natural-ink"
          checked={handwriting.naturalInk}
          onCheckedChange={(naturalInk) => updateHandwriting({ naturalInk })}
        />
      </div>
    </PanelSection>
  );
}
