"use client";

import React from 'react';
import { BuildingId } from '@/lib/constants';

interface CityViewProps {
  buildings: Record<string, number>;
  onBuildingClick: (id: BuildingId) => void;
}

export function CityView({ buildings, onBuildingClick }: CityViewProps) {
  return (
    <main id="city-view">
      <div id="city-background"></div>
      
      <div className="building-slot senate" id="slot-senate" onClick={() => onBuildingClick('senate')}>
        <div className="building-label">Senado (Nv. <span className="level">{buildings.senate || 1}</span>)</div>
      </div>
      
      <div className="building-slot timber-camp" id="slot-timber" onClick={() => onBuildingClick('timber-camp')}>
        <div className="building-label">Bosque (Nv. <span className="level">{buildings['timber-camp'] || 1}</span>)</div>
      </div>
      
      <div className="building-slot quarry" id="slot-quarry" onClick={() => onBuildingClick('quarry')}>
        <div className="building-label">Pedreira (Nv. <span className="level">{buildings.quarry || 1}</span>)</div>
      </div>
      
      <div className="building-slot silver-mine" id="slot-silver" onClick={() => onBuildingClick('silver-mine')}>
        <div className="building-label">Mina de Prata (Nv. <span className="level">{buildings['silver-mine'] || 1}</span>)</div>
      </div>
    </main>
  );
}
