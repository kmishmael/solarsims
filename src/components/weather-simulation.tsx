import { useEffect, useRef } from "react";

interface WeatherSimulationProps {
  cloudCover: number;
  windSpeed: number;
  temperature: number;
  sunIntensity: number;
  time: Date;
}

export default function WeatherSimulation({
  cloudCover,
  windSpeed,
  temperature,
  sunIntensity,
  time,
}: WeatherSimulationProps) {
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

    // Animation variables
    let animationFrameId: number;
    const clouds: Cloud[] = [];
    const raindrops: Raindrop[] = [];

    // Create clouds
    const numClouds = Math.floor(cloudCover * 10) + 1;
    for (let i = 0; i < numClouds; i++) {
      clouds.push({
        x: Math.random() * canvas.width,
        y: Math.random() * (canvas.height / 2),
        size: 30 + Math.random() * 50,
        speed: (0.5 + Math.random() * 0.5) * (windSpeed / 10),
      });
    }

    // Animation function
    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Calculate time of day
      const hour = time.getHours() + time.getMinutes() / 60;
      const isDaytime = hour >= 6 && hour <= 18;

      // Draw sky gradient
      const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);

      if (isDaytime) {
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
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw sun if it's daytime
      if (isDaytime) {
        const sunX = ((hour - 6) / 12) * canvas.width;
        const sunY =
          canvas.height * 0.3 -
          Math.sin(((hour - 6) / 12) * Math.PI) * canvas.height * 0.2;

        const sunGlow = ctx.createRadialGradient(
          sunX,
          sunY,
          0,
          sunX,
          sunY,
          50 * (sunIntensity / 1000) * (1 - cloudCover * 0.7)
        );

        sunGlow.addColorStop(0, "rgba(250, 204, 21, 1)"); // yellow-400
        sunGlow.addColorStop(0.2, "rgba(234, 179, 8, 0.8)"); // yellow-500
        sunGlow.addColorStop(1, "rgba(234, 179, 8, 0)");

        ctx.fillStyle = sunGlow;
        ctx.beginPath();
        ctx.arc(
          sunX,
          sunY,
          50 * (sunIntensity / 1000) * (1 - cloudCover * 0.7),
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      // Draw clouds
      ctx.fillStyle = `rgba(226, 232, 240, ${0.5 + cloudCover * 0.5})`; // slate-200

      clouds.forEach((cloud) => {
        // Update cloud position
        cloud.x += cloud.speed;

        // Wrap around when off-screen
        if (cloud.x > canvas.width + cloud.size) {
          cloud.x = -cloud.size;
        }

        // Draw cloud
        drawCloud(ctx, cloud.x, cloud.y, cloud.size);
      });

      // Create raindrops if cloudy enough
      if (cloudCover > 0.6 && Math.random() < cloudCover - 0.5) {
        raindrops.push({
          x: Math.random() * canvas.width,
          y: Math.random() * (canvas.height / 3),
          length: 10 + Math.random() * 10,
          speed: 5 + Math.random() * 5 + windSpeed / 2,
        });
      }

      // Draw and update raindrops
      ctx.strokeStyle = "rgba(186, 230, 253, 0.8)"; // sky-200
      ctx.lineWidth = 1;

      for (let i = raindrops.length - 1; i >= 0; i--) {
        const drop = raindrops[i];

        // Draw raindrop
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x + windSpeed / 2, drop.y + drop.length);
        ctx.stroke();

        // Update raindrop position
        drop.y += drop.speed;
        drop.x += windSpeed / 5;

        // Remove if off-screen
        if (drop.y > canvas.height) {
          raindrops.splice(i, 1);
        }
      }

      // Draw temperature indicator
      const tempGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      tempGradient.addColorStop(0, "#3b82f6"); // blue-500 (cold)
      tempGradient.addColorStop(0.5, "#10b981"); // emerald-500 (moderate)
      tempGradient.addColorStop(1, "#ef4444"); // red-500 (hot)

      const tempScale = (temperature + 10) / 60; // -10 to 50 degrees
      const tempWidth = Math.max(
        10,
        Math.min(canvas.width - 20, tempScale * canvas.width)
      );

      ctx.fillStyle = "rgba(15, 23, 42, 0.5)"; // slate-900 with opacity
      ctx.fillRect(10, canvas.height - 30, canvas.width - 20, 20);

      ctx.fillStyle = tempGradient;
      ctx.fillRect(10, canvas.height - 30, tempWidth, 20);

      ctx.fillStyle = "white";
      ctx.font = "12px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${temperature}°C`, canvas.width / 2, canvas.height - 17);

      // Draw wind indicator
      const windX = 20;
      const windY = 20;
      const windLength = Math.min(100, windSpeed * 5);

      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(windX, windY);
      ctx.lineTo(windX + windLength, windY);
      ctx.stroke();

      // Draw wind arrow
      ctx.beginPath();
      ctx.moveTo(windX + windLength, windY);
      ctx.lineTo(windX + windLength - 10, windY - 5);
      ctx.lineTo(windX + windLength - 10, windY + 5);
      ctx.closePath();
      ctx.fillStyle = "white";
      ctx.fill();

      ctx.fillText(`${windSpeed} m/s`, windX + windLength / 2, windY + 15);

      // Continue animation
      animationFrameId = requestAnimationFrame(animate);
    };

    // Start animation
    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [cloudCover, windSpeed, temperature, sunIntensity, time]);

  // Helper function to draw a cloud
  function drawCloud(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number
  ) {
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x + size * 0.35, y - size * 0.2, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x + size * 0.7, y, size * 0.45, 0, Math.PI * 2);
    ctx.arc(x + size * 0.35, y + size * 0.2, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cloud interface
  interface Cloud {
    x: number;
    y: number;
    size: number;
    speed: number;
  }

  // Raindrop interface
  interface Raindrop {
    x: number;
    y: number;
    length: number;
    speed: number;
  }

  return <canvas ref={canvasRef} className="w-full h-full" />;
}
