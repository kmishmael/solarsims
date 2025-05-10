import { create } from 'zustand';
import { calculateSolarOutput } from '@/lib/solar-calculations';

interface SolarState {
    // Simulation control
    isRunning: boolean;
    simulationSpeed: number;
    currentTime: Date;
    elapsedHours: number;

    // Solar panel configuration
    panelCount: number;
    panelEfficiency: number;
    panelAngle: number;
    panelOrientation: number;
    trackerEnabled: boolean;

    // Environmental factors
    sunIntensity: number;
    temperature: number;
    cloudCover: number;
    windSpeed: number;
    dustAccumulation: number;

    // System configuration
    inverterEfficiency: number;
    wiringLosses: number;
    batteryCapacity: number;
    batteryCharge: number;

    // Output metrics
    currentOutput: number;
    dailyEnergy: number;
    totalEnergy: number;
    systemEfficiency: number;

    // Historical data
    outputHistory: { time: Date; value: number }[];
    efficiencyHistory: { time: Date; value: number }[];

    // Weather pattern
    weatherPattern: string;    // Derived states
    isTemperatureHigh: boolean;
    isBatteryLow: boolean;
    isDustHigh: boolean;
    effectiveSunIntensity: number;// Actions
    setIsRunning: (value: boolean) => void;
    setSimulationSpeed: (value: number) => void;
    setCurrentTime: (time: Date) => void;
    updateSimulation: (deltaHours: number) => void;
    resetSimulation: () => void;
    cleanPanels: () => void;
    exportData: () => void;
    applyWeatherPattern: (pattern: string) => void;

    // Panel configuration setters
    setPanelCount: (value: number) => void;
    setPanelEfficiency: (value: number) => void;
    setPanelAngle: (value: number) => void;
    setPanelOrientation: (value: number) => void;
    setTrackerEnabled: (value: boolean) => void;

    // Environmental setters
    setSunIntensity: (value: number) => void;
    setTemperature: (value: number) => void;
    setCloudCover: (value: number) => void;
    setWindSpeed: (value: number) => void;
    setDustAccumulation: (value: number) => void;

    // System configuration setters
    setInverterEfficiency: (value: number) => void;
    setWiringLosses: (value: number) => void;
    setBatteryCapacity: (value: number) => void;
}

export const useSolarStore = create<SolarState>()((set, get) => ({
    // Simulation control - initial values
    isRunning: false,
    simulationSpeed: 1,
    currentTime: new Date(),
    elapsedHours: 0,

    // Solar panel configuration - initial values
    panelCount: 100,
    panelEfficiency: 0.22,
    panelAngle: 35,
    panelOrientation: 180,
    trackerEnabled: false,

    // Environmental factors - initial values
    sunIntensity: 1000,
    temperature: 25,
    cloudCover: 0.1,
    windSpeed: 5,
    dustAccumulation: 0,

    // System configuration - initial values
    inverterEfficiency: 0.97,
    wiringLosses: 0.02,
    batteryCapacity: 500,
    batteryCharge: 250,

    // Output metrics - initial values
    currentOutput: 0,
    dailyEnergy: 0,
    totalEnergy: 0,
    systemEfficiency: 0,

    // Historical data - initial values
    outputHistory: [],
    efficiencyHistory: [],

    // Weather pattern - initial value
    weatherPattern: "sunny",    // Derived states
    get isTemperatureHigh() { return get().temperature > 35; },
    get isBatteryLow() { return get().batteryCharge / get().batteryCapacity < 0.2; },
    get isDustHigh() { return get().dustAccumulation > 0.3; },
    get effectiveSunIntensity() {
        const state = get();
        const hour = state.currentTime.getHours() + state.currentTime.getMinutes() / 60;

        // Day/night cycle affects sun intensity (simplified model)
        let timeBasedIntensity = 0;
        if (hour > 6 && hour < 18) {
            // Parabolic curve peaking at noon
            timeBasedIntensity = state.sunIntensity * (1 - Math.pow((hour - 12) / 6, 2));
        }

        // Apply weather effects
        return timeBasedIntensity * (1 - state.cloudCover);
    },

    // Actions
    setIsRunning: (value) => set({ isRunning: value }),
    setSimulationSpeed: (value) => set({ simulationSpeed: value }),
    setCurrentTime: (time) => {
        // Update the time without changing the simulation state
        set({ currentTime: time });

        // Recalculate the simulation state based on new time
        get().updateSimulation(0);
    }, updateSimulation: (deltaHours) => {
        const state = get();
        const {
            currentTime, panelCount, panelEfficiency, panelAngle, trackerEnabled,
            sunIntensity, temperature, windSpeed, dustAccumulation,
            inverterEfficiency, wiringLosses, batteryCapacity, batteryCharge
        } = state;

        // Calculate sun position based on time of day
        const hour = currentTime.getHours() + currentTime.getMinutes() / 60;

        // Get the effective intensity from the derived state
        const effectiveIntensity = state.effectiveSunIntensity;

        // Calculate effective panel angle if tracking is enabled
        let effectivePanelAngle = panelAngle;
        if (trackerEnabled) {
            // Simple tracking algorithm - follow the sun
            const sunAngle = 90 - Math.abs(((hour - 12) / 12) * 90);
            effectivePanelAngle = Math.max(10, Math.min(80, sunAngle));
        }

        // Calculate angle of incidence between sun and panels
        const sunAltitude = 90 - Math.abs(((hour - 12) / 6) * 90);
        const angleOfIncidence = Math.abs(sunAltitude - effectivePanelAngle);
        const angleEfficiency = Math.cos((angleOfIncidence * Math.PI) / 180);

        // Temperature effect on efficiency (panels lose efficiency as they heat up)
        const tempCoefficient = -0.004; // -0.4% per degree C above 25°C
        const tempEffect = 1 + tempCoefficient * (temperature - 25);

        // Wind cooling effect (higher wind speeds cool panels, improving efficiency)
        const windCoolingEffect = Math.min(0.02, windSpeed * 0.002);

        // Dust accumulation effect
        const dustEffect = 1 - dustAccumulation;

        // Calculate effective panel efficiency
        const effectiveEfficiency =
            panelEfficiency * tempEffect * (1 + windCoolingEffect) * dustEffect;

        // Calculate raw output
        const panelArea = 1.7; // m² per panel
        const rawOutput = calculateSolarOutput({
            panelCount,
            panelArea,
            sunIntensity: effectiveIntensity,
            efficiency: effectiveEfficiency,
            angleEfficiency,
        });

        // Apply system losses
        const outputAfterWiringLosses = rawOutput * (1 - wiringLosses);
        const finalOutput = outputAfterWiringLosses * inverterEfficiency;

        // Update battery charge only if time is advancing
        const energyProduced = finalOutput * deltaHours;
        let newBatteryCharge = batteryCharge + energyProduced;

        // Cap battery charge at capacity
        if (newBatteryCharge > batteryCapacity) {
            newBatteryCharge = batteryCapacity;
        }

        // Calculate overall system efficiency
        const theoreticalMax = (panelCount * panelArea * state.sunIntensity) / 1000;
        const overallEfficiency = theoreticalMax > 0 ? (finalOutput / theoreticalMax) * 100 : 0;        // Create new time for history only if time is advancing
        let newTime = currentTime;
        if (deltaHours > 0) {
            newTime = new Date(currentTime);
            newTime.setSeconds(newTime.getSeconds() + state.simulationSpeed * 60);
        }

        // Update history for graphs (limit to 100 points)
        // Only add to history if output changes or time advances
        const shouldUpdateHistory = deltaHours > 0 || state.outputHistory.length === 0 ||
            state.outputHistory[state.outputHistory.length - 1].value !== finalOutput;

        const newOutputHistory = shouldUpdateHistory
            ? [...state.outputHistory, { time: newTime, value: finalOutput }].slice(-100)
            : state.outputHistory;

        const newEfficiencyHistory = shouldUpdateHistory
            ? [...state.efficiencyHistory, { time: newTime, value: overallEfficiency }].slice(-100)
            : state.efficiencyHistory;

        // New dust accumulation - only increases when time advances
        const newDustAccumulation = deltaHours > 0
            ? Math.min(0.5, state.dustAccumulation + 0.001 * deltaHours)
            : state.dustAccumulation;        // Only update time-related values if deltaHours is non-zero
        if (deltaHours > 0) {
            // Update all values including time progression
            set({
                currentTime: newTime,
                currentOutput: finalOutput,
                dailyEnergy: state.dailyEnergy + energyProduced,
                totalEnergy: state.totalEnergy + energyProduced,
                batteryCharge: newBatteryCharge,
                systemEfficiency: overallEfficiency,
                outputHistory: newOutputHistory,
                efficiencyHistory: newEfficiencyHistory,
                dustAccumulation: newDustAccumulation,
                elapsedHours: state.elapsedHours + deltaHours,
            });
        } else {
            // Only update the current output state, not time-dependent values
            set({
                currentOutput: finalOutput,
                systemEfficiency: overallEfficiency,
                outputHistory: newOutputHistory,
                efficiencyHistory: newEfficiencyHistory,
            });
        }
    },

    resetSimulation: () => set({
        isRunning: false,
        currentTime: new Date(),
        elapsedHours: 0,
        dailyEnergy: 0,
        totalEnergy: 0,
        batteryCharge: get().batteryCapacity / 2,
        dustAccumulation: 0,
        outputHistory: [],
        efficiencyHistory: []
    }),

    cleanPanels: () => set({ dustAccumulation: 0 }),

    exportData: () => {
        const state = get();
        const data = {
            configuration: {
                panelCount: state.panelCount,
                panelEfficiency: state.panelEfficiency,
                panelAngle: state.panelAngle,
                panelOrientation: state.panelOrientation,
                trackerEnabled: state.trackerEnabled,
                inverterEfficiency: state.inverterEfficiency,
                wiringLosses: state.wiringLosses,
                batteryCapacity: state.batteryCapacity,
            },
            environment: {
                sunIntensity: state.sunIntensity,
                temperature: state.temperature,
                cloudCover: state.cloudCover,
                windSpeed: state.windSpeed,
                dustAccumulation: state.dustAccumulation,
            },
            results: {
                currentOutput: state.currentOutput,
                dailyEnergy: state.dailyEnergy,
                totalEnergy: state.totalEnergy,
                systemEfficiency: state.systemEfficiency,
                batteryCharge: state.batteryCharge,
            },
            history: {
                output: state.outputHistory,
                efficiency: state.efficiencyHistory,
            },
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "solar-simulation-data.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    applyWeatherPattern: (pattern) => {
        switch (pattern) {
            case "sunny":
                set({
                    weatherPattern: pattern,
                    cloudCover: 0.1,
                    temperature: 30,
                    windSpeed: 3,
                    sunIntensity: 1000
                });
                break;
            case "cloudy":
                set({
                    weatherPattern: pattern,
                    cloudCover: 0.7,
                    temperature: 22,
                    windSpeed: 8,
                    sunIntensity: 800
                });
                break;
            case "rainy":
                set({
                    weatherPattern: pattern,
                    cloudCover: 0.9,
                    temperature: 18,
                    windSpeed: 12,
                    sunIntensity: 400
                });
                break;
            case "windy":
                set({
                    weatherPattern: pattern,
                    cloudCover: 0.3,
                    temperature: 20,
                    windSpeed: 20,
                    sunIntensity: 900
                });
                break;
            case "hot":
                set({
                    weatherPattern: pattern,
                    cloudCover: 0.1,
                    temperature: 40,
                    windSpeed: 2,
                    sunIntensity: 1100
                });
                break;
        }
    },

    // Panel configuration setters
    setPanelCount: (value) => set({ panelCount: value }),
    setPanelEfficiency: (value) => set({ panelEfficiency: value }),
    setPanelAngle: (value) => set({ panelAngle: value }),
    setPanelOrientation: (value) => set({ panelOrientation: value }),
    setTrackerEnabled: (value) => set({ trackerEnabled: value }),

    // Environmental setters
    setSunIntensity: (value) => set({ sunIntensity: value }),
    setTemperature: (value) => set({ temperature: value }),
    setCloudCover: (value) => set({ cloudCover: value }),
    setWindSpeed: (value) => set({ windSpeed: value }),
    setDustAccumulation: (value) => set({ dustAccumulation: value }),

    // System configuration setters
    setInverterEfficiency: (value) => set({ inverterEfficiency: value }),
    setWiringLosses: (value) => set({ wiringLosses: value }),
    setBatteryCapacity: (value) => set((state) => {
        // When changing battery capacity, adjust current charge proportionally
        const newCharge = Math.min(value, state.batteryCharge * (value / state.batteryCapacity));
        return { batteryCapacity: value, batteryCharge: newCharge };
    }),
}));