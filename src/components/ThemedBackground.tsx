"use client";

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

// Component for background that uses theme hook (must be inside ThemeProvider)
export default function ThemedBackground({ children }: { children: React.ReactNode }) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false); // Default to light (dark mode code kept for future use)

  // Prevent hydration mismatch - wait for theme to be resolved
  useEffect(() => {
    setMounted(true);
  }, []);

  // Force light mode - dark mode code kept for future use
  useEffect(() => {
    // After hydration, force light mode
    // const dark = resolvedTheme === 'dark' || (resolvedTheme === undefined && theme === 'dark');
    setIsDark(false);
  }, [mounted, resolvedTheme, theme]);

  const cornerGlowOpacity = isDark ? '0.4' : '0.2';

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col">
      {/* Futuristic Dark Gradient Background */}
      <div 
        className="fixed inset-0 -z-10 transition-all duration-500"
        style={{
          background: isDark
            ? `radial-gradient(ellipse at center, rgba(31, 193, 107, 0.15) 0%, rgba(31, 193, 107, 0.05) 30%, #000000 70%)`
            : `radial-gradient(ellipse at center, rgba(31, 193, 107, 0.08) 0%, rgba(31, 193, 107, 0.02) 30%, #f8fafc 70%)`,
        }}
      />
      
      {/* Additional Gradient Layers for Depth */}
      <div 
        className="fixed inset-0 -z-10 transition-all duration-500"
        style={{
          background: isDark
            ? `linear-gradient(135deg, rgba(31, 193, 107, 0.08) 0%, transparent 50%, rgba(31, 193, 107, 0.05) 100%)`
            : `linear-gradient(135deg, rgba(31, 193, 107, 0.04) 0%, transparent 50%, rgba(31, 193, 107, 0.02) 100%)`,
        }}
      />
      
      {/* Vignette Glow Effects */}
      <div 
        className="fixed inset-0 -z-10 pointer-events-none transition-all duration-500"
        style={{
          background: isDark
            ? `radial-gradient(ellipse 80% 50% at 50% 0%, rgba(31, 193, 107, 0.2) 0%, transparent 50%),
               radial-gradient(ellipse 80% 50% at 50% 100%, rgba(31, 193, 107, 0.15) 0%, transparent 50%),
               radial-gradient(ellipse 50% 80% at 0% 50%, rgba(31, 193, 107, 0.1) 0%, transparent 50%),
               radial-gradient(ellipse 50% 80% at 100% 50%, rgba(31, 193, 107, 0.1) 0%, transparent 50%)`
            : `radial-gradient(ellipse 80% 50% at 50% 0%, rgba(31, 193, 107, 0.15) 0%, transparent 50%),
               radial-gradient(ellipse 80% 50% at 50% 100%, rgba(31, 193, 107, 0.1) 0%, transparent 50%),
               radial-gradient(ellipse 50% 80% at 0% 50%, rgba(31, 193, 107, 0.08) 0%, transparent 50%),
               radial-gradient(ellipse 50% 80% at 100% 50%, rgba(31, 193, 107, 0.08) 0%, transparent 50%)`,
        }}
      />
      
      {/* Corner Glow Effects */}
      <div 
        className="fixed top-0 left-0 w-[600px] h-[600px] -z-10 pointer-events-none blur-3xl opacity-30 transition-all duration-500"
        style={{
          background: `radial-gradient(circle, rgba(31, 193, 107, ${cornerGlowOpacity}) 0%, transparent 70%)`,
          transform: "translate(-30%, -30%)",
        } as React.CSSProperties}
      />
      <div 
        className="fixed top-0 right-0 w-[600px] h-[600px] -z-10 pointer-events-none blur-3xl opacity-30 transition-all duration-500"
        style={{
          background: `radial-gradient(circle, rgba(31, 193, 107, ${cornerGlowOpacity}) 0%, transparent 70%)`,
          transform: "translate(30%, -30%)",
        } as React.CSSProperties}
      />
      <div 
        className="fixed bottom-0 left-0 w-[600px] h-[600px] -z-10 pointer-events-none blur-3xl opacity-30 transition-all duration-500"
        style={{
          background: `radial-gradient(circle, rgba(31, 193, 107, ${cornerGlowOpacity}) 0%, transparent 70%)`,
          transform: "translate(-30%, 30%)",
        } as React.CSSProperties}
      />
      <div 
        className="fixed bottom-0 right-0 w-[600px] h-[600px] -z-10 pointer-events-none blur-3xl opacity-30 transition-all duration-500"
        style={{
          background: `radial-gradient(circle, rgba(31, 193, 107, ${cornerGlowOpacity}) 0%, transparent 70%)`,
          transform: "translate(30%, 30%)",
        } as React.CSSProperties}
      />

      {/* Content */}
      <div className="relative z-0 flex flex-col flex-1">
        {children}
      </div>
    </div>
  );
}
