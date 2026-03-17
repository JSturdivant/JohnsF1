'use client';
import React from 'react';
import { RaceState, StrategyPlanId, StrategyPlan } from '@/types';
import { getCompoundColor, getCompoundLetter } from '@/simulation/tireModel';

interface StrategyPanelProps {
  raceState: RaceState;
  onSwitchPlan: (id: StrategyPlanId) => void;
}

function PlanCard({
  plan,
  isActive,
  currentLap,
  totalLaps,
  onSwitch,
}: {
  plan: StrategyPlan;
  isActive: boolean;
  currentLap: number;
  totalLaps: number;
  onSwitch: () => void;
}) {
  // Determine which stint we should be in
  let stintIdx = 0;
  let lapCount = 0;
  for (let i = 0; i < plan.stints.length; i++) {
    lapCount += plan.stints[i].targetLaps;
    if (currentLap < lapCount) {
      stintIdx = i;
      break;
    }
    stintIdx = i;
  }

  const nextPit = plan.stints[stintIdx]?.pitWindow;

  return (
    <div
      className={`border rounded p-2 flex flex-col gap-2 transition-all ${
        isActive
          ? 'border-f1-red bg-red-950/20'
          : 'border-f1-border hover:border-f1-muted cursor-pointer'
      }`}
      onClick={isActive ? undefined : onSwitch}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-black px-1.5 py-0.5 rounded ${
              isActive ? 'bg-f1-red text-white' : 'bg-f1-border text-f1-muted'
            }`}
          >
            {plan.id}
          </span>
          <span className="text-xs font-bold text-f1-text truncate" style={{ maxWidth: 120 }}>
            {plan.name.replace(`Plan ${plan.id} — `, '').replace(`Plan ${plan.id} - `, '')}
          </span>
        </div>
        {!isActive && (
          <button
            onClick={e => { e.stopPropagation(); onSwitch(); }}
            className="text-xs text-f1-red hover:text-white transition-colors"
          >
            Switch
          </button>
        )}
        {isActive && (
          <span className="text-xs text-f1-red font-bold">ACTIVE</span>
        )}
      </div>

      {/* Stint visual */}
      <div className="flex items-center gap-1 flex-wrap">
        {plan.stints.map((s, i) => {
          const isCurrentStint = i === stintIdx && isActive;
          return (
            <div key={i} className="flex items-center gap-0.5">
              <span
                className="tire-dot text-white"
                style={{
                  background: getCompoundColor(s.compound),
                  borderColor: isCurrentStint ? 'white' : getCompoundColor(s.compound),
                  fontSize: 8,
                  width: 16,
                  height: 16,
                  outline: isCurrentStint ? '2px solid white' : 'none',
                  outlineOffset: 1,
                }}
              >
                {getCompoundLetter(s.compound)}
              </span>
              <span className="text-xs text-f1-muted" style={{ fontSize: 9 }}>{s.targetLaps}</span>
              {i < plan.stints.length - 1 && (
                <span className="text-f1-border text-xs" style={{ fontSize: 9 }}>→</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Next pit window */}
      {isActive && nextPit && (
        <div className="text-xs text-f1-muted">
          Next pit: L{nextPit[0]}–{nextPit[1]} · {plan.safetyCarResponse === 'pit' ? 'SC: Box' : 'SC: Stay'}
        </div>
      )}
    </div>
  );
}

export default function StrategyPanel({ raceState, onSwitchPlan }: StrategyPanelProps) {
  const { plans, activePlan, currentLap, totalLaps } = raceState;
  const activePlanData = plans[activePlan];

  // Current stint
  let currentStintIdx = 0;
  let lapCount = 0;
  for (let i = 0; i < activePlanData.stints.length; i++) {
    lapCount += activePlanData.stints[i].targetLaps;
    if (currentLap < lapCount) {
      currentStintIdx = i;
      break;
    }
    currentStintIdx = i;
  }
  const currentStint = activePlanData.stints[currentStintIdx];
  const nextStint = activePlanData.stints[currentStintIdx + 1];

  return (
    <div className="f1-panel flex flex-col">
      <div className="f1-panel-header">Strategy Plans</div>
      <div className="p-3 flex flex-col gap-2">
        {/* Active plan detail */}
        <div className="bg-f1-red/10 border border-f1-red/30 rounded p-2">
          <div className="text-xs font-bold text-f1-red mb-1 uppercase tracking-wider">
            Active: Plan {activePlan}
          </div>
          {currentStint && (
            <div className="flex items-center gap-2 text-xs">
              <span
                className="tire-dot text-white font-bold"
                style={{ background: getCompoundColor(currentStint.compound), borderColor: getCompoundColor(currentStint.compound), fontSize: 9, width: 18, height: 18 }}
              >
                {getCompoundLetter(currentStint.compound)}
              </span>
              <span className="text-f1-text font-bold">Stint {currentStintIdx + 1}</span>
              <span className="text-f1-muted">· Pit L{currentStint.pitWindow[0]}–{currentStint.pitWindow[1]}</span>
              <span className="text-f1-muted ml-auto capitalize">Mode: {currentStint.pushMode}</span>
            </div>
          )}
          {nextStint && (
            <div className="flex items-center gap-2 text-xs mt-1 opacity-60">
              <span>Next:</span>
              <span
                className="tire-dot text-white font-bold"
                style={{ background: getCompoundColor(nextStint.compound), borderColor: getCompoundColor(nextStint.compound), fontSize: 9, width: 14, height: 14 }}
              >
                {getCompoundLetter(nextStint.compound)}
              </span>
              <span className="text-f1-muted">{nextStint.compound}</span>
            </div>
          )}
        </div>

        {/* All plans */}
        <div className="flex flex-col gap-2">
          {(['A', 'B', 'C'] as StrategyPlanId[]).map(id => (
            <PlanCard
              key={id}
              plan={plans[id]}
              isActive={activePlan === id}
              currentLap={currentLap}
              totalLaps={totalLaps}
              onSwitch={() => onSwitchPlan(id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
