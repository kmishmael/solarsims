import { useEffect, useRef } from "react";

interface SystemDiagramProps {
  panelCount: number;
  panelEfficiency: number;
  inverterEfficiency: number;
  wiringLosses: number;
  batteryCharge: number;
  batteryCapacity: number;
  currentOutput: number;
}

export default function SystemDiagram({
  panelCount,
  panelEfficiency,
  inverterEfficiency,
  wiringLosses,
  batteryCharge,
  batteryCapacity,
  currentOutput,
}: SystemDiagramProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = "#000000"; // black
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Define component positions
    const padding = 40;
    const componentWidth = 120;
    const componentHeight = 60;

    const solarArrayX = padding;
    const solarArrayY = padding;

    const inverterX = canvas.width / 2 - componentWidth / 2;
    const inverterY = padding;

    const batteryX = canvas.width - padding - componentWidth;
    const batteryY = padding;

    const loadX = canvas.width / 2 - componentWidth / 2;
    const loadY = canvas.height - padding - componentHeight;

    // Draw solar array
    drawComponent(
      ctx,
      solarArrayX,
      solarArrayY,
      componentWidth,
      componentHeight,
      "Solar Array",
      "#10b981"
    ); // emerald-500

    // Draw inverter
    drawComponent(
      ctx,
      inverterX,
      inverterY,
      componentWidth,
      componentHeight,
      "Inverter",
      "#8b5cf6"
    ); // violet-500

    // Draw battery
    drawComponent(
      ctx,
      batteryX,
      batteryY,
      componentWidth,
      componentHeight,
      "Battery",
      "#3b82f6"
    ); // blue-500

    // Draw load
    drawComponent(
      ctx,
      loadX,
      loadY,
      componentWidth,
      componentHeight,
      "Load",
      "#f59e0b"
    ); // amber-500

    // Draw connections
    ctx.strokeStyle = "#52525b"; // zinc-600
    ctx.lineWidth = 3;

    // Solar array to inverter
    drawConnection(
      ctx,
      solarArrayX + componentWidth,
      solarArrayY + componentHeight / 2,
      inverterX,
      inverterY + componentHeight / 2,
      `DC: ${((panelCount * panelEfficiency * 1.7 * 1000) / 1000).toFixed(
        1
      )} kW`
    );

    // Inverter to battery
    drawConnection(
      ctx,
      inverterX + componentWidth,
      inverterY + componentHeight / 2,
      batteryX,
      batteryY + componentHeight / 2,
      `DC: ${(currentOutput * (1 / inverterEfficiency)).toFixed(1)} kW`
    );

    // Inverter to load
    drawConnection(
      ctx,
      inverterX + componentWidth / 2,
      inverterY + componentHeight,
      loadX + componentWidth / 2,
      loadY,
      `AC: ${currentOutput.toFixed(1)} kW`
    );

    // Battery to load
    drawConnection(
      ctx,
      batteryX + componentWidth / 2,
      batteryY + componentHeight,
      loadX + componentWidth,
      loadY + componentHeight / 2,
      `Storage: ${batteryCharge.toFixed(1)} kWh`
    );

    // Draw component details
    // Solar array details
    drawComponentDetails(ctx, solarArrayX, solarArrayY + componentHeight + 10, [
      `Panels: ${panelCount}`,
      `Efficiency: ${(panelEfficiency * 100).toFixed(1)}%`,
      `Area: ${(panelCount * 1.7).toFixed(1)} m²`,
    ]);

    // Inverter details
    drawComponentDetails(ctx, inverterX, inverterY + componentHeight + 10, [
      `Efficiency: ${(inverterEfficiency * 100).toFixed(1)}%`,
      `Wiring Loss: ${(wiringLosses * 100).toFixed(1)}%`,
    ]);

    // Battery details
    drawComponentDetails(ctx, batteryX, batteryY + componentHeight + 10, [
      `Charge: ${((batteryCharge / batteryCapacity) * 100).toFixed(0)}%`,
      `Capacity: ${batteryCapacity} kWh`,
    ]);

    // Load details
    drawComponentDetails(ctx, loadX, loadY - 50, [
      `Current: ${currentOutput.toFixed(1)} kW`,
      `Daily: ${(currentOutput * 24).toFixed(1)} kWh`,
    ]);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [
    panelCount,
    panelEfficiency,
    inverterEfficiency,
    wiringLosses,
    batteryCharge,
    batteryCapacity,
    currentOutput,
  ]);

  // Helper function to draw a component
  function drawComponent(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    color: string
  ) {
    // Draw shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(x + 3, y + 3, width, height);

    // Create gradient for component
    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, adjustColor(color, -30));

    // Draw component
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);

    // Draw component border
    ctx.strokeStyle = adjustColor(color, 30);
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);

    // Draw label
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 12px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + width / 2, y + height / 2);
  }

  // Helper function to draw a connection with label
  function drawConnection(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    label: string
  ) {
    // Draw line
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Draw arrowhead
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const arrowSize = 10;

    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - arrowSize * Math.cos(angle - Math.PI / 6),
      y2 - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      x2 - arrowSize * Math.cos(angle + Math.PI / 6),
      y2 - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = "#52525b"; // zinc-600
    ctx.fill();

    // Draw label
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    // Create label background
    ctx.fillStyle = "#18181b"; // zinc-900
    const textWidth = ctx.measureText(label).width;
    const labelBgWidth = textWidth + 10;
    const labelBgHeight = 20;

    // Draw rounded rectangle for label
    roundRect(
      ctx,
      midX - labelBgWidth / 2,
      midY - labelBgHeight / 2,
      labelBgWidth,
      labelBgHeight,
      4
    );
    ctx.fill();

    // Draw label border
    ctx.strokeStyle = "#27272a"; // zinc-800
    ctx.lineWidth = 1;
    roundRect(
      ctx,
      midX - labelBgWidth / 2,
      midY - labelBgHeight / 2,
      labelBgWidth,
      labelBgHeight,
      4
    );
    ctx.stroke();

    // Draw label text
    ctx.fillStyle = "#d4d4d8"; // zinc-300
    ctx.font = "10px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, midX, midY);
  }

  // Helper function to draw component details
  function drawComponentDetails(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    details: string[]
  ) {
    ctx.fillStyle = "#a1a1aa"; // zinc-400
    ctx.font = "10px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    details.forEach((detail, index) => {
      ctx.fillText(detail, x, y + index * 15);
    });
  }

  // Helper function to draw rounded rectangle
  function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  // Helper function to adjust color brightness
  function adjustColor(color: string, amount: number): string {
    // Convert hex to RGB
    const hex = color.replace("#", "");
    const r = Number.parseInt(hex.substring(0, 2), 16);
    const g = Number.parseInt(hex.substring(2, 4), 16);
    const b = Number.parseInt(hex.substring(4, 6), 16);

    // Adjust brightness
    const newR = Math.max(0, Math.min(255, r + amount));
    const newG = Math.max(0, Math.min(255, g + amount));
    const newB = Math.max(0, Math.min(255, b + amount));

    // Convert back to hex
    return `#${newR.toString(16).padStart(2, "0")}${newG
      .toString(16)
      .padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;
  }

  return <canvas ref={canvasRef} className="w-full h-full" />;
}
