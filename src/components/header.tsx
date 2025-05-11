import { Button } from "@/components/ui/button";
import { Play, Pause, RefreshCw, Download } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSolarStore } from "@/lib/engine";
import { ThemeToggle } from "./theme-toggle";

export default function Header() {
  const {
    isRunning,
    setIsRunning,
    simulationSpeed,
    currentTime,
    sunIntensity,
    timeAdvancementEnabled,
    effectiveSunIntensity,
    setSimulationSpeed,
    setTimeAdvancementEnabled,
    resetSimulation,
    exportData,
  } = useSolarStore();

  return (
    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-cyan-400 bg-clip-text text-transparent">
          Solar Power Plant Simulation - {JSON.stringify(timeAdvancementEnabled)}
        </h1>
        {/* <p className="text-muted-foreground">
          Advanced simulation
        </p> */}
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant={isRunning ? "destructive" : "default"}
          size="sm"
          onClick={() => setIsRunning(!isRunning)}
          className={`${
            isRunning
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-black hover:bg-neutral-800 text-white"
          }`}
        >
          {isRunning ? (
            <Pause className="h-4 w-4 mr-2" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          {isRunning ? "Stop" : "Start"}
        </Button>{" "}
        <div className="flex items-center mr-2">
          <Button
            variant="ghost"
            size="sm"
            className={`${
              timeAdvancementEnabled
                ? "bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200 dark:border-amber-700/30"
                : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-900/20 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/30"
            } text-xs`}
            onClick={() => setTimeAdvancementEnabled(!timeAdvancementEnabled)}
          >
            {timeAdvancementEnabled ? (
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
                Time: Auto
                {timeAdvancementEnabled && (
                  <span className="ml-1 w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                )}
              </div>
            ) : (
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Time: Manual
              </div>
            )}
          </Button>
        </div>
        <Select
          value={simulationSpeed.toString()}
          onValueChange={(value) => setSimulationSpeed(Number(value))}
        >
          <SelectTrigger className="w-[130px] text-black dark:text-white">
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
        <Button
          variant="outline"
          className="text-black dark:text-white"
          size="icon"
          onClick={resetSimulation}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        <ThemeToggle />
        <Button
          variant="outline"
          size="icon"
          className="text-neutral-800 dark:text-white"
          onClick={exportData}
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
