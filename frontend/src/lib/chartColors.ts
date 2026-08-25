/**
 * Categorical chart palette — assigned in fixed order, never cycled.
 *
 * Validated for: lightness band, chroma floor, colour-vision-deficiency
 * separation (worst adjacent pair ΔE 13.0 deuteranopia / 21.3 tritanopia),
 * normal-vision separation (ΔE 24.3) and ≥3:1 contrast against a white
 * surface. Do not reorder or substitute values without re-validating.
 *
 * Slot 0 is the brand purple so the primary series always reads as "ours".
 */
export const CATEGORICAL = ['#7c3aed', '#c2870b', '#0891b2', '#be185d'] as const

/** Single hue for magnitude comparisons (bar lists, rankings). */
export const SEQUENTIAL_HUE = '#7c3aed'

export function categoricalColor(index: number): string {
  return CATEGORICAL[index] ?? '#7c7590'
}
