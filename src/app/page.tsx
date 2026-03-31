"use client";

import React, { useState } from 'react';
import { useGameEngine } from '@/hooks/useGameEngine';
import { TopBar } from '@/components/TopBar';
import { CityView } from '@/components/CityView';
import { ConstructionQueue } from '@/components/ConstructionQueue';
import { BuildingModal } from '@/components/BuildingModal';
import { BuildingId, GodId } from '@/lib/constants';
import { DivinePowers } from '@/components/DivinePowers';

export default function Home() {
  const { 
    state, 
    isLoaded, 
    upgradeBuilding, 
    calculateCosts, 
    calculateIncome, 
    canAfford,
    resetGame,
    selectGod
  } = useGameEngine();

  const [selectedBuilding, setSelectedBuilding] = useState<BuildingId | null>(null);
  const [activeTab, setActiveTab] = useState('city');

  if (!isLoaded) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        background: '#050E1A', 
        color: '#D4AF37', 
        fontFamily: 'var(--font-heading)' 
      }}>
        <h1>Carregando Pólis...</h1>
      </div>
    );
  }

  const income = calculateIncome(state.buildings);

  return (
    <div id="app" className={selectedBuilding ? 'modal-open' : ''}>
      <TopBar 
        resources={state.resources} 
        income={income} 
        onReset={resetGame} 
      />

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex' }}>
        <CityView 
          buildings={state.buildings} 
          onBuildingClick={setSelectedBuilding} 
        />
        
        <div style={{ position: 'absolute', right: '20px', top: '100px', display: 'flex', flexDirection: 'column', gap: '40px', alignItems: 'flex-end' }}>
          <DivinePowers 
            currentGodId={state.currentGod} 
            favor={state.resources.favor} 
            maxFavor={state.resources.maxFavor} 
            onSelectGod={selectGod} 
          />
          <ConstructionQueue queue={state.queue} />
        </div>
      </div>

      <nav id="main-nav">
        <button 
          className={`nav-btn ${activeTab === 'city' ? 'active' : ''}`} 
          onClick={() => setActiveTab('city')}
        >
          Cidade
        </button>
        <button 
          className={`nav-btn ${activeTab === 'map' ? 'active' : ''}`} 
          onClick={() => setActiveTab('map')}
        >
          Mapa
        </button>
        <button 
          className={`nav-btn ${activeTab === 'reports' ? 'active' : ''}`} 
          onClick={() => setActiveTab('reports')}
        >
          Relatórios
        </button>
        <button 
          className={`nav-btn ${activeTab === 'messages' ? 'active' : ''}`} 
          onClick={() => setActiveTab('messages')}
        >
          Mensagens
        </button>
      </nav>

      <BuildingModal 
        isOpen={!!selectedBuilding} 
        onClose={() => setSelectedBuilding(null)} 
        buildingId={selectedBuilding}
        currentBuildings={state.buildings}
        queue={state.queue}
        onUpgrade={upgradeBuilding}
        calculateCosts={calculateCosts}
        canAfford={canAfford}
        freePopulation={state.resources.population}
      />
    </div>
  );
}
