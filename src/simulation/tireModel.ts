// ============================================================
// Tire Degradation Model
// ============================================================
import {
  TireState,
  TireCompound,
  TireCompoundProfile,
  TrackProfile,
  PaceMode,
  WeatherCondition,
  CarSetup,
} from '@/types';

/** Initialize a fresh tire set */
export function createTireState(compound: TireCompound): TireState {
  return {
    compound,
    age: 0,
    wear: 0,
    graining: 0,
    overheating: 0,
    degradationRate: 1.0,
  };
}

/**
 * Calculate pace delta (seconds per lap) from tire state.
 * Positive = slower than reference MEDIUM.
 */
export function getTirePaceDelta(
  tire: TireState,
  profile: TireCompoundProfile,
  weather: WeatherCondition
): number {
  const baseDelta = profile.paceDelta;

  // Wear effect — gradual falloff
  const wearPenalty = (tire.wear / 100) * getMaxWearPenalty(tire.compound);

  // Warmup bonus — new tires are slightly off temp for 1-3 laps
  const warmupPenalty = tire.age < profile.warmupLaps
    ? (profile.warmupLaps - tire.age) * 0.5
    : 0;

  // Graining penalty
  const grainingPenalty = (tire.graining / 100) * 2.5;

  // Overheating penalty
  const overheatPenalty = (tire.overheating / 100) * 3.0;

  // Weather penalty — wrong compound for conditions
  const weatherPenalty = getWeatherPenalty(tire.compound, weather);

  return baseDelta + wearPenalty + warmupPenalty + grainingPenalty + overheatPenalty + weatherPenalty;
}

function getMaxWearPenalty(compound: TireCompound): number {
  switch (compound) {
    case 'SOFT':   return 4.0;
    case 'MEDIUM': return 3.0;
    case 'HARD':   return 2.5;
    case 'INTER':  return 4.0;
    case 'WET':    return 3.0;
  }
}

function getWeatherPenalty(compound: TireCompound, weather: WeatherCondition): number {
  // Slick tires in wet = huge penalty
  if ((compound === 'SOFT' || compound === 'MEDIUM' || compound === 'HARD')) {
    if (weather === 'wet') return 8.0;
    if (weather === 'very_wet') return 18.0;
    if (weather === 'damp') return 3.0;
  }
  // Rain tires in dry = big penalty
  if (compound === 'WET' && weather === 'dry') return 12.0;
  if (compound === 'WET' && weather === 'damp') return 3.0;
  if (compound === 'INTER' && weather === 'dry') return 5.0;
  if (compound === 'INTER' && weather === 'very_wet') return 4.0;
  return 0;
}

/**
 * Apply one lap of degradation to a tire state.
 * Returns updated TireState.
 */
export function applyLapDegradation(
  tire: TireState,
  profile: TireCompoundProfile,
  track: TrackProfile,
  paceMode: PaceMode,
  weather: WeatherCondition,
  setup: CarSetup,
  driverTireManagement: number
): TireState {
  const newTire = { ...tire };
  newTire.age += 1;

  // Base wear this lap
  let wearThisLap = profile.baseWearPerLap;

  // Cliff effect — degradation accelerates after cliff lap
  if (tire.age >= profile.cliffLap) {
    wearThisLap *= profile.cliffMultiplier;
  }

  // Pace mode effect
  const paceModeMultiplier = getPaceModeWearMultiplier(paceMode);
  wearThisLap *= paceModeMultiplier;

  // Driver tire management
  const managementModifier = 1.0 - (driverTireManagement - 0.5) * 0.3;
  wearThisLap *= managementModifier;

  // Setup effect
  const setupModifier = getSetupDegradationModifier(setup);
  wearThisLap *= setupModifier;

  // Weather: wet compounds degrade faster in dry, slicks in wet
  if (weather !== 'dry') {
    const wetWearMod = getWetWearModifier(tire.compound, weather);
    wearThisLap *= wetWearMod;
  }

  newTire.wear = Math.min(100, newTire.wear + wearThisLap);

  // Update degradation rate
  newTire.degradationRate = wearThisLap / profile.baseWearPerLap;

  // Graining — more likely in early laps on hard compounds, track temp cold
  if (tire.age < 5 && Math.random() < profile.grainingRisk * 0.4) {
    newTire.graining = Math.min(100, newTire.graining + 8 + Math.random() * 10);
  } else if (newTire.graining > 0) {
    // Graining clears with laps
    newTire.graining = Math.max(0, newTire.graining - 5);
  }

  // Overheating — when pushing hard or thermal-limited track
  if (paceMode === 'push' && Math.random() < profile.overheatRisk * 0.3) {
    newTire.overheating = Math.min(100, newTire.overheating + 5 + Math.random() * 8);
  } else {
    newTire.overheating = Math.max(0, newTire.overheating - 3);
  }

  return newTire;
}

function getPaceModeWearMultiplier(mode: PaceMode): number {
  switch (mode) {
    case 'push':     return 1.40;
    case 'normal':   return 1.00;
    case 'conserve': return 0.72;
    case 'cruise':   return 0.55;
  }
}

function getSetupDegradationModifier(setup: CarSetup): number {
  let mod = 1.0;
  if (setup.downforce === 'high') mod -= 0.05;   // high downforce = more grip, slightly less sliding
  if (setup.downforce === 'low') mod += 0.04;    // less downforce = more sliding
  mod -= (setup.tirePreservationBias - 0.5) * 0.15;
  return Math.max(0.6, Math.min(1.4, mod));
}

function getWetWearModifier(compound: TireCompound, weather: WeatherCondition): number {
  if (compound === 'INTER' || compound === 'WET') return 1.0;
  // Slicks on wet track = extreme wear (aquaplaning, sliding)
  if (weather === 'wet' || weather === 'very_wet') return 2.5;
  if (weather === 'damp') return 1.4;
  return 1.0;
}

/**
 * Get a human-readable status of tire condition.
 */
export function getTireStatusLabel(tire: TireState): string {
  if (tire.wear >= 85) return 'CRITICAL';
  if (tire.wear >= 70) return 'WORN';
  if (tire.wear >= 45) return 'USED';
  if (tire.wear >= 20) return 'GOOD';
  return 'NEW';
}

export function getTireStatusColor(tire: TireState): string {
  if (tire.wear >= 85) return '#ff2222';
  if (tire.wear >= 70) return '#ff8800';
  if (tire.wear >= 45) return '#ffdd00';
  if (tire.wear >= 20) return '#88ff44';
  return '#00ff88';
}

export function getCompoundColor(compound: TireCompound): string {
  switch (compound) {
    case 'SOFT':   return '#FF3333';
    case 'MEDIUM': return '#FFD700';
    case 'HARD':   return '#E0E0E0';
    case 'INTER':  return '#00CC55';
    case 'WET':    return '#0099FF';
  }
}

export function getCompoundLetter(compound: TireCompound): string {
  switch (compound) {
    case 'SOFT':   return 'S';
    case 'MEDIUM': return 'M';
    case 'HARD':   return 'H';
    case 'INTER':  return 'I';
    case 'WET':    return 'W';
  }
}

/** Estimate remaining usable laps before compound is critically worn */
export function estimateRemainingLaps(
  tire: TireState,
  profile: TireCompoundProfile,
  paceMode: PaceMode
): number {
  const remaining = 85 - tire.wear; // target 85% as critical
  if (remaining <= 0) return 0;
  let wearPerLap = profile.baseWearPerLap * getPaceModeWearMultiplier(paceMode);
  if (tire.age >= profile.cliffLap) wearPerLap *= profile.cliffMultiplier;
  return Math.max(0, Math.floor(remaining / wearPerLap));
}
