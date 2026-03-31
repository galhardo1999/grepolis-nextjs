"use client";

import React from 'react';
import Image from 'next/image';
import { BUILDINGS, BuildingId } from '@/lib/constants';

interface BuildingModalProps {
  isOpen: boolean;
  onClose: () => void;
  buildingId: BuildingId | null;
  currentBuildings: Record<string, number>;
  queue: { building: BuildingId; level: number }[];
  onUpgrade: (id: BuildingId) => void;
  calculateCosts: (id: BuildingId, level: number) => { wood: number; stone: number; silver: number };
  canAfford: (costs: { wood: number; stone: number; silver: number }) => boolean;
  freePopulation: number;
}

export function BuildingModal({
  isOpen,
  onClose,
  buildingId,
  currentBuildings,
  queue,
  onUpgrade,
  calculateCosts,
  canAfford,
  freePopulation
}: BuildingModalProps) {
  if (!isOpen || !buildingId) return null;

  const renderBuildingCard = (id: BuildingId) => {
    const data = BUILDINGS[id];
    const currentLevel = currentBuildings[id] || 0;
    const pendingCount = queue.filter(q => q.building === id).length;
    const nextLevel = currentLevel + pendingCount + 1;
    const costs = calculateCosts(id, nextLevel);
    const popCost = (data as any).popCost || 0;
    const affordable = canAfford(costs);
    const hasPop = freePopulation >= popCost;

    return (
      <div key={id} className="building-card">
        <div className="info">
          <h4>{data.name} (Nível {currentLevel}{pendingCount > 0 ? ` + ${pendingCount} em fila` : ''})</h4>
          <p>{data.description}</p>
          <div className="costs">
            <small>
              <Image src="/icon_wood.png" alt="Wood" width={16} height={16} style={{ verticalAlign: 'middle' }} /> {costs.wood}{' '}
              <Image src="/icon_stone.png" alt="Stone" width={16} height={16} style={{ verticalAlign: 'middle' }} /> {costs.stone}{' '}
              <Image src="/icon_silver.png" alt="Silver" width={16} height={16} style={{ verticalAlign: 'middle' }} /> {costs.silver}{' '}
              {popCost > 0 && (
                <>
                  <Image src="/icon_pop.png" alt="Pop" width={16} height={16} style={{ verticalAlign: 'middle' }} /> {popCost}
                </>
              )}
            </small>
          </div>
        </div>
        <button 
          className="upgrade-btn" 
          disabled={!affordable || !hasPop} 
          onClick={() => onUpgrade(id)}
        >
          Melhorar para Nv. {nextLevel}
        </button>
      </div>
    );
  };

  return (
    <div id="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div id="modal-container">
        <div id="modal-header">
          <h2 id="modal-title">{buildingId === 'senate' ? 'Senado' : BUILDINGS[buildingId].name}</h2>
          <button id="close-modal" onClick={onClose}>&times;</button>
        </div>
        <div id="modal-body">
          {buildingId === 'senate' ? (
            <>
              <h3>Edificações Disponíveis</h3>
              <hr />
              <br />
              {(Object.keys(BUILDINGS) as BuildingId[]).map(id => renderBuildingCard(id))}
            </>
          ) : (
            <>
              <p>{BUILDINGS[buildingId].description}</p>
              <br />
              <p><strong>Nível Atual:</strong> {currentBuildings[buildingId] || 0}</p>
              <hr />
              {renderBuildingCard(buildingId)}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
