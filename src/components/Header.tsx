'use client';

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link';
import { ChevronDown, LogOut, Search, Wallet2, Menu, X, LayoutDashboard, Coins, LineChart, Wallet as WalletIcon, Moon, Sun, EyeOff, ShieldCheck, FileCheck, LinkIcon, Shield, Store, Copy, Divide, ArrowDownToLine, ArrowUpFromLine, Link2, Twitter } from 'lucide-react';
import { useLang } from '@/lang/useLang';
import Display from '@/components/Display';
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
import { formatNumberWithSuffix3, truncateString, formatSolBalance } from '@/utils/format';
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
    const [isMobile, setIsMobile] = useState(false);
    const [isSigninModalOpen, setIsSigninModalOpen] = useState(false);
    const { theme, resolvedTheme, setTheme } = useTheme();
    const [isDark, setIsDark] = useState(false); // Default to light (dark mode code kept for future use)
    const [mountedTheme, setMountedTheme] = useState(false);
    const [phantomConnected, setPhantomConnected] = useState(false);
    const [phantomPublicKey, setPhantomPublicKey] = useState<string | null>(null);
    const [headerHeight, setHeaderHeight] = useState(0);
    const headerRef = React.useRef<HTMLElement>(null);

    useEffect(() => {
        setMountedTheme(true);
    }, []);

    useEffect(() => {
        // Force light mode - dark mode code kept for future use
        // const dark = resolvedTheme === 'dark' || (resolvedTheme === undefined && theme === 'dark');
        setIsDark(false);
    }, [theme, resolvedTheme]);

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
    
    const { data: balanceInfo, refetch: refetchBalanceInfo } = useQuery({
        queryKey: ["balance-info"],
        queryFn: getBalanceInfo,
        refetchInterval: 30000,
        staleTime: 30000,
        enabled: isAuthenticated,
    });

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
        }
    }, [mounted]);

    useEffect(() => {
        if (!isSearchModalOpen) {
            setSearchQuery("");
        }
    }, [isSearchModalOpen]);

    // Update header height when it changes
    useEffect(() => {
        if (!mounted || !headerRef.current) return;

        const updateHeaderHeight = () => {
            if (headerRef.current) {
                setHeaderHeight(headerRef.current.offsetHeight);
            }
        };

        updateHeaderHeight();
        window.addEventListener('resize', updateHeaderHeight);
        
        // Use ResizeObserver to detect height changes
        const resizeObserver = new ResizeObserver(() => {
            updateHeaderHeight();
        });

        if (headerRef.current) {
            resizeObserver.observe(headerRef.current);
        }

        return () => {
            window.removeEventListener('resize', updateHeaderHeight);
            resizeObserver.disconnect();
        };
    }, [mounted]);


    const defaultAddress = '/pools';

    const listSidebar = [
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
            <header 
                ref={headerRef}
                className="backdrop-blur-xl transition-all duration-300 rounded-lg sm:rounded-xl md:rounded-2xl fixed top-2 sm:top-2 md:top-4 left-2 sm:left-4 md:left-6 lg:left-8 2xl:left-12 right-2 sm:right-4 md:right-6 lg:right-8 2xl:right-12 z-[1000]"
                style={{ 
                    background: mountedTheme && isDark
                        ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.4) 100%)'
                        : 'linear-gradient(135deg, rgba(249, 250, 251, 0.95) 0%, rgba(243, 244, 246, 0.9) 100%)',
                    boxShadow: mountedTheme && isDark
                        ? '0 25px 80px -10px rgba(0, 0, 0, 0.7), 0 10px 40px -5px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(107, 114, 128, 0.15) inset, 0 8px 32px -8px rgba(107, 114, 128, 0.2)'
                        : '0 10px 40px -8px rgba(0, 0, 0, 0.15), 0 4px 20px -4px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(229, 231, 235, 0.6) inset, 0 2px 12px -2px rgba(0, 0, 0, 0.08)',
                }}
            >
                {/* Gradient overlay for extra glassmorphism effect */}
                <div 
                    className="absolute inset-0 pointer-events-none opacity-30"
                    style={{
                        background: mountedTheme && isDark
                            ? 'linear-gradient(90deg, transparent 0%, rgba(31, 193, 107, 0.1) 50%, transparent 100%)'
                            : 'linear-gradient(90deg, transparent 0%, rgba(31, 193, 107, 0.08) 50%, transparent 100%)',
                    }}
                />
                <div className='flex items-center justify-between px-3 sm:px-4 md:px-6 2xl:px-12 py-2 sm:py-2.5 md:py-4 2xl:py-5 relative z-10'>
                    {/* Left section: Logo */}
                    <div className='flex items-center flex-shrink-0'>
                        <Link href={defaultAddress} className="flex items-center">
                            <img
                                src="/bitworld-logo-light.png"
                                alt="logo"
                                className="h-6 sm:h-7 md:h-8 xl:h-9 block dark:hidden"
                            />
                            <img
                                src="/bitworld-logo.png"
                                alt="logo"
                                className="h-6 sm:h-7 md:h-8 xl:h-9 hidden dark:block"
                            />
                        </Link>
                    </div>

                    {/* Center section: Navigation - Hidden on tablet/mobile */}
                    <div className='hidden lg:flex items-center justify-center flex-1 min-w-0 mx-4 lg:mx-8'>
                        <nav className='flex items-center gap-2 xl:gap-3 flex-wrap justify-center'>
                            {listSidebar.map((item, index) => {
                                const isExternalLink = item.href.startsWith('http');
                                const isActive = pathname === item.href;
                                const Component = isExternalLink ? 'a' : Link;
                                const props = isExternalLink 
                                    ? { 
                                        href: item.href, 
                                        target: "_blank", 
                                        rel: "noopener noreferrer",
                                        className: `group relative px-4 py-2 rounded-lg text-sm md:text-base 2xl:text-base capitalize transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
                                            isActive 
                                                ? 'text-theme-primary-500 font-semibold' 
                                                : mountedTheme && isDark
                                                    ? 'text-gray-300 hover:text-white'
                                                    : 'text-slate-600 hover:text-slate-800'
                                        }`
                                      }
                                    : { 
                                        href: item.href,
                                        className: `group relative px-4 py-2 rounded-lg text-sm md:text-base 2xl:text-base capitalize transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
                                            isActive 
                                                ? 'text-theme-primary-500 font-semibold' 
                                                : mountedTheme && isDark
                                                    ? 'text-gray-300 hover:text-white'
                                                    : 'text-slate-600 hover:text-slate-800'
                                        }`
                                      };
                                
                                return (
                                    <Component
                                        key={index}
                                        {...props}
                                    >
                                        {/* Hover background effect - only show when not active */}
                                        {!isActive && (
                                            <span 
                                                className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                                style={{
                                                    background: mountedTheme && isDark
                                                        ? 'rgba(31, 193, 107, 0.1)'
                                                        : 'rgba(31, 193, 107, 0.06)',
                                                }}
                                            />
                                        )}
                                        {/* Active indicator - bottom liner */}
                                        {isActive && (
                                            <span 
                                                className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 rounded-full"
                                                style={{
                                                    background: 'linear-gradient(90deg, transparent, rgba(31, 193, 107, 0.8), transparent)',
                                                }}
                                            />
                                        )}
                                        <span className="relative z-10">{item.name}</span>
                                    </Component>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Right section: Buttons */}
                    <div className='flex items-center gap-1.5 sm:gap-2 md:gap-3 2xl:gap-6 flex-shrink-0 justify-end'>
                        <SearchModal
                            isOpen={isSearchModalOpen}
                            onClose={() => {
                                setIsSearchModalOpen(false);
                            }}
                            searchQuery={searchQuery}
                        />

                        <div className='flex items-center gap-1.5 sm:gap-2 md:gap-3 2xl:gap-6'>
                        {isAuthenticated && walletInfor && (
                            <button 
                                className='relative backdrop-blur-sm text-[10px] sm:text-xs font-medium px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 rounded-full transition-all duration-300 whitespace-nowrap flex items-center gap-1 sm:gap-1.5 overflow-hidden group text-theme-neutral-400 dark:text-neutral-100'
                                style={{
                                    background: mountedTheme && isDark
                                        ? 'linear-gradient(135deg, rgba(31, 193, 107, 0.2) 0%, rgba(31, 193, 107, 0.15) 100%)'
                                        : 'linear-gradient(135deg, rgba(31, 193, 107, 0.25) 0%, rgba(31, 193, 107, 0.2) 100%)',
                                    border: mountedTheme && isDark
                                        ? '1px solid rgba(31, 193, 107, 0.3)'
                                        : '1px solid rgba(31, 193, 107, 0.25)',
                                    boxShadow: mountedTheme && isDark
                                        ? '0 4px 12px -4px rgba(31, 193, 107, 0.2), 0 0 0 1px rgba(31, 193, 107, 0.1) inset'
                                        : '0 4px 12px -4px rgba(31, 193, 107, 0.25), 0 0 0 1px rgba(31, 193, 107, 0.15) inset',
                                }}
                            >
                                <span 
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                    style={{
                                        background: mountedTheme && isDark
                                            ? 'linear-gradient(135deg, rgba(31, 193, 107, 0.3) 0%, rgba(31, 193, 107, 0.25) 100%)'
                                            : 'linear-gradient(135deg, rgba(31, 193, 107, 0.35) 0%, rgba(31, 193, 107, 0.3) 100%)',
                                    }}
                                />
                                <span className="relative z-10 hidden sm:inline">{t("myWallet")}</span>
                                <span className="relative z-10 opacity-90">{formatSolBalance(walletInfor.solana_balance)} SOL</span>
                                <span className="relative z-10 opacity-90 hidden md:inline">{'$' + formatNumberWithSuffix3(walletInfor.solana_balance_usd)}</span>
                            </button>
                        )}

                        <Display />

                        {mounted ? (
                            <>
                                {!isAuthenticated && !phantomConnected ? (
                                    <button
                                        onClick={() => router.push('/connect?tab=login')}
                                        className="relative backdrop-blur-sm text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all duration-300 whitespace-nowrap flex items-center gap-1 sm:gap-1.5 overflow-hidden group"
                                        style={{
                                            background: mountedTheme && isDark
                                                ? 'linear-gradient(135deg, rgba(31, 193, 107, 0.2) 0%, rgba(31, 193, 107, 0.15) 100%)'
                                                : 'linear-gradient(135deg, rgba(31, 193, 107, 0.25) 0%, rgba(31, 193, 107, 0.2) 100%)',
                                            border: mountedTheme && isDark
                                                ? '1px solid rgba(31, 193, 107, 0.3)'
                                                : '1px solid rgba(31, 193, 107, 0.25)',
                                            boxShadow: mountedTheme && isDark
                                                ? '0 4px 12px -4px rgba(31, 193, 107, 0.2), 0 0 0 1px rgba(31, 193, 107, 0.1) inset'
                                                : '0 4px 12px -4px rgba(31, 193, 107, 0.25), 0 0 0 1px rgba(31, 193, 107, 0.15) inset',
                                            color: mountedTheme && isDark ? 'white' : '#1f2937',
                                        }}
                                    >
                                        <span 
                                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                            style={{
                                                background: mountedTheme && isDark
                                                    ? 'linear-gradient(135deg, rgba(31, 193, 107, 0.3) 0%, rgba(31, 193, 107, 0.25) 100%)'
                                                    : 'linear-gradient(135deg, rgba(31, 193, 107, 0.35) 0%, rgba(31, 193, 107, 0.3) 100%)',
                                            }}
                                        />
                                        <span className="relative z-10">{t('connect')}</span>
                                    </button>
                                ) : (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button 
                                                className="relative backdrop-blur-sm text-xs sm:text-sm font-medium px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-full transition-all duration-300 whitespace-nowrap flex items-center gap-1 sm:gap-1.5 outline-none overflow-hidden group"
                                                style={{
                                                    background: mountedTheme && isDark
                                                        ? 'linear-gradient(135deg, rgba(31, 193, 107, 0.2) 0%, rgba(31, 193, 107, 0.15) 100%)'
                                                        : 'linear-gradient(135deg, rgba(31, 193, 107, 0.25) 0%, rgba(31, 193, 107, 0.2) 100%)',
                                                    border: mountedTheme && isDark
                                                        ? '1px solid rgba(31, 193, 107, 0.3)'
                                                        : '1px solid rgba(31, 193, 107, 0.25)',
                                                    boxShadow: mountedTheme && isDark
                                                        ? '0 4px 12px -4px rgba(31, 193, 107, 0.2), 0 0 0 1px rgba(31, 193, 107, 0.1) inset'
                                                        : '0 4px 12px -4px rgba(31, 193, 107, 0.25), 0 0 0 1px rgba(31, 193, 107, 0.15) inset',
                                                    color: mountedTheme && isDark ? 'white' : '#1f2937',
                                                }}
                                            >
                                                <span 
                                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                                    style={{
                                                        background: mountedTheme && isDark
                                                            ? 'linear-gradient(135deg, rgba(31, 193, 107, 0.3) 0%, rgba(31, 193, 107, 0.25) 100%)'
                                                            : 'linear-gradient(135deg, rgba(31, 193, 107, 0.35) 0%, rgba(31, 193, 107, 0.3) 100%)',
                                                    }}
                                                />
                                                <Wallet2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 relative z-10" />
                                                <span className="text-[10px] sm:text-xs hidden md:inline relative z-10">{truncateString(walletInfor?.solana_address, 12)}</span>
                                                <ChevronDown size={12} className="sm:w-3.5 sm:h-3.5 relative z-10" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent 
                                            align="end" 
                                            className="w-64 backdrop-blur-xl rounded-xl overflow-hidden p-2"
                                            style={{
                                                background: mountedTheme && isDark
                                                    ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.7) 100%)'
                                                    : 'linear-gradient(135deg, rgba(249, 250, 251, 0.95) 0%, rgba(243, 244, 246, 0.9) 100%)',
                                                border: mountedTheme && isDark
                                                    ? '1px solid rgba(31, 193, 107, 0.2)'
                                                    : '1px solid rgba(31, 193, 107, 0.15)',
                                                boxShadow: mountedTheme && isDark
                                                    ? '0 20px 60px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(31, 193, 107, 0.1) inset, 0 8px 32px -8px rgba(31, 193, 107, 0.2)'
                                                    : '0 20px 60px -12px rgba(31, 193, 107, 0.25), 0 0 0 1px rgba(31, 193, 107, 0.1) inset, 0 8px 32px -8px rgba(31, 193, 107, 0.15)',
                                            }}
                                        >
                                            <DropdownMenuItem
                                                className="dropdown-item cursor-default p-0 focus:bg-transparent"
                                            >
                                                <div className='flex flex-col gap-3 w-full'>
                                                    {/* Balance Info Card */}
                                                    <div 
                                                        className='relative p-4 rounded-lg overflow-hidden backdrop-blur-sm'
                                                        style={{
                                                            background: mountedTheme && isDark
                                                                ? 'linear-gradient(135deg, rgba(31, 193, 107, 0.15) 0%, rgba(31, 193, 107, 0.1) 100%)'
                                                                : 'linear-gradient(135deg, rgba(31, 193, 107, 0.12) 0%, rgba(31, 193, 107, 0.08) 100%)',
                                                            border: mountedTheme && isDark
                                                                ? '1px solid rgba(31, 193, 107, 0.25)'
                                                                : '1px solid rgba(31, 193, 107, 0.3)',
                                                            boxShadow: mountedTheme && isDark
                                                                ? '0 4px 12px -4px rgba(31, 193, 107, 0.15), 0 0 0 1px rgba(31, 193, 107, 0.1) inset'
                                                                : '0 4px 12px -4px rgba(31, 193, 107, 0.15), 0 0 0 1px rgba(31, 193, 107, 0.2) inset',
                                                        }}
                                                    >
                                                        {isAuthenticated && walletInfor && (
                                                            <div className='flex flex-col gap-1.5 relative z-10'>
                                                                <span className={`text-sm ${mountedTheme && isDark ? 'text-gray-300' : 'text-slate-500'}`}>{t('totalValue')}</span>
                                                                <span className={`text-xl font-bold ${mountedTheme && isDark ? 'text-white' : 'text-slate-800'}`}>
                                                                    {formatNumberWithSuffix3(walletInfor.solana_balance_usd)} USD
                                                                </span>
                                                                <div className={`flex items-center gap-1 ${mountedTheme && isDark ? 'text-[#8B5CF6]' : 'text-[#1FB86E]'} font-semibold`}>
                                                                    <span className={`text-sm ${mountedTheme && isDark ? 'text-gray-400' : 'text-slate-600'}`}>≈ {formatSolBalance(walletInfor.solana_balance)}</span>
                                                                    <span className="text-sm">SOL</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Copy Address Section */}
                                                    <div 
                                                        className='flex items-center gap-2 w-full p-2.5 rounded-lg cursor-pointer transition-all duration-300 group'
                                                        onClick={() => {
                                                        navigator.clipboard.writeText(walletInfor?.solana_address);
                                                        toast.success(t('universal_account.deposit_wallet.copy_success'));
                                                        }}
                                                        style={{
                                                            background: mountedTheme && isDark
                                                                ? 'rgba(31, 193, 107, 0.05)'
                                                                : 'rgba(31, 193, 107, 0.06)',
                                                            border: mountedTheme && isDark
                                                                ? '1px solid transparent'
                                                                : '1px solid rgba(31, 193, 107, 0.15)',
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.background = mountedTheme && isDark
                                                                ? 'rgba(31, 193, 107, 0.1)'
                                                                : 'rgba(31, 193, 107, 0.12)';
                                                            e.currentTarget.style.borderColor = mountedTheme && isDark
                                                                ? 'transparent'
                                                                : 'rgba(31, 193, 107, 0.25)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.background = mountedTheme && isDark
                                                                ? 'rgba(31, 193, 107, 0.05)'
                                                                : 'rgba(31, 193, 107, 0.06)';
                                                            e.currentTarget.style.borderColor = mountedTheme && isDark
                                                                ? 'transparent'
                                                                : 'rgba(31, 193, 107, 0.15)';
                                                        }}
                                                    >
                                                        <span className={`text-xs font-mono ${mountedTheme && isDark ? 'text-yellow-400' : 'text-amber-600'}`}>
                                                            {truncateString(walletInfor?.solana_address, 20)}
                                                        </span>
                                                        <Copy className={`h-3.5 w-3.5 ${mountedTheme && isDark ? 'text-gray-400 group-hover:text-theme-primary-500' : 'text-slate-400 group-hover:text-theme-primary-500'} transition-colors`} />
                                                    </div>
                                                    
                                                    {/* Deposit/Withdraw Buttons */}
                                                    <div className='flex items-center gap-2 w-full'>
                                                        <button 
                                                            onClick={() => router.replace('/universal-account?type=deposit')} 
                                                            className="relative flex-1 h-10 rounded-lg overflow-hidden group transition-all duration-300 flex items-center justify-center gap-1.5"
                                                            style={{
                                                                background: mountedTheme && isDark
                                                                    ? 'linear-gradient(135deg, rgba(31, 193, 107, 0.15) 0%, rgba(31, 193, 107, 0.1) 100%)'
                                                                    : 'linear-gradient(135deg, rgba(31, 193, 107, 0.12) 0%, rgba(31, 193, 107, 0.08) 100%)',
                                                                border: mountedTheme && isDark
                                                                    ? '1px solid rgba(31, 193, 107, 0.25)'
                                                                    : '1px solid rgba(31, 193, 107, 0.3)',
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.background = mountedTheme && isDark
                                                                    ? 'linear-gradient(135deg, rgba(31, 193, 107, 0.25) 0%, rgba(31, 193, 107, 0.2) 100%)'
                                                                    : 'linear-gradient(135deg, rgba(31, 193, 107, 0.2) 0%, rgba(31, 193, 107, 0.15) 100%)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.background = mountedTheme && isDark
                                                                    ? 'linear-gradient(135deg, rgba(31, 193, 107, 0.15) 0%, rgba(31, 193, 107, 0.1) 100%)'
                                                                    : 'linear-gradient(135deg, rgba(31, 193, 107, 0.12) 0%, rgba(31, 193, 107, 0.08) 100%)';
                                                            }}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17" fill="none">
                                                                <path fillRule="evenodd" clipRule="evenodd" d="M11 16H14C14.3978 16 14.7794 15.842 15.0607 15.5607C15.342 15.2794 15.5 14.8978 15.5 14.5V11.5C15.5 11.3674 15.4473 11.2402 15.3536 11.1464C15.2598 11.0527 15.1326 11 15 11C14.8674 11 14.7402 11.0527 14.6464 11.1464C14.5527 11.2402 14.5 11.3674 14.5 11.5V14.5C14.5 14.6326 14.4473 14.7598 14.3536 14.8536C14.2598 14.9473 14.1326 15 14 15H11C10.8674 15 10.7402 15.0527 10.6464 15.1464C10.5527 15.2402 10.5 15.3674 10.5 15.5C10.5 15.6326 10.5527 15.7598 10.6464 15.8536C10.7402 15.9473 10.8674 16 11 16ZM5 15H2C1.86739 15 1.74021 14.9473 1.64645 14.8536C1.55268 14.7598 1.5 14.6326 1.5 14.5V11.5C1.5 11.3674 1.44732 11.2402 1.35355 11.1464C1.25979 11.0527 1.13261 11 1 11C0.867392 11 0.740215 11.0527 0.646447 11.1464C0.552678 11.2402 0.5 11.3674 0.5 11.5V14.5C0.5 14.8978 0.658035 15.2794 0.93934 15.5607C1.22064 15.842 1.60218 16 2 16H5C5.13261 16 5.25979 15.9473 5.35355 15.8536C5.44732 15.7598 5.5 15.6326 5.5 15.5C5.5 15.3674 5.44732 15.2402 5.35355 15.1464C5.25979 15.0527 5.13261 15 5 15ZM7.5 10.5V13.5C7.5 13.6326 7.55268 13.7598 7.64645 13.8536C7.74021 13.9473 7.86739 14 8 14C8.13261 14 8.25979 13.9473 8.35355 13.8536C8.44732 13.7598 8.5 13.6326 8.5 13.5V10.5C8.5 10.3674 8.44732 10.2402 8.35355 10.1464C8.25979 10.0527 8.13261 10 8 10C7.86739 10 7.74021 10.0527 7.64645 10.1464C7.55268 10.2402 7.5 10.3674 7.5 10.5ZM6.5 10.5C6.5 10.3674 6.44732 10.2402 6.35355 10.1464C6.25979 10.0527 6.13261 10 6 10H3C2.86739 10 2.74021 10.0527 2.64645 10.1464C2.55268 10.2402 2.5 10.3674 2.5 10.5V13.5C2.5 13.6326 2.55268 13.7598 2.64645 13.8536C2.74021 13.9473 2.86739 14 3 14H6C6.13261 14 6.25979 13.9473 6.35355 13.8536C6.44732 13.7598 6.5 13.6326 6.5 13.5V10.5ZM13.5 10.5C13.5 10.3674 13.4473 10.2402 13.3536 10.1464C13.2598 10.0527 13.1326 10 13 10H10C9.86739 10 9.74021 10.0527 9.64645 10.1464C9.55268 10.2402 9.5 10.3674 9.5 10.5V13.5C9.5 13.6326 9.55268 13.7598 9.64645 13.8536C9.74021 13.9473 9.86739 14 10 14H13C13.1326 14 13.2598 13.9473 13.3536 13.8536C13.4473 13.7598 13.5 13.6326 13.5 13.5V10.5ZM5.5 11V13H3.5V11H5.5ZM12.5 11V13H10.5V11H12.5ZM7.5 9H8C8.13261 9 8.25979 8.94732 8.35355 8.85355C8.44732 8.75979 8.5 8.63261 8.5 8.5C8.5 8.36739 8.44732 8.24021 8.35355 8.14645C8.25979 8.05268 8.13261 8 8 8H7.5C7.36739 8 7.24021 8.05268 7.14645 8.14645C7.05268 8.24021 7 8.36739 7 8.5C7 8.63261 7.05268 8.75979 7.14645 8.85355C7.24021 8.94732 7.36739 9 7.5 9ZM3 9H5.5C5.63261 9 5.75979 8.94732 5.85355 8.85355C5.94732 8.75979 6 8.63261 6 8.5C6 8.36739 5.94732 8.24021 5.85355 8.14645C5.75979 8.05268 5.63261 8 5.5 8H3C2.86739 8 2.74021 8.05268 2.64645 8.14645C2.55268 8.24021 2.5 8.36739 2.5 8.5C2.5 8.63261 2.55268 8.75979 2.64645 8.85355C2.74021 8.94732 2.86739 9 3 9ZM12 8H12.5V8.5C12.5 8.63261 12.5527 8.75979 12.6464 8.85355C12.7402 8.94732 12.8674 9 13 9C13.1326 9 13.2598 8.94732 13.3536 8.85355C13.4473 8.75979 13.5 8.63261 13.5 8.5V7.5C13.5 7.36739 13.4473 7.24021 13.3536 7.14645C13.2598 7.05268 13.1326 7 13 7H12C11.8674 7 11.7402 7.05268 11.6464 7.14645C11.5527 7.24021 11.5 7.36739 11.5 7.5C11.5 7.63261 11.5527 7.75979 11.6464 7.85355C11.7402 7.94732 11.8674 8 12 8ZM10.5 8.5V6H11C11.1326 6 11.2598 5.94732 11.3536 5.85355C11.4473 5.75979 11.5 5.63261 11.5 5.5C11.5 5.36739 11.4473 5.24021 11.3536 5.14645C11.2598 5.05268 11.1326 5 11 5H10C9.86739 5 9.74021 5.05268 9.64645 5.14645C9.55268 5.24021 9.5 5.36739 9.5 5.5V8.5C9.5 8.63261 9.55268 8.75979 9.64645 8.85355C9.74021 8.94732 9.86739 9 10 9C10.1326 9 10.2598 8.94732 10.3536 8.85355C10.4473 8.75979 10.5 8.63261 10.5 8.5ZM7.5 5.5V6.5C7.5 6.63261 7.55268 6.75979 7.64645 6.85355C7.74021 6.94732 7.86739 7 8 7C8.13261 7 8.25979 6.94732 8.35355 6.85355C8.44732 6.75979 8.5 6.63261 8.5 6.5V5.5C8.5 5.36739 8.44732 5.24021 8.35355 5.14645C8.25979 5.05268 8.13261 5 8 5C7.86739 5 7.74021 5.05268 7.64645 5.14645C7.55268 5.24021 7.5 5.36739 7.5 5.5ZM6.5 3.5C6.5 3.36739 6.44732 3.24021 6.35355 3.14645C6.25979 3.05268 6.13261 3 6 3H3C2.86739 3 2.74021 3.05268 2.64645 3.14645C2.55268 3.24021 2.5 3.36739 2.5 3.5V6.5C2.5 6.63261 2.55268 6.75979 2.64645 6.85355C2.74021 6.94732 2.86739 7 3 7H6C6.13261 7 6.25979 6.94732 6.35355 6.85355C6.44732 6.75979 6.5 6.63261 6.5 6.5V3.5ZM5 1H2C1.60218 1 1.22064 1.15804 0.93934 1.43934C0.658035 1.72064 0.5 2.10218 0.5 2.5V5.5C0.5 5.63261 0.552678 5.75979 0.646447 5.85355C0.740215 5.94732 0.867392 6 1 6C1.13261 6 1.25979 5.94732 1.35355 5.85355C1.44732 5.75979 1.5 5.63261 1.5 5.5V2.5C1.5 2.36739 1.55268 2.24021 1.64645 2.14645C1.74021 2.05268 1.86739 2 2 2H5C5.13261 2 5.25979 1.94732 5.35355 1.85355C5.44732 1.75979 5.5 1.63261 5.5 1.5C5.5 1.36739 5.44732 1.24021 5.35355 1.14645C5.25979 1.05268 5.13261 1 5 1ZM5.5 4V6H3.5V4H5.5ZM11 2H14C14.1326 2 14.2598 2.05268 14.3536 2.14645C14.4473 2.24021 14.5 2.36739 14.5 2.5V5.5C14.5 5.63261 14.5527 5.75979 14.6464 5.85355C14.7402 5.94732 14.8674 6 15 6C15.1326 6 15.2598 5.94732 15.3536 5.85355C15.4473 5.75979 15.5 5.63261 15.5 5.5V2.5C15.5 2.10218 15.342 1.72064 15.0607 1.43934C14.7794 1.15804 14.3978 1 14 1H11C10.8674 1 10.7402 1.05268 10.6464 1.14645C10.5527 1.24021 10.5 1.36739 10.5 1.5C10.5 1.63261 10.5527 1.75979 10.6464 1.85355C10.7402 1.94732 10.8674 2 11 2ZM8 4H12.5V5.5C12.5 5.63261 12.5527 5.75979 12.6464 5.85355C12.7402 5.94732 12.8674 6 13 6C13.1326 6 13.2598 5.94732 13.3536 5.85355C13.4473 5.75979 13.5 5.63261 13.5 5.5V3.5C13.5 3.36739 13.4473 3.24021 13.3536 3.14645C13.2598 3.05268 13.1326 3 13 3H8C7.86739 3 7.74021 3.05268 7.64645 3.14645C7.55268 3.24021 7.5 3.36739 7.5 3.5C7.5 3.63261 7.55268 3.75979 7.64645 3.85355C7.74021 3.94732 7.86739 4 8 4Z" fill={mountedTheme && isDark ? "white" : "#1FB86E"} />
                                                            </svg>
                                                            <span 
                                                                className="text-xs font-medium"
                                                                style={{
                                                                    color: mountedTheme && isDark ? 'white' : '#1f2937'
                                                                }}
                                                            >
                                                                {t('overview.universalAccount.receive')}
                                                            </span>
                                                        </button>
                                                        <button 
                                                            onClick={() => router.replace('/universal-account?type=withdraw')} 
                                                            className="relative flex-1 h-10 rounded-lg overflow-hidden group transition-all duration-300 flex items-center justify-center gap-1.5"
                                                            style={{
                                                                background: mountedTheme && isDark
                                                                    ? 'linear-gradient(135deg, rgba(31, 193, 107, 0.15) 0%, rgba(31, 193, 107, 0.1) 100%)'
                                                                    : 'linear-gradient(135deg, rgba(31, 193, 107, 0.12) 0%, rgba(31, 193, 107, 0.08) 100%)',
                                                                border: mountedTheme && isDark
                                                                    ? '1px solid rgba(31, 193, 107, 0.25)'
                                                                    : '1px solid rgba(31, 193, 107, 0.3)',
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.background = mountedTheme && isDark
                                                                    ? 'linear-gradient(135deg, rgba(31, 193, 107, 0.25) 0%, rgba(31, 193, 107, 0.2) 100%)'
                                                                    : 'linear-gradient(135deg, rgba(31, 193, 107, 0.2) 0%, rgba(31, 193, 107, 0.15) 100%)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.background = mountedTheme && isDark
                                                                    ? 'linear-gradient(135deg, rgba(31, 193, 107, 0.15) 0%, rgba(31, 193, 107, 0.1) 100%)'
                                                                    : 'linear-gradient(135deg, rgba(31, 193, 107, 0.12) 0%, rgba(31, 193, 107, 0.08) 100%)';
                                                            }}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17" fill="none">
                                                                <g clipPath="url(#clip0_77_461)">
                                                                    <path fillRule="evenodd" clipRule="evenodd" d="M11.4457 5.05429L6.16568 8.72019L0.642998 6.87906C0.257505 6.7503 -0.00220389 6.38862 1.40968e-05 5.98229C0.00226127 5.57596 0.264947 5.2165 0.651928 5.09223L14.7715 0.545205C15.1072 0.437312 15.4755 0.525856 15.7249 0.775176C15.9742 1.0245 16.0627 1.39286 15.9548 1.7285L11.4078 15.8481C11.2835 16.2351 10.9241 16.4978 10.5177 16.5C10.1114 16.5022 9.74972 16.2425 9.62096 15.857L7.77089 10.3076L11.4457 5.05429Z" fill={mountedTheme && isDark ? "white" : "#1FB86E"} />
                                                                </g>
                                                                <defs>
                                                                    <clipPath id="clip0_77_461">
                                                                        <rect width="16" height="16" fill="white" transform="translate(0 0.5)" />
                                                                    </clipPath>
                                                                </defs>
                                                            </svg>
                                                            <span 
                                                                className="text-xs font-medium"
                                                                style={{
                                                                    color: mountedTheme && isDark ? 'white' : '#1f2937'
                                                                }}
                                                            >
                                                                {t('overview.universalAccount.send')}
                                                            </span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                                className="cursor-pointer rounded-lg transition-all duration-300 mt-1"
                                                onClick={() => {
                                                logout();
                                                refetch();
                                                }}
                                                style={{
                                                    background: 'transparent',
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = mountedTheme && isDark
                                                        ? 'rgba(239, 68, 68, 0.1)'
                                                        : 'rgba(239, 68, 68, 0.08)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'transparent';
                                                }}
                                            >
                                                <div className="flex items-center gap-2 px-2 py-1.5">
                                                    <LogOut className={`h-4 w-4 ${mountedTheme && isDark ? 'text-red-400' : 'text-red-600'}`} />
                                                    <span className={`text-sm font-medium ${mountedTheme && isDark ? 'text-red-400' : 'text-red-600'}`}>
                                                        {t('header.wallet.logout')}
                                                    </span>
                                                </div>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </>
                        ) : (
                            <button
                                className="relative backdrop-blur-sm text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all duration-300 whitespace-nowrap overflow-hidden group"
                                style={{
                                    background: mountedTheme && isDark
                                        ? 'linear-gradient(135deg, rgba(31, 193, 107, 0.2) 0%, rgba(31, 193, 107, 0.15) 100%)'
                                        : 'linear-gradient(135deg, rgba(31, 193, 107, 0.25) 0%, rgba(31, 193, 107, 0.2) 100%)',
                                    border: mountedTheme && isDark
                                        ? '1px solid rgba(31, 193, 107, 0.3)'
                                        : '1px solid rgba(31, 193, 107, 0.25)',
                                    boxShadow: mountedTheme && isDark
                                        ? '0 4px 12px -4px rgba(31, 193, 107, 0.2), 0 0 0 1px rgba(31, 193, 107, 0.1) inset'
                                        : '0 4px 12px -4px rgba(31, 193, 107, 0.25), 0 0 0 1px rgba(31, 193, 107, 0.15) inset',
                                    color: mountedTheme && isDark ? 'white' : '#1f2937',
                                }}
                            >
                                <span 
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                    style={{
                                        background: mountedTheme && isDark
                                            ? 'linear-gradient(135deg, rgba(31, 193, 107, 0.3) 0%, rgba(31, 193, 107, 0.25) 100%)'
                                            : 'linear-gradient(135deg, rgba(31, 193, 107, 0.35) 0%, rgba(31, 193, 107, 0.3) 100%)',
                                    }}
                                />
                                <span className="relative z-10">{t('header.wallet.connecting')}</span>
                            </button>
                        )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Spacer div below header to create space when scrolling */}
            <div 
            className='bg-transparent'
                style={{ 
                    height: `${headerHeight || 80}px`,
                    minHeight: '80px',
                }}
                aria-hidden="true"
            />

            {/* Bottom Navigation Bar - Tablet and Mobile */}
            <nav className='lg:hidden fixed bottom-0 left-0 right-0 z-[999] backdrop-blur-xl transition-all duration-300'
                style={{ 
                    background: mountedTheme && isDark
                        ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.4) 100%)'
                        : 'linear-gradient(135deg, rgba(249, 250, 251, 0.95) 0%, rgba(243, 244, 246, 0.9) 100%)',
                    boxShadow: mountedTheme && isDark
                        ? '0 -25px 80px -10px rgba(0, 0, 0, 0.7), 0 -10px 40px -5px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(107, 114, 128, 0.15) inset, 0 -8px 32px -8px rgba(107, 114, 128, 0.2)'
                        : '0 -10px 40px -8px rgba(0, 0, 0, 0.15), 0 -4px 20px -4px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(229, 231, 235, 0.6) inset, 0 -2px 12px -2px rgba(0, 0, 0, 0.08)',
                }}
            >
                {/* Gradient overlay */}
                <div 
                    className="absolute inset-0 pointer-events-none opacity-30"
                    style={{
                        background: mountedTheme && isDark
                            ? 'linear-gradient(90deg, transparent 0%, rgba(31, 193, 107, 0.1) 50%, transparent 100%)'
                            : 'linear-gradient(90deg, transparent 0%, rgba(31, 193, 107, 0.08) 50%, transparent 100%)',
                    }}
                />
                <div className='flex items-center justify-around px-2 py-2 relative z-10'>
                                    {listSidebar.filter(item => item.name !== "BITTWORLD TWITTER").map((item, index) => {
                                        const Icon = item.icon;
                                        const isExternalLink = item.href.startsWith('http');
                                        const isActive = pathname === item.href;
                                        const Component = isExternalLink ? 'a' : Link;
                                        const props = isExternalLink 
                                            ? { 
                                                href: item.href, 
                                                target: "_blank", 
                                                rel: "noopener noreferrer",
                                className: `group relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-300 min-w-0 flex-1 ${
                                                    isActive 
                                        ? 'text-theme-primary-500' 
                                        : mountedTheme && isDark
                                            ? 'text-gray-300'
                                            : 'text-slate-600'
                                                }`
                                              }
                                            : { 
                                                href: item.href,
                                className: `group relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-300 min-w-0 flex-1 ${
                                                    isActive 
                                        ? 'text-theme-primary-500' 
                                        : mountedTheme && isDark
                                            ? 'text-gray-300'
                                            : 'text-slate-600'
                                                }`
                                              };
                                        
                                        return (
                                            <Component
                                                key={index}
                                                {...props}
                                            >
                                {/* Hover background effect */}
                                                {!isActive && (
                                                    <span 
                                        className="absolute inset-0 rounded-lg opacity-0 group-active:opacity-100 transition-opacity duration-300"
                                                        style={{
                                            background: mountedTheme && isDark
                                                ? 'rgba(31, 193, 107, 0.1)'
                                                : 'rgba(31, 193, 107, 0.08)',
                                                        }}
                                                    />
                                                )}
                                {/* Active indicator - top liner */}
                                                {isActive && (
                                                    <span 
                                        className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 rounded-full"
                                                        style={{
                                            background: 'linear-gradient(90deg, transparent, rgba(31, 193, 107, 0.8), transparent)',
                                                        }}
                                                    />
                                                )}
                                <Icon className={`h-5 w-5 relative z-10 ${isActive ? 'scale-110' : ''} transition-transform duration-300`} />
                                <span className="relative z-10 text-xs font-medium truncate w-full text-center">{item.name}</span>
                                            </Component>
                                        );
                                    })}
                                        </div>
                                </nav>
            <ModalSignin isOpen={isSigninModalOpen} onClose={() => setIsSigninModalOpen(false)} />
        </>
    )
}

export default Header
