import { useSolarStore } from "@/lib/engine";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "./ui/button";

export default function PresetsTab() {
  const engine = useSolarStore();
  const [customValues, setCustomValues] = useState({
    fuelInjectionRate: 50,
    load: 40,
    coolingSystemPower: 60,
    generatorExcitation: 70,
    maintenanceStatus: 100,
  });
  const [presets, setPresets] = useState([
    {
      name: "Max Power",
      cloudCover: 0.0,
      temperature: 18,
      windSpeed: 15,
      sunIntensity: 1000,
      panelEfficiency: 0.37,
      panelAngel: 2,
    },
    {
      name: "Idle Mode",
      cloudCover: 0.3,
      temperature: 24,
      windSpeed: 3,
      sunIntensity: 300,
      panelEfficiency: 0.2,
      panelAngel: 45,
    },
  ]);

  const { isRunning } = useSolarStore();

  const onParameterChange = (param: any, value: any) => {
    switch (param) {
      case "cloudCover":
        engine.setCloudCover(value);
        break;
      case "temperature":
        engine.setTemperature(value);
        break;
      case "windSpeed":
        engine.setWindSpeed(value);
        break;
      case "sunIntensity":
        engine.setSunIntensity(value);
        break;
      case "panelEfficiency":
        engine.setPanelEfficiency(value);
        break;
      case "panelAngle":
        engine.setPanelAngle(value);
        break;
    }
  };
  // Apply a preset configuration
  const applyPreset = (preset: any) => {
    if (
      isRunning &&
      !confirm(
        "Applying a preset while the engine is running may cause instability. Continue?"
      )
    ) {
      return;
    }

    setCustomValues(preset);
    Object.entries(preset).forEach(([key, value]) => {
      if (key !== "name") {
        onParameterChange(key, value as number);
      }
    });
  };

  return (
    <div className="grid grid-cols-3 gap-8 mb-4">
      {presets.length > 0 ? (
        <>
          {presets.map((preset, index) => (
            <Card
              key={index}
              className="hover:bg-zinc-700/50 transition-colors cursor-pointer"
              onClick={() => {
                applyPreset(preset)
                // scroll to top
                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });
            
            }}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{preset.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-xs text-zinc-400">
                  <div className="flex justify-between">
                    <span>Cloud Cover:</span>
                    <span>{(preset.cloudCover * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Temperature:</span>
                    <span>{preset.temperature}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wind Speed:</span>
                    <span>{preset.windSpeed} m/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sun Intensity:</span>
                    <span>{preset.sunIntensity} W/m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Panel Efficiency:</span>
                    <span>{(preset.panelEfficiency * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Panel Angle:</span>
                    <span>{preset.panelAngel}°</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-3">
                  Apply
                </Button>
              </CardContent>
            </Card>
          ))}
        </>
      ) : (
        <div className="text-center text-sm text-zinc-400">
          No presets available. Please add a preset to see it here.
        </div>
      )}
    </div>
  );
}
