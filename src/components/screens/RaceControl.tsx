'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  RaceState,
  PlayerAction,
  TireCompound,
  StrategyPlanId,
  WeatherCondition,
} from '@/types';
import { WeatherState, advanceWeather } from '@/simulation/weatherSystem';
import { simulateLap } from '@/simulation/engine';
import { UnderOvercutAnalysis } from '@/types';

import TimingTower from '../race/TimingTower';
import DriverCard from '../race/DriverCard';
import StrategyPanel from '../race/StrategyPanel';
import EventLog from '../race/EventLog';
import WeatherPanel from '../race/WeatherPanel';
import ActionButtons from '../race/ActionButtons';
import DegradationPanel from '../race/DegradationPanel';

interface RaceControlProps {
  initialRaceState: RaceState;
  initialWeatherState: WeatherState;
  onRaceFinish: (finalState: RaceState) => void;
}

const SPEED_OPTIONS = [
  { label: '1×', ms: 2000 },
  { label: '2×', ms: 1000 },
  { label: '4×', ms: 500 },
  { label: '8×', ms: 250 },
];

export default function RaceControl({
  initialRaceState,
  initialWeatherState,
  onRaceFinish,
}: RaceControlProps) {
  const [raceState, setRaceState] = useState<RaceState>(initialRaceState);
  const [weatherState, setWeatherState] = useState<WeatherState>(initialWeatherState);
  const [undercutAnalysis, setUndercutAnalysis] = useState<UnderOvercutAnalysis | null>(null);
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(0);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [activeTab, setActiveTab] = useState<'strategy' | 'degradation' | 'actions'>('actions');

  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const raceStateRef = useRef(raceState);
  const weatherStateRef = useRef(weatherState);

  raceStateRef.current = raceState;
  weatherStateRef.current = weatherState;

  const advanceLap = useCallback(() => {
    const current = raceStateRef.current;
    const weather = weatherStateRef.current;

    if (current.raceStatus === 'finished' || current.currentLap >= current.totalLaps) {
      setIsAutoAdvancing(false);
      onRaceFinish(current);
      return;
    }

    setIsAdvancing(true);
    const { newState, events, undercutAnalysis: uc } = simulateLap(current, weather);

    // Update weather state from simulation
    const { newState: newWeather } = advanceWeather(
      weather, current.currentLap + 1, current.totalLaps
    );

    setRaceState(newState);
    setWeatherState(newWeather);
    setUndercutAnalysis(uc);
    setIsAdvancing(false);

    if (newState.raceStatus === 'finished') {
      setIsAutoAdvancing(false);
      setTimeout(() => onRaceFinish(newState), 1200);
    }
  }, [onRaceFinish]);

  // Auto-advance loop
  useEffect(() => {
    if (isAutoAdvancing) {
      const ms = SPEED_OPTIONS[speedIndex].ms;
      autoRef.current = setInterval(() => {
        advanceLap();
      }, ms);
    }
    return () => {
      if (autoRef.current) clearInterval(autoRef.current);
    };
  }, [isAutoAdvancing, speedIndex, advanceLap]);

  const handleAction = (action: PlayerAction, compound?: TireCompound) => {
    setRaceState(prev => ({
      ...prev,
      pendingPlayerAction: action,
      pendingCompoundChange: compound ?? null,
    }));
    // Immediately stop auto-advance when player acts
    setIsAutoAdvancing(false);
  };

  const handleSwitchPlan = (id: StrategyPlanId) => {
    setRaceState(prev => ({
      ...prev,
      activePlan: id,
      events: [
        ...prev.events,
        {
          lap: prev.currentLap,
          type: 'strategy' as const,
          message: `ENGINEER: Switching to Plan ${id} — ${prev.plans[id].name}`,
          severity: 'info' as const,
        },
      ],
    }));
  };

  const playerState = raceState.drivers.find(d => d.driver.id === raceState.playerDriverId);
  const isFinished = raceState.raceStatus === 'finished' || raceState.currentLap >= raceState.totalLaps;

  if (!playerState) return null;

  const scColor =
    raceState.safetyCarStatus === 'sc'
      ? 'bg-orange-900/40 border-orange-500 text-orange-300'
      : raceState.safetyCarStatus === 'vsc'
      ? 'bg-yellow-900/40 border-yellow-500 text-yellow-300'
      : raceState.safetyCarStatus === 'red_flag'
      ? 'bg-red-900/60 border-red-400 text-red-200 blink-red'
      : null;

  const lastLapFormatted = (() => {
    const t = playerState.lapTime;
    if (t <= 0 || t >= 500) return '---';
    const m = Math.floor(t / 60);
    const sec = (t % 60).toFixed(3);
    return `${m}:${sec.padStart(6, '0')}`;
  })();

  return (
    <div className="h-screen bg-f1-dark flex flex-col overflow-hidden">
      {/* Top bar — always visible, outside the scroll container */}
      <div className="shrink-0 border-b border-f1-border bg-f1-panel px-3 py-2 flex flex-wrap items-center gap-x-3 gap-y-1 z-50">

        {/* Branding */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-f1-red font-black tracking-widest text-xs sm:text-sm">F1 PIT WALL</span>
          <span className="text-f1-border hidden sm:inline">|</span>
          <span className="text-xs font-bold text-white hidden sm:inline">{raceState.track.name}</span>
        </div>

        {/* Key metrics */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1">
            <span className="text-xs text-f1-muted">LAP</span>
            <span className="text-base font-black text-white tabular-nums leading-none">{raceState.currentLap}</span>
            <span className="text-xs text-f1-muted">/{raceState.totalLaps}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-f1-muted">{playerState.driver.shortName}</span>
            <span
              className="text-base font-black tabular-nums leading-none"
              style={{ color: playerState.position <= 3 ? '#FFD700' : '#fff' }}
            >
              P{playerState.position}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-f1-muted">LAST</span>
            <span className="text-xs font-black text-white tabular-nums font-mono">{lastLapFormatted}</span>
          </div>
        </div>

        {/* SC status */}
        {scColor && (
          <div className={`px-2 py-0.5 border rounded text-xs font-black shrink-0 ${scColor}`}>
            {raceState.safetyCarStatus === 'sc' ? '🚗 SC' : raceState.safetyCarStatus === 'vsc' ? '⚠ VSC' : '🚩 RED'}
          </div>
        )}

        {/* Pending action */}
        {raceState.pendingPlayerAction && (
          <div className="px-2 py-0.5 bg-f1-red/20 border border-f1-red/50 rounded text-xs text-f1-red font-bold hidden sm:block shrink-0">
            {raceState.pendingPlayerAction.replace(/_/g, ' ').toUpperCase()}
          </div>
        )}

        {/* Controls */}
        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-0.5">
            {SPEED_OPTIONS.map((opt, i) => (
              <button
                key={i}
                onClick={() => setSpeedIndex(i)}
                className={`px-1.5 py-0.5 text-xs rounded border transition-all ${
                  speedIndex === i
                    ? 'border-f1-red bg-f1-red/20 text-f1-red'
                    : 'border-f1-border text-f1-muted hover:border-f1-muted'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {!isAutoAdvancing && (
            <button
              onClick={advanceLap}
              disabled={isAdvancing || isFinished}
              className="px-2 sm:px-3 py-1 text-xs font-bold border border-green-600 text-green-400 rounded hover:bg-green-900/30 transition-all disabled:opacity-40"
            >
              {isAdvancing ? '...' : <><span>▶</span><span className="hidden sm:inline"> NEXT</span></>}
            </button>
          )}

          <button
            onClick={() => setIsAutoAdvancing(a => !a)}
            disabled={isFinished}
            className={`px-2 sm:px-3 py-1 text-xs font-bold border rounded transition-all ${
              isAutoAdvancing
                ? 'border-red-500 text-red-300 bg-red-900/30'
                : 'border-f1-border text-f1-muted hover:border-green-500 hover:text-green-300'
            }`}
          >
            {isAutoAdvancing ? '⏸' : '⏩'}
            <span className="hidden sm:inline">{isAutoAdvancing ? ' PAUSE' : ' AUTO'}</span>
          </button>
        </div>
      </div>

      {/* Main race grid — scrollable, single column on mobile, 3-column on lg+ */}
      <div
        className="flex-1 overflow-y-auto p-2 sm:p-3 grid grid-cols-1 gap-3 lg:grid-cols-[280px_minmax(0,1fr)_260px]"
      >
        {/* Timing Tower — last on mobile, left col rows 1-2 on desktop */}
        <div className="order-4 lg:order-none lg:row-span-2">
          <TimingTower
            drivers={raceState.drivers}
            playerDriverId={raceState.playerDriverId}
            lap={raceState.currentLap}
            totalLaps={raceState.totalLaps}
            safetyCarStatus={raceState.safetyCarStatus}
          />
        </div>

        {/* Driver card — second on mobile, center-top on desktop */}
        <div className="order-2 lg:order-none">
          <DriverCard
            playerState={playerState}
            raceState={raceState}
            undercutAnalysis={undercutAnalysis}
          />
        </div>

        {/* Tabbed panel — first on mobile, right col rows 1-2 on desktop */}
        <div className="order-1 lg:order-none lg:row-span-2 flex flex-col gap-3">
          <div className="flex gap-1">
            {(['actions', 'strategy', 'degradation'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1 text-xs font-bold border rounded transition-all ${
                  activeTab === tab
                    ? 'border-f1-red bg-f1-red/15 text-f1-red'
                    : 'border-f1-border text-f1-muted hover:border-f1-muted'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === 'actions' && (
            <ActionButtons
              raceState={raceState}
              undercutAnalysis={undercutAnalysis}
              onAction={handleAction}
              disabled={isAdvancing}
            />
          )}
          {activeTab === 'strategy' && (
            <StrategyPanel raceState={raceState} onSwitchPlan={handleSwitchPlan} />
          )}
          {activeTab === 'degradation' && (
            <DegradationPanel raceState={raceState} />
          )}
        </div>

        {/* Weather + Event log — third on mobile, center-bottom on desktop */}
        <div className="order-3 lg:order-none flex flex-col gap-3">
          <WeatherPanel
            weather={raceState.weather}
            weatherState={weatherState}
            safetyCarStatus={raceState.safetyCarStatus}
            safetyCarDuration={raceState.safetyCarDuration}
            lap={raceState.currentLap}
            totalLaps={raceState.totalLaps}
            lapsUnderSC={raceState.lapsUnderSC}
          />
          <EventLog events={raceState.events} maxEvents={120} />
        </div>
      </div>
    </div>
  );
}
