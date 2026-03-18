'use client';
import React, { useState } from 'react';
import { PlayerAction, TireCompound, RaceState, WeatherCondition } from '@/types';
import { getCompoundColor, getCompoundLetter } from '@/simulation/tireModel';
import { UnderOvercutAnalysis } from '@/types';

interface ActionButtonsProps {
  raceState: RaceState;
  undercutAnalysis: UnderOvercutAnalysis | null;
  onAction: (action: PlayerAction, compound?: TireCompound) => void;
  disabled: boolean;
}

const COMPOUNDS: TireCompound[] = ['SOFT', 'MEDIUM', 'HARD', 'INTER', 'WET'];

function ActionBtn({
  label,
  icon,
  variant,
  onClick,
  disabled,
  active,
  badge,
}: {
  label: string;
  icon?: string;
  variant: 'red' | 'green' | 'blue' | 'orange' | 'neutral';
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  badge?: string;
}) {
  return (
    <div className="relative">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`btn-action btn-${variant} w-full ${active ? 'btn-active' : ''}`}
      >
        {icon && <span className="mr-1">{icon}</span>}
        {label}
      </button>
      {badge && (
        <span className="absolute -top-1 -right-1 bg-f1-red text-white text-xs rounded-full px-1 font-bold leading-none py-0.5">
          {badge}
        </span>
      )}
    </div>
  );
}

export default function ActionButtons({
  raceState,
  undercutAnalysis,
  onAction,
  disabled,
}: ActionButtonsProps) {
  const [selectedCompound, setSelectedCompound] = useState<TireCompound>('MEDIUM');
  const [showCompoundPicker, setShowCompoundPicker] = useState(false);

  const player = raceState.drivers.find(d => d.driver.id === raceState.playerDriverId);
  const weather = raceState.weather;
  const scActive = raceState.safetyCarStatus === 'sc' || raceState.safetyCarStatus === 'vsc';
  const isWet = weather === 'wet' || weather === 'very_wet' || weather === 'damp';

  const handlePit = (action: PlayerAction) => {
    onAction(action, selectedCompound);
    setShowCompoundPicker(false);
  };

  const currentMode = player?.currentPaceMode ?? 'normal';

  return (
    <div className="f1-panel flex flex-col">
      <div className="f1-panel-header">Race Actions</div>
      <div className="p-3 flex flex-col gap-3">
        {/* Compound selector */}
        <div>
          <div className="text-xs text-f1-muted mb-1.5 uppercase tracking-wider">
            Select Compound (for pit stop)
          </div>
          <div className="flex gap-1.5">
            {COMPOUNDS.map(c => (
              <button
                key={c}
                onClick={() => setSelectedCompound(c)}
                className={`tire-dot text-white font-bold transition-all ${
                  selectedCompound === c ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
                }`}
                style={{
                  background: getCompoundColor(c),
                  borderColor: selectedCompound === c ? 'white' : getCompoundColor(c),
                }}
                title={c}
              >
                <span style={{ fontSize: 10 }}>{getCompoundLetter(c)}</span>
              </button>
            ))}
            <span className="text-xs text-f1-muted self-center ml-1">
              → {selectedCompound}
            </span>
          </div>
        </div>

        {/* Pit actions */}
        <div>
          <div className="text-xs text-f1-muted mb-1.5 uppercase tracking-wider">Pit Stop</div>
          <div className="grid grid-cols-2 gap-1.5">
            <ActionBtn
              label="BOX, BOX"
              icon="🔧"
              variant="red"
              onClick={() => handlePit('pit_now')}
              disabled={disabled}
            />
            <ActionBtn
              label="STAY OUT"
              icon="→"
              variant="neutral"
              onClick={() => onAction('stay_out')}
              disabled={disabled}
            />
          </div>
        </div>

        {/* Under/Overcut actions */}
        <div>
          <div className="text-xs text-f1-muted mb-1.5 uppercase tracking-wider">
            Undercut / Overcut
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            <ActionBtn
              label="ATTEMPT UNDERCUT"
              icon="⬇"
              variant="orange"
              onClick={() => handlePit('attempt_undercut')}
              disabled={disabled || !undercutAnalysis?.undercutViable}
              badge={
                undercutAnalysis?.undercutViable && undercutAnalysis?.undercutRisk === 'low'
                  ? '!'
                  : undefined
              }
            />
            <ActionBtn
              label="COVER RIVAL UNDERCUT"
              icon="🛡"
              variant="blue"
              onClick={() => handlePit('cover_undercut')}
              disabled={disabled}
            />
            <ActionBtn
              label="COMMIT TO OVERCUT"
              icon="⬆"
              variant="blue"
              onClick={() => onAction('commit_overcut')}
              disabled={disabled || !undercutAnalysis?.overcutViable}
            />
          </div>
          {undercutAnalysis && (
            <div className="mt-2 text-xs text-f1-muted leading-relaxed">
              {undercutAnalysis.recommendation === 'undercut' && (
                <span className="text-orange-300">
                  ⬇ Rec: Undercut — {undercutAnalysis.recommendationReason}
                </span>
              )}
              {undercutAnalysis.recommendation === 'overcut' && (
                <span className="text-blue-300">
                  ⬆ Rec: Overcut — {undercutAnalysis.recommendationReason}
                </span>
              )}
              {undercutAnalysis.recommendation === 'stay' && (
                <span className="text-f1-muted">
                  — {undercutAnalysis.recommendationReason}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Pace actions */}
        <div>
          <div className="text-xs text-f1-muted mb-1.5 uppercase tracking-wider">Pace Mode</div>
          <div className="grid grid-cols-2 gap-1.5">
            <ActionBtn
              label="PUSH"
              icon="🔥"
              variant="red"
              onClick={() => onAction('push')}
              disabled={disabled}
              active={currentMode === 'push'}
            />
            <ActionBtn
              label="CONSERVE"
              icon="♻"
              variant="green"
              onClick={() => onAction('conserve')}
              disabled={disabled}
              active={currentMode === 'conserve'}
            />
            <ActionBtn
              label="ATTACK"
              icon="⚔"
              variant="orange"
              onClick={() => onAction('attack')}
              disabled={disabled}
            />
            <ActionBtn
              label="DEFEND"
              icon="🛡"
              variant="blue"
              onClick={() => onAction('defend')}
              disabled={disabled}
            />
          </div>
        </div>

        {/* Situational actions */}
        {(scActive || isWet) && (
          <div>
            <div className="text-xs text-f1-muted mb-1.5 uppercase tracking-wider">
              React to Situation
            </div>
            <div className="flex flex-col gap-1.5">
              {scActive && (
                <ActionBtn
                  label="REACT TO SAFETY CAR"
                  icon="🚗"
                  variant="orange"
                  onClick={() => handlePit('react_safety_car')}
                  disabled={disabled}
                  badge="SC"
                />
              )}
              {isWet && (
                <ActionBtn
                  label="REACT TO RAIN"
                  icon="🌧"
                  variant="blue"
                  onClick={() => onAction('react_rain')}
                  disabled={disabled}
                  badge="!"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
