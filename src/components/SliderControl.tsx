//  <SliderControl
//               label="Panel Tilt Angle"
//               value={panelAngle}
//               onChange={setPanelAngle}
//               min={0}
//               max={90}
//               step={1}
//               formatValue={(val: any) => `${val}°`}
//               color="emerald"
//               disabled={trackerEnabled}

import { Label } from "./ui/label";
import { Slider } from "./ui/slider";

//             />
interface SliderControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  formatValue: (value: number) => string;
  color?: string;
  danger?: boolean;
  disabled?: boolean;
}

export default function SliderControl({
  label,
  value,
  onChange,
  min,
  max,
  step,
  formatValue,
  color,
  disabled,
  danger,
}: SliderControlProps) {
  return (
    <>
      <div>
        <div className="flex justify-between mb-4">
          <Label className="text-zinc-200 text-sm">{label}</Label>
          <span className="text-zinc-200 text-sm">{formatValue(value)}</span>
        </div>
        <Slider
          min={min}
          max={max}
          disabled={disabled}
          step={step}
          value={[value]}
          onValueChange={(value) => onChange(value[0])}
        />
      </div>
    </>
  );
}
