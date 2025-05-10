import { Card, CardContent } from "@/components/ui/card";
import { History, Sun, CloudSun, Droplets, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import SolarArrayVisualization from "./solar-array-visualization";
import { useSolarStore } from "@/lib/engine";
import DaySimulationSlider from "./day-simulation-slider";

export default function VisualizationArea() {
  const {
    panelCount,
    panelAngle,
    panelOrientation,
    trackerEnabled,
    currentTime,
    sunIntensity,
    cloudCover,
    weatherPattern,
    applyWeatherPattern,
    cleanPanels,
    temperature,
    windSpeed,
    dustAccumulation,
    setCloudCover,
    setWindSpeed,
    setTemperature,
    setDustAccumulation,
    isTemperatureHigh,
    isDustHigh,
  } = useSolarStore();

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <div className="lg:col-span-2">
        <Card className="bg-card h-full">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium">
                  Solar Array Visualization
                </h3>
                <p className="text-muted-foreground text-sm">
                  Real-time visualization with {panelCount} panels
                </p>
              </div>
              <div className="text-sm text-muted-foreground flex items-center">
                <History className="h-4 w-4 mr-1" />
                Time: {formatTime(currentTime)}
              </div>
            </div>
            <div className="aspect-video bg-background rounded-lg overflow-hidden border">
              {/* For the sake of memory, we'll use like 20 panels */}
              <SolarArrayVisualization
                panelCount={20}
                panelAngle={panelAngle}
                panelOrientation={panelOrientation}
                trackerEnabled={trackerEnabled}
                sunPosition={currentTime}
                dustAccumulation={dustAccumulation}
                cloudCover={cloudCover}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="mb-3">
          <DaySimulationSlider />
        </div>
        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="mb-4">
              <h3 className="text-lg font-medium">Environmental Conditions</h3>
              <p className="text-muted-foreground text-sm">
                Current weather parameters
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <WeatherButton
                pattern="sunny"
                currentPattern={weatherPattern}
                onClick={applyWeatherPattern}
                icon={<Sun className="h-4 w-4 mr-2" />}
                label="Sunny"
                color="amber"
              />
              <WeatherButton
                pattern="cloudy"
                currentPattern={weatherPattern}
                onClick={applyWeatherPattern}
                icon={<CloudSun className="h-4 w-4 mr-2" />}
                label="Cloudy"
                color="cyan"
              />
              <WeatherButton
                pattern="rainy"
                currentPattern={weatherPattern}
                onClick={applyWeatherPattern}
                icon={<Droplets className="h-4 w-4 mr-2" />}
                label="Rainy"
                color="cyan"
              />
              <WeatherButton
                pattern="windy"
                currentPattern={weatherPattern}
                onClick={applyWeatherPattern}
                icon={<Wind className="h-4 w-4 mr-2" />}
                label="Windy"
                color="cyan"
              />
            </div>

            <div className="space-y-4">
              <SliderControl
                label="Cloud Cover"
                value={cloudCover}
                onChange={setCloudCover}
                min={0}
                max={1}
                step={0.05}
                formatValue={(val: any) => `${(val * 100).toFixed(0)}%`}
                color="cyan"
              />
              <SliderControl
                label="Wind Speed"
                value={windSpeed}
                onChange={setWindSpeed}
                min={0}
                max={30}
                step={0.5}
                formatValue={(val: any) => `${val} m/s`}
                color="cyan"
              />
              <SliderControl
                label="Temperature"
                value={temperature}
                onChange={setTemperature}
                min={-10}
                max={50}
                step={1}
                formatValue={(val: any) => `${val}°C`}
                danger={isTemperatureHigh}
                color="red"
              />
              <SliderControl
                label="Dust Accumulation"
                value={dustAccumulation}
                onChange={setDustAccumulation}
                min={0}
                max={0.5}
                step={0.01}
                formatValue={(val: any) => `${(val * 100).toFixed(0)}%`}
                danger={isDustHigh}
                color="amber"
              />
              <Button onClick={cleanPanels} size="sm" className="w-full">
                Clean Solar Panels
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function WeatherButton({
  pattern,
  currentPattern,
  onClick,
  icon,
  label,
  color,
}: any) {
  return (
    <Button
      variant={currentPattern === pattern ? "default" : "outline"}
      onClick={() => onClick(pattern)}
      className={
        currentPattern === pattern
          ? `bg-${color}-600 hover:bg-${color}-700 border-${color}-500`
          : ""
      }
      size="sm"
    >
      {icon}
      {label}
    </Button>
  );
}

function SliderControl({
  label,
  value,
  onChange,
  min,
  max,
  step,
  formatValue,
  color,
  danger = false,
}: any) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <Label className="text-muted-foreground text-xs">{label}</Label>
        <span
          className={`text-xs ${
            danger ? `text-${color}-400` : "text-muted-foreground"
          }`}
        >
          {formatValue(value)}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(value) => onChange(value[0])}
        //className={`[&>span]:bg-${color}-500`}
      />
    </div>
  );
}
