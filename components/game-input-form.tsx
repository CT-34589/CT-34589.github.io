"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import type { GameData } from "@/types/game-data"
import { Clock, Trash2, Plus, Calculator, AlertTriangle } from "lucide-react"
import { convertTimeToMinutes, normalizeTimeInput } from "@/lib/time-utils"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface GameInputFormProps {
  games: GameData[]
  onAddGame: (game: GameData) => void
  onUpdateGame: (gameId: number, updatedGame: GameData) => void
  onResetGames: () => void
}

// Replace the FieldTracking interface with a simpler ValidationErrors interface
interface ValidationErrors {
  formulaError?: string
  timeError?: string
}

export default function GameInputForm({ games, onAddGame, onUpdateGame, onResetGames }: GameInputFormProps) {
  const [newGameData, setNewGameData] = useState<GameData>({
    id: Date.now(),
    eliminations: 0,
    score: 0,
    kills: null,
    assists: null,
    deaths: null,
    duration: "",
    durationMinutes: 0,
  })

  // Remove the field tracking state variables
  const [newGameErrors, setNewGameErrors] = useState<ValidationErrors>({})
  const [gameErrors, setGameErrors] = useState<Record<number, ValidationErrors>>({})

  const durationInputRef = useRef<HTMLInputElement>(null)
  const [expandedGameId, setExpandedGameId] = useState<string | null>(null)

  // Store previous games length to detect changes
  const prevGamesLengthRef = useRef(games.length)

  // Initialize field tracking for existing games only when games change
  useEffect(() => {
    // Only run this if games length has changed
    if (games.length !== prevGamesLengthRef.current) {
      prevGamesLengthRef.current = games.length
    }
  }, [games.length])

  // Replace the validateFormula function with this simpler version
  const validateFormula = useCallback((data: GameData): string | undefined => {
    const { eliminations, kills, assists } = data

    // Only validate if all three fields are filled in
    if (eliminations > 0 && kills !== null && assists !== null) {
      if (eliminations !== kills + assists) {
        return `Error: Eliminations (${eliminations}) must equal Kills (${kills}) + Assists (${assists})`
      }
    }

    return undefined
  }, [])

  // Simplify the handleNewGameChange function - removed error clearing logic
  const handleNewGameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (name === "duration") {
      // For duration, format as the user types by adding colons between pairs of digits
      // Strip non-numeric characters first
      const digitsOnly = value.replace(/[^0-9]/g, "")

      // Format with colons between pairs
      let formattedValue = ""
      for (let i = 0; i < digitsOnly.length; i++) {
        if (i === 2 || i === 4) {
          formattedValue += ":"
        }
        formattedValue += digitsOnly[i]
      }

      // Limit to 00:00:00 format (8 chars including colons)
      formattedValue = formattedValue.substring(0, 8)

      // Update the input field with the formatted value
      if (durationInputRef.current) {
        durationInputRef.current.value = formattedValue
      }

      // Update the state with the formatted input
      setNewGameData((prev) => ({
        ...prev,
        duration: formattedValue,
      }))
    } else if (name === "eliminations" || name === "score") {
      // Required fields - parse as integers
      const parsedValue = value ? Number.parseInt(value) || 0 : 0

      setNewGameData((prev) => ({
        ...prev,
        [name]: parsedValue,
      }))
    } else if (name === "kills" || name === "assists" || name === "deaths") {
      // Optional fields - parse as integers or null if empty
      const parsedValue = value ? Number.parseInt(value) || 0 : null

      // Update the data
      setNewGameData((prev) => ({
        ...prev,
        [name]: parsedValue,
      }))
    }
  }, [])

  // Simplify the handleGameChange function - keep validation for existing games
  const handleGameChange = useCallback(
    (gameId: number, e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target
      const game = games.find((g) => g.id === gameId)

      if (!game) return

      let updatedGame = { ...game }

      if (name === "duration") {
        // Format as the user types by adding colons between pairs of digits
        // Strip non-numeric characters first
        const digitsOnly = value.replace(/[^0-9]/g, "")

        // Format with colons between pairs
        let formattedValue = ""
        for (let i = 0; i < digitsOnly.length; i++) {
          if (i === 2 || i === 4) {
            formattedValue += ":"
          }
          formattedValue += digitsOnly[i]
        }

        // Limit to 00:00:00 format (8 chars including colons)
        formattedValue = formattedValue.substring(0, 8)

        // Update the input field with the formatted value
        e.target.value = formattedValue

        // Update the game with the formatted input
        updatedGame = {
          ...updatedGame,
          duration: formattedValue,
        }
      } else if (name === "eliminations" || name === "score") {
        // Required fields - parse as integers
        const parsedValue = value ? Number.parseInt(value) || 0 : 0
        updatedGame = {
          ...updatedGame,
          [name]: parsedValue,
        }
      } else if (name === "kills" || name === "assists" || name === "deaths") {
        // Optional fields - parse as integers or null if empty
        const parsedValue = value ? Number.parseInt(value) || 0 : null
        updatedGame = {
          ...updatedGame,
          [name]: parsedValue,
        }
      }

      // Auto-save changes
      onUpdateGame(gameId, updatedGame)
    },
    [games, onUpdateGame],
  )

  // Handle blur event for new game duration input
  const handleNewGameDurationBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value

    if (!value) return

    // Normalize the time input (convert excessive minutes/seconds)
    const normalizedValue = normalizeTimeInput(value)

    // Calculate minutes for stats
    const durationMinutes = convertTimeToMinutes(normalizedValue)

    // Update the state with normalized value
    setNewGameData((prev) => ({
      ...prev,
      duration: normalizedValue,
      durationMinutes,
    }))

    // Update the input field with normalized value
    if (durationInputRef.current) {
      durationInputRef.current.value = normalizedValue
    }

    // Clear any time error
    setNewGameErrors((prev) => ({
      ...prev,
      timeError: undefined,
    }))
  }, [])

  // Handle blur event for existing game duration input
  const handleGameDurationBlur = useCallback(
    (gameId: number, e: React.FocusEvent<HTMLInputElement>) => {
      const value = e.target.value
      const game = games.find((g) => g.id === gameId)

      if (!game || !value) return

      // Normalize the time input (convert excessive minutes/seconds)
      const normalizedValue = normalizeTimeInput(value)

      // Calculate minutes for stats
      const durationMinutes = convertTimeToMinutes(normalizedValue)

      // Update the game with normalized value
      const updatedGame = {
        ...game,
        duration: normalizedValue,
        durationMinutes,
      }

      // Update the input field with normalized value
      e.target.value = normalizedValue

      // Clear any time error
      setGameErrors((prev) => ({
        ...prev,
        [gameId]: {
          ...prev[gameId],
          timeError: undefined,
        },
      }))

      // Auto-save changes
      onUpdateGame(gameId, updatedGame)
    },
    [games, onUpdateGame],
  )

  // Update the handleAddGame function to validate before submission
  const handleAddGame = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()

      // Validate required fields
      if (newGameData.eliminations <= 0) {
        alert("Please enter a valid number of eliminations")
        return
      }

      if (newGameData.score <= 0) {
        alert("Please enter a valid score")
        return
      }

      // Validate that duration is entered and valid
      if (!newGameData.duration) {
        alert("Please enter a valid game duration")
        return
      }

      // Normalize duration one more time before submission
      const normalizedDuration = normalizeTimeInput(newGameData.duration)
      const durationMinutes = convertTimeToMinutes(normalizedDuration)

      if (durationMinutes <= 0) {
        alert("Please enter a valid game duration")
        return
      }

      // Check the formula if all three fields are filled
      const formulaError = validateFormula(newGameData)
      if (formulaError) {
        setNewGameErrors((prev) => ({
          ...prev,
          formulaError,
        }))
        return // Block submission if formula doesn't balance
      }

      // Clear any errors before submitting
      setNewGameErrors({})

      onAddGame({
        ...newGameData,
        duration: normalizedDuration,
        durationMinutes,
        id: Date.now(), // Ensure unique ID
      })

      // Reset form
      setNewGameData({
        id: Date.now(),
        eliminations: 0,
        score: 0,
        kills: null,
        assists: null,
        deaths: null,
        duration: "",
        durationMinutes: 0,
      })

      if (durationInputRef.current) {
        durationInputRef.current.value = ""
      }
    },
    [newGameData, onAddGame, validateFormula],
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-zinc-100">Game Data</h2>
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 text-sm">
            {games.length} {games.length === 1 ? "game" : "games"} recorded
          </span>
          {games.length > 0 && (
            <Button variant="destructive" size="sm" onClick={onResetGames} className="bg-red-900 hover:bg-red-800">
              <Trash2 className="h-4 w-4 mr-1" />
              Reset All
            </Button>
          )}
        </div>
      </div>

      {/* Existing Games Section */}
      {games.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-zinc-200">Existing Games</h3>
          <Accordion
            type="single"
            collapsible
            className="space-y-3"
            value={expandedGameId || ""}
            onValueChange={setExpandedGameId}
          >
            {games.map((game, index) => (
              <AccordionItem
                key={game.id}
                value={`game-${game.id}`}
                className="border border-zinc-700 rounded-md overflow-hidden bg-zinc-800"
              >
                <AccordionTrigger className="px-4 py-3 hover:bg-zinc-700/50 text-left hover:no-underline">
                  <div className="flex justify-between items-center w-full pr-4">
                    <span className="font-medium text-zinc-300">Game {index + 1}</span>
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <span>Score: {game.score}</span>
                      <span>•</span>
                      <span>Elims: {game.eliminations}</span>
                      <span>•</span>
                      <span>Duration: {game.duration}</span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`edit-eliminations-${game.id}`} className="text-zinc-400 flex items-center">
                        Eliminations <span className="text-red-400 ml-1">*</span>
                      </Label>
                      <Input
                        id={`edit-eliminations-${game.id}`}
                        name="eliminations"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]+"
                        autoComplete="off"
                        defaultValue={game.eliminations}
                        onChange={(e) => handleGameChange(game.id, e)}
                        className="bg-zinc-700 border-zinc-600 text-white"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`edit-score-${game.id}`} className="text-zinc-400 flex items-center">
                        Score <span className="text-red-400 ml-1">*</span>
                      </Label>
                      <Input
                        id={`edit-score-${game.id}`}
                        name="score"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]+"
                        autoComplete="off"
                        defaultValue={game.score}
                        onChange={(e) => handleGameChange(game.id, e)}
                        className="bg-zinc-700 border-zinc-600 text-white"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`edit-kills-${game.id}`} className="text-zinc-400 flex items-center">
                        Kills
                      </Label>
                      <Input
                        id={`edit-kills-${game.id}`}
                        name="kills"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]+"
                        autoComplete="off"
                        defaultValue={game.kills ?? ""}
                        onChange={(e) => handleGameChange(game.id, e)}
                        className="bg-zinc-700 border-zinc-600 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`edit-assists-${game.id}`} className="text-zinc-400 flex items-center">
                        Assists
                      </Label>
                      <Input
                        id={`edit-assists-${game.id}`}
                        name="assists"
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        pattern="[0-9]+"
                        defaultValue={game.assists ?? ""}
                        onChange={(e) => handleGameChange(game.id, e)}
                        className="bg-zinc-700 border-zinc-600 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`edit-deaths-${game.id}`} className="text-zinc-400">
                        Deaths
                      </Label>
                      <Input
                        id={`edit-deaths-${game.id}`}
                        name="deaths"
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        pattern="[0-9]+"
                        defaultValue={game.deaths ?? ""}
                        onChange={(e) => handleGameChange(game.id, e)}
                        className="bg-zinc-700 border-zinc-600 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`edit-duration-${game.id}`} className="text-zinc-400 flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Duration <span className="text-red-400 ml-1">*</span>
                      </Label>
                      <Input
                        id={`edit-duration-${game.id}`}
                        name="duration"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9:]+"
                        autoComplete="off"
                        placeholder="mm:ss"
                        defaultValue={game.duration}
                        onChange={(e) => handleGameChange(game.id, e)}
                        onBlur={(e) => handleGameDurationBlur(game.id, e)}
                        className="bg-zinc-700 border-zinc-600 text-white"
                        required
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      {/* New Game Form */}
      <Card className="bg-zinc-900 border-zinc-700">
        <CardContent className="pt-6">
          <form onSubmit={handleAddGame} className="space-y-6">
            {newGameErrors.formulaError && (
              <Alert variant="destructive" className="mb-4 bg-red-900/20 border-red-900 text-red-300">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{newGameErrors.formulaError}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eliminations" className="text-zinc-400 flex items-center">
                  Eliminations <span className="text-red-400 ml-1">*</span>
                </Label>
                <Input
                  id="eliminations"
                  name="eliminations"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]+"
                  autoComplete="off"
                  value={newGameData.eliminations || ""}
                  onChange={handleNewGameChange}
                  className={`bg-zinc-800 border-zinc-700 text-white ${newGameErrors.formulaError ? "border-red-500" : ""}`}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="score" className="text-zinc-400 flex items-center">
                  Score <span className="text-red-400 ml-1">*</span>
                </Label>
                <Input
                  id="score"
                  name="score"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]+"
                  autoComplete="off"
                  value={newGameData.score || ""}
                  onChange={handleNewGameChange}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="kills" className="text-zinc-400 flex items-center">
                  Kills
                </Label>
                <Input
                  id="kills"
                  name="kills"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]+"
                  autoComplete="off"
                  value={newGameData.kills ?? ""}
                  onChange={handleNewGameChange}
                  className={`bg-zinc-800 border-zinc-700 text-white ${newGameErrors.formulaError ? "border-red-500" : ""}`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assists" className="text-zinc-400 flex items-center">
                  Assists
                </Label>
                <Input
                  id="assists"
                  name="assists"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]+"
                  autoComplete="off"
                  value={newGameData.assists ?? ""}
                  onChange={handleNewGameChange}
                  className={`bg-zinc-800 border-zinc-700 text-white ${newGameErrors.formulaError ? "border-red-500" : ""}`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deaths" className="text-zinc-400">
                  Deaths
                </Label>
                <Input
                  id="deaths"
                  name="deaths"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]+"
                  autoComplete="off"
                  value={newGameData.deaths ?? ""}
                  onChange={handleNewGameChange}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration" className="text-zinc-400 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Duration <span className="text-red-400 ml-1">*</span>
                </Label>
                <Input
                  id="duration"
                  name="duration"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9:]+"
                  autoComplete="off"
                  ref={durationInputRef}
                  placeholder="mm:ss"
                  onChange={handleNewGameChange}
                  onBlur={handleNewGameDurationBlur}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  required
                />
                <p className="text-xs text-zinc-500 mt-1">
                  Format: minutes:seconds (e.g., 9:19) or hours:minutes:seconds (e.g., 1:17:23)
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-700">
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Game
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="bg-zinc-800 border border-zinc-700 rounded-md p-4">
        <h3 className="text-sm font-medium text-zinc-300 mb-2 flex items-center">
          <Calculator className="h-4 w-4 mr-2 text-blue-400" />
          Formula Validation
        </h3>
        <p className="text-xs text-zinc-400">
          Eliminations = Kills + Assists. If you fill in all three fields, they must satisfy this formula or an error
          will be displayed and you won't be able to submit the form.
        </p>
      </div>
    </div>
  )
}
