'use client';

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link';
import { ChevronDown, LogOut, Search, Wallet2, Menu, X, LayoutDashboard, Coins, LineChart, Wallet as WalletIcon, Moon, Sun, EyeOff, ShieldCheck, FileCheck, LinkIcon, Shield, Store, Copy, Divide, ArrowDownToLine, ArrowUpFromLine, Link2, Twitter } from 'lucide-react';
import { useLang } from '@/lang/useLang';
import Display from '@/app/components/Display';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getBalanceInfo, getInforWallet } from '@/services/api/TelegramWalletService';
import { formatNumberWithSuffix3, truncateString } from '@/utils/format';
import notify from './notify'
// Removed NotifyProvider import - using Toaster from ClientLayout
import SearchModal from './search-modal';
import { LangToggle } from './LanguageSelect';
import { useTheme } from 'next-themes';
import PumpFun from './pump-fun';
import ModalSignin from './ModalSignin';
import { toast } from 'react-hot-toast';


const Header = () => {
    const { t, lang } = useLang();
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, logout, updateToken } = useAuth();
    const [mounted, setMounted] = useState(false);
    const [isWalletDialogOpen, setIsWalletDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isSigninModalOpen, setIsSigninModalOpen] = useState(false);
    const { theme, setTheme } = useTheme();
    const [isDark, setIsDark] = useState(theme);
    const [phantomConnected, setPhantomConnected] = useState(false);
    const [phantomPublicKey, setPhantomPublicKey] = useState<string | null>(null);

    useEffect(() => {
        setIsDark(theme);
    }, [theme]);

    const { data: walletInfor, refetch } = useQuery({
        queryKey: ["wallet-infor"],
        queryFn: getInforWallet,
        refetchInterval: 30000,
        staleTime: 30000,
        enabled: isAuthenticated,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });
    console.log("walletInfor", walletInfor)
    
    const { data: balanceInfo, refetch: refetchBalanceInfo } = useQuery({
        queryKey: ["balance-info"],
        queryFn: getBalanceInfo,
        refetchInterval: 30000,
        staleTime: 30000,
        enabled: isAuthenticated,
    });
    console.log(balanceInfo)

    useEffect(() => {
        setMounted(true);
        return () => {
            setMounted(false);
        };
    }, []);

    useEffect(() => {
        if (walletInfor?.status === 403) {
            notify({
                message: t('header.notifications.completeProfile'),
                type: 'error'
            });
            router.push("/complete-profile");
        }
        if (walletInfor?.status === 401) {
            logout();
        }
        if (walletInfor && walletInfor.status === 200) {
            if (!isWalletDialogOpen) {
                notify({
                    message: t('header.notifications.loginSuccess'),
                    type: 'success'
                });
            }
        }
    }, [walletInfor, router, logout, isWalletDialogOpen]);

    // Auto refetch wallet info when authentication state changes
    useEffect(() => {
        if (isAuthenticated) {
            refetch();
        }
    }, [isAuthenticated, refetch]);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024); // 1024px is the lg breakpoint
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => {
            window.removeEventListener('resize', checkMobile);
        };
    }, []);

    const [tokens, setTokens] = useState<any[]>([]);

    useEffect(() => {
        if (mounted) {
            const storedTokens = localStorage.getItem('recentTokens');
            const parsedTokens = storedTokens ? JSON.parse(storedTokens) : [];
            setTokens(parsedTokens);
            console.log("tokens", parsedTokens);
        }
    }, [mounted]);

    useEffect(() => {
        if (!isSearchModalOpen) {
            setSearchQuery("");
        }
    }, [isSearchModalOpen]);

    const defaultAddress = tokens.length > 0 ? `/trading?address=${tokens[0].address}` : '/trading?address=6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN';

    const listSidebar = [
        {
            name: t('trading.trade'),
            href: defaultAddress,
            icon: LayoutDashboard,
            logoPump: false,
        },
        {
            name: t('pools.tab'),
            href: '/pools',
            icon: LayoutDashboard,
            logoPump: false,
        },
        {
            name: t("wallet manager"),
            href: '/wallet',
            icon: WalletIcon,
            logoPump: false,
            isPhantomConnected: !phantomConnected,
        },
        {
            name: "BITTWORLD CEX",
            icon: Link2,
            href: "https://www.bittworld.com",
            logoPump: false,
        },
        {
            name: "BITTWORLD TWITTER",
            icon: Twitter,
            href: "https://x.com/BittWorld776",
            logoPump: false,
        }
    ]
    return (
        <>
            {/* NotifyProvider removed - using Toaster from ClientLayout */}
            <header className="sticky top-0 w-full bg-white dark:bg-[#141414] border-b dark:border-none shadow-lg border-gray-200 dark:border-gray-800" style={{ zIndex: 55 }}>
                <div className='flex items-center justify-between px-4 2xl:px-10 2xl:py-2 py-1'>
                    <div className='flex w-full justify-between'>
                        <div className='flex items-center gap-[2vw]'>
                            <Link href={defaultAddress} className="flex items-center">
                                <img
                                    src="/bitworld-logo-light.png"
                                    alt="logo"
                                    className="h-6 xl:h-8 block dark:hidden"
                                />
                                <img
                                    src="/bitworld-logo.png"
                                    alt="logo"
                                    className="h-6 xl:h-8 hidden dark:block"
                                />
                            </Link>
                            {/* Desktop Navigation */}
                            <nav className='hidden md:flex items-center gap-4 xl:gap-[2vw]'>
                                {listSidebar.map((item, index) => {
                                    const isExternalLink = item.href.startsWith('http');
                                    const Component = isExternalLink ? 'a' : Link;
                                    const props = isExternalLink 
                                        ? { 
                                            href: item.href, 
                                            target: "_blank", 
                                            rel: "noopener noreferrer",
                                            className: `hover:text-theme-primary-500 2xl:text-sm text-xs capitalize transition-colors flex text-xs items-center gap-2 ${pathname === item.href ? 'text-theme-primary-500 font-semibold' : ''}`
                                          }
                                        : { 
                                            href: item.href,
                                            className: `hover:text-theme-primary-500 2xl:text-sm text-xs capitalize transition-colors flex text-xs items-center gap-2 ${pathname === item.href ? 'text-theme-primary-500 font-semibold' : ''}`
                                          };
                                    
                                    return (
                                        <Component
                                            key={index}
                                            {...props}
                                        >
                                            {item.name}
                                        </Component>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Mobile Search */}
                        <div className="md:hidden relative flex items-center">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                }}
                                onFocus={() => {
                                    setIsSearchModalOpen(true);
                                }}
                                placeholder={t('header.search.placeholder')}
                                className="rounded-full py-1 pl-8 pr-3 w-32 text-xs focus:outline-none bg-gray-100 dark:bg-black text-gray-900 dark:text-neutral-200 focus:ring-1 focus:ring-blue-500 dark:focus:ring-[hsl(var(--ring))] border border-gray-200 placeholder:text-gray-500 dark:placeholder:text-neutral-400"
                            />
                            <Search className="absolute left-2 top-4.5 h-3 w-3 text-gray-500 dark:text-muted-foreground" />
                        </div>
                    </div>
                    <SearchModal
                        isOpen={isSearchModalOpen}
                        onClose={() => {
                            setIsSearchModalOpen(false);
                        }}
                        searchQuery={searchQuery}
                    />

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>

                    <div className='hidden md:flex items-center gap-2 2xl:gap-6'>
                        {isAuthenticated && walletInfor && (
                            <button className=' bg-theme-primary-500 2xl:text-sm text-[10px] linear-gradient-blue text-theme-neutral-100 dark:text-neutral-100 font-medium px-3 lg:px-3.5 py-[6px] rounded-md transition-colors whitespace-nowrap flex flex-col'>
                               {t("myWallet")} {walletInfor.solana_balance} SOL &ensp; {'$' + formatNumberWithSuffix3(walletInfor.solana_balance_usd)}
                            </button>
                        )}
                        <div className="relative xl:ml-4 ml-2">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setIsSearchModalOpen(e.target.value.length > 0);
                                }}
                                onFocus={() => {
                                    if (searchQuery.length > 0) {
                                        setIsSearchModalOpen(true);
                                    }
                                }}
                                placeholder={t('searchPlaceholder')}
                                className="rounded-md py-1.5 xl:pl-10 pl-6 pr-4 w-[13vw] 2xl:w-[13vw] text-sm focus:outline-none bg-gray-100 dark:bg-black text-gray-900 dark:text-neutral-200 focus:ring-1 focus:ring-blue-500 dark:focus:ring-[hsl(var(--ring))] max-h-[30px] border border-gray-500 placeholder:text-gray-500 dark:placeholder:text-neutral-400 placeholder:text-[10px] xl:placeholder:text-xs"
                            />
                            <Search className="absolute xl:left-3 left-2 top-2 2xl:top-2 xl:h-4 h-3 w-3 text-gray-500 dark:text-muted-foreground" />
                        </div>

                        <Display />

                        {mounted ? (
                            <>
                                {!isAuthenticated && !phantomConnected ? (
                                    <button
                                        onClick={() => router.push('/connect?tab=login')}
                                        className="text-sm bg-theme-primary-500 text-theme-neutral-100 dark:text-neutral-100 font-medium px-3 md:px-4 py-[4px] rounded-md transition-colors whitespace-nowrap flex items-center gap-1"
                                    >
                                        {t('connect')}
                                    </button>
                                ) : (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="text-sm bg-theme-primary-500 text-theme-neutral-100 dark:text-neutral-100 font-medium px-3 md:px-4 2xl:py-[6px] py-[3px] rounded-md transition-colors whitespace-nowrap flex items-center gap-1 outline-none">
                                                <Wallet2 className="2xl:h-4 2xl:w-4 h-3 w-3 mr-1" />
                                                <span className="2xl:text-sm text-xs hidden md:inline">{truncateString(walletInfor?.solana_address, 12)}</span>
                                                <ChevronDown size={14} className="ml-1" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
                                            <DropdownMenuItem
                                                className="dropdown-item cursor-pointer text-gray-700 dark:text-neutral-200"
                                            >
                                                <div className='flex  flex-col gap-2 w-full'>
                                                    <div className='p-3 dark:bg-gray-800 bg-gray-400 rounded-md'>
                                                        {isAuthenticated && walletInfor && (
                                                            <div className='flex flex-col gap-1'>
                                                                <span className='text-white'>{t('totalValue')}</span>
                                                                <span className='text-lg font-semibold text-white'>{formatNumberWithSuffix3(walletInfor.solana_balance_usd)} USD </span>
                                                                <div className='dark:text-[#8B5CF6] text-[#00beeb] font-semibold'><span className='text-sm italic text-white dark:text-text-gray-400'>≈ {walletInfor.solana_balance} </span> SOL</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className='flex items-center gap-2  w-full' onClick={() => {
                                                        navigator.clipboard.writeText(walletInfor?.solana_address);
                                                        toast.success(t('universal_account.deposit_wallet.copy_success'));
                                                    }}>
                                                        <span className="2xl:text-sm text-xs text-yellow-500 italic hidden md:inline">{truncateString(walletInfor?.solana_address, 16)}</span>
                                                        <Copy className="h-3 w-3" />
                                                    </div>
                                                    <div className='flex items-center gap-2 w-full justify-around overflow-hidden'>
                                                        <button onClick={() => router.replace('/universal-account?type=deposit')} className="flex rounded-md dark:bg-gray-700 bg-gray-400 justify-center flex-1 h-full min-h-8 items-center gap-0.5 md:gap-3 hover:bg-theme-primary-500">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17" fill="none">
                                                                <path fill-rule="evenodd" clip-rule="evenodd" d="M11 16H14C14.3978 16 14.7794 15.842 15.0607 15.5607C15.342 15.2794 15.5 14.8978 15.5 14.5V11.5C15.5 11.3674 15.4473 11.2402 15.3536 11.1464C15.2598 11.0527 15.1326 11 15 11C14.8674 11 14.7402 11.0527 14.6464 11.1464C14.5527 11.2402 14.5 11.3674 14.5 11.5V14.5C14.5 14.6326 14.4473 14.7598 14.3536 14.8536C14.2598 14.9473 14.1326 15 14 15H11C10.8674 15 10.7402 15.0527 10.6464 15.1464C10.5527 15.2402 10.5 15.3674 10.5 15.5C10.5 15.6326 10.5527 15.7598 10.6464 15.8536C10.7402 15.9473 10.8674 16 11 16ZM5 15H2C1.86739 15 1.74021 14.9473 1.64645 14.8536C1.55268 14.7598 1.5 14.6326 1.5 14.5V11.5C1.5 11.3674 1.44732 11.2402 1.35355 11.1464C1.25979 11.0527 1.13261 11 1 11C0.867392 11 0.740215 11.0527 0.646447 11.1464C0.552678 11.2402 0.5 11.3674 0.5 11.5V14.5C0.5 14.8978 0.658035 15.2794 0.93934 15.5607C1.22064 15.842 1.60218 16 2 16H5C5.13261 16 5.25979 15.9473 5.35355 15.8536C5.44732 15.7598 5.5 15.6326 5.5 15.5C5.5 15.3674 5.44732 15.2402 5.35355 15.1464C5.25979 15.0527 5.13261 15 5 15ZM7.5 10.5V13.5C7.5 13.6326 7.55268 13.7598 7.64645 13.8536C7.74021 13.9473 7.86739 14 8 14C8.13261 14 8.25979 13.9473 8.35355 13.8536C8.44732 13.7598 8.5 13.6326 8.5 13.5V10.5C8.5 10.3674 8.44732 10.2402 8.35355 10.1464C8.25979 10.0527 8.13261 10 8 10C7.86739 10 7.74021 10.0527 7.64645 10.1464C7.55268 10.2402 7.5 10.3674 7.5 10.5ZM6.5 10.5C6.5 10.3674 6.44732 10.2402 6.35355 10.1464C6.25979 10.0527 6.13261 10 6 10H3C2.86739 10 2.74021 10.0527 2.64645 10.1464C2.55268 10.2402 2.5 10.3674 2.5 10.5V13.5C2.5 13.6326 2.55268 13.7598 2.64645 13.8536C2.74021 13.9473 2.86739 14 3 14H6C6.13261 14 6.25979 13.9473 6.35355 13.8536C6.44732 13.7598 6.5 13.6326 6.5 13.5V10.5ZM13.5 10.5C13.5 10.3674 13.4473 10.2402 13.3536 10.1464C13.2598 10.0527 13.1326 10 13 10H10C9.86739 10 9.74021 10.0527 9.64645 10.1464C9.55268 10.2402 9.5 10.3674 9.5 10.5V13.5C9.5 13.6326 9.55268 13.7598 9.64645 13.8536C9.74021 13.9473 9.86739 14 10 14H13C13.1326 14 13.2598 13.9473 13.3536 13.8536C13.4473 13.7598 13.5 13.6326 13.5 13.5V10.5ZM5.5 11V13H3.5V11H5.5ZM12.5 11V13H10.5V11H12.5ZM7.5 9H8C8.13261 9 8.25979 8.94732 8.35355 8.85355C8.44732 8.75979 8.5 8.63261 8.5 8.5C8.5 8.36739 8.44732 8.24021 8.35355 8.14645C8.25979 8.05268 8.13261 8 8 8H7.5C7.36739 8 7.24021 8.05268 7.14645 8.14645C7.05268 8.24021 7 8.36739 7 8.5C7 8.63261 7.05268 8.75979 7.14645 8.85355C7.24021 8.94732 7.36739 9 7.5 9ZM3 9H5.5C5.63261 9 5.75979 8.94732 5.85355 8.85355C5.94732 8.75979 6 8.63261 6 8.5C6 8.36739 5.94732 8.24021 5.85355 8.14645C5.75979 8.05268 5.63261 8 5.5 8H3C2.86739 8 2.74021 8.05268 2.64645 8.14645C2.55268 8.24021 2.5 8.36739 2.5 8.5C2.5 8.63261 2.55268 8.75979 2.64645 8.85355C2.74021 8.94732 2.86739 9 3 9ZM12 8H12.5V8.5C12.5 8.63261 12.5527 8.75979 12.6464 8.85355C12.7402 8.94732 12.8674 9 13 9C13.1326 9 13.2598 8.94732 13.3536 8.85355C13.4473 8.75979 13.5 8.63261 13.5 8.5V7.5C13.5 7.36739 13.4473 7.24021 13.3536 7.14645C13.2598 7.05268 13.1326 7 13 7H12C11.8674 7 11.7402 7.05268 11.6464 7.14645C11.5527 7.24021 11.5 7.36739 11.5 7.5C11.5 7.63261 11.5527 7.75979 11.6464 7.85355C11.7402 7.94732 11.8674 8 12 8ZM10.5 8.5V6H11C11.1326 6 11.2598 5.94732 11.3536 5.85355C11.4473 5.75979 11.5 5.63261 11.5 5.5C11.5 5.36739 11.4473 5.24021 11.3536 5.14645C11.2598 5.05268 11.1326 5 11 5H10C9.86739 5 9.74021 5.05268 9.64645 5.14645C9.55268 5.24021 9.5 5.36739 9.5 5.5V8.5C9.5 8.63261 9.55268 8.75979 9.64645 8.85355C9.74021 8.94732 9.86739 9 10 9C10.1326 9 10.2598 8.94732 10.3536 8.85355C10.4473 8.75979 10.5 8.63261 10.5 8.5ZM7.5 5.5V6.5C7.5 6.63261 7.55268 6.75979 7.64645 6.85355C7.74021 6.94732 7.86739 7 8 7C8.13261 7 8.25979 6.94732 8.35355 6.85355C8.44732 6.75979 8.5 6.63261 8.5 6.5V5.5C8.5 5.36739 8.44732 5.24021 8.35355 5.14645C8.25979 5.05268 8.13261 5 8 5C7.86739 5 7.74021 5.05268 7.64645 5.14645C7.55268 5.24021 7.5 5.36739 7.5 5.5ZM6.5 3.5C6.5 3.36739 6.44732 3.24021 6.35355 3.14645C6.25979 3.05268 6.13261 3 6 3H3C2.86739 3 2.74021 3.05268 2.64645 3.14645C2.55268 3.24021 2.5 3.36739 2.5 3.5V6.5C2.5 6.63261 2.55268 6.75979 2.64645 6.85355C2.74021 6.94732 2.86739 7 3 7H6C6.13261 7 6.25979 6.94732 6.35355 6.85355C6.44732 6.75979 6.5 6.63261 6.5 6.5V3.5ZM5 1H2C1.60218 1 1.22064 1.15804 0.93934 1.43934C0.658035 1.72064 0.5 2.10218 0.5 2.5V5.5C0.5 5.63261 0.552678 5.75979 0.646447 5.85355C0.740215 5.94732 0.867392 6 1 6C1.13261 6 1.25979 5.94732 1.35355 5.85355C1.44732 5.75979 1.5 5.63261 1.5 5.5V2.5C1.5 2.36739 1.55268 2.24021 1.64645 2.14645C1.74021 2.05268 1.86739 2 2 2H5C5.13261 2 5.25979 1.94732 5.35355 1.85355C5.44732 1.75979 5.5 1.63261 5.5 1.5C5.5 1.36739 5.44732 1.24021 5.35355 1.14645C5.25979 1.05268 5.13261 1 5 1ZM5.5 4V6H3.5V4H5.5ZM11 2H14C14.1326 2 14.2598 2.05268 14.3536 2.14645C14.4473 2.24021 14.5 2.36739 14.5 2.5V5.5C14.5 5.63261 14.5527 5.75979 14.6464 5.85355C14.7402 5.94732 14.8674 6 15 6C15.1326 6 15.2598 5.94732 15.3536 5.85355C15.4473 5.75979 15.5 5.63261 15.5 5.5V2.5C15.5 2.10218 15.342 1.72064 15.0607 1.43934C14.7794 1.15804 14.3978 1 14 1H11C10.8674 1 10.7402 1.05268 10.6464 1.14645C10.5527 1.24021 10.5 1.36739 10.5 1.5C10.5 1.63261 10.5527 1.75979 10.6464 1.85355C10.7402 1.94732 10.8674 2 11 2ZM8 4H12.5V5.5C12.5 5.63261 12.5527 5.75979 12.6464 5.85355C12.7402 5.94732 12.8674 6 13 6C13.1326 6 13.2598 5.94732 13.3536 5.85355C13.4473 5.75979 13.5 5.63261 13.5 5.5V3.5C13.5 3.36739 13.4473 3.24021 13.3536 3.14645C13.2598 3.05268 13.1326 3 13 3H8C7.86739 3 7.74021 3.05268 7.64645 3.14645C7.55268 3.24021 7.5 3.36739 7.5 3.5C7.5 3.63261 7.55268 3.75979 7.64645 3.85355C7.74021 3.94732 7.86739 4 8 4Z" fill="white" />
                                                            </svg>
                                                            <div className="text-center text-white dark:text-theme-neutral-100 text-sm font-medium">
                                                                {t('overview.universalAccount.receive')}
                                                            </div>
                                                        </button>
                                                        <button onClick={() => router.replace('/universal-account?type=withdraw')} className="flex justify-center rounded-md dark:bg-gray-700 bg-gray-400 items-center gap-0.5 md:gap-3 flex-1 h-full min-h-8 hover:bg-theme-primary-500">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17" fill="none">
                                                                <g clip-path="url(#clip0_77_461)">
                                                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M11.4457 5.05429L6.16568 8.72019L0.642998 6.87906C0.257505 6.7503 -0.00220389 6.38862 1.40968e-05 5.98229C0.00226127 5.57596 0.264947 5.2165 0.651928 5.09223L14.7715 0.545205C15.1072 0.437312 15.4755 0.525856 15.7249 0.775176C15.9742 1.0245 16.0627 1.39286 15.9548 1.7285L11.4078 15.8481C11.2835 16.2351 10.9241 16.4978 10.5177 16.5C10.1114 16.5022 9.74972 16.2425 9.62096 15.857L7.77089 10.3076L11.4457 5.05429Z" fill="white" />
                                                                </g>
                                                                <defs>
                                                                    <clipPath id="clip0_77_461">
                                                                        <rect width="16" height="16" fill="white" transform="translate(0 0.5)" />
                                                                    </clipPath>
                                                                </defs>
                                                            </svg>
                                                            <div className="text-center text-white dark:text-theme-neutral-100 text-sm font-medium">
                                                                {t('overview.universalAccount.send')}
                                                            </div>
                                                        </button>
                                                    </div>
                                                </div>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="dropdown-item cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => {
                                                logout();
                                                refetch();
                                            }}>
                                                <LogOut className="mr-2 h-4 w-4" />
                                                <span>{t('header.wallet.logout')}</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </>
                        ) : (
                            <button
                                className="hover:bg-white hover:text-theme-primary-500 bg-theme-primary-500 text-white dark:text-neutral-100 font-medium px-4 md:px-6 py-[6px] rounded-full transition-colors whitespace-nowrap"
                            >
                                {t('header.wallet.connecting')}
                            </button>
                        )}
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden fixed inset-0 z-50 bg-white dark:bg-black">
                        <div className=" h-full bg-[#1c8f52] backdrop-blur-md ">
                            <div className='dark:bg-theme-black-1/2 flex flex-col h-full'>
                                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
                                    <Link href={defaultAddress} className="flex items-center">
                                        <img
                                            src="/bitworld-logo.png"
                                            alt="logo"
                                            className="h-6 md:h-8 block dark:hidden"
                                        />
                                        <img
                                            src="/bitworld-logo.png"
                                            alt="logo"
                                            className="h-6 md:h-8 hidden dark:block"
                                        />
                                    </Link>

                                    <button
                                        className="p-2 rounded-lg "
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <X size={24} className="text-theme-neutral-100"/>
                                    </button>
                                </div>

                                {/* Mobile Navigation */}
                                <nav className="flex flex-col px-4 space-y-3">
                                    {listSidebar.map((item, index) => {
                                        const Icon = item.icon;
                                        const isExternalLink = item.href.startsWith('http');
                                        const Component = isExternalLink ? 'a' : Link;
                                        const props = isExternalLink 
                                            ? { 
                                                href: item.href, 
                                                target: "_blank", 
                                                rel: "noopener noreferrer",
                                                onClick: () => setIsMobileMenuOpen(false),
                                                className: `hover:text-theme-primary-500 text-sm !mt-0 border-b border-white/50  text-theme-neutral-100 md:dark:text-theme-neutral-300 capitalize transition-colors py-2 flex items-center gap-3 ${pathname === item.href ? 'gradient-hover font-semibold' : ''}`
                                              }
                                            : { 
                                                href: item.href,
                                                onClick: () => setIsMobileMenuOpen(false),
                                                className: `hover:text-theme-primary-500 text-sm !mt-0 text-theme-neutral-100 border-b border-white/50  md:dark:text-theme-neutral-300 capitalize transition-colors py-2 flex items-center gap-3 ${pathname === item.href ? 'gradient-hover font-semibold' : ''}`
                                              };
                                        
                                        return (
                                            <Component
                                                key={index}
                                                {...props}
                                            >
                                                <Icon className="h-4 w-4" />
                                                {item.name}
                                            </Component>
                                        );
                                    })}
                                    <Link
                                        href="/universal-account?type=deposit"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="hover:text-theme-primary-500 dark:text-theme-neutral-100 border-b border-white/50  text-theme-neutral-1000 md:dark:text-theme-neutral-300 capitalize transition-colors text-base py-2 flex items-center gap-3"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17" fill="none">
                                            <path fill-rule="evenodd" clip-rule="evenodd" d="M11 16H14C14.3978 16 14.7794 15.842 15.0607 15.5607C15.342 15.2794 15.5 14.8978 15.5 14.5V11.5C15.5 11.3674 15.4473 11.2402 15.3536 11.1464C15.2598 11.0527 15.1326 11 15 11C14.8674 11 14.7402 11.0527 14.6464 11.1464C14.5527 11.2402 14.5 11.3674 14.5 11.5V14.5C14.5 14.6326 14.4473 14.7598 14.3536 14.8536C14.2598 14.9473 14.1326 15 14 15H11C10.8674 15 10.7402 15.0527 10.6464 15.1464C10.5527 15.2402 10.5 15.3674 10.5 15.5C10.5 15.6326 10.5527 15.7598 10.6464 15.8536C10.7402 15.9473 10.8674 16 11 16ZM5 15H2C1.86739 15 1.74021 14.9473 1.64645 14.8536C1.55268 14.7598 1.5 14.6326 1.5 14.5V11.5C1.5 11.3674 1.44732 11.2402 1.35355 11.1464C1.25979 11.0527 1.13261 11 1 11C0.867392 11 0.740215 11.0527 0.646447 11.1464C0.552678 11.2402 0.5 11.3674 0.5 11.5V14.5C0.5 14.8978 0.658035 15.2794 0.93934 15.5607C1.22064 15.842 1.60218 16 2 16H5C5.13261 16 5.25979 15.9473 5.35355 15.8536C5.44732 15.7598 5.5 15.6326 5.5 15.5C5.5 15.3674 5.44732 15.2402 5.35355 15.1464C5.25979 15.0527 5.13261 15 5 15ZM7.5 10.5V13.5C7.5 13.6326 7.55268 13.7598 7.64645 13.8536C7.74021 13.9473 7.86739 14 8 14C8.13261 14 8.25979 13.9473 8.35355 13.8536C8.44732 13.7598 8.5 13.6326 8.5 13.5V10.5C8.5 10.3674 8.44732 10.2402 8.35355 10.1464C8.25979 10.0527 8.13261 10 8 10C7.86739 10 7.74021 10.0527 7.64645 10.1464C7.55268 10.2402 7.5 10.3674 7.5 10.5ZM6.5 10.5C6.5 10.3674 6.44732 10.2402 6.35355 10.1464C6.25979 10.0527 6.13261 10 6 10H3C2.86739 10 2.74021 10.0527 2.64645 10.1464C2.55268 10.2402 2.5 10.3674 2.5 10.5V13.5C2.5 13.6326 2.55268 13.7598 2.64645 13.8536C2.74021 13.9473 2.86739 14 3 14H6C6.13261 14 6.25979 13.9473 6.35355 13.8536C6.44732 13.7598 6.5 13.6326 6.5 13.5V10.5ZM13.5 10.5C13.5 10.3674 13.4473 10.2402 13.3536 10.1464C13.2598 10.0527 13.1326 10 13 10H10C9.86739 10 9.74021 10.0527 9.64645 10.1464C9.55268 10.2402 9.5 10.3674 9.5 10.5V13.5C9.5 13.6326 9.55268 13.7598 9.64645 13.8536C9.74021 13.9473 9.86739 14 10 14H13C13.1326 14 13.2598 13.9473 13.3536 13.8536C13.4473 13.7598 13.5 13.6326 13.5 13.5V10.5ZM5.5 11V13H3.5V11H5.5ZM12.5 11V13H10.5V11H12.5ZM7.5 9H8C8.13261 9 8.25979 8.94732 8.35355 8.85355C8.44732 8.75979 8.5 8.63261 8.5 8.5C8.5 8.36739 8.44732 8.24021 8.35355 8.14645C8.25979 8.05268 8.13261 8 8 8H7.5C7.36739 8 7.24021 8.05268 7.14645 8.14645C7.05268 8.24021 7 8.36739 7 8.5C7 8.63261 7.05268 8.75979 7.14645 8.85355C7.24021 8.94732 7.36739 9 7.5 9ZM3 9H5.5C5.63261 9 5.75979 8.94732 5.85355 8.85355C5.94732 8.75979 6 8.63261 6 8.5C6 8.36739 5.94732 8.24021 5.85355 8.14645C5.75979 8.05268 5.63261 8 5.5 8H3C2.86739 8 2.74021 8.05268 2.64645 8.14645C2.55268 8.24021 2.5 8.36739 2.5 8.5C2.5 8.63261 2.55268 8.75979 2.64645 8.85355C2.74021 8.94732 2.86739 9 3 9ZM12 8H12.5V8.5C12.5 8.63261 12.5527 8.75979 12.6464 8.85355C12.7402 8.94732 12.8674 9 13 9C13.1326 9 13.2598 8.94732 13.3536 8.85355C13.4473 8.75979 13.5 8.63261 13.5 8.5V7.5C13.5 7.36739 13.4473 7.24021 13.3536 7.14645C13.2598 7.05268 13.1326 7 13 7H12C11.8674 7 11.7402 7.05268 11.6464 7.14645C11.5527 7.24021 11.5 7.36739 11.5 7.5C11.5 7.63261 11.5527 7.75979 11.6464 7.85355C11.7402 7.94732 11.8674 8 12 8ZM10.5 8.5V6H11C11.1326 6 11.2598 5.94732 11.3536 5.85355C11.4473 5.75979 11.5 5.63261 11.5 5.5C11.5 5.36739 11.4473 5.24021 11.3536 5.14645C11.2598 5.05268 11.1326 5 11 5H10C9.86739 5 9.74021 5.05268 9.64645 5.14645C9.55268 5.24021 9.5 5.36739 9.5 5.5V8.5C9.5 8.63261 9.55268 8.75979 9.64645 8.85355C9.74021 8.94732 9.86739 9 10 9C10.1326 9 10.2598 8.94732 10.3536 8.85355C10.4473 8.75979 10.5 8.63261 10.5 8.5ZM7.5 5.5V6.5C7.5 6.63261 7.55268 6.75979 7.64645 6.85355C7.74021 6.94732 7.86739 7 8 7C8.13261 7 8.25979 6.94732 8.35355 6.85355C8.44732 6.75979 8.5 6.63261 8.5 6.5V5.5C8.5 5.36739 8.44732 5.24021 8.35355 5.14645C8.25979 5.05268 8.13261 5 8 5C7.86739 5 7.74021 5.05268 7.64645 5.14645C7.55268 5.24021 7.5 5.36739 7.5 5.5ZM6.5 3.5C6.5 3.36739 6.44732 3.24021 6.35355 3.14645C6.25979 3.05268 6.13261 3 6 3H3C2.86739 3 2.74021 3.05268 2.64645 3.14645C2.55268 3.24021 2.5 3.36739 2.5 3.5V6.5C2.5 6.63261 2.55268 6.75979 2.64645 6.85355C2.74021 6.94732 2.86739 7 3 7H6C6.13261 7 6.25979 6.94732 6.35355 6.85355C6.44732 6.75979 6.5 6.63261 6.5 6.5V3.5ZM5 1H2C1.60218 1 1.22064 1.15804 0.93934 1.43934C0.658035 1.72064 0.5 2.10218 0.5 2.5V5.5C0.5 5.63261 0.552678 5.75979 0.646447 5.85355C0.740215 5.94732 0.867392 6 1 6C1.13261 6 1.25979 5.94732 1.35355 5.85355C1.44732 5.75979 1.5 5.63261 1.5 5.5V2.5C1.5 2.36739 1.55268 2.24021 1.64645 2.14645C1.74021 2.05268 1.86739 2 2 2H5C5.13261 2 5.25979 1.94732 5.35355 1.85355C5.44732 1.75979 5.5 1.63261 5.5 1.5C5.5 1.36739 5.44732 1.24021 5.35355 1.14645C5.25979 1.05268 5.13261 1 5 1ZM5.5 4V6H3.5V4H5.5ZM11 2H14C14.1326 2 14.2598 2.05268 14.3536 2.14645C14.4473 2.24021 14.5 2.36739 14.5 2.5V5.5C14.5 5.63261 14.5527 5.75979 14.6464 5.85355C14.7402 5.94732 14.8674 6 15 6C15.1326 6 15.2598 5.94732 15.3536 5.85355C15.4473 5.75979 15.5 5.63261 15.5 5.5V2.5C15.5 2.10218 15.342 1.72064 15.0607 1.43934C14.7794 1.15804 14.3978 1 14 1H11C10.8674 1 10.7402 1.05268 10.6464 1.14645C10.5527 1.24021 10.5 1.36739 10.5 1.5C10.5 1.63261 10.5527 1.75979 10.6464 1.85355C10.7402 1.94732 10.8674 2 11 2ZM8 4H12.5V5.5C12.5 5.63261 12.5527 5.75979 12.6464 5.85355C12.7402 5.94732 12.8674 6 13 6C13.1326 6 13.2598 5.94732 13.3536 5.85355C13.4473 5.75979 13.5 5.63261 13.5 5.5V3.5C13.5 3.36739 13.4473 3.24021 13.3536 3.14645C13.2598 3.05268 13.1326 3 13 3H8C7.86739 3 7.74021 3.05268 7.64645 3.14645C7.55268 3.24021 7.5 3.36739 7.5 3.5C7.5 3.63261 7.55268 3.75979 7.64645 3.85355C7.74021 3.94732 7.86739 4 8 4Z" fill="white" />
                                        </svg>
                                        <div className="text-center text-theme-neutral-100 text-lg font-medium">
                                            {t('overview.universalAccount.receive')}
                                        </div>
                                    </Link>
                                    <Link
                                        href="/universal-account?type=withdraw"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="hover:text-theme-primary-500 dark:text-theme-neutral-100 border-b border-white/50  text-theme-neutral-800 md:dark:text-theme-neutral-300 capitalize transition-colors text-base py-2 flex items-center gap-3"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17" fill="none">
                                            <g clip-path="url(#clip0_77_461)">
                                                <path fill-rule="evenodd" clip-rule="evenodd" d="M11.4457 5.05429L6.16568 8.72019L0.642998 6.87906C0.257505 6.7503 -0.00220389 6.38862 1.40968e-05 5.98229C0.00226127 5.57596 0.264947 5.2165 0.651928 5.09223L14.7715 0.545205C15.1072 0.437312 15.4755 0.525856 15.7249 0.775176C15.9742 1.0245 16.0627 1.39286 15.9548 1.7285L11.4078 15.8481C11.2835 16.2351 10.9241 16.4978 10.5177 16.5C10.1114 16.5022 9.74972 16.2425 9.62096 15.857L7.77089 10.3076L11.4457 5.05429Z" fill="white" />
                                            </g>
                                            <defs>
                                                <clipPath id="clip0_77_461">
                                                    <rect width="16" height="16" fill="white" transform="translate(0 0.5)" />
                                                </clipPath>
                                            </defs>
                                        </svg>
                                        <div className="text-center text-theme-neutral-100 text-lg font-medium">
                                            {t('overview.universalAccount.send')}
                                        </div>
                                    </Link>
                                </nav>
                                <LangToggle className='!bg-transparent border-none !px-5' showArrow={true} onLanguageChange={() => setIsMobileMenuOpen(false)} />

                                {/* Mobile Actions */}
                                <div className="p-4 space-y-4">
                                    <div className='flex items-center justify-evenly gap-4 mt-1 bg-theme-primary-500/40 rounded-md p-2'>
                                        <Moon
                                            className="cursor-pointer transition-colors "
                                            onClick={() => isDark === "light" && setTheme("dark")}
                                            style={isDark === "dark" ? { color: "#fff" } : { color: "#bbc1cd" }}
                                        />
                                        <Sun
                                            className="cursor-pointer transition-colors"
                                            onClick={() => isDark === "dark" && setTheme("light")}
                                            style={isDark === "light" ? { color: "#f59e0b" } : { color: "#bbc1cd" }}
                                        />
                                    </div>
                                    {isAuthenticated && walletInfor && (
                                        <div className="flex flex-col space-y-2">
                                            <button className='text-sm bg-theme-primary-500 text-theme-neutral-100 dark:text-neutral-100 font-medium px-3 md:px-4 py-[6px] rounded-md transition-colors whitespace-nowrap'>
                                                {walletInfor.solana_balance} SOL &ensp; {'$' + formatNumberWithSuffix3(walletInfor.solana_balance_usd)}
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-end">
                                        {mounted && (
                                            <>
                                                {!isAuthenticated && !phantomConnected ? (
                                                    <button
                                                        onClick={() => {
                                                            router.push('/connect?tab=login');
                                                            setIsMobileMenuOpen(false);
                                                        }}
                                                        className="linear-gradient-light bg-theme-primary-500 text-black font-medium px-6 py-2 rounded-md transition-colors"
                                                    >
                                                        {t('connect')}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            logout();
                                                            setIsMobileMenuOpen(false);
                                                            refetch();
                                                        }}
                                                        className="text-sm bg-theme-primary-500 text-theme-neutral-100 dark:text-neutral-100 font-medium px-3 md:px-4 py-[6px] rounded-md transition-colors whitespace-nowrap"
                                                    >
                                                        {t('header.wallet.logout')}
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </header>
            <ModalSignin isOpen={isSigninModalOpen} onClose={() => setIsSigninModalOpen(false)} />
        </>
    )
}

export default Header
