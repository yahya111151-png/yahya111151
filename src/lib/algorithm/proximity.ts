import type { ConnectionType, ProximityParams } from '@/types'

// Base score for each declared connection type
const CONNECTION_TYPE_BASE: Record<ConnectionType, number> = {
  family:       1.00,
  friend:       0.90,
  colleague:    0.80,
  acquaintance: 0.50,
  stranger:     0.10,
}

// How much each factor contributes to the final closeness score
const WEIGHTS = {
  interactionCount:   0.35,
  connectionType:     0.30,
  recency:            0.20,
  mutualConnections:  0.15,
}

// Logarithmic scale: 1 interaction ≈ 0.08, 10 ≈ 0.50, 50+ ≈ 1.00
function normalizeInteractionCount(count: number): number {
  return Math.min(1, Math.log10(count + 1) / Math.log10(51))
}

// Recency decay: recent interactions weigh more
function computeRecencyScore(lastInteractionAt: Date): number {
  const daysSince = (Date.now() - lastInteractionAt.getTime()) / 86_400_000
  if (daysSince <=   7) return 1.0
  if (daysSince <=  30) return 0.7
  if (daysSince <=  90) return 0.4
  if (daysSince <= 365) return 0.2
  return 0.1
}

// 0 mutual = 0, 5 ≈ 0.25, 20+ = 1.0
function normalizeMutualConnections(count: number): number {
  return Math.min(1, count / 20)
}

/**
 * Computes a closeness score (0.0–1.0) between two users.
 * Higher = rater's opinion carries more weight on the rated user's score.
 */
export function computeProximityWeight(params: ProximityParams): number {
  const interactionScore = normalizeInteractionCount(params.interactionCount)
  const connectionTypeScore = CONNECTION_TYPE_BASE[params.connectionType]
  const recencyScore = computeRecencyScore(params.lastInteractionAt)
  const mutualScore = normalizeMutualConnections(params.mutualConnectionCount)

  const closeness =
    WEIGHTS.interactionCount  * interactionScore +
    WEIGHTS.connectionType    * connectionTypeScore +
    WEIGHTS.recency           * recencyScore +
    WEIGHTS.mutualConnections * mutualScore

  return Math.round(closeness * 10_000) / 10_000
}

/**
 * Applies the proximity weight to a raw metric score.
 * Minimum effective weight is 0.10 so even strangers contribute a little.
 */
export function applyWeight(rawScore: number, proximityWeight: number): number {
  const effective = Math.max(0.1, proximityWeight)
  return Math.round(rawScore * effective * 10_000) / 10_000
}

/**
 * Human-readable label for a closeness score.
 */
export function proximityLabel(score: number): string {
  if (score >= 0.75) return 'Close contact'
  if (score >= 0.50) return 'Regular contact'
  if (score >= 0.25) return 'Occasional contact'
  return 'Distant contact'
}

/**
 * Returns the % influence this rating will carry relative to max weight.
 * Shown to the rater before they submit.
 */
export function proximityPercent(score: number): number {
  return Math.round(Math.max(0.1, score) * 100)
}
