'use client';
import React, { useState } from 'react';
import { PlayerAction, TireCompound, RaceState } from '@/types';
import { UnderOvercutAnalysis } from '@/types';
import PitStopDialog from './PitStopDialog';

interface ActionButtonsProps {
  raceState: RaceState;
  undercutAnalysis: UnderOvercutAnalysis | null;
  onAction: (action: PlayerAction, compound?: TireCompound) => void;
  disabled: boolean;
}

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
  const [showPitDialog, setShowPitDialog] = useState(false);
  const [pendingPitAction, setPendingPitAction] = useState<PlayerAction>('pit_now');

  const player = raceState.drivers.find(d => d.driver.id === raceState.playerDriverId);
  const weather = raceState.weather;
  const scActive = raceState.safetyCarStatus === 'sc' || raceState.safetyCarStatus === 'vsc';
  const isWet = weather === 'wet' || weather === 'very_wet' || weather === 'damp';

  const openPitDialog = (action: PlayerAction) => {
    setPendingPitAction(action);
    setShowPitDialog(true);
  };

  const handleConfirmPit = (compound: TireCompound) => {
    onAction(pendingPitAction, compound);
    setShowPitDialog(false);
  };

  const handleStayOut = () => {
    onAction('stay_out');
    setShowPitDialog(false);
  };

  const currentMode = player?.currentPaceMode ?? 'normal';

  return (
    <>
      {showPitDialog && player && (
        <PitStopDialog
          currentTire={player.tire}
          lastLapTime={player.lapTime}
          gapToLeader={player.gapToLeader}
          gapToAhead={player.gapToAhead}
          weather={weather}
          onConfirmPit={handleConfirmPit}
          onStayOut={handleStayOut}
        />
      )}
    <div className="f1-panel flex flex-col">
      <div className="f1-panel-header">Race Actions</div>
      <div className="p-3 flex flex-col gap-3">
        {/* Pit actions */}
        <div>
          <div className="text-xs text-f1-muted mb-1.5 uppercase tracking-wider">Pit Stop</div>
          <div className="grid grid-cols-1 gap-1.5">
            <ActionBtn
              label="PIT NOW"
              icon="🔧"
              variant="red"
              onClick={() => openPitDialog('pit_now')}
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
              onClick={() => openPitDialog('attempt_undercut')}
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
              onClick={() => openPitDialog('cover_undercut')}
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
                  onClick={() => openPitDialog('react_safety_car')}
                  disabled={disabled}
                  badge="SC"
                />
              )}
              {isWet && (
                <ActionBtn
                  label="REACT TO RAIN"
                  icon="🌧"
                  variant="blue"
                  onClick={() => openPitDialog('react_rain')}
                  disabled={disabled}
                  badge="!"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
