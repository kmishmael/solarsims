import { Card, CardContent } from "@/components/ui/card";
import { useSolarStore } from "@/lib/engine";
import { Zap, Power } from "lucide-react";
import DaySimulationSlider from "./day-simulation-slider";

export default function SecondaryMetrics() {
  const {
    dailyEnergy,
    totalEnergy,
    batteryCapacity,
    panelCount,
    currentOutput,
  } = useSolarStore();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <Card className="bg-card">
        <CardContent className="p-4">
          <div className="flex items-center mb-2">
            <Zap className="h-5 w-5 text-amber-400 mr-2" />
            <span className="text-muted-foreground font-medium">
              Energy Production
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Daily</div>
              <div className="text-2xl font-bold">
                {dailyEnergy >= 1000
                  ? (dailyEnergy / 1000).toFixed(1) + " MWh"
                  : dailyEnergy.toFixed(1) + " kWh"}
              </div>
              <div className="h-1 bg-muted mt-1">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 to-amber-400"
                  style={{
                    width: `${Math.min(
                      100,
                      (dailyEnergy / (batteryCapacity * 0.8)) * 100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Total</div>
              <div className="text-2xl font-bold">
                {totalEnergy >= 1000
                  ? (totalEnergy / 1000).toFixed(1) + " MWh"
                  : totalEnergy.toFixed(1) + " kWh"}
              </div>
              <div className="h-1 bg-muted mt-1">
                <div
                  className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400"
                  style={{
                    width: `${Math.min(
                      100,
                      (totalEnergy / (batteryCapacity * 5)) * 100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-muted">
            <div className="text-xs text-muted-foreground">
              Theoretical Maximum
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium">
                {((panelCount * 625) / 1000000).toFixed(2)} MW
              </div>
              <div className="text-xs text-muted-foreground">
                (
                {((currentOutput / ((panelCount * 625) / 1000)) * 100).toFixed(
                  1
                )}
                % of capacity)
              </div>
            </div>
          </div>
        </CardContent>{" "}
      </Card>
      <DaySimulationSlider />
    </div>
  );
}
