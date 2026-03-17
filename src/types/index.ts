// ============================================================
// F1 Strategy Game — Core Type Definitions
// ============================================================

// --- Tire Compounds ---
export type TireCompound = 'SOFT' | 'MEDIUM' | 'HARD' | 'INTER' | 'WET';

export interface TireState {
  compound: TireCompound;
  age: number;          // laps on this set
  wear: number;         // 0–100 (100 = destroyed)
  graining: number;     // 0–100 (temporary grip loss)
  overheating: number;  // 0–100 (excessive deg risk)
  degradationRate: number; // current deg/lap multiplier
}

// --- Driver ---
export interface Driver {
  id: string;
  name: string;
  shortName: string;    // 3-letter code, e.g. "VER"
  number: number;
  teamId: string;
  skill: number;            // 0–1 overall pace
  tireManagement: number;   // 0–1 affects deg rate
  racecraft: number;        // 0–1 overtaking / defending
  consistency: number;      // 0–1 lap-time variance
  wetWeatherAbility: number; // 0–1
  isPlayer: boolean;
}

// --- Team ---
export interface Team {
  id: string;
  name: string;
  shortName: string;
  color: string;          // hex for UI
  pitstopSpeed: number;   // seconds (base pit stop time)
  pitstopReliability: number; // 0–1 chance of clean stop
  strategyAggression: number; // 0–1 (AI: how risky they play)
  carPace: number;        // 0–1 raw pace relative to field
}

// --- Track / Circuit ---
export type LimitationType = 'front' | 'rear' | 'thermal' | 'balanced';

export interface TireCompoundProfile {
  compound: TireCompound;
  baseWearPerLap: number;     // % wear per lap (base)
  thermalSensitivity: number; // 0–1 multiplier for hot laps
  grainingRisk: number;       // 0–1 chance per lap
  overheatRisk: number;       // 0–1 chance if pushed
  paceDelta: number;          // seconds vs MEDIUM (negative=faster)
  warmupLaps: number;         // laps to reach peak temp
  cliffLap: number;           // lap where deg accelerates sharply
  cliffMultiplier: number;    // multiplier after cliff
}

export interface TrackProfile {
  id: string;
  name: string;
  country: string;
  circuit: string;
  totalLaps: number;
  lapDistance: number;     // km
  pitLaneTimeLoss: number; // seconds
  overtakingDifficulty: number; // 0–1 (1=very hard)
  undercutStrength: number;     // 0–1 (1=very strong)
  overcutStrength: number;      // 0–1
  limitationType: LimitationType;
  degradationLevel: 'low' | 'medium' | 'high';
  baselapTime: number;          // seconds (representative lap)
  fuelEffect: number;           // seconds per lap of fuel load change
  safetyCarProbability: number; // 0–1 per race
  compoundProfiles: Record<TireCompound, TireCompoundProfile>;
  suggestedStrategies: SuggestedStrategy[];
  description: string;
}

export interface SuggestedStrategy {
  name: string;
  description: string;
  stints: Array<{ compound: TireCompound; laps: number }>;
  targetLapRange: [number, number]; // total laps range
  risk: 'low' | 'medium' | 'high';
  notes: string;
}

// --- Car Setup ---
export interface CarSetup {
  downforce: 'low' | 'medium' | 'high';
  tirePreservationBias: number;  // 0–1 (1 = max preservation)
  balanceBias: 'top_speed' | 'balanced' | 'cornering';
  wetWeatherBias: boolean;
  fuelLoad: 'light' | 'standard' | 'heavy';
}

export interface SetupEffects {
  paceModifier: number;       // seconds per lap (neg = faster)
  degradationModifier: number; // multiplier (0.9 = 10% less deg)
  topSpeedModifier: number;
  underwaterOvertake: number;  // modifier for overtaking
  wetPaceModifier: number;
}

// --- Strategy Plans ---
export type StrategyPlanId = 'A' | 'B' | 'C';

export interface StintPlan {
  compound: TireCompound;
  targetLaps: number;          // intended stint length
  pitWindow: [number, number]; // earliest/latest pit lap
  pushMode: PaceMode;
}

export interface StrategyPlan {
  id: StrategyPlanId;
  name: string;
  stints: StintPlan[];
  safetyCarResponse: 'pit' | 'stay' | 'assess';
  rainResponse: 'pit_inters' | 'pit_wets' | 'stay';
  undercutIntent: boolean;
  overcutIntent: boolean;
  notes: string;
}

// --- Race Events ---
export type WeatherCondition = 'dry' | 'damp' | 'wet' | 'very_wet';
export type SafetyCarStatus = 'none' | 'vsc' | 'sc' | 'red_flag';
export type PaceMode = 'push' | 'normal' | 'conserve' | 'cruise';
export type PlayerAction =
  | 'pit_now'
  | 'switch_plan'
  | 'push'
  | 'conserve'
  | 'defend'
  | 'attack'
  | 'stay_out'
  | 'attempt_undercut'
  | 'cover_undercut'
  | 'commit_overcut'
  | 'react_safety_car'
  | 'react_rain'
  | 'change_compound';

export interface RaceEvent {
  lap: number;
  type: 'incident' | 'weather' | 'safety_car' | 'vsc' | 'red_flag' | 'pit' | 'strategy' | 'position' | 'info';
  message: string;
  severity: 'info' | 'warning' | 'critical';
  driverId?: string;
}

// --- Driver Race State ---
export interface DriverRaceState {
  driver: Driver;
  position: number;
  lapTime: number;          // last lap time in seconds
  gapToLeader: number;      // seconds
  gapToAhead: number;       // seconds
  intervalBehind: number;   // seconds (gap to car behind)
  tire: TireState;
  pitted: boolean;
  totalPitStops: number;
  pitLaps: number[];
  currentPaceMode: PaceMode;
  totalRaceTime: number;
  stintLap: number;         // laps into current stint
  dnf: boolean;
  dnfReason?: string;
  isInPits: boolean;
  lastPitLap: number;
  stintHistory: Array<{ compound: TireCompound; laps: number; startLap: number }>;
  undercutThreat: boolean;
  overcutOpportunity: boolean;
}

// --- Undercut / Overcut Analysis ---
export interface UnderOvercutAnalysis {
  driverId: string;
  targetDriverId: string;
  targetPosition: number;
  gapToTarget: number;

  undercutViable: boolean;
  undercutExpectedGain: number;  // seconds
  undercutRisk: 'low' | 'medium' | 'high';
  undercutReason: string;

  overcutViable: boolean;
  overcutExpectedGain: number;
  overcutRisk: 'low' | 'medium' | 'high';
  overcutReason: string;

  recommendation: 'undercut' | 'overcut' | 'stay' | 'cover';
  recommendationReason: string;
}

// --- Race State ---
export interface RaceState {
  track: TrackProfile;
  currentLap: number;
  totalLaps: number;
  weather: WeatherCondition;
  safetyCarStatus: SafetyCarStatus;
  safetyCarLap: number;    // lap SC deployed
  safetyCarDuration: number; // laps remaining
  redFlagLap: number;
  drivers: DriverRaceState[];
  playerDriverId: string;
  events: RaceEvent[];
  activePlan: StrategyPlanId;
  plans: Record<StrategyPlanId, StrategyPlan>;
  setup: CarSetup;
  setupEffects: SetupEffects;
  raceStatus: 'pre_race' | 'racing' | 'safety_car' | 'vsc' | 'red_flag' | 'finished';
  remainingLaps: number;
  lapHistory: LapData[];
  lapsUnderSC: number;
  pendingPlayerAction: PlayerAction | null;
  pendingCompoundChange: TireCompound | null;
  autoAdvance: boolean;
  advanceSpeed: number;     // ms between auto-advance
}

export interface LapData {
  lap: number;
  playerPosition: number;
  playerLapTime: number;
  playerTireWear: number;
  playerTireAge: number;
  weather: WeatherCondition;
  safetyCarStatus: SafetyCarStatus;
  events: RaceEvent[];
}

// --- Game Flow Screen ---
export type GameScreen =
  | 'track_briefing'
  | 'strategy_planning'
  | 'car_setup'
  | 'racing'
  | 'results';

export interface GameState {
  screen: GameScreen;
  selectedTrack: TrackProfile;
  selectedDriver: Driver;
  plans: Record<StrategyPlanId, StrategyPlan>;
  activePlan: StrategyPlanId;
  setup: CarSetup;
  raceState: RaceState | null;
}
