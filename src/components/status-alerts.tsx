import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSolarStore } from "@/lib/engine";


export default function StatusAlerts() {
  const { isTemperatureHigh, isBatteryLow, isDustHigh, cleanPanels } = useSolarStore();

  if (!(isTemperatureHigh || isBatteryLow || isDustHigh)) return null;

  return (
    <div className="mb-6 bg-background border rounded-lg p-3 flex items-center">
      <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
      <div className="text-sm">
        {isTemperatureHigh && <span className="mr-3">High temperature detected</span>}
        {isBatteryLow && <span className="mr-3">Battery charge low</span>}
        {isDustHigh && <span>High dust accumulation on panels</span>}
      </div>
      {isDustHigh && (
        <Button
          size="sm"
          variant="outline"
          className="ml-auto text-xs"
          onClick={cleanPanels}
        >
          Clean Panels
        </Button>
      )}
    </div>
  );
}