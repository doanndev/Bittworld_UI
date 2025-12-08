'use client'
import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-hot-toast';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { useLang } from '@/lang/useLang';
import { useTheme } from 'next-themes';

interface DepositWalletProps {
    walletAddress: string;
}

const DepositWallet: React.FC<DepositWalletProps> = ({ walletAddress }) => {
    const [copied, setCopied] = useState(false);
    const { t } = useLang();
    const { theme, resolvedTheme } = useTheme();
    const [mountedTheme, setMountedTheme] = useState(false);
    const isDark = resolvedTheme === 'dark' || (resolvedTheme === undefined && theme === 'dark');

    useEffect(() => {
        setMountedTheme(true);
    }, []);

    const handleCopyAddress = () => {
        navigator.clipboard.writeText(walletAddress);
        setCopied(true);
        toast.success(t('universal_account.deposit_wallet.copy_success'));
    };
    
    return (
        <div>
            <div 
                className="gap-5 flex flex-col justify-center items-center max-w-[600px] mx-auto p-4 sm:p-6 rounded-xl sm:rounded-2xl backdrop-blur-xl"
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
                {/* Gradient Glow Overlay */}
                {mountedTheme && (
                    <div 
                        className="absolute inset-0 pointer-events-none rounded-xl sm:rounded-2xl opacity-30"
                        style={{
                            background: isDark
                                ? 'linear-gradient(135deg, rgba(31, 193, 107, 0.1) 0%, rgba(31, 193, 107, 0.05) 50%, rgba(31, 193, 107, 0.1) 100%)'
                                : 'linear-gradient(135deg, rgba(31, 193, 107, 0.08) 0%, rgba(31, 193, 107, 0.04) 50%, rgba(31, 193, 107, 0.08) 100%)',
                        }}
                    />
                )}
                <div className="relative z-10 w-full">
                    <h3 className={`text-sm sm:text-base font-bold text-center mt-1 mb-4 ${mountedTheme && isDark ? 'text-white' : 'text-gray-900'}`}>
                        {t('universal_account.deposit_wallet.title')}
                    </h3>

                    {/* QR Code */}
                    <div 
                        className="bg-white p-4 sm:p-6 rounded-xl mx-auto w-fit"
                        style={{
                            boxShadow: mountedTheme && isDark
                                ? '0 4px 16px -4px rgba(0, 0, 0, 0.3)'
                                : '0 4px 16px -4px rgba(0, 0, 0, 0.1)',
                        }}
                    >
                        {walletAddress && (
                            <QRCodeSVG
                                value={walletAddress}
                                size={180}
                                bgColor={"#FFFFFF"}
                                fgColor={"#000000"}
                                level={"L"}
                            />
                        )}
                    </div>

                    {/* Address */}
                    <div 
                        className="relative flex rounded-xl pr-3 pl-4 py-3 mt-4 backdrop-blur-sm"
                        style={{
                            background: mountedTheme && isDark
                                ? 'rgba(0, 0, 0, 0.3)'
                                : 'rgba(255, 255, 255, 0.5)',
                            border: mountedTheme && isDark
                                ? '1px solid rgba(107, 114, 128, 0.2)'
                                : '1px solid rgba(156, 163, 175, 0.2)',
                        }}
                    >
                        <div className={`text-center rounded-lg p-2 text-xs sm:text-sm break-all flex-1 ${mountedTheme && isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                            {walletAddress}
                        </div>
                        <button
                            onClick={handleCopyAddress}
                            className={`ml-2 transition-colors ${mountedTheme && isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {copied ? <Check className="w-4 h-4 text-theme-primary-500" /> : <Copy className="w-4 h-4" />}
                            <span className="sr-only">Copy address</span>
                        </button>
                    </div>

                    {/* Warning */}
                    <div 
                        className="rounded-xl text-center mt-4 p-4 backdrop-blur-sm"
                        style={{
                            background: mountedTheme && isDark
                                ? 'rgba(239, 68, 68, 0.1)'
                                : 'rgba(239, 68, 68, 0.05)',
                            border: mountedTheme && isDark
                                ? '1px solid rgba(239, 68, 68, 0.3)'
                                : '1px solid rgba(239, 68, 68, 0.2)',
                        }}
                    >
                        <div className="flex justify-center mb-3">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-2xl">⚠️</div>
                        </div>
                        <p className={`text-xs sm:text-sm ${mountedTheme && isDark ? 'text-red-400' : 'text-red-600'}`}>
                            {t('universal_account.deposit_wallet.warning.title')}
                        </p>
                        <p className={`text-xs sm:text-sm mt-1 ${mountedTheme && isDark ? 'text-red-400' : 'text-red-600'}`}>
                            {t('universal_account.deposit_wallet.warning.description')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DepositWallet; 