"use client";

import React from 'react';
import Image from 'next/image';

interface TopBarProps {
  resources: {
    wood: number;
    stone: number;
    silver: number;
    population: number;
    maxPopulation: number;
    maxResources: number;
  };
  income: {
    wood: number;
    stone: number;
    silver: number;
  };
  onReset: () => void;
}

export function TopBar({ resources, income, onReset }: TopBarProps) {
  return (
    <header id="top-bar">
      <div className="city-info">
        <h1 id="city-name">Polis de Apolo</h1>
      </div>
      <div className="resource-container">
        <button id="reset-btn" title="Reiniciar Jogo" onClick={onReset}>🔄</button>
        
        <div className="resource" id="res-wood" title={`Madeira (Capacidade: ${resources.maxResources})`}>
          <Image src="/icon_wood.png" alt="Wood" width={28} height={28} />
          <span className={`value ${resources.wood >= resources.maxResources ? 'full' : ''}`}>
            {Math.floor(resources.wood)} / {resources.maxResources}
          </span>
          <span className="income">+{Math.floor(income.wood)}/h</span>
        </div>

        <div className="resource" id="res-stone" title={`Pedra (Capacidade: ${resources.maxResources})`}>
          <Image src="/icon_stone.png" alt="Stone" width={28} height={28} />
          <span className={`value ${resources.stone >= resources.maxResources ? 'full' : ''}`}>
            {Math.floor(resources.stone)} / {resources.maxResources}
          </span>
          <span className="income">+{Math.floor(income.stone)}/h</span>
        </div>

        <div className="resource" id="res-silver" title={`Prata (Capacidade: ${resources.maxResources})`}>
          <Image src="/icon_silver.png" alt="Silver" width={28} height={28} />
          <span className={`value ${resources.silver >= resources.maxResources ? 'full' : ''}`}>
            {Math.floor(resources.silver)} / {resources.maxResources}
          </span>
          <span className="income">+{Math.floor(income.silver)}/h</span>
        </div>

        <div className="resource" id="res-pop" title="População Livre / Capacidade Total">
          <Image src="/icon_pop.png" alt="Population" width={28} height={28} />
          <span className={`value ${resources.population <= 0 ? 'empty' : ''}`}>
            {resources.population} / {resources.maxPopulation}
          </span>
        </div>
      </div>
    </header>
  );
}
