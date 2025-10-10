"use client"

import { Button } from "@/app/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/app/components/ui/dropdown-menu"
import { useLang } from "@/lang/useLang"
import { langConfig } from "@/lang";
import { ChevronDown } from "lucide-react"

export function LangToggle({ className, showArrow = false, onLanguageChange }: { className?: string, showArrow?: boolean, onLanguageChange?: () => void }) {
  const { lang, setLang, t } = useLang();
  const currentLang = langConfig.listLangs.find(l => l.code === lang);
  
  const handleLanguageChange = (code: string) => {
    console.log('Language change triggered:', code);
    setLang(code as any);
    // Close mobile menu if needed
    if (showArrow && onLanguageChange) {
      // Add a small delay to ensure the language change is processed
      setTimeout(() => {
        console.log('Closing mobile menu');
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
          className="w-full dark:bg-transparent bg-gray-100 dark:text-white text-theme-neutral-1000 xl:px-2 xl:max-h-auto h-[40px] px-1 flex justify-start gap-2 touch-manipulation"
          onClick={(e) => {
            console.log('Dropdown trigger clicked');
            e.stopPropagation();
          }}
          onTouchStart={(e) => {
            console.log('Dropdown trigger touch start');
            e.stopPropagation();
          }}
        >
          {currentLang && <img src={currentLang.flag} alt={t(currentLang.translationKey)} className="xl:w-7 w-5 xl:h-5 h-4" />}
          <span>{currentLang && t(currentLang.translationKey)}</span>
          {showArrow && <ChevronDown className="h-6 w-6 ml-auto" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side={showArrow ? "bottom" : "bottom"} className={`${showArrow ? '!bg-[#0e4729] border-t mr-[5%] ml-[-5%] border-neutral-200 dark:border-transparent rounded-md box-shadow-none rounded-t-none !z-[60] md:!max-h-[80vh] !max-h-[50vh] !overflow-y-auto' : ''}`}>
        <div className="flex flex-col pr-2 gap-1 overflow-x-hidden bg-theme-primary-500">
          {langConfig.listLangs.map((language) => (
            <DropdownMenuItem 
              key={language.id} 
              onClick={(e) => {
                e.stopPropagation();
                handleLanguageChange(language.code);
              }} 
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Touch end on language item:', language.code);
                handleLanguageChange(language.code);
              }}
              className="flex dark:text-white text-theme-neutral-1000 items-center gap-2 ml-0 cursor-pointer hover:bg-theme-neutral-100 dark:hover:bg-theme-neutral-900 touch-manipulation xl:min-h-[44px] min-h-[30px]" 
              style={{ width: showArrow ? 'calc(100vw - 40px)' : '140px', marginRight: showArrow ? '0' : '-10px' }}
            >
              <img src={language.flag} alt={t(language.translationKey)} className="w-7 h-5 rounded" />
              <span>{t(language.translationKey)}</span>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
