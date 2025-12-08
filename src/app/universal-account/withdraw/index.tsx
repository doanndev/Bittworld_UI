"use client"

import { useState, useEffect } from "react"
import { Check, Copy, ChevronDown } from "lucide-react"
import { toast } from 'react-hot-toast';
import React from "react";
import { truncateString } from "@/utils/format";
import { createMultiTokenTransaction, getTransactionHistory } from "@/services/api/HistoryTransactionWallet";
import { useLang } from "@/lang/useLang";
import { useQuery } from "@tanstack/react-query";
import { getInforWallet, getMultiTokenBalances, getListBuyToken } from "@/services/api/TelegramWalletService";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from 'next-themes';

// Token type definition
interface TokenOption {
  token_address: string;
  token_name: string;
  token_symbol: string;
  token_logo_url: string;
  token_decimals: number;
  token_balance: number;
  token_balance_usd: number;
  token_price_usd: number;
  token_price_sol: number;
  is_verified: boolean;
}



export default function WithdrawWallet({ walletInfor }: { walletInfor: any }) {
  const { isAuthenticated } = useAuth();
  const { theme, resolvedTheme } = useTheme();
  const [mountedTheme, setMountedTheme] = useState(false);
  const isDark = resolvedTheme === 'dark' || (resolvedTheme === undefined && theme === 'dark');

  useEffect(() => {
    setMountedTheme(true);
  }, []);

  const { data: walletInforAccount, refetch: refetchWalletInforAccount } = useQuery({
    queryKey: ["wallet-infor"],
    queryFn: getInforWallet,
  });
  const { data: transactions, refetch: refetchTransactions } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => getTransactionHistory(),
  });

  // Fetch available tokens dynamically
  const { data: availableTokens, refetch: refetchAvailableTokens } = useQuery({
    queryKey: ["available-tokens"],
    queryFn: getListBuyToken,
    enabled: isAuthenticated,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0,
  });

  const { t } = useLang();

  // State management
  const [amount, setAmount] = useState<string>("0")
  const [recipientWallet, setRecipientWallet] = useState<string>("")
  const [isSending, setIsSending] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [recipientError, setRecipientError] = useState<string>("")
  const [copied, setCopied] = useState(false);
  const [googleAuthCode, setGoogleAuthCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [googleAuthError, setGoogleAuthError] = useState<string>("");
  const [selectedToken, setSelectedToken] = useState<TokenOption | null>(null);
  const [showTokenDropdown, setShowTokenDropdown] = useState(false);

  // Set default selected token when available tokens are loaded
  useEffect(() => {
    if (availableTokens?.tokens && availableTokens.tokens.length > 0 && !selectedToken) {
      setSelectedToken(availableTokens.tokens[0]);
    }
  }, [availableTokens, selectedToken]);

  // Get current token balance from availableTokens
  const getCurrentTokenBalance = () => {
    if (!selectedToken || !availableTokens?.tokens) return "0";

    // Find the selected token in availableTokens to get current balance
    const tokenData = availableTokens.tokens.find((token: TokenOption) => token.token_symbol === selectedToken.token_symbol);
    return tokenData?.token_balance?.toString() || "0";
  };

  // Kiểm tra điều kiện disable
  const isDisabled = React.useMemo(() => {
    if (!selectedToken) return { send: true, input: true };

    const numAmount = Number.parseFloat(amount);
    const balance = parseFloat(getCurrentTokenBalance());

    return {
      send: isSending ||
        !walletInfor?.solana_address ||
        numAmount > balance ||
        !!error,
      input: isSending,
      copy: isSending || !walletInfor?.solana_address
    };
  }, [amount, walletInfor, isSending, error, selectedToken, availableTokens]);
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (/^\d*\.?\d*$/.test(value) || value === '') {
      setAmount(value);
      setError("");

      // Validate amount after setting it
      if (value !== "") {
        validateAmount();
      }
    }
  };

  const validateAmount = () => {
    if (!selectedToken) return;

    const numValue = parseFloat(amount);
    const balance = parseFloat(getCurrentTokenBalance());

    if (selectedToken && numValue > balance) {
      setError(`${t('universal_account.amount_cannot_exceed_balance', { balance })}`);
    } else {
      setError("");
    }
  };

  const handleTokenSelect = (token: TokenOption) => {
    setSelectedToken(token);
    setAmount("0");
    setError("");
    setShowTokenDropdown(false);
  };

  const handleCopyAddress = () => {
    if (isDisabled.copy) return;
    navigator.clipboard.writeText(walletInfor.solana_address);
    setCopied(true);
    toast.success('Wallet address copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Function to handle Google Auth code input
  const handleGoogleAuthChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newCode = [...googleAuthCode];
    newCode[index] = value;
    setGoogleAuthCode(newCode);

    if (value && index < 5) {
      const nextInput = document.getElementById(`google-auth-${index + 1}`);
      nextInput?.focus();
    }
  };

  // Function to handle Google Auth paste
  const handleGoogleAuthPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newCode = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
    setGoogleAuthCode(newCode);
  };

  // Function to handle Google Auth keydown
  const handleGoogleAuthKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !googleAuthCode[index] && index > 0) {
      const prevInput = document.getElementById(`google-auth-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSend = async () => {
    if (!selectedToken) {
      toast.error(t('universal_account.please_select_token_first'));
      return;
    }

    if (isDisabled.send) return;

    // Validate recipient wallet
    if (!recipientWallet.trim()) {
      setRecipientError(t('universal_account.recipient_address_required'));
      return;
    }

    // Validate Google Auth if required
    if (walletInforAccount?.isGGAuth) {
      const code = googleAuthCode.join('');
      if (code.length !== 6) {
        setGoogleAuthError(t('universal_account.google_auth_required'));
        return;
      }
      setGoogleAuthError("");
    }

    setRecipientError("");
    setIsSending(true);

    try {
      const response = await createMultiTokenTransaction({
        wallet_address_to: recipientWallet,
        amount: Number(amount),
        type: "withdraw",
        token_symbol: selectedToken.token_symbol.length > 0 ? selectedToken.token_symbol : t('universal_account.not_available'),
        token_mint_address: selectedToken.token_address || undefined,
        google_auth_token: walletInforAccount?.isGGAuth ? googleAuthCode.join('') : undefined
      });

      setAmount("0");
      setRecipientWallet("");
      setGoogleAuthCode(["", "", "", "", "", ""]);
      refetchTransactions();
      refetchAvailableTokens();
      toast.success(t('universal_account.errors.transaction_success'));
    } catch (error: any) {
      // Handle different types of errors
      if (error.code === 'ERR_NETWORK') {
        toast.error(t('universal_account.errors.network_error'));
      } else if (error.response?.status === 401) {
        toast.error(t('universal_account.errors.unauthorized'));
      } else if (error.response?.data?.message === t('universal_account.errors.user_wallet_not_found_api')) {
        toast.error(t('universal_account.errors.user_wallet_not_found'));
      } else if (error.response?.data?.message?.includes(t('universal_account.errors.google_authenticator_text'))) {
        toast.error(t('universal_account.errors.invalid_google_auth'));
        setGoogleAuthError(t('universal_account.errors.invalid_google_auth'));
      } else if (error.response?.data?.message === "Insufficient SOL balance for transaction fee") {
        toast.error(t('universal_account.errors.insufficient_sol_balance'));
      } else if (error.response?.data?.message === "Source token account not found") {
        toast.error(t('universal_account.errors.source_token_account_not_found'));
      } else if (error.response?.data?.message === "Sender and receiver wallet addresses must be different") {
        toast.error(t('universal_account.errors.sender_and_receiver_wallet_addresses_must_be_different'));
      } else if (error.response?.data?.message === "Insufficient wallet balance for transaction fee") {
        toast.error(t('universal_account.errors.insufficient_wallet_balance_for_transaction_fee'));
      } else if (error.response?.data?.message === "Token mint address is required for SPL tokens") {
        toast.error(t('universal_account.errors.token_mint_address_required'));
      }
      else if (error.response?.data?.message === "Google Auth token is required for withdrawal") {
        toast.error(t('universal_account.errors.google_auth_required'));
      } else if (error.response?.data?.message === "Error creating multi-token deposit/withdraw") {
        toast.error(t('universal_account.errors.transaction_failed_multi_token'));
      } else if (error.response?.data?.message.includes("Insufficient SOL for ATA creation")) {
        toast.error(t('universal_account.errors.insufficient_sol_for_ata_creation'));
      }
      else if (error.response?.data?.message === "Invalid Solana wallet address") {
        toast.error(t('universal_account.errors.invalid_solana_wallet_address'));
      } else {
        toast.error(error.response?.data?.message || t('universal_account.errors.transaction_failed'));
      }
      console.error('Transaction error:', error);
    } finally {
      setIsSending(false);
    }
  };
  // Loading state for tokens
  if (!availableTokens || !availableTokens.tokens) {
    return (
      <div className="flex flex-col gap-6 items-center">
        <div className="w-full max-w-[600px] text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-purple-200 mx-auto mb-4"></div>
          <p className="text-gray-500">{t('universal_account.loading.tokens')}</p>
        </div>
      </div>
    );
  }

  // No tokens available
  if (availableTokens.tokens.length === 0) {
    return (
      <div className="flex flex-col gap-6 items-center">
        <div className="w-full max-w-[600px] text-center py-8">
          <p className="text-gray-500">{t('universal_account.no_tokens')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 items-center">
      {/* Token Selection */}
      <div className="w-full max-w-[600px]">
        <label className={`block md:text-sm lg:text-base font-normal mb-1 text-xs ${mountedTheme && isDark ? 'text-white' : 'text-gray-900'}`}>
          {t('universal_account.select_token')} <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTokenDropdown(!showTokenDropdown)}
            className="w-full rounded-lg px-3 py-2.5 text-left flex items-center justify-between backdrop-blur-sm transition-all duration-300"
            style={{
              background: mountedTheme && isDark
                ? 'rgba(0, 0, 0, 0.3)'
                : 'rgba(255, 255, 255, 0.5)',
              border: mountedTheme && isDark
                ? '1px solid rgba(31, 193, 107, 0.3)'
                : '1px solid rgba(31, 193, 107, 0.25)',
            }}
          >
            <div className="flex items-center gap-2">
              <img src={selectedToken?.token_logo_url} alt={selectedToken?.token_symbol} className="w-6 h-6" />
              <span className={`font-medium ${mountedTheme && isDark ? 'text-white' : 'text-gray-900'}`}>
                {selectedToken?.token_symbol}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mountedTheme && isDark ? 'text-gray-400' : 'text-gray-600'} ${showTokenDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showTokenDropdown && (
            <div 
              className="absolute top-full left-0 right-0 mt-1 rounded-lg shadow-lg z-10 backdrop-blur-xl overflow-hidden"
              style={{
                background: mountedTheme && isDark
                  ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.5) 100%)'
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.7) 100%)',
                border: mountedTheme && isDark
                  ? '1px solid rgba(31, 193, 107, 0.3)'
                  : '1px solid rgba(31, 193, 107, 0.25)',
                boxShadow: mountedTheme && isDark
                  ? '0 0 0 1px rgba(31, 193, 107, 0.2), 0 0 30px rgba(31, 193, 107, 0.15), 0 8px 32px -8px rgba(0, 0, 0, 0.4)'
                  : '0 0 0 1px rgba(31, 193, 107, 0.15), 0 0 30px rgba(31, 193, 107, 0.1), 0 8px 32px -8px rgba(0, 0, 0, 0.1)',
              }}
            >
              {availableTokens?.tokens?.filter((token: TokenOption) => token.token_balance > 0).map((token: TokenOption) => (
                <button
                  key={token.token_symbol}
                  onClick={() => handleTokenSelect(token)}
                  className="w-full px-3 py-2.5 text-left flex items-center justify-between transition-colors duration-200"
                  style={{
                    borderBottom: mountedTheme && isDark
                      ? '1px solid rgba(107, 114, 128, 0.1)'
                      : '1px solid rgba(156, 163, 175, 0.1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = mountedTheme && isDark
                      ? 'rgba(31, 193, 107, 0.1)'
                      : 'rgba(31, 193, 107, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div className="flex items-center gap-2">
                    <img src={token.token_logo_url} alt={token.token_symbol} className="w-6 h-6" />
                    <span className={mountedTheme && isDark ? 'text-white' : 'text-gray-900'}>{token.token_symbol}</span>
                  </div>
                  <div className={`text-right text-xs ${mountedTheme && isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <div>{token.token_balance} {token.token_symbol}</div>
                    {token.token_balance_usd > 0 && (
                      <div>${token.token_balance_usd.toFixed(2)}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Amount Input */}
      <div 
        className={`w-full max-w-[600px] rounded-xl sm:rounded-2xl p-4 sm:p-6 backdrop-blur-xl transition-all duration-300 ${isDisabled.input ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={{
          background: mountedTheme && isDark
            ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.3) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.5) 100%)',
          border: mountedTheme && isDark
            ? '1px solid rgba(31, 193, 107, 0.3)'
            : '1px solid rgba(31, 193, 107, 0.25)',
          boxShadow: mountedTheme && isDark
            ? '0 0 0 1px rgba(31, 193, 107, 0.2), 0 0 20px rgba(31, 193, 107, 0.15), 0 4px 16px -4px rgba(0, 0, 0, 0.3)'
            : '0 0 0 1px rgba(31, 193, 107, 0.15), 0 0 20px rgba(31, 193, 107, 0.1), 0 4px 16px -4px rgba(0, 0, 0, 0.1)',
        }}
      >
          <div className="w-full">
            <div className="text-center mb-1">
            <p className={`text-sm transition-colors duration-300 ${mountedTheme && isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {isDisabled.input ? t('universal_account.transaction_progress') : t('universal_account.enter_amount')}
              </p>
            </div>
            <div className="text-center mb-2 relative">
              <div className="flex items-center justify-center gap-2 ml-[11%]">
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={handleAmountChange}
                  disabled={isDisabled.input}
                className={`bg-transparent text-center text-3xl max-w-[200px] font-bold w-full focus:outline-none transition-colors duration-300 ${error ? 'text-red-500' : (mountedTheme && isDark ? 'text-white' : 'text-gray-900')} ${isDisabled.input ? 'cursor-not-allowed opacity-50' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (selectedToken && availableTokens?.tokens) {
                      const tokenData = availableTokens.tokens.find((token: TokenOption) => token.token_symbol === selectedToken.token_symbol);
                      if (tokenData?.token_balance) {
                        setAmount(tokenData.token_balance.toString());
                      }
                    }
                  }}
                  disabled={isDisabled.input || !selectedToken || !availableTokens?.tokens}
                className="px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: mountedTheme && isDark
                    ? 'linear-gradient(135deg, rgba(31, 193, 107, 0.2) 0%, rgba(31, 193, 107, 0.15) 100%)'
                    : 'linear-gradient(135deg, rgba(31, 193, 107, 0.15) 0%, rgba(31, 193, 107, 0.1) 100%)',
                  border: mountedTheme && isDark
                    ? '1px solid rgba(31, 193, 107, 0.3)'
                    : '1px solid rgba(31, 193, 107, 0.25)',
                  color: '#1FC16B',
                }}
                >
                  {t('universal_account.max_button')}
                </button>
              </div>
            <span className={`absolute md:block hidden inset-y-0 right-0 flex items-center pr-3 transition-colors duration-300 ${error ? 'text-red-500' : (mountedTheme && isDark ? 'text-gray-400' : 'text-gray-600')} ${isDisabled.input ? 'opacity-50' : ''}`}>
                {selectedToken?.token_symbol}
              </span>
            </div>
          <div className={`text-center text-xs mb-1 transition-colors duration-300 ${mountedTheme && isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('universal_account.available', { amount: getCurrentTokenBalance() })} {selectedToken?.token_symbol}
              {availableTokens?.tokens && selectedToken && (() => {
                const tokenData = availableTokens.tokens.find((token: TokenOption) => token.token_symbol === selectedToken.token_symbol);
                return tokenData?.token_balance_usd ? ` ($${tokenData.token_balance_usd.toFixed(2)})` : '';
              })()}
            </div>
            {availableTokens?.tokens && selectedToken && (() => {
              const tokenData = availableTokens.tokens.find((token: TokenOption) => token.token_symbol === selectedToken.token_symbol);
              return tokenData?.token_price_usd ? (
              <div className={`text-center text-xs mb-1 ${mountedTheme && isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  {t('wallet.price')}: ${tokenData.token_price_usd.toFixed(4)} USD
                </div>
              ) : null;
            })()}
            {error && (
              <div className="text-center text-xs text-red-500 mt-1">
                {error}
              </div>
            )}
        </div>
      </div>

      {/* Recipient Address */}
      <div className="w-full max-w-[600px]">
        <label htmlFor="name" className={`block md:text-sm lg:text-base font-normal mb-1 text-xs ${mountedTheme && isDark ? 'text-white' : 'text-gray-900'}`}>
          {t('universal_account.recipient_address')} <span className="text-red-500">*</span>
        </label>
        <div className="w-full">
          <div 
            className="rounded-lg backdrop-blur-sm transition-all duration-300"
            style={{
              background: mountedTheme && isDark
                ? 'rgba(0, 0, 0, 0.3)'
                : 'rgba(255, 255, 255, 0.5)',
              border: mountedTheme && isDark
                ? '1px solid rgba(31, 193, 107, 0.3)'
                : '1px solid rgba(31, 193, 107, 0.25)',
            }}
          >
            <input
              type="text"
              value={recipientWallet}
              onChange={(e) => setRecipientWallet(e.target.value)}
              className={`w-full bg-transparent h-10 rounded-lg pl-3 pr-3 text-sm font-normal focus:outline-none transition-colors duration-300 ${mountedTheme && isDark ? 'text-white placeholder:text-gray-500' : 'text-gray-900 placeholder:text-gray-400'}`}
              placeholder={t('universal_account.recipient_placeholder')}
            />
          </div>
          {recipientError && (
            <div className="text-xs text-red-500 mt-1 pl-3">
              {recipientError}
            </div>
          )}
        </div>
      </div>

      {/* Google Authenticator Input */}
      {walletInforAccount?.isGGAuth && (
        <div className="w-full max-w-[600px]">
          <label className={`block md:text-sm lg:text-base font-normal mb-1 text-xs ${mountedTheme && isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('universal_account.google_auth_code')} <span className="text-red-500">*</span>
          </label>
          <div 
            className="rounded-xl sm:rounded-2xl p-4 backdrop-blur-xl"
            style={{
              background: mountedTheme && isDark
                ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.3) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.5) 100%)',
              border: mountedTheme && isDark
                ? '1px solid rgba(31, 193, 107, 0.3)'
                : '1px solid rgba(31, 193, 107, 0.25)',
              boxShadow: mountedTheme && isDark
                ? '0 0 0 1px rgba(31, 193, 107, 0.2), 0 0 20px rgba(31, 193, 107, 0.15), 0 4px 16px -4px rgba(0, 0, 0, 0.3)'
                : '0 0 0 1px rgba(31, 193, 107, 0.15), 0 0 20px rgba(31, 193, 107, 0.1), 0 4px 16px -4px rgba(0, 0, 0, 0.1)',
            }}
          >
              <div className="flex justify-center gap-2">
                {googleAuthCode.map((digit, index) => (
                  <input
                    key={index}
                    id={`google-auth-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleGoogleAuthChange(index, e.target.value)}
                    onPaste={handleGoogleAuthPaste}
                    onKeyDown={(e) => handleGoogleAuthKeyDown(index, e)}
                  className={`w-10 h-10 text-center text-lg font-bold rounded-lg focus:outline-none transition-all duration-300 ${mountedTheme && isDark ? 'text-white bg-black/30 border-gray-600/30 focus:border-theme-primary-500/50' : 'text-gray-900 bg-white/50 border-gray-300/30 focus:border-theme-primary-500/50'} border`}
                    disabled={isSending}
                  />
                ))}
              </div>
              {googleAuthError && (
                <div className="text-xs text-red-500 mt-2 text-center">
                  {googleAuthError}
                </div>
              )}
          </div>
        </div>
      )}

      {/* Send Button */}
      <button
        onClick={handleSend}
        disabled={isDisabled.send || recipientWallet.length === 0 || !selectedToken || Number(amount) === 0}
        className={`lg:max-w-auto min-w-[160px] py-2 md:py-2.5 px-4 md:px-6 lg:px-8 rounded-full text-[11px] md:text-sm font-semibold tracking-wide transition-all duration-300 hover:scale-105 active:scale-95 w-full md:w-auto ${(isDisabled.send || recipientWallet.length === 0 || !selectedToken || Number(amount) === 0) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        style={{
          background: (isDisabled.send || recipientWallet.length === 0 || !selectedToken || Number(amount) === 0)
            ? (mountedTheme && isDark ? 'rgba(107, 114, 128, 0.3)' : 'rgba(156, 163, 175, 0.3)')
            : 'linear-gradient(to right, #1FC16B, #17A85A)',
          color: 'white',
          boxShadow: (isDisabled.send || recipientWallet.length === 0 || !selectedToken || Number(amount) === 0)
            ? 'none'
            : (mountedTheme && isDark
              ? '0 0 20px rgba(31, 193, 107, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2)'
              : '0 0 20px rgba(31, 193, 107, 0.25), 0 4px 12px rgba(0, 0, 0, 0.1)'),
        }}
      >
        {isSending ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {t('universal_account.sending')}
          </span>
        ) : (
          t('universal_account.send')
        )}
      </button>
    </div>
  )
}
