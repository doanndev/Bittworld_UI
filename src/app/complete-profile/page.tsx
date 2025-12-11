"use client"
import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { Button } from '@/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import { langList } from '@/common';
import { useLang } from '@/lang';
import { useAuth } from '@/hooks/useAuth';
import { TelegramWalletService } from '@/services/api';
import { useRouter } from 'next/navigation';
import { getInforWallet } from '@/services/api/TelegramWalletService';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

type FormData = {
    wallet_id: string;
    name: string;
    nick_name: string;
    country: string;
    bittworld_uid: string;
};

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

export default function CompleteProfile() {
    const { payloadToken } = useAuth();
    const { theme, resolvedTheme } = useTheme();
    const [mountedTheme, setMountedTheme] = useState(false);
    const [isDark, setIsDark] = useState(true);
    
    useEffect(() => {
        setMountedTheme(true);
    }, []);

    useEffect(() => {
        if (mountedTheme) {
            const dark = resolvedTheme === 'dark' || (resolvedTheme === undefined && theme === 'dark');
            setIsDark(dark);
        }
    }, [mountedTheme, resolvedTheme, theme]);

    const { data: walletInfor, refetch } = useQuery({
        queryKey: ["wallet-infor"],
        queryFn: getInforWallet,
        refetchInterval: 30000,
        staleTime: 30000,  
    });
    const router = useRouter();
    const { t } = useLang();
    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
        defaultValues: {
            wallet_id: (payloadToken as any)?.wallet_id || '',
            name: '',
            nick_name: '',
            country: "kr",
            bittworld_uid: ''
        },
        mode: 'onChange'
    });

    // Watch form values to pass to FloatLabelInput
    const nickNameValue = watch("nick_name");
    const bittworldUidValue = watch("bittworld_uid");

    useEffect(() => {
        if (walletInfor?.wallet_nick_name) {
            router.push("/pools");
        }
    }, [walletInfor, router]);

    const onSubmit = async (formData: FormData) => {
        if (!formData.country) {
            toast.error(t("tglogin.countryRequired"));
            return;
        }
        try {
            const res = await TelegramWalletService.changeName({...formData, name: formData.nick_name});
            refetch();
            toast.success(t("tglogin.submitSuccess"));
            router.push("/pools");
        } catch (error: any) {
            toast.error(t("tglogin.submitFailed"));
        }
    };

    return (
        <div className="h-[93vh] flex flex-col justify-center items-center gap-2 xl:gap-4 px-4 lg:px-0 relative z-40 2xl:pt-4 pt-2 ">
            <Card className="w-full max-w-lg 
                backdrop-blur-xl 
                dark:bg-gradient-to-br dark:from-black/20 dark:via-theme-primary-500/10 dark:to-theme-primary-300/10
                bg-gradient-to-br from-white/80 via-theme-primary-500/5 to-theme-primary-300/5
                dark:border-gray-500/30 border-gray-300/50
                rounded-[32px] 
                dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37),inset_0_1px_0_0_rgba(255,255,255,0.1)]
                shadow-[0_8px_32px_0_rgba(0,0,0,0.1),inset_0_1px_0_0_rgba(255,255,255,0.8)]
                dark:bg-black/30 bg-white/70">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold dark:text-white text-gray-900 p-0 tracking-wide mt-4">
                        <h2 className="text-2xl font-bold dark:text-white text-gray-900">{t("tglogin.title")}</h2>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-4 pb-4">
                        <input type="hidden" {...register("wallet_id")} />
                        
                        <FloatLabelInput
                            id="nick_name"
                            label={t("tglogin.name")}
                            value={nickNameValue || ''}
                            {...register("nick_name", {
                                required: t("tglogin.nameRequired")
                            })}
                            className="dark:bg-gray-800/50 bg-gray-50/80 backdrop-blur-sm dark:border-white/20 border-gray-300/50 rounded-xl dark:text-white text-gray-900 tracking-wide shadow-sm focus:border-theme-primary-500/50 focus:ring-1 focus:ring-theme-primary-500/30"
                        />
                        {errors.nick_name && (
                            <p className="text-sm text-red-500 -mt-3">
                                {errors.nick_name.message}
                            </p>
                        )}

                        <FloatLabelInput
                            id="bittworld_uid"
                            label="BITTWORLD UID"
                            value={bittworldUidValue || ''}
                            {...register("bittworld_uid", {
                                required: t("tglogin.nicknameRequired")
                            })}
                            className="dark:bg-gray-800/50 bg-gray-50/80 backdrop-blur-sm dark:border-white/20 border-gray-300/50 rounded-xl dark:text-white text-gray-900 tracking-wide shadow-sm focus:border-theme-primary-500/50 focus:ring-1 focus:ring-theme-primary-500/30"
                        />
                        {errors.bittworld_uid && (
                            <p className="text-sm text-red-500 -mt-3">
                                {errors.bittworld_uid.message}
                            </p>
                        )}

                        <Button 
                            type="submit" 
                            className="w-full 
                                bg-gradient-to-r from-theme-primary-500 to-theme-primary-400 
                                hover:from-theme-primary-400 hover:to-theme-primary-500
                                rounded-full 
                                text-white font-semibold tracking-wide
                                transition-all duration-300
                                border-0"
                        >
                            {t("tglogin.submit")}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
