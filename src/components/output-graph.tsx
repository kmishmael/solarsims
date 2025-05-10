import { useEffect, useRef } from "react";

interface OutputGraphProps {
  data: { time: Date; value: number }[];
}

export default function OutputGraph({ data }: OutputGraphProps) {
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

    // Draw grid
    ctx.strokeStyle = "#27272a"; // zinc-800
    ctx.lineWidth = 1;

    // Horizontal grid lines
    const gridLinesY = 5;
    for (let i = 1; i < gridLinesY; i++) {
      const y = (canvas.height / gridLinesY) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Vertical grid lines
    const gridLinesX = 6;
    for (let i = 1; i < gridLinesX; i++) {
      const x = (canvas.width / gridLinesX) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = "#3f3f46"; // zinc-700
    ctx.lineWidth = 2;

    // X-axis
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 20);
    ctx.lineTo(canvas.width, canvas.height - 20);
    ctx.stroke();

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(40, 0);
    ctx.lineTo(40, canvas.height);
    ctx.stroke();

    // Draw data
    if (data.length > 1) {
      // Find max value for scaling
      const maxValue = Math.max(...data.map((d) => d.value)) * 1.1 || 1;

      // Create gradient for line
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "rgba(16, 185, 129, 1)"); // emerald-500
      gradient.addColorStop(1, "rgba(16, 185, 129, 0.1)");

      // Plot line
      ctx.strokeStyle = "#10b981"; // emerald-500
      ctx.lineWidth = 2;
      ctx.beginPath();

      data.forEach((point, index) => {
        const x = 40 + ((canvas.width - 60) / (data.length - 1)) * index;
        const y =
          canvas.height - 20 - (canvas.height - 40) * (point.value / maxValue);

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Fill area under the line
      ctx.fillStyle = gradient;
      ctx.lineTo(40 + (canvas.width - 60), canvas.height - 20);
      ctx.lineTo(40, canvas.height - 20);
      ctx.fill();

      // Draw points
      ctx.fillStyle = "#10b981"; // emerald-500
      data.forEach((point, index) => {
        const x = 40 + ((canvas.width - 60) / (data.length - 1)) * index;
        const y =
          canvas.height - 20 - (canvas.height - 40) * (point.value / maxValue);

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Y-axis labels
      ctx.fillStyle = "#71717a"; // zinc-500
      ctx.font = "10px Inter, sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";

      for (let i = 0; i <= 5; i++) {
        const value = (maxValue / 5) * i;
        const y = canvas.height - 20 - ((canvas.height - 40) / 5) * i;
        ctx.fillText(`${value.toFixed(1)} kW`, 35, y);
      }

      // Draw X-axis labels (time)
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      const labelIndices = [0, Math.floor(data.length / 2), data.length - 1];
      labelIndices.forEach((index) => {
        if (index < data.length) {
          const x = 40 + ((canvas.width - 60) / (data.length - 1)) * index;
          const time = data[index].time.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          ctx.fillText(time, x, canvas.height - 15);
        }
      });
    } else {
      // No data message
      ctx.fillStyle = "#71717a"; // zinc-500
      ctx.font = "14px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("No data available", canvas.width / 2, canvas.height / 2);
    }

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [data]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}
