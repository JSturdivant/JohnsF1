'use client';
import React, { useState, useCallback } from 'react';
import {
  GameScreen,
  TrackProfile,
  Driver,
  CarSetup,
  StrategyPlan,
  StrategyPlanId,
  RaceState,
} from '@/types';
import { DRIVERS } from '@/data/drivers';
import { DEFAULT_TRACK, TRACKS } from '@/data/tracks';
import { buildInitialRaceState } from '@/simulation/engine';
import { createWeatherState, WeatherState } from '@/simulation/weatherSystem';

import TrackBriefing from '@/components/screens/TrackBriefing';
import StrategyPlanning, { DEFAULT_PLANS } from '@/components/screens/StrategyPlanning';
import SetupScreen from '@/components/screens/SetupScreen';
import RaceControl from '@/components/screens/RaceControl';
import RaceResults from '@/components/screens/RaceResults';

const DEFAULT_SETUP: CarSetup = {
  downforce: 'medium',
  tirePreservationBias: 0.5,
  balanceBias: 'balanced',
  wetWeatherBias: false,
  fuelLoad: 'standard',
};

// Default starting driver — Hamilton for accessibility
const DEFAULT_DRIVER_ID = 'hamilton';

export default function Home() {
  const [screen, setScreen] = useState<GameScreen>('track_briefing');
  const [selectedTrack, setSelectedTrack] = useState<TrackProfile>(DEFAULT_TRACK);
  const [selectedDriver, setSelectedDriver] = useState<Driver>(
    DRIVERS.find(d => d.id === DEFAULT_DRIVER_ID) ?? DRIVERS[0]
  );
  const [plans, setPlans] = useState<Record<StrategyPlanId, StrategyPlan>>(
    buildDefaultPlans(DEFAULT_TRACK)
  );
  const [activePlan, setActivePlan] = useState<StrategyPlanId>('A');
  const [setup, setSetup] = useState<CarSetup>(DEFAULT_SETUP);
  const [raceState, setRaceState] = useState<RaceState | null>(null);
  const [weatherState, setWeatherState] = useState<WeatherState>(createWeatherState());

  // Rebuild default plans when track changes
  const handleTrackChange = (track: TrackProfile) => {
    setSelectedTrack(track);
    setPlans(buildDefaultPlans(track));
  };

  const handleDriverChange = (driver: Driver) => {
    const driverWithPlayerFlag = { ...driver, isPlayer: true };
    setSelectedDriver(driverWithPlayerFlag);
  };

  const handleStartRace = useCallback(() => {
    // Mark selected driver as player, unmark others
    const driversWithPlayer = DRIVERS.map(d => ({
      ...d,
      isPlayer: d.id === selectedDriver.id,
    }));

    const initialState = buildInitialRaceState(
      selectedTrack,
      selectedDriver.id,
      plans,
      activePlan,
      setup
    );

    setRaceState(initialState);
    setWeatherState(createWeatherState());
    setScreen('racing');
  }, [selectedTrack, selectedDriver, plans, activePlan, setup]);

  const handleRaceFinish = (finalState: RaceState) => {
    setRaceState(finalState);
    setScreen('results');
  };

  const handleRestart = () => {
    setScreen('track_briefing');
    setSelectedTrack(DEFAULT_TRACK);
    setSelectedDriver(DRIVERS.find(d => d.id === DEFAULT_DRIVER_ID) ?? DRIVERS[0]);
    setPlans(buildDefaultPlans(DEFAULT_TRACK));
    setActivePlan('A');
    setSetup(DEFAULT_SETUP);
    setRaceState(null);
    setWeatherState(createWeatherState());
  };

  return (
    <>
      {screen === 'track_briefing' && (
        <TrackBriefing
          selectedTrack={selectedTrack}
          selectedDriver={selectedDriver}
          onTrackChange={handleTrackChange}
          onDriverChange={handleDriverChange}
          onNext={() => setScreen('strategy_planning')}
          allDrivers={DRIVERS}
        />
      )}

      {screen === 'strategy_planning' && (
        <StrategyPlanning
          track={selectedTrack}
          plans={plans}
          activePlan={activePlan}
          onPlansChange={setPlans}
          onActivePlanChange={setActivePlan}
          onNext={() => setScreen('car_setup')}
          onBack={() => setScreen('track_briefing')}
        />
      )}

      {screen === 'car_setup' && (
        <SetupScreen
          setup={setup}
          track={selectedTrack}
          onChange={setSetup}
          onNext={handleStartRace}
          onBack={() => setScreen('strategy_planning')}
        />
      )}

      {screen === 'racing' && raceState && (
        <RaceControl
          initialRaceState={raceState}
          initialWeatherState={weatherState}
          onRaceFinish={handleRaceFinish}
        />
      )}

      {screen === 'results' && raceState && (
        <RaceResults
          raceState={raceState}
          onRestart={handleRestart}
        />
      )}
    </>
  );
}

/** Build sensible default plans for a given track */
function buildDefaultPlans(track: TrackProfile): Record<StrategyPlanId, StrategyPlan> {
  const suggested = track.suggestedStrategies;

  // Use Pirelli suggestions if available, else fallback
  const planA: StrategyPlan = {
    id: 'A',
    name: `Plan A — ${suggested[0]?.name ?? 'Conservative Two-Stop'}`,
    stints: buildStintsFromSuggestion(suggested[0], track),
    safetyCarResponse: 'pit',
    rainResponse: 'pit_inters',
    undercutIntent: false,
    overcutIntent: false,
    notes: suggested[0]?.notes ?? 'Conservative safe strategy.',
  };

  const planB: StrategyPlan = suggested[1]
    ? {
        id: 'B',
        name: `Plan B — ${suggested[1].name}`,
        stints: buildStintsFromSuggestion(suggested[1], track),
        safetyCarResponse: 'pit',
        rainResponse: 'pit_inters',
        undercutIntent: true,
        overcutIntent: false,
        notes: suggested[1].notes,
      }
    : {
        id: 'B',
        name: 'Plan B — Aggressive Undercut',
        stints: [
          { compound: 'SOFT', targetLaps: Math.floor(track.totalLaps * 0.23), pitWindow: [Math.floor(track.totalLaps * 0.18), Math.floor(track.totalLaps * 0.28)], pushMode: 'push' },
          { compound: 'MEDIUM', targetLaps: Math.floor(track.totalLaps * 0.38), pitWindow: [Math.floor(track.totalLaps * 0.55), Math.floor(track.totalLaps * 0.68)], pushMode: 'normal' },
          { compound: 'HARD', targetLaps: track.totalLaps - Math.floor(track.totalLaps * 0.61), pitWindow: [track.totalLaps - 5, track.totalLaps], pushMode: 'conserve' },
        ],
        safetyCarResponse: 'pit',
        rainResponse: 'pit_inters',
        undercutIntent: true,
        overcutIntent: false,
        notes: 'Soft start for early positions. Undercut window.',
      };

  const planC: StrategyPlan = {
    id: 'C',
    name: 'Plan C — Safety Car Gamble',
    stints: [
      { compound: 'HARD', targetLaps: Math.floor(track.totalLaps * 0.58), pitWindow: [Math.floor(track.totalLaps * 0.35), Math.floor(track.totalLaps * 0.7)], pushMode: 'conserve' },
      { compound: 'MEDIUM', targetLaps: track.totalLaps - Math.floor(track.totalLaps * 0.58), pitWindow: [track.totalLaps - 5, track.totalLaps], pushMode: 'push' },
    ],
    safetyCarResponse: 'pit',
    rainResponse: 'pit_wets',
    undercutIntent: false,
    overcutIntent: true,
    notes: 'One-stop gamble. Needs SC for free stop window.',
  };

  return { A: planA, B: planB, C: planC };
}

function buildStintsFromSuggestion(
  suggestion: TrackProfile['suggestedStrategies'][0] | undefined,
  track: TrackProfile
): StrategyPlan['stints'] {
  if (!suggestion) {
    return [
      { compound: 'MEDIUM', targetLaps: Math.floor(track.totalLaps / 2), pitWindow: [Math.floor(track.totalLaps * 0.25), Math.floor(track.totalLaps * 0.4)], pushMode: 'normal' },
      { compound: 'HARD', targetLaps: track.totalLaps - Math.floor(track.totalLaps / 2), pitWindow: [track.totalLaps - 5, track.totalLaps], pushMode: 'conserve' },
    ];
  }

  let cumLaps = 0;
  return suggestion.stints.map((s, i) => {
    const isLast = i === suggestion.stints.length - 1;
    const open = cumLaps + Math.max(3, s.laps - 5);
    const close = cumLaps + s.laps + 4;
    cumLaps += s.laps;
    return {
      compound: s.compound,
      targetLaps: s.laps,
      pitWindow: [Math.min(open, track.totalLaps - 3), Math.min(close, track.totalLaps)],
      pushMode: isLast ? 'conserve' : i === 0 ? 'normal' : 'normal',
    } as StrategyPlan['stints'][0];
  });
}
