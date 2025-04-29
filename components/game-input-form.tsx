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
  onDeleteGame: (gameId: number) => void
  onResetGames: () => void
}

// Replace the ValidationErrors interface with a more comprehensive one
interface ValidationErrors {
  formulaError?: string
  timeError?: string
  invalidFields?: string[] // Track which fields are invalid
}

// Add this new function after the ValidationErrors interface and before the GameInputForm component
function calculateMissingValue(
  field: "eliminations" | "kills" | "assists",
  values: {
    eliminations?: number | null
    kills?: number | null
    assists?: number | null
  },
): number | null {
  // We need at least two values to calculate the third
  const filledValues = Object.values(values).filter((v) => v !== undefined && v !== null).length
  if (filledValues < 2) return null

  if (field === "eliminations" && values.kills !== null && values.assists !== null) {
    return (values.kills || 0) + (values.assists || 0)
  } else if (field === "kills" && values.eliminations !== null && values.assists !== null) {
    return Math.max(0, (values.eliminations || 0) - (values.assists || 0))
  } else if (field === "assists" && values.eliminations !== null && values.kills !== null) {
    return Math.max(0, (values.eliminations || 0) - (values.kills || 0))
  }

  return null
}

// Add a function to validate the formula
function validateGameFormula(game: GameData): ValidationErrors | null {
  const { eliminations, kills, assists } = game

  // Only validate if all three fields are filled in
  if (eliminations > 0 && kills !== null && assists !== null) {
    if (eliminations !== kills + assists) {
      return {
        formulaError: `Error: Eliminations (${eliminations}) must equal Kills (${kills}) + Assists (${assists})`,
        invalidFields: ["eliminations", "kills", "assists"],
      }
    }
  }

  return null
}

// Add a new function to fill in missing values automatically when a game is updated
// Add this function after the calculateMissingValue function

function completeGameValues(game: GameData): GameData {
  const updatedGame = { ...game }

  // Check if we can calculate eliminations from kills and assists
  if (updatedGame.eliminations === 0 && updatedGame.kills !== null && updatedGame.assists !== null) {
    updatedGame.eliminations = updatedGame.kills + updatedGame.assists
  }

  // Check if we can calculate kills from eliminations and assists
  if (updatedGame.kills === null && updatedGame.eliminations > 0 && updatedGame.assists !== null) {
    updatedGame.kills = Math.max(0, updatedGame.eliminations - (updatedGame.assists || 0))
  }

  // Check if we can calculate assists from eliminations and kills
  if (updatedGame.assists === null && updatedGame.eliminations > 0 && updatedGame.kills !== null) {
    updatedGame.assists = Math.max(0, updatedGame.eliminations - (updatedGame.kills || 0))
  }

  return updatedGame
}

export default function GameInputForm({
  games,
  onAddGame,
  onUpdateGame,
  onDeleteGame,
  onResetGames,
}: GameInputFormProps) {
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
  // Update the gameErrors state to track validation errors for each game
  const [newGameErrors, setNewGameErrors] = useState<ValidationErrors>({})
  const [gameErrors, setGameErrors] = useState<Record<number, ValidationErrors>>({})

  // First, add a state to track edited games that haven't been saved yet
  // Add this after the other state declarations
  const [editedGames, setEditedGames] = useState<Record<number, GameData>>({})

  // Add these new state variables after the existing state declarations
  const [fieldPlaceholders, setFieldPlaceholders] = useState<{
    newGame: {
      eliminations?: string
      kills?: string
      assists?: string
    }
    games: Record<
      number,
      {
        eliminations?: string
        kills?: string
        assists?: string
      }
    >
  }>({
    newGame: {},
    games: {},
  })

  // Add a state to track original game data before edits
  const [originalGames, setOriginalGames] = useState<Record<number, GameData>>({})

  // Add these refs to track active editing
  const activeEditingField = useRef<string | null>(null)
  const editingTimeout = useRef<NodeJS.Timeout | null>(null)

  const durationInputRef = useRef<HTMLInputElement>(null)
  const [expandedGameId, setExpandedGameId] = useState<string | null>(null)

  // Store previous games length to detect changes
  const prevGamesLengthRef = useRef(games.length)

  // Initialize field tracking for existing games only when games change
  useEffect(() => {
    // Only run this if games length has changed
    if (games.length !== prevGamesLengthRef.current) {
      prevGamesLengthRef.current = games.length

      // Store original game data for new games
      const newOriginalGames = { ...originalGames }
      games.forEach((game) => {
        if (!originalGames[game.id]) {
          newOriginalGames[game.id] = { ...game }
        }
      })
      setOriginalGames(newOriginalGames)
    }
  }, [games.length, originalGames])

  // Store original game data when a game is expanded
  useEffect(() => {
    if (expandedGameId) {
      const gameId = Number.parseInt(expandedGameId.replace("game-", ""))
      const game = games.find((g) => g.id === gameId)
      if (game && !originalGames[gameId]) {
        setOriginalGames((prev) => ({
          ...prev,
          [gameId]: { ...game },
        }))
      }
    }
  }, [expandedGameId, games, originalGames])

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

  // Add this function to update placeholders for the new game form
  const updateNewGamePlaceholders = useCallback(() => {
    // Don't update if user is still editing
    if (activeEditingField.current?.startsWith("new-")) return

    const values = {
      eliminations: newGameData.eliminations,
      kills: newGameData.kills,
      assists: newGameData.assists,
    }

    // Calculate missing values
    const missingEliminations = calculateMissingValue("eliminations", values)
    const missingKills = calculateMissingValue("kills", values)
    const missingAssists = calculateMissingValue("assists", values)

    // Update placeholders
    setFieldPlaceholders((prev) => ({
      ...prev,
      newGame: {
        eliminations: missingEliminations !== null ? `Predicted: ${missingEliminations}` : "",
        kills: missingKills !== null ? `Predicted: ${missingKills}` : "",
        assists: missingAssists !== null ? `Predicted: ${missingAssists}` : "",
      },
    }))
  }, [newGameData.eliminations, newGameData.kills, newGameData.assists])

  // Add this function to update placeholders for existing games
  const updateGamePlaceholders = useCallback(
    (gameId: number) => {
      // Don't update if user is still editing
      if (activeEditingField.current?.startsWith(`game-${gameId}`)) return

      // Use edited game data if available, otherwise use the original game
      const originalGame = games.find((g) => g.id === gameId)
      const game = editedGames[gameId] || originalGame

      if (!game) return

      const values = {
        eliminations: game.eliminations,
        kills: game.kills,
        assists: game.assists,
      }

      // Calculate missing values
      const missingEliminations = calculateMissingValue("eliminations", values)
      const missingKills = calculateMissingValue("kills", values)
      const missingAssists = calculateMissingValue("assists", values)

      // Update placeholders
      setFieldPlaceholders((prev) => ({
        ...prev,
        games: {
          ...prev.games,
          [gameId]: {
            eliminations: missingEliminations !== null ? `Predicted: ${missingEliminations}` : "",
            kills: missingKills !== null ? `Predicted: ${missingKills}` : "",
            assists: missingAssists !== null ? `Predicted: ${missingAssists}` : "",
          },
        },
      }))
    },
    [games, editedGames],
  )

  // Add this effect to update placeholders when values change
  useEffect(() => {
    updateNewGamePlaceholders()
  }, [updateNewGamePlaceholders])

  // Add this effect to update placeholders for existing games
  useEffect(() => {
    games.forEach((game) => {
      updateGamePlaceholders(game.id)
    })
  }, [games, updateGamePlaceholders])

  // Add an effect to update placeholders when editedGames changes
  useEffect(() => {
    // Update placeholders for all edited games
    Object.keys(editedGames).forEach((gameId) => {
      updateGamePlaceholders(Number(gameId))
    })
  }, [editedGames, updateGamePlaceholders])

  // Add these handlers for focus and blur events
  const handleFieldFocus = useCallback((fieldId: string) => {
    activeEditingField.current = fieldId

    // Clear any existing timeout
    if (editingTimeout.current) {
      clearTimeout(editingTimeout.current)
    }
  }, [])

  const handleFieldBlur = useCallback(
    (fieldId: string, gameId?: number) => {
      // Set a timeout to consider editing finished after a short delay
      if (editingTimeout.current) {
        clearTimeout(editingTimeout.current)
      }

      editingTimeout.current = setTimeout(() => {
        activeEditingField.current = null

        // Update placeholders
        if (gameId) {
          updateGamePlaceholders(gameId)
        } else {
          updateNewGamePlaceholders()
        }
      }, 200) // Short delay to ensure field is really not being edited
    },
    [updateGamePlaceholders, updateNewGamePlaceholders],
  )

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

  // Update the handleGameChange function to run automatic calculations when fields are modified
  // Replace the existing handleGameChange function
  // Update the handleGameChange function to validate the formula before saving changes
  const handleGameChange = useCallback(
    (gameId: number, e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target
      const game = games.find((g) => g.id === gameId)
      if (!game) return

      // Get the current edited version of the game or the original game
      const currentGame = editedGames[gameId] || { ...game }
      let updatedGame = { ...currentGame }

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

      // Store the updated game in editedGames
      setEditedGames((prev) => ({
        ...prev,
        [gameId]: updatedGame,
      }))

      // Clear any previous errors for this game
      setGameErrors((prev) => {
        const newErrors = { ...prev }
        if (newErrors[gameId]) {
          delete newErrors[gameId]
        }
        return newErrors
      })

      // Update placeholders immediately for better user experience
      // Use a short timeout to ensure the state is updated first
      setTimeout(() => {
        updateGamePlaceholders(gameId)
      }, 10)
    },
    [games, updateGamePlaceholders],
  )

  // Add a function to handle saving game changes
  const handleSaveGame = useCallback(
    (gameId: number) => {
      const editedGame = editedGames[gameId]
      if (!editedGame) return

      // Validate the formula before saving
      const validationErrors = validateGameFormula(editedGame)

      if (validationErrors) {
        // Store the validation errors
        setGameErrors((prev) => ({
          ...prev,
          [gameId]: validationErrors,
        }))
        return // Don't save if there are validation errors
      }

      // If duration was changed, normalize it and calculate minutes
      let gameToSave = { ...editedGame }
      if (editedGame.duration) {
        const normalizedDuration = normalizeTimeInput(editedGame.duration)
        const durationMinutes = convertTimeToMinutes(normalizedDuration)
        gameToSave = {
          ...gameToSave,
          duration: normalizedDuration,
          durationMinutes,
        }
      }

      // Save the changes
      onUpdateGame(gameId, gameToSave)

      // Remove from editedGames
      setEditedGames((prev) => {
        const newEdited = { ...prev }
        delete newEdited[gameId]
        return newEdited
      })

      // Clear any errors
      setGameErrors((prev) => {
        const newErrors = { ...prev }
        if (newErrors[gameId]) {
          delete newErrors[gameId]
        }
        return newErrors
      })
    },
    [editedGames, onUpdateGame],
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
      if (!value) return

      // Get the current edited version of the game or the original game
      const game = editedGames[gameId] || games.find((g) => g.id === gameId)
      if (!game) return

      // Normalize the time input (convert excessive minutes/seconds)
      const normalizedValue = normalizeTimeInput(value)

      // Update the input field with normalized value
      e.target.value = normalizedValue

      // Update the edited game with normalized value
      setEditedGames((prev) => ({
        ...prev,
        [gameId]: {
          ...(prev[gameId] || game),
          duration: normalizedValue,
        },
      }))
    },
    [games, editedGames],
  )

  // Handle game deletion with confirmation
  const handleDeleteGame = useCallback(
    (gameId: number, e: React.MouseEvent) => {
      // Stop event propagation to prevent accordion from toggling
      e.stopPropagation()
      onDeleteGame(gameId)
    },
    [onDeleteGame],
  )

  // Modify the handleAddGame function to use predicted values
  const handleAddGame = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()

      // // Validate required fields
      // if (newGameData.eliminations <= 0) {
      //   alert("Please enter a valid number of eliminations")
      //   return
      // }
      //
      // if (newGameData.score <= 0) {
      //   alert("Please enter a valid score")
      //   return
      // }
      //
      // // Validate that duration is entered and valid
      // if (!newGameData.duration) {
      //   alert("Please enter a valid game duration")
      //   return
      // }
      if (newGameData.eliminations == 0 && newGameData.score == 0 && newGameData.duration == "") {
        alert("Please enter elims, score, or duration")
        return
      }

      // Normalize duration one more time before submission
      const normalizedDuration = normalizeTimeInput(newGameData.duration)
      const durationMinutes = convertTimeToMinutes(normalizedDuration)

      // if (durationMinutes <= 0) {
      //   alert("Please enter a valid game duration")
      //   return
      // }

      // Fill in missing values using predictions if available
      const updatedGameData = { ...newGameData }

      // Check if eliminations is missing but can be calculated
      if (updatedGameData.eliminations === 0 && updatedGameData.kills !== null && updatedGameData.assists !== null) {
        updatedGameData.eliminations = updatedGameData.kills + updatedGameData.assists
      }

      // Check if kills is missing but can be calculated
      if (updatedGameData.kills === null && updatedGameData.eliminations > 0 && updatedGameData.assists !== null) {
        updatedGameData.kills = Math.max(0, updatedGameData.eliminations - (updatedGameData.assists || 0))
      }

      // Check if assists is missing but can be calculated
      if (updatedGameData.assists === null && updatedGameData.eliminations > 0 && updatedGameData.kills !== null) {
        updatedGameData.assists = Math.max(0, updatedGameData.eliminations - (updatedGameData.kills || 0))
      }

      // Check the formula if all three fields are filled
      const formulaError = validateFormula(updatedGameData)
      if (formulaError) {
        setNewGameErrors((prev) => ({
          ...prev,
          formulaError,
          invalidFields: ["eliminations", "kills", "assists"],
        }))
        return // Block submission if formula doesn't balance
      }

      // Clear any errors before submitting
      setNewGameErrors({})

      onAddGame({
        ...updatedGameData,
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

  // Enhance the handleGameBlur function to more aggressively fill in values
  // Replace the existing handleGameBlur function
  // Enhance the handleGameBlur function to validate the formula
  const handleGameBlur = useCallback(
    (gameId: number, fieldName: string) => {
      handleFieldBlur(`game-${gameId}-${fieldName}`, gameId)
    },
    [handleFieldBlur],
  )

  // Add a function to reset a game to its original values
  // const handleResetGame = useCallback(
  //   (gameId: number) => {
  //     const originalGame = originalGames[gameId]
  //     if (originalGame) {
  //       onUpdateGame(gameId, originalGame)
  //
  //       // Clear errors
  //       setGameErrors((prev) => {
  //         const newErrors = { ...prev }
  //         if (newErrors[gameId]) {
  //           delete newErrors[gameId]
  //         }
  //         return newErrors
  //       })
  //     }
  //   },
  //   [originalGames, onUpdateGame],
  // )

  // Add effect to auto-complete values when game data changes
  // Add this effect after the existing useEffect hooks

  useEffect(() => {
    // Auto-complete existing games when they're loaded or changed
    games.forEach((game) => {
      const updatedGame = completeGameValues(game)

      // Only update if something changed
      if (JSON.stringify(updatedGame) !== JSON.stringify(game)) {
        onUpdateGame(game.id, updatedGame)
      }
    })
  }, [games, onUpdateGame])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-zinc-100">Game Data</h2>
          <div className="px-2 py-1 bg-zinc-700/50 rounded-full text-xs font-medium text-zinc-300 flex items-center">
            {games.length} {games.length === 1 ? "game" : "games"}
          </div>
        </div>

        {games.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetGames}
            className="text-zinc-400 hover:text-red-400 hover:bg-zinc-800"
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            <span className="text-sm">Reset All</span>
          </Button>
        )}
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
                <div className="relative">
                  <AccordionTrigger className="px-4 py-3 hover:bg-zinc-700/50 text-left hover:no-underline [&>svg]:text-zinc-300">
                    <div className="flex justify-between items-center w-full pr-4">
                      <span className="font-medium text-zinc-300">Game {index + 1}</span>
                      <div className="hidden md:flex items-center gap-2 text-sm text-zinc-400">
                        <span>Score: {game.score}</span>
                        <span>•</span>
                        <span>Elims: {game.eliminations}</span>
                        <span>•</span>
                        <span>Duration: {game.duration}</span>
                      </div>
                    </div>
                  </AccordionTrigger>
                </div>
                <AccordionContent className="px-4 pb-4 pt-2">
                  {/* Add error alert if there's a formula error */}
                  {gameErrors[game.id]?.formulaError && (
                    <Alert variant="destructive" className="mb-4 bg-red-900/20 border-red-900 text-red-300">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="flex justify-between items-center">
                        <span>{gameErrors[game.id].formulaError}</span>
                        {/*<Button*/}
                        {/*  variant="outline"*/}
                        {/*  size="sm"*/}
                        {/*  onClick={() => handleResetGame(game.id)}*/}
                        {/*  className="ml-2 border-red-700 bg-red-950 hover:bg-red-900/50 text-red-300"*/}
                        {/*>*/}
                        {/*  Reset Values*/}
                        {/*</Button>*/}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`edit-eliminations-${game.id}`} className="text-zinc-400 flex items-center">
                        Eliminations
                        {/*<span className="text-red-400 ml-1">*</span>*/}
                      </Label>
                      <Input
                        id={`edit-eliminations-${game.id}`}
                        name="eliminations"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]+"
                        autoComplete="off"
                        defaultValue={editedGames[game.id]?.eliminations ?? game.eliminations}
                        onChange={(e) => handleGameChange(game.id, e)}
                        onFocus={() => handleFieldFocus(`game-${game.id}-eliminations`)}
                        onBlur={() => handleGameBlur(game.id, "eliminations")}
                        placeholder={fieldPlaceholders.games[game.id]?.eliminations || ""}
                        className={`bg-zinc-700 border-zinc-600 text-white ${
                          gameErrors[game.id]?.invalidFields?.includes("eliminations")
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                            : ""
                        }`}
                        // required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`edit-score-${game.id}`} className="text-zinc-400 flex items-center">
                        Score
                        {/*<span className="text-red-400 ml-1">*</span>*/}
                      </Label>
                      <Input
                        id={`edit-score-${game.id}`}
                        name="score"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]+"
                        autoComplete="off"
                        defaultValue={editedGames[game.id]?.score ?? game.score}
                        onChange={(e) => handleGameChange(game.id, e)}
                        className="bg-zinc-700 border-zinc-600 text-white"
                        // required
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
                        defaultValue={editedGames[game.id]?.kills ?? game.kills ?? ""}
                        onChange={(e) => handleGameChange(game.id, e)}
                        onFocus={() => handleFieldFocus(`game-${game.id}-kills`)}
                        onBlur={() => handleGameBlur(game.id, "kills")}
                        placeholder={fieldPlaceholders.games[game.id]?.kills || ""}
                        className={`bg-zinc-700 border-zinc-600 text-white ${
                          gameErrors[game.id]?.invalidFields?.includes("kills")
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                            : ""
                        }`}
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
                        defaultValue={editedGames[game.id]?.assists ?? game.assists ?? ""}
                        onChange={(e) => handleGameChange(game.id, e)}
                        onFocus={() => handleFieldFocus(`game-${game.id}-assists`)}
                        onBlur={() => handleGameBlur(game.id, "assists")}
                        placeholder={fieldPlaceholders.games[game.id]?.assists || ""}
                        className={`bg-zinc-700 border-zinc-600 text-white ${
                          gameErrors[game.id]?.invalidFields?.includes("assists")
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                            : ""
                        }`}
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
                        defaultValue={editedGames[game.id]?.deaths ?? game.deaths ?? ""}
                        onChange={(e) => handleGameChange(game.id, e)}
                        className="bg-zinc-700 border-zinc-600 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`edit-duration-${game.id}`} className="text-zinc-400 flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Duration
                        {/*<span className="text-red-400 ml-1">*</span>*/}
                      </Label>
                      <Input
                        id={`edit-duration-${game.id}`}
                        name="duration"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9:]+"
                        autoComplete="off"
                        placeholder="mm:ss"
                        defaultValue={editedGames[game.id]?.duration ?? game.duration}
                        onChange={(e) => handleGameChange(game.id, e)}
                        onBlur={(e) => handleGameDurationBlur(game.id, e)}
                        className="bg-zinc-700 border-zinc-600 text-white"
                        // required
                      />
                    </div>
                  </div>

                  {/* Add a divider and the action buttons at the bottom */}
                  <div className="mt-6 pt-4 border-t border-zinc-700 flex justify-between">
                    <div>
                      {editedGames[game.id] && (
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleSaveGame(game.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Save Changes
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              // Remove from editedGames and clear errors
                              setEditedGames((prev) => {
                                const newEdited = { ...prev }
                                delete newEdited[game.id]
                                return newEdited
                              })
                              setGameErrors((prev) => {
                                const newErrors = { ...prev }
                                if (newErrors[game.id]) {
                                  delete newErrors[game.id]
                                }
                                return newErrors
                              })
                            }}
                            className="border-zinc-600 bg-zinc-600 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-300"
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => handleDeleteGame(game.id, e)}
                      className="bg-red-900/30 hover:bg-red-900/50 text-red-300 hover:text-red-200"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Game
                    </Button>
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
                  Eliminations
                  {/*<span className="text-red-400 ml-1">*</span>*/}
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
                  onFocus={() => handleFieldFocus("new-eliminations")}
                  onBlur={() => handleFieldBlur("new-eliminations")}
                  placeholder={fieldPlaceholders.newGame.eliminations || ""}
                  className={`bg-zinc-800 border-zinc-700 text-white ${
                    newGameErrors.invalidFields?.includes("eliminations") ? "border-red-500" : ""
                  }`}
                  // required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="score" className="text-zinc-400 flex items-center">
                  Score
                  {/*<span className="text-red-400 ml-1">*</span>*/}
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
                  // required
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
                  onFocus={() => handleFieldFocus("new-kills")}
                  onBlur={() => handleFieldBlur("new-kills")}
                  placeholder={fieldPlaceholders.newGame.kills || ""}
                  className={`bg-zinc-800 border-zinc-700 text-white ${
                    newGameErrors.invalidFields?.includes("kills") ? "border-red-500" : ""
                  }`}
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
                  onFocus={() => handleFieldFocus("new-assists")}
                  onBlur={() => handleFieldBlur("new-assists")}
                  placeholder={fieldPlaceholders.newGame.assists || ""}
                  className={`bg-zinc-800 border-zinc-700 text-white ${
                    newGameErrors.invalidFields?.includes("assists") ? "border-red-500" : ""
                  }`}
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
                  Duration
                  {/*<span className="text-red-400 ml-1">*</span>*/}
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
                  // required
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
        <p className="text-xs text-zinc-400 mb-2">Eliminations = Kills + Assists. The app will:</p>
        <ul className="text-xs text-zinc-400 list-disc pl-5 space-y-1">
          <li>Suggest values when you fill in two of the three fields</li>
          <li>Validate that the formula is correct when you save your changes</li>
          <li>Highlight fields in red when the formula is invalid</li>
          <li>Prevent saving changes that would break the formula</li>
        </ul>
      </div>
    </div>
  )
}
