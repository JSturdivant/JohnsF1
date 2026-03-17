'use client';
import React from 'react';
import { DriverRaceState, RaceState, UnderOvercutAnalysis } from '@/types';
import {
  getCompoundColor,
  getCompoundLetter,
  getTireStatusLabel,
  getTireStatusColor,
  estimateRemainingLaps,
} from '@/simulation/tireModel';
import { TEAMS } from '@/data/teams';

interface DriverCardProps {
  playerState: DriverRaceState;
  raceState: RaceState;
  undercutAnalysis: UnderOvercutAnalysis | null;
}

function TireWearBar({ wear }: { wear: number }) {
  const color = wear >= 80 ? '#ff2222' : wear >= 60 ? '#ff8800' : wear >= 40 ? '#ffdd00' : '#00ff88';
  const remaining = 100 - wear;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-3 bg-f1-border rounded overflow-hidden">
        <div
          className="h-full rounded transition-all duration-500"
          style={{ width: `${remaining}%`, background: color }}
        />
      </div>
      <span className="text-xs font-mono font-bold tabular-nums" style={{ color }}>
        {Math.round(wear)}%
      </span>
    </div>
  );
}

export default function DriverCard({ playerState, raceState, undercutAnalysis }: DriverCardProps) {
  const team = TEAMS.find(t => t.id === playerState.driver.teamId);
  const tireColor = getCompoundColor(playerState.tire.compound);
  const tireStatus = getTireStatusLabel(playerState.tire);
  const tireStatusColor = getTireStatusColor(playerState.tire);
  const profile = raceState.track.compoundProfiles[playerState.tire.compound];
  const remainingLaps = estimateRemainingLaps(
    playerState.tire, profile, playerState.currentPaceMode
  );
  const raceLapsLeft = raceState.totalLaps - raceState.currentLap;

  // Gap displays
  const formatGap = (g: number) =>
    g <= 0 ? 'LEADER' : g > 90 ? '+1 LAP' : `+${g.toFixed(3)}s`;
  const formatInterval = (g: number) =>
    g > 90 ? '+1 LAP' : `${g.toFixed(3)}s`;
  const formatLap = (s: number) => {
    if (s <= 0 || s > 500) return '---';
    const m = Math.floor(s / 60);
    const sec = (s % 60).toFixed(3);
    return `${m}:${sec.padStart(6, '0')}`;
  };

  const paceModeColor = {
    push: '#ff4466',
    normal: '#00ff88',
    conserve: '#ffdd00',
    cruise: '#6699ff',
  }[playerState.currentPaceMode];

  return (
    <div className="f1-panel flex flex-col">
      <div className="f1-panel-header flex items-center justify-between">
        <span>Your Driver</span>
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-0.5 text-xs font-bold rounded uppercase"
            style={{ background: paceModeColor + '22', color: paceModeColor, border: `1px solid ${paceModeColor}44` }}
          >
            {playerState.currentPaceMode}
          </span>
        </div>
      </div>

      <div className="p-3 flex flex-col gap-3">
        {/* Driver identity */}
        <div className="flex items-center gap-3">
          <div
            className="w-2 h-12 rounded"
            style={{ background: team?.color ?? '#666' }}
          />
          <div>
            <div className="text-lg font-black text-white leading-none">
              {playerState.driver.name}
            </div>
            <div className="text-xs text-f1-muted mt-0.5">
              #{playerState.driver.number} · {team?.shortName}
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-3xl font-black" style={{ color: playerState.position <= 3 ? '#FFD700' : '#fff' }}>
              P{playerState.position}
            </div>
            <div className="text-xs text-f1-muted">Position</div>
          </div>
        </div>

        {/* Gaps */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="f1-panel p-2">
            <div className="text-f1-muted mb-0.5">Gap to leader</div>
            <div className="font-bold text-white font-mono">
              {formatGap(playerState.gapToLeader)}
            </div>
          </div>
          <div className="f1-panel p-2">
            <div className="text-f1-muted mb-0.5">Interval ahead</div>
            <div className="font-bold text-white font-mono">
              {playerState.position > 1 ? formatInterval(playerState.gapToAhead) : '—'}
            </div>
          </div>
          <div className="f1-panel p-2">
            <div className="text-f1-muted mb-0.5">Gap behind</div>
            <div className="font-bold text-white font-mono">
              {playerState.intervalBehind > 90
                ? '+1 LAP'
                : `${playerState.intervalBehind.toFixed(3)}s`}
            </div>
          </div>
          <div className="f1-panel p-2">
            <div className="text-f1-muted mb-0.5">Last lap</div>
            <div className="font-bold text-white font-mono">
              {formatLap(playerState.lapTime)}
            </div>
          </div>
        </div>

        {/* Tire status */}
        <div className="f1-panel p-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span
                className="tire-dot text-white font-bold"
                style={{ background: tireColor, borderColor: tireColor }}
              >
                {getCompoundLetter(playerState.tire.compound)}
              </span>
              <div>
                <div className="text-xs font-bold" style={{ color: tireColor }}>
                  {playerState.tire.compound}
                </div>
                <div className="text-xs text-f1-muted">Lap {playerState.tire.age}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold" style={{ color: tireStatusColor }}>
                {tireStatus}
              </div>
              <div className="text-xs text-f1-muted">
                ~{remainingLaps}L remain
              </div>
            </div>
          </div>
          <TireWearBar wear={playerState.tire.wear} />
          {playerState.tire.graining > 10 && (
            <div className="mt-1 text-xs text-yellow-400">
              ⚠ Graining: {Math.round(playerState.tire.graining)}%
            </div>
          )}
          {playerState.tire.overheating > 15 && (
            <div className="mt-1 text-xs text-red-400">
              🔥 Overheating: {Math.round(playerState.tire.overheating)}%
            </div>
          )}
          {remainingLaps < raceLapsLeft && remainingLaps < 8 && (
            <div className="mt-1 text-xs font-bold text-red-400 blink-red">
              ⚠ TIRE LIFE CRITICAL — pit window open
            </div>
          )}
        </div>

        {/* Stint history */}
        <div>
          <div className="text-xs text-f1-muted mb-1 uppercase tracking-wider">Stint History</div>
          <div className="flex gap-1 flex-wrap">
            {playerState.stintHistory.map((h, i) => (
              <div key={i} className="flex items-center gap-1">
                <span
                  className="tire-dot text-white"
                  style={{
                    background: getCompoundColor(h.compound),
                    borderColor: getCompoundColor(h.compound),
                    fontSize: 9,
                    width: 18,
                    height: 18,
                  }}
                >
                  {getCompoundLetter(h.compound)}
                </span>
                <span className="text-xs text-f1-muted">{h.laps}L</span>
                {i < playerState.stintHistory.length - 1 && (
                  <span className="text-f1-border">→</span>
                )}
              </div>
            ))}
          </div>
          <div className="text-xs text-f1-muted mt-1">
            Stops: {playerState.totalPitStops}
            {playerState.pitLaps.length > 0 && ` (L${playerState.pitLaps.join(', L')})`}
          </div>
        </div>

        {/* Undercut / overcut indicators */}
        {undercutAnalysis && (
          <div className="flex flex-col gap-1">
            {undercutAnalysis.undercutViable && (
              <div
                className={`px-2 py-1.5 rounded text-xs font-bold flex items-center gap-2 ${
                  undercutAnalysis.undercutRisk === 'low'
                    ? 'bg-green-900/40 text-green-300 border border-green-700'
                    : undercutAnalysis.undercutRisk === 'medium'
                    ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-700'
                    : 'bg-red-900/30 text-red-300 border border-red-800'
                }`}
              >
                <span>⬇</span>
                <span>
                  UNDERCUT {undercutAnalysis.undercutRisk.toUpperCase()} vs P{undercutAnalysis.targetPosition}
                </span>
              </div>
            )}
            {undercutAnalysis.overcutViable && (
              <div
                className={`px-2 py-1.5 rounded text-xs font-bold flex items-center gap-2 ${
                  undercutAnalysis.overcutRisk === 'low'
                    ? 'bg-blue-900/40 text-blue-300 border border-blue-700'
                    : undercutAnalysis.overcutRisk === 'medium'
                    ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-700'
                    : 'bg-red-900/30 text-red-300 border border-red-800'
                }`}
              >
                <span>⬆</span>
                <span>
                  OVERCUT {undercutAnalysis.overcutRisk.toUpperCase()} vs P{undercutAnalysis.targetPosition}
                </span>
              </div>
            )}
            {!undercutAnalysis.undercutViable && !undercutAnalysis.overcutViable && (
              <div className="px-2 py-1 text-xs text-f1-muted bg-f1-border/20 rounded">
                No undercut/overcut opportunity currently
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
