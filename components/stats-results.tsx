"use client"

import type React from "react"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import type { GameData, GameStats } from "@/types/game-data"
import { AlertCircle } from "lucide-react"

interface StatsResultsProps {
  games: GameData[]
}

// Function to get color for Points Per Elimination
function getSPEColor(spe: number | null): string {
  if (spe === null) return "text-zinc-400"
  if (spe >= 400) return "text-blue-400" // Optimal
  if (spe >= 368) return "text-[#b6d7a8]" // Fine
  if (spe >= 320) return "text-[#ffe599]" // Suspicious
  if (spe >= 300) return "text-[#fab62c]" // Very Suspicious
  return "text-[#e06666]" // Fail
}

// Function to get rating label for Points Per Elimination
function getSPERating(spe: number | null): {
  label: string
  variant: "default" | "outline" | "secondary" | "destructive"
} {
  if (spe === null) return { label: "No data", variant: "outline" }
  if (spe >= 400) return { label: "Optimal", variant: "default" }
  if (spe >= 368) return { label: "Fine", variant: "secondary" }
  if (spe >= 320) return { label: "Suspicious", variant: "outline" }
  if (spe >= 300) return { label: "Very Suspicious", variant: "outline" }
  return { label: "Fail", variant: "destructive" }
}

// Function to get badge background color for SPE rating
function getSPEBadgeStyle(spe: number | null): React.CSSProperties {
  if (spe === null) return {}
  if (spe >= 400) return { backgroundColor: "#3b82f6" } // Optimal - blue
  if (spe >= 368) return { backgroundColor: "#b6d7a8" } // Fine - green
  if (spe >= 320) return { backgroundColor: "#ffe599" } // Suspicious - yellow
  if (spe >= 300) return { backgroundColor: "#fab62c" } // Very Suspicious - orange
  return { backgroundColor: "#e06666" } // Fail - red
}

export default function StatsResults({ games }: StatsResultsProps) {
  const gameStats = useMemo(() => {
    return games.map((game) => {
      const stats: GameStats = {
        scorePerElimination: game.eliminations > 0 ? game.score / game.eliminations : null,
        scorePerMinute: game.durationMinutes > 0 ? game.score / game.durationMinutes : null,
        eliminationsPerMinute: game.durationMinutes > 0 ? game.eliminations / game.durationMinutes : null,
        killsPerMinute: game.durationMinutes > 0 && game.kills !== null ? game.kills / game.durationMinutes : null,
        assistsPerMinute:
          game.durationMinutes > 0 && game.assists !== null ? game.assists / game.durationMinutes : null,
        deathsPerMinute: game.durationMinutes > 0 && game.deaths !== null ? game.deaths / game.durationMinutes : null,
        kdRatio: game.deaths !== null && game.deaths > 0 && game.kills !== null ? game.kills / game.deaths : null,
        eliminationDeathRatio: game.deaths !== null && game.deaths > 0 ? game.eliminations / game.deaths : null,
      }
      return { ...game, stats }
    })
  }, [games])

  const averageStats = useMemo(() => {
    if (games.length === 0) return null

    const totals = games.reduce(
      (acc, game) => {
        return {
          eliminations: acc.eliminations + game.eliminations,
          score: acc.score + game.score,
          kills: acc.kills + (game.kills !== null ? game.kills : 0),
          assists: acc.assists + (game.assists !== null ? game.assists : 0),
          deaths: acc.deaths + (game.deaths !== null ? game.deaths : 0),
          durationMinutes: acc.durationMinutes + game.durationMinutes,
          gamesWithEliminations: acc.gamesWithEliminations + (game.eliminations > 0 ? 1 : 0),
          gamesWithDuration: acc.gamesWithDuration + (game.durationMinutes > 0 ? 1 : 0),
          gamesWithDeaths: acc.gamesWithDeaths + (game.deaths !== null && game.deaths > 0 ? 1 : 0),
          gamesWithKills: acc.gamesWithKills + (game.kills !== null ? 1 : 0),
          gamesWithAssists: acc.gamesWithAssists + (game.assists !== null ? 1 : 0),
        }
      },
      {
        eliminations: 0,
        score: 0,
        kills: 0,
        assists: 0,
        deaths: 0,
        durationMinutes: 0,
        gamesWithEliminations: 0,
        gamesWithDuration: 0,
        gamesWithDeaths: 0,
        gamesWithKills: 0,
        gamesWithAssists: 0,
      },
    )

    const avgStats: GameStats = {
      scorePerElimination:
        totals.gamesWithEliminations > 0 && totals.eliminations > 0 ? totals.score / totals.eliminations : null,
      scorePerMinute:
        totals.gamesWithDuration > 0 && totals.durationMinutes > 0 ? totals.score / totals.durationMinutes : null,
      eliminationsPerMinute:
        totals.gamesWithDuration > 0 && totals.durationMinutes > 0
          ? totals.eliminations / totals.durationMinutes
          : null,
      killsPerMinute:
        totals.gamesWithDuration > 0 && totals.durationMinutes > 0 && totals.gamesWithKills > 0
          ? totals.kills / totals.durationMinutes
          : null,
      assistsPerMinute:
        totals.gamesWithDuration > 0 && totals.durationMinutes > 0 && totals.gamesWithAssists > 0
          ? totals.assists / totals.durationMinutes
          : null,
      deathsPerMinute:
        totals.gamesWithDuration > 0 && totals.durationMinutes > 0 && totals.gamesWithDeaths > 0
          ? totals.deaths / totals.durationMinutes
          : null,
      kdRatio:
        totals.gamesWithDeaths > 0 && totals.deaths > 0 && totals.gamesWithKills > 0
          ? totals.kills / totals.deaths
          : null,
      eliminationDeathRatio:
        totals.gamesWithDeaths > 0 && totals.deaths > 0 ? totals.eliminations / totals.deaths : null,
    }

    return {
      ...totals,
      stats: avgStats,
    }
  }, [games])

  if (games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
        <h3 className="text-xl font-semibold mb-2 text-blue-400">No Game Data</h3>
        <p className="text-zinc-400 max-w-md">Add some games in the Game Input tab to see your statistics here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-zinc-100">Game Statistics</h2>

      {averageStats && games.length > 1 && (
        <Card className="bg-zinc-800 border-zinc-700 overflow-hidden">
          <CardHeader className="bg-blue-900/30 border-b border-zinc-700">
            <CardTitle className="text-lg text-blue-400">Average Stats ({games.length} games)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
              <StatItem
                label="Score Per Elimination"
                value={averageStats.stats.scorePerElimination}
                colorClass={getSPEColor(averageStats.stats.scorePerElimination)}
                isSPE={true}
                speValue={averageStats.stats.scorePerElimination}
              />
              <StatItem label="Score Per Minute" value={averageStats.stats.scorePerMinute} />
              <StatItem label="Eliminations Per Minute" value={averageStats.stats.eliminationsPerMinute} />
              <StatItem label="Kills Per Minute" value={averageStats.stats.killsPerMinute} />
              <StatItem label="Assists Per Minute" value={averageStats.stats.assistsPerMinute} />
              <StatItem label="Deaths Per Minute" value={averageStats.stats.deathsPerMinute} />
              <StatItem label="K/D Ratio" value={averageStats.stats.kdRatio} />
              <StatItem label="Elimination/Death Ratio" value={averageStats.stats.eliminationDeathRatio} />
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader className="px-4 py-3 border-b border-zinc-700">
          <CardTitle className="text-lg text-zinc-300">Individual Game Stats</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <Accordion type="single" collapsible className="space-y-4">
            {gameStats.map((game, index) => (
              <AccordionItem
                key={game.id}
                value={`game-${game.id}`}
                className="border border-zinc-700 rounded-md overflow-hidden"
              >
                <AccordionTrigger className="px-4 py-3 bg-zinc-700/30 hover:bg-zinc-700/50 text-left hover:no-underline">
                  <span className="font-medium text-zinc-300">Game {index + 1}</span>
                </AccordionTrigger>
                <AccordionContent className="pt-4 px-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <StatItem
                      label="Score Per Elimination"
                      value={game.stats.scorePerElimination}
                      colorClass={getSPEColor(game.stats.scorePerElimination)}
                      isSPE={true}
                      speValue={game.stats.scorePerElimination}
                    />
                    <StatItem label="Score Per Minute" value={game.stats.scorePerMinute} />
                    <StatItem label="Eliminations Per Minute" value={game.stats.eliminationsPerMinute} />
                    <StatItem label="Kills Per Minute" value={game.stats.killsPerMinute} />
                    <StatItem label="Assists Per Minute" value={game.stats.assistsPerMinute} />
                    <StatItem label="Deaths Per Minute" value={game.stats.deathsPerMinute} />
                    <StatItem label="K/D Ratio" value={game.stats.kdRatio} />
                    <StatItem label="Elimination/Death Ratio" value={game.stats.eliminationDeathRatio} />
                  </div>

                  <div className="mt-4 pt-4 border-t border-zinc-700">
                    <h4 className="text-sm font-medium text-zinc-400 mb-2">Raw Game Data</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                      <div>
                        <span className="text-zinc-500">Eliminations:</span>{" "}
                        <span className="text-white">{game.eliminations}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Score:</span> <span className="text-white">{game.score}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Kills:</span>{" "}
                        <span className="text-white">{game.kills !== null ? game.kills : "No data"}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Assists:</span>{" "}
                        <span className="text-white">{game.assists !== null ? game.assists : "No data"}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Deaths:</span>{" "}
                        <span className="text-white">{game.deaths !== null ? game.deaths : "No data"}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Duration:</span>{" "}
                        <span className="text-white">{game.duration}</span>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}

function StatItem({
  label,
  value,
  colorClass = "text-blue-400",
  isSPE = false,
  speValue = null,
}: {
  label: string
  value: number | null
  colorClass?: string
  isSPE?: boolean
  speValue?: number | null
}) {
  return (
    <div className="bg-zinc-900 p-3 rounded-md">
      <div className="text-zinc-400 text-xs mb-1">{label}</div>
      <div className={`text-lg font-semibold ${colorClass}`}>{value !== null ? value.toFixed(2) : "No data"}</div>
      {isSPE && speValue !== null && (
        <div className="mt-1">
          <div
            className="text-xs px-2 py-0.5 rounded-full inline-block text-zinc-900 font-medium"
            style={getSPEBadgeStyle(speValue)}
          >
            {getSPERating(speValue).label}
          </div>
        </div>
      )}
    </div>
  )
}
