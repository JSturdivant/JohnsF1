'use client';
import React from 'react';
import { WeatherCondition, SafetyCarStatus } from '@/types';
import { WeatherState, getWeatherLabel, getWeatherIcon, getWeatherColor } from '@/simulation/weatherSystem';

interface WeatherPanelProps {
  weather: WeatherCondition;
  weatherState: WeatherState;
  safetyCarStatus: SafetyCarStatus;
  safetyCarDuration: number;
  lap: number;
  totalLaps: number;
  lapsUnderSC: number;
}

export default function WeatherPanel({
  weather,
  weatherState,
  safetyCarStatus,
  safetyCarDuration,
  lap,
  totalLaps,
  lapsUnderSC,
}: WeatherPanelProps) {
  const weatherColor = getWeatherColor(weather);

  return (
    <div className="f1-panel flex flex-col">
      <div className="f1-panel-header">Weather &amp; Track Status</div>
      <div className="p-3 flex flex-col gap-3">
        {/* Current conditions */}
        <div className="flex items-center gap-3">
          <span style={{ fontSize: 28 }}>{getWeatherIcon(weather)}</span>
          <div>
            <div className="font-bold text-white">{getWeatherLabel(weather)}</div>
            <div className="text-xs text-f1-muted">Track conditions</div>
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

        {/* Forecast */}
        <div>
          <div className="text-xs text-f1-muted mb-1 uppercase tracking-wider">5-Lap Forecast</div>
          <div className="flex gap-1">
            {weatherState.forecast.map((fc, i) => (
              <div
                key={i}
                className="flex-1 flex flex-col items-center gap-1 p-1.5 rounded border border-f1-border"
              >
                <span style={{ fontSize: 14 }}>{getWeatherIcon(fc)}</span>
                <span className="text-xs text-f1-muted">L+{i + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SC Status */}
        {safetyCarStatus !== 'none' && (
          <div
            className={`p-2 rounded border text-xs font-bold flex items-center justify-between ${
              safetyCarStatus === 'sc'
                ? 'bg-orange-950/40 border-orange-600 text-orange-300'
                : safetyCarStatus === 'vsc'
                ? 'bg-yellow-950/40 border-yellow-600 text-yellow-300'
                : 'bg-red-950/40 border-red-600 text-red-300 blink-red'
            }`}
          >
            <span>
              {safetyCarStatus === 'sc'
                ? '🚗 SAFETY CAR DEPLOYED'
                : safetyCarStatus === 'vsc'
                ? '⚠ VIRTUAL SAFETY CAR'
                : '🚩 RED FLAG'}
            </span>
            {safetyCarDuration > 0 && (
              <span>{safetyCarDuration} lap{safetyCarDuration !== 1 ? 's' : ''} remaining</span>
            )}
          </div>
        )}

        {/* Race progress */}
        <div>
          <div className="flex justify-between text-xs text-f1-muted mb-1">
            <span>Race Progress</span>
            <span>{lap}/{totalLaps} laps</span>
          </div>
          <div className="h-2 bg-f1-border rounded overflow-hidden">
            <div
              className="h-full rounded transition-all duration-500"
              style={{
                width: `${(lap / totalLaps) * 100}%`,
                background: 'linear-gradient(90deg, #E8002D, #ff6644)',
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-f1-muted mt-1">
            <span>{totalLaps - lap} laps remaining</span>
            {lapsUnderSC > 0 && <span>{lapsUnderSC} laps behind SC</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
