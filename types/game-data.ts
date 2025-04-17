export interface GameData {
  id: number
  eliminations: number
  score: number
  kills: number | null
  assists: number | null
  deaths: number | null
  duration: string // Format: "hh:mm:ss"
  durationMinutes: number // Duration converted to minutes for calculations
}

export interface GameStats {
  pointsPerElimination: number | null
  scorePerMinute: number | null
  eliminationsPerMinute: number | null
  killsPerMinute: number | null
  assistsPerMinute: number | null
  deathsPerMinute: number | null
  kdRatio: number | null
  eliminationDeathRatio: number | null
}
