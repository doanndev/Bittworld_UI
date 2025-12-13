"use client"

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getBalanceInfo } from '@/services/api/TelegramWalletService'
import { createSwap, getSwapHistory } from '@/services/api/SwapService'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useLang } from '@/lang/useLang'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { ArrowUpDown, X, History, ArrowLeftRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog'
import { toast } from 'react-hot-toast'
import { useTheme } from 'next-themes'
import { formatSolBalance } from '@/utils/format'

// Extracted SwapInterface as a separate component
const SwapInterface = React.memo(({ 
  balance, 
  fromAmount, 
  setFromAmount, 
  toAmount, 
  setToAmount, 
  handleFromAmountChange, 
  handleToAmountChange, 
  handleSwap, 
  isSwapLoading, 
  classes, 
  getTokenIcon,
  fromToken,
  toToken,
  handleSwapTokens,
  handleSetMaxAmount,
  insufficientBalance,
  isDark,
  isSwapping,
  swapRotation
}: {
  balance: any
  fromAmount: string
  setFromAmount: (value: string) => void
  toAmount: string
  setToAmount: (value: string) => void
  handleFromAmountChange: (value: string) => void
  handleToAmountChange: (value: string) => void
  handleSwap: () => void
  isSwapLoading: boolean
  classes: any
  getTokenIcon: (token: string) => React.ReactNode
  fromToken: string
  toToken: string
  handleSwapTokens: () => void
  handleSetMaxAmount: () => void
  insufficientBalance: boolean
  isDark: boolean
  isSwapping: boolean
  swapRotation: number
}) => {
  const { t } = useLang()

  return (
    <div 
      className={`rounded-xl sm:rounded-2xl ${classes.padding} h-fit flex-1 backdrop-blur-xl`}
      style={{
        background: isDark
          ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.4) 100%)'
          : 'linear-gradient(135deg, rgba(249, 250, 251, 0.85) 0%, rgba(243, 244, 246, 0.8) 100%)',
        border: isDark
          ? '1px solid rgba(107, 114, 128, 0.3)'
          : '1px solid rgba(156, 163, 175, 0.3)',
        boxShadow: isDark
          ? '0 8px 32px -8px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(107, 114, 128, 0.1) inset'
          : '0 8px 32px -8px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(156, 163, 175, 0.1) inset',
      }}
    >
      <div className="text-center md:mb-6">
        <h2 className={`${classes.subtitle} font-bold text-theme-primary-500 mb-1`}>{t('swap.easySwaps')}</h2>
      </div>

      <div className="flex flex-col gap-3 sm:gap-4">
        {/* From Section */}
        <div 
          className="rounded-xl px-4 py-3 sm:py-4 flex flex-col justify-between gap-3 backdrop-blur-sm"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.2) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.4) 100%)',
            border: isDark
              ? '1px solid rgba(107, 114, 128, 0.2)'
              : '1px solid rgba(156, 163, 175, 0.2)',
            transform: isSwapping ? 'translateY(80px)' : 'translateY(0)',
            opacity: isSwapping ? 0.2 : 1,
            transition: 'transform 600ms cubic-bezier(0.4, 0, 0.2, 1), opacity 600ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
            <div className="flex items-start justify-between gap-2 flex-col">
              <div className="flex items-center gap-2">
                {getTokenIcon(fromToken)}
              <span className={`font-semibold ${classes.bodyText} ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {fromToken.toUpperCase()}
              </span>
              </div>
            </div>
            <div className="flex md:items-center justify-between gap-2 flex-col md:flex-row w-full">
            <span className={`${classes.historyText} ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('swap.balance')}: <span className="text-theme-primary-500 font-semibold">
                {fromToken === "solana" ? formatSolBalance(balance?.sol?.token_balance) || "0" : balance?.usdt?.token_balance || "0"}
              </span>
            </span>
            <div className="flex items-center gap-2 w-full md:w-auto">
                <input
                  type="text"
                  value={fromAmount}
                  onChange={(e) => handleFromAmountChange(e.target.value)}
                className={`${classes.inputText} w-full md:w-auto h-9 sm:h-10 outline-none rounded-lg text-right px-3 ${isDark ? 'bg-black/30 text-white border-gray-600/30' : 'bg-white/50 text-gray-900 border-gray-300/30'} border backdrop-blur-sm placeholder:text-gray-400 placeholder:text-sm focus:border-theme-primary-500/50 focus:ring-1 focus:ring-theme-primary-500/30 transition-all`}
                  placeholder="0.00"
                />
                
                <Button
                  onClick={handleSetMaxAmount}
                  variant="outline"
                  size="sm"
                className="text-xs px-3 py-1.5 h-9 sm:h-10 rounded-lg transition-all duration-300"
                style={{
                  borderColor: isDark ? 'rgba(107, 114, 128, 0.3)' : 'rgba(156, 163, 175, 0.3)',
                  background: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.3)',
                  color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(30, 41, 59, 0.85)',
                }}
                >
                  {t('swap.max')}
                </Button>
            </div>
          </div>
        </div>

        {/* Exchange Rate Display */}
        <div className="flex justify-center items-center gap-2">
          <span className={`${classes.historyText} ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            1 SOL = ${balance?.sol?.token_price_usd.toFixed(3) || "0.00"} USDT
          </span>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleSwapTokens}
            variant="ghost"
            size="icon"
            className="rounded-full w-10 h-10 sm:w-12 sm:h-12 transition-all duration-300 hover:scale-110"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(31, 193, 107, 0.15) 0%, rgba(31, 193, 107, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(31, 193, 107, 0.12) 0%, rgba(31, 193, 107, 0.08) 100%)',
              border: isDark
                ? '1px solid rgba(31, 193, 107, 0.3)'
                : '1px solid rgba(31, 193, 107, 0.25)',
              color: '#1FC16B',
            }}
          >
            <ArrowUpDown 
              className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-600"
              style={{
                transform: `rotate(${swapRotation}deg)`,
              }}
            />
          </Button>
        </div>

        {/* To Section */}
        <div 
          className="rounded-xl px-4 py-3 sm:py-4 backdrop-blur-sm"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.2) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.4) 100%)',
            border: isDark
              ? '1px solid rgba(107, 114, 128, 0.2)'
              : '1px solid rgba(156, 163, 175, 0.2)',
            transform: isSwapping ? 'translateY(-80px)' : 'translateY(0)',
            opacity: isSwapping ? 0.2 : 1,
            transition: 'transform 600ms cubic-bezier(0.4, 0, 0.2, 1), opacity 600ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getTokenIcon(toToken)}
              <span className={`font-semibold ${classes.bodyText} ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {toToken.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className={`${classes.historyText} ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('swap.balance')}: <span className="text-theme-primary-500 font-semibold">
                {toToken === "usdt" ? balance?.usdt?.token_balance || "0" : formatSolBalance(balance?.sol?.token_balance) || "0"}
              </span>
            </span>
            <span className={`${classes.inputText} font-semibold h-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {toAmount || "0.00"}
            </span>
          </div>
        </div>

        {/* Insufficient Balance Warning */}
        {insufficientBalance && (
          <div 
            className="mt-2 p-3 rounded-lg backdrop-blur-sm"
            style={{
              background: isDark
                ? 'rgba(239, 68, 68, 0.1)'
                : 'rgba(239, 68, 68, 0.05)',
              border: isDark
                ? '1px solid rgba(239, 68, 68, 0.3)'
                : '1px solid rgba(239, 68, 68, 0.2)',
            }}
          >
            <p className={`${classes.historyText} text-red-500 dark:text-red-400 text-center`}>
              {t('swap.insufficientBalance')}
            </p>
          </div>
        )}

        {/* Swap Action Button */}
        <Button
          onClick={handleSwap}
          disabled={
            !fromAmount || 
            !toAmount ||
            isSwapLoading || 
            insufficientBalance
          }
          className={`w-full mt-4 sm:mt-6 ${classes.buttonHeight} 
            bg-gradient-to-r from-theme-primary-500 to-theme-primary-400 
            hover:from-theme-primary-400 hover:to-theme-primary-500
            disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed
            text-white font-semibold py-4 rounded-full ${classes.bodyText} 
            transition-all duration-300 disabled:opacity-50`}
        >
          {isSwapLoading ? t('swap.swapping') : t('swap.swap')}
        </Button>
      </div>
    </div>
  )
})

SwapInterface.displayName = 'SwapInterface'

// Extracted HistoryInterface as a separate component
const HistoryInterface = React.memo(({ 
  swapHistory, 
  isHistoryLoading, 
  classes,
  isDark
}: {
  swapHistory: any[]
  isHistoryLoading: boolean
  classes: any
  isDark: boolean
}) => {
  const { t } = useLang()
  return (
    <div 
      className={`rounded-xl sm:rounded-2xl ${classes.padding} pr-0 flex-1 min-h-[43vh] backdrop-blur-xl`}
      style={{
        background: isDark
          ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.4) 100%)'
          : 'linear-gradient(135deg, rgba(249, 250, 251, 0.85) 0%, rgba(243, 244, 246, 0.8) 100%)',
        border: isDark
          ? '1px solid rgba(107, 114, 128, 0.3)'
          : '1px solid rgba(156, 163, 175, 0.3)',
        boxShadow: isDark
          ? '0 8px 32px -8px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(107, 114, 128, 0.1) inset'
          : '0 8px 32px -8px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(156, 163, 175, 0.1) inset',
      }}
    >
      <h2 className={`${classes.subtitle} font-semibold mb-6 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {t('swap.swapHistory')}
      </h2>

      {isHistoryLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className={isDark ? 'text-gray-400' : 'text-gray-500'}>{t('common.loading')}</div>
        </div>
      ) : swapHistory.length === 0 ? (
        <div className="flex justify-center items-center h-32">
          <div className={isDark ? 'text-gray-400' : 'text-gray-500'}>{t('swap.noSwapHistory')}</div>
        </div>
      ) : (
        <div className="space-y-1">
          {/* Header */}
          <div 
            className="grid grid-cols-3 gap-4 text-sm pb-3 border-b"
            style={{
              borderColor: isDark ? 'rgba(107, 114, 128, 0.2)' : 'rgba(156, 163, 175, 0.2)',
              color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
            }}
          >
            <div className={classes.historyText}>{t('swap.time')}</div>
            <div className={classes.historyText}>{t('swap.buy')}</div>
            <div className={classes.historyText}>{t('swap.sell')}</div>
          </div>

          {/* History Items */}
          <div className={`max-h-[${classes.maxHeight}] overflow-y-auto space-y-1 pr-4 scrollbar-thin`}>
            {swapHistory.map((item, index) => (
              <div
                key={item.id}
                className={`grid grid-cols-3 gap-4 py-3 px-2 rounded-lg ${classes.historyText} transition-colors`}
                style={{
                  background: index % 2 === 0
                    ? (isDark ? 'rgba(31, 193, 107, 0.03)' : 'rgba(31, 193, 107, 0.02)')
                    : 'transparent',
                }}
              >
                <div className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                  {item.time} {item.date}
                </div>
                <div className={isDark ? 'text-white' : 'text-gray-900'}>
                  {item.buyAmount} {item.buyToken}
                </div>
                <div className={isDark ? 'text-white' : 'text-gray-900'}>
                  {item.sellAmount} {item.sellToken}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})

HistoryInterface.displayName = 'HistoryInterface'

// Main SwapModal component
const SwapModal = ({ isOpen, onClose, selectedToken }: { isOpen: boolean; onClose: () => void, selectedToken: string }) => {
  const { t } = useLang()
  const { theme, resolvedTheme } = useTheme()
  const [mountedTheme, setMountedTheme] = useState(false)
  const isDark = resolvedTheme === 'dark' || (resolvedTheme === undefined && theme === 'dark')

  useEffect(() => {
    setMountedTheme(true)
  }, [])

  const isMobile = useMediaQuery('(max-width: 767px)')
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  // State
  const [fromAmount, setFromAmount] = useState("")
  const [toAmount, setToAmount] = useState("")
  // Fix: When selectedToken is USDT, fromToken should be usdt, toToken should be solana
  const [fromToken, setFromToken] = useState(selectedToken === "SOL" ? "solana" : "usdt")
  const [toToken, setToToken] = useState(selectedToken === "SOL" ? "usdt" : "solana")
  const [showHistory, setShowHistory] = useState(true)
  const [activeTab, setActiveTab] = useState<'swap' | 'history'>('swap')
  const [isLoading, setIsLoading] = useState(false)
  const [insufficientBalance, setInsufficientBalance] = useState(false)
  const [isSwapping, setIsSwapping] = useState(false)
  const [swapRotation, setSwapRotation] = useState(0)

  // API Queries
  const { data: balance, isLoading: isBalanceLoading } = useQuery({
    queryKey: ['balance'],
    queryFn: getBalanceInfo,
    refetchInterval: 5000
  })

  const { data: swapHistoryData, isLoading: historyLoading } = useQuery({
    queryKey: ['swapHistory'],
    queryFn: getSwapHistory,
    enabled: isOpen,
  })

  // Update tokens when selectedToken changes
  useEffect(() => {
    if (selectedToken) {
      const newFromToken = selectedToken === "SOL" ? "solana" : "usdt"
      const newToToken = selectedToken === "SOL" ? "usdt" : "solana"
      setFromToken(newFromToken)
      setToToken(newToToken)
      // Reset amounts when token changes
      setFromAmount("")
      setToAmount("")
      setInsufficientBalance(false)
    }
  }, [selectedToken])

  const createSwapMutation = useMutation({
    mutationFn: createSwap,
    onSuccess: (data) => {
      toast.success(t('swap.swapSuccess'))
      setFromAmount("")
      setToAmount("")
    },
    onError: (error: any) => {
      console.error("Swap failed:", error)
      if (error?.response?.data?.message == "Insufficient SOL for transaction fees") {
        toast.error(t('swap.insufficientSOL'))
      }else{
        toast.error(t('swap.swapFailed'))
      }
    }
  })

  // Helper function to get current balance for a token
  const getCurrentBalance = (token: string) => {
    const balanceValue = token === "solana" ? balance?.sol?.token_balance || 0 : balance?.usdt?.token_balance || 0
    return balanceValue
  }

  // Helper function to check if amount exceeds balance
  const checkBalanceExceeded = (amount: number, token: string) => {
    const currentBalance = getCurrentBalance(token)
    return amount > currentBalance
  }

  // Helper function to validate decimal input
  const isValidDecimalInput = (value: string) => {
    const decimalRegex = /^$|^\.$|^\d*\.?\d*$/
    return decimalRegex.test(value)
  }

  // Helper function to check if input is a valid number for calculation
  const isValidNumberForCalculation = (value: string) => {
    return value && value !== "." && !isNaN(Number(value)) && Number(value) > 0
  }

  // Input handlers
  const handleFromAmountChange = (value: string) => {
    if (isValidDecimalInput(value)) {
      setFromAmount(value)
      
      if (isValidNumberForCalculation(value)) {
        const numValue = Number(value)
        const currentBalance = getCurrentBalance(fromToken)
        const currentExchangeRate = balance?.sol?.token_price_usd || 190
        
        if (checkBalanceExceeded(numValue, fromToken)) {
          setInsufficientBalance(true)
        } else {
          setInsufficientBalance(false)
        }
        
        const calculatedTo =
          fromToken === "solana" ? (numValue * currentExchangeRate).toFixed(2) : (numValue / currentExchangeRate).toFixed(6)
        setToAmount(calculatedTo)
      } else {
        setToAmount("")
        setInsufficientBalance(false)
      }
    }
  }

  const handleSwapTokens = () => {
    setIsSwapping(true)
    // Rotate icon 180 degrees (accumulate rotation)
    setSwapRotation(prev => prev + 180)
    
    // Wait for animation to complete before swapping
    setTimeout(() => {
    const tempToken = fromToken
    const tempAmount = fromAmount || ""
    setFromToken(toToken)
    setToToken(tempToken)
    setFromAmount(toAmount || "")
    setToAmount(tempAmount)
      
      // Reset animation state after swap completes
      setTimeout(() => {
        setIsSwapping(false)
      }, 50)
    }, 300) // Half of animation duration
  }

  const handleSwap = async () => {
    if (!fromAmount || !toAmount) {
      toast.error(t('swap.enterValidAmounts'))
      return
    }

    if (!isValidNumberForCalculation(fromAmount) || !isValidNumberForCalculation(toAmount)) {
      toast.error(t('swap.enterValidNumbers'))
      return
    }

    if (isLoading) {
      return
    }

    setIsLoading(true)
    try {
      const swapType = fromToken === "solana" ? "sol_to_usdt" : "usdt_to_sol"
      const inputAmount = parseFloat(fromAmount)
      
      const res = await createSwapMutation.mutateAsync({
        swap_type: swapType,
        input_amount: inputAmount
      })
    } catch (error) {
      console.error("Swap error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetMaxAmount = () => {
    const currentBalance = getCurrentBalance(fromToken)
    if (currentBalance > 0) {
      const amount = currentBalance
      handleFromAmountChange(amount)
    }
  }

  // Format swap history data from API
  const formatSwapHistory = (swapOrders: any[]) => {
    const formatted = swapOrders.map((order) => ({
      id: order.swap_order_id.toString(),
      time: new Date(order.created_at).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
      date: new Date(order.created_at).toLocaleDateString('en-US', { 
        month: '2-digit', 
        day: '2-digit', 
        year: 'numeric' 
      }),
      sellAmount: parseFloat(order.output_amount),
      sellToken: order.swap_type === "sol_to_usdt" ? "USDT" : "SOL",
      buyAmount: parseFloat(order.input_amount),
      buyToken: order.swap_type === "sol_to_usdt" ? "SOL" : "USDT",
      status: order.status,
      transactionHash: order.transaction_hash
    }))
    return formatted
  }

  // Responsive classes
  const classes = useMemo(() => {
    if (isMobile) {
      return {
        modal: "w-[95vw] h-[90vh] max-w-none p-4",
        title: "text-lg",
        subtitle: "text-base",
        bodyText: "text-sm",
        inputText: "text-sm",
        historyText: "text-xs",
        padding: "p-4",
        gap: "gap-3",
        iconSize: "w-5 h-5",
        buttonHeight: "h-10",
        maxHeight: "40vh"
      }
    } else if (isTablet) {
      return {
        modal: "max-w-4xl max-h-[85vh] p-5",
        title: "text-xl",
        subtitle: "text-lg",
        bodyText: "text-sm",
        inputText: "text-base",
        historyText: "text-xs",
        padding: "p-5",
        gap: "gap-4",
        iconSize: "w-6 h-6",
        buttonHeight: "h-8",
        maxHeight: "50vh"
      }
    } else {
      return {
        modal: "max-w-6xl max-h-[80vh] p-6",
        title: "text-2xl",
        subtitle: "text-xl",
        bodyText: "text-base",
        inputText: "text-base",
        historyText: "text-xs",
        padding: "p-6",
        gap: "gap-6",
        iconSize: "w-6 h-6",
        buttonHeight: "h-8",
        maxHeight: "50vh"
      }
    }
  }, [isMobile, isTablet])

  // Token icon component
  const getTokenIcon = useCallback((token: string) => {
    const tokenName = token.toUpperCase()
    if (tokenName === "SOLANA") {
      return (
        <>
          <img src="/solana-coin.png" alt="SOL" className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
        </>
      )
    } else {
      return (
        <img src="/usdt-coin.png" alt="USDT" className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
      )
    }
  }, [isMobile])

  const swapHistory = useMemo(() => {
    return swapHistoryData?.data ? formatSwapHistory(swapHistoryData.data) : []
  }, [swapHistoryData])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`${classes.modal} outline-none overflow-y-auto max-h-auto md:max-h-[80vh] h-fit relative`}
        style={{
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: mountedTheme && isDark
            ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.75) 100%)'
            : 'linear-gradient(135deg, rgba(249, 250, 251, 0.95) 0%, rgba(243, 244, 246, 0.9) 100%)',
          border: mountedTheme && isDark
            ? '1px solid rgba(31, 193, 107, 0.4)'
            : '1px solid rgba(31, 193, 107, 0.3)',
          boxShadow: mountedTheme && isDark
            ? '0 0 0 1px rgba(31, 193, 107, 0.3), 0 0 30px rgba(31, 193, 107, 0.25), 0 0 60px rgba(31, 193, 107, 0.15), 0 20px 60px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(107, 114, 128, 0.1) inset, 0 8px 32px -8px rgba(107, 114, 128, 0.15)'
            : '0 0 0 1px rgba(31, 193, 107, 0.25), 0 0 30px rgba(31, 193, 107, 0.2), 0 0 60px rgba(31, 193, 107, 0.1), 0 20px 60px -12px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(229, 231, 235, 0.3) inset, 0 8px 32px -8px rgba(0, 0, 0, 0.06)',
        }}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {/* Gradient Glow Overlay */}
        {mountedTheme && (
          <div 
            className="absolute inset-0 pointer-events-none rounded-xl sm:rounded-2xl opacity-40"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(31, 193, 107, 0.15) 0%, rgba(31, 193, 107, 0.05) 50%, rgba(31, 193, 107, 0.15) 100%)'
                : 'linear-gradient(135deg, rgba(31, 193, 107, 0.12) 0%, rgba(31, 193, 107, 0.04) 50%, rgba(31, 193, 107, 0.12) 100%)',
            }}
          />
        )}
        <div className="relative z-10">
        <DialogHeader className="flex flex-row items-center justify-between max-h-10 mb-4">
          <DialogTitle className={`${classes.title} font-bold ${mountedTheme && isDark ? 'text-white' : 'text-gray-900'} max-h-10`}>
            {t('swap.swap')}
          </DialogTitle>
        </DialogHeader>

        {/* Loading State for Balance */}
        {isBalanceLoading && (
          <div 
            className="rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-4 sm:mb-6 backdrop-blur-xl"
            style={{
              background: mountedTheme && isDark
                ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.3) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.5) 100%)',
              border: mountedTheme && isDark
                ? '1px solid rgba(107, 114, 128, 0.2)'
                : '1px solid rgba(156, 163, 175, 0.2)',
            }}
          >
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <div className={`h-4 w-16 rounded animate-pulse ${mountedTheme && isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
                <div className={`h-6 w-24 rounded animate-pulse ${mountedTheme && isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
                <div className={`h-4 w-20 rounded animate-pulse ${mountedTheme && isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
              </div>
              <div className="space-y-2">
                <div className={`h-4 w-16 rounded animate-pulse ${mountedTheme && isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
                <div className={`h-6 w-24 rounded animate-pulse ${mountedTheme && isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
                <div className={`h-4 w-20 rounded animate-pulse ${mountedTheme && isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
              </div>
            </div>
            <div className={`mt-4 pt-4 h-6 w-32 rounded animate-pulse ${mountedTheme && isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
          </div>
        )}

        {/* Mobile Tabs */}
        {isMobile && (
          <div 
            className="flex rounded-lg p-1 mb-4 h-fit gap-2 backdrop-blur-sm"
            style={{
              background: mountedTheme && isDark
                ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.2) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.4) 100%)',
              border: mountedTheme && isDark
                ? '1px solid rgba(107, 114, 128, 0.2)'
                : '1px solid rgba(156, 163, 175, 0.2)',
            }}
          >
            <Button
              onClick={() => setActiveTab('swap')}
              variant={activeTab === 'swap' ? 'default' : 'ghost'}
              className={`flex-1 transition-all duration-300 ${
                activeTab === 'swap' 
                  ? 'bg-gradient-to-r from-theme-primary-500 to-theme-primary-400 text-white' 
                  : (mountedTheme && isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900')
              }`}
            >
              <ArrowLeftRight className="w-4 h-4 mr-2" />
              {t('swap.swap')}
            </Button>
            <Button
              onClick={() => setActiveTab('history')}
              variant={activeTab === 'history' ? 'default' : 'ghost'}
              className={`flex-1 transition-all duration-300 ${
                activeTab === 'history' 
                  ? 'bg-gradient-to-r from-theme-primary-500 to-theme-primary-400 text-white' 
                  : (mountedTheme && isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900')
              }`}
            >
              <History className="w-4 h-4 mr-2" />
              {t('swap.history')}
            </Button>
          </div>
        )}

        <div className={`flex ${isMobile ? 'flex-col' : 'justify-between items-center'} ${classes.gap}`}>
          {/* Swap History - Desktop/Tablet */}
          {!isMobile && showHistory && (
            <HistoryInterface
              swapHistory={swapHistory}
              isHistoryLoading={historyLoading}
              classes={classes}
              isDark={mountedTheme && isDark}
            />
          )}

          {/* Swap Interface - Desktop/Tablet */}
          {!isMobile && (
            <SwapInterface
              balance={balance}
              fromAmount={fromAmount}
              setFromAmount={setFromAmount}
              toAmount={toAmount}
              setToAmount={setToAmount}
              handleFromAmountChange={handleFromAmountChange}
              handleToAmountChange={() => {}}
              handleSwap={handleSwap}
              isSwapLoading={isLoading || createSwapMutation.isPending}
              classes={classes}
              getTokenIcon={getTokenIcon}
              fromToken={fromToken}
              toToken={toToken}
              handleSwapTokens={handleSwapTokens}
              handleSetMaxAmount={handleSetMaxAmount}
              insufficientBalance={insufficientBalance}
              isDark={mountedTheme && isDark}
              isSwapping={isSwapping}
              swapRotation={swapRotation}
            />
          )}

          {/* Mobile Content */}
          {isMobile && (
            <>
              {activeTab === 'swap' && (
                <SwapInterface
                  balance={balance}
                  fromAmount={fromAmount}
                  setFromAmount={setFromAmount}
                  toAmount={toAmount}
                  setToAmount={setToAmount}
                  handleFromAmountChange={handleFromAmountChange}
                  handleToAmountChange={() => {}}
                  handleSwap={handleSwap}
                  isSwapLoading={isLoading || createSwapMutation.isPending}
                  classes={classes}
                  getTokenIcon={getTokenIcon}
                  fromToken={fromToken}
                  toToken={toToken}
                  handleSwapTokens={handleSwapTokens}
                  handleSetMaxAmount={handleSetMaxAmount}
                  insufficientBalance={insufficientBalance}
                  isDark={mountedTheme && isDark}
                  isSwapping={isSwapping}
                  swapRotation={swapRotation}
                />
              )}
              {activeTab === 'history' && (
                <HistoryInterface
                  swapHistory={swapHistory}
                  isHistoryLoading={historyLoading}
                  classes={classes}
                  isDark={mountedTheme && isDark}
                />
              )}
            </>
          )}
        </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SwapModal 