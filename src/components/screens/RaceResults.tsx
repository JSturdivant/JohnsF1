'use client';
import React from 'react';
import { RaceState, DriverRaceState } from '@/types';
import { getCompoundColor, getCompoundLetter } from '@/simulation/tireModel';
import { TEAMS } from '@/data/teams';

interface RaceResultsProps {
  raceState: RaceState;
  onRestart: () => void;
}

function formatLapTime(s: number): string {
  if (s <= 0 || s > 500) return '---';
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(3);
  return `${m}:${sec.padStart(6, '0')}`;
}

function formatGap(gap: number, position: number): string {
  if (position === 1) return 'WINNER';
  if (gap > 90) return '+1 LAP';
  return `+${gap.toFixed(3)}`;
}

function PodiumCard({ driver, position }: { driver: DriverRaceState; position: number }) {
  const team = TEAMS.find(t => t.id === driver.driver.teamId);
  const heights = { 1: 'h-32', 2: 'h-24', 3: 'h-20' };
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };

  return (
    <div className="flex flex-col items-center">
      <div className="text-2xl mb-2">{medals[position as 1 | 2 | 3]}</div>
      <div
        className="w-28 flex flex-col items-center justify-end p-3 rounded-t"
        style={{ background: team?.color + '33', border: `2px solid ${team?.color}`, minHeight: 96 }}
      >
        <div className="text-2xl font-black text-white">{driver.driver.shortName}</div>
        <div className="text-xs text-f1-muted">{driver.driver.name}</div>
        <div className="text-xs" style={{ color: team?.color }}>{team?.shortName}</div>
        <div className="text-xs text-f1-muted mt-1">{driver.totalPitStops} stops</div>
      </div>
      <div
        className={`w-28 flex items-center justify-center font-black text-3xl text-white ${heights[position as 1 | 2 | 3]}`}
        style={{ background: position === 1 ? '#FFD70033' : '#ffffff11', borderRadius: '0 0 4px 4px' }}
      >
        P{position}
      </div>
    </div>
  );
}

export default function RaceResults({ raceState, onRestart }: RaceResultsProps) {
  const finishers = raceState.drivers.filter(d => !d.dnf).sort((a, b) => a.position - b.position);
  const dnf = raceState.drivers.filter(d => d.dnf);
  const playerState = raceState.drivers.find(d => d.driver.id === raceState.playerDriverId)!;
  const leader = finishers[0];

  const podium = finishers.slice(0, 3);
  const rest = finishers.slice(3);

  // Stats for player
  const playerEvents = raceState.events.filter(e => e.driverId === raceState.playerDriverId || e.type === 'strategy');
  const totalRaceTime = playerState.totalRaceTime;

  const pointsTable = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
  const playerPoints = playerState.position <= 10 ? pointsTable[playerState.position - 1] : 0;

  return (
    <div className="min-h-screen bg-f1-dark p-4 flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-f1-border pb-4">
        <div className="text-xs text-f1-red font-bold tracking-widest uppercase mb-1">
          Race Finished
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">
          {raceState.track.name}
        </h1>
        <div className="text-f1-muted text-sm mt-1">
          {raceState.track.circuit} · {raceState.totalLaps} Laps
        </div>
      </div>

      {/* Podium */}
      <div>
        <div className="text-xs text-f1-muted font-bold tracking-widest uppercase mb-4">Podium</div>
        <div className="flex items-end justify-center gap-4">
          {podium[1] && <PodiumCard driver={podium[1]} position={2} />}
          {podium[0] && <PodiumCard driver={podium[0]} position={1} />}
          {podium[2] && <PodiumCard driver={podium[2]} position={3} />}
        </div>
      </div>

      {/* Player result highlight */}
      <div
        className={`p-4 rounded border ${
          playerState.position <= 3
            ? 'border-yellow-500 bg-yellow-950/20'
            : playerState.position <= 10
            ? 'border-f1-red bg-red-950/20'
            : 'border-f1-border bg-f1-panel'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="text-4xl font-black" style={{ color: playerState.position <= 3 ? '#FFD700' : '#fff' }}>
            P{playerState.position}
          </div>
          <div>
            <div className="text-lg font-bold text-white">{playerState.driver.name}</div>
            <div className="text-xs text-f1-muted">
              {TEAMS.find(t => t.id === playerState.driver.teamId)?.name}
            </div>
          </div>
          <div className="ml-auto text-right">
            {playerPoints > 0 && (
              <div className="text-2xl font-black text-f1-gold">+{playerPoints} pts</div>
            )}
            <div className="text-xs text-f1-muted">
              {playerState.totalPitStops} pit stop{playerState.totalPitStops !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Stint history */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-f1-muted">Stints:</span>
          {playerState.stintHistory.map((h, i) => (
            <div key={i} className="flex items-center gap-1">
              <span
                className="tire-dot text-white font-bold"
                style={{ background: getCompoundColor(h.compound), borderColor: getCompoundColor(h.compound), fontSize: 9, width: 18, height: 18 }}
              >
                {getCompoundLetter(h.compound)}
              </span>
              <span className="text-xs text-f1-muted">{h.laps}L</span>
              {i < playerState.stintHistory.length - 1 && <span className="text-f1-muted text-xs">→</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Full results */}
      <div className="f1-panel">
        <div className="f1-panel-header">Full Classification</div>
        <div>
          {/* Headers */}
          <div
            className="grid text-f1-muted text-xs px-3 py-1.5 border-b border-f1-border"
            style={{ gridTemplateColumns: '28px 40px 1fr 80px 80px 40px 60px' }}
          >
            <span>POS</span>
            <span>DRV</span>
            <span>TEAM</span>
            <span className="text-right">GAP</span>
            <span className="text-right">LAST LAP</span>
            <span className="text-center">STOPS</span>
            <span className="text-right">PTS</span>
          </div>
          {finishers.map((ds, i) => {
            const team = TEAMS.find(t => t.id === ds.driver.teamId);
            const isPlayer = ds.driver.id === raceState.playerDriverId;
            const pts = i < 10 ? pointsTable[i] : 0;
            return (
              <div
                key={ds.driver.id}
                className={`grid items-center px-3 py-2 text-xs border-b border-f1-border/30 ${
                  isPlayer ? 'bg-red-950/20 border-l-2 border-f1-red' : ''
                }`}
                style={{ gridTemplateColumns: '28px 40px 1fr 80px 80px 40px 60px' }}
              >
                <span className={`font-black ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-f1-muted'}`}>
                  {ds.position}
                </span>
                <div className="flex items-center gap-1">
                  <div className="w-1 h-4 rounded-sm" style={{ background: team?.color ?? '#666' }} />
                  <span className={`font-bold ${isPlayer ? 'text-f1-red' : 'text-f1-text'}`}>
                    {ds.driver.shortName}
                  </span>
                </div>
                <span className="text-f1-muted truncate">{team?.shortName}</span>
                <span className="text-right font-mono text-f1-text">
                  {formatGap(ds.gapToLeader, ds.position)}
                </span>
                <span className="text-right font-mono text-f1-muted">
                  {formatLapTime(ds.lapTime)}
                </span>
                <span className="text-center text-f1-muted">{ds.totalPitStops}</span>
                <span className={`text-right font-bold ${pts > 0 ? 'text-yellow-400' : 'text-f1-border'}`}>
                  {pts > 0 ? `+${pts}` : '—'}
                </span>
              </div>
            );
          })}
          {/* DNF */}
          {dnf.map(ds => {
            const team = TEAMS.find(t => t.id === ds.driver.teamId);
            const isPlayer = ds.driver.id === raceState.playerDriverId;
            return (
              <div
                key={ds.driver.id}
                className={`grid items-center px-3 py-2 text-xs border-b border-f1-border/20 opacity-50 ${isPlayer ? 'bg-red-950/20' : ''}`}
                style={{ gridTemplateColumns: '28px 40px 1fr 80px 80px 40px 60px' }}
              >
                <span className="text-red-500 font-bold">DNF</span>
                <div className="flex items-center gap-1">
                  <div className="w-1 h-4 rounded-sm" style={{ background: team?.color ?? '#666' }} />
                  <span className="text-f1-muted">{ds.driver.shortName}</span>
                </div>
                <span className="text-f1-muted truncate col-span-4">{ds.dnfReason}</span>
                <span className="text-center text-f1-muted">{ds.totalPitStops}</span>
                <span className="text-right text-f1-border">—</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Race events summary */}
      <div className="f1-panel">
        <div className="f1-panel-header">Race Highlights</div>
        <div className="p-3 flex flex-col gap-1">
          {raceState.events
            .filter(e => e.severity !== 'info' || e.type === 'safety_car' || e.type === 'red_flag')
            .slice(-20)
            .map((event, i) => (
              <div key={i} className="text-xs text-f1-muted">
                <span className="text-f1-border">[L{event.lap}]</span>{' '}
                <span className={event.severity === 'critical' ? 'text-red-300' : event.severity === 'warning' ? 'text-yellow-300' : 'text-f1-muted'}>
                  {event.message}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Restart */}
      <div className="flex justify-center pb-4">
        <button
          onClick={onRestart}
          className="px-12 py-4 bg-f1-red text-white font-black text-lg tracking-widest uppercase rounded hover:bg-red-600 transition-colors"
        >
          NEW RACE
        </button>
      </div>
    </div>
  );
}
