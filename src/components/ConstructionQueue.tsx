"use client";

import React, { useState, useEffect } from 'react';
import { BUILDINGS, BuildingId } from '@/lib/constants';

interface QueueItem {
  building: BuildingId;
  startTime: number;
  finishTime: number;
  level: number;
}

interface ConstructionQueueProps {
  queue: QueueItem[];
}

export function ConstructionQueue({ queue }: ConstructionQueueProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div id="construction-queue">
      <h3>Fila de Obras</h3>
      <div id="queue-items">
        {queue.length === 0 ? (
          <div className="queue-item">Nenhuma construção em andamento</div>
        ) : (
          queue.map((item, index) => {
            const remaining = Math.max(0, Math.ceil((item.finishTime - now) / 1000));
            return (
              <div key={index} className="queue-item">
                <span>{BUILDINGS[item.building].name} (Nv. {item.level})</span>
                <span className="timer"> {formatTime(remaining)}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
