import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Power, Activity, Settings, Battery } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import OutputGraph from "./output-graph";
import EfficiencyGraph from "./efficiency-graph";
import SystemDiagram from "./system-diagram";
import { useSolarStore } from "@/lib/engine";
import SliderControl from "./SliderControl";

export default function ControlTabs() {
  return (
    <Tabs defaultValue="output" className="w-full min-h-[600px]">
      <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto p-1 rounded-lg">
        <TabsTrigger value="output" className="rounded">
          Output Data
        </TabsTrigger>
        <TabsTrigger value="system" className="rounded">
          System Config
        </TabsTrigger>
        <TabsTrigger value="advanced" className="rounded">
          Advanced
        </TabsTrigger>
      </TabsList>

      <TabsContent value="output" className="mt-6">
        <OutputTab />
      </TabsContent>

      <TabsContent value="system" className="mt-6">
        <SystemTab />
      </TabsContent>

      <TabsContent value="advanced" className="mt-6">
        <AdvancedTab />
      </TabsContent>
    </Tabs>
  );
}

function OutputTab() {
  const { outputHistory, efficiencyHistory } = useSolarStore();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="bg-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Power Output</h3>
            <Power className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="aspect-video bg-background rounded-lg overflow-hidden border">
            <OutputGraph data={outputHistory} />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">System Efficiency</h3>
            <Activity className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="aspect-video bg-background rounded-lg overflow-hidden border">
            <EfficiencyGraph data={efficiencyHistory} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SystemTab() {
  const {
    panelCount,
    setPanelCount,
    panelEfficiency,
    setPanelEfficiency,
    panelAngle,
    setPanelAngle,
    trackerEnabled,
    setTrackerEnabled,
    inverterEfficiency,
    setInverterEfficiency,
    wiringLosses,
    setWiringLosses
  } = useSolarStore();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="bg-card">
        <CardContent className="p-4">
          <div className="flex items-center mb-4">
            <Settings className="h-5 w-5 text-muted-foreground mr-2" />
            <h3 className="text-lg font-medium">Solar Array Configuration</h3>
          </div>
          <div className="space-y-4">
            <SliderControl
              label="Number of Panels (625W each)"
              value={panelCount}
              onChange={setPanelCount}
              min={1000}
              max={240000}
              step={1000}
              formatValue={(val) =>
                `${val} | ${((val * 625) / 1000000).toFixed(2)} MW capacity`
              }
              color="emerald"
            />
            <SliderControl
              label="Panel Efficiency"
              value={panelEfficiency}
              onChange={setPanelEfficiency}
              min={0.1}
              max={0.5}
              step={0.01}
              formatValue={(val: any) => `${(val * 100).toFixed(1)}%`}
              color="emerald"
            />
            <SliderControl
              label="Panel Tilt Angle"
              value={panelAngle}
              onChange={setPanelAngle}
              min={0}
              max={90}
              step={1}
              formatValue={(val: any) => `${val}°`}
              color="emerald"
              disabled={trackerEnabled}
            />
            <div className="flex items-center space-x-2">
              <Switch
                id="tracker"
                checked={trackerEnabled}
                onCheckedChange={setTrackerEnabled}
              />
              <Label htmlFor="tracker">Enable Solar Tracking</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardContent className="p-4">
          <div className="flex items-center mb-4">
            <Battery className="h-5 w-5 text-emerald-400 mr-2" />
            <h3 className="text-lg font-medium">System Configuration</h3>
          </div>
          <div className="space-y-4">
            <SliderControl
              label="Inverter Efficiency"
              value={inverterEfficiency}
              onChange={setInverterEfficiency}
              min={0.8}
              max={0.99}
              step={0.01}
              formatValue={(val: any) => `${(val * 100).toFixed(1)}%`}
              color="emerald"
            />
            <SliderControl
              label="Wiring Losses"
              value={wiringLosses}
              onChange={setWiringLosses}
              min={0.01}
              max={0.1}
              step={0.01}
              formatValue={(val: any) => `${(val * 100).toFixed(1)}%`}
              color="red"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AdvancedTab() {
  const {
    panelCount,
    panelEfficiency,
    panelAngle,
    trackerEnabled,
    inverterEfficiency,
    wiringLosses,
    batteryCharge,
    batteryCapacity,
    currentOutput,
    weatherPattern,
    sunIntensity,
    temperature,
    cloudCover,
    windSpeed,
    dustAccumulation,
    dailyEnergy,
    totalEnergy,
    systemEfficiency,
    elapsedHours,
    exportData,
  } = useSolarStore();

  return (
    <Card className="bg-card">
      <CardContent className="p-4">
        <div className="flex items-center mb-4">
          <Settings className="h-5 w-5 text-muted-foreground mr-2" />
          <h3 className="text-lg font-medium">System Diagram</h3>
        </div>
        <div className="aspect-video bg-background rounded-lg overflow-hidden border">
          <SystemDiagram
            panelCount={panelCount}
            panelEfficiency={panelEfficiency}
            inverterEfficiency={inverterEfficiency}
            wiringLosses={wiringLosses}
            batteryCharge={batteryCharge}
            batteryCapacity={batteryCapacity}
            currentOutput={currentOutput}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div>
            <h4 className="text-sm font-medium mb-2">Configuration</h4>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>
                <span className="text-foreground">Panels:</span> {panelCount}{" "}
                units
              </li>
              <li>
                <span className="text-foreground">Panel Efficiency:</span>{" "}
                {(panelEfficiency * 100).toFixed(1)}%
              </li>
              <li>
                <span className="text-foreground">Panel Angle:</span>{" "}
                {panelAngle}°
              </li>
              <li>
                <span className="text-foreground">Tracking:</span>{" "}
                {trackerEnabled ? "Enabled" : "Disabled"}
              </li>
              <li>
                <span className="text-foreground">Inverter Efficiency:</span>{" "}
                {(inverterEfficiency * 100).toFixed(1)}%
              </li>
              <li>
                <span className="text-foreground">Wiring Losses:</span>{" "}
                {(wiringLosses * 100).toFixed(1)}%
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Environment</h4>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>
                <span className="text-foreground">Weather:</span>{" "}
                {weatherPattern.charAt(0).toUpperCase() +
                  weatherPattern.slice(1)}
              </li>
              <li>
                <span className="text-foreground">Solar Irradiance:</span>{" "}
                {sunIntensity} W/m²
              </li>
              <li>
                <span className="text-foreground">Temperature:</span>{" "}
                {temperature}°C
              </li>
              <li>
                <span className="text-foreground">Cloud Cover:</span>{" "}
                {(cloudCover * 100).toFixed(0)}%
              </li>
              <li>
                <span className="text-foreground">Wind Speed:</span> {windSpeed}{" "}
                m/s
              </li>
              <li>
                <span className="text-foreground">Dust Accumulation:</span>{" "}
                {(dustAccumulation * 100).toFixed(0)}%
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Results</h4>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>
                <span className="text-foreground">Current Output:</span>{" "}
                {currentOutput.toFixed(2)} kW
              </li>
              <li>
                <span className="text-foreground">Daily Energy:</span>{" "}
                {dailyEnergy.toFixed(1)} kWh
              </li>
              <li>
                <span className="text-foreground">Total Energy:</span>{" "}
                {totalEnergy.toFixed(1)} kWh
              </li>
              <li>
                <span className="text-foreground">System Efficiency:</span>{" "}
                {systemEfficiency.toFixed(1)}%
              </li>
              <li>
                <span className="text-foreground">Battery Charge:</span>{" "}
                {batteryCharge.toFixed(1)} kWh
              </li>
              <li>
                <span className="text-foreground">Battery Level:</span>{" "}
                {((batteryCharge / batteryCapacity) * 100).toFixed(0)}%
              </li>
              <li>
                <span className="text-foreground">Simulation Time:</span>{" "}
                {elapsedHours.toFixed(1)} hours
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6">
          <Button onClick={exportData} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Export Simulation Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
