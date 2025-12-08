"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useLang } from "@/lang/useLang"
import { langConfig } from "@/lang";
import { ChevronDown } from "lucide-react"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"

export function LangToggle({ className, showArrow = false, onLanguageChange }: { className?: string, showArrow?: boolean, onLanguageChange?: () => void }) {
  const { lang, setLang, t } = useLang();
  const { theme, resolvedTheme } = useTheme();
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);
  const currentLang = langConfig.listLangs.find(l => l.code === lang);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const dark = resolvedTheme === 'dark' || (resolvedTheme === undefined && theme === 'dark');
    setIsDark(dark);
  }, [theme, resolvedTheme]);
  
  const handleLanguageChange = (code: string) => {
    setLang(code as any);
    // Close mobile menu if needed
    if (showArrow && onLanguageChange) {
      // Add a small delay to ensure the language change is processed
      setTimeout(() => {
        onLanguageChange();
      }, 50);
    }
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={className} asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="w-full relative group xl:px-2 xl:max-h-auto h-[40px] px-1 flex justify-start gap-2 touch-manipulation rounded-lg transition-all duration-300"
          style={{
            color: mounted && isDark ? '#e5e7eb' : '#374151',
            background: 'transparent',
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
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
          {currentLang && <img src={currentLang.flag} alt={t(currentLang.translationKey)} className="xl:w-7 w-5 xl:h-5 h-4 relative z-10" />}
          <span className="relative z-10">{currentLang && t(currentLang.translationKey)}</span>
          {showArrow && <ChevronDown className="h-6 w-6 ml-auto relative z-10" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        side={showArrow ? "bottom" : "bottom"} 
        className={`backdrop-blur-xl transition-all duration-300 rounded-lg border ${showArrow ? 'rounded-t-none !z-[60] md:!max-h-[80vh] !max-h-[50vh] !overflow-y-auto' : ''}`}
        style={{
          background: mounted && isDark
            ? showArrow ? 'rgba(14, 71, 41, 0.95)' : 'rgba(0, 0, 0, 0.5)'
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
        <div className="flex flex-col pr-2 gap-1 overflow-x-hidden relative z-10">
          {langConfig.listLangs.map((language) => {
            const isActive = lang === language.code;
            return (
            <DropdownMenuItem 
              key={language.id} 
              onClick={(e) => {
                e.stopPropagation();
                handleLanguageChange(language.code);
              }} 
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleLanguageChange(language.code);
              }}
                className="group relative flex items-center gap-2 ml-0 cursor-pointer touch-manipulation xl:min-h-[44px] min-h-[30px] rounded-lg transition-all duration-300 px-3" 
                style={{ 
                  width: showArrow ? 'calc(100vw - 40px)' : '140px', 
                  marginRight: showArrow ? '0' : '-10px',
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
                <img src={language.flag} alt={t(language.translationKey)} className="w-7 h-5 rounded relative z-10" />
                <span className="relative z-10 font-medium">{t(language.translationKey)}</span>
            </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
