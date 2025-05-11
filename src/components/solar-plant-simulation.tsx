import { useEffect, useRef } from "react";
import { useTheme } from "@/hooks/use-theme";
import { useSolarStore } from "@/lib/engine";

// Components
import Header from "@/components/header";
import StatusAlerts from "@/components/status-alerts";
import MetricsDashboard from "@/components/metrics-dashboard";
import SecondaryMetrics from "@/components/secondary-metrics";
import VisualizationArea from "@/components/visualization-area";
import ControlTabs from "@/components/control-tabs";
import type { Theme } from "@/providers/theme";

export default function SolarPlantSimulation() {
  const { theme, setTheme } = useTheme();
  const {
    isRunning,
    simulationSpeed,
    timeAdvancementEnabled,
    updateSimulation,
    setPanelCount,
    setCurrentTime,
    setSunIntensity,
  } = useSolarStore();

  const animationRef = useRef<number | null>(null);
  const lastFrameTime = useRef<number>(0);

  useEffect(() => {
    // Set theme based on user preference or default to dark
    const preferredTheme = (localStorage.getItem("theme") as Theme) || "dark";
    setTheme(preferredTheme);

    // Initialize simulation with starting values
    setPanelCount(240000);

    // Set a default time (noon) for better initial visualization
    const defaultTime = new Date();
    defaultTime.setHours(12, 0, 0, 0);

    setSunIntensity(1000); // Set default sun intensity
    setCurrentTime(defaultTime);

    // Initial calculation with no time advancement
    updateSimulation(0);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []); // Main simulation loop
  const runSimulation = (timestamp: number) => {
    if (!isRunning) return;

    if (lastFrameTime.current === 0) {
      lastFrameTime.current = timestamp;
    }

    // Calculate time difference in seconds
    const deltaSeconds = (timestamp - lastFrameTime.current) / 1000;

    // Convert to simulation hours based on speed
    // If time advancement is disabled, delta will be zero
    const delta = timeAdvancementEnabled
      ? (deltaSeconds * simulationSpeed) / 3600
      : 0;

    // Only update if enough time has passed or if we still need to update outputs without time advancement
    if (delta > 0.001 || (!timeAdvancementEnabled && deltaSeconds > 0.1)) {
      // Pass delta as 0 if time advancement is disabled
      updateSimulation(timeAdvancementEnabled ? delta : 0);
      lastFrameTime.current = timestamp;
    }

    animationRef.current = requestAnimationFrame(runSimulation);
  };

  // Start/stop simulation
  useEffect(() => {
    if (isRunning) {
      lastFrameTime.current = 0; // Reset last frame time when starting
      animationRef.current = requestAnimationFrame(runSimulation);
    } else if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
    }

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning]);

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <Header />
      <StatusAlerts />
      <MetricsDashboard />
      <VisualizationArea />
      <ControlTabs />
    </div>
  );
}
