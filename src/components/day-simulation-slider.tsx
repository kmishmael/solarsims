import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Sun, Cloud, Battery } from "lucide-react";
import { useSolarStore } from "@/lib/engine";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function DaySimulationSlider() {
  const {
    currentTime,
    effectiveSunIntensity,
    cloudCover,
    sunIntensity,
    timeAdvancementEnabled,
    setTimeAdvancementEnabled,
    setCurrentTime,
    setSunIntensity,
  } = useSolarStore();

  // Local state to track the slider value
  const [timeValue, setTimeValue] = useState(12);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [powerDistributionData, setPowerDistributionData] = useState([]);

  const MAX_INTENSITY = 1000;

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

  // Calculate the raw sun intensity based on the time of day
  const calculateRawIntensity = (time: number) => {
    // Normalized time (0 at sunrise, 1 at sunset)
    const normalizedTime = (time - 6) / 12;

    // Sin curve gives us 0 at sunrise/sunset, 1 at noon
    const intensityFactor = Math.sin(normalizedTime * Math.PI);

    // Scale to max intensity
    return Math.max(0, Math.round(intensityFactor * MAX_INTENSITY));
  };

  // Update time and sun intensity together
  const updateTimeAndIntensity = useCallback(
    (newTimeValue) => {
      setTimeValue(newTimeValue);

      // Find the closest data point in our distribution data
      const closestPoint = powerDistributionData.reduce((closest, point) => {
        return Math.abs(point.time - newTimeValue) <
          Math.abs(closest.time - newTimeValue)
          ? point
          : closest;
      }, powerDistributionData[0] || { time: 12, power: 0 });

      // Calculate the base sun intensity without cloud cover (reverse the cloud factor)
      // const staticCloudFactor = 0.2;
      const baseIntensity = closestPoint.power; // / (1 - staticCloudFactor);

      // Set the sun intensity in the store
      setSunIntensity(Math.max(0, Math.round(baseIntensity)));

      // Create a new date object with the selected time
      const newDate = new Date();
      const hours = Math.floor(newTimeValue);
      const minutes = Math.floor((newTimeValue - hours) * 60);
      newDate.setHours(hours, minutes, 0, 0);

      // Update the store time
      setCurrentTime(newDate);
    },
    [powerDistributionData, setCurrentTime, setSunIntensity]
  );
  // Handle slider change
  const handleTimeChange = (value: any) => {
    const newTimeValue = value[0];
    // When user manually adjusts the slider, switch to fixed mode
    if (timeAdvancementEnabled) {
      setTimeAdvancementEnabled(false);
    }
    updateTimeAndIntensity(newTimeValue);
  };
  // Handle chart click
  const handleChartClick = () => {
    if (hoveredPoint) {
      // When user clicks on chart, switch to fixed mode
      if (timeAdvancementEnabled) {
        setTimeAdvancementEnabled(false);
      }
      updateTimeAndIntensity(hoveredPoint.time);
    }
  };

  // Calculate sun position for visual representation
  const getSunPosition = () => {
    const normalizedTime = (timeValue - 6) / 12; // 0 at sunrise (6AM), 1 at sunset (6PM)
    const position = Math.sin(normalizedTime * Math.PI) * 100;
    return Math.max(0, Math.min(100, position));
  };

  // Get a description of the time of day
  const getTimeOfDay = () => {
    if (timeValue < 11) return "Morning";
    if (timeValue >= 11 && timeValue < 13) return "Noon";
    if (timeValue < 16) return "Afternoon";
    return "Evening";
  };

  // Calculate relative sun intensity as percentage
  const getSunIntensityPercent = () => {
    // Now using the direct sun intensity from the store
    return Math.round((effectiveSunIntensity / MAX_INTENSITY) * 100);
  };

  // Generate the static power curve on component mount only
  useEffect(() => {
    const data = [];
    for (let hour = 6; hour <= 18; hour += 0.25) {
      // Calculate power based on a bell curve peaking at noon
      const normalizedHour = (hour - 6) / 12;
      const baseIntensity = Math.sin(normalizedHour * Math.PI) * sunIntensity;

      // Apply a consistent cloud factor to create a realistic but static curve
      const staticCloudFactor = 0.2;
      const effectiveIntensity = baseIntensity; // * (1 - staticCloudFactor);

      data.push({
        time: hour,
        power: Math.max(0, Math.round(effectiveIntensity)),
        current: false, // Will be updated separately
      });
    }
    setPowerDistributionData(data);
  }, []); // Only regenerate if sunIntensity changes

  // Update the current point on the curve
  useEffect(() => {
    if (powerDistributionData.length > 0) {
      const updatedData = powerDistributionData.map((point) => ({
        ...point,
        current: Math.abs(point.time - timeValue) < 0.125, // Mark closest point as current
      }));
      setPowerDistributionData(updatedData);
    }
  }, [timeValue]);

  // Track mouse movement for clickable chart
  const handleMouseMove = (chartState: any) => {
    if (chartState.isTooltipActive && chartState.activePayload) {
      setHoveredPoint(chartState.activePayload[0].payload);
    } else {
      setHoveredPoint(null);
    }
  };

  // Get color class based on power level
  const getPowerLevelColor = () => {
    const percent = Math.floor((sunIntensity / 1000) * 100);
    if (percent > 75) return "text-green-500";
    if (percent > 40) return "text-amber-500";
    return "text-zinc-400";
  };

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const isCurrent = payload[0].payload.current;
      return (
        <div
          className={`p-2 rounded border text-xs ${
            isCurrent
              ? "bg-amber-900/60 border-amber-500"
              : "bg-zinc-800 border-zinc-700"
          }`}
        >
          <p className="text-white">{`Time: ${formatTime(
            payload[0].payload.time
          )}`}</p>
          <p className="text-amber-400">{`Power: ${payload[0].value} W/m²`}</p>
          {isCurrent && (
            <p className="text-white font-semibold mt-1">Current Position</p>
          )}
          <p className="text-zinc-400 mt-1 text-xs">
            Click to select this time
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardContent className="p-4">
        {" "}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Sun className="h-5 w-5 text-amber-400 mr-2" />
            <span className="text-zinc-300 font-medium">
              Solar Energy Simulator
            </span>
          </div>
          <div className="flex items-center">
            {cloudCover > 0.5 && (
              <Cloud className="h-4 w-4 text-zinc-400 mr-2" />
            )}{" "}
            <div
              className={`mr-2 px-2 py-1 rounded text-xs flex items-center transition-all duration-300 hover:opacity-80 cursor-pointer ${
                timeAdvancementEnabled
                  ? "bg-green-500/20 text-green-400 border border-green-600/30"
                  : "bg-red-500/20 text-red-400 border border-red-600/30"
              }`}
              onClick={() => setTimeAdvancementEnabled(!timeAdvancementEnabled)}
            >
              {timeAdvancementEnabled ? (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Auto
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Fixed
                </>
              )}
            </div>
            <span className="text-xl font-bold text-white">
              {formatTime(timeValue)}
            </span>
          </div>
        </div>
        {/* Power Distribution Curve - now with onClick */}
        <div
          className="h-40 w-full mb-4 bg-zinc-800/50 rounded-lg p-2 cursor-pointer"
          onClick={handleChartClick}
        >
          <div className="text-xs text-zinc-400 mb-1 flex justify-between">
            <span>Solar Intensity Distribution</span>
            <span className="text-zinc-500 italic">
              Click on chart to select time
            </span>
          </div>
          <ResponsiveContainer width="100%" height="90%">
            <AreaChart
              data={powerDistributionData}
              onMouseMove={handleMouseMove}
            >
              <defs>
                <linearGradient id="powerGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: "#a1a1aa" }}
                tickFormatter={formatTime}
                ticks={[6, 9, 12, 15, 18]}
                stroke="#52525b"
              />
              <YAxis hide={true} domain={[0, "dataMax + 20"]} />
              <Tooltip
                content={
                  <CustomTooltip active={undefined} payload={undefined} />
                }
                cursor={{ stroke: "#f59e0b", strokeDasharray: "3 3" }}
              />
              <Area
                type="monotone"
                dataKey="power"
                stroke="#f59e0b"
                fill="url(#powerGradient)"
                dot={(props: any) => {
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
          <div className="absolute bottom-2 left-0 text-xs text-zinc-500">
            6 AM
          </div>
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-zinc-500">
            Noon
          </div>
          <div className="absolute bottom-2 right-0 text-xs text-zinc-500">
            6 PM
          </div>
        </div>{" "}
        <div className="relative">
          <Slider
            min={6}
            max={18}
            step={0.05}
            value={[timeValue]}
            onValueChange={(value) => handleTimeChange(value)}
            className={timeAdvancementEnabled ? "opacity-90" : "opacity-100"}
          />
          {timeAdvancementEnabled && (
            <>
              <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none overflow-hidden">
                <div className="w-full h-full bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 animate-pulse"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="px-3 py-1 bg-black/70 border border-amber-500/30 rounded-full text-xs text-amber-400 shadow-lg shadow-amber-900/20 animate-pulse flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Time Advancing
                </div>
              </div>
            </>
          )}
        </div>
        {/* Rest of the component remains the same */}
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
              <div className="flex-1">
                {Math.round((sunIntensity / MAX_INTENSITY) * 100)}%
              </div>
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
            <div className="text-xs text-zinc-400">
              Current Solar Irradiance
            </div>
            <div className="text-xl font-semibold text-white">
              {Math.round(sunIntensity)} W/m²
            </div>
            <div className="text-xs text-zinc-500">
              {cloudCover > 0.1
                ? `${Math.round(sunIntensity)} W/m² without cloud cover`
                : null}
            </div>
          </div>
          <div className="flex items-center">
            <div className="text-right">
              <div className={`text-lg font-bold ${getPowerLevelColor()}`}>
                {Math.floor(sunIntensity / 1000) > 0.7
                  ? "Optimal"
                  : Math.floor(sunIntensity / 1000) > 0.4
                  ? "Moderate"
                  : "Low"}
              </div>
              <div className="text-xs text-zinc-400">Power Generation</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
