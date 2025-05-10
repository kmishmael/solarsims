import { useEffect, useRef } from "react";

interface SolarArrayVisualizationProps {
  panelCount?: number;
  panelAngle: number;
  panelOrientation: number;
  trackerEnabled: boolean;
  sunPosition: Date;
  dustAccumulation: number;
  cloudCover: number;
}

export default function SolarArrayVisualization({
  panelCount=20,
  panelAngle,
  panelOrientation,
  trackerEnabled,
  sunPosition,
  dustAccumulation,
  cloudCover,
}: SolarArrayVisualizationProps) {
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

    // Calculate sun position
    const hour = sunPosition.getHours() + sunPosition.getMinutes() / 60;
    const sunX = (hour / 24) * canvas.width;
    const sunY =
      canvas.height * 0.2 -
      Math.sin(((hour - 6) / 12) * Math.PI) * canvas.height * 0.15;

    // Draw sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.5);

    // Simulate wind speed (you can adjust this value)
    const windSpeed = 5;

    if (hour >= 6 && hour <= 18) {
      // Daytime
      const timeOfDay = Math.abs((hour - 12) / 6);
      const blueIntensity = Math.max(0.5, 1 - timeOfDay - cloudCover * 0.5);

      skyGradient.addColorStop(0, `rgba(56, 189, 248, ${blueIntensity})`); // sky-400
      skyGradient.addColorStop(1, "rgba(14, 165, 233, 0.3)"); // sky-500 with opacity
    } else {
      // Nighttime
      skyGradient.addColorStop(0, "rgba(15, 23, 42, 0.9)"); // slate-900
      skyGradient.addColorStop(1, "rgba(2, 6, 23, 0.95)"); // slate-950
    }

    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.5);

    // Draw ground
    const groundGradient = ctx.createLinearGradient(
      0,
      canvas.height * 0.5,
      0,
      canvas.height
    );
    groundGradient.addColorStop(0, "#18181b"); // zinc-900
    groundGradient.addColorStop(1, "#09090b"); // zinc-950

    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, canvas.height * 0.5, canvas.width, canvas.height * 0.5);

    // Draw sun if it's daytime
    if (hour >= 6 && hour <= 18) {
      const sunGlow = ctx.createRadialGradient(
        sunX,
        sunY,
        0,
        sunX,
        sunY,
        50 * (1 - cloudCover * 0.7)
      );

      sunGlow.addColorStop(0, "rgba(250, 204, 21, 1)"); // yellow-400
      sunGlow.addColorStop(0.2, "rgba(234, 179, 8, 0.8)"); // yellow-500
      sunGlow.addColorStop(1, "rgba(234, 179, 8, 0)");

      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 50 * (1 - cloudCover * 0.7), 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw clouds
    if (cloudCover > 0) {
      const numClouds = Math.floor(cloudCover * 10) + 1;

      for (let i = 0; i < numClouds; i++) {
        const cloudX =
          (i / numClouds) * canvas.width +
          (((Date.now() / 10000) * windSpeed) % canvas.width);
        const cloudY = canvas.height * 0.15 + (i % 3) * 30;
        const cloudSize = 30 + (i % 5) * 10;

        ctx.fillStyle = `rgba(226, 232, 240, ${0.5 + cloudCover * 0.5})`; // slate-200
        drawCloud(ctx, cloudX, cloudY, cloudSize);
      }
    }

    // Calculate panel layout
    const panelsPerRow = Math.min(20, Math.ceil(Math.sqrt(panelCount)));
    const rows = Math.ceil(panelCount / panelsPerRow);

    const panelWidth = (canvas.width * 0.8) / panelsPerRow;
    const panelHeight = panelWidth * 1.7;
    const panelSpacing = panelWidth * 0.2;

    const startX =
      (canvas.width -
        (panelsPerRow * (panelWidth + panelSpacing) - panelSpacing)) /
      2;
    const startY = canvas.height * 0.6;

    // Calculate effective panel angle if tracking is enabled
    let effectivePanelAngle = panelAngle;
    if (trackerEnabled) {
      // Simple tracking algorithm - follow the sun
      const sunAngle = 90 - Math.abs(((hour - 12) / 12) * 90);
      effectivePanelAngle = Math.max(10, Math.min(80, sunAngle));
    }

    // Draw solar panels
    let panelsDrawn = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < panelsPerRow; col++) {
        if (panelsDrawn >= panelCount) break;

        const x = startX + col * (panelWidth + panelSpacing);
        const y = startY + row * (panelHeight * 0.3 + panelSpacing);

        drawSolarPanel(
          ctx,
          x,
          y,
          panelWidth,
          panelHeight,
          effectivePanelAngle,
          dustAccumulation
        );

        panelsDrawn++;
      }
    }

    // Draw mounting structure
    ctx.fillStyle = "#27272a"; // zinc-800
    ctx.fillRect(
      canvas.width * 0.1,
      canvas.height * 0.5,
      canvas.width * 0.8,
      canvas.height * 0.05
    );

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [
    panelCount,
    panelAngle,
    panelOrientation,
    trackerEnabled,
    sunPosition,
    dustAccumulation,
    cloudCover,
  ]);

  // Helper function to draw a cloud
  function drawCloud(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number
  ) {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.arc(x + size * 0.5, y - size * 0.4, size * 0.8, 0, Math.PI * 2);
    ctx.arc(x + size, y, size * 0.9, 0, Math.PI * 2);
    ctx.arc(x + size * 0.5, y + size * 0.4, size * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  // Helper function to draw a solar panel
  function drawSolarPanel(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    angle: number,
    dustAccumulation: number
  ) {
    // Save the current context state
    ctx.save();

    // Move to the bottom center of the panel
    ctx.translate(x + width / 2, y + height);

    // Rotate based on the panel angle
    ctx.rotate((-angle * Math.PI) / 180);

    // Draw the panel frame
    ctx.fillStyle = "#18181b"; // zinc-900
    ctx.fillRect(-width / 2 - 2, -height - 2, width + 4, height + 4);

    // Create panel gradient
    const panelGradient = ctx.createLinearGradient(
      -width / 2,
      -height,
      width / 2,
      0
    );
    panelGradient.addColorStop(0, "#10b981"); // emerald-500
    panelGradient.addColorStop(1, "#059669"); // emerald-600

    // Draw the panel surface
    const dustColor = `rgba(210, 180, 140, ${dustAccumulation})`;

    ctx.fillStyle = panelGradient;
    ctx.fillRect(-width / 2, -height, width, height);

    // Add panel reflection/shine
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.beginPath();
    ctx.moveTo(-width / 2, -height);
    ctx.lineTo(width / 2, -height);
    ctx.lineTo(-width / 2, 0);
    ctx.closePath();
    ctx.fill();

    // Draw dust layer if present
    if (dustAccumulation > 0) {
      ctx.fillStyle = dustColor;
      ctx.globalAlpha = dustAccumulation;
      ctx.fillRect(-width / 2, -height, width, height);
      ctx.globalAlpha = 1;
    }

    // Draw panel grid lines
    ctx.strokeStyle = "#0f172a"; // slate-900
    ctx.lineWidth = 1;

    // Horizontal grid lines
    const cellsY = 6;
    for (let i = 1; i < cellsY; i++) {
      ctx.beginPath();
      ctx.moveTo(-width / 2, -height + (height / cellsY) * i);
      ctx.lineTo(width / 2, -height + (height / cellsY) * i);
      ctx.stroke();
    }

    // Vertical grid lines
    const cellsX = 3;
    for (let i = 1; i < cellsX; i++) {
      ctx.beginPath();
      ctx.moveTo(-width / 2 + (width / cellsX) * i, -height);
      ctx.lineTo(-width / 2 + (width / cellsX) * i, 0);
      ctx.stroke();
    }

    // Draw mounting bracket
    ctx.fillStyle = "#27272a"; // zinc-800
    ctx.fillRect(-width / 6, 0, width / 3, height / 3);

    // Restore the context
    ctx.restore();
  }

  return <canvas ref={canvasRef} className="w-full h-full" />;
}
