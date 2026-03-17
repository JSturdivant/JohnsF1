// ============================================================
// AI Strategy Engine
// ============================================================
import {
  DriverRaceState,
  TrackProfile,
  WeatherCondition,
  SafetyCarStatus,
  Team,
  TireCompound,
  PaceMode,
} from '@/types';
import { createTireState, estimateRemainingLaps } from './tireModel';

/**
 * Decide whether an AI driver should pit this lap.
 * Returns true if the AI wants to pit, plus the compound to put on.
 */
export function aiDecidePit(
  driverState: DriverRaceState,
  track: TrackProfile,
  weather: WeatherCondition,
  safetyCarStatus: SafetyCarStatus,
  lap: number,
  totalLaps: number,
  team: Team
): { shouldPit: boolean; nextCompound: TireCompound } {
  const tire = driverState.tire;
  const remainingLaps = totalLaps - lap;
  const profile = track.compoundProfiles[tire.compound];

  // Safety car: prime opportunity to pit for free
  if ((safetyCarStatus === 'sc' || safetyCarStatus === 'vsc') && lap > 5) {
    // AI pits under SC if tires are over 35% worn or haven't stopped yet
    const pitUnderSC = tire.wear > 35 || driverState.totalPitStops === 0;
    if (pitUnderSC) {
      return { shouldPit: true, nextCompound: chooseNextCompound(tire.compound, lap, totalLaps, weather) };
    }
  }

  // Weather: switch compounds if weather changes
  const wrongCompound = isWrongCompoundForWeather(tire.compound, weather);
  if (wrongCompound && lap > 3) {
    return { shouldPit: true, nextCompound: getWeatherCompound(weather) };
  }

  // Tire critical wear
  if (tire.wear > 80) {
    return { shouldPit: true, nextCompound: chooseNextCompound(tire.compound, lap, totalLaps, weather) };
  }

  // Planned stop: use pit window logic
  const estimatedRemaining = estimateRemainingLaps(tire, profile, driverState.currentPaceMode);
  if (estimatedRemaining < 5 && remainingLaps > 5) {
    return { shouldPit: true, nextCompound: chooseNextCompound(tire.compound, lap, totalLaps, weather) };
  }

  // Team strategy aggression: aggressive teams pit earlier to undercut
  const isAggressive = team.strategyAggression > 0.75;

  // Standard pit window check — roughly when tire hits a target wear threshold
  const targetWear = isAggressive ? 50 : 60;
  const atPitWindow = tire.wear > targetWear && remainingLaps > 12;

  // Don't double-stack stops unless required
  const tooSoon = lap < 8 || (driverState.lastPitLap > 0 && lap - driverState.lastPitLap < 10);

  if (atPitWindow && !tooSoon) {
    // Add some randomness for variety
    const pitProbability = isAggressive ? 0.75 : 0.50;
    if (Math.random() < pitProbability) {
      return { shouldPit: true, nextCompound: chooseNextCompound(tire.compound, lap, totalLaps, weather) };
    }
  }

  // Prevent running to end on very worn tires
  if (remainingLaps <= 3 && tire.wear > 60) {
    return { shouldPit: false, nextCompound: tire.compound }; // try to save the stop
  }

  return { shouldPit: false, nextCompound: tire.compound };
}

/** Choose the best compound to put on after a pit stop */
function chooseNextCompound(
  current: TireCompound,
  lap: number,
  totalLaps: number,
  weather: WeatherCondition
): TireCompound {
  if (weather === 'wet' || weather === 'very_wet') return 'WET';
  if (weather === 'damp') return 'INTER';

  const remaining = totalLaps - lap;

  // Final stint: choose based on remaining laps
  if (remaining <= 20) return 'MEDIUM';
  if (remaining <= 12) return 'SOFT';

  // Progress through compounds
  if (current === 'SOFT') return Math.random() > 0.5 ? 'MEDIUM' : 'HARD';
  if (current === 'MEDIUM') return Math.random() > 0.4 ? 'HARD' : 'MEDIUM';
  if (current === 'HARD') return 'MEDIUM';

  return 'MEDIUM';
}

function isWrongCompoundForWeather(compound: TireCompound, weather: WeatherCondition): boolean {
  if ((weather === 'wet' || weather === 'very_wet') &&
      (compound === 'SOFT' || compound === 'MEDIUM' || compound === 'HARD')) return true;
  if (weather === 'dry' && (compound === 'WET' || compound === 'INTER')) return true;
  return false;
}

function getWeatherCompound(weather: WeatherCondition): TireCompound {
  if (weather === 'very_wet') return 'WET';
  if (weather === 'wet') return 'WET';
  if (weather === 'damp') return 'INTER';
  return 'MEDIUM';
}

/**
 * Decide AI pace mode — push, normal, conserve based on situation.
 */
export function aiDecidePaceMode(
  driverState: DriverRaceState,
  lap: number,
  totalLaps: number
): PaceMode {
  const tire = driverState.tire;
  const remaining = totalLaps - lap;

  // Cliff approaching — back off
  const profile = driverState.tire;
  if (tire.wear > 70) return 'conserve';
  if (tire.wear > 55) return 'normal';

  // Final laps — push if in a fight
  if (remaining < 5 && driverState.gapToAhead < 2) return 'push';

  // Outlap after pit — push for warming tires
  if (driverState.stintLap < 3) return 'push';

  // Default
  return 'normal';
}
