import "./App.css";
import SolarPlantSimulation from "@/components/solar-plant-simulation";
import { ThemeProvider } from "./providers/theme";

function App() {
  return (
    <>
      <ThemeProvider defaultTheme="dark" storageKey="solar-sim-theme">
        <main className="min-h-screen text-white">
          <SolarPlantSimulation />
        </main>
      </ThemeProvider>
    </>
  );
}

export default App;
