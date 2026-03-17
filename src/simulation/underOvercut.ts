// ============================================================
// Undercut / Overcut Analysis System
// ============================================================
import {
  DriverRaceState,
  TrackProfile,
  UnderOvercutAnalysis,
  WeatherCondition,
  TireCompound,
} from '@/types';
import { getTirePaceDelta } from './tireModel';

/**
 * Evaluate undercut and overcut opportunities for a driver
 * relative to the car directly ahead.
 */
export function analyzeUnderOvercut(
  driver: DriverRaceState,
  target: DriverRaceState,
  track: TrackProfile,
  weather: WeatherCondition,
  lap: number,
  totalLaps: number
): UnderOvercutAnalysis {
  const remainingLaps = totalLaps - lap;

  // Gap to target
  const gap = driver.gapToAhead;

  // Current driver tire delta
  const driverProfile = track.compoundProfiles[driver.tire.compound];
  const driverTireDelta = getTirePaceDelta(driver.tire, driverProfile, weather);

  // Target tire delta
  const targetProfile = track.compoundProfiles[target.tire.compound];
  const targetTireDelta = getTirePaceDelta(target.tire, targetProfile, weather);

  // Rate of convergence per lap (positive means catching)
  const convergencePerLap = targetTireDelta - driverTireDelta;

  // Pit lane time loss
  const pitTimeLoss = track.pitLaneTimeLoss;

  // ─── UNDERCUT Analysis ─────────────────────────────────────
  // Undercut: driver pits now, gets fresh tires, gains via faster out-lap
  // Key factors: pit time loss vs expected fresh tire gain

  const freshCompound = getBestFreshCompound(driver.tire.compound, track, weather);
  const freshProfile = track.compoundProfiles[freshCompound];
  const freshDelta = freshProfile.paceDelta; // baseline, at warmup
  const currentDelta = driverTireDelta;

  // Fresh tire advantage per lap (compared to driver's current tires)
  const freshAdvantagePerLap = currentDelta - freshDelta;

  // How many laps until we recover the pit time loss?
  const undercutBreakEvenLaps = freshAdvantagePerLap > 0.1
    ? pitTimeLoss / freshAdvantagePerLap
    : 999;

  // Target's tire state relative delta — if they're on old degraded tires,
  // their delta is wider (slower), so our fresh tires recover even faster
  const targetWornDelta = targetTireDelta - freshProfile.paceDelta;

  // Undercut is viable if:
  // 1. We can recover pit time before target also pits
  // 2. Track position allows it (gap within ~3–4s for SC undercut, ~1.5s for normal)
  // 3. Enough laps remain
  const undercutGainIfViable = targetWornDelta * Math.min(10, remainingLaps) - pitTimeLoss;
  const undercutViable =
    undercutBreakEvenLaps < 12 &&
    remainingLaps > undercutBreakEvenLaps + 3 &&
    freshAdvantagePerLap > 0.15 &&
    gap < 4.0 &&
    track.undercutStrength > 0.4;

  let undercutRisk: UnderOvercutAnalysis['undercutRisk'] = 'medium';
  let undercutReason = '';

  if (!undercutViable) {
    undercutRisk = 'high';
    if (gap > 4.0) undercutReason = 'Gap to target too large for undercut to work.';
    else if (freshAdvantagePerLap < 0.15) undercutReason = 'Insufficient tire delta — undercut gain marginal.';
    else if (remainingLaps < undercutBreakEvenLaps + 3) undercutReason = 'Too few laps to recover pit stop loss.';
    else undercutReason = 'Track position risk too high.';
  } else {
    if (undercutBreakEvenLaps < 6) {
      undercutRisk = 'low';
      undercutReason = `Fresh ${freshCompound} should recover pit delta in ~${Math.ceil(undercutBreakEvenLaps)} laps.`;
    } else {
      undercutRisk = 'medium';
      undercutReason = `Break-even in ~${Math.ceil(undercutBreakEvenLaps)} laps. Traffic on out-lap is key risk.`;
    }
  }

  if (track.overtakingDifficulty > 0.7) {
    undercutReason += ' Track position critical — overtaking very difficult here.';
  }

  // ─── OVERCUT Analysis ──────────────────────────────────────
  // Overcut: target pits (or might pit), driver stays out on old tires,
  // gains gap while target does out-lap, then driver pits later on own schedule.

  // If target is on worn tires and struggling, they'll pit soon
  const targetLikelyToPitSoon = target.tire.wear > 60 || target.stintLap > 25;

  // Driver's ability to maintain pace on current tires
  const driverTireDegRate = driver.tire.degradationRate;

  // If our degradation is controlled, we can build gap while target does out-lap
  const outLapPenalty = pitTimeLoss + 2.0; // Out-lap is typically slower
  const overcutBuildableGap = convergencePerLap > 0
    ? Math.min(gap + convergencePerLap * 3, outLapPenalty * 0.9)
    : gap * 0.8;

  const overcutViable =
    targetLikelyToPitSoon &&
    driver.tire.wear < 65 &&
    overcutBuildableGap > pitTimeLoss * 0.85 &&
    track.overcutStrength > 0.4 &&
    remainingLaps > 15;

  let overcutRisk: UnderOvercutAnalysis['overcutRisk'] = 'medium';
  let overcutReason = '';

  if (!overcutViable) {
    overcutRisk = 'high';
    if (driver.tire.wear > 65) overcutReason = 'Driver tire wear too high for overcut — degradation risk.';
    else if (!targetLikelyToPitSoon) overcutReason = 'Target not under pressure to pit — overcut window may not open.';
    else overcutReason = 'Insufficient gap buildup potential during target out-lap.';
  } else {
    if (track.overcutStrength > 0.65) {
      overcutRisk = 'low';
      overcutReason = 'Target likely pitting soon. Stay out to build free laps of gap.';
    } else {
      overcutRisk = 'medium';
      overcutReason = 'Overcut possible but depends on target pit timing and out-lap pace.';
    }
  }

  // ─── Final Recommendation ─────────────────────────────────
  let recommendation: UnderOvercutAnalysis['recommendation'];
  let recommendationReason: string;

  if (undercutViable && undercutRisk === 'low') {
    recommendation = 'undercut';
    recommendationReason = `Undercut strongly viable. Fresh ${freshCompound} should overcome pit delta in ~${Math.ceil(undercutBreakEvenLaps)} laps.`;
  } else if (overcutViable && overcutRisk === 'low') {
    recommendation = 'overcut';
    recommendationReason = 'Target likely pitting soon — extend stint to build gap then pit on own terms.';
  } else if (undercutViable) {
    recommendation = 'undercut';
    recommendationReason = `Undercut viable but moderate risk. ${undercutReason}`;
  } else if (overcutViable) {
    recommendation = 'overcut';
    recommendationReason = `Overcut possible. ${overcutReason}`;
  } else {
    recommendation = 'stay';
    recommendationReason = 'No clear strategic advantage right now. Maintain position and monitor.';
  }

  // Cover undercut: if WE are the leader being hunted
  if (target.position < driver.position) {
    // We're behind target — different logic applies
    recommendation = undercutViable ? 'undercut' : 'stay';
  }

  return {
    driverId: driver.driver.id,
    targetDriverId: target.driver.id,
    targetPosition: target.position,
    gapToTarget: gap,
    undercutViable,
    undercutExpectedGain: undercutViable ? undercutGainIfViable : 0,
    undercutRisk,
    undercutReason,
    overcutViable,
    overcutExpectedGain: overcutViable ? overcutBuildableGap - pitTimeLoss : 0,
    overcutRisk,
    overcutReason,
    recommendation,
    recommendationReason,
  };
}

/** Pick the best fresh compound to switch to */
function getBestFreshCompound(
  current: TireCompound,
  track: TrackProfile,
  weather: WeatherCondition
): TireCompound {
  if (weather === 'wet' || weather === 'very_wet') return 'WET';
  if (weather === 'damp') return 'INTER';

  // Prefer stepping up a compound if current is soft
  if (current === 'SOFT') return 'MEDIUM';
  if (current === 'MEDIUM') return 'HARD';
  if (current === 'HARD') return 'MEDIUM'; // can't go harder, go fresh medium
  return 'MEDIUM';
}

/**
 * Generate human-readable undercut/overcut opportunity message for event log.
 */
export function generateUndercutMessage(
  analysis: UnderOvercutAnalysis,
  targetName: string
): string {
  if (analysis.undercutViable && analysis.undercutRisk === 'low') {
    return `STRATEGY: Undercut window OPEN vs ${targetName}. Fresh tire delta high — pitting now is favorable.`;
  }
  if (analysis.undercutViable) {
    return `STRATEGY: Undercut viable vs ${targetName} but moderate risk. ${analysis.undercutReason}`;
  }
  if (analysis.overcutViable) {
    return `STRATEGY: Overcut opportunity vs ${targetName}. ${analysis.overcutReason}`;
  }
  return '';
}
