import { TrackProfile, TireCompound } from '@/types';

// Helper to build a full compound profile record
function buildCompoundProfiles(
  softWear: number, medWear: number, hardWear: number
): TrackProfile['compoundProfiles'] {
  return {
    SOFT: {
      compound: 'SOFT',
      baseWearPerLap: softWear,
      thermalSensitivity: 0.75,
      grainingRisk: 0.18,
      overheatRisk: 0.22,
      paceDelta: -1.4,
      warmupLaps: 1,
      cliffLap: 18,
      cliffMultiplier: 2.2,
    },
    MEDIUM: {
      compound: 'MEDIUM',
      baseWearPerLap: medWear,
      thermalSensitivity: 0.45,
      grainingRisk: 0.08,
      overheatRisk: 0.10,
      paceDelta: 0,
      warmupLaps: 2,
      cliffLap: 30,
      cliffMultiplier: 1.8,
    },
    HARD: {
      compound: 'HARD',
      baseWearPerLap: hardWear,
      thermalSensitivity: 0.25,
      grainingRisk: 0.12,
      overheatRisk: 0.05,
      paceDelta: 0.9,
      warmupLaps: 3,
      cliffLap: 45,
      cliffMultiplier: 1.5,
    },
    INTER: {
      compound: 'INTER',
      baseWearPerLap: 2.0,
      thermalSensitivity: 0.20,
      grainingRisk: 0.05,
      overheatRisk: 0.08,
      paceDelta: 5.0, // Only effective in wet/damp
      warmupLaps: 1,
      cliffLap: 20,
      cliffMultiplier: 2.0,
    },
    WET: {
      compound: 'WET',
      baseWearPerLap: 1.2,
      thermalSensitivity: 0.10,
      grainingRisk: 0.03,
      overheatRisk: 0.04,
      paceDelta: 12.0, // Only effective in heavy rain
      warmupLaps: 1,
      cliffLap: 30,
      cliffMultiplier: 1.6,
    },
  };
}

export const TRACKS: TrackProfile[] = [
  // ─── SILVERSTONE ───────────────────────────────────────────
  {
    id: 'silverstone',
    name: 'British Grand Prix',
    country: 'Great Britain',
    circuit: 'Silverstone Circuit',
    totalLaps: 52,
    lapDistance: 5.891,
    pitLaneTimeLoss: 21.5,
    overtakingDifficulty: 0.4,
    undercutStrength: 0.75,
    overcutStrength: 0.55,
    limitationType: 'rear',
    degradationLevel: 'high',
    baselapTime: 90.4,
    fuelEffect: 0.065,
    safetyCarProbability: 0.35,
    description:
      'High-speed, rear-limited circuit with aggressive tire degradation. ' +
      'Silverstone\'s fast sweeping corners, particularly Copse, Maggots, ' +
      'Becketts and Chapel put extreme lateral loads on rear tires. ' +
      'Undercut is a potent weapon here — fresh rubber in the high-speed ' +
      'sections generates significant lap-time gains.',
    compoundProfiles: {
      SOFT: {
        compound: 'SOFT',
        baseWearPerLap: 3.8,
        thermalSensitivity: 0.80,
        grainingRisk: 0.20,
        overheatRisk: 0.25,
        paceDelta: -1.4,
        warmupLaps: 1,
        cliffLap: 16,
        cliffMultiplier: 2.5,
      },
      MEDIUM: {
        compound: 'MEDIUM',
        baseWearPerLap: 2.2,
        thermalSensitivity: 0.50,
        grainingRisk: 0.10,
        overheatRisk: 0.12,
        paceDelta: 0,
        warmupLaps: 2,
        cliffLap: 28,
        cliffMultiplier: 1.9,
      },
      HARD: {
        compound: 'HARD',
        baseWearPerLap: 1.4,
        thermalSensitivity: 0.30,
        grainingRisk: 0.15,
        overheatRisk: 0.06,
        paceDelta: 1.0,
        warmupLaps: 3,
        cliffLap: 42,
        cliffMultiplier: 1.6,
      },
      INTER: {
        compound: 'INTER',
        baseWearPerLap: 2.5,
        thermalSensitivity: 0.20,
        grainingRisk: 0.04,
        overheatRisk: 0.08,
        paceDelta: 4.5,
        warmupLaps: 1,
        cliffLap: 18,
        cliffMultiplier: 2.0,
      },
      WET: {
        compound: 'WET',
        baseWearPerLap: 1.3,
        thermalSensitivity: 0.10,
        grainingRisk: 0.02,
        overheatRisk: 0.04,
        paceDelta: 11.0,
        warmupLaps: 1,
        cliffLap: 28,
        cliffMultiplier: 1.6,
      },
    },
    suggestedStrategies: [
      {
        name: 'Two-Stop Medium–Medium–Hard',
        description: 'Open on Medium, early second stop for Medium, close on Hard.',
        stints: [
          { compound: 'MEDIUM', laps: 16 },
          { compound: 'MEDIUM', laps: 18 },
          { compound: 'HARD', laps: 18 },
        ],
        targetLapRange: [52, 52],
        risk: 'low',
        notes: 'Conservative, predictable. Loses ground to aggressive undercutters.',
      },
      {
        name: 'Two-Stop Soft–Medium–Hard',
        description: 'Aggressive soft start for early positions, two-stop.',
        stints: [
          { compound: 'SOFT', laps: 12 },
          { compound: 'MEDIUM', laps: 20 },
          { compound: 'HARD', laps: 20 },
        ],
        targetLapRange: [52, 52],
        risk: 'medium',
        notes: 'Fast opening laps to build gap. Must manage SOFT cliff carefully.',
      },
      {
        name: 'Three-Stop Soft Blitz',
        description: 'Maximum aggression. Three stops on Soft/Medium compounds.',
        stints: [
          { compound: 'SOFT', laps: 12 },
          { compound: 'SOFT', laps: 13 },
          { compound: 'MEDIUM', laps: 14 },
          { compound: 'HARD', laps: 13 },
        ],
        targetLapRange: [52, 52],
        risk: 'high',
        notes: 'Requires undercut to work. Traffic on out-laps is the biggest risk.',
      },
    ],
  },

  // ─── MONZA ─────────────────────────────────────────────────
  {
    id: 'monza',
    name: 'Italian Grand Prix',
    country: 'Italy',
    circuit: 'Autodromo Nazionale Monza',
    totalLaps: 53,
    lapDistance: 5.793,
    pitLaneTimeLoss: 23.0,
    overtakingDifficulty: 0.25,
    undercutStrength: 0.60,
    overcutStrength: 0.70,
    limitationType: 'thermal',
    degradationLevel: 'low',
    baselapTime: 82.5,
    fuelEffect: 0.060,
    safetyCarProbability: 0.40,
    description:
      'Temple of Speed. Long straights create huge slipstream overtaking ' +
      'opportunities but the chicanes are brutal on tires. Very low ' +
      'degradation overall makes one-stop strategies viable. ' +
      'The overcut is unusually strong here — pitting under pressure and ' +
      'using clear air out-laps can be decisive.',
    compoundProfiles: {
      SOFT: {
        compound: 'SOFT',
        baseWearPerLap: 2.2,
        thermalSensitivity: 0.65,
        grainingRisk: 0.08,
        overheatRisk: 0.15,
        paceDelta: -1.2,
        warmupLaps: 1,
        cliffLap: 22,
        cliffMultiplier: 2.0,
      },
      MEDIUM: {
        compound: 'MEDIUM',
        baseWearPerLap: 1.4,
        thermalSensitivity: 0.35,
        grainingRisk: 0.05,
        overheatRisk: 0.08,
        paceDelta: 0,
        warmupLaps: 2,
        cliffLap: 38,
        cliffMultiplier: 1.7,
      },
      HARD: {
        compound: 'HARD',
        baseWearPerLap: 0.9,
        thermalSensitivity: 0.20,
        grainingRisk: 0.10,
        overheatRisk: 0.04,
        paceDelta: 0.8,
        warmupLaps: 3,
        cliffLap: 55,
        cliffMultiplier: 1.4,
      },
      INTER: {
        compound: 'INTER',
        baseWearPerLap: 1.8,
        thermalSensitivity: 0.15,
        grainingRisk: 0.03,
        overheatRisk: 0.06,
        paceDelta: 4.0,
        warmupLaps: 1,
        cliffLap: 22,
        cliffMultiplier: 1.9,
      },
      WET: {
        compound: 'WET',
        baseWearPerLap: 1.0,
        thermalSensitivity: 0.08,
        grainingRisk: 0.02,
        overheatRisk: 0.03,
        paceDelta: 10.0,
        warmupLaps: 1,
        cliffLap: 30,
        cliffMultiplier: 1.5,
      },
    },
    suggestedStrategies: [
      {
        name: 'One-Stop Medium–Hard',
        description: 'Classic one-stop. Medium in the first half, Hard to the flag.',
        stints: [
          { compound: 'MEDIUM', laps: 26 },
          { compound: 'HARD', laps: 27 },
        ],
        targetLapRange: [53, 53],
        risk: 'low',
        notes: 'Standard Monza strategy. Track position is paramount.',
      },
      {
        name: 'Soft Gamble One-Stop',
        description: 'Start Soft, survive to a late pit, Hard to finish.',
        stints: [
          { compound: 'SOFT', laps: 20 },
          { compound: 'HARD', laps: 33 },
        ],
        targetLapRange: [53, 53],
        risk: 'medium',
        notes: 'Good if SC falls during second stint. Hard may struggle over 33 laps.',
      },
    ],
  },

  // ─── MONACO ────────────────────────────────────────────────
  {
    id: 'monaco',
    name: 'Monaco Grand Prix',
    country: 'Monaco',
    circuit: 'Circuit de Monaco',
    totalLaps: 78,
    lapDistance: 3.337,
    pitLaneTimeLoss: 26.0,
    overtakingDifficulty: 0.95,
    undercutStrength: 0.90,
    overcutStrength: 0.15,
    limitationType: 'front',
    degradationLevel: 'low',
    baselapTime: 74.5,
    fuelEffect: 0.045,
    safetyCarProbability: 0.65,
    description:
      'The crown jewel of Formula 1 but a strategy nightmare. ' +
      'Overtaking is nearly impossible — track position is everything. ' +
      'The undercut through the pits is the ONLY way to genuinely ' +
      'pass. Safety cars are frequent and game-changing. ' +
      'Low degradation means one-stop is default, but timing the SC ' +
      'stop is the key skill.',
    compoundProfiles: {
      SOFT: {
        compound: 'SOFT',
        baseWearPerLap: 1.8,
        thermalSensitivity: 0.50,
        grainingRisk: 0.12,
        overheatRisk: 0.12,
        paceDelta: -1.0,
        warmupLaps: 1,
        cliffLap: 30,
        cliffMultiplier: 1.8,
      },
      MEDIUM: {
        compound: 'MEDIUM',
        baseWearPerLap: 1.0,
        thermalSensitivity: 0.30,
        grainingRisk: 0.06,
        overheatRisk: 0.06,
        paceDelta: 0,
        warmupLaps: 2,
        cliffLap: 50,
        cliffMultiplier: 1.5,
      },
      HARD: {
        compound: 'HARD',
        baseWearPerLap: 0.7,
        thermalSensitivity: 0.18,
        grainingRisk: 0.08,
        overheatRisk: 0.03,
        paceDelta: 0.7,
        warmupLaps: 3,
        cliffLap: 70,
        cliffMultiplier: 1.3,
      },
      INTER: {
        compound: 'INTER',
        baseWearPerLap: 1.5,
        thermalSensitivity: 0.12,
        grainingRisk: 0.03,
        overheatRisk: 0.05,
        paceDelta: 3.5,
        warmupLaps: 1,
        cliffLap: 20,
        cliffMultiplier: 1.8,
      },
      WET: {
        compound: 'WET',
        baseWearPerLap: 0.9,
        thermalSensitivity: 0.07,
        grainingRisk: 0.01,
        overheatRisk: 0.02,
        paceDelta: 9.0,
        warmupLaps: 1,
        cliffLap: 25,
        cliffMultiplier: 1.4,
      },
    },
    suggestedStrategies: [
      {
        name: 'One-Stop Medium–Hard',
        description: 'Maximise track position. Pit window lap 30–40.',
        stints: [
          { compound: 'MEDIUM', laps: 36 },
          { compound: 'HARD', laps: 42 },
        ],
        targetLapRange: [78, 78],
        risk: 'low',
        notes: 'Extend as long as possible to lap 40 if no threat behind.',
      },
      {
        name: 'Safety Car Gamble',
        description: 'Stay out under early SC, pit during SC if it falls late.',
        stints: [
          { compound: 'MEDIUM', laps: 45 },
          { compound: 'HARD', laps: 33 },
        ],
        targetLapRange: [78, 78],
        risk: 'high',
        notes: 'If no SC falls, tires may be very marginal at the end.',
      },
    ],
  },
];

export function getTrack(id: string): TrackProfile {
  const track = TRACKS.find(t => t.id === id);
  if (!track) throw new Error(`Track not found: ${id}`);
  return track;
}

export const DEFAULT_TRACK = TRACKS[0]; // Silverstone
