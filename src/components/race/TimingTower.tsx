'use client';
import React from 'react';
import { DriverRaceState, SafetyCarStatus } from '@/types';
import { getCompoundColor, getCompoundLetter, getTireStatusColor } from '@/simulation/tireModel';
import { TEAMS } from '@/data/teams';

interface TimingTowerProps {
  drivers: DriverRaceState[];
  playerDriverId: string;
  lap: number;
  totalLaps: number;
  safetyCarStatus: SafetyCarStatus;
}

function formatGap(gap: number, position: number): string {
  if (position === 1) return 'LEADER';
  if (gap > 90) return '+1 LAP';
  if (gap > 180) return '+2 LAPS';
  return `+${gap.toFixed(3)}`;
}

function formatInterval(gap: number): string {
  if (gap > 90) return '+1 LAP';
  return `${gap.toFixed(3)}`;
}

function formatLapTime(s: number): string {
  if (s <= 0 || s > 500) return '---';
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(3);
  return `${m}:${sec.padStart(6, '0')}`;
}

export default function TimingTower({
  drivers,
  playerDriverId,
  lap,
  totalLaps,
  safetyCarStatus,
}: TimingTowerProps) {
  const visible = drivers.filter(d => !d.dnf).slice(0, 20);
  const dnf = drivers.filter(d => d.dnf);

  const scColor =
    safetyCarStatus === 'sc'
      ? '#FF4400'
      : safetyCarStatus === 'vsc'
      ? '#FF8800'
      : safetyCarStatus === 'red_flag'
      ? '#FF0000'
      : null;

  return (
    <div className="f1-panel flex flex-col" style={{ minWidth: 280 }}>
      {/* Header */}
      <div className="f1-panel-header flex items-center justify-between">
        <span>Timing Tower</span>
        <div className="flex items-center gap-2">
          {scColor && (
            <span
              className="px-2 py-0.5 text-xs font-black rounded blink-red"
              style={{ background: scColor, color: 'white' }}
            >
              {safetyCarStatus === 'sc'
                ? 'SC'
                : safetyCarStatus === 'vsc'
                ? 'VSC'
                : 'RED FLAG'}
            </span>
          )}
          <span className="text-f1-muted text-xs">
            LAP {lap}/{totalLaps}
          </span>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid text-f1-muted text-xs px-2 py-1 border-b border-f1-border"
           style={{ gridTemplateColumns: '24px 40px 1fr 60px 50px 28px' }}>
        <span>POS</span>
        <span>DRV</span>
        <span>GAP</span>
        <span className="text-right">LAST LAP</span>
        <span className="text-right">TIRE</span>
        <span className="text-center">S</span>
      </div>

      {/* Driver rows */}
      <div className="overflow-y-auto" style={{ maxHeight: 480 }}>
        {visible.map((ds) => {
          const isPlayer = ds.driver.id === playerDriverId;
          const team = TEAMS.find(t => t.id === ds.driver.teamId);
          const tireColor = getCompoundColor(ds.tire.compound);
          const wearColor = getTireStatusColor(ds.tire);

          return (
            <div
              key={ds.driver.id}
              className={`timing-row grid items-center px-2 py-1 text-xs border-b border-f1-border/30 ${
                isPlayer ? 'player-row' : ''
              }`}
              style={{ gridTemplateColumns: '24px 40px 1fr 60px 50px 28px' }}
            >
              {/* Position */}
              <span
                className={`font-black ${
                  ds.position <= 3
                    ? ds.position === 1
                      ? 'text-yellow-400'
                      : ds.position === 2
                      ? 'text-gray-300'
                      : 'text-orange-400'
                    : isPlayer
                    ? 'text-f1-red'
                    : 'text-f1-muted'
                }`}
              >
                {ds.position}
              </span>

              {/* Driver code + team color bar */}
              <div className="flex items-center gap-1">
                <div
                  className="w-1 h-4 rounded-sm"
                  style={{ background: team?.color ?? '#666' }}
                />
                <span
                  className={`font-bold ${isPlayer ? 'text-f1-red' : 'text-f1-text'}`}
                >
                  {ds.driver.shortName}
                </span>
              </div>

              {/* Gap / interval */}
              <div className="flex flex-col leading-none">
                <span className="text-f1-muted text-xs">
                  {formatGap(ds.gapToLeader, ds.position)}
                </span>
                {ds.position > 1 && (
                  <span className="text-f1-border text-xs">
                    +{formatInterval(ds.gapToAhead)}
                  </span>
                )}
              </div>

              {/* Last lap time */}
              <span className="text-right font-mono text-xs tabular-nums text-f1-text">
                {formatLapTime(ds.lapTime)}
              </span>

              {/* Tire indicator */}
              <div className="flex items-center justify-end gap-1">
                <span
                  className="tire-dot text-white"
                  style={{
                    background: tireColor,
                    borderColor: tireColor,
                    fontSize: 9,
                    width: 18,
                    height: 18,
                  }}
                >
                  {getCompoundLetter(ds.tire.compound)}
                </span>
                <span className="text-xs font-mono" style={{ color: wearColor }}>
                  {Math.round(ds.tire.wear)}
                </span>
              </div>

              {/* Pit stops */}
              <span className="text-center text-f1-muted text-xs">{ds.totalPitStops}</span>
            </div>
          );
        })}

        {/* DNF section */}
        {dnf.length > 0 && (
          <>
            <div className="px-2 py-1 text-xs text-f1-muted bg-f1-border/20 border-b border-f1-border">
              RETIREMENTS
            </div>
            {dnf.map(ds => (
              <div
                key={ds.driver.id}
                className="timing-row grid items-center px-2 py-1 text-xs border-b border-f1-border/20 opacity-50"
                style={{ gridTemplateColumns: '24px 40px 1fr 60px 50px 28px' }}
              >
                <span className="text-red-500 font-bold">DNF</span>
                <div className="flex items-center gap-1">
                  <div
                    className="w-1 h-4 rounded-sm"
                    style={{ background: TEAMS.find(t => t.id === ds.driver.teamId)?.color ?? '#666' }}
                  />
                  <span className="text-f1-muted">{ds.driver.shortName}</span>
                </div>
                <span className="text-red-400 text-xs col-span-4">{ds.dnfReason}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
