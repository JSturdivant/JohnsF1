// ============================================================
// Race Simulation Engine
// ============================================================
import {
  RaceState,
  DriverRaceState,
  Driver,
  Team,
  TrackProfile,
  TireState,
  TireCompound,
  PaceMode,
  WeatherCondition,
  SafetyCarStatus,
  RaceEvent,
  StrategyPlan,
  StrategyPlanId,
  CarSetup,
  SetupEffects,
  LapData,
  PlayerAction,
  UnderOvercutAnalysis,
} from '@/types';
import { DRIVERS } from '@/data/drivers';
import { TEAMS, getTeam } from '@/data/teams';
import {
  createTireState,
  applyLapDegradation,
  getTirePaceDelta,
  estimateRemainingLaps,
  getCompoundColor,
} from './tireModel';
import { createWeatherState, advanceWeather, WeatherState } from './weatherSystem';
import { aiDecidePit, aiDecidePaceMode } from './strategyAI';
import { analyzeUnderOvercut, generateUndercutMessage } from './underOvercut';

// ─── Constants ────────────────────────────────────────────────
const FUEL_EFFECT_PER_KG = 0.033; // s/kg
const FULL_FUEL_LOAD = 110;       // kg
const BASE_VARIANCE = 0.15;       // ±0.15s random lap-time variance
const SC_LAP_TIME_INCREASE = 30;  // seconds under SC
const VSC_LAP_TIME_INCREASE = 15; // seconds under VSC

// ─── Initialization ──────────────────────────────────────────

export function calculateSetupEffects(setup: CarSetup): SetupEffects {
  let paceModifier = 0;
  let degradationModifier = 1.0;
  let topSpeedModifier = 0;
  let underwaterOvertake = 0;
  let wetPaceModifier = 0;

  // Downforce
  switch (setup.downforce) {
    case 'low':
      paceModifier += 0.3;      // slightly faster on straights in aggregate
      topSpeedModifier = 0.8;
      underwaterOvertake = -0.1;
      degradationModifier += 0.05;
      break;
    case 'high':
      paceModifier -= 0.2;      // better cornering pace
      topSpeedModifier = -0.5;
      underwaterOvertake = 0.1;
      degradationModifier -= 0.05;
      break;
    default:
      break;
  }

  // Tire preservation bias
  degradationModifier -= (setup.tirePreservationBias - 0.5) * 0.2;
  paceModifier += (setup.tirePreservationBias - 0.5) * 0.3; // more preservation = slightly slower

  // Balance
  switch (setup.balanceBias) {
    case 'top_speed':
      topSpeedModifier += 0.5;
      paceModifier += 0.2;
      break;
    case 'cornering':
      topSpeedModifier -= 0.4;
      paceModifier -= 0.15;
      underwaterOvertake += 0.05;
      break;
    default:
      break;
  }

  // Wet weather bias
  if (setup.wetWeatherBias) {
    wetPaceModifier = -1.5;
    paceModifier += 0.5; // slight dry pace sacrifice
  }

  // Fuel
  switch (setup.fuelLoad) {
    case 'light': paceModifier -= 0.4; break;
    case 'heavy': paceModifier += 0.5; break;
    default:      break;
  }

  return {
    paceModifier,
    degradationModifier: Math.max(0.7, Math.min(1.3, degradationModifier)),
    topSpeedModifier,
    underwaterOvertake,
    wetPaceModifier,
  };
}

export function buildInitialRaceState(
  track: TrackProfile,
  playerDriverId: string,
  plans: Record<StrategyPlanId, StrategyPlan>,
  activePlan: StrategyPlanId,
  setup: CarSetup
): RaceState {
  const setupEffects = calculateSetupEffects(setup);
  const weatherState = createWeatherState();

  // Sort drivers for starting grid (based on skill + random qualifying result)
  const gridOrder = buildStartingGrid(playerDriverId);

  const drivers: DriverRaceState[] = gridOrder.map((driver, idx) => {
    // Assign starting tire from player plan (player) or random AI choice
    let startingCompound: TireCompound;
    if (driver.id === playerDriverId) {
      startingCompound = plans[activePlan].stints[0]?.compound ?? 'MEDIUM';
    } else {
      startingCompound = aiChooseStartingTire(idx, track);
    }

    return {
      driver,
      position: idx + 1,
      lapTime: track.baselapTime,
      gapToLeader: 0,
      gapToAhead: 0,
      intervalBehind: 0,
      tire: createTireState(startingCompound),
      pitted: false,
      totalPitStops: 0,
      pitLaps: [],
      currentPaceMode: 'normal',
      totalRaceTime: 0,
      stintLap: 0,
      dnf: false,
      isInPits: false,
      lastPitLap: 0,
      stintHistory: [{ compound: startingCompound, laps: 0, startLap: 1 }],
      undercutThreat: false,
      overcutOpportunity: false,
    };
  });

  return {
    track,
    currentLap: 0,
    totalLaps: track.totalLaps,
    weather: 'dry',
    safetyCarStatus: 'none',
    safetyCarLap: 0,
    safetyCarDuration: 0,
    redFlagLap: 0,
    drivers,
    playerDriverId,
    events: [
      {
        lap: 0,
        type: 'info',
        message: `RACE CONTROL: Lights out in 5 seconds — ${track.name} BEGINS!`,
        severity: 'info',
      },
    ],
    activePlan,
    plans,
    setup,
    setupEffects,
    raceStatus: 'racing',
    remainingLaps: track.totalLaps,
    lapHistory: [],
    lapsUnderSC: 0,
    pendingPlayerAction: null,
    pendingCompoundChange: null,
    autoAdvance: false,
    advanceSpeed: 1200,
  };
}

// ─── Starting Grid ─────────────────────────────────────────

function buildStartingGrid(playerDriverId: string): Driver[] {
  const allDrivers = [...DRIVERS];
  // Qualify: skill + random noise
  const qualified = allDrivers
    .map(d => ({ driver: d, qualiTime: (1 - d.skill) * 2.5 + Math.random() * 1.0 }))
    .sort((a, b) => a.qualiTime - b.qualiTime);

  return qualified.map(q => q.driver);
}

function aiChooseStartingTire(gridPosition: number, track: TrackProfile): TireCompound {
  // Front runners tend to start on Mediums; midfield softs for early pace
  if (gridPosition < 3) return Math.random() > 0.5 ? 'MEDIUM' : 'SOFT';
  if (gridPosition < 8) return Math.random() > 0.6 ? 'SOFT' : 'MEDIUM';
  if (gridPosition < 15) return Math.random() > 0.5 ? 'MEDIUM' : 'HARD';
  return Math.random() > 0.7 ? 'HARD' : 'MEDIUM';
}

// ─── Main Simulation Step ─────────────────────────────────────

export interface LapSimResult {
  newState: RaceState;
  events: RaceEvent[];
  undercutAnalysis: UnderOvercutAnalysis | null;
}

export function simulateLap(state: RaceState, weatherStateIn: WeatherState): LapSimResult {
  const lap = state.currentLap + 1;
  const events: RaceEvent[] = [];
  let newState = { ...state, currentLap: lap, remainingLaps: state.totalLaps - lap };

  // ── 1. Advance weather ────────────────────────────────────
  const { newState: newWeatherState, event: weatherEvent } = advanceWeather(weatherStateIn, lap, state.totalLaps);
  if (weatherEvent) {
    events.push(weatherEvent);
    newState.weather = newWeatherState.current;
  }
  const weather = newState.weather;

  // ── 2. Safety car / race incidents ───────────────────────
  const { status: scStatus, newEvents: scEvents, duration } = evaluateSafetyCar(
    state, lap, events
  );
  events.push(...scEvents);

  if (scStatus !== 'none') {
    newState.safetyCarStatus = scStatus;
    newState.safetyCarLap = lap;
    newState.safetyCarDuration = duration;
    newState.raceStatus = scStatus === 'sc' ? 'safety_car' : scStatus === 'vsc' ? 'vsc' : 'red_flag';
    newState.lapsUnderSC += 1;
  } else if (state.safetyCarStatus !== 'none') {
    // SC ending
    newState.safetyCarDuration = Math.max(0, state.safetyCarDuration - 1);
    if (newState.safetyCarDuration <= 0) {
      newState.safetyCarStatus = 'none';
      newState.raceStatus = 'racing';
      events.push({
        lap,
        type: 'safety_car',
        message: 'RACE CONTROL: Safety Car returning to pits — GREEN FLAG! Race resumes.',
        severity: 'warning',
      });
    }
  }

  // Red flag handling
  if (scStatus === 'red_flag') {
    newState.raceStatus = 'red_flag';
    // Compress the field
    newState.drivers = compressField([...state.drivers]);
  }

  // ── 3. Apply player action ────────────────────────────────
  let playerPitting = false;
  let playerNextCompound: TireCompound = state.drivers.find(
    d => d.driver.id === state.playerDriverId
  )!.tire.compound;
  const playerActionResult = applyPlayerAction(
    state.pendingPlayerAction,
    state.pendingCompoundChange,
    state.playerDriverId,
    newState
  );
  playerPitting = playerActionResult.pitting;
  playerNextCompound = playerActionResult.nextCompound;
  if (playerActionResult.event) events.push(playerActionResult.event);
  if (playerActionResult.newPaceMode) {
    newState = applyPaceModeToPlayer(newState, playerActionResult.newPaceMode);
  }

  // ── 4. Simulate each driver's lap ─────────────────────────
  const updatedDrivers: DriverRaceState[] = newState.drivers.map(ds => {
    const driver = ds.driver;
    const team = getTeam(driver.teamId);
    const isPlayer = driver.id === state.playerDriverId;

    if (ds.dnf) return ds;

    let newDs = { ...ds };

    // AI decides pace mode
    if (!isPlayer) {
      newDs.currentPaceMode = aiDecidePaceMode(ds, lap, state.totalLaps);
    }

    // Tire degradation
    const profile = state.track.compoundProfiles[ds.tire.compound];
    newDs.tire = applyLapDegradation(
      ds.tire,
      profile,
      state.track,
      newDs.currentPaceMode,
      weather,
      state.setup,
      driver.tireManagement
    );
    newDs.stintLap += 1;

    // Pit stop decision
    const shouldPit = isPlayer
      ? playerPitting
      : aiDecidePit(ds, state.track, weather, newState.safetyCarStatus, lap, state.totalLaps, team).shouldPit;

    const nextCompound = isPlayer
      ? playerNextCompound
      : aiDecidePit(ds, state.track, weather, newState.safetyCarStatus, lap, state.totalLaps, team).nextCompound;

    if (shouldPit && lap > 1) {
      const pitEvent = executePitStop(newDs, team, nextCompound, lap);
      newDs = pitEvent.newState;
      events.push(pitEvent.event);
    }

    // Lap time calculation
    const lapTime = calculateLapTime(newDs, state.track, weather, state.setupEffects, lap, state.totalLaps, newState.safetyCarStatus);
    newDs.lapTime = lapTime;
    newDs.totalRaceTime += lapTime;

    // Random DNF (very low probability)
    if (!isPlayer && Math.random() < 0.0015) {
      newDs.dnf = true;
      newDs.dnfReason = randomDNFReason();
      events.push({
        lap,
        type: 'incident',
        message: `INCIDENT: ${driver.shortName} retires from the race — ${newDs.dnfReason}`,
        severity: 'critical',
        driverId: driver.id,
      });
    }

    return newDs;
  });

  // ── 5. Sort by race time → positions ─────────────────────
  const sorted = sortDriversByPosition(updatedDrivers);
  const positioned = assignPositions(sorted);

  // ── 6. Calculate gaps ────────────────────────────────────
  const withGaps = calculateGaps(positioned);

  // ── 7. Undercut / Overcut analysis for player ────────────
  let undercutAnalysis: UnderOvercutAnalysis | null = null;
  const playerState = withGaps.find(d => d.driver.id === state.playerDriverId);
  if (playerState && playerState.position > 1 && !playerState.dnf) {
    const ahead = withGaps.find(d => d.position === playerState.position - 1);
    if (ahead) {
      undercutAnalysis = analyzeUnderOvercut(
        playerState, ahead, state.track, weather, lap, state.totalLaps
      );
      const ucMsg = generateUndercutMessage(undercutAnalysis, ahead.driver.shortName);
      if (ucMsg && lap % 3 === 0) { // throttle messages
        events.push({ lap, type: 'strategy', message: ucMsg, severity: 'info' });
      }
    }
  }

  // ── 8. Strategy plan auto-execution ──────────────────────
  const planEvents = checkPlanAutoExecution(
    state, withGaps, lap, weather, newState.safetyCarStatus
  );
  events.push(...planEvents);

  // ── 9. Build lap data snapshot ──────────────────────────
  const playerSnap = withGaps.find(d => d.driver.id === state.playerDriverId);
  const lapData: LapData = {
    lap,
    playerPosition: playerSnap?.position ?? 0,
    playerLapTime: playerSnap?.lapTime ?? 0,
    playerTireWear: playerSnap?.tire.wear ?? 0,
    playerTireAge: playerSnap?.tire.age ?? 0,
    weather,
    safetyCarStatus: newState.safetyCarStatus,
    events: events.filter(e => ['incident', 'weather', 'safety_car', 'strategy'].includes(e.type)),
  };

  // ── 10. Check race finish ─────────────────────────────────
  if (lap >= state.totalLaps) {
    newState.raceStatus = 'finished';
    events.push({
      lap,
      type: 'info',
      message: `RACE CONTROL: Chequered flag! ${withGaps[0].driver.name} wins the ${state.track.name}!`,
      severity: 'info',
    });
  }

  newState.drivers = withGaps;
  newState.events = [...state.events, ...events];
  newState.lapHistory = [...state.lapHistory, lapData];
  newState.pendingPlayerAction = null;
  newState.pendingCompoundChange = null;

  return { newState, events, undercutAnalysis };
}

// ─── Lap Time Calculation ────────────────────────────────────

function calculateLapTime(
  ds: DriverRaceState,
  track: TrackProfile,
  weather: WeatherCondition,
  setupEffects: SetupEffects,
  lap: number,
  totalLaps: number,
  safetyCarStatus: SafetyCarStatus
): number {
  const baseLapTime = track.baselapTime;
  const driver = ds.driver;
  const team = getTeam(driver.teamId);

  // Team car pace
  const carPaceBonus = (1 - team.carPace) * 3.0; // worse car = slower per lap

  // Driver skill
  const driverSkillBonus = (1 - driver.skill) * 2.0;

  // Tire compound + degradation delta
  const profile = track.compoundProfiles[ds.tire.compound];
  const tireDelta = getTirePaceDelta(ds.tire, profile, weather);

  // Fuel effect (lighter car as race progresses)
  const fuelRemaining = FULL_FUEL_LOAD * (1 - (lap - 1) / totalLaps);
  const fuelBonus = -(FULL_FUEL_LOAD - fuelRemaining) * FUEL_EFFECT_PER_KG;

  // Setup modifier
  const setupMod = ds.driver.id === ds.driver.id ? setupEffects.paceModifier : 0;
  const wetMod = (weather !== 'dry') ? setupEffects.wetPaceModifier : 0;

  // Safety car lap time
  let scPenalty = 0;
  if (safetyCarStatus === 'sc') scPenalty = SC_LAP_TIME_INCREASE;
  else if (safetyCarStatus === 'vsc') scPenalty = VSC_LAP_TIME_INCREASE;

  // Pace mode modifier
  const paceMod = getPaceModeTimeModifier(ds.currentPaceMode);

  // Random variance (driver consistency)
  const variance = (Math.random() - 0.5) * BASE_VARIANCE * 2 * (1 - driver.consistency * 0.5);

  const rawLapTime = baseLapTime
    + carPaceBonus
    + driverSkillBonus
    + tireDelta
    + fuelBonus
    + setupMod
    + wetMod
    + paceMod
    + scPenalty
    + variance;

  // Pit out lap is slower
  if (ds.stintLap <= 1) {
    return rawLapTime + 3.5; // slow out-lap
  }

  return Math.max(baseLapTime * 0.9, rawLapTime);
}

function getPaceModeTimeModifier(mode: PaceMode): number {
  switch (mode) {
    case 'push':     return -0.6;
    case 'normal':   return 0;
    case 'conserve': return 0.8;
    case 'cruise':   return 1.8;
  }
}

// ─── Pit Stop ────────────────────────────────────────────────

function executePitStop(
  ds: DriverRaceState,
  team: Team,
  nextCompound: TireCompound,
  lap: number
): { newState: DriverRaceState; event: RaceEvent } {
  const newDs = { ...ds };

  // Save stint history
  const lastStint = newDs.stintHistory[newDs.stintHistory.length - 1];
  if (lastStint) lastStint.laps = newDs.stintLap;

  // Pit stop time (added to race time)
  const pitVariance = (Math.random() - 0.5) * 0.6;
  const pitTime = team.pitstopSpeed + pitVariance + 20; // stationary + pit lane

  const newTire = createTireState(nextCompound);
  newDs.tire = newTire;
  newDs.stintLap = 0;
  newDs.totalPitStops += 1;
  newDs.lastPitLap = lap;
  newDs.pitLaps = [...ds.pitLaps, lap];
  newDs.totalRaceTime += pitTime;
  newDs.isInPits = false;
  newDs.stintHistory = [
    ...newDs.stintHistory,
    { compound: nextCompound, laps: 0, startLap: lap },
  ];

  const event: RaceEvent = {
    lap,
    type: 'pit',
    message: `PIT STOP: ${ds.driver.shortName} — ${ds.tire.compound} → ${nextCompound} (${pitTime.toFixed(1)}s)`,
    severity: 'info',
    driverId: ds.driver.id,
  };

  return { newState: newDs, event };
}

// ─── Safety Car ──────────────────────────────────────────────

function evaluateSafetyCar(
  state: RaceState,
  lap: number,
  currentEvents: RaceEvent[]
): { status: SafetyCarStatus; newEvents: RaceEvent[]; duration: number } {
  const events: RaceEvent[] = [];

  // Already under SC — continue or clear
  if (state.safetyCarStatus === 'sc' && state.safetyCarDuration > 1) {
    return { status: 'sc', newEvents: events, duration: state.safetyCarDuration - 1 };
  }
  if (state.safetyCarStatus === 'vsc' && state.safetyCarDuration > 1) {
    return { status: 'vsc', newEvents: events, duration: state.safetyCarDuration - 1 };
  }
  if (state.safetyCarStatus === 'red_flag') {
    return { status: 'none', newEvents: events, duration: 0 };
  }

  // Random incident generation
  const roll = Math.random();
  const scProb = state.track.safetyCarProbability / state.totalLaps;

  if (roll < scProb * 0.4 && lap > 3 && lap < state.totalLaps - 5) {
    // Safety Car
    const scDuration = 3 + Math.floor(Math.random() * 4);
    events.push({
      lap,
      type: 'safety_car',
      message: `RACE CONTROL: SAFETY CAR DEPLOYED — Incident on track. ${scDuration} lap deployment expected.`,
      severity: 'critical',
    });
    return { status: 'sc', newEvents: events, duration: scDuration };
  } else if (roll < scProb * 0.7 && lap > 2) {
    // VSC
    const vscDuration = 2 + Math.floor(Math.random() * 3);
    events.push({
      lap,
      type: 'vsc',
      message: `RACE CONTROL: VIRTUAL SAFETY CAR — Car stopped on circuit. Maintain delta.`,
      severity: 'warning',
    });
    return { status: 'vsc', newEvents: events, duration: vscDuration };
  } else if (roll < scProb * 0.10 && lap > 5 && lap < 40) {
    // Red Flag — very rare
    events.push({
      lap,
      type: 'red_flag',
      message: `RACE CONTROL: RED FLAG! Race suspended. Drivers return to pit lane.`,
      severity: 'critical',
    });
    return { status: 'red_flag', newEvents: events, duration: 0 };
  }

  return { status: 'none', newEvents: events, duration: 0 };
}

// ─── Position Sorting ─────────────────────────────────────────

function sortDriversByPosition(drivers: DriverRaceState[]): DriverRaceState[] {
  return [...drivers].sort((a, b) => {
    if (a.dnf && !b.dnf) return 1;
    if (!a.dnf && b.dnf) return -1;
    return a.totalRaceTime - b.totalRaceTime;
  });
}

function assignPositions(drivers: DriverRaceState[]): DriverRaceState[] {
  return drivers.map((d, i) => ({ ...d, position: i + 1 }));
}

function calculateGaps(drivers: DriverRaceState[]): DriverRaceState[] {
  if (drivers.length === 0) return drivers;
  const leader = drivers[0];
  return drivers.map((d, i) => {
    const gapToLeader = d.totalRaceTime - leader.totalRaceTime;
    const gapToAhead = i > 0 ? d.totalRaceTime - drivers[i - 1].totalRaceTime : 0;
    const intervalBehind = i < drivers.length - 1 ? drivers[i + 1].totalRaceTime - d.totalRaceTime : 999;
    return { ...d, gapToLeader, gapToAhead, intervalBehind };
  });
}

function compressField(drivers: DriverRaceState[]): DriverRaceState[] {
  // Under red flag, compress gaps (bunched up)
  return drivers.map((d, i) => ({
    ...d,
    gapToLeader: i * 0.5,
    gapToAhead: i > 0 ? 0.5 : 0,
  }));
}

// ─── Player Action Handling ──────────────────────────────────

function applyPlayerAction(
  action: PlayerAction | null,
  pendingCompound: TireCompound | null,
  playerDriverId: string,
  state: RaceState
): {
  pitting: boolean;
  nextCompound: TireCompound;
  event: RaceEvent | null;
  newPaceMode?: PaceMode;
} {
  const player = state.drivers.find(d => d.driver.id === playerDriverId);
  const currentCompound = player?.tire.compound ?? 'MEDIUM';

  if (!action) {
    return { pitting: false, nextCompound: currentCompound, event: null };
  }

  switch (action) {
    case 'pit_now':
    case 'attempt_undercut':
    case 'cover_undercut': {
      const next = pendingCompound ?? getDefaultNextCompound(currentCompound, state.weather);
      return {
        pitting: true,
        nextCompound: next,
        event: {
          lap: state.currentLap + 1,
          type: 'strategy',
          message: action === 'attempt_undercut'
            ? `STRATEGY: Executing UNDERCUT — pitting for ${next} compound.`
            : action === 'cover_undercut'
            ? `STRATEGY: Covering rival undercut — pitting now for ${next}.`
            : `STRATEGY: Box this lap — fitting ${next} compound.`,
          severity: 'info',
        },
      };
    }
    case 'push':
      return {
        pitting: false,
        nextCompound: currentCompound,
        event: { lap: state.currentLap + 1, type: 'strategy', message: 'ENGINEER: Pushing hard — maximum attack mode.', severity: 'info' },
        newPaceMode: 'push',
      };
    case 'conserve':
      return {
        pitting: false,
        nextCompound: currentCompound,
        event: { lap: state.currentLap + 1, type: 'strategy', message: 'ENGINEER: Managing tires — conserve mode active.', severity: 'info' },
        newPaceMode: 'conserve',
      };
    case 'defend':
      return {
        pitting: false,
        nextCompound: currentCompound,
        event: { lap: state.currentLap + 1, type: 'strategy', message: 'ENGINEER: Defensive mode — protecting position.', severity: 'info' },
        newPaceMode: 'normal',
      };
    case 'attack':
      return {
        pitting: false,
        nextCompound: currentCompound,
        event: { lap: state.currentLap + 1, type: 'strategy', message: 'ENGINEER: Attack mode — hunting down the car ahead!', severity: 'info' },
        newPaceMode: 'push',
      };
    case 'stay_out':
    case 'commit_overcut':
      return {
        pitting: false,
        nextCompound: currentCompound,
        event: {
          lap: state.currentLap + 1,
          type: 'strategy',
          message: action === 'commit_overcut'
            ? 'STRATEGY: Committing to OVERCUT — staying out to build gap.'
            : 'ENGINEER: Staying out — extending stint.',
          severity: 'info',
        },
      };
    case 'react_safety_car':
      return {
        pitting: true,
        nextCompound: pendingCompound ?? getDefaultNextCompound(currentCompound, state.weather),
        event: {
          lap: state.currentLap + 1,
          type: 'strategy',
          message: 'STRATEGY: Reacting to Safety Car — boxing for free stop!',
          severity: 'warning',
        },
      };
    case 'react_rain':
      return {
        pitting: true,
        nextCompound: state.weather === 'very_wet' ? 'WET' : 'INTER',
        event: {
          lap: state.currentLap + 1,
          type: 'strategy',
          message: `STRATEGY: Reacting to rain — switching to ${state.weather === 'very_wet' ? 'WET' : 'INTER'} compound!`,
          severity: 'critical',
        },
      };
    default:
      return { pitting: false, nextCompound: currentCompound, event: null };
  }
}

function applyPaceModeToPlayer(state: RaceState, mode: PaceMode): RaceState {
  return {
    ...state,
    drivers: state.drivers.map(d =>
      d.driver.id === state.playerDriverId
        ? { ...d, currentPaceMode: mode }
        : d
    ),
  };
}

function getDefaultNextCompound(current: TireCompound, weather: WeatherCondition): TireCompound {
  if (weather === 'wet' || weather === 'very_wet') return 'WET';
  if (weather === 'damp') return 'INTER';
  if (current === 'SOFT') return 'MEDIUM';
  if (current === 'MEDIUM') return 'HARD';
  return 'MEDIUM';
}

// ─── Plan Auto-Execution ──────────────────────────────────────

function checkPlanAutoExecution(
  state: RaceState,
  drivers: DriverRaceState[],
  lap: number,
  weather: WeatherCondition,
  safetyCarStatus: SafetyCarStatus
): RaceEvent[] {
  const events: RaceEvent[] = [];
  const plan = state.plans[state.activePlan];
  const player = drivers.find(d => d.driver.id === state.playerDriverId);
  if (!player || !plan) return events;

  // Check each stint's pit window
  let cumulativeLaps = 0;
  for (let i = 0; i < plan.stints.length - 1; i++) {
    const stint = plan.stints[i];
    cumulativeLaps += stint.targetLaps;
    const [windowOpen, windowClose] = stint.pitWindow;

    if (lap === windowOpen) {
      events.push({
        lap,
        type: 'strategy',
        message: `PLAN ${state.activePlan}: Pit window OPEN for stop ${i + 1}. Target lap: ${cumulativeLaps} (window: ${windowOpen}–${windowClose}).`,
        severity: 'info',
      });
    }
    if (lap === Math.round((windowOpen + windowClose) / 2)) {
      events.push({
        lap,
        type: 'strategy',
        message: `PLAN ${state.activePlan}: Optimal pit lap approaching. Next compound: ${plan.stints[i + 1]?.compound ?? '?'}.`,
        severity: 'info',
      });
    }
  }

  // Safety car response from plan
  if (safetyCarStatus === 'sc' && plan.safetyCarResponse !== 'stay') {
    if (player.totalRaceTime > 0 && lap > 5) {
      events.push({
        lap,
        type: 'strategy',
        message: `PLAN ${state.activePlan}: Safety car! Plan says "${plan.safetyCarResponse.toUpperCase()}" — assess your options.`,
        severity: 'warning',
      });
    }
  }

  return events;
}

// ─── Helpers ─────────────────────────────────────────────────

function randomDNFReason(): string {
  const reasons = [
    'Power unit failure',
    'Hydraulic failure',
    'Gearbox issue',
    'Suspension damage',
    'Contact with barrier',
    'Brake failure',
    'Oil leak',
    'Cooling system failure',
  ];
  return reasons[Math.floor(Math.random() * reasons.length)];
}

export function formatLapTime(seconds: number): string {
  if (seconds > 500) return 'DNF';
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return `${mins}:${secs.padStart(6, '0')}`;
}

export function formatGap(gap: number): string {
  if (gap <= 0) return 'LEADER';
  if (gap > 120) return '+1 LAP';
  return `+${gap.toFixed(3)}`;
}
