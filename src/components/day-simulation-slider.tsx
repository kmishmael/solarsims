import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Sun, Cloud, Battery } from "lucide-react";
import { useSolarStore } from "@/lib/engine";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function DaySimulationSlider() {
  const {
    currentTime,
    effectiveSunIntensity,
    cloudCover,
    sunIntensity,
    setCurrentTime,
  } = useSolarStore();

  // Local state to track the slider value
  const [timeValue, setTimeValue] = useState(12);

  // Initialize time value from the store
  useEffect(() => {
    // Get the current hour and minutes as decimal value
    const hour = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const decimalTime = hour + minutes / 60;
    
    // Clamp to 6-18 range
    const clampedTime = Math.max(6, Math.min(18, decimalTime));
    setTimeValue(clampedTime);
  }, [currentTime]);

  // Format time display (HH:MM)
  const formatTime = (hours: any) => {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  // Handle slider change
  const handleTimeChange = (value: any) => {
    const newTimeValue = value[0];
    setTimeValue(newTimeValue);

    // Create a new date object with the selected time
    const newDate = new Date();
    const hours = Math.floor(newTimeValue);
    const minutes = Math.floor((newTimeValue - hours) * 60);
    newDate.setHours(hours, minutes, 0, 0);

    // Update the store time
    setCurrentTime(newDate);
    
    // The current point on the curve will be updated by the useEffect
  };

  // Calculate sun position for visual representation
  const getSunPosition = () => {
    const normalizedTime = (timeValue - 6) / 12; // 0 at sunrise (6AM), 1 at sunset (6PM)
    const position = Math.sin(normalizedTime * Math.PI) * 100;
    return Math.max(0, Math.min(100, position));
  };

  // Get a description of the time of day
  const getTimeOfDay = () => {
    if (timeValue < 8) return "Early Morning";
    if (timeValue < 11) return "Morning";
    if (timeValue >= 11 && timeValue < 13) return "Noon";
    if (timeValue < 16) return "Afternoon";
    return "Evening";
  };

  // Calculate relative sun intensity as percentage
  const getSunIntensityPercent = () => {
    // Max sun intensity is at noon (100%)
    const maxPossibleIntensity = sunIntensity;
    const currentIntensity = effectiveSunIntensity;
    return Math.round((currentIntensity / maxPossibleIntensity) * 100);
  };

  // Generate a static solar power distribution curve
  const [powerDistributionData, setPowerDistributionData] = useState([]);
  
  // Generate the static power curve on component mount only
  useEffect(() => {
    const data = [];
    for (let hour = 6; hour <= 18; hour += 0.25) {
      // Calculate power based on a bell curve peaking at noon
      const normalizedHour = (hour - 6) / 12;
      const baseIntensity = Math.sin(normalizedHour * Math.PI) * sunIntensity;
      
      // Apply a consistent cloud factor to create a realistic but static curve
      const staticCloudFactor = 0.2;
      const effectiveIntensity = baseIntensity * (1 - staticCloudFactor);
      
      data.push({
        time: hour,
        power: Math.max(0, Math.round(effectiveIntensity)),
        current: false // Will be updated separately
      });
    }
    setPowerDistributionData(data);
  }, [sunIntensity]); // Only regenerate if sunIntensity changes
  
  // Update the current point on the curve
  useEffect(() => {
    if (powerDistributionData.length > 0) {
      const updatedData = powerDistributionData.map(point => ({
        ...point,
        current: Math.abs(point.time - timeValue) < 0.125 // Mark closest point as current
      }));
      setPowerDistributionData(updatedData);
    }
  }, [timeValue]);

  // Get color class based on power level
  const getPowerLevelColor = () => {
    const percent = getSunIntensityPercent();
    if (percent > 75) return "text-green-500";
    if (percent > 40) return "text-amber-500";
    return "text-zinc-400";
  };

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const isCurrent = payload[0].payload.current;
      return (
        <div className={`p-2 rounded border text-xs ${
          isCurrent 
            ? "bg-amber-900/60 border-amber-500" 
            : "bg-zinc-800 border-zinc-700"
        }`}>
          <p className="text-white">{`Time: ${formatTime(payload[0].payload.time)}`}</p>
          <p className="text-amber-400">{`Power: ${payload[0].value} W/m²`}</p>
          {isCurrent && <p className="text-white font-semibold mt-1">Current Position</p>}
        </div>
      );
    }
    return null;
  };

  // Use the static data instead of generating it on each render

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Sun className="h-5 w-5 text-amber-400 mr-2" />
            <span className="text-zinc-300 font-medium">Solar Energy Simulator</span>
          </div>
          <div className="flex items-center">
            {cloudCover > 0.5 && (
              <Cloud className="h-4 w-4 text-zinc-400 mr-2" />
            )}
            <span className="text-xl font-bold text-white">
              {formatTime(timeValue)}
            </span>
          </div>
        </div>

        {/* Power Distribution Curve */}
        <div className="h-40 w-full mb-4 bg-zinc-800/50 rounded-lg p-2">
          <div className="text-xs text-zinc-400 mb-1">Solar Power Distribution</div>
          <ResponsiveContainer width="100%" height="90%">
            <AreaChart data={powerDistributionData}>
              <defs>
                <linearGradient id="powerGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="time" 
                tick={{fontSize: 10, fill: '#a1a1aa'}} 
                tickFormatter={formatTime}
                ticks={[6, 9, 12, 15, 18]}
                stroke="#52525b"
              />
              <YAxis 
                hide={true} 
                domain={[0, 'dataMax + 20']} 
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="power" 
                stroke="#f59e0b" 
                fill="url(#powerGradient)" 
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  // Always return null for most points, except the current one
                  if (!payload.current) return null;
                  
                  // Render a more prominent marker for the current point
                  return (
                    <>
                      <circle 
                        cx={cx} 
                        cy={cy} 
                        r={6} 
                        fill="#f59e0b" 
                        stroke="#fff" 
                        strokeWidth={2} 
                      />
                      <circle 
                        cx={cx} 
                        cy={cy} 
                        r={12} 
                        fill="none" 
                        stroke="#f59e0b" 
                        strokeWidth={1}
                        opacity={0.6}
                      />
                    </>
                  );
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Sun path visualization */}
        <div className="relative h-10 mb-3">
          <div className="absolute w-full h-0.5 bg-zinc-700 bottom-0 rounded-full"></div>
          <div
            className="absolute bottom-0 -ml-3 transform -translate-x-1/2"
            style={{ left: `${getSunPosition()}%` }}
          >
            <Sun className="h-6 w-6 text-amber-400" />
          </div>
          <div className="absolute bottom-2 left-0 text-xs text-zinc-500">
            6 AM
          </div>
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-zinc-500">
            Noon
          </div>
          <div className="absolute bottom-2 right-0 text-xs text-zinc-500">
            6 PM
          </div>
        </div>

        <Slider
          min={6}
          max={18}
          step={0.25}
          value={[timeValue]}
          onValueChange={(value) => handleTimeChange(value)}
          className="bg-amber-500"
        />

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="bg-zinc-800/50 rounded-lg p-2">
            <div className="text-xs text-zinc-400">Time of Day</div>
            <div className="text-lg font-medium text-white">
              {getTimeOfDay()}
            </div>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-2">
            <div className="text-xs text-zinc-400">Solar Intensity</div>
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
          <div className="bg-zinc-800/50 rounded-lg p-2">
            <div className="text-xs text-zinc-400">Weather</div>
            <div className="text-lg font-medium text-white flex items-center">
              {cloudCover > 0.5 ? (
                <>
                  <Cloud className="h-4 w-4 mr-1 text-zinc-400" /> Cloudy
                </>
              ) : (
                <>
                  <Sun className="h-4 w-4 mr-1 text-amber-400" /> Clear
                </>
              )}
            </div>
          </div>
        </div>

        {/* Solar panel power generation status */}
        <div className="mt-4 p-3 rounded-lg flex items-center justify-between bg-zinc-800/50">
          <div>
            <div className="text-xs text-zinc-400">Current Solar Irradiance</div>
            <div className="text-xl font-semibold text-white">
              {Math.round(effectiveSunIntensity)} W/m²
            </div>
          </div>
          <div className="flex items-center">
            <Battery className={`h-6 w-6 mr-2 ${getPowerLevelColor()}`} />
            <div className="text-right">
              <div className={`text-lg font-bold ${getPowerLevelColor()}`}>
                {getSunIntensityPercent() > 70 ? "Optimal" : 
                 getSunIntensityPercent() > 40 ? "Moderate" : "Low"}
              </div>
              <div className="text-xs text-zinc-400">
                Power Generation
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}