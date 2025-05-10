interface SolarOutputParams {
  panelCount: number
  panelArea: number
  sunIntensity: number
  efficiency: number
  angleEfficiency: number
}

export function calculateSolarOutput({
  panelCount,
  panelArea,
  sunIntensity,
  efficiency,
  angleEfficiency,
}: SolarOutputParams): number {
  // Calculate total panel area
  const totalArea = panelCount * panelArea

  // Calculate raw power based on solar intensity and area
  const rawPower = sunIntensity * totalArea

  // Apply efficiency factors
  const outputPower = rawPower * efficiency * angleEfficiency

  // Convert to kilowatts
  const outputKW = outputPower / 1000

  return Math.max(0, outputKW)
}
