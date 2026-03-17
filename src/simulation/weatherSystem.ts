// ============================================================
// Weather System
// ============================================================
import { WeatherCondition, RaceEvent } from '@/types';

export interface WeatherState {
  current: WeatherCondition;
  forecast: WeatherCondition[];  // next 5 laps forecast
  rainProbability: number;       // 0–1 rolling probability
  changePending: boolean;
  changeInLaps: number;
}

const TRANSITION_MAP: Record<WeatherCondition, WeatherCondition[]> = {
  dry:       ['dry', 'dry', 'dry', 'damp'],
  damp:      ['damp', 'dry', 'wet'],
  wet:       ['wet', 'damp', 'very_wet'],
  very_wet:  ['very_wet', 'wet'],
};

export function createWeatherState(): WeatherState {
  return {
    current: 'dry',
    forecast: ['dry', 'dry', 'dry', 'dry', 'dry'],
    rainProbability: 0.05,
    changePending: false,
    changeInLaps: 0,
  };
}

/**
 * Advance weather by one lap. May generate weather events.
 */
export function advanceWeather(
  state: WeatherState,
  lap: number,
  totalLaps: number
): { newState: WeatherState; event: RaceEvent | null } {
  const newState = { ...state, forecast: [...state.forecast] };
  let event: RaceEvent | null = null;

  // Slow random walk of rain probability
  newState.rainProbability = clamp(
    state.rainProbability + (Math.random() - 0.48) * 0.04,
    0.02,
    0.85
  );

  // Check for weather transition
  const roll = Math.random();
  if (roll < newState.rainProbability * 0.15) {
    const transitions = TRANSITION_MAP[state.current];
    const next = transitions[Math.floor(Math.random() * transitions.length)];
    if (next !== state.current) {
      newState.current = next;
      event = buildWeatherEvent(lap, state.current, next);
    }
  }

  // Update forecast
  let forecastCondition = newState.current;
  newState.forecast = Array.from({ length: 5 }, (_, i) => {
    const fRoll = Math.random();
    if (fRoll < newState.rainProbability * 0.2) {
      const t = TRANSITION_MAP[forecastCondition];
      forecastCondition = t[Math.floor(Math.random() * t.length)];
    }
    return forecastCondition;
  });

  return { newState, event };
}

function buildWeatherEvent(lap: number, from: WeatherCondition, to: WeatherCondition): RaceEvent {
  let message = '';
  let severity: RaceEvent['severity'] = 'info';

  if (to === 'damp') {
    message = 'WEATHER: Light rain beginning — track becoming damp. Inters may be needed soon.';
    severity = 'warning';
  } else if (to === 'wet') {
    message = 'WEATHER: Heavy rain! Wet conditions confirmed. Intermediates or wets mandatory.';
    severity = 'critical';
  } else if (to === 'very_wet') {
    message = 'WEATHER: Extreme rain — very wet conditions. Full wets required immediately.';
    severity = 'critical';
  } else if (to === 'dry' && from !== 'dry') {
    message = 'WEATHER: Rain easing — track drying. Monitor for slick switch window.';
    severity = 'warning';
  }

  return {
    lap,
    type: 'weather',
    message,
    severity,
  };
}

export function getWeatherLabel(cond: WeatherCondition): string {
  switch (cond) {
    case 'dry':      return 'Dry';
    case 'damp':     return 'Damp';
    case 'wet':      return 'Wet';
    case 'very_wet': return 'Very Wet';
  }
}

export function getWeatherIcon(cond: WeatherCondition): string {
  switch (cond) {
    case 'dry':      return '☀️';
    case 'damp':     return '🌦️';
    case 'wet':      return '🌧️';
    case 'very_wet': return '⛈️';
  }
}

export function getWeatherColor(cond: WeatherCondition): string {
  switch (cond) {
    case 'dry':      return '#FFD700';
    case 'damp':     return '#90EE90';
    case 'wet':      return '#4FC3F7';
    case 'very_wet': return '#0050AA';
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
