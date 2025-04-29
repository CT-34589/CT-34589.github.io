"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Calculator, Trophy, Clock } from "lucide-react"


export default function HomePage() {
  const router = useRouter()

  // Redirect to /kmc-calc if coming from a direct link to the calculator
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.has("redirect") && params.get("redirect") === "calc") {
      router.push("/kmc-calc")
    }
  }, [router])

  return (
    <main className="min-h-screen bg-zinc-900 text-zinc-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 mt-8">
          <h1 className="text-4xl font-bold text-blue-400 mb-4">104th Online Tools</h1>
          <p className="text-xl text-zinc-300 max-w-2xl mx-auto">
            Hub of all the 104th Battalion MilSim online tools. Track your game stats, view leaderboards, and more.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card className="bg-zinc-800 border-zinc-700 hover:border-blue-600 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-400">
                <Calculator className="mr-2 h-5 w-5" />
                KMC Calculator
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Track your eliminations, kills, assists, and more
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-300 mb-4">
                Record your game stats and see detailed breakdowns of your performance metrics including K/D ratio,
                eliminations per minute, and more.
              </p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => router.push("/kmc-calc")}>
                Open Calculator <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-zinc-800 border-zinc-700 hover:border-blue-600 transition-colors relative overflow-hidden">
            <div className="absolute top-0 right-0 m-4">
              {/*<Badge variant="outline" className="bg-blue-900/30 text-blue-300 border-blue-700">*/}
              {/*  <Clock className="h-3 w-3 mr-1" />*/}
              {/*  Coming Soon*/}
              {/*</Badge>*/}
            </div>
            <CardHeader>
              <CardTitle className="flex items-center text-blue-400">
                <Trophy className="mr-2 h-5 w-5" />
                Operation Leaderboard
              </CardTitle>
              <CardDescription className="text-zinc-400">View platoon rankings and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-300 mb-4">
                Check the latest platoon rankings, scores, and performance metrics across all operations. This feature
                is currently in development.
              </p>
              <Button
                className="w-full bg-blue-600/50 hover:bg-blue-700/50 cursor-not-allowed"
                // onClick={() => router.push("/operation-leaderboard")}
              >

                  <Clock className="ml-2 h-4 w-4" /> Coming Soon

              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center text-zinc-500 text-sm mt-12">
          <p>© {new Date().getFullYear()} 104th Battalion MilSim. All rights reserved.</p>
        </div>
      </div>
    </main>
  )
}
