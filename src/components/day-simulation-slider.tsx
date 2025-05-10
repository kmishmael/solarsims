import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Sun } from "lucide-react";
import { useSolarStore } from "@/lib/engine";

export default function DaySimulationSlider() {
  const {
    currentTime,
    effectiveSunIntensity,
    cloudCover,
    sunIntensity,
    setCurrentTime,
  } = useSolarStore();

  // Local state to track the slider value
  const [timeValue, setTimeValue] = useState<number>(12);

  // Initialize time value from the store
  useEffect(() => {
    // Get the current hour and minutes as decimal value
    const hour = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    setTimeValue(hour + minutes / 60);
  }, [currentTime]);

  // Format time display (HH:MM)
  const formatTime = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  // Handle slider change
  const handleTimeChange = (value: number[]) => {
    const newTimeValue = value[0];
    setTimeValue(newTimeValue);

    // Create a new date object with the selected time
    const newDate = new Date();
    const hours = Math.floor(newTimeValue);
    const minutes = Math.floor((newTimeValue - hours) * 60);
    newDate.setHours(hours, minutes, 0, 0);

    // Update the store time
    setCurrentTime(newDate);
  };

  // Calculate sun position for visual representation
  const getSunPosition = () => {
    const normalizedTime = (timeValue - 6) / 12; // 0 at sunrise (6AM), 1 at sunset (6PM)
    const position = Math.sin(normalizedTime * Math.PI) * 100;
    return Math.max(0, Math.min(100, position));
  };

  // Get a description of the time of day
  const getTimeOfDay = () => {
    if (timeValue < 6) return "Night";
    if (timeValue < 8) return "Early Morning";
    if (timeValue < 11) return "Morning";
    if (timeValue >= 11 && timeValue < 13) return "Noon";
    if (timeValue < 16) return "Afternoon";
    if (timeValue < 18) return "Evening";
    return "Night";
  };

  // Calculate relative sun intensity as percentage
  const getSunIntensityPercent = () => {
    // Max sun intensity is at noon (100%)
    const maxPossibleIntensity = sunIntensity;
    const currentIntensity = effectiveSunIntensity;
    return Math.round((currentIntensity / maxPossibleIntensity) * 100);
  };

  return (
    <Card className="bg-gradient-to-br from-zinc-900 to-black border-zinc-800">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Sun className="h-5 w-5 text-amber-400 mr-2" />
            <span className="text-zinc-300 font-medium">Day Simulation</span>
          </div>
          <span className="text-xl font-bold text-white">
            {formatTime(timeValue)}
          </span>
        </div>

        {/* Sun path visualization */}
        <div className="relative h-12 mb-3">
          <div className="absolute w-full h-0.5 bg-zinc-700 bottom-0 rounded-full"></div>
          <div
            className="absolute bottom-0 -ml-3 transform -translate-x-1/2"
            style={{ left: `${getSunPosition()}%` }}
          >
            <Sun
              className={`h-6 w-6 ${
                timeValue >= 6 && timeValue <= 18
                  ? "text-amber-400"
                  : "text-zinc-600"
              }`}
            />
          </div>
          <div className="absolute bottom-2 left-0 text-xs text-zinc-500">
            Sunrise
          </div>
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-zinc-500">
            Noon
          </div>
          <div className="absolute bottom-2 right-0 text-xs text-zinc-500">
            Sunset
          </div>
        </div>

        <Slider
          min={0}
          max={23.75}
          step={0.25}
          value={[timeValue]}
          onValueChange={(value) => handleTimeChange(value)}
          className="[&>span]:bg-amber-500"
        />

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-zinc-800/50 rounded-lg p-2">
            <div className="text-xs text-zinc-400">Time of Day</div>
            <div className="text-lg font-medium text-white">
              {getTimeOfDay()}
            </div>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-2">
            <div className="text-xs text-zinc-400">Sun Intensity</div>
            <div className="text-lg font-medium text-white flex items-center">
              <div className="flex-1">{getSunIntensityPercent()}%</div>
              <div
                className="h-2 w-2 rounded-full ml-1"
                style={{
                  backgroundColor:
                    getSunIntensityPercent() > 70
                      ? "#f59e0b"
                      : getSunIntensityPercent() > 30
                      ? "#d97706"
                      : "#78716c",
                }}
              />
            </div>
          </div>
        </div>

        {/* Solar panel power generation status */}
        <div className="mt-4 p-2 rounded-lg text-center bg-zinc-800/50">
          <div className="text-xs text-zinc-400">Current Solar Irradiance</div>
          <div className="text-lg font-semibold text-white">
            {Math.round(effectiveSunIntensity)} W/m²
          </div>
          <div className="text-xs text-zinc-400">
            {cloudCover > 0.5
              ? "Reduced due to cloud cover"
              : timeValue < 6 || timeValue > 18
              ? "No sunlight available"
              : "Optimal conditions"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
