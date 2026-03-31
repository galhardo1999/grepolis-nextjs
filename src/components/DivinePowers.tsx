"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { GODS, GodId } from '@/lib/constants';

interface DivinePowersProps {
  currentGodId: GodId;
  favor: number;
  maxFavor: number;
  onSelectGod: (godId: GodId) => void;
}

export function DivinePowers({ currentGodId, favor, maxFavor, onSelectGod }: DivinePowersProps) {
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const currentGod = GODS[currentGodId];

  const handleSelect = (id: GodId) => {
    if (id !== currentGodId) {
      onSelectGod(id);
    }
    setIsSelectorOpen(false);
  };

  return (
    <>
      <div className="divine-powers-container">
        <div className="god-portrait-wrapper" onClick={() => setIsSelectorOpen(true)}>
          <div className="portrait-frame"></div>
          <Image
            src={currentGod.portrait}
            alt={currentGod.name}
            width={110}
            height={110}
            className="portrait-img"
          />
          <div className="favor-meter">
            <span className="bolt-icon">⚡</span>
            <span className="value">{Math.floor(favor)}</span>
          </div>
        </div>
      </div>

      {isSelectorOpen && (
        <div className="god-selector-overlay" onClick={() => setIsSelectorOpen(false)}>
          <div className="god-grid" onClick={(e) => e.stopPropagation()}>
            {(Object.keys(GODS) as GodId[]).map((id) => {
              const god = GODS[id];
              return (
                <div
                  key={id}
                  className={`god-card ${id === currentGodId ? 'active' : ''}`}
                  onClick={() => handleSelect(id)}
                >
                  <Image src={god.portrait} alt={god.name} width={100} height={100} />
                  <h4>{god.name}</h4>
                  <p>{god.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
