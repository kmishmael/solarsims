import { create } from 'zustand';

// Use the provided calculateSolarOutput function
interface SolarOutputParams {
    panelCount: number
    panelArea: number
    sunIntensity: number
    efficiency: number
    angleEfficiency: number
}

function calculateSolarOutput({
    panelCount,
    panelArea,
    sunIntensity,
    efficiency,
    angleEfficiency,
}: SolarOutputParams): number {

    //  total panel area
    const totalArea = panelCount * panelArea

    // raw power based on solar intensity and area
    const rawPower = sunIntensity * totalArea

    // Apply efficiency factors
    const outputPower = rawPower * efficiency * angleEfficiency

    // Convert to kilowatts
    const outputKW = outputPower / 1000

    return Math.max(0, outputKW)
}

interface SolarState {
    // Simulation control
    isRunning: boolean;
    simulationSpeed: number;
    timeAdvancementEnabled: boolean; // Controls whether time advances automatically
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
    weatherPattern: string;

    // Derived states
    isTemperatureHigh: boolean;
    isBatteryLow: boolean;
    isDustHigh: boolean;
    effectiveSunIntensity: number;    // Actions
    setIsRunning: (value: boolean) => void;
    setSimulationSpeed: (value: number) => void;
    setTimeAdvancementEnabled: (value: boolean) => void;
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
    simulationSpeed: 1, // 30 seconds per simulation second (default)
    timeAdvancementEnabled: true, // Time advances automatically by default
    currentTime: new Date(),
    elapsedHours: 0,

    // Solar panel configuration - initial values
    panelCount: 100,
    panelEfficiency: 0.22,
    panelAngle: 2,
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
    weatherPattern: "sunny",

    // Derived states
    get isTemperatureHigh() { return get().temperature > 35; },
    get isBatteryLow() { return get().batteryCharge / get().batteryCapacity < 0.2; },
    get isDustHigh() { return get().dustAccumulation > 0.3; },
    // Removed effectiveSunIntensity getter as it's now calculated directly in updateSimulation
    // This helps avoid caching issues and ensures we always use fresh calculations
    get effectiveSunIntensity() {
        const state = get();
        // Use the raw sun intensity and only reduce by cloud cover
        return Math.max(0, state.sunIntensity * (1 - state.cloudCover));
    },    // Actions
    setIsRunning: (value) => set({ isRunning: value }),
    setSimulationSpeed: (value) => set({ simulationSpeed: value }),
    setTimeAdvancementEnabled: (value) => set({ timeAdvancementEnabled: value }),
    setCurrentTime: (time) => {
        // Update the time without changing the simulation state
        set({ currentTime: time });

        // Recalculate the simulation state based on new time
        get().updateSimulation(0);
    }, updateSimulation: (deltaHours) => {
        if (!get().isRunning) return;
        const state = get();
        const {
            currentTime, panelCount, panelEfficiency, panelAngle, trackerEnabled,
            temperature, windSpeed, dustAccumulation, timeAdvancementEnabled,
            inverterEfficiency, wiringLosses, batteryCapacity, batteryCharge, sunIntensity, cloudCover,
            simulationSpeed
        } = state;

        // Automatic sun intensity calculation when time advancement is enabled
        let usedSunIntensity = sunIntensity;

        // In auto mode, update the sun intensity based on time
        if (timeAdvancementEnabled) {
            const hour = currentTime.getHours() + currentTime.getMinutes() / 60;

            // Only have sun between 6am and 6pm
            if (hour >= 6 && hour <= 18) {
                // Normalized time (0 at sunrise, 1 at sunset)
                const normalizedTime = (hour - 6) / 12;

                // Sin curve gives us 0 at sunrise/sunset, 1 at noon
                const intensityFactor = Math.sin(normalizedTime * Math.PI);

                // Scale to 1000 W/m² maximum intensity
                const calculatedIntensity = Math.round(intensityFactor * 1000);

                // If the sun intensity changed significantly, update the store
                if (Math.abs(calculatedIntensity - sunIntensity) > 10) {
                    set({ sunIntensity: calculatedIntensity });
                    usedSunIntensity = calculatedIntensity;
                }
            } else {
                // No sun outside of daylight hours
                if (sunIntensity > 0) {
                    set({ sunIntensity: 0 });
                    usedSunIntensity = 0;
                }
            }
        }

        // Calculate effective panel angle if tracking is enabled
        let effectivePanelAngle = panelAngle;
        if (trackerEnabled && sunIntensity > 0) {
            // Get current sun position from time
            const hour = currentTime.getHours() + currentTime.getMinutes() / 60;
            let sunAltitude = 0;
            if (hour >= 6 && hour <= 18) {
                sunAltitude = 90 * Math.sin(Math.PI * (hour - 6) / 12);
            }

            // Simple tracking algorithm - follow the sun's elevation
            effectivePanelAngle = Math.max(10, Math.min(80, 90 - sunAltitude));
        }

        // Calculate angle of incidence between sun and panels
        // Use the time to determine sun position for angle calculation
        const hour = currentTime.getHours() + currentTime.getMinutes() / 60;
        let sunAltitude = 0;
        if (hour >= 6 && hour <= 18) {
            // Sinusoidal model for sun elevation throughout the day
            sunAltitude = 90 * Math.sin(Math.PI * (hour - 6) / 12);
        }


        // Calculate angle of incidence between sun and panels
        // Important: when sunAltitude is 0 (horizon/night), the panels don't produce
        const angleOfIncidence = sunAltitude > 0 ?
            Math.abs(sunAltitude - (90 - effectivePanelAngle)) : 90;

        // Calculate the efficiency factor from the angle of incidence
        // Cosine of angle of incidence gives the efficiency factor
        const angleEfficiency = Math.max(0, Math.cos(angleOfIncidence * Math.PI / 180));

        // Temperature effect on efficiency (panels lose efficiency as they heat up)
        const tempCoefficient = -0.004; // -0.4% per degree C above 25°C
        const tempEffect = Math.max(0.7, 1 + tempCoefficient * (temperature - 25));

        // Wind cooling effect (higher wind speeds cool panels, improving efficiency)
        const windCoolingEffect = Math.min(0.03, windSpeed * 0.002);

        // Dust accumulation effect
        const dustEffect = 1 - dustAccumulation;

        // Calculate effective panel efficiency
        const effectiveEfficiency =
            panelEfficiency * tempEffect * (1 + windCoolingEffect) * dustEffect;        // Calculate raw output
        const panelArea = 1.7; // m² per panel

        // Apply cloud cover to sun intensity
        const effectiveSunIntensity = usedSunIntensity * (1 - cloudCover);

        const rawOutput = calculateSolarOutput({
            panelCount,
            panelArea,
            sunIntensity: effectiveSunIntensity,
            efficiency: effectiveEfficiency,
            angleEfficiency,
        });

        // Apply system losses
        const outputAfterWiringLosses = rawOutput * (1 - wiringLosses);
        const finalOutput = outputAfterWiringLosses * inverterEfficiency;

        // Calculate energy produced for this time slice
        const energyProduced = finalOutput * (deltaHours || 0);

        // Update battery charge only if time is advancing
        let newBatteryCharge = batteryCharge;
        if (deltaHours > 0) {
            newBatteryCharge = Math.min(batteryCapacity, batteryCharge + energyProduced);
        }        // Calculate overall system efficiency
        const theoreticalMax = effectiveSunIntensity > 0 ?
            (panelCount * panelArea * effectiveSunIntensity) / 1000 : 0.00001;
        const overallEfficiency = (finalOutput / theoreticalMax) * 100;// Create new time object for history if advancing time
        let newTime;
        if (deltaHours > 0) {
            const adjustedDeltaHours = deltaHours * (simulationSpeed * 20);

            newTime = new Date(currentTime.getTime() + adjustedDeltaHours * 3600000);

            // If we cross midnight, reset daily energy (simplified approach)
            if (newTime.getDate() !== currentTime.getDate()) {
                state.dailyEnergy = 0;
            }

            // Keep time between 6am and 6pm for simulation purposes
            const hours = newTime.getHours();

            // If we go past 6pm, wrap to 6am
            if (hours >= 18) {
                newTime.setHours(6, 0, 0, 0);
                newTime.setDate(newTime.getDate() + 1); // Next day
            }

            // If we're before 6am, set to 6am
            if (hours < 6) {
                newTime.setHours(6, 0, 0, 0);
            }
        } else {
            newTime = currentTime;
        }

        // Only add to history if output changes significantly or time advances
        const shouldUpdateHistory =
            deltaHours > 0 ||
            state.outputHistory.length === 0 ||
            (state.outputHistory.length > 0 &&
                Math.abs(state.outputHistory[state.outputHistory.length - 1].value - finalOutput) > 0.01);

        const newOutputHistory = shouldUpdateHistory
            ? [...state.outputHistory, { time: new Date(newTime), value: finalOutput }].slice(-100)
            : state.outputHistory;

        const newEfficiencyHistory = shouldUpdateHistory
            ? [...state.efficiencyHistory, { time: new Date(newTime), value: overallEfficiency }].slice(-100)
            : state.efficiencyHistory;

        // Only increase dust accumulation if time is advancing
        const newDustAccumulation = deltaHours > 0
            ? Math.min(0.5, state.dustAccumulation + 0.001 * deltaHours)
            : state.dustAccumulation;

        // Determine what values to update based on whether time is advancing
        if (deltaHours > 0) {
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
            // If not advancing time, just update the current output metrics
            set({
                currentOutput: finalOutput,
                systemEfficiency: overallEfficiency,
                outputHistory: newOutputHistory,
                efficiencyHistory: newEfficiencyHistory,
            });
        }
    },

    resetSimulation: () => {
        const {
            panelCount,
            panelEfficiency,
            panelAngle,
            panelOrientation,
            trackerEnabled,
            inverterEfficiency,
            wiringLosses,
            batteryCapacity,
            simulationSpeed,
            timeAdvancementEnabled
        } = get();

        set({
            isRunning: false,
            simulationSpeed: simulationSpeed, // Keep user's speed setting
            timeAdvancementEnabled: timeAdvancementEnabled, // Keep time advancement setting
          //  currentTime: new Date(), // Reset to current time
            elapsedHours: 0,

            panelCount,
            panelEfficiency,
            panelAngle,
            panelOrientation,
            trackerEnabled,

            sunIntensity: 1000,
            temperature: 25,
            cloudCover: 0.1,
            windSpeed: 5,
            dustAccumulation: 0,

            inverterEfficiency,
            wiringLosses,
            batteryCapacity,
            batteryCharge: batteryCapacity / 2, // Reset to half capacity

            currentOutput: 0,
            dailyEnergy: 0,
            totalEnergy: 0,
            systemEfficiency: 0,

            // Reset historical data
            outputHistory: [],
            efficiencyHistory: [],

            // Reset weather to default sunny
            weatherPattern: "sunny"
        });

        // Update the simulation to calculate initial values
        setTimeout(() => get().updateSimulation(0), 0);
    },

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
        let newSettings = {};

        switch (pattern) {
            case "sunny":
                newSettings = {
                    weatherPattern: pattern,
                    cloudCover: 0.1,
                    temperature: 30,
                    windSpeed: 3,
                    sunIntensity: 1000
                };
                break;
            case "cloudy":
                newSettings = {
                    weatherPattern: pattern,
                    cloudCover: 0.7,
                    temperature: 22,
                    windSpeed: 8,
                    sunIntensity: 800
                };
                break;
            case "rainy":
                newSettings = {
                    weatherPattern: pattern,
                    cloudCover: 0.9,
                    temperature: 18,
                    windSpeed: 12,
                    sunIntensity: 400
                };
                break;
            case "windy":
                newSettings = {
                    weatherPattern: pattern,
                    cloudCover: 0.3,
                    temperature: 20,
                    windSpeed: 20,
                    sunIntensity: 900
                };
                break;
            case "hot":
                newSettings = {
                    weatherPattern: pattern,
                    cloudCover: 0.1,
                    temperature: 40,
                    windSpeed: 2,
                    sunIntensity: 1100
                };
                break;
            default:
                return; // Do nothing for unknown patterns
        }

        // Update state at once to avoid multiple renders
        set(newSettings);

        // Recalculate simulation with new weather conditions
        get().updateSimulation(0);
    },

    // Panel configuration setters - updated to ensure immediate recalculation
    setPanelCount: (value) => {
        set({ panelCount: Math.max(1, value) });
        get().updateSimulation(0);
    },
    setPanelEfficiency: (value) => {
        set({ panelEfficiency: Math.min(0.5, Math.max(0.05, value)) });
        get().updateSimulation(0);
    },
    setPanelAngle: (value) => {
        set({ panelAngle: Math.min(90, Math.max(0, value)) });
        get().updateSimulation(0);
    },
    setPanelOrientation: (value) => {
        set({ panelOrientation: value });
        get().updateSimulation(0);
    },
    setTrackerEnabled: (value) => {
        set({ trackerEnabled: value });
        get().updateSimulation(0);
    },

    // Environmental setters
    setSunIntensity: (value) => {
        set({ sunIntensity: Math.max(0, value) });
        setTimeout(() => get().updateSimulation(0), 0);
    },
    setTemperature: (value) => {
        set({ temperature: value });
        get().updateSimulation(0);
    },
    setCloudCover: (value) => {
        set({ cloudCover: Math.min(1, Math.max(0, value)) });
        get().updateSimulation(0);
    },
    setWindSpeed: (value) => {
        set({ windSpeed: Math.max(0, value) });
        get().updateSimulation(0);
    },
    setDustAccumulation: (value) => {
        set({ dustAccumulation: Math.min(1, Math.max(0, value)) });
        get().updateSimulation(0);
    },

    // System configuration setters
    setInverterEfficiency: (value) => {
        set({ inverterEfficiency: Math.min(1, Math.max(0.5, value)) });
        get().updateSimulation(0);
    },
    setWiringLosses: (value) => {
        set({ wiringLosses: Math.min(0.2, Math.max(0, value)) });
        get().updateSimulation(0);
    },
    setBatteryCapacity: (value) => set((state) => {
        // When changing battery capacity, adjust current charge proportionally
        const newCapacity = Math.max(1, value);
        const newCharge = Math.min(newCapacity, state.batteryCharge * (newCapacity / state.batteryCapacity));
        return { batteryCapacity: newCapacity, batteryCharge: newCharge };
    }),
}));

