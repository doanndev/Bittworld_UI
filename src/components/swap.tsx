"use client"

import { useState } from "react"
import { Button } from "@/ui/button"
import { Input } from "@/ui/input"
import { ArrowUpDown, X } from "lucide-react"

interface SwapHistory {
  id: string
  time: string
  date: string
  sellAmount: number
  sellToken: string
  buyAmount: number
  buyToken: string
}

export default function SwapComponent() {
  const [fromAmount, setFromAmount] = useState("")
  const [toAmount, setToAmount] = useState("")
  const [fromToken, setFromToken] = useState("SOL")
  const [toToken, setToToken] = useState("USDT")
  const [showHistory, setShowHistory] = useState(true)

  // Mock balances
  const balances = {
    SOL: 1.2,
    USDT: 150.67,
  }

  // Mock exchange rate (1 SOL = 190 USDT)
  const exchangeRate = 190

  // Mock swap history data
  const swapHistory: SwapHistory[] = [
    { id: "1", time: "22:00", date: "12/05/2025", sellAmount: 1, sellToken: "SOL", buyAmount: 190, buyToken: "$" },
    { id: "2", time: "22:00", date: "12/05/2025", sellAmount: 1, sellToken: "SOL", buyAmount: 190, buyToken: "$" },
    { id: "3", time: "22:00", date: "12/05/2025", sellAmount: 0.5, sellToken: "SOL", buyAmount: 95, buyToken: "$" },
    { id: "4", time: "22:00", date: "12/05/2025", sellAmount: 0.5, sellToken: "SOL", buyAmount: 95, buyToken: "$" },
    { id: "5", time: "22:00", date: "12/05/2025", sellAmount: 0.5, sellToken: "SOL", buyAmount: 95, buyToken: "$" },
    { id: "6", time: "22:00", date: "12/05/2025", sellAmount: 0.5, sellToken: "SOL", buyAmount: 95, buyToken: "$" },
    { id: "7", time: "22:00", date: "12/05/2025", sellAmount: 0.5, sellToken: "SOL", buyAmount: 95, buyToken: "$" },
    { id: "8", time: "22:00", date: "12/05/2025", sellAmount: 0.5, sellToken: "SOL", buyAmount: 95, buyToken: "$" },
    { id: "9", time: "22:00", date: "12/05/2025", sellAmount: 0.5, sellToken: "SOL", buyAmount: 95, buyToken: "$" },
    { id: "10", time: "22:00", date: "12/05/2025", sellAmount: 0.5, sellToken: "SOL", buyAmount: 95, buyToken: "$" },
    { id: "11", time: "22:00", date: "12/05/2025", sellAmount: 0.5, sellToken: "SOL", buyAmount: 95, buyToken: "$" },
    { id: "12", time: "22:00", date: "12/05/2025", sellAmount: 0.5, sellToken: "SOL", buyAmount: 95, buyToken: "$" },
  ]

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value)
    if (value && !isNaN(Number(value))) {
      const calculatedTo =
        fromToken === "SOL" ? (Number(value) * exchangeRate).toFixed(2) : (Number(value) / exchangeRate).toFixed(6)
      setToAmount(calculatedTo)
    } else {
      setToAmount("")
    }
  }

  const handleToAmountChange = (value: string) => {
    setToAmount(value)
    if (value && !isNaN(Number(value))) {
      const calculatedFrom =
        toToken === "USDT" ? (Number(value) / exchangeRate).toFixed(6) : (Number(value) * exchangeRate).toFixed(2)
      setFromAmount(calculatedFrom)
    } else {
      setFromAmount("")
    }
  }

  const handleSwapTokens = () => {
    const tempToken = fromToken
    const tempAmount = fromAmount
    setFromToken(toToken)
    setToToken(tempToken)
    setFromAmount(toAmount)
    setToAmount(tempAmount)
  }

  const handleSwap = () => {
    if (fromAmount && toAmount) {
      // Here you would implement the actual swap logic
      // Reset amounts after swap
      setFromAmount("")
      setToAmount("")
    }
  }

  const getTokenIcon = (token: string) => {
    if (token === "SOL") {
      return (
        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-400 to-blue-500 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-white/20"></div>
        </div>
      )
    } else {
      return (
        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-teal-500 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-white/20"></div>
        </div>
      )
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="w-[70vw] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">SWAP</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowHistory(!showHistory)}
            className="text-white hover:bg-gray-800"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Swap History */}
          {showHistory && (
            <div className="bg-gray-900 rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-6 text-center">Swap History</h2>

              <div className="space-y-1">
                {/* Header */}
                <div className="grid grid-cols-3 gap-4 text-sm text-gray-400 pb-2 border-b border-gray-700">
                  <div>Time ↕</div>
                  <div>Sell ↕</div>
                  <div>Buy ↕</div>
                </div>

                {/* History Items */}
                <div className="max-h-96 overflow-y-auto space-y-1">
                  {swapHistory.map((item, index) => (
                    <div
                      key={item.id}
                      className={`grid grid-cols-3 gap-4 py-3 px-2 rounded-lg text-sm ${
                        index % 2 === 0 ? "bg-gray-800/50" : "bg-gray-700/30"
                      }`}
                    >
                      <div className="text-gray-300">
                        {item.time} {item.date}
                      </div>
                      <div className="text-white">
                        {item.sellAmount} {item.sellToken}
                      </div>
                      <div className="text-white">
                        {item.buyAmount} {item.buyToken}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Swap Interface */}
          <div className="bg-gray-900 rounded-2xl p-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Easy Swaps</h2>
              <p className="text-xl font-semibold">Instant Exchange</p>
            </div>

            <div className="space-y-4">
              {/* From Section */}
              <div className="space-y-2">
                <label className="text-sm text-gray-400">From</label>
                <div className="bg-gray-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getTokenIcon(fromToken)}
                      <span className="font-semibold">{fromToken}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{fromAmount || "0.00"}</div>
                      <div className="text-sm text-gray-400">
                        ~{" "}
                        {fromAmount
                          ? (Number(fromAmount) * (fromToken === "SOL" ? exchangeRate : 1)).toFixed(2)
                          : "0.00"}{" "}
                        USD
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">
                      Balance: {balances[fromToken as keyof typeof balances]} {fromToken}
                    </span>
                    <Input
                      type="number"
                      value={fromAmount}
                      onChange={(e) => handleFromAmountChange(e.target.value)}
                      className="w-32 bg-transparent border-none text-right p-0 text-lg"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center">
                <Button
                  onClick={handleSwapTokens}
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-gray-800 hover:bg-gray-700 text-white"
                >
                  <ArrowUpDown className="h-5 w-5" />
                </Button>
              </div>

              {/* To Section */}
              <div className="space-y-2">
                <label className="text-sm text-gray-400">To</label>
                <div className="bg-gray-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getTokenIcon(toToken)}
                      <span className="font-semibold">{toToken}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{toAmount || "0.00"}</div>
                      <div className="text-sm text-gray-400">
                        ~ {toAmount ? (Number(toAmount) * (toToken === "USDT" ? 1 : exchangeRate)).toFixed(2) : "0.00"}{" "}
                        USD
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">
                      Balance: {balances[toToken as keyof typeof balances]} {toToken}
                    </span>
                    <Input
                      type="number"
                      value={toAmount}
                      onChange={(e) => handleToAmountChange(e.target.value)}
                      className="w-32 bg-transparent border-none text-right p-0 text-lg"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Swap Action Button */}
              <Button
                onClick={handleSwap}
                disabled={!fromAmount || !toAmount}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 rounded-xl text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                SWAP
              </Button>

              {/* Fee Information */}
              <div className="text-center">
                <span className="text-sm text-gray-400">FEE 3%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
