"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "@/libs/fontawesome";
import { LangProvider } from "@/lang/LangProvider";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { usePathname, useRouter } from "next/navigation";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Toaster } from 'react-hot-toast';
import ThemedBackground from "@/components/ThemedBackground";

// Danh sách các trang login không hiển thị Header
const LOGIN_ROUTES = ['/connect', '/login-email'];

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  useAnalytics();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnMount: true,
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes
            refetchOnWindowFocus: false,
          },
        },
      })
  );
  
  // Kiểm tra xem có phải trang login không
  const isLoginRoute = LOGIN_ROUTES.includes(pathname);
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/connect');
    }
  }, [isAuthenticated, pathname, router]);

  return (
    <QueryClientProvider client={queryClient}>
      <LangProvider>
        <ThemeProvider>
          <ThemedBackground>
            {!isLoginRoute && <Header />}
            <main className="bg-transparent overflow-x-hidden flex-1 lg:pb-0 pb-20 flex flex-col">
              {children}
            </main>
            {!isLoginRoute && <Footer />}
          </ThemedBackground>
          
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
                zIndex: 9999,
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
                style: {
                  background: '#10b981',
                  color: '#fff',
                  borderRadius: '8px',
                  
                  zIndex: 9999,
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
                style: {
                  background: '#ef4444',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '4px',
                  zIndex: 9999,
                },
              },
            }}
          />
        </ThemeProvider>
      </LangProvider>
    </QueryClientProvider>
  );
} 