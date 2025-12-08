'use client'
import { getInforWallet } from '@/services/api/TelegramWalletService';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useState, Suspense } from 'react'
import DepositWallet from './deposit';
import WithdrawWallet from './withdraw';
// Removed duplicate Toaster import - using the one from ClientLayout
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/table';
import { ExternalLink, Copy } from 'lucide-react';
import { getTransactionHistory } from '@/services/api/HistoryTransactionWallet';
import { toast } from '@/hooks/use-toast';
import { truncateString } from '@/utils/format';
import { useLang } from '@/lang';
import { useSearchParams } from 'next/navigation';
import { useTheme } from 'next-themes';

type Transaction = {
    id: number
    wallet_id: number
    wallet_address_from: string
    wallet_address_to: string
    type: "deposit" | "withdraw"
    amount: string
    status: "completed" | "pending" | "failed"
    transaction_hash: string
    error_message: string | null
    created_at: string
    updated_at: string
    token_symbol: string
}

// Create a client component for the content
const UniversalAccountContent = () => {
    const { t } = useLang();
    const { theme, resolvedTheme } = useTheme();
    const [mountedTheme, setMountedTheme] = useState(false);
    const isDark = resolvedTheme === 'dark' || (resolvedTheme === undefined && theme === 'dark');

    useEffect(() => {
        setMountedTheme(true);
    }, []);

    const { data: walletInfor, isLoading, isError, error } = useQuery({
        queryKey: ["wallet-infor"],
        queryFn: getInforWallet,
    });

    const searchParams = useSearchParams()
    const type = searchParams.get('type')
    const [tab, setTab] = useState<"deposit" | "withdraw">(type === "withdraw" ? "withdraw" : "deposit");



    const { data: transactionsData } = useQuery({
        queryKey: ["transactions"],
        queryFn: () => getTransactionHistory(),
    });

    // Extract transactions array from response
    // API might return { data: [...] } or directly an array
    const transactions = Array.isArray(transactionsData) 
        ? transactionsData 
        : (transactionsData?.data || transactionsData?.transactions || []);

    // Filter transactions based on current tab
    const filteredTransactions = Array.isArray(transactions) 
        ? transactions.filter((tx: Transaction) => {
            const isMatch = tab === "deposit" ? tx.type === "deposit" : tx.type === "withdraw";
            return isMatch;
        })
        : [];

    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    };

    return (
        <div className="px-[12px] sm:px-[16px] lg:px-[40px] flex flex-col pt-[12px] sm:pt-[16px] lg:pt-[30px] relative mx-auto z-10 pb-6 lg:pb-0 my-8">
            <div className='container flex flex-col gap-4 sm:gap-6'>
                {/* Toaster removed - using the one from ClientLayout */}
                {walletInfor?.solana_address && (
                    <div className="flex items-center justify-center flex-col gap-6">
                        <div className="grid w-full max-w-auto sm:max-w-[320px] grid-cols-2 backdrop-blur-sm rounded-xl p-1"
                            style={{
                                background: mountedTheme && isDark
                                    ? 'rgba(31, 41, 55, 0.3)'
                                    : 'rgba(243, 244, 246, 0.5)',
                                border: mountedTheme && isDark
                                    ? '1px solid rgba(255, 255, 255, 0.1)'
                                    : '1px solid rgba(229, 231, 235, 0.5)',
                            }}
                        >
                            <button
                                className={`flex-1 rounded-lg text-sm sm:text-base cursor-pointer font-medium text-center transition-all ${
                                    tab === "deposit" 
                                        ? "text-white bg-gradient-to-r from-theme-primary-500 to-theme-primary-400" 
                                        : (mountedTheme && isDark 
                                            ? "text-gray-300 hover:bg-theme-primary-500/10" 
                                            : "text-gray-600 hover:bg-theme-primary-500/20")
                                }`}
                                onClick={() => setTab("deposit")}
                            >
                                {t('universal_account.deposit')}
                            </button>
                            <button
                                className={`flex-1 rounded-lg cursor-pointer text-sm sm:text-base font-medium text-center transition-all ${
                                    tab === "withdraw" 
                                        ? "text-white bg-gradient-to-r from-theme-primary-500 to-theme-primary-400" 
                                        : (mountedTheme && isDark 
                                            ? "text-gray-300 hover:bg-theme-primary-500/10" 
                                            : "text-gray-600 hover:bg-theme-primary-500/20")
                                }`}
                                onClick={() => setTab("withdraw")}
                            >
                                {t('universal_account.withdraw')}
                            </button>
                        </div>

                        <div className="flex-1 md:container w-full">
                            {tab === "deposit" && (
                                <DepositWallet walletAddress={walletInfor.solana_address} />
                            )}
                            {tab === "withdraw" && (
                                <WithdrawWallet walletInfor={walletInfor} />
                            )}
                        </div>
                    </div>

                )}
            </div>

            <div className='container px-0 mt-8'>
                <div className="flex items-center gap-2 mb-3 sm:mb-4 mt-4 lg:mt-0">
                    <h3 className={`font-bold text-sm sm:text-base uppercase ${mountedTheme && isDark ? 'text-white' : 'text-gray-900'}`}>
                        {t(`universal_account.${tab}`)} {t('universal_account.history')}
                    </h3>
                    
                </div>

                {/* Mobile Card View */}
                <div className="block sm:hidden space-y-3">
                    {filteredTransactions.length > 0 ? (
                        filteredTransactions.map((tx: Transaction) => (
                            <div 
                                key={tx.id} 
                                className="rounded-xl p-3 sm:p-4 space-y-2 backdrop-blur-xl"
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
                                <div className="flex items-center justify-between">
                                    <span className={`text-[10px] ${mountedTheme && isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('universal_account.time')}</span>
                                    <span className={`text-[11px] ${mountedTheme && isDark ? 'text-gray-300' : 'text-gray-900'}`}>{formatDate(tx.created_at)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className={`text-[10px] ${mountedTheme && isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('universal_account.type')}</span>
                                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium ${tx.type === "deposit"
                                            ? "bg-blue-500/20 text-blue-400"
                                            : "bg-purple-500/20 text-purple-400"
                                        }`}>
                                        {tx.type.toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className={`text-[10px] ${mountedTheme && isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('universal_account.status')}</span>
                                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium ${tx.status === "completed"
                                            ? "bg-green-500/20 text-green-400"
                                            : tx.status === "pending"
                                                ? "bg-yellow-500/20 text-yellow-400"
                                                : "bg-red-500/20 text-red-400"
                                        }`}>
                                        {tx.status.toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className={`text-[10px] ${mountedTheme && isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('universal_account.amount')}</span>
                                    <span className={`text-[11px] ${mountedTheme && isDark ? 'text-gray-300' : 'text-gray-900'}`}>{tx.amount} {tx.token_symbol}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className={`text-[10px] ${mountedTheme && isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('universal_account.transaction_id')}</span>
                                    {tx.transaction_hash && (
                                        <div className="flex items-center gap-1">
                                            <span className={`text-[11px] ${mountedTheme && isDark ? 'text-gray-300' : 'text-gray-900'}`}>{truncateString(tx.transaction_hash, 8)}</span>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(tx.transaction_hash);
                                                    toast({
                                                        title: "Copied!",
                                                        description: "Transaction hash copied to clipboard",
                                                    });
                                                }}
                                                className={`transition-colors ${mountedTheme && isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                                            >
                                                <Copy className="w-2.5 h-2.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div 
                                    className="pt-2 border-t"
                                    style={{
                                        borderColor: mountedTheme && isDark
                                            ? 'rgba(31, 193, 107, 0.2)'
                                            : 'rgba(31, 193, 107, 0.15)',
                                    }}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className={`text-[10px] ${mountedTheme && isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('universal_account.from')}</span>
                                        <span className={`text-[11px] ${mountedTheme && isDark ? 'text-gray-300' : 'text-gray-900'}`}>{truncateString(tx.wallet_address_from, 8)}</span>
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className={`text-[10px] ${mountedTheme && isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('universal_account.to')}</span>
                                        <span className={`text-[11px] ${mountedTheme && isDark ? 'text-gray-300' : 'text-gray-900'}`}>{truncateString(tx.wallet_address_to, 8)}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div 
                            className="text-center py-6 text-xs rounded-xl p-2 backdrop-blur-xl"
                            style={{
                                background: mountedTheme && isDark
                                    ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.2) 100%)'
                                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.4) 100%)',
                                border: mountedTheme && isDark
                                    ? '1px solid rgba(107, 114, 128, 0.2)'
                                    : '1px solid rgba(156, 163, 175, 0.2)',
                            }}
                        >
                            <span className={mountedTheme && isDark ? 'text-gray-400' : 'text-gray-600'}>
                                {t('universal_account.no_transactions', { type: t(`universal_account.${tab}`) })}
                            </span>
                        </div>
                    )}
                </div>

                {/* Desktop Table View */}
                <div 
                    className="hidden sm:block overflow-x-auto rounded-xl sm:rounded-2xl z-10 backdrop-blur-xl"
                    style={{
                        background: mountedTheme && isDark
                            ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.4) 100%)'
                            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.6) 100%)',
                        border: mountedTheme && isDark
                            ? '1px solid rgba(31, 193, 107, 0.3)'
                            : '1px solid rgba(31, 193, 107, 0.25)',
                        boxShadow: mountedTheme && isDark
                            ? '0 0 0 1px rgba(31, 193, 107, 0.2), 0 0 30px rgba(31, 193, 107, 0.15), 0 8px 32px -8px rgba(0, 0, 0, 0.4)'
                            : '0 0 0 1px rgba(31, 193, 107, 0.15), 0 0 30px rgba(31, 193, 107, 0.1), 0 8px 32px -8px rgba(0, 0, 0, 0.1)',
                    }}
                >
                    <Table className="w-full">
                        <TableHeader>
                            <TableRow 
                                className="hover:bg-transparent"
                                style={{
                                    borderBottom: mountedTheme && isDark
                                        ? '1px solid rgba(31, 193, 107, 0.2)'
                                        : '1px solid rgba(31, 193, 107, 0.15)',
                                    background: mountedTheme && isDark
                                        ? 'linear-gradient(135deg, rgba(31, 193, 107, 0.1) 0%, rgba(31, 193, 107, 0.05) 100%)'
                                        : 'linear-gradient(135deg, rgba(31, 193, 107, 0.08) 0%, rgba(31, 193, 107, 0.04) 100%)',
                                }}
                            >
                                <TableHead className={`py-2 px-6 text-xs font-medium ${mountedTheme && isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('universal_account.time')}</TableHead>
                                <TableHead className={`py-2 px-4 text-xs font-medium ${mountedTheme && isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('universal_account.type')}</TableHead>
                                <TableHead className={`py-2 px-3 text-xs font-medium ${mountedTheme && isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('universal_account.status')}</TableHead>
                                <TableHead className={`py-2 px-6 text-xs font-medium text-right ${mountedTheme && isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('universal_account.amount')}</TableHead>
                                <TableHead className={`py-2 px-6 text-xs font-medium ${mountedTheme && isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('universal_account.from_address')}</TableHead>
                                <TableHead className={`py-2 px-6 text-xs font-medium ${mountedTheme && isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('universal_account.to_address')}</TableHead>
                                <TableHead className={`py-2 px-6 text-xs font-medium ${mountedTheme && isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('universal_account.transaction_id')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTransactions.length > 0 ? (
                                filteredTransactions.map((tx: Transaction) => (
                                    <TableRow 
                                        key={tx.id} 
                                        className="text-xs cursor-pointer transition-colors"
                                        style={{
                                            borderBottom: mountedTheme && isDark
                                                ? '1px solid rgba(107, 114, 128, 0.1)'
                                                : '1px solid rgba(156, 163, 175, 0.1)',
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
                                        <TableCell className={`py-2 px-6 whitespace-nowrap ${mountedTheme && isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                                            {formatDate(tx.created_at)}
                                        </TableCell>
                                        <TableCell className="py-2 px-4">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${tx.type === "deposit"
                                                    ? "bg-blue-500/20 text-blue-400"
                                                    : "bg-purple-500/20 text-purple-400"
                                                }`}>
                                                {t(`universal_account.${tx.type}`)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-2 px-3">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${tx.status === "completed"
                                                    ? "bg-green-500/20 text-green-400"
                                                    : tx.status === "pending"
                                                        ? "bg-yellow-500/20 text-yellow-400"
                                                        : "bg-red-500/20 text-red-400"
                                                }`}>
                                                {t(`transactionHistory.${tx.status}`)}
                                            </span>
                                        </TableCell>
                                        <TableCell className={`py-2 px-6 text-right whitespace-nowrap ${mountedTheme && isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                                            {Number(tx.amount).toFixed(5)} {tx.token_symbol}
                                        </TableCell>
                                        <TableCell className={`py-2 px-6 ${mountedTheme && isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                                            {truncateString(tx.wallet_address_from, 12)}
                                        </TableCell>
                                        <TableCell className={`py-2 px-6 ${mountedTheme && isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                                            {truncateString(tx.wallet_address_to, 12)}
                                        </TableCell>
                                        <TableCell className="py-2 px-6 italic text-theme-primary-500">
                                            {tx.transaction_hash && (
                                                <div className="flex items-center gap-2">
                                                    {truncateString(tx.transaction_hash, 12)}
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(tx.transaction_hash);
                                                            toast({
                                                                title: "Copied!",
                                                                description: "Transaction hash copied to clipboard",
                                                            });
                                                        }}
                                                        className={`transition-colors ${mountedTheme && isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                                                    >
                                                        <Copy className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className={`py-8 text-center ${mountedTheme && isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {t('universal_account.no_transactions', { type: t(`universal_account.${tab}`) })}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

        </div>
    )
}

// Main page component
const universal_accountPage = () => {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <UniversalAccountContent />
        </Suspense>
    )
}

export default universal_accountPage