import { useEffect, useRef, useState } from "react";

interface SystemDiagramProps {
  isRunning: boolean;
  panelCount: number;
  panelEfficiency: number;
  inverterEfficiency: number;
  wiringLosses: number;
  currentOutput: number;
  powerOutput: number;
}

export default function SystemDiagram({
  isRunning,
  panelCount,
  panelEfficiency,
  inverterEfficiency,
  wiringLosses,
  currentOutput,
  powerOutput,
}: SystemDiagramProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animationFrame, setAnimationFrame] = useState<number>(0);
  const animationTimerRef = useRef<number | null>(null);

  // Animation function to update the animation frame
  useEffect(() => {
    if (isRunning) {
      const updateAnimation = () => {
        setAnimationFrame((prev) => (prev + 1) % 60);
        animationTimerRef.current = window.setTimeout(updateAnimation, 50);
      };
      
      updateAnimation();
      
      return () => {
        if (animationTimerRef.current) {
          clearTimeout(animationTimerRef.current);
        }
      };
    }
  }, [isRunning]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Improve resolution with device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    
    // Set canvas dimensions with higher resolution
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      
      const displayWidth = parent.clientWidth;
      const displayHeight = parent.clientHeight;
      
      // Set the canvas size with higher resolution
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
      
      // Scale the context to ensure correct drawing operations
      ctx.scale(dpr, dpr);
      
      // Set the CSS size to match the desired size
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    // Draw background with gradient
    const bgGradient = ctx.createLinearGradient(
      0, 
      0, 
      0, 
      canvas.height / dpr
    );
    bgGradient.addColorStop(0, "#111827"); // dark blue-gray
    bgGradient.addColorStop(1, "#030712"); // nearly black
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    // Add subtle grid pattern
    drawGrid(ctx, canvas.width / dpr, canvas.height / dpr);

    // Get the dimensions
    const canvasWidth = canvas.width / dpr;
    const canvasHeight = canvas.height / dpr;
    
    // Define component positions for horizontal layout
    const padding = Math.min(60, canvasWidth / 20); // Responsive padding
    const availableWidth = canvasWidth - (padding * 2);
    
    // Make component size responsive based on available space
    const componentWidth = Math.min(120, availableWidth / 6); // Ensure components aren't too large
    const componentHeight = Math.min(70, canvasHeight / 6);
    
    // Calculate positions for horizontal layout
    const centerY = canvasHeight / 2;
    
    // Calculate spacing based on available space
    const totalComponentWidth = componentWidth * 4; // 4 components
    const remainingSpace = availableWidth - totalComponentWidth;
    const componentSpacing = remainingSpace / 3; // Space between components
    
    // Position components horizontally in a line
    const solarArrayX = padding;
    const solarArrayY = centerY - componentHeight / 2;
    
    const wiringX = solarArrayX + componentWidth + componentSpacing;
    const wiringY = centerY - componentHeight / 2;
    
    const inverterX = wiringX + componentWidth + componentSpacing;
    const inverterY = centerY - componentHeight / 2;
    
    const loadX = inverterX + componentWidth + componentSpacing;
    const loadY = centerY - componentHeight / 2;

    // Draw solar array
    drawComponent(
      ctx,
      solarArrayX,
      solarArrayY,
      componentWidth,
      componentHeight,
      "Solar Array",
      "#10b981", // emerald-500
      isRunning,
      animationFrame
    );

    // Draw wiring component
    drawComponent(
      ctx,
      wiringX,
      wiringY,
      componentWidth,
      componentHeight,
      "Wiring",
      "#6366f1", // indigo-500
      isRunning,
      animationFrame
    );

    // Draw inverter
    drawComponent(
      ctx,
      inverterX,
      inverterY,
      componentWidth,
      componentHeight,
      "Inverter",
      "#8b5cf6", // violet-500
      isRunning,
      animationFrame
    );

    // Draw load
    drawComponent(
      ctx,
      loadX,
      loadY,
      componentWidth,
      componentHeight,
      "Load",
      "#f59e0b", // amber-500
      isRunning,
      animationFrame
    );

    // Format power output helper
    function formatPowerOutput(power: number): string {
      if (power >= 1000) {
        return `${(power / 1000).toFixed(1)} MW`;
      } else {
        return `${power.toFixed(1)} kW`;
      }
    }

    // Calculate power values
    const totalDCPower = (panelCount * panelEfficiency * 1.7 * 1000) / 1000;
    const powerAfterWiringLosses = totalDCPower * (1 - wiringLosses);
    
    // Draw connection from solar array to wiring
    const solarToWiringFlow = isRunning ? animationFrame / 60 : 0;
    drawConnection(
      ctx,
      solarArrayX + componentWidth,
      solarArrayY + componentHeight / 2,
      wiringX,
      wiringY + componentHeight / 2,
      `DC: ${formatPowerOutput(totalDCPower)}`,
      solarToWiringFlow,
      componentWidth
    );

    // Draw connection from wiring to inverter
    const wiringToInverterFlow = isRunning ? animationFrame / 60 : 0;
    drawConnection(
      ctx,
      wiringX + componentWidth,
      wiringY + componentHeight / 2,
      inverterX,
      inverterY + componentHeight / 2,
      `DC: ${formatPowerOutput(powerAfterWiringLosses)}`,
      wiringToInverterFlow,
      componentWidth
    );

    // Draw connection from inverter to load
    const inverterToLoadFlow = isRunning ? animationFrame / 60 : 0;
    drawConnection(
      ctx,
      inverterX + componentWidth,
      inverterY + componentHeight / 2,
      loadX,
      loadY + componentHeight / 2,
      `AC: ${formatPowerOutput(currentOutput)}`,
      inverterToLoadFlow,
      componentWidth
    );

    // Draw component details (below components)
    // Solar array details
    drawComponentDetails(ctx, solarArrayX, solarArrayY + componentHeight + 15, [
      `Panels: ${panelCount}`,
      `Efficiency: ${(panelEfficiency * 100).toFixed(1)}%`,
      `Area: ${(panelCount * 1.7).toFixed(1)} m²`,
      `DC Output: ${formatPowerOutput(totalDCPower)}`
    ], componentWidth);

    // Wiring details
    drawComponentDetails(ctx, wiringX, wiringY + componentHeight + 15, [
      `Wiring Loss: ${(wiringLosses * 100).toFixed(1)}%`,
      `Power Loss: ${formatPowerOutput(totalDCPower * wiringLosses)}`,
      `Efficiency: ${((1 - wiringLosses) * 100).toFixed(1)}%`
    ], componentWidth);

    // Inverter details
    drawComponentDetails(ctx, inverterX, inverterY + componentHeight + 15, [
      `Efficiency: ${(inverterEfficiency * 100).toFixed(1)}%`,
      `DC→AC Conversion`,
      `Power Loss: ${formatPowerOutput(powerAfterWiringLosses * (1 - inverterEfficiency))}`
    ], componentWidth);

    // Load details
    drawComponentDetails(ctx, loadX, loadY + componentHeight + 15, [
      `Current: ${formatPowerOutput(currentOutput)}`,
      `Daily: ${formatPowerOutput(currentOutput * 24)}h`,
      `Annual: ${(currentOutput * 24 * 365 / 1000).toFixed(1)} MWh`
    ], componentWidth);

    // Add system status indicator
    drawStatusIndicator(
      ctx, 
      canvasWidth - padding, 
      padding / 2, 
      isRunning
    );

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [
    panelCount,
    panelEfficiency,
    inverterEfficiency,
    wiringLosses,
    currentOutput,
    powerOutput,
    isRunning,
    animationFrame
  ]);

  // Helper function to draw grid pattern
  function drawGrid(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) {
    const gridSize = 30;
    ctx.strokeStyle = "rgba(75, 85, 99, 0.1)"; // gray-600 with 10% opacity
    ctx.lineWidth = 1;

    // Draw vertical lines
    for (let x = gridSize; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = gridSize; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  // Helper function to draw a component with optional animation effects
  function drawComponent(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    color: string,
    isActive: boolean,
    animationFrame: number
  ) {
    // Draw glow effect for active components
    if (isActive) {
      const glowRadius = 15;
      const glowColor = hexToRgba(color, 0.3);
      
      ctx.shadowBlur = glowRadius;
      ctx.shadowColor = color;
    } else {
      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";
    }

    // Draw shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(x + 4, y + 4, width, height);

    // Create gradient for component
    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    
    if (isActive) {
      // Brighter gradient for active state
      gradient.addColorStop(0, adjustColor(color, 20));
      gradient.addColorStop(1, color);
      
      // Add subtle pulse effect
      const pulseAmount = Math.sin(animationFrame * 0.1) * 5;
      ctx.shadowBlur = 15 + pulseAmount;
    } else {
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, adjustColor(color, -30));
    }

    // Draw component with rounded corners
    const radius = 8;
    roundRect(ctx, x, y, width, height, radius);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw component border
    ctx.strokeStyle = isActive ? "#ffffff" : adjustColor(color, 30);
    ctx.lineWidth = isActive ? 2 : 1;
    roundRect(ctx, x, y, width, height, radius);
    ctx.stroke();

    // Reset shadow for text
    ctx.shadowBlur = 0;

    // Draw label with subtle text shadow
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Add subtle text shadow
    ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    ctx.fillText(label, x + width / 2, y + height / 2);
    
    // Reset shadow
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  // Helper function to draw a connection with label and flow animation
  function drawConnection(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    label: string,
    flowPosition: number,
    componentWidth: number
  ) {
    // Responsive sizing
    const lineWidth = Math.max(2, Math.min(3, componentWidth / 40));
    
    // Calculate line properties
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    
    // Draw base line
    ctx.strokeStyle = "#52525b"; // zinc-600
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Draw animated flow particles if system is running
    if (flowPosition > 0) {
      // Draw flow particles
      const particleSpacing = Math.max(20, length / 5); // Adaptive particle spacing
      const particleCount = Math.floor(length / particleSpacing);
      
      for (let i = 0; i < particleCount; i++) {
        // Calculate particle position along the line
        const position = (i / particleCount + flowPosition) % 1;
        
        const particleX = x1 + dx * position;
        const particleY = y1 + dy * position;
        
        // Draw flow particle (small rectangle along the line)
        ctx.save();
        ctx.translate(particleX, particleY);
        ctx.rotate(angle);
        
        // Draw a glow around particle
        ctx.shadowColor = "#60a5fa"; // blue-400
        ctx.shadowBlur = 8;
        
        const particleWidth = Math.min(12, componentWidth / 10);
        ctx.fillStyle = "#60a5fa"; // blue-400
        ctx.fillRect(-particleWidth/2, -lineWidth / 2, particleWidth, lineWidth);
        
        ctx.restore();
      }
    }

    // Draw arrowhead - scale with component size
    const arrowSize = Math.min(12, componentWidth / 10);

    ctx.fillStyle = "#52525b"; // zinc-600
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
    ctx.fill();

    // Calculate positions for label
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    // Only draw label if there's enough space
    if (length > componentWidth / 2) {
      // Responsive font size
      const fontSize = Math.min(12, componentWidth / 10);
      ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
      
      // Create a better label background
      ctx.fillStyle = "#18181b"; // zinc-900
      const textWidth = ctx.measureText(label).width;
      const labelBgWidth = textWidth + 16;
      const labelBgHeight = fontSize + 12;
      const labelYOffset = 15; // Distance from line
      
      // Draw rounded rectangle for label with shadow
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      roundRect(
        ctx,
        midX - labelBgWidth / 2,
        midY - labelBgHeight / 2 - labelYOffset, // Moved up to not overlap with line
        labelBgWidth,
        labelBgHeight,
        6
      );
      ctx.fill();
      
      // Reset shadow
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
  
      // Draw label border
      ctx.strokeStyle = "#27272a"; // zinc-800
      ctx.lineWidth = 1;
      roundRect(
        ctx,
        midX - labelBgWidth / 2,
        midY - labelBgHeight / 2 - labelYOffset,
        labelBgWidth,
        labelBgHeight,
        6
      );
      ctx.stroke();
  
      // Draw label text
      ctx.fillStyle = "#ffffff"; // white
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, midX, midY - labelYOffset);
    }
  }

  // Helper function to draw component details
  function drawComponentDetails(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    details: string[],
    componentWidth: number ) {
    // Responsive font size and line height
    const fontSize = Math.min(12, componentWidth / 10);
    const lineHeight = fontSize + 6;
    const padding = 6;
    
    // Set font before measuring
    ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
    
    const maxWidth = details.reduce((max, detail) => {
      const width = ctx.measureText(detail).width;
      return width > max ? width : max;
    }, 0);
    
    const panelWidth = maxWidth + padding * 2;
    const panelHeight = details.length * lineHeight + padding * 2;
    
    // Center the panel over the component
    const centeredX = x + componentWidth / 2 - panelWidth / 2;
    
    // Draw rounded rect background with subtle shadow
    ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    ctx.fillStyle = "rgba(24, 24, 27, 0.8)"; // zinc-900 with opacity
    roundRect(ctx, centeredX - padding, y - padding, panelWidth, panelHeight, 6);
    ctx.fill();
    
    // Reset shadow
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Draw border
    ctx.strokeStyle = "#3f3f46"; // zinc-700
    ctx.lineWidth = 1;
    roundRect(ctx, centeredX - padding, y - padding, panelWidth, panelHeight, 6);
    ctx.stroke();

    // Draw details text
    ctx.fillStyle = "#d4d4d8"; // zinc-300
    ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    details.forEach((detail, index) => {
      ctx.fillText(detail, centeredX + panelWidth / 2 - padding, y + index * lineHeight);
    });
  }

  // Draw system status indicator
  function drawStatusIndicator(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    isActive: boolean
  ) {
    const radius = 8;
    const labelText = isActive ? "System Active" : "System Inactive";
    
    // Draw indicator circle with glow effect
    ctx.beginPath();
    ctx.arc(x - radius * 2, y, radius, 0, Math.PI * 2);
    
    if (isActive) {
      // Active state with glow
      ctx.shadowColor = "#10b981"; // emerald-500
      ctx.shadowBlur = 10;
      ctx.fillStyle = "#10b981"; // emerald-500
    } else {
      // Inactive state
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#71717a"; // zinc-500
    }
    
    ctx.fill();
    
    // Reset shadow
    ctx.shadowBlur = 0;
    
    // Draw status text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 12px Inter, system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(labelText, x - radius * 4, y);
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
      .padStart(2, "0")}${newB
      .toString(16)
      .padStart(2, "0")}`;
  }
  
  // Helper function to convert hex color to rgba
  function hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  return <canvas ref={canvasRef} className="w-full h-full" />;
}