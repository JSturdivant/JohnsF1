'use client';
import React, { useState } from 'react';
import {
  StrategyPlan,
  StrategyPlanId,
  StintPlan,
  TrackProfile,
  TireCompound,
  PaceMode,
} from '@/types';
import { getCompoundColor, getCompoundLetter } from '@/simulation/tireModel';

interface StrategyPlanningProps {
  track: TrackProfile;
  plans: Record<StrategyPlanId, StrategyPlan>;
  activePlan: StrategyPlanId;
  onPlansChange: (plans: Record<StrategyPlanId, StrategyPlan>) => void;
  onActivePlanChange: (id: StrategyPlanId) => void;
  onNext: () => void;
  onBack: () => void;
}

const COMPOUNDS: TireCompound[] = ['SOFT', 'MEDIUM', 'HARD', 'INTER', 'WET'];

const DEFAULT_PLANS: Record<StrategyPlanId, StrategyPlan> = {
  A: {
    id: 'A',
    name: 'Plan A — Conservative Two-Stop',
    stints: [
      { compound: 'MEDIUM', targetLaps: 17, pitWindow: [14, 20], pushMode: 'normal' },
      { compound: 'MEDIUM', targetLaps: 18, pitWindow: [32, 38], pushMode: 'normal' },
      { compound: 'HARD', targetLaps: 17, pitWindow: [50, 52], pushMode: 'conserve' },
    ],
    safetyCarResponse: 'pit',
    rainResponse: 'pit_inters',
    undercutIntent: false,
    overcutIntent: false,
    notes: 'Safe two-stop. Adjust if SC bunches the field.',
  },
  B: {
    id: 'B',
    name: 'Plan B — Aggressive Undercut',
    stints: [
      { compound: 'SOFT', targetLaps: 12, pitWindow: [10, 14], pushMode: 'push' },
      { compound: 'MEDIUM', targetLaps: 20, pitWindow: [30, 36], pushMode: 'normal' },
      { compound: 'HARD', targetLaps: 20, pitWindow: [50, 52], pushMode: 'conserve' },
    ],
    safetyCarResponse: 'pit',
    rainResponse: 'pit_inters',
    undercutIntent: true,
    overcutIntent: false,
    notes: 'Early soft stint for track position. Aggressive undercut window.',
  },
  C: {
    id: 'C',
    name: 'Plan C — Safety Car Gamble',
    stints: [
      { compound: 'HARD', targetLaps: 30, pitWindow: [20, 38], pushMode: 'conserve' },
      { compound: 'MEDIUM', targetLaps: 22, pitWindow: [48, 52], pushMode: 'push' },
    ],
    safetyCarResponse: 'pit',
    rainResponse: 'pit_wets',
    undercutIntent: false,
    overcutIntent: true,
    notes: 'Bet on SC to time free stop. Overcut strategy vs rival two-stoppers.',
  },
};

function CompoundPicker({
  value,
  onChange,
}: {
  value: TireCompound;
  onChange: (c: TireCompound) => void;
}) {
  return (
    <div className="flex gap-1">
      {COMPOUNDS.map(c => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={`tire-dot transition-all ${
            value === c ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
          }`}
          style={{
            background: getCompoundColor(c),
            borderColor: value === c ? 'white' : getCompoundColor(c),
          }}
          title={c}
        >
          <span className="text-white font-bold" style={{ fontSize: 10 }}>
            {getCompoundLetter(c)}
          </span>
        </button>
      ))}
    </div>
  );
}

function StintEditor({
  stint,
  index,
  isLast,
  totalLaps,
  onChange,
  onRemove,
}: {
  stint: StintPlan;
  index: number;
  isLast: boolean;
  totalLaps: number;
  onChange: (s: StintPlan) => void;
  onRemove: () => void;
}) {
  return (
    <div className="border border-f1-border rounded p-3 bg-black/20 flex flex-col gap-2">
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs font-bold text-f1-muted uppercase">
          Stint {index + 1}{isLast ? ' (final)' : ''}
        </div>
        {!isLast && (
          <button
            onClick={onRemove}
            className="text-xs text-f1-muted hover:text-red-400 transition-colors"
          >
            ✕ Remove
          </button>
        )}
      </div>

      {/* Compound */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-f1-muted w-20">Compound</span>
        <CompoundPicker value={stint.compound} onChange={c => onChange({ ...stint, compound: c })} />
        <span className="text-xs font-bold ml-1" style={{ color: getCompoundColor(stint.compound) }}>
          {stint.compound}
        </span>
      </div>

      {/* Target laps */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-f1-muted w-20">Target laps</span>
        <input
          type="range"
          min={5}
          max={totalLaps}
          value={stint.targetLaps}
          onChange={e => onChange({ ...stint, targetLaps: Number(e.target.value) })}
          className="flex-1 accent-red-500"
        />
        <span className="text-xs font-bold text-white w-8 text-right">{stint.targetLaps}</span>
      </div>

      {/* Pit window */}
      {!isLast && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-f1-muted w-20">Pit window</span>
          <div className="flex items-center gap-2 flex-1">
            <input
              type="number"
              min={1}
              max={totalLaps}
              value={stint.pitWindow[0]}
              onChange={e =>
                onChange({ ...stint, pitWindow: [Number(e.target.value), stint.pitWindow[1]] })
              }
              className="w-12 bg-f1-border text-white text-xs text-center rounded p-1"
            />
            <span className="text-f1-muted text-xs">to</span>
            <input
              type="number"
              min={1}
              max={totalLaps}
              value={stint.pitWindow[1]}
              onChange={e =>
                onChange({ ...stint, pitWindow: [stint.pitWindow[0], Number(e.target.value)] })
              }
              className="w-12 bg-f1-border text-white text-xs text-center rounded p-1"
            />
            <span className="text-xs text-f1-muted">lap</span>
          </div>
        </div>
      )}

      {/* Pace mode */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-f1-muted w-20">Pace mode</span>
        <div className="flex gap-1">
          {(['push', 'normal', 'conserve'] as PaceMode[]).map(m => (
            <button
              key={m}
              onClick={() => onChange({ ...stint, pushMode: m })}
              className={`px-2 py-0.5 text-xs rounded border transition-all ${
                stint.pushMode === m
                  ? 'border-f1-red text-red-300 bg-red-950'
                  : 'border-f1-border text-f1-muted hover:border-f1-muted'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlanEditor({
  plan,
  isActive,
  track,
  onPlanChange,
  onSetActive,
}: {
  plan: StrategyPlan;
  isActive: boolean;
  track: TrackProfile;
  onPlanChange: (p: StrategyPlan) => void;
  onSetActive: () => void;
}) {
  const totalAssigned = plan.stints.reduce((sum, s) => sum + s.targetLaps, 0);

  const addStint = () => {
    const last = plan.stints[plan.stints.length - 1];
    onPlanChange({
      ...plan,
      stints: [
        ...plan.stints,
        {
          compound: 'MEDIUM',
          targetLaps: Math.max(5, track.totalLaps - totalAssigned),
          pitWindow: [totalAssigned + 3, totalAssigned + 8],
          pushMode: 'normal',
        },
      ],
    });
  };

  const removeStint = (i: number) => {
    onPlanChange({ ...plan, stints: plan.stints.filter((_, idx) => idx !== i) });
  };

  const updateStint = (i: number, s: StintPlan) => {
    const newStints = [...plan.stints];
    newStints[i] = s;
    onPlanChange({ ...plan, stints: newStints });
  };

  return (
    <div
      className={`f1-panel flex flex-col gap-3 ${
        isActive ? 'ring-2 ring-f1-red' : ''
      }`}
    >
      <div className="f1-panel-header flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`px-2 py-0.5 font-black text-xs rounded ${
              isActive ? 'bg-f1-red text-white' : 'bg-f1-border text-f1-muted'
            }`}
          >
            PLAN {plan.id}
          </span>
          <input
            className="bg-transparent text-white text-xs font-bold focus:outline-none"
            value={plan.name}
            onChange={e => onPlanChange({ ...plan, name: e.target.value })}
          />
        </div>
        <button
          onClick={onSetActive}
          className={`text-xs px-3 py-1 rounded border transition-all ${
            isActive
              ? 'bg-f1-red border-f1-red text-white'
              : 'border-f1-border text-f1-muted hover:border-f1-red hover:text-white'
          }`}
        >
          {isActive ? '✓ ACTIVE' : 'Set Active'}
        </button>
      </div>

      <div className="px-3 pb-1 flex flex-col gap-2">
        {/* Stint overview */}
        <div className="flex items-center gap-2 flex-wrap">
          {plan.stints.map((s, i) => (
            <div key={i} className="flex items-center gap-1">
              <span
                className="tire-dot text-white font-bold"
                style={{
                  background: getCompoundColor(s.compound),
                  borderColor: getCompoundColor(s.compound),
                  fontSize: 10,
                }}
              >
                {getCompoundLetter(s.compound)}
              </span>
              <span className="text-xs text-f1-muted">{s.targetLaps}L</span>
              {i < plan.stints.length - 1 && (
                <span className="text-f1-muted text-xs">→</span>
              )}
            </div>
          ))}
          <span
            className={`ml-auto text-xs font-bold ${
              totalAssigned === track.totalLaps
                ? 'text-green-400'
                : totalAssigned < track.totalLaps
                ? 'text-yellow-400'
                : 'text-red-400'
            }`}
          >
            {totalAssigned}/{track.totalLaps} laps
          </span>
        </div>

        {/* Stint editors */}
        <div className="flex flex-col gap-2">
          {plan.stints.map((s, i) => (
            <StintEditor
              key={i}
              stint={s}
              index={i}
              isLast={i === plan.stints.length - 1}
              totalLaps={track.totalLaps}
              onChange={ns => updateStint(i, ns)}
              onRemove={() => removeStint(i)}
            />
          ))}
        </div>

        {plan.stints.length < 4 && (
          <button
            onClick={addStint}
            className="text-xs text-f1-muted border border-dashed border-f1-border rounded p-2 hover:text-white hover:border-f1-muted transition-all"
          >
            + Add Stint
          </button>
        )}

        {/* Fallback rules */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div>
            <div className="text-xs text-f1-muted mb-1">Safety Car response</div>
            <select
              value={plan.safetyCarResponse}
              onChange={e =>
                onPlanChange({ ...plan, safetyCarResponse: e.target.value as StrategyPlan['safetyCarResponse'] })
              }
              className="w-full bg-f1-border text-white text-xs rounded p-1.5 border border-f1-border focus:outline-none"
            >
              <option value="pit">Box immediately</option>
              <option value="stay">Stay out</option>
              <option value="assess">Assess situation</option>
            </select>
          </div>
          <div>
            <div className="text-xs text-f1-muted mb-1">Rain response</div>
            <select
              value={plan.rainResponse}
              onChange={e =>
                onPlanChange({ ...plan, rainResponse: e.target.value as StrategyPlan['rainResponse'] })
              }
              className="w-full bg-f1-border text-white text-xs rounded p-1.5 border border-f1-border focus:outline-none"
            >
              <option value="pit_inters">Pit for Intermediates</option>
              <option value="pit_wets">Pit for Wets</option>
              <option value="stay">Stay out (risk it)</option>
            </select>
          </div>
        </div>

        {/* Intent flags */}
        <div className="flex gap-3 text-xs">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={plan.undercutIntent}
              onChange={e => onPlanChange({ ...plan, undercutIntent: e.target.checked })}
              className="accent-red-500"
            />
            <span className="text-f1-muted">Undercut intent</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={plan.overcutIntent}
              onChange={e => onPlanChange({ ...plan, overcutIntent: e.target.checked })}
              className="accent-red-500"
            />
            <span className="text-f1-muted">Overcut intent</span>
          </label>
        </div>

        {/* Notes */}
        <textarea
          value={plan.notes}
          onChange={e => onPlanChange({ ...plan, notes: e.target.value })}
          rows={2}
          placeholder="Engineer notes..."
          className="w-full bg-black/30 text-xs text-f1-muted border border-f1-border rounded p-2 resize-none focus:outline-none focus:border-f1-muted"
        />
      </div>
    </div>
  );
}

export default function StrategyPlanning({
  track,
  plans,
  activePlan,
  onPlansChange,
  onActivePlanChange,
  onNext,
  onBack,
}: StrategyPlanningProps) {
  const updatePlan = (id: StrategyPlanId, plan: StrategyPlan) => {
    onPlansChange({ ...plans, [id]: plan });
  };

  return (
    <div className="min-h-screen bg-f1-dark p-4 flex flex-col gap-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-f1-border pb-4">
        <div>
          <div className="text-xs text-f1-red font-bold tracking-widest uppercase mb-1">Step 2 of 4</div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Strategy Planning</h1>
          <div className="text-xs text-f1-muted mt-1">{track.name} — {track.totalLaps} laps</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="px-4 py-2 text-xs font-bold border border-f1-border text-f1-muted rounded hover:border-white hover:text-white transition-all">
            ← Back
          </button>
          <button onClick={onNext} className="px-6 py-2 bg-f1-red text-white font-bold text-xs tracking-widest uppercase rounded hover:bg-red-600 transition-colors">
            Car Setup →
          </button>
        </div>
      </div>

      {/* Active plan indicator */}
      <div className="flex items-center gap-3 p-3 bg-f1-red/10 border border-f1-red/30 rounded text-sm">
        <span className="text-f1-red font-bold">ACTIVE:</span>
        <span className="text-white font-bold">{plans[activePlan].name}</span>
        <span className="text-f1-muted text-xs ml-2">
          — This plan will auto-execute unless you intervene during the race.
        </span>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {(['A', 'B', 'C'] as StrategyPlanId[]).map(id => (
          <PlanEditor
            key={id}
            plan={plans[id]}
            isActive={activePlan === id}
            track={track}
            onPlanChange={p => updatePlan(id, p)}
            onSetActive={() => onActivePlanChange(id)}
          />
        ))}
      </div>
    </div>
  );
}

export { DEFAULT_PLANS };
