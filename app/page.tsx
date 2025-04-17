"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import GameInputForm from "@/components/game-input-form"
import StatsResults from "@/components/stats-results"
import type { GameData } from "@/types/game-data"

export default function Home() {
  const [games, setGames] = useState<GameData[]>([])
  const [activeTab, setActiveTab] = useState("input")

  // Load saved games from localStorage on component mount
  useEffect(() => {
    const savedGames = localStorage.getItem("gameStats")
    if (savedGames) {
      try {
        setGames(JSON.parse(savedGames))
      } catch (e) {
        console.error("Error loading saved games:", e)
        localStorage.removeItem("gameStats")
      }
    }
  }, [])

  // Save games to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("gameStats", JSON.stringify(games))
  }, [games])

  const addGame = (game: GameData) => {
    setGames([...games, game])
  }

  const updateGame = (gameId: number, updatedGame: GameData) => {
    setGames(games.map((game) => (game.id === gameId ? updatedGame : game)))
  }

  const resetGames = () => {
    if (confirm("Are you sure you want to reset all game data?")) {
      setGames([])
    }
  }

  return (
    <main className="min-h-screen bg-zinc-900 text-zinc-100 p-4 md:p-8">
      <Card className="max-w-4xl mx-auto bg-zinc-800 border-zinc-700">
        <CardHeader className="border-b border-zinc-700">
          <CardTitle className="text-2xl text-blue-400">KMC Stats Calculator</CardTitle>
          <CardDescription className="text-zinc-400">Calculate all stats and averages across games</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-2 bg-zinc-800 rounded-none border-b border-zinc-700">
              <TabsTrigger value="input" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-blue-400">
                Game Input
              </TabsTrigger>
              <TabsTrigger
                value="results"
                className="data-[state=active]:bg-zinc-700 data-[state=active]:text-blue-400"
              >
                Results
              </TabsTrigger>
            </TabsList>
            <TabsContent value="input" className="p-4">
              <GameInputForm games={games} onAddGame={addGame} onUpdateGame={updateGame} onResetGames={resetGames} />
            </TabsContent>
            <TabsContent value="results" className="p-4">
              <StatsResults games={games} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  )
}
