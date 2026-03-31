"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { BUILDINGS, INITIAL_STATE, GameState, BuildingId, GAME_SPEED, MAX_QUEUE_SIZE, FAVOR_PRODUCTION_BASE, GodId } from '@/lib/constants';

export function useGameEngine() {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [isLoaded, setIsLoaded] = useState(false);
  const stateRef = useRef(state);

  // Sync ref with state for the interval
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Set loaded on mount to start client-only logic
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const calculateIncome = (buildings: Record<string, number>) => {
    return {
      wood: (buildings['timber-camp'] || 0) * BUILDINGS['timber-camp'].productionMultiplier * 6,
      stone: (buildings['quarry'] || 0) * BUILDINGS['quarry'].productionMultiplier * 6,
      silver: (buildings['silver-mine'] || 0) * BUILDINGS['silver-mine'].productionMultiplier * 6
    };
  };

  const calculateMaxPopulation = (farmLevel: number) => {
    return 100 + (farmLevel - 1) * 20; // 100 base, +20 per level
  };

  const calculateMaxResources = (warehouseLevel: number) => {
    return 1000 + (warehouseLevel * 500); // 1500 at level 1, +500 per level
  };

  const processQueue = (currentState: GameState, now: number) => {
    let changed = false;
    while (currentState.queue.length > 0 && now >= currentState.queue[0].finishTime) {
      const task = currentState.queue.shift()!;
      currentState.buildings[task.building]++;
      
      // Update capacities if necessary
      if (task.building === 'farm') {
        currentState.resources.maxPopulation = calculateMaxPopulation(currentState.buildings.farm);
        // Free population increases because the "total" space increased
        currentState.resources.population += 20; 
      } else if (task.building === 'warehouse') {
        currentState.resources.maxResources = calculateMaxResources(currentState.buildings.warehouse);
      }
      
      changed = true;
    }
    return changed;
  };

  // Game Loop
  useEffect(() => {
    if (!isLoaded) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const currentState = { ...stateRef.current };
      const diff = ((now - currentState.lastUpdate) / 1000) * GAME_SPEED;
      const income = calculateIncome(currentState.buildings);

      // Update resources with cap
      const maxRes = currentState.resources.maxResources;
      currentState.resources.wood = Math.min(maxRes, currentState.resources.wood + (income.wood / 3600) * diff);
      currentState.resources.stone = Math.min(maxRes, currentState.resources.stone + (income.stone / 3600) * diff);
      currentState.resources.silver = Math.min(maxRes, currentState.resources.silver + (income.silver / 3600) * diff);
      
      // Update Divine Favor
      const favorIncome = FAVOR_PRODUCTION_BASE * GAME_SPEED;
      currentState.resources.favor = Math.min(
        currentState.resources.maxFavor,
        currentState.resources.favor + (favorIncome / 3600) * diff
      );

      // Process queue
      const queueChanged = processQueue(currentState, now);

      currentState.lastUpdate = now;
      setState(currentState);
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoaded]);

  const upgradeBuilding = (buildingId: BuildingId) => {
    const building = BUILDINGS[buildingId];
    const pendingCount = state.queue.filter(q => q.building === buildingId).length;
    
    // Check queue limit
    if (state.queue.length >= MAX_QUEUE_SIZE) {
      return { success: false, reason: 'Fila de obras cheia (Máximo 10)' };
    }

    const currentLevel = (state.buildings[buildingId] || 0) + pendingCount;
    const nextLevel = currentLevel + 1;

    const costs = calculateCosts(buildingId, nextLevel);
    const popCost = (building as any).popCost || 0;

    if (canAfford(costs) && state.resources.population >= popCost) {
      const newState = { ...state };
      newState.resources.wood -= costs.wood;
      newState.resources.stone -= costs.stone;
      newState.resources.silver -= costs.silver;
      newState.resources.population -= popCost;

      const baseTime = building.baseTime;
      const time = baseTime * Math.pow(building.timeMultiplier, nextLevel);
      const senateBonus = 1 - (state.buildings['senate'] * 0.05);
      const finalTime = (time * senateBonus) / GAME_SPEED;

      const now = Date.now();
      const startTime = newState.queue.length > 0
        ? newState.queue[newState.queue.length - 1].finishTime
        : now;

      newState.queue.push({
        building: buildingId,
        startTime: startTime,
        finishTime: startTime + (finalTime * 1000),
        level: nextLevel
      });

      setState(newState);
      return { success: true };
    }

    if (state.resources.population < popCost) {
      return { success: false, reason: 'População insuficiente (Melhore a Quinta)' };
    }

    return { success: false, reason: 'Recursos insuficientes' };
  };

  const calculateCosts = (buildingId: BuildingId, level: number) => {
    const building = BUILDINGS[buildingId];
    const multiplier = Math.pow(building.costMultiplier, level - 1);
    return {
      wood: Math.floor(building.baseCost.wood * multiplier),
      stone: Math.floor(building.baseCost.stone * multiplier),
      silver: Math.floor(building.baseCost.silver * multiplier)
    };
  };

  const canAfford = (costs: { wood: number, stone: number, silver: number }) => {
    return state.resources.wood >= costs.wood &&
           state.resources.stone >= costs.stone &&
           state.resources.silver >= costs.silver;
  };

  const resetGame = () => {
    if (confirm("Tem certeza que deseja resetar TODA a sua pólis? Isso apagará seu progresso atual.")) {
      setState(INITIAL_STATE);
    }
  };

  const selectGod = (godId: GodId) => {
    if (confirm(`Deseja selecionar ${godId.toUpperCase()} como seu deus? Seus pontos de favor serão resetados.`)) {
      setState(prev => ({
        ...prev,
        currentGod: godId,
        resources: {
          ...prev.resources,
          favor: 0
        }
      }));
    }
  };

  return {
    state,
    isLoaded,
    upgradeBuilding,
    calculateCosts,
    calculateIncome,
    canAfford,
    resetGame,
    selectGod
  };
}
