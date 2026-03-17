'use client';
import React from 'react';
import { TrackProfile, Driver, TireCompound } from '@/types';
import { getCompoundColor, getCompoundLetter } from '@/simulation/tireModel';
import { TRACKS } from '@/data/tracks';

interface TrackBriefingProps {
  selectedTrack: TrackProfile;
  selectedDriver: Driver;
  onTrackChange: (track: TrackProfile) => void;
  onDriverChange: (driver: Driver) => void;
  onNext: () => void;
  allDrivers: Driver[];
}

const COMPOUNDS: TireCompound[] = ['SOFT', 'MEDIUM', 'HARD'];

const DEG_BAR_COLORS = ['#ff4466', '#ff8833', '#ffdd00', '#88ee44', '#44ff99'];

function DegBar({ value, max = 5 }: { value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const color = pct > 75 ? '#ff4466' : pct > 50 ? '#ff8833' : pct > 30 ? '#ffdd00' : '#44ff99';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-f1-border rounded overflow-hidden">
        <div className="h-full rounded transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs text-f1-muted w-8 text-right">{value.toFixed(1)}</span>
    </div>
  );
}

function TireProfileCard({ compound, profile }: { compound: TireCompound; profile: TrackProfile['compoundProfiles'][TireCompound] }) {
  const color = getCompoundColor(compound);
  const letter = getCompoundLetter(compound);
  return (
    <div className="f1-panel p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2 mb-1">
        <span
          className="tire-dot text-white font-bold"
          style={{ background: color, borderColor: color }}
        >
          {letter}
        </span>
        <span className="font-bold text-sm" style={{ color }}>{compound}</span>
        <span className="ml-auto text-xs text-f1-muted">
          {profile.paceDelta < 0 ? `${profile.paceDelta.toFixed(1)}s` : `+${profile.paceDelta.toFixed(1)}s`} vs Med
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div className="text-f1-muted">Wear/lap</div>
        <DegBar value={profile.baseWearPerLap} max={5} />
        <div className="text-f1-muted">Thermal risk</div>
        <DegBar value={profile.thermalSensitivity} max={1} />
        <div className="text-f1-muted">Graining risk</div>
        <DegBar value={profile.grainingRisk} max={0.3} />
        <div className="text-f1-muted">Cliff at lap</div>
        <div className="text-f1-text font-bold">{profile.cliffLap}</div>
        <div className="text-f1-muted">Warmup laps</div>
        <div className="text-f1-text font-bold">{profile.warmupLaps}</div>
      </div>
    </div>
  );
}

export default function TrackBriefing({
  selectedTrack,
  selectedDriver,
  onTrackChange,
  onDriverChange,
  onNext,
  allDrivers,
}: TrackBriefingProps) {
  return (
    <div className="min-h-screen bg-f1-dark p-4 flex flex-col gap-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-f1-border pb-4">
        <div>
          <div className="text-xs text-f1-red font-bold tracking-widest uppercase mb-1">F1 Pit Wall</div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Race Strategy Simulator</h1>
        </div>
        <div className="text-right">
          <div className="text-xs text-f1-muted">Step 1 of 4</div>
          <div className="text-sm font-bold text-f1-text">Track & Tire Briefing</div>
        </div>
      </div>

      {/* Circuit Selector */}
      <div className="flex flex-wrap gap-2">
        {TRACKS.map(track => (
          <button
            key={track.id}
            onClick={() => onTrackChange(track)}
            className={`px-4 py-2 text-xs font-bold border rounded transition-all ${
              selectedTrack.id === track.id
                ? 'bg-f1-red border-f1-red text-white'
                : 'bg-f1-panel border-f1-border text-f1-muted hover:border-f1-red hover:text-white'
            }`}
          >
            {track.country}
          </button>
        ))}
      </div>

      {/* Driver Selector */}
      <div className="f1-panel">
        <div className="f1-panel-header">Select Your Driver</div>
        <div className="p-3 flex flex-wrap gap-2 max-h-40 overflow-y-auto">
          {allDrivers.map(d => (
            <button
              key={d.id}
              onClick={() => onDriverChange(d)}
              className={`px-3 py-1.5 text-xs font-bold border rounded transition-all ${
                selectedDriver.id === d.id
                  ? 'bg-f1-red border-f1-red text-white'
                  : 'bg-transparent border-f1-border text-f1-muted hover:border-f1-red hover:text-f1-text'
              }`}
            >
              <span className="font-mono">{d.shortName}</span>
              <span className="ml-2 text-xs opacity-70 font-normal">{d.number}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Circuit Info */}
        <div className="lg:col-span-1 flex flex-col gap-3">
          <div className="f1-panel">
            <div className="f1-panel-header">Circuit Profile</div>
            <div className="p-3 flex flex-col gap-2 text-xs">
              <div className="text-lg font-bold text-white leading-tight">{selectedTrack.name}</div>
              <div className="text-f1-muted">{selectedTrack.circuit}</div>
              <div className="text-f1-muted">{selectedTrack.country}</div>
              <div className="border-t border-f1-border pt-2 mt-1 grid grid-cols-2 gap-2">
                <div>
                  <div className="text-f1-muted">Laps</div>
                  <div className="font-bold text-white text-lg">{selectedTrack.totalLaps}</div>
                </div>
                <div>
                  <div className="text-f1-muted">Lap distance</div>
                  <div className="font-bold text-white text-lg">{selectedTrack.lapDistance} km</div>
                </div>
                <div>
                  <div className="text-f1-muted">Pit time loss</div>
                  <div className="font-bold text-f1-orange">{selectedTrack.pitLaneTimeLoss}s</div>
                </div>
                <div>
                  <div className="text-f1-muted">Base lap</div>
                  <div className="font-bold text-white">{formatLapTime(selectedTrack.baselapTime)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="f1-panel">
            <div className="f1-panel-header">Track Characteristics</div>
            <div className="p-3 grid grid-cols-2 gap-2 text-xs">
              <MetricRow label="Deg level" value={selectedTrack.degradationLevel.toUpperCase()} color={degLevelColor(selectedTrack.degradationLevel)} />
              <MetricRow label="Type" value={selectedTrack.limitationType.toUpperCase()} color="#a0a0ff" />
              <div className="col-span-2 mt-1">
                <div className="flex justify-between text-f1-muted mb-1">
                  <span>Overtaking difficulty</span>
                  <span>{Math.round(selectedTrack.overtakingDifficulty * 100)}%</span>
                </div>
                <DegBar value={selectedTrack.overtakingDifficulty} max={1} />
              </div>
              <div className="col-span-2">
                <div className="flex justify-between text-f1-muted mb-1">
                  <span>Undercut strength</span>
                  <span>{Math.round(selectedTrack.undercutStrength * 100)}%</span>
                </div>
                <DegBar value={selectedTrack.undercutStrength} max={1} />
              </div>
              <div className="col-span-2">
                <div className="flex justify-between text-f1-muted mb-1">
                  <span>Overcut strength</span>
                  <span>{Math.round(selectedTrack.overcutStrength * 100)}%</span>
                </div>
                <DegBar value={selectedTrack.overcutStrength} max={1} />
              </div>
            </div>
          </div>

          <div className="f1-panel">
            <div className="f1-panel-header">Circuit Notes</div>
            <p className="p-3 text-xs text-f1-muted leading-relaxed">{selectedTrack.description}</p>
          </div>
        </div>

        {/* Tire Profiles */}
        <div className="lg:col-span-1 flex flex-col gap-3">
          <div className="f1-panel-header f1-panel rounded-t-none"
               style={{ borderRadius: '4px 4px 0 0' }}>
            Pirelli Tire Profiles
          </div>
          {COMPOUNDS.map(c => (
            <TireProfileCard
              key={c}
              compound={c}
              profile={selectedTrack.compoundProfiles[c]}
            />
          ))}
        </div>

        {/* Suggested Strategies */}
        <div className="lg:col-span-1 flex flex-col gap-3">
          <div className="f1-panel">
            <div className="f1-panel-header">Pirelli Suggested Strategies</div>
            <div className="p-3 flex flex-col gap-3">
              {selectedTrack.suggestedStrategies.map((strategy, i) => (
                <div key={i} className="border border-f1-border rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-xs text-white">{strategy.name}</div>
                    <RiskBadge risk={strategy.risk} />
                  </div>
                  <div className="flex gap-1 mb-2 flex-wrap">
                    {strategy.stints.map((stint, j) => (
                      <div key={j} className="flex items-center gap-1">
                        <span
                          className="tire-dot text-white"
                          style={{
                            background: getCompoundColor(stint.compound),
                            borderColor: getCompoundColor(stint.compound),
                            fontSize: 10
                          }}
                        >
                          {getCompoundLetter(stint.compound)}
                        </span>
                        <span className="text-xs text-f1-muted">{stint.laps}L</span>
                        {j < strategy.stints.length - 1 && (
                          <span className="text-f1-muted text-xs">→</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-f1-muted leading-relaxed">{strategy.notes}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Selected driver stats */}
          <div className="f1-panel">
            <div className="f1-panel-header">Driver — {selectedDriver.shortName}</div>
            <div className="p-3 grid grid-cols-2 gap-2 text-xs">
              <div className="text-f1-muted">Name</div>
              <div className="text-white font-bold">{selectedDriver.name}</div>
              <div className="text-f1-muted">Number</div>
              <div className="text-white font-bold">#{selectedDriver.number}</div>
              <div className="col-span-2 mt-1 flex flex-col gap-1">
                <DriverStatBar label="Skill" value={selectedDriver.skill} />
                <DriverStatBar label="Tire mgmt" value={selectedDriver.tireManagement} />
                <DriverStatBar label="Racecraft" value={selectedDriver.racecraft} />
                <DriverStatBar label="Wet weather" value={selectedDriver.wetWeatherAbility} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Continue */}
      <div className="flex justify-end pt-2">
        <button
          onClick={onNext}
          className="px-8 py-3 bg-f1-red text-white font-bold text-sm tracking-widest uppercase rounded hover:bg-red-600 transition-colors"
        >
          Strategy Planning →
        </button>
      </div>
    </div>
  );
}

function MetricRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <>
      <div className="text-f1-muted">{label}</div>
      <div className="font-bold" style={{ color }}>{value}</div>
    </>
  );
}

function DriverStatBar({ label, value }: { label: string; value: number }) {
  const pct = value * 100;
  const color = pct > 90 ? '#00ff88' : pct > 75 ? '#88ee44' : pct > 60 ? '#ffdd00' : '#ff8833';
  return (
    <div className="flex items-center gap-2">
      <span className="text-f1-muted w-20 text-xs">{label}</span>
      <div className="flex-1 h-1.5 bg-f1-border rounded overflow-hidden">
        <div className="h-full rounded" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-bold" style={{ color }}>{Math.round(pct)}</span>
    </div>
  );
}

function RiskBadge({ risk }: { risk: 'low' | 'medium' | 'high' }) {
  const colors = {
    low: 'text-green-400 border-green-700 bg-green-950',
    medium: 'text-yellow-400 border-yellow-700 bg-yellow-950',
    high: 'text-red-400 border-red-800 bg-red-950',
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-bold border rounded ${colors[risk]}`}>
      {risk.toUpperCase()}
    </span>
  );
}

function degLevelColor(level: 'low' | 'medium' | 'high'): string {
  return level === 'high' ? '#ff4466' : level === 'medium' ? '#ff8833' : '#44ff99';
}

function formatLapTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return `${mins}:${secs.padStart(6, '0')}`;
}
