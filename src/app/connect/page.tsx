'use client'

import React, { useState, useEffect } from 'react';
import { manualRegister, manualLogin, sendVerificationCode, sendForgotPasswordCode, changePassword } from '@/services/api/GoogleService';
import { useAuth } from '@/hooks/useAuth';
import { useLang } from '@/lang/useLang';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { PasswordInput } from '@/ui/password-input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Checkbox } from '@/ui/checkbox';
import TermsOfServiceModal from '../../components/TermsOfServiceModal';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Float Label Input Component
interface FloatLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    id: string;
}

const FloatLabelInput = React.forwardRef<HTMLInputElement, FloatLabelInputProps>(
    ({ label, id, className, value, ...props }, ref) => {
        const [isFocused, setIsFocused] = React.useState(false);
        const hasValue = Boolean(value);
        const isActive = isFocused || hasValue;

        return (
            <div className="relative">
                <Input
                    {...props}
                    ref={ref}
                    id={id}
                    value={value}
                    placeholder=""
                    className={cn(
                        "transition-all duration-200",
                        isActive ? "py-2" : "pt-6 pb-2",
                        className
                    )}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                />
                <Label
                    htmlFor={id}
                    className={cn(
                        "absolute left-3 transition-all duration-200 pointer-events-none px-1",
                        isActive
                            ? "-top-2.5 text-xs text-theme-primary-500 z-10 dark:bg-black/30 bg-white/70"
                            : "top-1/2 -translate-y-1/2 text-sm dark:text-gray-400 text-gray-500 bg-transparent"
                    )}
                >
                    {label}
                </Label>
            </div>
        );
    }
);
FloatLabelInput.displayName = "FloatLabelInput";

// Float Label Password Input Component
interface FloatLabelPasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    id: string;
}

const FloatLabelPasswordInput = React.forwardRef<HTMLInputElement, FloatLabelPasswordInputProps>(
    ({ label, id, className, value, ...props }, ref) => {
        const [isFocused, setIsFocused] = React.useState(false);
        const hasValue = Boolean(value);
        const isActive = isFocused || hasValue;

        return (
            <div className="relative">
                <PasswordInput
                    {...props}
                    ref={ref}
                    id={id}
                    value={value}
                    placeholder=""
                    className={cn(
                        "transition-all duration-200",
                        isActive ? "py-2" : "pt-6 pb-2",
                        className
                    )}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                />
                <Label
                    htmlFor={id}
                    className={cn(
                        "absolute left-3 transition-all duration-200 pointer-events-none px-1",
                        isActive
                            ? "-top-2.5 text-xs text-theme-primary-500 z-10 dark:bg-black/30 bg-white/70"
                            : "top-1/2 -translate-y-1/2 text-sm dark:text-gray-400 text-gray-500 bg-transparent"
                    )}
                >
                    {label}
                </Label>
            </div>
        );
    }
);
FloatLabelPasswordInput.displayName = "FloatLabelPasswordInput";

const Connect = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('login');
    const [registrationStep, setRegistrationStep] = useState<'email' | 'form'>('email');
    const [forgotPasswordStep, setForgotPasswordStep] = useState<'email' | 'code' | 'newPassword'>('email');
    const { login } = useAuth();
    const router = useRouter();
    const [isForgot, setIsForgot] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [isTermsChecked, setIsTermsChecked] = useState(false);
    const { t } = useLang();
    const [refCodeLocalStorage, setRefCodeLocalStorage] = useState<string | null>(null);

    // Login form state
    const [loginData, setLoginData] = useState({
        email: '',
        password: ''
    });

    // Email verification state
    const [emailForVerification, setEmailForVerification] = useState('');
    const [verificationCode, setVerificationCode] = useState('');

    // Forgot password state
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
    const [forgotPasswordCode, setForgotPasswordCode] = useState('');
    const [newPassword, setNewPassword] = useState('');

    // Resend cooldown state
    const [resendCooldown, setResendCooldown] = useState(0);

    // Countdown timer effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (resendCooldown > 0) {
            interval = setInterval(() => {
                setResendCooldown((prev) => prev - 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [resendCooldown]);

    // Get refCode from sessionStorage on client side
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const refCode = sessionStorage.getItem('ref');
            setRefCodeLocalStorage(refCode);
        }
    }, []);

    // Auto-fill refCode from localStorage if it exists
    useEffect(() => {
        if (refCodeLocalStorage) {
            setRegisterData(prev => ({
                ...prev,
                refCode: refCodeLocalStorage
            }));
        }
    }, [refCodeLocalStorage]);

    // Registration form state
    const [registerData, setRegisterData] = useState({
        name: '',
        nick_name: '',
        country: 'kr',
        bittworld_uid: '',
        refCode: '',
        password: '',
        email: '',
        verificationCode: '',
        referrer_bittworld_uid: ''
    });

    const handleCheckboxClick = () => {
        setShowTermsModal(true);
    };

    const handleTermsAccept = () => {
        setIsTermsChecked(true);
        setShowTermsModal(false);
    };

    const handleTermsDecline = () => {
        setIsTermsChecked(false);
        setShowTermsModal(false);
    };

    const handleSendVerificationCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await sendVerificationCode({ email: emailForVerification });
            toast.success(t('connectPage.messages.verificationCodeSent'));
            setRegistrationStep('form');
            setRegisterData({ ...registerData, email: emailForVerification });
        } catch (error: any) {
            if (error.response?.data?.message === 'Email already exists. Please use a different email or try to login.') {
                toast.error(t('connectPage.messages.emailAlreadyExists'));
            } else {
                toast.error(t('connectPage.messages.verificationCodeError'));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        setIsLoading(true);

        try {
            await sendVerificationCode({ email: emailForVerification });
            toast.success(t('connectPage.messages.verificationCodeResent'));
        } catch (error: any) {
            if (error.response?.data?.message === 'Email already exists. Please use a different email or try to login.') {
                toast.error(t('connectPage.messages.emailAlreadyExists'));
            } else {
                toast.error(t('connectPage.messages.verificationCodeError'));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await manualLogin(loginData);
            // Check if response has the expected structure
            // Support both formats: { status, data: { token, user } } and { status, token, user }
            const token = response?.data?.token || response?.token;
            const user = response?.data?.user || response?.user;
            const status = response?.status;
            
            if ((status === 201 || status === 200 || !status) && token) {
                // Save token to localStorage and update auth state
                login(token);

                toast.success(t('connectPage.messages.loginSuccess', { name: user?.name || t('connectPage.login.title') }));
                const timeout = setTimeout(() => {
                    router.push('/');
                }, 1000);
                return () => clearTimeout(timeout);

            } else {
                console.error('❌ [DEBUG] Invalid response format:', {
                    hasStatus: !!status,
                    statusValue: status,
                    hasToken: !!token,
                    tokenValue: token,
                    fullResponse: response
                });
                throw new Error('Invalid response format');
            }
        } catch (error: any) {
            // Debug logs for error
            console.error('❌ [DEBUG] Login Error:', error);
            console.error('❌ [DEBUG] Error type:', typeof error);
            console.error('❌ [DEBUG] Error keys:', Object.keys(error || {}));
            console.error('❌ [DEBUG] error.response:', error?.response);
            console.error('❌ [DEBUG] error.response?.data:', error?.response?.data);
            console.error('❌ [DEBUG] error.response?.data?.message:', error?.response?.data?.message);
            console.error('❌ [DEBUG] error.message:', error?.message);
            
            if (error.response?.data?.message === 'Invalid or expired verification code') {
                toast.error(t('connectPage.messages.invalidVerificationCode'));
            } else if (error.response?.data?.message === 'Invalid password') {
                toast.error(t('connectPage.messages.invalidPassword'));
            } else if (error.response?.data?.message === 'User not found') {
                toast.error(t('connectPage.messages.userNotFound'));
            } else if (error.response?.data?.message === 'User not verified') {
                toast.error(t('connectPage.messages.userNotVerified'));
            } else if (error.response?.data?.message === 'Email is not verified. Please verify your email first.') {
                toast.error(t('connectPage.messages.emailNotVerified'));
            } else if (error.message === 'Invalid response format') {
                toast.error(t('connectPage.messages.loginError') + ' (Invalid response format)');
            } else {
                toast.error(error.response?.data?.message || error.message || t('connectPage.messages.loginError'));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await manualRegister({
                ...registerData,
                name: registerData.nick_name.trim(),
                country: 'kr',
                verificationCode: verificationCode
            });

            toast.success(t('connectPage.messages.registerSuccess'));

            // Switch to login tab after successful registration
            setActiveTab('login');
            setLoginData({
                email: registerData.email,
                password: registerData.password
            });

            // Reset registration state
            setRegistrationStep('email');
            setEmailForVerification('');
            setVerificationCode('');
            setRegisterData({
                name: '',
                nick_name: '',
                country: 'kr',
                bittworld_uid: '',
                refCode: '',
                password: '',
                email: '',
                verificationCode: '',
                referrer_bittworld_uid: ''
            });
        } catch (error: any) {
            if (error.response?.data?.message === 'Invalid or expired verification code') {
                toast.error(t('connectPage.messages.invalidVerificationCode'));
            }
            if (error.response?.data?.message === 'Nickname already exists') {
                toast.error(t('connectPage.messages.nicknameAlreadyExists'));
            }
            if (error.response?.data?.message === 'Bittworld UID already exists') {
                toast.error(t('connectPage.messages.bittworldUidAlreadyExists'));
            }
            else {
                toast.error(error.response?.data?.message || t('connectPage.messages.registerError'));
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Forgot password handlers
    const handleSendForgotPasswordCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await sendForgotPasswordCode({ email: forgotPasswordEmail });
            toast.success(t('connectPage.messages.verificationCodeSent'));
            setForgotPasswordStep('code');
        } catch (error: any) {
            if (error.response?.data?.message === 'User not found or email not verified') {
                toast.error(t('connectPage.messages.userNotFound'));
            } else {
                toast.error(error.response?.data?.message || t('connectPage.messages.verificationCodeError'));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendForgotPasswordCode = async () => {
        setIsLoading(true);

        try {
            await sendForgotPasswordCode({ email: forgotPasswordEmail });
            toast.success(t('connectPage.messages.verificationCodeResent'));
            // Start 30-second cooldown
            setResendCooldown(30);
        } catch (error: any) {
            if (error.response?.data?.message === 'Invalid verification code') {
                toast.error(t('connectPage.messages.invalidVerificationCode'));
            } else {
                toast.error(t('connectPage.messages.verificationCodeError'));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await changePassword({
                email: forgotPasswordEmail,
                code: forgotPasswordCode,
                newPassword: newPassword
            });

            toast.success(t('connectPage.messages.passwordChangeSuccess'));

            // Reset forgot password state and switch to login
            setForgotPasswordStep('email');
            setForgotPasswordEmail('');
            setForgotPasswordCode('');
            setNewPassword('');
            setActiveTab('login');
            setIsForgot(false);
        } catch (error: any) {
            if (error.response?.data?.message === 'Invalid verification code') {
                toast.error(t('connectPage.messages.invalidVerificationCode'));
            } else {
                toast.error(t('connectPage.messages.passwordChangeError'));
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-[93vh] flex flex-col justify-center items-center gap-2 xl:gap-4 px-4 lg:px-0 relative z-40 2xl:pt-4 pt-2">
            <Card className="w-full max-w-lg 
                backdrop-blur-xl 
                dark:bg-gradient-to-br dark:from-black/20 dark:via-theme-primary-500/10 dark:to-theme-primary-300/10
                bg-gradient-to-br from-white/80 via-theme-primary-500/5 to-theme-primary-300/5
                dark:border-white/10 border-gray-200/50
                rounded-[32px] 
                dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37),inset_0_1px_0_0_rgba(255,255,255,0.1)]
                shadow-[0_8px_32px_0_rgba(0,0,0,0.1),inset_0_1px_0_0_rgba(255,255,255,0.8)]
                dark:bg-black/30 bg-white/70">
                <CardHeader className="text-center">
                   
                    <CardTitle className="text-2xl font-bold dark:text-white text-gray-900 p-0 tracking-wide">
                        {/* {t('connectPage.title')} */}
                         {/* Logo */}
                    <div className='flex items-center justify-center my-4'>
                        <Link href="/" className="flex items-center">
                            <img
                                src="/bitworld-logo-light.png"
                                alt="logo"
                                className="h-8 xl:h-10 block dark:hidden"
                            />
                            <img
                                src="/bitworld-logo.png"
                                alt="logo"
                                className="h-8 xl:h-10 hidden dark:block"
                            />
                        </Link>
                    </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={(value) => {
                        setActiveTab(value);
                        if (value === 'register') {
                            setRegistrationStep('email');
                            setEmailForVerification('');
                            setVerificationCode('');
                        }
                        if (value === 'forgotPassword') {
                            setForgotPasswordStep('email');
                            setForgotPasswordEmail('');
                            setForgotPasswordCode('');
                            setNewPassword('');
                        }
                    }} className="w-full p-6 pt-0">
                        {!isForgot ? (
                            <TabsList className="grid w-full grid-cols-2 dark:bg-gray-800/30 bg-gray-100/50 backdrop-blur-sm dark:border-white/10 border-gray-200/50 rounded-xl sticky top-0 z-10 p-1 mb-4">
                                <TabsTrigger 
                                    value="login" 
                                    className="dark:text-gray-300 text-gray-600 
                                        data-[state=active]:bg-gradient-to-r data-[state=active]:from-theme-primary-500 data-[state=active]:to-theme-primary-400 data-[state=active]:text-white 
                                        hover:bg-theme-primary-500/20 dark:hover:bg-theme-primary-500/10 
                                        rounded-lg transition-all">
                                    {t('connectPage.tabs.login')}
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="register" 
                                    className="dark:text-gray-300 text-gray-600 
                                        data-[state=active]:bg-gradient-to-r data-[state=active]:from-theme-primary-500 data-[state=active]:to-theme-primary-400 data-[state=active]:text-white 
                                        hover:bg-theme-primary-500/20 dark:hover:bg-theme-primary-500/10 
                                        rounded-lg transition-all">
                                    {t('connectPage.tabs.register')}
                                </TabsTrigger>
                            </TabsList>
                        ) : (
                            <></>
                        )}

                        {/* Tab Content Container with Animation */}
                        <div className="relative overflow-hidden">
                            <AnimatePresence mode="popLayout" initial={false}>
                                {/* Login Tab */}
                                {!isForgot && activeTab === 'login' && (
                                    <motion.div
                                        key="login"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ duration: 0.2, ease: "easeInOut" }}
                                        className="w-full"
                                    >
                                        <TabsContent value="login" className="space-y-4 m-0">
                                            <form onSubmit={handleLogin} className="space-y-5 mt-4">
                                                <FloatLabelInput
                                                    id="login-email"
                                                    type="email"
                                                    label={t('connectPage.login.email')}
                                                    value={loginData.email}
                                                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                                    required
                                                    className="dark:bg-gray-800/50 bg-gray-50/80 backdrop-blur-sm dark:border-white/20 border-gray-300/50 rounded-xl dark:text-white text-gray-900 tracking-wide shadow-sm focus:border-theme-primary-500/50 focus:ring-1 focus:ring-theme-primary-500/30"
                                                />
                                                <FloatLabelPasswordInput
                                                    id="login-password"
                                                    minLength={4}
                                                    label={t('connectPage.login.password')}
                                                    value={loginData.password}
                                                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                                    required
                                                    className="dark:bg-gray-800/50 bg-gray-50/80 backdrop-blur-sm dark:border-white/20 border-gray-300/50 rounded-xl dark:text-white text-gray-900 tracking-wide shadow-sm focus:border-theme-primary-500/50 focus:ring-1 focus:ring-theme-primary-500/30"
                                                />
                                                <div className='text-xs dark:text-gray-400 text-gray-600'>
                                                    <span className='cursor-pointer hover:text-theme-primary-500 dark:hover:text-theme-primary-300 dark:text-gray-300 text-gray-700 transition-colors' onClick={() => setIsForgot(true)}>{t('connectPage.login.forgotPassword')}</span>
                                                </div>
                                                <Button 
                                                    type="submit" 
                                                    className="w-full 
                                                        bg-gradient-to-r from-theme-primary-500 to-theme-primary-400 
                                                        hover:from-theme-primary-400 hover:to-theme-primary-500
                                                        rounded-full 
                                                        text-white font-semibold tracking-wide
                                                        transition-all duration-300
                                                        border-0" 
                                                    disabled={isLoading}>
                                                    {isLoading ? t('connectPage.login.loggingIn') : t('connectPage.login.loginButton')}
                                                </Button>
                                            </form>
                                        </TabsContent>
                                    </motion.div>
                                )}

                                {/* Register Tab */}
                                {!isForgot && activeTab === 'register' && (
                                    <motion.div
                                        key="register"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2, ease: "easeInOut" }}
                                        className="w-full"
                                    >
                                        <TabsContent value="register" className="space-y-4 m-0">
                                            {registrationStep === 'email' ? (
                                // Email verification step
                                <form onSubmit={handleSendVerificationCode} className="space-y-5 mt-4">
                                    <FloatLabelInput
                                        id="verification-email"
                                        type="email"
                                        label={t('connectPage.register.email')}
                                        value={emailForVerification}
                                        onChange={(e) => setEmailForVerification(e.target.value)}
                                        required
                                        className="dark:bg-gray-800/50 bg-gray-50/80 backdrop-blur-sm dark:border-white/20 border-gray-300/50 rounded-xl dark:text-white text-gray-900 tracking-wide shadow-sm focus:border-theme-primary-500/50 focus:ring-1 focus:ring-theme-primary-500/30"
                                    />
                                    <Button 
                                        type="submit" 
                                        className="w-full 
                                            bg-gradient-to-r from-theme-primary-500 to-theme-primary-400 
                                            hover:from-theme-primary-400 hover:to-theme-primary-500
                                            rounded-full 
                                            text-white font-semibold tracking-wide
                                            transition-all duration-300
                                            border-0" 
                                        disabled={isLoading}>
                                        {isLoading ? t('connectPage.register.sendingCode') : t('connectPage.register.sendCode')}
                                    </Button>
                                </form>
                            ) : (
                                // Full registration form
                                <form onSubmit={handleRegister} className="space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-sm dark:text-gray-300 text-gray-700">
                                            {t('connectPage.register.emailDisplay', { email: emailForVerification })}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <FloatLabelInput
                                                id="verification-code"
                                                type="text"
                                                maxLength={6}
                                                label={t('connectPage.register.verificationCode')}
                                                value={verificationCode}
                                                onChange={(e) => setVerificationCode(e.target.value)}
                                                required
                                                className="dark:bg-gray-800/50 bg-gray-50/80 backdrop-blur-sm dark:border-white/20 border-gray-300/50 rounded-xl dark:text-white text-gray-900 tracking-wide shadow-sm focus:border-theme-primary-500/50 focus:ring-1 focus:ring-theme-primary-500/30"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleResendCode}
                                            disabled={isLoading}
                                            className="whitespace-nowrap dark:bg-gray-800/50 bg-gray-100/80 backdrop-blur-sm dark:border-white/20 border-gray-300/50 rounded-xl dark:text-gray-300 text-gray-700 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white hover:border-theme-primary-500/50 self-end"
                                        >
                                            {t('connectPage.register.resendCode')}
                                        </Button>
                                    </div>

                                    <FloatLabelInput
                                        id="register-nickname"
                                        type="text"
                                        label={t('connectPage.register.nickname')}
                                        value={registerData.nick_name}
                                        onChange={(e) => setRegisterData({ ...registerData, nick_name: e.target.value })}
                                        required
                                        className="dark:bg-gray-800/50 bg-gray-50/80 backdrop-blur-sm dark:border-white/20 border-gray-300/50 rounded-xl dark:text-white text-gray-900 tracking-wide shadow-sm focus:border-theme-primary-500/50 focus:ring-1 focus:ring-theme-primary-500/30"
                                    />
                                    <FloatLabelPasswordInput
                                        id="register-password"
                                        minLength={4}
                                        label={t('connectPage.register.password') + " " + t('connectPage.messages.minPasswordLength')}
                                        value={registerData.password}
                                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                                        required
                                        className="dark:bg-gray-800/50 bg-gray-50/80 backdrop-blur-sm dark:border-white/20 border-gray-300/50 rounded-xl dark:text-white text-gray-900 tracking-wide shadow-sm focus:border-theme-primary-500/50 focus:ring-1 focus:ring-theme-primary-500/30"
                                    />
                                    <FloatLabelInput
                                        id="register-uid"
                                        type="text"
                                        minLength={6}
                                        label={t('connectPage.register.bitworldUid')}
                                        value={registerData.bittworld_uid}
                                        onChange={(e) => setRegisterData({ ...registerData, bittworld_uid: e.target.value })}
                                        required
                                        className="dark:bg-gray-800/50 bg-gray-50/80 backdrop-blur-sm dark:border-white/20 border-gray-300/50 rounded-xl dark:text-white text-gray-900 tracking-wide shadow-sm focus:border-theme-primary-500/50 focus:ring-1 focus:ring-theme-primary-500/30"
                                    />
                                    <FloatLabelInput
                                        id="ref-bittworld-uid"
                                        type="text"
                                        label={t('connectPage.register.referralCodeBittworldUid')}
                                        value={registerData.referrer_bittworld_uid}
                                        onChange={(e) => setRegisterData({ ...registerData, referrer_bittworld_uid: e.target.value })}
                                        className="dark:bg-gray-800/50 bg-gray-50/80 backdrop-blur-sm dark:border-white/20 border-gray-300/50 rounded-xl dark:text-white text-gray-900 tracking-wide shadow-sm focus:border-theme-primary-500/50 focus:ring-1 focus:ring-theme-primary-500/30"
                                    />
                                    <div className="flex justify-center items-center gap-2">
                                    <Checkbox
                                        id="terms-of-service"
                                        className="w-4 h-4"
                                        checked={isTermsChecked}
                                        onClick={handleCheckboxClick}
                                    />
                                    <button
                                        className="text-xs dark:text-gray-300 text-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
                                        onClick={handleCheckboxClick}
                                    >
                                        {t('modalSignin.agreeToTerms')} <span className="bg-gradient-to-r from-theme-primary-500 to-theme-primary-300 bg-clip-text text-transparent">{t('modalSignin.termsOfService')}</span> {t('modalSignin.ofBittworld')}
                                    </button>
                                </div>
                                    <Button 
                                        type="submit" 
                                        className="w-full 
                                            bg-gradient-to-r from-theme-primary-500 to-theme-primary-400 
                                            hover:from-theme-primary-400 hover:to-theme-primary-500
                                            rounded-full 
                                            text-white font-semibold tracking-wide
                                            transition-all duration-300
                                            border-0
                                            disabled:opacity-50 disabled:cursor-not-allowed" 
                                        disabled={isLoading || !isTermsChecked}>
                                        {isLoading ? t('connectPage.register.registering') : t('connectPage.register.registerButton')}
                                    </Button>
                                        </form>
                                    )}
                                        </TabsContent>
                                    </motion.div>
                                )}

                                {/* Forgot Password Tab */}
                                {isForgot && (
                                    <motion.div
                                        key="forgot-password"
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -15 }}
                                        transition={{ duration: 0.2, ease: "easeInOut" }}
                                        className="w-full"
                                    >
                                        <TabsContent value="login" className="space-y-2 m-0">
                                            <div className='flex items-center justify-between mt-3 mb-1'>
                                                <div className='bg-gradient-to-r from-theme-primary-500 to-theme-primary-300 bg-clip-text text-transparent text-lg font-bold'>
                                                    {t('connectPage.forgotPassword.title')}
                                                </div>
                                                <div className='dark:text-gray-300 text-gray-700 text-sm cursor-pointer hover:text-theme-primary-500 dark:hover:text-theme-primary-300 transition-colors' onClick={() => setIsForgot(false)}>{t('connectPage.login.backToLogin')}</div>
                                            </div>
                                            {forgotPasswordStep === 'email' && (
                                                <form onSubmit={handleSendForgotPasswordCode} className="space-y-6 mt-4">
                                                    <FloatLabelInput
                                                        id="forgot-password-email"
                                                        type="email"
                                                        label={t('connectPage.forgotPassword.email')}
                                                        value={forgotPasswordEmail}
                                                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                                                        required
                                                        className="dark:bg-gray-800/50 bg-gray-50/80 backdrop-blur-sm dark:border-white/20 border-gray-300/50 rounded-xl dark:text-white text-gray-900 tracking-wide shadow-sm focus:border-theme-primary-500/50 focus:ring-1 focus:ring-theme-primary-500/30"
                                                    />
                                                    <Button 
                                                        type="submit" 
                                                        className="w-full 
                                                            bg-gradient-to-r from-theme-primary-500 to-theme-primary-400 
                                                            hover:from-theme-primary-400 hover:to-theme-primary-500
                                                            rounded-full 
                                                            text-white font-semibold tracking-wide
                                                            transition-all duration-300
                                                            border-0" 
                                                        disabled={isLoading}>
                                                        {isLoading ? t('connectPage.forgotPassword.sendingCode') : t('connectPage.forgotPassword.sendCode')}
                                                    </Button>
                                                </form>
                                            )}

                                            {forgotPasswordStep === 'code' && (
                                                <form onSubmit={handleChangePassword} className="space-y-5">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="text-sm dark:text-gray-300 text-gray-700">
                                                            {t('connectPage.register.emailDisplay', { email: forgotPasswordEmail })}
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <div className="flex-1">
                                                            <FloatLabelInput
                                                                id="forgot-password-code"
                                                                type="text"
                                                                label={t('connectPage.forgotPassword.verificationCode')}
                                                                value={forgotPasswordCode}
                                                                onChange={(e) => setForgotPasswordCode(e.target.value)}
                                                                required
                                                                className="dark:bg-gray-800/50 bg-gray-50/80 backdrop-blur-sm dark:border-white/20 border-gray-300/50 rounded-xl dark:text-white text-gray-900 tracking-wide shadow-sm focus:border-theme-primary-500/50 focus:ring-1 focus:ring-theme-primary-500/30"
                                                            />
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={handleResendForgotPasswordCode}
                                                            disabled={isLoading || resendCooldown > 0}
                                                            className="whitespace-nowrap dark:bg-gray-800/50 bg-gray-100/80 backdrop-blur-sm dark:border-white/20 border-gray-300/50 rounded-xl dark:text-gray-300 text-gray-700 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white hover:border-theme-primary-500/50 self-end"
                                                        >
                                                            {resendCooldown > 0 ? t('connectPage.register.resendCodeWithTimer', { seconds: resendCooldown }) : t('connectPage.register.resendCode')}
                                                        </Button>
                                                    </div>

                                                    <FloatLabelPasswordInput
                                                        id="new-password"
                                                        minLength={4}
                                                        label={t('connectPage.forgotPassword.newPassword') + " " + t('connectPage.messages.minPasswordLength')}
                                                        value={newPassword}
                                                        onChange={(e) => setNewPassword(e.target.value)}
                                                        required
                                                        className="dark:bg-gray-800/50 bg-gray-50/80 backdrop-blur-sm dark:border-white/20 border-gray-300/50 rounded-xl dark:text-white text-gray-900 tracking-wide shadow-sm focus:border-theme-primary-500/50 focus:ring-1 focus:ring-theme-primary-500/30"
                                                    />

                                                    <Button 
                                                        type="submit" 
                                                        disabled={isLoading} 
                                                        className="w-full 
                                                            bg-gradient-to-r from-theme-primary-500 to-theme-primary-400 
                                                            hover:from-theme-primary-400 hover:to-theme-primary-500
                                                            rounded-full 
                                                            text-white font-semibold tracking-wide
                                                            transition-all duration-300
                                                            border-0
                                                            disabled:opacity-50 disabled:cursor-not-allowed">
                                                        {isLoading ? t('connectPage.forgotPassword.changingPassword') : t('connectPage.forgotPassword.changePassword')}
                                                    </Button>
                                                </form>
                                            )}
                                        </TabsContent>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </Tabs>
                    {/* <div className='w-full px-4 pb-5 flex flex-col gap-4'>
                        <div className='text-xs text-center mx-auto dark:text-white text-black'>{t('or')}</div>
                        <button
                            onClick={handleGoogleSignIn}
                            className={`text-center text-gray-900 h-10 min-w-48 text-sm font-normal leading-tight flex items-center w-full gap-2 justify-center rounded-md bg-theme-primary-500 dark:text-white`}
                        >
                            {t('modalSignin.loginWithGoogle')} <div className="w-8 h-8 overflow-hidden cursor-pointer rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800" onClick={handleGoogleSignIn}>
                                <img
                                    src="https://img.icons8.com/color/48/google-logo.png"
                                    alt="google"
                                    className="w-6 h-6 object-cover"
                                />
                            </div>
                        </button>
                    </div> */}
                </CardContent>
            </Card>
            <TermsOfServiceModal
                isOpen={showTermsModal}
                onAccept={handleTermsAccept}
                onDecline={handleTermsDecline}
            />
        </div>
    );
};

export default Connect;