'use client';
import React from 'react';
import { RaceState, TireCompound } from '@/types';
import { WeatherState, getWeatherLabel, getWeatherIcon } from '@/simulation/weatherSystem';
import { getCompoundColor, getCompoundLetter } from '@/simulation/tireModel';

interface ReactToRainModalProps {
  raceState: RaceState;
  weatherState: WeatherState;
  onChoice: (compound: TireCompound | null) => void;
  onClose: () => void;
}

export default function ReactToRainModal({
  raceState,
  weatherState,
  onChoice,
  onClose,
}: ReactToRainModalProps) {
  const player = raceState.drivers.find(d => d.driver.id === raceState.playerDriverId);
  if (!player) return null;

  const tire = player.tire;
  const lapHistory = raceState.lapHistory;
  const last5 = lapHistory.slice(-5).reverse();

  function formatTime(s: number) {
    if (!s || s <= 0) return '—';
    const mins = Math.floor(s / 60);
    const secs = (s % 60).toFixed(3).padStart(6, '0');
    return `${mins}:${secs}`;
  }

  const options: { label: string; desc: string; compound: TireCompound | null; icon: string; color: string }[] = [
    {
      label: 'Box for Intermediates',
      desc: 'Best for damp/light rain. Faster than wets in mixed conditions.',
      compound: 'INTER',
      icon: '🌦',
      color: '#22c55e',
    },
    {
      label: 'Box for Full Wets',
      desc: 'Required in heavy rain. Slower in damp but safer in very wet.',
      compound: 'WET',
      icon: '⛈',
      color: '#4FC3F7',
    },
    {
      label: 'Stay Out',
      desc: 'Maintain current tires. Risk losing time but avoid pit lane loss.',
      compound: null,
      icon: '→',
      color: '#aaaacc',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-lg border border-f1-border bg-f1-panel flex flex-col shadow-2xl"
        style={{ maxHeight: '90vh', overflow: 'auto' }}
      >
        {/* Header */}
        <div className="f1-panel-header flex items-center gap-2">
          <span>🌧</span>
          <span>React to Rain</span>
          <button
            onClick={onClose}
            className="ml-auto text-f1-muted hover:text-white transition-colors px-1"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          {/* Current conditions */}
          <div className="flex items-center gap-3 p-3 rounded border border-f1-border bg-f1-dark">
            <span style={{ fontSize: 28 }}>{getWeatherIcon(raceState.weather)}</span>
            <div>
              <div className="font-bold text-white">{getWeatherLabel(raceState.weather)}</div>
              <div className="text-xs text-f1-muted">Current conditions</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-xs text-f1-muted">Rain prob.</div>
              <div
                className="font-bold text-sm"
                style={{ color: weatherState.rainProbability > 0.4 ? '#ff8866' : '#aaaacc' }}
              >
                {Math.round(weatherState.rainProbability * 100)}%
              </div>
            </div>
          </div>

          {/* Lap-by-lap forecast */}
          <div>
            <div className="text-xs text-f1-muted mb-2 uppercase tracking-wider">Lap-by-Lap Forecast</div>
            <div className="flex gap-2">
              {weatherState.forecast.map((fc, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1 p-2 rounded border border-f1-border bg-f1-dark"
                >
                  <span style={{ fontSize: 16 }}>{getWeatherIcon(fc)}</span>
                  <span className="text-xs text-f1-muted">L+{i + 1}</span>
                  <span className="text-xs text-white" style={{ fontSize: 9 }}>
                    {getWeatherLabel(fc)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Last 5 lap times + tire age */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-f1-muted mb-2 uppercase tracking-wider">Last 5 Lap Times</div>
              <div className="flex flex-col gap-1">
                {last5.length === 0 && (
                  <span className="text-xs text-f1-muted">No lap data yet</span>
                )}
                {last5.map((ld, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-f1-muted">Lap {ld.lap}</span>
                    <span className="tabular-nums text-white font-mono">
                      {formatTime(ld.playerLapTime)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs text-f1-muted mb-2 uppercase tracking-wider">Current Tire</div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center justify-center rounded-full font-bold text-white"
                    style={{
                      background: getCompoundColor(tire.compound),
                      width: 28,
                      height: 28,
                      fontSize: 12,
                    }}
                  >
                    {getCompoundLetter(tire.compound)}
                  </span>
                  <span className="text-sm text-white font-bold">{tire.compound}</span>
                </div>
                <div className="flex flex-col gap-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-f1-muted">Age</span>
                    <span className="text-white">{tire.age} laps</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-f1-muted">Wear</span>
                    <span
                      style={{ color: tire.wear > 70 ? '#ff6644' : tire.wear > 40 ? '#ffcc00' : '#88ff88' }}
                    >
                      {Math.round(tire.wear)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Strategy options */}
          <div>
            <div className="text-xs text-f1-muted mb-2 uppercase tracking-wider">Choose Your Response</div>
            <div className="flex flex-col gap-2">
              {options.map(opt => (
                <button
                  key={opt.label}
                  onClick={() => onChoice(opt.compound)}
                  className="flex items-center gap-3 p-3 rounded border border-f1-border hover:border-white/40 bg-f1-dark hover:bg-white/5 transition-all text-left"
                >
                  <span style={{ fontSize: 20 }}>{opt.icon}</span>
                  <div className="flex-1">
                    <div className="font-bold text-white text-sm flex items-center gap-2">
                      {opt.label}
                      {opt.compound && (
                        <span
                          className="inline-flex items-center justify-center rounded-full text-white font-bold"
                          style={{
                            background: getCompoundColor(opt.compound),
                            width: 18,
                            height: 18,
                            fontSize: 10,
                          }}
                        >
                          {getCompoundLetter(opt.compound)}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-f1-muted mt-0.5">{opt.desc}</div>
                  </div>
                  <span style={{ color: opt.color, fontSize: 18 }}>›</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
