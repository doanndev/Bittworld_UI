"use client"

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createTrading, getTokenAmount, getTradeAmount } from "@/services/api/TradingService"
import { useSearchParams } from "next/navigation"
import { useLang } from "@/lang/useLang"
import { getPriceSolona, getTokenInforByAddress } from "@/services/api/SolonaTokenService"
import notify from "@/app/components/notify"
import { TradingPanelProps, TradingMode } from "./types"
import { STYLE_TEXT_BASE } from "./constants/styles"
import { useLocalStorage } from "./hooks/useLocalStorage"
import { PercentageButtons } from "./components/PercentageButtons"
import { AmountButtons } from "./components/AmountButtons"
import { CustomRangeSlider } from "./components/CustomRangeSlider"
import { getInforWallet } from "@/services/api/TelegramWalletService"

export default function TradingPanel({
    defaultMode = "buy",
    currency,
    isConnected,
}: Omit<TradingPanelProps, 'selectedGroups' | 'setSelectedGroups' | 'selectedConnections' | 'setSelectedConnections'>) {
    const { t } = useLang()
    const searchParams = useSearchParams()
    const address = searchParams?.get("address")
    const queryClient = useQueryClient()

    const { data: tradeAmount, refetch: refetchTradeAmount } = useQuery({
        queryKey: ["tradeAmount", address],
        queryFn: () => getTradeAmount(address),
    })

    const { data: walletInfor } = useQuery({
        queryKey: ["wallet-infor"],
        queryFn: getInforWallet,
    });

    const { data: solPrice } = useQuery({
        queryKey: ["sol-price"],
        queryFn: () => getPriceSolona(),
    })
    const { data: tokenInfor, refetch } = useQuery({
        queryKey: ["token-infor", address],
        queryFn: () => getTokenInforByAddress(address),
    });

    const { data: tokenAmount, refetch: refetchTokenAmount } = useQuery({
        queryKey: ["tokenAmount", address],
        queryFn: () => getTokenAmount(address),
    })

    const [mode, setMode] = useState<TradingMode>(defaultMode)
    const [amount, setAmount] = useState("0.00")
    const [percentage, setPercentage] = useState(0)
    const [amountUSD, setAmountUSD] = useState("0.00")
    const [isDirectAmountInput, setIsDirectAmountInput] = useState(false)
    const [isMounted, setIsMounted] = useState(false)
    const [windowHeight, setWindowHeight] = useState(800)
    const [amountError, setAmountError] = useState<string>("")
    const [isLoading, setIsLoading] = useState(false)
    const timeoutIdRef = useRef<NodeJS.Timeout | undefined>(undefined)

    // Use custom hook for localStorage
    const [percentageValues, setPercentageValues] = useLocalStorage<number[]>(
        'tradingPercentageValues',
        [25, 50, 75, 100]
    )
    const [amountValues, setAmountValues] = useLocalStorage<number[]>(
        'tradingAmountValues',
        [0.1, 0.5, 1, 2]
    )

    const [editingIndex, setEditingIndex] = useState<number | null>(null)
    const [editValue, setEditValue] = useState<string>("")
    const [editingAmountIndex, setEditingAmountIndex] = useState<number | null>(null)
    const [editAmountValue, setEditAmountValue] = useState<string>("")

    // Memoize exchange rate
    const exchangeRate = useMemo(() => solPrice?.priceUSD || 0, [solPrice?.priceUSD])

    // Add isButtonDisabled state
    const isButtonDisabled = useMemo(() => {
        const numericAmount = Number(amount)
        return amountError !== "" || numericAmount <= 0 || !isConnected
    }, [amount, amountError, isConnected])

    useEffect(() => {
        setIsMounted(true)
        setWindowHeight(window.innerHeight)

        const handleResize = () => {
            setWindowHeight(window.innerHeight)
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Use default height during SSR
    const height = isMounted ? windowHeight : 800

    const validateAmount = useCallback((value: number): boolean => {
        const balance = mode === "buy" ? tradeAmount?.sol_balance || 0 : tradeAmount?.token_balance || 0
        if (value > balance) {
            setAmountError(t('trading.panel.insufficient_balance'))
            return false
        }
        if (value <= 0) {
            setAmountError(t('trading.panel.invalid_amount'))
            return false
        }
        setAmountError("")
        return true
    }, [mode, tradeAmount, t])

    const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newAmount = e.target.value
        setAmount(newAmount)
        setIsDirectAmountInput(true)
        setPercentage(0)

        const numericAmount = Number.parseFloat(newAmount) || 0
        validateAmount(numericAmount)
        setAmountUSD((numericAmount * exchangeRate).toFixed(2))
    }, [exchangeRate, validateAmount])

    const handleSetAmount = useCallback((value: number) => {
        setAmount(value.toString())
        setIsDirectAmountInput(true)
        setPercentage(0)
        validateAmount(value)
        setAmountUSD((value * exchangeRate).toFixed(2))
    }, [exchangeRate, validateAmount])



    const handleSetPercentage = useCallback((percent: number) => {
        setPercentage(percent)
        setIsDirectAmountInput(false)

        if (isConnected) {
            const balance = mode === "buy" ? tradeAmount?.sol_balance || 0 : tradeAmount?.token_balance || 0
            const newAmount = ((balance * percent) / 100).toFixed(6)
            setAmount(newAmount)
            validateAmount(Number(newAmount))
            // Calculate amountUSD using the newAmount we just calculated
            if (mode === "buy") {
                const numericAmount = Number(newAmount)
                setAmountUSD((numericAmount * exchangeRate).toFixed(2))
            }
        }
    }, [isConnected, mode, tradeAmount, exchangeRate])

    const handleEditClick = useCallback((index: number) => {
        setEditingIndex(index)
        setEditValue(percentageValues[index].toString())
    }, [percentageValues])

    const handleEditSave = useCallback((index: number) => {
        const newValue = Number(editValue)
        if (!isNaN(newValue) && newValue > 0 && newValue <= 100) {
            const newValues = [...percentageValues]
            newValues[index] = newValue
            newValues.sort((a, b) => a - b)
            setPercentageValues(newValues)
        }
        setEditingIndex(null)
    }, [editValue, percentageValues, setPercentageValues])

    const handleEditKeyPress = useCallback((e: React.KeyboardEvent, index: number) => {
        if (e.key === 'Enter') {
            handleEditSave(index)
        } else if (e.key === 'Escape') {
            setEditingIndex(null)
        }
    }, [handleEditSave])

    const timeoutHandle = useCallback(() => {
        // Clear any existing timeout
        if (timeoutIdRef.current) {
            clearTimeout(timeoutIdRef.current)
        }
        // Set new timeout
        timeoutIdRef.current = setTimeout(() => {
            setIsLoading(false)
        }, 2000)
    }, [])
    // Cleanup timeout when component unmounts
    useEffect(() => {
        return () => {
            if (timeoutIdRef.current) {
                clearTimeout(timeoutIdRef.current)
            }
        }
    }, [])

    const handleSubmit = useCallback(async () => {
        const numericAmount = Number(amount)
        setIsLoading(true)
        timeoutHandle()
        if (!validateAmount(numericAmount)) {
            notify({
                message: amountError,
                type: 'error'
            })
            return
        }

        try {
            const result = await createTrading({
                order_trade_type: mode,
                order_type: "market",
                order_token_name: tokenAmount?.token_address || tokenInfor.symbol,
                order_token_address: tokenAmount?.token_address || tokenInfor.address,
                order_price:
                    mode === "sell"
                        ? Number(amount) * (tokenAmount?.token_price || 0)
                        : Number(amount) * (solPrice?.priceUSD || 0),
                order_qlty: Number(amount),
            })
            console.log("result", result)
            if (result.status === 201 || result.status === 200) {
                setAmount("0.00")
                setPercentage(0)
                setAmountUSD("0.00")
                setIsDirectAmountInput(false)
                refetchTradeAmount()
                notify({
                    message: t('trading.panel.success'),
                    type: 'success'
                })
            } else {
                setAmount("0.00")
                setPercentage(0)
                setAmountUSD("0.00")
                setIsDirectAmountInput(false)
                notify({
                    message: t('trading.panel.error'),
                    type: 'error'
                })
            }
        } catch (error) {
            setAmount("0.00")
            setPercentage(0)
            setAmountUSD("0.00")
            setIsDirectAmountInput(false)
            notify({
                message: t('trading.panel.error'),
                type: 'error'
            })
        }
    }, [mode, amount, tokenAmount, solPrice, t, validateAmount, amountError, tokenInfor, refetchTradeAmount, timeoutHandle])

    // Reset amount and percentage when mode changes
    useEffect(() => {
        setAmount("0.00")
        setPercentage(0)
        setIsDirectAmountInput(false)
    }, [mode])

    // Update amount when balance changes
    useEffect(() => {
        if (!isDirectAmountInput && percentage > 0) {
            const balance = mode === "buy" ? tradeAmount?.sol_balance || 0 : tradeAmount?.token_balance || 0
            const newAmount = ((balance * percentage) / 100).toFixed(6)
            setAmount(newAmount)
        }
    }, [tradeAmount, mode, percentage, isDirectAmountInput])

    return (
        <div className="h-full flex flex-col py-3 px-2">
            {/* Mode Tabs */}
            <div className="flex group bg-gray-100 dark:bg-theme-neutral-1000 rounded-md 2xl:h-[35px] h-[30px] mb-1">
                <button
                    className={`flex-1 rounded-md 2xl:max-h-[30px] max-h-[23px] 2xl:text-sm text-xs cursor-pointer uppercase text-center ${mode === "buy" ? "border-green-500 text-green-600 dark:text-theme-green-200 border-1 bg-green-50 dark:bg-theme-green-100 font-semibold" : "text-gray-500 dark:text-neutral-400"}`}
                    onClick={() => setMode("buy")}
                >
                    {t('trading.panel.buy')}
                </button>
                <button
                    className={`flex-1 rounded-md cursor-pointer 2xl:max-h-[30px] max-h-[23px] 2xl:text-sm text-xs uppercase text-center ${mode === "sell" ? "border-red-500 text-red-600 dark:text-theme-red-100 border-1 bg-red-50 dark:bg-theme-red-300 font-semibold" : "text-gray-500 dark:text-neutral-400"}`}
                    onClick={() => setMode("sell")}
                >
                    {t('trading.panel.sell')}
                </button>
            </div>

            <div className="rounded-lg flex flex-col md:justify-between gap-2 lg:gap-3 h-full overflow-y-auto pr-2">
                {/* Amount Input */}
                <div className="relative mt-3 flex flex-col gap-2">
                    <div className={`bg-gray-50 dark:bg-neutral-900 rounded-md flex items-center border ${amountError ? 'border-red-500' : 'border-blue-200 dark:border-gray-600'} px-3 flex justify-between items-center ${height > 700 ? 'py-1.5' : 'h-[30px]'} relative`}>
                        <div className="flex items-center gap-2 w-full">
                            <span className="text-gray-500 dark:text-neutral-400 text-base pointer-events-none">{mode === "buy" ? "SOL:" : tokenInfor?.symbol + ":"}</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={handleAmountChange}
                                placeholder="0.00"
                                className="bg-transparent text-gray-900 dark:text-neutral-200 font-medium text-base focus:outline-none max-w-[120px]"
                            />
                        </div>
                        {mode === "buy" ? (
                            <div className={`${STYLE_TEXT_BASE} flex items-center !text-theme-primary-500 !text-base font-semibold`}>${amountUSD}</div>
                        ) : (
                            <div className={`${STYLE_TEXT_BASE} flex items-center !text-theme-primary-500 !text-base font-semibold`}>${(tokenInfor?.price * Number(amount)).toFixed(4)}</div>
                        )}
                    </div>
                    {amountError && (
                        <div className="text-red-500 text-sm">
                            {amountError}
                        </div>
                    )}

                    {/* USD Value and Balance */}
                    <div className="flex flex-wrap justify-between text-sm mt-2">
                        {!isDirectAmountInput && (
                            <span className={`${STYLE_TEXT_BASE} text-theme-primary-500 font-semibold ml-1`}>
                                {percentage}%
                            </span>
                        )}
                        <div className={STYLE_TEXT_BASE}>
                            {t('trading.panel.balance')}: {mode === "buy"
                                ? (tradeAmount?.sol_balance || 0).toFixed(3) + "  " + currency.symbol
                                : (tradeAmount?.token_balance || 0).toFixed(6) + " " + tokenInfor?.symbol}
                        </div>
                    </div>

                    {/* Percentage Controls */}
                    <div className="mb-1 pb-3">
                        <CustomRangeSlider
                            min={0}
                            max={100}
                            value={percentage}
                            onChange={(newPercentage) => {
                                setPercentage(newPercentage)
                                setIsDirectAmountInput(false)
                                if (isConnected) {
                                    const balance = mode === "buy" ? tradeAmount?.sol_balance || 0 : tradeAmount?.token_balance || 0
                                    const newAmount = ((balance * newPercentage) / 100).toFixed(6)
                                    setAmount(newAmount)
                                    validateAmount(Number(newAmount))
                                    if (mode === "buy") {
                                        const numericAmount = Number(newAmount)
                                        setAmountUSD((numericAmount * exchangeRate).toFixed(2))
                                    }
                                }
                            }}
                            marks={[0, 25, 50, 75, 100]}
                            className="w-full"
                        />
                    </div>

                    <PercentageButtons
                        percentageValues={percentageValues}
                        percentage={percentage}
                        onSetPercentage={handleSetPercentage}
                        onEditClick={handleEditClick}
                        onEditSave={handleEditSave}
                        editingIndex={editingIndex}
                        editValue={editValue}
                        setEditValue={setEditValue}
                        onEditKeyPress={handleEditKeyPress}
                    />
                </div>

                {/* Action Button */}
                <div >
                    <button
                        onClick={handleSubmit}
                        disabled={isButtonDisabled || isLoading}
                        className={`w-full 2xl:py-2 py-1 mt-2 rounded-full text-white font-semibold text-sm transition-colors relative ${isButtonDisabled || isLoading
                            ? "bg-gray-400 cursor-not-allowed dark:bg-gray-600"
                            : mode === "buy"
                                ? "bg-green-500 hover:bg-green-600 dark:bg-theme-green-200 dark:hover:bg-theme-green-200/90"
                                : "bg-red-500 hover:bg-red-600 dark:bg-theme-red-100 dark:hover:bg-theme-red-100/90"
                            }`}
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                {t('trading.panel.processing')}
                            </div>
                        ) : (
                            mode === "buy" ? t('trading.panel.buy') : t('trading.panel.sell')
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
