'use client';
import React from 'react';
import { CarSetup, TrackProfile } from '@/types';

interface SetupScreenProps {
  setup: CarSetup;
  track: TrackProfile;
  onChange: (setup: CarSetup) => void;
  onNext: () => void;
  onBack: () => void;
}

interface SetupOptionProps<T extends string> {
  label: string;
  description: string;
  value: T;
  options: { value: T; label: string; desc: string; effect: string }[];
  onChange: (v: T) => void;
}

function SetupOption<T extends string>({
  label,
  description,
  value,
  options,
  onChange,
}: SetupOptionProps<T>) {
  return (
    <div className="f1-panel">
      <div className="f1-panel-header">{label}</div>
      <div className="p-3">
        <p className="text-xs text-f1-muted mb-3 leading-relaxed">{description}</p>
        <div className="grid gap-2">
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`text-left p-3 border rounded transition-all ${
                value === opt.value
                  ? 'border-f1-red bg-red-950/30 text-white'
                  : 'border-f1-border hover:border-f1-muted text-f1-muted hover:text-f1-text'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm">{opt.label}</span>
                {value === opt.value && (
                  <span className="text-xs text-f1-red font-bold">SELECTED</span>
                )}
              </div>
              <div className="text-xs opacity-80">{opt.desc}</div>
              <div
                className={`text-xs mt-1 font-mono ${
                  value === opt.value ? 'text-green-400' : 'text-f1-muted'
                }`}
              >
                {opt.effect}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SliderOption({
  label,
  description,
  value,
  min,
  max,
  step,
  leftLabel,
  rightLabel,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  leftLabel: string;
  rightLabel: string;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="f1-panel">
      <div className="f1-panel-header">{label}</div>
      <div className="p-3">
        <p className="text-xs text-f1-muted mb-3 leading-relaxed">{description}</p>
        <div className="flex items-center gap-3">
          <span className="text-xs text-f1-muted w-24 text-right">{leftLabel}</span>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={e => onChange(Number(e.target.value))}
            className="flex-1 accent-red-500"
          />
          <span className="text-xs text-f1-muted w-24">{rightLabel}</span>
        </div>
        <div className="text-center text-xs text-white font-bold mt-1">
          {Math.round(pct)}%{' '}
          <span className="text-f1-muted font-normal">
            {pct < 35 ? leftLabel : pct > 65 ? rightLabel : 'Balanced'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function SetupScreen({ setup, track, onChange, onNext, onBack }: SetupScreenProps) {
  const effects = getPreviewEffects(setup, track);

  return (
    <div className="min-h-screen bg-f1-dark p-4 flex flex-col gap-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-f1-border pb-4">
        <div>
          <div className="text-xs text-f1-red font-bold tracking-widest uppercase mb-1">Step 3 of 4</div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Car Setup</h1>
          <div className="text-xs text-f1-muted mt-1">{track.name}</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="px-4 py-2 text-xs font-bold border border-f1-border text-f1-muted rounded hover:border-white hover:text-white transition-all">
            ← Back
          </button>
          <button onClick={onNext} className="px-8 py-3 bg-f1-red text-white font-bold text-sm tracking-widest uppercase rounded hover:bg-red-600 transition-colors">
            Start Race →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Setup options */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <SetupOption
            label="Downforce Level"
            description="Higher downforce improves cornering and tire life but costs top speed. Tune to circuit type."
            value={setup.downforce}
            options={[
              {
                value: 'low',
                label: 'Low Downforce',
                desc: 'Maximum straight-line speed. Harder on rear tires in high-speed corners.',
                effect: '+Top speed, +Tire wear, -Cornering',
              },
              {
                value: 'medium',
                label: 'Medium Downforce',
                desc: 'Balanced setup. Good all-round performance.',
                effect: 'Balanced across all metrics',
              },
              {
                value: 'high',
                label: 'High Downforce',
                desc: 'Maximum grip and tire protection. Slower on straights.',
                effect: '-Top speed, -Tire wear, +Cornering',
              },
            ]}
            onChange={v => onChange({ ...setup, downforce: v })}
          />

          <SetupOption
            label="Top Speed vs Cornering"
            description="Adjust suspension, wing angles and diff settings to prioritize straight-line speed or cornering balance."
            value={setup.balanceBias}
            options={[
              {
                value: 'top_speed',
                label: 'Top Speed Bias',
                desc: 'Better for overtaking down straights and under Safety Car restarts.',
                effect: '+Overtake on straights, +Fuel saving',
              },
              {
                value: 'balanced',
                label: 'Balanced',
                desc: 'No compromise. Flexible for mixed conditions.',
                effect: 'No specific bonuses',
              },
              {
                value: 'cornering',
                label: 'Cornering Bias',
                desc: 'Faster through high-speed sections, better tire contact patch.',
                effect: '+Sector 2 pace, +Tire life',
              },
            ]}
            onChange={v => onChange({ ...setup, balanceBias: v })}
          />

          <SliderOption
            label="Tire Preservation Bias"
            description="Higher preservation bias reduces tire degradation but costs peak lap time. Key at high-deg circuits."
            value={setup.tirePreservationBias}
            min={0}
            max={1}
            step={0.1}
            leftLabel="Attack"
            rightLabel="Preserve"
            onChange={v => onChange({ ...setup, tirePreservationBias: v })}
          />

          <SetupOption
            label="Fuel Load"
            description="Carry more fuel for safety margin or run lighter for raw pace. Heavy fuel = undercut risk."
            value={setup.fuelLoad}
            options={[
              {
                value: 'light',
                label: 'Light Fuel Load',
                desc: 'Maximum pace but risk of running out near the end.',
                effect: '-0.4s/lap, ⚠️ Fuel risk in long stints',
              },
              {
                value: 'standard',
                label: 'Standard Load',
                desc: 'Correct fuel for full race distance.',
                effect: 'Balanced — no risk',
              },
              {
                value: 'heavy',
                label: 'Heavy Load',
                desc: 'Safety margin but slower early laps due to fuel weight.',
                effect: '+0.5s/lap early, SC reaction flexibility',
              },
            ]}
            onChange={v => onChange({ ...setup, fuelLoad: v })}
          />

          {/* Wet weather bias toggle */}
          <div className="f1-panel md:col-span-2">
            <div className="f1-panel-header">Wet Weather Bias</div>
            <div className="p-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-f1-muted leading-relaxed mb-1">
                  Configure suspension, brake bias and differential for wet conditions.
                  Costs ~0.5s in dry but significantly faster if rain arrives.
                </p>
                <span className="text-xs text-f1-muted">Effect: {setup.wetWeatherBias ? '-1.5s in wet / +0.5s in dry' : 'No wet advantage'}</span>
              </div>
              <button
                onClick={() => onChange({ ...setup, wetWeatherBias: !setup.wetWeatherBias })}
                className={`ml-4 px-4 py-2 border rounded font-bold text-xs transition-all ${
                  setup.wetWeatherBias
                    ? 'bg-blue-900/40 border-blue-500 text-blue-300'
                    : 'bg-f1-border border-f1-border text-f1-muted hover:border-f1-muted'
                }`}
              >
                {setup.wetWeatherBias ? '⛈ WET BIAS ON' : '☀ DRY SETUP'}
              </button>
            </div>
          </div>
        </div>

        {/* Setup summary */}
        <div className="flex flex-col gap-3">
          <div className="f1-panel">
            <div className="f1-panel-header">Setup Preview</div>
            <div className="p-3 flex flex-col gap-2 text-xs">
              <EffectRow label="Pace modifier" value={effects.pace} unit="s/lap" better="negative" />
              <EffectRow label="Deg modifier" value={effects.deg} unit="× base wear" better="negative" />
              <EffectRow label="Top speed" value={effects.topSpeed} unit="s effect" better="negative" />
              <EffectRow label="Wet pace" value={effects.wetPace} unit="s/lap" better="negative" />
            </div>
          </div>

          <div className="f1-panel">
            <div className="f1-panel-header">Circuit Recommendation</div>
            <div className="p-3 text-xs text-f1-muted leading-relaxed">
              {getCircuitRecommendation(track, setup)}
            </div>
          </div>

          <div className="f1-panel">
            <div className="f1-panel-header">Current Setup</div>
            <div className="p-3 grid gap-1 text-xs">
              <SetupSummaryRow label="Downforce" value={setup.downforce.replace('_', ' ')} />
              <SetupSummaryRow label="Balance" value={setup.balanceBias.replace('_', ' ')} />
              <SetupSummaryRow label="Tire preservation" value={`${Math.round(setup.tirePreservationBias * 100)}%`} />
              <SetupSummaryRow label="Fuel load" value={setup.fuelLoad} />
              <SetupSummaryRow label="Wet bias" value={setup.wetWeatherBias ? 'ON' : 'OFF'} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getPreviewEffects(setup: CarSetup, track: TrackProfile) {
  let pace = 0;
  let deg = 1.0;
  let topSpeed = 0;
  let wetPace = 0;

  if (setup.downforce === 'high') { pace -= 0.2; deg -= 0.05; topSpeed -= 0.5; }
  if (setup.downforce === 'low') { pace += 0.3; deg += 0.05; topSpeed += 0.8; }
  if (setup.balanceBias === 'top_speed') { pace += 0.2; topSpeed += 0.5; }
  if (setup.balanceBias === 'cornering') { pace -= 0.15; }
  pace += (setup.tirePreservationBias - 0.5) * 0.3;
  deg -= (setup.tirePreservationBias - 0.5) * 0.2;
  if (setup.wetWeatherBias) { wetPace -= 1.5; pace += 0.5; }
  if (setup.fuelLoad === 'light') pace -= 0.4;
  if (setup.fuelLoad === 'heavy') pace += 0.5;

  return { pace, deg, topSpeed, wetPace };
}

function getCircuitRecommendation(track: TrackProfile, setup: CarSetup): string {
  if (track.limitationType === 'rear') {
    return `${track.name} is rear-limited. High downforce recommended to protect rear tires. Consider high tire preservation bias at this high-deg venue.`;
  }
  if (track.limitationType === 'thermal') {
    return `${track.name} is thermally-limited. Medium downforce works well. Avoid pushing too hard early in each stint.`;
  }
  if (track.limitationType === 'front') {
    return `${track.name} is front-limited. High downforce with cornering bias recommended to maximize front grip.`;
  }
  return `${track.name} is generally balanced. Any setup works — tune to your strategy preference.`;
}

function EffectRow({
  label,
  value,
  unit,
  better,
}: {
  label: string;
  value: number;
  unit: string;
  better: 'negative' | 'positive';
}) {
  const isGood = better === 'negative' ? value < 0 : value > 0;
  const isNeutral = Math.abs(value) < 0.01;
  const color = isNeutral ? '#6b6b82' : isGood ? '#00ff88' : '#ff4466';
  const sign = value > 0 ? '+' : '';
  return (
    <div className="flex items-center justify-between">
      <span className="text-f1-muted">{label}</span>
      <span className="font-bold font-mono" style={{ color }}>
        {sign}{value.toFixed(2)} {unit}
      </span>
    </div>
  );
}

function SetupSummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-f1-muted capitalize">{label}</span>
      <span className="text-white font-bold capitalize">{value}</span>
    </div>
  );
}
