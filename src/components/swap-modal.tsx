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
  insufficientBalance
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
}) => {
  const { t } = useLang()

  return (
    <div className={`bg-white dark:bg-[#000000] rounded-md ${classes.padding} h-fit flex-1`}>
      <div className="text-center md:mb-6">
        <h2 className={`${classes.subtitle} font-bold text-theme-primary-500 mb-1`}>{t('swap.easySwaps')}</h2>
      </div>

      <div className="flex flex-col gap-2">
        {/* From Section */}
        <div className="">
          <div className="bg-gray-100 dark:bg-[#1B1A1A] rounded-xl px-4 py-2 pt-3 flex flex-col justify-between gap-2">
            <div className="flex items-start justify-between gap-2 flex-col">
              <div className="flex items-center gap-2">
                {getTokenIcon(fromToken)}
                <span className={`font-semibold ${classes.bodyText} text-gray-900 dark:text-white`}>{fromToken.toUpperCase()}</span>
              </div>
            </div>
            <div className="flex md:items-center justify-between gap-2 flex-col md:flex-row w-full">
              <span className={`${classes.historyText} text-gray-600 dark:text-white`}>
                {t('swap.balance')}: <span className="text-theme-primary-500 font-semibold">{fromToken === "solana" ? balance?.sol?.token_balance || "0" : balance?.usdt?.token_balance || "0"}</span>
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={fromAmount}
                  onChange={(e) => handleFromAmountChange(e.target.value)}
                  className={`${classes.inputText} w-full md:w-auto h-8 outline-none bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-500 rounded-md text-right p-0 text-gray-900 dark:text-white pr-3 placeholder:text-gray-400 placeholder:text-sm`}
                  placeholder="0.00"
                />
                
                <Button
                  onClick={handleSetMaxAmount}
                  variant="outline"
                  size="sm"
                  className="text-xs px-2 py-1 h-7 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {t('swap.max')}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Exchange Rate Display */}
        <div className="flex justify-center items-center gap-2">
          <span className={`${classes.historyText} text-gray-500 dark:text-gray-400`}>
            1 SOL = ${balance?.sol?.token_price_usd.toFixed(3) || "0.00"} USDT
          </span>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleSwapTokens}
            variant="ghost"
            size="icon"
            className={`rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-white w-7 h-7`}
          >
            <ArrowUpDown className={`w-4 h-4`} />
          </Button>
        </div>

        {/* To Section */}
        <div className="space-y-2">
          <div className="bg-gray-100 dark:bg-[#1B1A1A] rounded-xl px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getTokenIcon(toToken)}
                <span className={`font-semibold ${classes.bodyText} text-gray-900 dark:text-white`}>{toToken.toUpperCase()}</span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className={`${classes.historyText} text-gray-600 dark:text-white`}>
                {t('swap.balance')}: <span className="text-theme-primary-500 font-semibold">{toToken === "usdt" ? balance?.usdt?.token_balance || "0" : balance?.sol?.token_balance || "0"}</span>
              </span>
              <span className={`${classes.inputText} font-semibold h-6 text-gray-900 dark:text-white`}>{toAmount || "0.00"}</span>
            </div>
          </div>
        </div>

        {/* Insufficient Balance Warning */}
        {insufficientBalance && (
          <div className="mt-2 p-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-md">
            <p className={`${classes.historyText} text-red-600 dark:text-red-400 text-center`}>
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
          className={`w-full mt-6 ${classes.buttonHeight} bg-theme-primary-500 hover:bg-theme-primary-600 text-white font-semibold py-4 rounded-md ${classes.bodyText} disabled:opacity-50 disabled:cursor-not-allowed`}
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
  classes 
}: {
  swapHistory: any[]
  isHistoryLoading: boolean
  classes: any
}) => {
  const { t } = useLang()
  return (
    <div className={`bg-white dark:bg-[#000000] rounded-md ${classes.padding} pr-0 flex-1 min-h-[43vh]`}>
      <h2 className={`${classes.subtitle} font-semibold mb-6 text-center text-gray-900 dark:text-white`}>{t('swap.swapHistory')}</h2>

      {isHistoryLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="text-gray-500 dark:text-gray-400">{t('common.loading')}</div>
        </div>
      ) : swapHistory.length === 0 ? (
        <div className="flex justify-center items-center h-32">
          <div className="text-gray-500 dark:text-gray-400">{t('swap.noSwapHistory')}</div>
        </div>
      ) : (
        <div className="space-y-1">
          {/* Header */}
          <div className="grid grid-cols-3 gap-4 text-sm text-gray-500 dark:text-gray-400 pb-2 border-b border-gray-200 dark:border-gray-700">
            <div className={classes.historyText}>{t('swap.time')}</div>
            <div className={classes.historyText}>{t('swap.buy')}</div>
            <div className={classes.historyText}>{t('swap.sell')}</div>
          </div>

          {/* History Items */}
          <div className={`max-h-[${classes.maxHeight}] overflow-y-auto space-y-1 pr-4`}>
            {swapHistory.map((item, index) => (
              <div
                key={item.id}
                className={`grid grid-cols-3 gap-4 py-3 px-2 rounded-lg ${classes.historyText} ${index % 2 === 0 ? "bg-gray-50 dark:bg-[#1B1A1A]" : "bg-white dark:bg-[#000000]"
                  }`}
              >
                <div className="text-gray-600 dark:text-gray-300">
                  {item.time} {item.date}
                </div>
                <div className="text-gray-900 dark:text-white">
                  {item.buyAmount} {item.buyToken}
                </div>
                <div className="text-gray-900 dark:text-white">
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
    const tempToken = fromToken
    const tempAmount = fromAmount || ""
    setFromToken(toToken)
    setToToken(tempToken)
    setFromAmount(toAmount || "")
    setToAmount(tempAmount)
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
      <DialogContent className={`${classes.modal} outline-none overflow-y-auto bg-white dark:bg-[#121619] max-h-auto md:max-h-[80vh] h-fit border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white`} onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="flex flex-row items-center justify-between max-h-10">
          <DialogTitle className={`${classes.title} font-bold text-gray-900 dark:text-white max-h-10`}>{t('swap.swap')}</DialogTitle>
        </DialogHeader>

        {/* Mobile Tabs */}
        {isMobile && (
          <div className="flex bg-gray-100 dark:bg-[#1B1A1A] rounded-lg p-1 mb-4 h-fit gap-2">
            <Button
              onClick={() => setActiveTab('swap')}
              variant={activeTab === 'swap' ? 'default' : 'ghost'}
              className={`flex-1 ${activeTab === 'swap' ? 'bg-theme-primary-500 text-white' : 'text-gray-600 dark:text-gray-400'}`}
            >
              <ArrowLeftRight className="w-4 h-4 mr-2" />
              {t('swap.swap')}
            </Button>
            <Button
              onClick={() => setActiveTab('history')}
              variant={activeTab === 'history' ? 'default' : 'ghost'}
              className={`flex-1 ${activeTab === 'history' ? 'bg-theme-primary-500 text-white' : 'text-gray-600 dark:text-gray-400'}`}
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
                />
              )}
              {activeTab === 'history' && (
                <HistoryInterface
                  swapHistory={swapHistory}
                  isHistoryLoading={historyLoading}
                  classes={classes}
                />
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SwapModal 