"use client"
import { ThemeProvider as NextThemesProvider } from "next-themes"
// import { type ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: any) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      forcedTheme="light"
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
} 
