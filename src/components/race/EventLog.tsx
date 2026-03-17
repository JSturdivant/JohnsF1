'use client';
import React, { useEffect, useRef } from 'react';
import { RaceEvent } from '@/types';

interface EventLogProps {
  events: RaceEvent[];
  maxEvents?: number;
}

const TYPE_ICONS: Record<RaceEvent['type'], string> = {
  incident:    '⚠',
  weather:     '🌦',
  safety_car:  '🚗',
  vsc:         '⚠',
  red_flag:    '🚩',
  pit:         '🔧',
  strategy:    '📋',
  position:    '↑',
  info:        'ℹ',
};

const SEVERITY_COLORS: Record<RaceEvent['severity'], string> = {
  info:     '#4CAF50',
  warning:  '#FF9800',
  critical: '#F44336',
};

const TYPE_COLORS: Record<RaceEvent['type'], string> = {
  incident:   '#F44336',
  weather:    '#4FC3F7',
  safety_car: '#FF9800',
  vsc:        '#FFB74D',
  red_flag:   '#F44336',
  pit:        '#CE93D8',
  strategy:   '#81C784',
  position:   '#64B5F6',
  info:       '#9E9E9E',
};

export default function EventLog({ events, maxEvents = 100 }: EventLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new events
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [events.length]);

  const visible = events.slice(-maxEvents).reverse();

  return (
    <div className="f1-panel flex flex-col" style={{ minHeight: 0 }}>
      <div className="f1-panel-header flex items-center justify-between">
        <span>Engineer Channel / Event Log</span>
        <span className="text-xs text-f1-muted">{events.length} messages</span>
      </div>
      <div
        ref={containerRef}
        className="overflow-y-auto flex-1 flex flex-col-reverse"
        style={{ maxHeight: 320, minHeight: 120 }}
      >
        <div>
          {visible.map((event, i) => (
            <div
              key={i}
              className={`event-entry ${event.severity}`}
              style={{ borderLeftColor: SEVERITY_COLORS[event.severity] }}
            >
              <div className="flex items-start gap-2">
                <span style={{ color: TYPE_COLORS[event.type], fontSize: 11 }}>
                  {TYPE_ICONS[event.type]}
                </span>
                <div className="flex-1">
                  <span className="text-f1-muted text-xs mr-1">[L{event.lap}]</span>
                  <span
                    className="text-xs"
                    style={{ color: event.severity === 'critical' ? '#ff8888' : event.severity === 'warning' ? '#ffbb66' : '#c0c0d0' }}
                  >
                    {event.message}
                  </span>
                </div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
