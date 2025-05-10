import { Card, CardContent } from "@/components/ui/card";
import { Power, Gauge, Thermometer, Activity } from "lucide-react";
import { useSolarStore } from "@/lib/engine";

export default function MetricsDashboard() {
  const {
    currentOutput,
    sunIntensity,
    cloudCover,
    temperature,
    isTemperatureHigh,
    systemEfficiency,
    effectiveSunIntensity,
  } = useSolarStore();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {" "}
      <MetricCard
        icon={<Power className="h-5 w-5 text-emerald-400" />}
        title="Power Output"
        value={
          currentOutput >= 1000
            ? (currentOutput / 1000).toFixed(2)
            : currentOutput.toFixed(1)
        }
        unit={currentOutput >= 1000 ? "MW" : "kW"}
        progressValue={Math.min(100, (currentOutput / 150000) * 100)}
        progressColor="from-emerald-600 to-emerald-400"
        subtext={`${((currentOutput / 150000) * 100).toFixed(
          1
        )}% of max capacity`}
      />{" "}
      <MetricCard
        icon={<Gauge className="h-5 w-5 text-amber-400" />}
        title="Solar Irradiance"
        value={sunIntensity.toFixed(0)}
        unit="W/m²"
        progressValue={Math.min(
          100,
          (sunIntensity / 1000) * 100
        )}
        progressColor="from-amber-600 to-amber-400"
        visible={cloudCover <= 0.3}
        subtext={
          cloudCover > 0.3
            ? `Reduced by clouds (${(cloudCover * 100).toFixed(0)}%)`
            : `  `
        }
      />
      <MetricCard
        icon={
          <Thermometer
            className={`h-5 w-5 ${
              isTemperatureHigh ? "text-red-500" : "text-red-400"
            }`}
          />
        }
        title="Temperature"
        value={temperature.toFixed(1)}
        unit="°C"
        progressValue={Math.min(100, ((temperature + 10) / 60) * 100)}
        progressColor={
          isTemperatureHigh
            ? "from-red-700 to-red-500"
            : "from-red-600 to-red-400"
        }
        danger={isTemperatureHigh}
      />
      <MetricCard
        icon={<Activity className="h-5 w-5 text-emerald-400" />}
        title="Efficiency"
        value={systemEfficiency.toFixed(1)}
        unit="%"
        progressValue={Math.min(100, systemEfficiency)}
        progressColor="from-emerald-600 to-emerald-400"
      />
    </div>
  );
}

function MetricCard({
  icon,
  title,
  value,
  unit,
  progressValue,
  progressColor,
  visible = true,
  danger = false,
  subtext,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  unit: string;
  progressValue: number;
  progressColor: string;
  visible?: boolean;
  danger?: boolean;
  subtext?: string;
}) {
  return (
    <Card className="bg-card">
      <CardContent className="p-0">
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              {icon}
              <span className="text-muted-foreground font-medium ml-2">
                {title}
              </span>
            </div>
          </div>
          <div
            className={`text-4xl font-bold ${
              danger ? "text-red-500" : "text-primary"
            }`}
          >
            {value}
          </div>
          <div className="text-muted-foreground text-sm">{unit}</div>
          {visible && subtext && (
            <div className="text-xs text-muted-foreground mt-1">{subtext}</div>
          )}
        </div>
        <div className="h-1 bg-muted">
          <div
            className={`h-full bg-gradient-to-r ${progressColor} transition-all duration-300`}
            style={{ width: `${progressValue}%` }}
          ></div>
        </div>
      </CardContent>
    </Card>
  );
}
