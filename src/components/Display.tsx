"use client"
import * as React from 'react';
import { useLang } from '@/lang/useLang';
import { langConfig } from '@/lang';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/ui/dropdown-menu';
import { Button } from '@/ui/button';
import { ChevronDown } from 'lucide-react';
import { useTheme } from "next-themes"
import { useState, useEffect } from 'react';

export default function Display() {
    const { lang, setLang, t } = useLang();
    const { theme, resolvedTheme } = useTheme();
    const [isDark, setIsDark] = useState(false); // Default to light (dark mode code kept for future use)
    const [mounted, setMounted] = useState(false);
    const currentLang = langConfig.listLangs.find(l => l.code === lang);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        // Force light mode - dark mode code kept for future use
        // const dark = resolvedTheme === 'dark' || (resolvedTheme === undefined && theme === 'dark');
        setIsDark(false);
    }, [theme, resolvedTheme]);

    const handleLanguageChange = (code: string) => {
        setLang(code as any);
    };

    return (
        <div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-max relative group xl:px-3 px-2 flex items-center gap-2 transition-all duration-300 rounded-lg"
                        style={{
                            color: mounted && isDark ? '#e5e7eb' : '#374151',
                        }}
                    >
                        {/* Hover background effect */}
                        <span 
                            className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            style={{
                                background: mounted && isDark
                                    ? 'rgba(31, 193, 107, 0.1)'
                                    : 'rgba(31, 193, 107, 0.08)',
                            }}
                        />
                        {currentLang && (
                            <>
                                <img 
                                    src={currentLang.flag} 
                                    alt={t(currentLang.translationKey)} 
                                    className="xl:w-6 w-5 xl:h-5 h-4 relative z-10" 
                                />
                                {/* <span className="relative z-10 text-xs sm:text-sm font-medium hidden sm:inline">
                                    {t(currentLang.translationKey)}
                                </span> */}
                                <ChevronDown className="xl:h-4 h-3 xl:w-4 w-3 relative z-10" />
                            </>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                    className='w-max max-w-[200px] xl:px-3 px-2 py-3 rounded-lg backdrop-blur-xl transition-all duration-300 border' 
                    align="end" 
                    style={{ 
                        width: '200px',
                        background: mounted && isDark
                            ? 'rgba(0, 0, 0, 0.5)'
                            : 'rgba(249, 250, 251, 0.9)',
                        borderColor: mounted && isDark
                            ? 'rgba(31, 193, 107, 0.25)'
                            : 'rgba(31, 193, 107, 0.2)',
                        boxShadow: mounted && isDark
                            ? '0 8px 32px 0 rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(31, 193, 107, 0.15) inset'
                            : '0 8px 32px 0 rgba(31, 193, 107, 0.15), 0 0 0 1px rgba(31, 193, 107, 0.08) inset',
                    }}
                >
                    {/* Gradient overlay */}
                    <div 
                        className="absolute inset-0 rounded-lg pointer-events-none opacity-30"
                        style={{
                            background: mounted && isDark
                                ? 'linear-gradient(90deg, transparent 0%, rgba(31, 193, 107, 0.1) 50%, transparent 100%)'
                                : 'linear-gradient(90deg, transparent 0%, rgba(31, 193, 107, 0.08) 50%, transparent 100%)',
                        }}
                    />
                    
                    <div className="flex flex-col gap-1 overflow-x-hidden relative z-10">
                        {langConfig.listLangs.map((language) => {
                            const isActive = lang === language.code;
                            return (
                                <DropdownMenuItem 
                                    key={language.id} 
                                    onClick={() => handleLanguageChange(language.code)} 
                                    className="group relative flex items-center gap-2 cursor-pointer xl:min-h-[44px] min-h-[36px] rounded-lg transition-all duration-300 px-3" 
                                    style={{ 
                                        color: mounted && isDark ? '#e5e7eb' : '#374151',
                                        background: isActive
                                            ? mounted && isDark
                                                ? 'rgba(31, 193, 107, 0.15)'
                                                : 'rgba(31, 193, 107, 0.1)'
                                            : 'transparent',
                                    }}
                                >
                                    {/* Hover background effect */}
                                    {!isActive && (
                                        <span 
                                            className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                            style={{
                                                background: mounted && isDark
                                                    ? 'rgba(31, 193, 107, 0.1)'
                                                    : 'rgba(31, 193, 107, 0.08)',
                                            }}
                                        />
                                    )}
                                    {/* Active indicator */}
                                    {isActive && (
                                        <span 
                                            className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-3/4 rounded-r-full"
                                            style={{
                                                background: 'rgba(31, 193, 107, 0.8)',
                                            }}
                                        />
                                    )}
                                    <img 
                                        src={language.flag} 
                                        alt={t(language.translationKey)} 
                                        className="w-7 h-5 rounded relative z-10" 
                                    />
                                    <span className="relative z-10 font-medium">{t(language.translationKey)}</span>
                                </DropdownMenuItem>
                            );
                        })}
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
