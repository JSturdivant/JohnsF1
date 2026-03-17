'use client';
import React from 'react';
import { TrackProfile, TireCompound, RaceState } from '@/types';
import { getCompoundColor, getCompoundLetter, estimateRemainingLaps } from '@/simulation/tireModel';

interface DegradationPanelProps {
  raceState: RaceState;
}

const COMPOUNDS: TireCompound[] = ['SOFT', 'MEDIUM', 'HARD'];

export default function DegradationPanel({ raceState }: DegradationPanelProps) {
  const { track, currentLap, totalLaps, weather } = raceState;

  const playerState = raceState.drivers.find(d => d.driver.id === raceState.playerDriverId);
  const playerProfile = playerState
    ? track.compoundProfiles[playerState.tire.compound]
    : null;

  return (
    <div className="f1-panel flex flex-col">
      <div className="f1-panel-header">Track Degradation Insight</div>
      <div className="p-3 flex flex-col gap-3">
        {/* Track summary */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="text-xs text-f1-muted">Deg Level</div>
            <div
              className="font-black text-lg uppercase"
              style={{ color: track.degradationLevel === 'high' ? '#ff4466' : track.degradationLevel === 'medium' ? '#ff8833' : '#44ff99' }}
            >
              {track.degradationLevel}
            </div>
          </div>
          <div className="flex flex-col">
            <div className="text-xs text-f1-muted">Limited by</div>
            <div className="font-bold text-white capitalize">{track.limitationType}</div>
          </div>
          <div className="flex flex-col ml-auto text-right">
            <div className="text-xs text-f1-muted">Pit loss</div>
            <div className="font-bold text-f1-orange">{track.pitLaneTimeLoss}s</div>
          </div>
        </div>

        {/* Compound wear rates */}
        {COMPOUNDS.map(c => {
          const cp = track.compoundProfiles[c];
          const isCurrentCompound = playerState?.tire.compound === c;
          const color = getCompoundColor(c);

          // Expected wear at current lap if on this compound
          const lapsOnCompound = playerState?.tire.age ?? currentLap;
          const isCliff = lapsOnCompound >= cp.cliffLap;

          return (
            <div
              key={c}
              className={`border rounded p-2 ${
                isCurrentCompound ? 'border-white/30 bg-white/5' : 'border-f1-border'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="tire-dot text-white font-bold"
                  style={{ background: color, borderColor: color, fontSize: 9, width: 18, height: 18 }}
                >
                  {getCompoundLetter(c)}
                </span>
                <span className="text-xs font-bold" style={{ color }}>{c}</span>
                <span className="text-xs text-f1-muted ml-auto">
                  {cp.paceDelta < 0 ? cp.paceDelta.toFixed(1) : `+${cp.paceDelta.toFixed(1)}`}s vs Med
                </span>
                {isCurrentCompound && (
                  <span className="text-xs text-white font-bold bg-f1-red/50 px-1 rounded">NOW</span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-x-4 text-xs">
                <div>
                  <div className="text-f1-muted">Wear/lap</div>
                  <div className="font-bold" style={{ color: cp.baseWearPerLap > 3 ? '#ff4466' : '#aaaacc' }}>
                    {cp.baseWearPerLap.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-f1-muted">Cliff at</div>
                  <div className={`font-bold ${isCliff ? 'text-red-400' : 'text-white'}`}>
                    L{cp.cliffLap}
                    {isCurrentCompound && isCliff && ' ⚠'}
                  </div>
                </div>
                <div>
                  <div className="text-f1-muted">×{cp.cliffMultiplier} after</div>
                  <div className="font-bold text-white">{(cp.baseWearPerLap * cp.cliffMultiplier).toFixed(1)}%</div>
                </div>
              </div>

              {/* Thermal bar */}
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-xs text-f1-muted w-16">Thermal</span>
                <div className="flex-1 h-1.5 bg-f1-border rounded overflow-hidden">
                  <div
                    className="h-full rounded"
                    style={{ width: `${cp.thermalSensitivity * 100}%`, background: color }}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {/* Strategy window remaining */}
        {playerState && playerProfile && (
          <div className="text-xs text-f1-muted bg-f1-border/20 rounded p-2">
            <div className="font-bold text-white mb-0.5">Current tire analysis</div>
            <div>
              Estimated {estimateRemainingLaps(playerState.tire, playerProfile, playerState.currentPaceMode)} laps
              on current {playerState.tire.compound} before critical
            </div>
            <div className="mt-0.5">
              Race has {totalLaps - currentLap} laps remaining
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
