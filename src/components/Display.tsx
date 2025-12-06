"use client"
import * as React from 'react';
import { LangToggle } from '@/components/LanguageSelect';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from '@/ui/dropdown-menu';
import { Button } from '@/ui/button';
import { Sun, Moon, Settings } from 'lucide-react';
import { useTheme } from "next-themes"
import { useState, useEffect } from 'react';

export default function Display() {
    const { theme, resolvedTheme, setTheme } = useTheme();
    const [isDark, setIsDark] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const dark = resolvedTheme === 'dark' || (resolvedTheme === undefined && theme === 'dark');
        setIsDark(dark);
    }, [theme, resolvedTheme]);

    return (
        <div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-max relative group xl:px-2 px-1 flex items-center gap-2 transition-all duration-300 rounded-lg"
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
                        <Settings className='xl:h-6 h-4 xl:w-6 w-4 relative z-10' />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                    className='w-max max-w-[130px] 2xl:max-w-[200px] xl:px-3 px-2 py-3 rounded-lg backdrop-blur-xl transition-all duration-300 border' 
                    align="end" 
                    style={{ 
                        width: '200px',
                        background: mounted && isDark
                            ? 'rgba(0, 0, 0, 0.5)'
                            : 'rgba(255, 255, 255, 0.8)',
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
                    
                    <div className="relative z-10">
                        <LangToggle className='hover:bg-theme-blue-300 dark:hover:bg-theme-blue-100 bg-theme-neutral-300 rounded-lg transition-all duration-300' />
                        <div className='flex items-center justify-evenly gap-4 xl:mt-3 mt-2 p-2 rounded-lg' 
                            style={{
                                background: mounted && isDark
                                    ? 'rgba(31, 193, 107, 0.05)'
                                    : 'rgba(31, 193, 107, 0.03)',
                            }}
                        >
                        <Moon 
                                className="cursor-pointer transition-all duration-300 xl:w-7 w-5 hover:scale-110" 
                                onClick={() => !isDark && setTheme("dark")} 
                                style={isDark ? { color: "#1FC16B" } : { color: mounted && isDark ? "#9ca3af" : "#6b7280" }}
                        />
                        <Sun 
                                className="cursor-pointer transition-all duration-300 xl:w-7 w-5 hover:scale-110" 
                                onClick={() => isDark && setTheme("light")} 
                                style={!isDark ? { color: "#f59e0b" } : { color: mounted && isDark ? "#9ca3af" : "#6b7280" }}
                        />
                        </div>
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
