'use client';
import React, { useState } from 'react';
import { TireCompound, TireState, WeatherCondition } from '@/types';
import { getCompoundColor, getCompoundLetter } from '@/simulation/tireModel';

interface PitStopDialogProps {
  currentTire: TireState;
  lastLapTime: number;
  gapToLeader: number;
  gapToAhead: number;
  weather: WeatherCondition;
  onConfirmPit: (compound: TireCompound) => void;
  onStayOut: () => void;
}

const COMPOUNDS: TireCompound[] = ['SOFT', 'MEDIUM', 'HARD', 'INTER', 'WET'];

function formatLapTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3).padStart(6, '0');
  return `${mins}:${secs}`;
}

function formatGap(seconds: number): string {
  if (seconds <= 0) return 'LEADER';
  return `+${seconds.toFixed(3)}s`;
}

function getTireWearLabel(wear: number): { label: string; color: string } {
  if (wear >= 80) return { label: 'CRITICAL', color: 'text-red-400' };
  if (wear >= 60) return { label: 'HIGH', color: 'text-orange-400' };
  if (wear >= 40) return { label: 'MODERATE', color: 'text-yellow-400' };
  return { label: 'GOOD', color: 'text-green-400' };
}

function WearBar({ wear }: { wear: number }) {
  const color =
    wear >= 80 ? 'bg-red-500' : wear >= 60 ? 'bg-orange-500' : wear >= 40 ? 'bg-yellow-500' : 'bg-green-500';
  return (
    <div className="w-full bg-f1-border rounded-full h-1.5 mt-1">
      <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${wear}%` }} />
    </div>
  );
}

export default function PitStopDialog({
  currentTire,
  lastLapTime,
  gapToLeader,
  gapToAhead,
  weather,
  onConfirmPit,
  onStayOut,
}: PitStopDialogProps) {
  const isWet = weather === 'wet' || weather === 'very_wet' || weather === 'damp';
  const defaultCompound: TireCompound = isWet ? 'INTER' : 'MEDIUM';
  const [selectedCompound, setSelectedCompound] = useState<TireCompound>(defaultCompound);

  const wearInfo = getTireWearLabel(currentTire.wear);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-f1-panel border border-f1-border rounded-lg w-80 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-f1-red/20 border-b border-f1-red/40 px-4 py-2 flex items-center gap-2">
          <span className="text-f1-red font-black tracking-widest text-sm">🔧 PIT STOP</span>
        </div>

        <div className="p-4 flex flex-col gap-4">
          {/* Situational context */}
          <div>
            <div className="text-xs text-f1-muted uppercase tracking-wider mb-2">Situation</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-f1-dark rounded p-2">
                <div className="text-xs text-f1-muted">Last Lap</div>
                <div className="text-sm font-bold text-white tabular-nums">{formatLapTime(lastLapTime)}</div>
              </div>
              <div className="bg-f1-dark rounded p-2">
                <div className="text-xs text-f1-muted">Gap to Leader</div>
                <div className="text-sm font-bold text-white tabular-nums">{formatGap(gapToLeader)}</div>
              </div>
              <div className="bg-f1-dark rounded p-2 col-span-2">
                <div className="text-xs text-f1-muted">Gap to Car Ahead</div>
                <div className="text-sm font-bold text-white tabular-nums">
                  {gapToAhead <= 0 ? '—' : `+${gapToAhead.toFixed(3)}s`}
                </div>
              </div>
            </div>
          </div>

          {/* Current tire status */}
          <div>
            <div className="text-xs text-f1-muted uppercase tracking-wider mb-2">Current Tires</div>
            <div className="bg-f1-dark rounded p-2 flex items-center gap-3">
              <button
                className="tire-dot text-white font-bold flex-shrink-0"
                style={{ background: getCompoundColor(currentTire.compound) }}
                disabled
              >
                <span style={{ fontSize: 10 }}>{getCompoundLetter(currentTire.compound)}</span>
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-f1-muted">{currentTire.compound} — {currentTire.age} laps</span>
                  <span className={`font-bold ${wearInfo.color}`}>{wearInfo.label}</span>
                </div>
                <WearBar wear={currentTire.wear} />
                <div className="text-xs text-f1-muted mt-0.5">{currentTire.wear.toFixed(0)}% worn</div>
              </div>
            </div>
          </div>

          {/* Tire selection */}
          <div>
            <div className="text-xs text-f1-muted uppercase tracking-wider mb-2">Select New Compound</div>
            <div className="flex gap-2 flex-wrap">
              {COMPOUNDS.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedCompound(c)}
                  className={`tire-dot text-white font-bold transition-all ${
                    selectedCompound === c ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{
                    background: getCompoundColor(c),
                    borderColor: selectedCompound === c ? 'white' : getCompoundColor(c),
                  }}
                  title={c}
                >
                  <span style={{ fontSize: 10 }}>{getCompoundLetter(c)}</span>
                </button>
              ))}
              <span className="text-xs text-f1-muted self-center ml-1">{selectedCompound}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={onStayOut}
              className="flex-1 py-2 text-sm font-bold border border-f1-border text-f1-muted rounded hover:border-f1-muted hover:text-white transition-all"
            >
              → STAY OUT
            </button>
            <button
              onClick={() => onConfirmPit(selectedCompound)}
              className="flex-1 py-2 text-sm font-bold bg-f1-red/20 border border-f1-red text-f1-red rounded hover:bg-f1-red/40 transition-all"
            >
              🔧 PIT NOW
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
