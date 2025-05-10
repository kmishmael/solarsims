import { useEffect, useRef } from 'react';
import { useSolarStore } from '@/store/solar-store';

export function useSimulationLoop() {
  const animationRef = useRef<number | null>(null);
  const isRunning = useSolarStore(state => state.isRunning);
  const simulationSpeed = useSolarStore(state => state.simulationSpeed);
  const updateSimulation = useSolarStore(state => state.updateSimulation);

  // Main simulation loop
  const runSimulation = (timestamp: number) => {
    if (!isRunning) return;

    // Calculate time delta (convert to hours)
    const delta = simulationSpeed / 60 / 60;
    
    // Update simulation state
    updateSimulation(delta);

    // Continue animation loop
    animationRef.current = requestAnimationFrame(runSimulation);
  };

  // Start/stop simulation
  useEffect(() => {
    if (isRunning) {
      animationRef.current = requestAnimationFrame(runSimulation);
    } else if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
    }

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, simulationSpeed]);

  return null; // This hook doesn't return anything, it just manages side effects
}