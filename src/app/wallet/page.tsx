"use client"
import { getInforWallet, getListBuyToken } from "@/services/api/TelegramWalletService";
import { formatNumberWithSuffix3, truncateString } from "@/utils/format";
import { useQuery } from "@tanstack/react-query";
import { Copy, Check, ChevronDown, ArrowUpFromLine, ArrowDownToLine, ArrowLeftRight } from "lucide-react";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from '@/lang';
import { useRouter } from "next/navigation";
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
const walletCardStyles = "px-4 sm:px-6 py-3  justify-evenly rounded-md flex flex-col flex-1 sm:gap-4 gap-1 min-h-[130px] items-center min-w-0 bg-white z-10 w-full md:max-w-[440px]"
const walletTitleStyles = "text-Colors-Neutral-100 text-sm sm:text-base font-semibold uppercase leading-tight"
const walletAddressStyles = "text-Colors-Neutral-200 text-xs sm:text-sm font-normal leading-tight truncate"
const sectionTitleStyles = "text-Colors-Neutral-100 text-base sm:text-lg font-bold leading-relaxed"
const tableContainerStyles = "overflow-x-auto -mx-4 sm:mx-0"
const tableStyles = "min-w-[800px] w-full"
const tableHeaderStyles = "px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-neutral-800 dark:text-gray-300"
const tableCellStyles = "px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-neutral-900 dark:text-gray-300"

// Add new styles for mobile assets
const assetCardStyles = "dark:bg-theme-black-200/50 bg-white rounded-md p-4 border border-solid border-y-[#15DFFD] border-x-[#720881]"
const assetHeaderStyles = "flex items-start gap-2 mb-3"
const assetTokenStyles = "flex items-center gap-2 flex-1 min-w-0"
const assetValueStyles = "text-right"
const assetLabelStyles = "text-xs dark:text-gray-400 text-black mb-1"
const assetAmountStyles = "text-sm sm:text-base font-medium dark:text-theme-neutral-100 text-black"
const assetPriceStyles = "text-xs sm:text-sm dark:text-theme-primary-300 text-black"

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
const WalletCardSkeleton = () => (
    <div className={walletCardStyles}>
        <div className="inline-flex justify-start items-center gap-2 w-full">
            <div className="w-6 h-6 sm:w-8 sm:h-8 relative overflow-hidden flex-shrink-0">
                <div className="w-full h-full bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
            </div>
            <div className="justify-start truncate">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-20 mb-1" />
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-16" />
            </div>
        </div>
        <div className="flex flex-col justify-start items-center gap-2 w-full">
            <div className="w-full h-8 sm:h-10 pl-3 sm:pl-4 pr-4 sm:pr-6 relative rounded-md outline outline-1 outline-offset-[-1px] outline-purple-300 flex justify-between items-center">
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-24" />
                <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                </div>
            </div>
        </div>
    </div>
);

const UniversalAccountSkeleton = () => (
    <div className={`${walletCardStyles} dark:bg-gradient-purple-transparent border-theme-primary-300 bg-white z-10`}>
        <div className="inline-flex justify-start items-center gap-2.5 w-full">
            <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-32" />
            <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
        </div>
        <div className="flex justify-between lg:justify-start lg:items-end gap-4 w-full">
            <div className="flex flex-col justify-start items-start gap-3 min-w-0">
                <div className="w-full flex flex-col justify-center items-start gap-1.5">
                    <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-20" />
                    <div className="inline-flex justify-start items-center gap-1.5 flex-wrap">
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-16" />
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-12" />
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-8" />
                    </div>
                </div>
            </div>
            <div className="flex justify-end flex-1 items-center gap-3 w-full sm:w-auto">
                <div className="flex flex-col justify-start items-center gap-1">
                    <div className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-12" />
                </div>
                <div className="flex flex-col justify-start items-center gap-1">
                    <div className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-10" />
                </div>
            </div>
        </div>
    </div>
);

const AssetsTableSkeleton = () => (
    <div className="hidden sm:block overflow-hidden rounded-md border-1 z-10 border-solid border-gray-500">
        <div className={tableContainerStyles}>
            <table className={tableStyles}>
                <thead className="dark:bg-gray-900">
                    <tr>
                        <th className={tableHeaderStyles}>Token ▼</th>
                        <th className={tableHeaderStyles}>Balance</th>
                        <th className={tableHeaderStyles}>Price</th>
                        <th className={tableHeaderStyles}>Value</th>
                        <th className={tableHeaderStyles}>Address</th>
                    </tr>
                </thead>
                <tbody>
                    {Array(5).fill(0).map((_, index) => (
                        <tr key={index} className="border-t border-gray-700">
                            <td className={tableCellStyles}>
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
                                    <div>
                                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-20 mb-1" />
                                        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-12" />
                                    </div>
                                </div>
                            </td>
                            <td className={tableCellStyles}>
                                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-16" />
                            </td>
                            <td className={tableCellStyles}>
                                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-20" />
                            </td>
                            <td className={tableCellStyles}>
                                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-16" />
                            </td>
                            <td className={tableCellStyles}>
                                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-24" />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const AssetsMobileSkeleton = () => (
    <div className="sm:hidden space-y-3">
        {Array(3).fill(0).map((_, index) => (
            <div key={index} className={assetCardStyles}>
                <div className={`w-fit ${assetHeaderStyles} flex-col`}>
                    <div className={assetTokenStyles}>
                        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
                        <div className="min-w-0 flex gap-2">
                            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-20" />
                            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-12" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-24 flex-1" />
                        <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                    </div>
                </div>
                <div className="flex justify-between gap-3 mt-1 lg:mt-3 lg:pt-3 pt-1 border-t border-gray-700">
                    <div>
                        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-12 mb-1" />
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-16" />
                    </div>
                    <div>
                        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-10 mb-1" />
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-14" />
                    </div>
                    <div className={assetValueStyles}>
                        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-10 mb-1" />
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-16" />
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


    return (
        <>
            <div className="flex flex-col gap-4 sm:gap-6">
                <div className={containerStyles}>
                    {/* Wallet Cards Section */}
                    <div className={walletGridStyles}>
                        {isLoadingWalletInfor ? (
                            <>
                                <WalletCardSkeleton />
                                <UniversalAccountSkeleton />
                            </>
                        ) : (
                            <>
                                <div className={`${walletCardStyles} !gap-1 dark:!bg-gray-800 !bg-gray-300`}>
                                    <div className="inline-flex justify-start items-center gap-2 w-full ">
                                        <div className="w-6 h-6 sm:w-8 sm:h-8 relative overflow-hidden flex-shrink-0">
                                            <img src="/solana.png" alt="Solana" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="justify-start truncate">
                                            <span className={walletTitleStyles}>{t('wallet.solana')}</span>
                                            <span className={walletTitleStyles}> {t('wallet.wallet')}</span>
                                        </div>
                                    </div>
                                    <div className="text-xs text-yellow-500 italic w-full">{t('wallet.warning')}</div>
                                    <div className="flex flex-col justify-start items-center gap-2 w-full">
                                        <div className="w-full h-8 lg:h-[36px] pl-3 sm:pl-4 pr-4 sm:pr-6 relative rounded-md outline outline-1 outline-offset-[-1px] outline-gray-500 flex justify-between items-center">
                                            <div className={walletAddressStyles}>
                                                {truncateString(walletInfor?.solana_address, 12)}
                                            </div>
                                            <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0">
                                                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-Colors-Neutral-100" />
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigator.clipboard.writeText(walletInfor?.solana_address || '');
                                                    toast.success(t('connectMasterModal.copyAddress.copied'));
                                                }}
                                                className="text-gray-400 hover:text-gray-200 transition-colors"
                                            >
                                                {copyStates[walletInfor?.solana_address || ''] ? (
                                                    <Check className="w-4 h-4 text-green-500" />
                                                ) : (
                                                    <Copy className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>

                                    </div>
                                </div>

                                <div className={`${walletCardStyles} bg-gradient-to-r from-[#36D2B8] to-[#00A276] border-theme-primary-300 bg-white z-10 relative`}>
                                    <div className="inline-flex justify-start items-center gap-2.5 w-full z-40 relative">
                                        <div className="justify-start text-Colors-Neutral-100 text-base font-semibold uppercase leading-normal truncate">
                                            {t('wallet.universalAccount')}
                                        </div>
                                    </div>
                                    <div className="absolute top-0 right-0 flex justify-between items-center gap-1 h-full w-full px-4 z-30">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="59" height="124" viewBox="0 0 59 124" fill="none">
                                            <path d="M57.2349 59.7935L8.82051 2.4477C5.814 -1.11344 0 1.01262 0 5.67318V20.7134C0 21.8431 0.382561 22.9395 1.08535 23.8239L29.7294 59.8727C31.2074 61.7328 31.1724 64.3761 29.6456 66.1964L1.16909 100.148C0.413914 101.048 0 102.186 0 103.361V118.64C0 123.263 5.73603 125.41 8.77141 121.923L57.1858 66.3018C58.8052 64.4414 58.826 61.6781 57.2349 59.7935Z" fill="url(#paint0_linear_16_1624)" fill-opacity="0.6" />
                                            <defs>
                                                <linearGradient id="paint0_linear_16_1624" x1="30" y1="-8" x2="30" y2="132" gradientUnits="userSpaceOnUse">
                                                    <stop stop-color="#30FCD8" />
                                                    <stop offset="1" stop-color="#0CCD9C" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="59" height="124" viewBox="0 0 59 124" fill="none">
                                            <path d="M57.2349 59.7935L8.82051 2.4477C5.814 -1.11344 0 1.01262 0 5.67318V20.7134C0 21.8431 0.382561 22.9395 1.08535 23.8239L29.7294 59.8727C31.2074 61.7328 31.1724 64.3761 29.6456 66.1964L1.16909 100.148C0.413914 101.048 0 102.186 0 103.361V118.64C0 123.263 5.73603 125.41 8.77141 121.923L57.1858 66.3018C58.8052 64.4414 58.826 61.6781 57.2349 59.7935Z" fill="url(#paint0_linear_16_1624)" fill-opacity="0.6" />
                                            <defs>
                                                <linearGradient id="paint0_linear_16_1624" x1="30" y1="-8" x2="30" y2="132" gradientUnits="userSpaceOnUse">
                                                    <stop stop-color="#30FCD8" />
                                                    <stop offset="1" stop-color="#0CCD9C" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="59" height="124" viewBox="0 0 59 124" fill="none">
                                            <path d="M57.2349 59.7935L8.82051 2.4477C5.814 -1.11344 0 1.01262 0 5.67318V20.7134C0 21.8431 0.382561 22.9395 1.08535 23.8239L29.7294 59.8727C31.2074 61.7328 31.1724 64.3761 29.6456 66.1964L1.16909 100.148C0.413914 101.048 0 102.186 0 103.361V118.64C0 123.263 5.73603 125.41 8.77141 121.923L57.1858 66.3018C58.8052 64.4414 58.826 61.6781 57.2349 59.7935Z" fill="url(#paint0_linear_16_1624)" fill-opacity="0.6" />
                                            <defs>
                                                <linearGradient id="paint0_linear_16_1624" x1="30" y1="-8" x2="30" y2="132" gradientUnits="userSpaceOnUse">
                                                    <stop stop-color="#30FCD8" />
                                                    <stop offset="1" stop-color="#0CCD9C" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="59" height="124" viewBox="0 0 59 124" fill="none">
                                            <path d="M57.2349 59.7935L8.82051 2.4477C5.814 -1.11344 0 1.01262 0 5.67318V20.7134C0 21.8431 0.382561 22.9395 1.08535 23.8239L29.7294 59.8727C31.2074 61.7328 31.1724 64.3761 29.6456 66.1964L1.16909 100.148C0.413914 101.048 0 102.186 0 103.361V118.64C0 123.263 5.73603 125.41 8.77141 121.923L57.1858 66.3018C58.8052 64.4414 58.826 61.6781 57.2349 59.7935Z" fill="url(#paint0_linear_16_1624)" fill-opacity="0.6" />
                                            <defs>
                                                <linearGradient id="paint0_linear_16_1624" x1="30" y1="-8" x2="30" y2="132" gradientUnits="userSpaceOnUse">
                                                    <stop stop-color="#30FCD8" />
                                                    <stop offset="1" stop-color="#0CCD9C" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                    </div>
                                    <div className="flex justify-between lg:justify-start lg:items-end gap-4 w-full z-40">
                                        <div className="flex flex-col justify-start items-start gap-3 min-w-0">
                                            <div className="w-full flex flex-col justify-center items-start">
                                                <div className="text-right justify-start text-white text-xl font-bold leading-9 truncate">
                                                    {walletInfor?.solana_balance} SOL
                                                </div>
                                                <div className="inline-flex justify-start items-center gap-1.5 flex-wrap">
                                                    <div className="text-right justify-start text-white text-[16px] font-medium leading-relaxed">
                                                        ${formatNumberWithSuffix3(walletInfor?.solana_balance_usd)}
                                                    </div>
                                                    <div className="text-right justify-start text-white text-[16px] font-medium leading-relaxed">
                                                        (0.00%)
                                                    </div>
                                                    <div className="text-right justify-start text-white text-[16px] font-medium leading-relaxed">
                                                        24H
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-end flex-1 items-center gap-3 w-full sm:w-auto">
                                            <div className="flex flex-col justify-start items-center gap-1">
                                                <button onClick={() => router.replace('/universal-account?type=deposit')} className="flex flex-col justify-start items-center gap-0.5 md:gap-1">
                                                    <div className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 bg-white text-[#1FC16B] border border-neutral-200 rounded-full flex justify-center items-center group  transition-all duration-500 hover:scale-105 hover:shadow-lg hover:shadow-theme-primary-500/30 active:scale-95">
                                                        <ArrowDownToLine className="w-2.5 h-2.5 md:w-3 md:h-3 lg:w-4 lg:h-4" />
                                                    </div>
                                                    <div className="text-center text-white text-[9px] md:text-[10px] font-semibold">
                                                        {t('wallet.receive')}
                                                    </div>
                                                </button>

                                            </div>
                                            <div className="flex flex-col justify-start items-center gap-1">
                                                <button onClick={() => router.replace('/universal-account?type=withdraw')} className="flex flex-col justify-start items-center gap-0.5 md:gap-1">
                                                    <div className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 bg-white text-[#1FC16B] border border-neutral-200 rounded-full flex justify-center items-center transition-all hover:scale-105">
                                                        <ArrowUpFromLine className="w-2.5 h-2.5 md:w-3 md:h-3 lg:w-4 lg:h-4" />
                                                    </div>
                                                    <div className="text-center text-white text-[9px] md:text-[10px] font-semibold">
                                                        {t('wallet.send')}
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Swap Button */}
                    {/* <div className="flex justify-center mt-6">
                        <button
                            onClick={() => setIsSwapModalOpen(true)}
                            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold py-3 px-8 rounded-xl text-lg transition-all duration-300 hover:scale-105 shadow-lg"
                        >
                            💱 Swap Tokens
                        </button>
                    </div> */}

                    <div className="w-full flex flex-col xl:gap-4 gap-2">
                        {/* Assets Section */}
                        <div className="flex justify-start items-center gap-2 sm:gap-2.5 mt-2">
                            <img src="/ethereum.png" alt="Ethereum" className="w-3 h-3 sm:w-4 sm:h-4 object-cover" />
                            <div className={sectionTitleStyles}>{t('wallet.assets')}</div>
                            <img src="/ethereum.png" alt="Ethereum" className="w-3 h-3 sm:w-4 sm:h-4 object-cover" />
                        </div>

                        {/* Assets Display - Table for desktop, Cards for mobile */}
                        <div className="">
                            {isLoadingTokenList ? (
                                <>
                                    <AssetsTableSkeleton />
                                    <AssetsMobileSkeleton />
                                </>
                            ) : (
                                <>
                                    {/* Desktop Table View */}
                                    <div className="hidden sm:block overflow-hidden rounded-md border-1 z-10 border-solid border-gray-500">
                                        {!filteredTokens || filteredTokens.length === 0 ? (
                                            <div className="flex justify-center items-center py-8 text-neutral-600 dark:text-gray-400">
                                                {t('wallet.noTokens')}
                                            </div>
                                        ) : (
                                            <div className={tableContainerStyles}>
                                                <div className="mb-1 p-4 bg-transparent">
                                                    <div className="flex flex-col sm:flex-row gap-4 justify-between">
                                                        {/* SOL Balance */}
                                                        <div className="flex-1 flex gap-2 items-center">
                                                            <div className="text-sm text-gray-600 dark:text-gray-400 ">{t('wallet.solBalance')}</div>
                                                            <div className="text-base font-bold text-blue-600 dark:text-blue-400">
                                                                {(() => {
                                                                    const solToken = filteredTokens.find((token: any) => token.token_symbol === "SOL");
                                                                    return solToken ? solToken.token_balance.toFixed(4) : "0.0000";
                                                                })()}
                                                            </div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-500">
                                                                ≈ ${(() => {
                                                                    const solToken = filteredTokens.find((token: any) => token.token_symbol === "SOL");
                                                                    return solToken ? (solToken.token_balance * solToken.token_price_usd).toFixed(2) : "0.00";
                                                                })()} USD
                                                            </div>
                                                        </div>

                                                        {/* USDT Balance */}
                                                        <div className="flex-1 flex gap-2 items-center">
                                                            <div className="text-sm text-gray-600 dark:text-gray-400 ">{t('wallet.usdtBalance')}</div>
                                                            <div className="text-base font-bold text-green-600 dark:text-green-400">
                                                                {(() => {
                                                                    const usdtToken = filteredTokens.find((token: any) => token.token_symbol === "USDT");
                                                                    return usdtToken ? usdtToken.token_balance.toFixed(2) : "0.00";
                                                                })()}
                                                            </div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-500">
                                                                ≈ ${(() => {
                                                                    const usdtToken = filteredTokens.find((token: any) => token.token_symbol === "USDT");
                                                                    return usdtToken ? (usdtToken.token_balance * usdtToken.token_price_usd).toFixed(2) : "0.00";
                                                                })()} USD
                                                            </div>
                                                        </div>

                                                        {/* Total Portfolio Value */}
                                                        <div className="flex-1 flex gap-2 items-center">
                                                            <div className="text-sm text-gray-600 dark:text-gray-400 ">{t('wallet.totalPortfolio')}</div>
                                                            <div className="text-base font-bold text-purple-600 dark:text-purple-400">
                                                                ${(() => {
                                                                    const totalValue = filteredTokens.reduce((sum: number, token: any) => {
                                                                        return sum + token.token_balance_usd;
                                                                    }, 0);
                                                                    return totalValue.toFixed(2);
                                                                })()}
                                                            </div>
                                                            <div className="text-sm text-gray-500 dark:text-theme-primary-500">
                                                                {filteredTokens.length} {t('wallet.tokens')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <table className={tableStyles}>
                                                    <thead className="dark:bg-gray-900">
                                                        <tr>
                                                            <th className={tableHeaderStyles}>{t('wallet.token')} ▼</th>
                                                            <th className={tableHeaderStyles}>{t('wallet.balance')}</th>
                                                            <th className={tableHeaderStyles}>{t('wallet.price')}</th>
                                                            <th className={tableHeaderStyles}>{t('wallet.value')}</th>
                                                            <th className={`${tableHeaderStyles} text-center !text-theme-primary-500`}>{t('swap.swap')} (SOL / USDT)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {filteredTokens.map((token: Token, index: number) => (
                                                            <tr key={index} className="border-t border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                                                <td className={tableCellStyles}  onClick={() => router.push(`/pools?address=${token.token_address}`)}>
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
                                                                            <div className="font-medium text-neutral-900 dark:text-theme-neutral-100 text-xs sm:text-sm">{token.token_name}</div>
                                                                            <div className="text-[10px] sm:text-xs text-neutral-600 dark:text-gray-400">{token.token_symbol}</div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className={tableCellStyles}>
                                                                    {token.token_balance.toFixed(token.token_decimals)}
                                                                </td>
                                                                <td className={tableCellStyles}>
                                                                    ${token.token_price_usd.toFixed(6)}
                                                                </td>
                                                                <td className={tableCellStyles}>
                                                                    ${token.token_balance_usd.toFixed(6)}
                                                                </td>
                                                              
                                                                <td>
                                                                    {(token.token_symbol === "SOL" || token.token_symbol === "USDT") && (
                                                                        <div className="flex justify-center items-center" onClick={() => handleSwapToken(token.token_symbol)}>
                                                                            <ArrowLeftRight className="w-5 h-5 text-white" /> &ensp; {t('swap.swap')}
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>

                                    {/* Mobile Card View */}
                                    <div className="sm:hidden space-y-3">
                                        {!filteredTokens || filteredTokens.length === 0 ? (
                                            <div className="flex justify-center items-center py-6 text-neutral-600 dark:text-gray-400 bg-gray-800/60 rounded-md">
                                                {t('wallet.noTokens')}
                                            </div>
                                        ) : (
                                            filteredTokens.map((token: Token, index: number) => (
                                                <div key={index} className={assetCardStyles}>
                                                    {/* Token Info Header */}
                                                    <div className={`w-fit ${assetHeaderStyles} flex-col w-full`}>
                                                        <div className={`${assetTokenStyles} justify-between w-full`}>
                                                            <div className="flex items-center gap-2">
                                                            {token.token_logo_url && (
                                                                <img
                                                                    src={token.token_logo_url}
                                                                    alt={token.token_name}
                                                                    className="w-8 h-8 rounded-full"
                                                                    onError={(e) => {
                                                                        e.currentTarget.src = '/placeholder.png';
                                                                    }}
                                                                />
                                                            )}
                                                            <div className="min-w-0 flex gap-2 items-center">
                                                                <div className="font-medium dark:text-theme-neutral-100 text-black text-sm truncate">{token.token_name}</div>
                                                                <div className="text-xs dark:text-gray-400 text-black ">{token.token_symbol}</div>
                                                            </div>
                                                            </div>
                                                            {(token.token_symbol === "SOL" || token.token_symbol === "USDT") && (
                                                                <div className="flex justify-center items-center" onClick={() => handleSwapToken(token.token_symbol)}>
                                                                    <ArrowLeftRight className="w-4 h-4 text-theme-primary-500" /> &ensp; {t('swap.swap')}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Token Details */}
                                                    <div className="flex justify-between gap-3 mt-1 lg:mt-3 lg:pt-3 pt-1 border-t border-gray-700">              
                                                        <div>
                                                            <div className={assetLabelStyles}>{t('wallet.balance')}</div>
                                                            <div className={assetAmountStyles}>{token.token_balance.toFixed(token.token_decimals)}</div>
                                                        </div>
                                                        <div>
                                                            <div className={assetLabelStyles}>{t('wallet.price')}</div>
                                                            <div className={assetPriceStyles}>${token.token_price_usd.toFixed(6)}</div>
                                                        </div>
                                                        <div className={assetValueStyles}>
                                                            <div className={assetLabelStyles}>{t('wallet.value')}</div>
                                                            <div className={assetAmountStyles}>${token.token_balance_usd.toFixed(2)}</div>
                                                        </div>
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
