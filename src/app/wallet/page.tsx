"use client"
import { getInforWallet, getListBuyToken, getBalanceInfo } from "@/services/api/TelegramWalletService";
import { formatNumberWithSuffix3, truncateString } from "@/utils/format";
import { useQuery } from "@tanstack/react-query";
import { Copy, Check, ChevronDown, ArrowUpFromLine, ArrowDownToLine, ArrowLeftRight } from "lucide-react";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from '@/lang';
import { useRouter } from "next/navigation";
import { useTheme } from 'next-themes';
import ModalSignin from "../../components/ModalSignin";
import { toast } from 'react-hot-toast';
import SwapModal from "../../components/swap-modal";

interface Token {
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


// Add responsive styles
const containerStyles = " w-full px-4 sm:px-[40px] flex flex-col gap-4 sm:gap-6 pt-4 sm:pt-[30px] relative mx-auto z-10 pb-6 lg:pb-0"
const walletGridStyles = "flex items-center flex-col sm:flex-row justify-center w-full md:gap-[10%] gap-4"
const walletCardStyles = "px-4 sm:px-6 py-3 justify-evenly rounded-md flex flex-col flex-1 sm:gap-4 gap-1 min-h-[130px] items-center min-w-0 z-10 w-full md:max-w-[440px]"
const walletTitleStyles = "text-sm sm:text-base font-semibold uppercase leading-tight"
const walletAddressStyles = "text-xs sm:text-sm font-normal leading-tight truncate"
const sectionTitleStyles = "text-base sm:text-lg font-bold leading-relaxed"
const tableContainerStyles = "overflow-x-auto -mx-4 sm:mx-0"
const tableStyles = "min-w-[800px] w-full"
const tableHeaderStyles = "px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium"
const tableCellStyles = "px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm"

// Add new styles for mobile assets
const assetCardStyles = "dark:bg-theme-black-200/50 bg-white rounded-md p-4 border border-solid border-y-[#15DFFD] border-x-[#720881]"
const assetHeaderStyles = "flex items-start gap-2 mb-3"
const assetTokenStyles = "flex items-center gap-2 flex-1 min-w-0"
const assetValueStyles = "text-right"
const assetLabelStyles = "text-xs mb-1"
const assetAmountStyles = "text-sm sm:text-base font-medium"
const assetPriceStyles = "text-xs sm:text-sm"

// Custom debounce hook
function useDebounce<T extends (...args: any[]) => any>(callback: T, delay: number) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return useCallback((...args: Parameters<T>) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            callback(...args);
        }, delay);
    }, [callback, delay]);
}

// Add skeleton components
const WalletCardSkeleton = ({ isDark }: { isDark: boolean }) => (
    <div 
        className={`${walletCardStyles} backdrop-blur-xl rounded-xl sm:rounded-2xl`}
        style={{
            background: isDark
                ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.4) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.6) 100%)',
            border: isDark
                ? '1px solid rgba(107, 114, 128, 0.3)'
                : '1px solid rgba(156, 163, 175, 0.3)',
            boxShadow: isDark
                ? '0 8px 32px -8px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(107, 114, 128, 0.1) inset'
                : '0 8px 32px -8px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(156, 163, 175, 0.1) inset',
        }}
    >
        <div className="inline-flex justify-start items-center gap-2 w-full">
            <div className="w-6 h-6 sm:w-8 sm:h-8 relative overflow-hidden flex-shrink-0">
                <div className={`w-full h-full rounded animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
            </div>
            <div className="justify-start truncate">
                <div className={`h-4 rounded animate-pulse w-20 mb-1 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
                <div className={`h-3 rounded animate-pulse w-16 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
            </div>
        </div>
        <div className="flex flex-col justify-start items-center gap-2 w-full">
            <div 
                className="w-full h-8 sm:h-10 pl-3 sm:pl-4 pr-4 sm:pr-6 relative rounded-lg flex justify-between items-center backdrop-blur-sm"
                style={{
                    background: isDark
                        ? 'rgba(0, 0, 0, 0.3)'
                        : 'rgba(255, 255, 255, 0.5)',
                    border: isDark
                        ? '1px solid rgba(107, 114, 128, 0.2)'
                        : '1px solid rgba(156, 163, 175, 0.2)',
                }}
            >
                <div className={`h-3 rounded animate-pulse w-24 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
                <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0">
                    <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
                </div>
            </div>
        </div>
    </div>
);

const UniversalAccountSkeleton = () => (
    <div className={`${walletCardStyles} bg-gradient-to-r from-[#36D2B8] to-[#00A276] border-theme-primary-300 bg-white z-10 relative`}>
        <div className="inline-flex justify-start items-center gap-2.5 w-full z-40 relative">
            <div className="w-5 h-5 bg-white/30 rounded animate-pulse" />
            <div className="h-4 bg-white/30 rounded animate-pulse w-32" />
            <div className="w-5 h-5 bg-white/30 rounded animate-pulse" />
        </div>
        <div className="flex justify-between lg:justify-start lg:items-end gap-4 w-full z-40">
            <div className="flex flex-col justify-start items-start gap-3 min-w-0">
                <div className="w-full flex flex-col justify-center items-start gap-1.5">
                    <div className="h-6 bg-white/30 rounded animate-pulse w-20" />
                    <div className="inline-flex justify-start items-center gap-1.5 flex-wrap">
                        <div className="h-4 bg-white/30 rounded animate-pulse w-16" />
                        <div className="h-4 bg-white/30 rounded animate-pulse w-12" />
                        <div className="h-4 bg-white/30 rounded animate-pulse w-8" />
                    </div>
                </div>
            </div>
            <div className="flex justify-end flex-1 items-center gap-3 w-full sm:w-auto">
                <div className="flex flex-col justify-start items-center gap-1">
                    <div className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 bg-white/30 rounded-full animate-pulse" />
                    <div className="h-3 bg-white/30 rounded animate-pulse w-12" />
                </div>
                <div className="flex flex-col justify-start items-center gap-1">
                    <div className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 bg-white/30 rounded-full animate-pulse" />
                    <div className="h-3 bg-white/30 rounded animate-pulse w-10" />
                </div>
            </div>
        </div>
    </div>
);

const AssetsTableSkeleton = ({ isDark }: { isDark: boolean }) => (
    <div 
        className="hidden sm:block overflow-hidden rounded-xl sm:rounded-2xl z-10 backdrop-blur-xl"
        style={{
            background: isDark
                ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.4) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.6) 100%)',
            border: isDark
                ? '1px solid rgba(107, 114, 128, 0.3)'
                : '1px solid rgba(156, 163, 175, 0.3)',
            boxShadow: isDark
                ? '0 8px 32px -8px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(107, 114, 128, 0.1) inset'
                : '0 8px 32px -8px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(156, 163, 175, 0.1) inset',
        }}
    >
        <div className={tableContainerStyles}>
            <table className={tableStyles}>
                <thead>
                    <tr 
                        style={{
                            background: isDark
                                ? 'linear-gradient(135deg, rgba(31, 193, 107, 0.1) 0%, rgba(31, 193, 107, 0.05) 100%)'
                                : 'linear-gradient(135deg, rgba(31, 193, 107, 0.08) 0%, rgba(31, 193, 107, 0.04) 100%)',
                        }}
                    >
                        <th className={`${tableHeaderStyles} ${isDark ? 'text-white' : 'text-gray-900'}`}>Token ▼</th>
                        <th className={`${tableHeaderStyles} ${isDark ? 'text-white' : 'text-gray-900'}`}>Balance</th>
                        <th className={`${tableHeaderStyles} ${isDark ? 'text-white' : 'text-gray-900'}`}>Price</th>
                        <th className={`${tableHeaderStyles} ${isDark ? 'text-white' : 'text-gray-900'}`}>Value</th>
                        <th className={`${tableHeaderStyles} ${isDark ? 'text-white' : 'text-gray-900'}`}>Address</th>
                    </tr>
                </thead>
                <tbody>
                    {Array(5).fill(0).map((_, index) => (
                        <tr 
                            key={index} 
                            className="border-t"
                            style={{
                                borderColor: isDark
                                    ? 'rgba(107, 114, 128, 0.2)'
                                    : 'rgba(156, 163, 175, 0.2)',
                            }}
                        >
                            <td className={tableCellStyles}>
                                <div className="flex items-center gap-2">
                                    <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
                                    <div>
                                        <div className={`h-4 rounded animate-pulse w-20 mb-1 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
                                        <div className={`h-3 rounded animate-pulse w-12 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
                                    </div>
                                </div>
                            </td>
                            <td className={tableCellStyles}>
                                <div className={`h-4 rounded animate-pulse w-16 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
                            </td>
                            <td className={tableCellStyles}>
                                <div className={`h-4 rounded animate-pulse w-20 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
                            </td>
                            <td className={tableCellStyles}>
                                <div className={`h-4 rounded animate-pulse w-16 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
                            </td>
                            <td className={tableCellStyles}>
                                <div className={`h-4 rounded animate-pulse w-24 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const AssetsMobileSkeleton = ({ isDark }: { isDark: boolean }) => (
    <div className="sm:hidden space-y-3">
        {Array(3).fill(0).map((_, index) => (
            <div 
                key={index} 
                className="rounded-xl sm:rounded-2xl p-4 backdrop-blur-xl"
                style={{
                    background: isDark
                        ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.4) 100%)'
                        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.6) 100%)',
                    border: isDark
                        ? '1px solid rgba(107, 114, 128, 0.3)'
                        : '1px solid rgba(156, 163, 175, 0.3)',
                    boxShadow: isDark
                        ? '0 8px 32px -8px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(107, 114, 128, 0.1) inset'
                        : '0 8px 32px -8px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(156, 163, 175, 0.1) inset',
                }}
            >
                <div className={`w-fit ${assetHeaderStyles} flex-col`}>
                    <div className={assetTokenStyles}>
                        <div className={`w-8 h-8 rounded-full animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
                        <div className="min-w-0 flex gap-2">
                            <div className={`h-4 rounded animate-pulse w-20 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
                            <div className={`h-3 rounded animate-pulse w-12 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`h-3 rounded animate-pulse w-24 flex-1 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
                        <div className={`w-4 h-4 rounded animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
                    </div>
                </div>
                <div 
                    className="flex justify-between gap-3 mt-1 lg:mt-3 lg:pt-3 pt-1 border-t"
                    style={{
                        borderColor: isDark
                            ? 'rgba(107, 114, 128, 0.2)'
                            : 'rgba(156, 163, 175, 0.2)',
                    }}
                >
                    <div>
                        <div className={`h-3 rounded animate-pulse w-12 mb-1 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
                        <div className={`h-4 rounded animate-pulse w-16 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
                    </div>
                    <div>
                        <div className={`h-3 rounded animate-pulse w-10 mb-1 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
                        <div className={`h-4 rounded animate-pulse w-14 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
                    </div>
                    <div className={assetValueStyles}>
                        <div className={`h-3 rounded animate-pulse w-10 mb-1 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
                        <div className={`h-4 rounded animate-pulse w-16 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
                    </div>
                </div>
            </div>
        ))}
    </div>
);

// Add custom select component
const CustomSelect = ({ value, onChange, options, placeholder }: {
    value: string;
    onChange: (value: string) => void;
    options: { id: number; name: string; code: string; translationKey: string; flag: string }[];
    placeholder?: string;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const { t } = useLang();
    const selectRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const selectedOption = options.find(option => option.code === value);

    return (
        <div ref={selectRef} className="relative">
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full px-3 py-2 bg-white dark:bg-theme-black-200 border-none rounded-md text-black dark:text-theme-neutral-100 focus:outline-none focus:border-purple-500 cursor-pointer flex items-center justify-between transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800 ${isOpen ? 'ring-2 ring-purple-500 ring-opacity-50 shadow-lg' : ''
                    }`}
            >
                <div className="flex items-center gap-2">
                    {selectedOption && (
                        <img
                            src={selectedOption.flag}
                            alt={t(selectedOption.translationKey)}
                            className="w-4 h-3 rounded object-cover"
                        />
                    )}
                    <span className={selectedOption ? 'text-black dark:text-theme-neutral-100 text-xs' : 'text-gray-500 dark:text-gray-400 text-xs'}>
                        {selectedOption ? t(selectedOption.translationKey) : placeholder}
                    </span>
                </div>
                <ChevronDown
                    className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
                        }`}
                />
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-theme-black-200 border border-gray-200 dark:border-gray-700 rounded-md shadow-xl max-h-60 overflow-auto backdrop-blur-sm">
                    {options.map((option, index) => (
                        <div
                            key={option.id}
                            onClick={() => {
                                onChange(option.code);
                                setIsOpen(false);
                            }}
                            className={`px-3 py-2.5 cursor-pointer transition-all duration-150 hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center gap-2 ${value === option.code
                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium'
                                : 'text-black dark:text-theme-neutral-100'
                                } ${index === 0 ? 'rounded-t-xl' : ''
                                } ${index === options.length - 1 ? 'rounded-b-xl' : ''
                                }`}
                        >
                            <img
                                src={option.flag}
                                alt={t(option.translationKey)}
                                className="w-4 h-3 rounded object-cover"
                            />
                            <span>{t(option.translationKey)}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default function WalletPage() {
    const { t } = useLang();
    const { theme, resolvedTheme } = useTheme();
    const [mountedTheme, setMountedTheme] = useState(false);
    const isDark = resolvedTheme === 'dark' || (resolvedTheme === undefined && theme === 'dark');

    useEffect(() => {
        setMountedTheme(true);
    }, []);

    const router = useRouter();

    const [copyStates, setCopyStates] = useState<{ [key: string]: boolean }>({});
    const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
    const { isAuthenticated } = useAuth();
    const [selectedToken, setSelectedToken] = useState<string>("");
    const { data: tokenList, refetch: refetchTokenList, isLoading: isLoadingTokenList } = useQuery({
        queryKey: ["token-buy-list"],
        queryFn: getListBuyToken,
        enabled: isAuthenticated,
    });

    // Filter tokens: SOL/USDT tokens are always shown, others need balance >= 0.005
    const filteredTokens = tokenList?.tokens?.filter((token: Token) =>
        token.token_symbol === "SOL" ||
        token.token_symbol === "USDT" ||
        token.token_symbol === "BITT" ||
        token.token_balance_usd >= 0.005
    ) || [];
    const { data: walletInfor, refetch, isLoading: isLoadingWalletInfor } = useQuery({
        queryKey: ["wallet-infor"],
        queryFn: getInforWallet,
    });

    const { data: balanceInfo, isLoading: isLoadingBalanceInfo } = useQuery({
        queryKey: ['balance'],
        queryFn: getBalanceInfo,
        refetchInterval: 5000,
        enabled: isAuthenticated,
    });

    const handleCopyAddress = (address: string, e: React.MouseEvent) => {
        e.stopPropagation();

        // Prevent spam clicking - if already copying this address, ignore
        if (copyStates[address]) {
            return;
        }

        // Set copying state immediately to prevent spam
        setCopyStates(prev => ({ ...prev, [address]: true }));

        // Copy to clipboard
        toast.success(t('connectMasterModal.copyAddress.copied'));

        // Reset copy state after 2 seconds
        setTimeout(() => {
            setCopyStates(prev => ({ ...prev, [address]: false }));
        }, 2000);
    };

    const handleSwapToken = (tokenSymbol: string) => {
        setIsSwapModalOpen(true)
        setSelectedToken(tokenSymbol)
    }


    // Calculate total portfolio value from balance info
    const totalPortfolioValue = balanceInfo 
        ? ((balanceInfo?.sol?.token_balance_usd || 0) + 
           (balanceInfo?.usdt?.token_balance_usd || 0) + 
           (balanceInfo?.bitt?.token_balance_usd || 0))
        : filteredTokens.reduce((sum: number, token: Token) => {
            return sum + token.token_balance_usd;
        }, 0);

    return (
        <>
            <div className="flex flex-col gap-4 sm:gap-6">
                <div className={containerStyles}>
                    {/* Phantom-style Header: Total Balance Display */}
                    <div className="w-full mb-6 sm:mb-8">
                        {(isLoadingWalletInfor || isLoadingBalanceInfo) ? (
                            <div 
                                className="rounded-2xl sm:rounded-3xl p-6 sm:p-8 backdrop-blur-xl"
                                style={{
                                    background: mountedTheme && isDark
                                        ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.4) 100%)'
                                        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.6) 100%)',
                                    border: mountedTheme && isDark
                                        ? '1px solid rgba(107, 114, 128, 0.3)'
                                        : '1px solid rgba(156, 163, 175, 0.3)',
                                }}
                            >
                                <div className={`h-12 bg-gray-300 dark:bg-gray-700 rounded animate-pulse w-48 mb-2 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
                                <div className={`h-6 bg-gray-300 dark:bg-gray-700 rounded animate-pulse w-32 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
                            </div>
                        ) : (
                            <div 
                                className="rounded-2xl sm:rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden"
                                style={{
                                    background: mountedTheme && isDark
                                        ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.5) 100%)'
                                        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.7) 100%)',
                                    border: mountedTheme && isDark
                                        ? '1px solid rgba(31, 193, 107, 0.3)'
                                        : '1px solid rgba(31, 193, 107, 0.25)',
                                    boxShadow: mountedTheme && isDark
                                        ? '0 0 0 1px rgba(31, 193, 107, 0.2), 0 0 30px rgba(31, 193, 107, 0.15), 0 20px 60px -12px rgba(0, 0, 0, 0.5)'
                                        : '0 0 0 1px rgba(31, 193, 107, 0.15), 0 0 30px rgba(31, 193, 107, 0.1), 0 20px 60px -12px rgba(0, 0, 0, 0.1)',
                                }}
                            >
                                {/* Gradient Glow Overlay */}
                                {mountedTheme && (
                                    <div 
                                        className="absolute inset-0 pointer-events-none opacity-30"
                                        style={{
                                            background: isDark
                                                ? 'linear-gradient(135deg, rgba(31, 193, 107, 0.1) 0%, rgba(31, 193, 107, 0.05) 50%, rgba(31, 193, 107, 0.1) 100%)'
                                                : 'linear-gradient(135deg, rgba(31, 193, 107, 0.08) 0%, rgba(31, 193, 107, 0.04) 50%, rgba(31, 193, 107, 0.08) 100%)',
                                        }}
                                    />
                                )}
                                <div className="relative z-10">
                                    {/* Total Balance */}
                                    <div className="text-center mb-6">
                                        <div className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-2 ${mountedTheme && isDark ? 'text-white' : 'text-gray-900'}`}>
                                            ${totalPortfolioValue.toFixed(2)}
                                        </div>
                                        <div className={`text-sm sm:text-base ${mountedTheme && isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {t('wallet.totalPortfolio')}
                                        </div>
                                    </div>

                                    {/* Wallet Address Section */}
                                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 sm:w-8 sm:h-8 relative overflow-hidden flex-shrink-0">
                                                <img src="/solana.png" alt="Solana" className="w-full h-full object-cover" />
                                            </div>
                                            <span className={`text-sm sm:text-base font-medium ${mountedTheme && isDark ? 'text-white' : 'text-gray-900'}`}>
                                                {t('wallet.solana')} {t('wallet.wallet')}
                                            </span>
                                        </div>
                                        <div 
                                            className="px-4 py-2 rounded-lg backdrop-blur-sm flex items-center gap-2"
                                            style={{
                                                background: mountedTheme && isDark
                                                    ? 'rgba(0, 0, 0, 0.3)'
                                                    : 'rgba(255, 255, 255, 0.5)',
                                                border: mountedTheme && isDark
                                                    ? '1px solid rgba(107, 114, 128, 0.2)'
                                                    : '1px solid rgba(156, 163, 175, 0.2)',
                                            }}
                                        >
                                            <div className={`text-xs sm:text-sm font-mono ${mountedTheme && isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                {truncateString(walletInfor?.solana_address, 12)}
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigator.clipboard.writeText(walletInfor?.solana_address || '');
                                                    toast.success(t('connectMasterModal.copyAddress.copied'));
                                                }}
                                                className={`transition-colors ${mountedTheme && isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                                            >
                                                {copyStates[walletInfor?.solana_address || ''] ? (
                                                    <Check className="w-4 h-4 text-green-500" />
                                                ) : (
                                                    <Copy className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    {walletInfor?.solana_address && (
                                        <div className="text-xs text-yellow-500 italic text-center mb-4">{t('wallet.warning')}</div>
                                    )}
                                </div>
                            </div>
                        )}
                                </div>

                    {/* Action Buttons Section (Phantom Style) */}
                    <div className="w-full mb-6 sm:mb-8">
                        {isLoadingWalletInfor ? (
                            <div className="flex justify-center gap-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className={`h-16 w-20 rounded-xl animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
                                ))}
                                        </div>
                        ) : (
                            <div className="flex justify-center gap-3 sm:gap-4 md:gap-6">
                                {/* Send Button */}
                                <button
                                    onClick={() => router.replace('/universal-account?type=withdraw')}
                                    className="flex-1 sm:flex-initial flex flex-col items-center justify-center gap-2 px-4 sm:px-6 py-4 sm:py-5 rounded-xl sm:rounded-2xl backdrop-blur-xl transition-all duration-300 hover:scale-105 active:scale-95"
                                    style={{
                                        background: mountedTheme && isDark
                                            ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.4) 100%)'
                                            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.6) 100%)',
                                        border: mountedTheme && isDark
                                            ? '1px solid rgba(107, 114, 128, 0.3)'
                                            : '1px solid rgba(156, 163, 175, 0.3)',
                                        boxShadow: mountedTheme && isDark
                                            ? '0 8px 32px -8px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(107, 114, 128, 0.1) inset'
                                            : '0 8px 32px -8px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(156, 163, 175, 0.1) inset',
                                    }}
                                >
                                    <div 
                                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300"
                                        style={{
                                            background: mountedTheme && isDark
                                                ? 'linear-gradient(135deg, rgba(31, 193, 107, 0.2) 0%, rgba(31, 193, 107, 0.15) 100%)'
                                                : 'linear-gradient(135deg, rgba(31, 193, 107, 0.15) 0%, rgba(31, 193, 107, 0.1) 100%)',
                                        }}
                                    >
                                        <ArrowUpFromLine className={`w-5 h-5 sm:w-6 sm:h-6 ${mountedTheme && isDark ? 'text-theme-primary-400' : 'text-theme-primary-500'}`} />
                                    </div>
                                    <span className={`text-xs sm:text-sm font-semibold ${mountedTheme && isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {t('wallet.send')}
                                    </span>
                                </button>

                                {/* Receive Button */}
                                <button
                                    onClick={() => router.replace('/universal-account?type=deposit')}
                                    className="flex-1 sm:flex-initial flex flex-col items-center justify-center gap-2 px-4 sm:px-6 py-4 sm:py-5 rounded-xl sm:rounded-2xl backdrop-blur-xl transition-all duration-300 hover:scale-105 active:scale-95"
                                    style={{
                                        background: mountedTheme && isDark
                                            ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.4) 100%)'
                                            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.6) 100%)',
                                        border: mountedTheme && isDark
                                            ? '1px solid rgba(107, 114, 128, 0.3)'
                                            : '1px solid rgba(156, 163, 175, 0.3)',
                                        boxShadow: mountedTheme && isDark
                                            ? '0 8px 32px -8px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(107, 114, 128, 0.1) inset'
                                            : '0 8px 32px -8px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(156, 163, 175, 0.1) inset',
                                    }}
                                >
                                    <div 
                                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300"
                                        style={{
                                            background: mountedTheme && isDark
                                                ? 'linear-gradient(135deg, rgba(31, 193, 107, 0.2) 0%, rgba(31, 193, 107, 0.15) 100%)'
                                                : 'linear-gradient(135deg, rgba(31, 193, 107, 0.15) 0%, rgba(31, 193, 107, 0.1) 100%)',
                                        }}
                                    >
                                        <ArrowDownToLine className={`w-5 h-5 sm:w-6 sm:h-6 ${mountedTheme && isDark ? 'text-theme-primary-400' : 'text-theme-primary-500'}`} />
                                    </div>
                                    <span className={`text-xs sm:text-sm font-semibold ${mountedTheme && isDark ? 'text-white' : 'text-gray-900'}`}>
                                                        {t('wallet.receive')}
                                    </span>
                                                </button>

                                {/* Swap Button */}
                                <button
                                    onClick={() => setIsSwapModalOpen(true)}
                                    className="flex-1 sm:flex-initial flex flex-col items-center justify-center gap-2 px-4 sm:px-6 py-4 sm:py-5 rounded-xl sm:rounded-2xl backdrop-blur-xl transition-all duration-300 hover:scale-105 active:scale-95"
                                    style={{
                                        background: mountedTheme && isDark
                                            ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.4) 100%)'
                                            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.6) 100%)',
                                        border: mountedTheme && isDark
                                            ? '1px solid rgba(107, 114, 128, 0.3)'
                                            : '1px solid rgba(156, 163, 175, 0.3)',
                                        boxShadow: mountedTheme && isDark
                                            ? '0 8px 32px -8px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(107, 114, 128, 0.1) inset'
                                            : '0 8px 32px -8px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(156, 163, 175, 0.1) inset',
                                    }}
                                >
                                    <div 
                                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300"
                                        style={{
                                            background: mountedTheme && isDark
                                                ? 'linear-gradient(135deg, rgba(31, 193, 107, 0.2) 0%, rgba(31, 193, 107, 0.15) 100%)'
                                                : 'linear-gradient(135deg, rgba(31, 193, 107, 0.15) 0%, rgba(31, 193, 107, 0.1) 100%)',
                                        }}
                                    >
                                        <ArrowLeftRight className={`w-5 h-5 sm:w-6 sm:h-6 ${mountedTheme && isDark ? 'text-theme-primary-400' : 'text-theme-primary-500'}`} />
                                    </div>
                                    <span className={`text-xs sm:text-sm font-semibold ${mountedTheme && isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {t('swap.swap')}
                                    </span>
                                </button>
                                </div>
                        )}
                    </div>

                    {/* Assets Section - Phantom Style */}
                    <div className="w-full flex flex-col gap-4 sm:gap-6">
                        {/* Section Header */}
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 sm:gap-2.5">
                                <div className={`${sectionTitleStyles} ${mountedTheme && isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {t('wallet.assets')}
                                </div>
                            </div>
                            {/* Portfolio Summary - Desktop Only */}
                            <div className="hidden md:flex items-center gap-4 text-sm">
                                <div className={`${mountedTheme && isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {filteredTokens.length} {t('wallet.tokens')}
                                </div>
                            </div>
                        </div>

                        {/* Assets Display - Table for desktop, Cards for mobile */}
                        <div className="">
                            {isLoadingTokenList ? (
                                <>
                                    <AssetsTableSkeleton isDark={mountedTheme && isDark} />
                                    <AssetsMobileSkeleton isDark={mountedTheme && isDark} />
                                </>
                            ) : (
                                <>
                                    {/* Desktop Table View */}
                                    <div 
                                        className="hidden sm:block overflow-hidden rounded-xl sm:rounded-2xl z-10 backdrop-blur-xl"
                                        style={{
                                            background: mountedTheme && isDark
                                                ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.4) 100%)'
                                                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.6) 100%)',
                                            border: mountedTheme && isDark
                                                ? '1px solid rgba(107, 114, 128, 0.3)'
                                                : '1px solid rgba(156, 163, 175, 0.3)',
                                            boxShadow: mountedTheme && isDark
                                                ? '0 8px 32px -8px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(107, 114, 128, 0.1) inset'
                                                : '0 8px 32px -8px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(156, 163, 175, 0.1) inset',
                                        }}
                                    >
                                        {!filteredTokens || filteredTokens.length === 0 ? (
                                            <div className={`flex justify-center items-center py-12 ${mountedTheme && isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {t('wallet.noTokens')}
                                            </div>
                                        ) : (
                                            <div className={tableContainerStyles}>
                                                <table className={tableStyles}>
                                                    <thead>
                                                        <tr 
                                                            style={{
                                                                background: mountedTheme && isDark
                                                                    ? 'linear-gradient(135deg, rgba(31, 193, 107, 0.1) 0%, rgba(31, 193, 107, 0.05) 100%)'
                                                                    : 'linear-gradient(135deg, rgba(31, 193, 107, 0.08) 0%, rgba(31, 193, 107, 0.04) 100%)',
                                                            }}
                                                        >
                                                            <th className={`${tableHeaderStyles} ${mountedTheme && isDark ? 'text-white' : 'text-gray-900'}`}>
                                                                {t('wallet.token')} ▼
                                                            </th>
                                                            <th className={`${tableHeaderStyles} ${mountedTheme && isDark ? 'text-white' : 'text-gray-900'}`}>
                                                                {t('wallet.balance')}
                                                            </th>
                                                            <th className={`${tableHeaderStyles} ${mountedTheme && isDark ? 'text-white' : 'text-gray-900'}`}>
                                                                {t('wallet.price')}
                                                            </th>
                                                            <th className={`${tableHeaderStyles} ${mountedTheme && isDark ? 'text-white' : 'text-gray-900'}`}>
                                                                {t('wallet.value')}
                                                            </th>
                                                            <th className={`${tableHeaderStyles} text-center`}>
                                                                <span className="text-theme-primary-500">{t('swap.swap')}</span>
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {filteredTokens.map((token: Token, index: number) => (
                                                            <tr 
                                                                key={index} 
                                                                className="border-t transition-colors"
                                                                style={{
                                                                    borderColor: mountedTheme && isDark
                                                                        ? 'rgba(107, 114, 128, 0.2)'
                                                                        : 'rgba(156, 163, 175, 0.2)',
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.currentTarget.style.background = mountedTheme && isDark
                                                                        ? 'rgba(31, 193, 107, 0.05)'
                                                                        : 'rgba(31, 193, 107, 0.03)';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.background = 'transparent';
                                                                }}
                                                            >
                                                                <td 
                                                                    className={tableCellStyles}
                                                                    onClick={() => router.push(`/pools?address=${token.token_address}`)}
                                                                    style={{
                                                                        color: mountedTheme && isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                                                                    }}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        {token.token_logo_url && (
                                                                            <img
                                                                                src={token.token_logo_url}
                                                                                alt={token.token_name}
                                                                                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full"
                                                                                onError={(e) => {
                                                                                    e.currentTarget.src = '/placeholder.png';
                                                                                }}
                                                                            />
                                                                        )}
                                                                        <div>
                                                                            <div className={`font-medium text-xs sm:text-sm ${mountedTheme && isDark ? 'text-white' : 'text-gray-900'}`}>
                                                                                {token.token_name}
                                                                            </div>
                                                                            <div className={`text-[10px] sm:text-xs ${mountedTheme && isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                                {token.token_symbol}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td 
                                                                    className={tableCellStyles}
                                                                    style={{
                                                                        color: mountedTheme && isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                                                                    }}
                                                                >
                                                                    {token.token_balance.toFixed(token.token_decimals)}
                                                                </td>
                                                                <td 
                                                                    className={tableCellStyles}
                                                                    style={{
                                                                        color: mountedTheme && isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                                                                    }}
                                                                >
                                                                    ${token.token_price_usd.toFixed(6)}
                                                                </td>
                                                                <td 
                                                                    className={tableCellStyles}
                                                                    style={{
                                                                        color: mountedTheme && isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                                                                    }}
                                                                >
                                                                    ${token.token_balance_usd.toFixed(6)}
                                                                </td>
                                                              
                                                                <td className={tableCellStyles}>
                                                                    {(token.token_symbol === "SOL" || token.token_symbol === "USDT") ? (
                                                                        <button
                                                                            onClick={() => handleSwapToken(token.token_symbol)}
                                                                            className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300 hover:scale-105"
                                                                            style={{
                                                                                background: mountedTheme && isDark
                                                                                    ? 'linear-gradient(135deg, rgba(31, 193, 107, 0.15) 0%, rgba(31, 193, 107, 0.1) 100%)'
                                                                                    : 'linear-gradient(135deg, rgba(31, 193, 107, 0.12) 0%, rgba(31, 193, 107, 0.08) 100%)',
                                                                                border: mountedTheme && isDark
                                                                                    ? '1px solid rgba(31, 193, 107, 0.3)'
                                                                                    : '1px solid rgba(31, 193, 107, 0.25)',
                                                                                color: '#1FC16B',
                                                                            }}
                                                                        >
                                                                            <ArrowLeftRight className="w-4 h-4" />
                                                                            <span className="text-xs sm:text-sm font-medium">{t('swap.swap')}</span>
                                                                        </button>
                                                                    ) : (
                                                                        <span className={`text-xs ${mountedTheme && isDark ? 'text-gray-500' : 'text-gray-400'}`}>-</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>

                                    {/* Mobile Card View - Phantom Style */}
                                    <div className="sm:hidden space-y-3">
                                        {!filteredTokens || filteredTokens.length === 0 ? (
                                            <div 
                                                className="flex justify-center items-center py-12 rounded-xl backdrop-blur-xl"
                                                style={{
                                                    background: mountedTheme && isDark
                                                        ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.4) 100%)'
                                                        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.6) 100%)',
                                                    border: mountedTheme && isDark
                                                        ? '1px solid rgba(107, 114, 128, 0.3)'
                                                        : '1px solid rgba(156, 163, 175, 0.3)',
                                                }}
                                            >
                                                <span className={mountedTheme && isDark ? 'text-gray-400' : 'text-gray-600'}>
                                                {t('wallet.noTokens')}
                                                </span>
                                            </div>
                                        ) : (
                                            filteredTokens.map((token: Token, index: number) => (
                                                <div 
                                                    key={index} 
                                                    className="rounded-xl p-4 backdrop-blur-xl transition-all duration-300 active:scale-[0.98]"
                                                    style={{
                                                        background: mountedTheme && isDark
                                                            ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.4) 100%)'
                                                            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.6) 100%)',
                                                        border: mountedTheme && isDark
                                                            ? '1px solid rgba(107, 114, 128, 0.3)'
                                                            : '1px solid rgba(156, 163, 175, 0.3)',
                                                        boxShadow: mountedTheme && isDark
                                                            ? '0 8px 32px -8px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(107, 114, 128, 0.1) inset'
                                                            : '0 8px 32px -8px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(156, 163, 175, 0.1) inset',
                                                    }}
                                                    onClick={() => router.push(`/pools?address=${token.token_address}`)}
                                                >
                                                    {/* Token Header */}
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                            {token.token_logo_url && (
                                                                <img
                                                                    src={token.token_logo_url}
                                                                    alt={token.token_name}
                                                                    className="w-10 h-10 rounded-full flex-shrink-0"
                                                                    onError={(e) => {
                                                                        e.currentTarget.src = '/placeholder.png';
                                                                    }}
                                                                />
                                                            )}
                                                            <div className="min-w-0 flex-1">
                                                                <div className={`font-semibold text-base mb-0.5 truncate ${mountedTheme && isDark ? 'text-white' : 'text-gray-900'}`}>
                                                                    {token.token_name}
                                                                </div>
                                                                <div className={`text-xs ${mountedTheme && isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                    {token.token_symbol}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right flex-shrink-0">
                                                            <div className={`font-semibold text-base mb-0.5 ${mountedTheme && isDark ? 'text-white' : 'text-gray-900'}`}>
                                                                ${token.token_balance_usd.toFixed(2)}
                                                            </div>
                                                            <div className={`text-xs ${mountedTheme && isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                {token.token_balance.toFixed(token.token_decimals)}
                                                                </div>
                                                        </div>
                                                    </div>

                                                    {/* Token Details Row */}
                                                    <div 
                                                        className="flex justify-between items-center pt-3 border-t"
                                                        style={{
                                                            borderColor: mountedTheme && isDark
                                                                ? 'rgba(107, 114, 128, 0.2)'
                                                                : 'rgba(156, 163, 175, 0.2)',
                                                        }}
                                                    >
                                                        <div>
                                                            <div className={`text-xs mb-1 ${mountedTheme && isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                {t('wallet.price')}
                                                        </div>
                                                            <div className={`text-sm font-medium ${mountedTheme && isDark ? 'text-theme-primary-300' : 'text-theme-primary-500'}`}>
                                                                ${token.token_price_usd.toFixed(6)}
                                                        </div>
                                                        </div>
                                                        {(token.token_symbol === "SOL" || token.token_symbol === "USDT") && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleSwapToken(token.token_symbol);
                                                                }}
                                                                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300"
                                                                style={{
                                                                    background: mountedTheme && isDark
                                                                        ? 'linear-gradient(135deg, rgba(31, 193, 107, 0.15) 0%, rgba(31, 193, 107, 0.1) 100%)'
                                                                        : 'linear-gradient(135deg, rgba(31, 193, 107, 0.12) 0%, rgba(31, 193, 107, 0.08) 100%)',
                                                                    border: mountedTheme && isDark
                                                                        ? '1px solid rgba(31, 193, 107, 0.3)'
                                                                        : '1px solid rgba(31, 193, 107, 0.25)',
                                                                }}
                                                            >
                                                                <ArrowLeftRight className="w-4 h-4 text-theme-primary-500" />
                                                                <span className="text-sm font-medium text-theme-primary-500">{t('swap.swap')}</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ModalSignin isOpen={!isAuthenticated} onClose={() => { }} />
            <SwapModal isOpen={isSwapModalOpen} onClose={() => setIsSwapModalOpen(false)} selectedToken={selectedToken} />
        </>
    );
}
