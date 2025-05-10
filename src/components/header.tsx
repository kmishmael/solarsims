import { Button } from "@/components/ui/button";
import { Play, Pause, RefreshCw, Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSolarStore } from "@/lib/engine";

export default function Header() {
  const { isRunning, setIsRunning, simulationSpeed, sunIntensity, effectiveSunIntensity ,setSimulationSpeed, resetSimulation, exportData } = useSolarStore();

  return (
    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-cyan-400 bg-clip-text text-transparent">
          Solar Power Plant Simulation - {sunIntensity} W/m² - {effectiveSunIntensity} W/m²
        </h1>
        <p className="text-muted-foreground">
          Advanced physics-based simulation for electrical engineering
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant={isRunning ? "destructive" : "default"}
          size="sm"
          onClick={() => setIsRunning(!isRunning)}
        >
          {isRunning ? (
            <Pause className="h-4 w-4 mr-2" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          {isRunning ? "Stop" : "Start"}
        </Button>

        <Select
          value={simulationSpeed.toString()}
          onValueChange={(value) => setSimulationSpeed(Number(value))}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Speed" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0.5">0.5x Speed</SelectItem>
            <SelectItem value="1">1x Speed</SelectItem>
            <SelectItem value="2">2x Speed</SelectItem>
            <SelectItem value="5">5x Speed</SelectItem>
            <SelectItem value="10">10x Speed</SelectItem>
            <SelectItem value="60">60x (1h/sec)</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="icon" onClick={resetSimulation}>
          <RefreshCw className="h-4 w-4" />
        </Button>

        <Button variant="outline" size="icon" onClick={exportData}>
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}