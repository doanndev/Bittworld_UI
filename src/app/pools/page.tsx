"use client"

import { useEffect, useState, useRef } from "react"
import { useTheme } from 'next-themes'
import { useRouter } from "next/navigation"
import { Search, Star, Settings, ChevronDown, Copy, Upload, X, LayoutGrid, ListIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from 'react-hot-toast'
import { truncateString } from "@/utils/format"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getInforWallet } from "@/services/api/TelegramWalletService"
import { useAuth } from "@/hooks/useAuth"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/ui/dialog"
import { Input } from "@/ui/input"
import { Textarea } from "@/ui/textarea"
import { Label } from "@/ui/label"
import { useLang } from '@/lang/useLang'
import { listBoxLogos } from "@/services/other"
import {
    getAirdropPools,
    createAirdropPool,
    stakeAirdropPool,
    type AirdropPool,
    type CreatePoolRequest,
    type StakePoolRequest
} from "@/services/api/PoolServices"
import { Checkbox } from "@/ui/checkbox"
import { cn } from "@/lib/utils"
import React from "react"

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

// Float Label Textarea Component
interface FloatLabelTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
    id: string;
}

const FloatLabelTextarea = React.forwardRef<HTMLTextAreaElement, FloatLabelTextareaProps>(
    ({ label, id, className, value, ...props }, ref) => {
        const [isFocused, setIsFocused] = React.useState(false);
        const hasValue = Boolean(value);
        const isActive = isFocused || hasValue;

        return (
            <div className="relative">
                <Textarea
                    {...props}
                    ref={ref}
                    id={id}
                    value={value}
                    placeholder=""
                    className={cn(
                        "transition-all duration-200 resize-none",
                        isActive ? "pt-6 pb-2" : "pt-6 pb-2",
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
                            : "top-3 text-sm dark:text-gray-400 text-gray-500 bg-transparent"
                    )}
                >
                    {label}
                </Label>
            </div>
        );
    }
);
FloatLabelTextarea.displayName = "FloatLabelTextarea";

interface CreatePoolForm {
    name: string
    description: string
    image: File | string | null
    amount: number
    required?: boolean
}

type PoolFilterType = 'all' | 'created' | 'joined' | 'ranking'

export default function LiquidityPools() {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const { theme, resolvedTheme } = useTheme();
    const [mountedTheme, setMountedTheme] = useState(false);
    const isDark = resolvedTheme === 'dark' || (resolvedTheme === undefined && theme === 'dark');
    
    useEffect(() => {
        setMountedTheme(true);
    }, []);

    // Detect screen size and force grid view on mobile/tablet
    useEffect(() => {
        const checkScreenSize = () => {
            const isSmallScreen = window.innerWidth < 1024; // lg breakpoint
            setIsMobileOrTablet(isSmallScreen);
            if (isSmallScreen) {
                setViewStyle('grid');
            }
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);
    const { data: walletInfor, refetch } = useQuery({
        queryKey: ["wallet-infor"],
        queryFn: getInforWallet,
        enabled: isAuthenticated,
        // Always refetch when the page mounts (including route changes), when window focuses, and when reconnecting
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        staleTime: 0,
    });

    const queryClient = useQueryClient();

    // State cho filter type
    const [activeFilter, setActiveFilter] = useState<PoolFilterType>('all');
    const filterRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
    
    // State cho view style
    const [viewStyle, setViewStyle] = useState<'table' | 'grid'>('table');
    const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);

    // Query để lấy danh sách airdrop pools với filter
    const { data: poolsResponse, isLoading: isLoadingPools } = useQuery({
        queryKey: ["airdrop-pools", activeFilter],
        queryFn: () => getAirdropPools('creationDate', 'desc', activeFilter === 'all' || activeFilter === 'ranking' ? undefined : activeFilter),
        enabled: isAuthenticated,
        // Ensure automatic re-fetch on window focus, reconnect, and every mount
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        staleTime: 0,
    });

    const { t } = useLang();

    // State cho favorite pools
    const [favoritePools, setFavoritePools] = useState<string[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('favorite_pool')
            return saved ? JSON.parse(saved) : []
        }
        return []
    })

    const [searchQuery, setSearchQuery] = useState("")
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [listNumberTab, setListNumberTab] = useState<number[]>([0, 0, 0])
    const isFirstRender = useRef<boolean>(true)
    const [createForm, setCreateForm] = useState<CreatePoolForm>({
        name: "",
        description: "",
        image: null,
        amount: 500000,
        required: false
    })
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLogoPickerOpen, setIsLogoPickerOpen] = useState(false)
    const [boxLogos, setBoxLogos] = useState<string[]>([])
    const [isLoadingBoxLogos, setIsLoadingBoxLogos] = useState(false)
    const [isDragOver, setIsDragOver] = useState(false)

    // Mutation để tạo pool
    const createPoolMutation = useMutation({
        mutationFn: async (data: CreatePoolRequest) => {
            return await createAirdropPool(data);
        },
        onSuccess: (data) => {
            toast.success(t('pools.poolCreatedSuccess'));
            queryClient.invalidateQueries({ queryKey: ["airdrop-pools"] });
            setIsCreateModalOpen(false)
            setCreateForm({
                name: "",
                description: "",
                image: null,
                amount: 1000000
            })
            setImagePreview(null)
            handleCloseModal();
        }
    });

    // Mutation để stake pool
    const stakePoolMutation = useMutation({
        mutationFn: async (data: StakePoolRequest) => {
            return await stakeAirdropPool(data);
        },
        onSuccess: (data) => {
            toast.success(t('pools.stakeSuccess'));
            queryClient.invalidateQueries({ queryKey: ["airdrop-pools"] });
        }
    });

    const toggleFavorite = (poolId: string) => {
        const newFavorites = favoritePools.includes(poolId)
            ? favoritePools.filter(id => id !== poolId)
            : [...favoritePools, poolId];

        setFavoritePools(newFavorites);
        localStorage.setItem('favorite_pool', JSON.stringify(newFavorites));
    }

    const handleFilterChange = (filter: PoolFilterType) => {
        setActiveFilter(filter);
    }

    // Update slide indicator position
    useEffect(() => {
        const updateIndicator = () => {
            const activeIndex = ['all', 'ranking', 'created', 'joined'].indexOf(activeFilter);
            const activeButton = filterRefs.current[activeIndex];
            if (activeButton) {
                // Find the container with relative positioning
                const container = activeButton.parentElement;
                if (container && container.classList.contains('relative')) {
                    const containerRect = container.getBoundingClientRect();
                    const buttonRect = activeButton.getBoundingClientRect();
                    
                    // Calculate exact position relative to container
                    // Container has p-1 (4px padding) and buttons have gap-0.5 (2px)
                    // Indicator should align exactly with button, accounting for container padding
                    const containerPadding = 4; // p-1 = 4px
                    const leftOffset = buttonRect.left - containerRect.left - containerPadding;
                    const width = buttonRect.width;
                    
                    setIndicatorStyle({
                        left: Math.max(0, leftOffset), // Ensure non-negative
                        width: width,
                    });
                }
            }
        };
        
        // Use double requestAnimationFrame for better accuracy after layout
        const rafId = requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                updateIndicator();
            });
        });
        
        // Update on window resize and orientation change
        const handleResize = () => {
            requestAnimationFrame(() => {
                updateIndicator();
            });
        };
        
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);
        
        return () => {
            cancelAnimationFrame(rafId);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, [activeFilter, mountedTheme]);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            processImageFile(file)
        }
    }

    const processImageFile = (file: File) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error(t('pools.uploadImageFile'))
            return
        }

        // Validate file size (2MB limit)
        if (file.size > 2 * 1024 * 1024) {
            toast.error(t('pools.uploadImageSize'))
            return
        }

        setCreateForm(prev => ({ ...prev, image: file }))

        // Create preview
        const reader = new FileReader()
        reader.onload = (e) => {
            setImagePreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOver(true)
    }

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOver(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOver(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOver(false)

        const files = e.dataTransfer.files
        if (files && files.length > 0) {
            const file = files[0]
            processImageFile(file)
        }
    }

    const openLogoPicker = async () => {
        setIsLogoPickerOpen(true)
        if (boxLogos.length === 0) {
            try {
                setIsLoadingBoxLogos(true)
                const logos = await listBoxLogos()
                console.log('logos', logos)
                setBoxLogos(logos)
            } catch (e) {
                toast.error('Failed to load system logos')
            } finally {
                setIsLoadingBoxLogos(false)
            }
        }
    }

    const handleCreatePool = async () => {
        if (!createForm.name.trim()) {
            toast.error(t('pools.poolNameRequired'))
            return
        }

        if (!createForm.description.trim()) {
            toast.error(t('pools.poolDescRequired'))
            return
        }

        if (!createForm.image) {
            toast.error(t('pools.poolImageRequired'))
            return
        }

        if (createForm.amount < 500000) {
            toast.error(t('pools.minAmountRequired'))
            return
        }

        setIsSubmitting(true)

        try {
            let logoFile: File | null = null
            if (createForm.image instanceof File) {
                logoFile = createForm.image
            } else if (typeof createForm.image === 'string') {
                const isAbsolute = /^https?:\/\//i.test(createForm.image)
                const absoluteUrl = isAbsolute ? createForm.image : `${window.location.origin}${createForm.image}`
                const res = await fetch(absoluteUrl)
                if (!res.ok) throw new Error('Failed to fetch selected image')
                const blob = await res.blob()
                const contentType = res.headers.get('content-type') || 'image/png'
                const filename = (createForm.image.split('/')?.pop() || 'logo.png').split('?')[0]
                logoFile = new File([blob], filename, { type: contentType })
            }

            const poolData: CreatePoolRequest = {
                name: createForm.name,
                logo: logoFile as File,
                describe: createForm.description,
                initialAmount: createForm.amount,
            };
            await createPoolMutation.mutateAsync(poolData);
        } catch (error: any) {
            console.error('Create pool error:', error);
            const errorMessage = error.response?.data?.message;
            // Check if it's an insufficient balance error
            if (errorMessage && errorMessage.includes('Insufficient token') && errorMessage.includes('Current:') && errorMessage.includes('Required:')) {
                // Extract current and required values from the error message
                const currentMatch = errorMessage.match(/Current:\s*(\d+)/);
                const requiredMatch = errorMessage.match(/Required:\s*(\d+)/);

                if (currentMatch && requiredMatch) {
                    const current = currentMatch[1];
                    const required = requiredMatch[1];
                    const message = t('pools.insufficientTokenBalance', { current, required });
                    toast.error(message);
                }
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleStakePool = async (poolId: number, stakeAmount: number) => {
        if (stakeAmount < 500000) {
            toast.error(t('pools.minStakeRequired'))
            return
        }

        try {
            const stakeData: StakePoolRequest = {
                poolId,
                stakeAmount
            };

            await stakePoolMutation.mutateAsync(stakeData);
        } catch (error) {
            console.error('Stake pool error:', error);
        }
    }

    const handleCloseModal = () => {
        if (!isSubmitting) {
            setCreateForm({
                name: "",
                description: "",
                image: null,
                amount: 500000
            })
            setImagePreview(null)
            setIsCreateModalOpen(false)
        }
    }

    // Lấy danh sách pools từ API response
    const pools = poolsResponse?.data || [];

    // Filter pools theo search query
    let filteredPools = pools.filter((pool: AirdropPool) =>
        pool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pool.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort pools by totalVolume if ranking filter is active
    if (activeFilter === 'ranking') {
        filteredPools = [...filteredPools].sort((a, b) => b.roundVolume - a.roundVolume);
    }

    // Tính số lượng pools cho mỗi tab (sẽ được cập nhật khi có API riêng cho từng tab)
    const getPoolCount = (filterType: PoolFilterType) => {
        if (filterType === 'all') return pools.length;
        if (filterType === 'created') return pools.filter((pool: AirdropPool) => pool.userStakeInfo?.isCreator).length;
        if (filterType === 'joined') return pools.filter((pool: AirdropPool) => pool.userStakeInfo && !pool.userStakeInfo.isCreator).length;
        if (filterType === 'ranking') return pools.length;
        return 0;
    };

    useEffect(() => {
        if (isFirstRender.current && pools.length > 0) {
            setListNumberTab([getPoolCount('all'), getPoolCount('created'), getPoolCount('joined'), getPoolCount('ranking')])
            isFirstRender.current = false
        }
    }, [pools])

    // Format số lượng
    const formatNumber = (num: number) => {
        return new Intl.NumberFormat().format(num);
    };

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const formatInputNumber = (value: string | number) => {
        if (!value) return ''
        const numValue = typeof value === 'string' ? value.replace(/,/g, '') : value
        const num = Number(numValue)
        if (isNaN(num)) return ''
        return new Intl.NumberFormat().format(num)
    }

    const getColorRanking = (index: number) => {
        if (activeFilter === 'ranking' && index === 0) {
            // 1st place: Cyan/Blue gradient phù hợp với blockchain theme
            return "bg-gradient-to-r from-[#15DFFD] via-[#02B7D2] to-[#00A8CC]";
        } else if (activeFilter === 'ranking' && index === 1) {
            // 2nd place: Silver gradient phù hợp với blockchain theme
            return "bg-gradient-to-r from-[#C0C0C0] via-[#A8A8A8] to-[#808080]";
        } else if (activeFilter === 'ranking' && index === 2) {
            // 3rd place: Purple gradient phù hợp với blockchain theme
            return "bg-gradient-to-r from-[#8833EE] via-[#761BB3] to-[#5A0F9C]";
        }
        return "";
    }
    const getImgRanking = (index: number) => {
        if (activeFilter === 'ranking' && index === 0) {
            return <img src={"/firsth.png"} alt="ranking" className="w-8 h-10 sm:w-9 sm:h-11 md:w-10 md:h-12" />
        } else if (activeFilter === 'ranking' && index === 1) {
            return <img src={"/sectionth.png"} alt="ranking" className="w-8 h-10 sm:w-9 sm:h-11 md:w-10 md:h-12" />
        } else if (activeFilter === 'ranking' && index === 2) {
            return <img src={"/threeth.png"} alt="ranking" className="w-8 h-10 sm:w-9 sm:h-11 md:w-10 md:h-12" />
        } else {
            return <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-12 flex items-center justify-center text-[10px] sm:text-xs md:text-sm font-semibold">{index + 1}</div>
        }
    }

    return (
        <div className="flex-1 bg-transparent dark:bg-transparent text-gray-900 dark:text-white mx-10">
            {/* Main Content */}
            <main className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-10">
                <div className="2xl:container mx-auto ">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-theme-primary-500 mb-6 sm:mb-8 lg:mb-12 m-8">BITTWORLD POOL</h1>


                    {/* Search and Actions - Responsive */}
                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 md:gap-4 mb-6">
                        {/* Left Section: View Toggle, Filter, Search */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4 flex-1">
                            {/* View Style Toggle - Hidden on mobile/tablet */}
                            {!isMobileOrTablet && (
                            <div 
                                className="inline-flex items-center gap-1 p-1 rounded-xl backdrop-blur-xl mx-auto sm:mx-0"
                                style={{
                                    background: mountedTheme && isDark
                                        ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.4) 100%)'
                                        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.5) 100%)',
                                    border: mountedTheme && isDark
                                        ? '1px solid rgba(107, 114, 128, 0.3)'
                                        : '1px solid rgba(156, 163, 175, 0.3)',
                                    boxShadow: mountedTheme && isDark
                                        ? '0 4px 12px -4px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(107, 114, 128, 0.1) inset'
                                        : '0 4px 12px -4px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(156, 163, 175, 0.1) inset',
                                }}
                            >
                                <button
                                    onClick={() => setViewStyle('table')}
                                    className={`p-2 rounded-lg transition-all duration-300 ${
                                        viewStyle === 'table' ? '' : 'opacity-60 hover:opacity-100'
                                    }`}
                                    style={{
                                        background: viewStyle === 'table'
                                            ? (mountedTheme && isDark
                                                ? 'linear-gradient(135deg, rgba(31, 193, 107, 0.25) 0%, rgba(31, 193, 107, 0.2) 100%)'
                                                : 'linear-gradient(135deg, rgba(31, 193, 107, 0.3) 0%, rgba(31, 193, 107, 0.25) 100%)')
                                            : 'transparent',
                                        border: viewStyle === 'table'
                                            ? (mountedTheme && isDark
                                                ? '1px solid rgba(107, 114, 128, 0.4)'
                                                : '1px solid rgba(156, 163, 175, 0.4)')
                                            : '1px solid transparent',
                                        color: viewStyle === 'table'
                                            ? (mountedTheme && isDark ? 'white' : '#1f2937')
                                            : (mountedTheme && isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'),
                                    }}
                                >
                                    <ListIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                                <button
                                    onClick={() => setViewStyle('grid')}
                                    className={`p-2 rounded-lg transition-all duration-300 ${
                                        viewStyle === 'grid' ? '' : 'opacity-60 hover:opacity-100'
                                    }`}
                                    style={{
                                        background: viewStyle === 'grid'
                                            ? (mountedTheme && isDark
                                                ? 'linear-gradient(135deg, rgba(31, 193, 107, 0.25) 0%, rgba(31, 193, 107, 0.2) 100%)'
                                                : 'linear-gradient(135deg, rgba(31, 193, 107, 0.3) 0%, rgba(31, 193, 107, 0.25) 100%)')
                                            : 'transparent',
                                        border: viewStyle === 'grid'
                                            ? (mountedTheme && isDark
                                                ? '1px solid rgba(107, 114, 128, 0.4)'
                                                : '1px solid rgba(156, 163, 175, 0.4)')
                                            : '1px solid transparent',
                                        color: viewStyle === 'grid'
                                            ? (mountedTheme && isDark ? 'white' : '#1f2937')
                                            : (mountedTheme && isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'),
                                    }}
                                >
                                    <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                            </div>
                            )}

                            {/* Filter and Search Container */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                                {/* Filter Buttons */}
                                <div 
                                    className="relative inline-flex items-center gap-0.5 p-1 rounded-xl backdrop-blur-xl w-full sm:w-auto justify-center sm:justify-start"
                                    style={{
                                        background: mountedTheme && isDark
                                            ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.4) 100%)'
                                            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.5) 100%)',
                                        border: mountedTheme && isDark
                                            ? '1px solid rgba(107, 114, 128, 0.3)'
                                            : '1px solid rgba(156, 163, 175, 0.3)',
                                        boxShadow: mountedTheme && isDark
                                            ? '0 8px 24px -8px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(107, 114, 128, 0.1) inset, 0 2px 8px -2px rgba(107, 114, 128, 0.1)'
                                            : '0 8px 24px -8px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(156, 163, 175, 0.1) inset, 0 2px 8px -2px rgba(156, 163, 175, 0.08)',
                                    }}
                                >
                                    {/* Slide Indicator */}
                                    <div 
                                        className="absolute top-1 bottom-1 rounded-lg transition-all duration-300 ease-out z-0"
                                        style={{
                                            left: `${indicatorStyle.left}px`,
                                            width: `${indicatorStyle.width}px`,
                                            background: mountedTheme && isDark
                                                ? 'linear-gradient(135deg, rgba(31, 193, 107, 0.25) 0%, rgba(31, 193, 107, 0.2) 100%)'
                                                : 'linear-gradient(135deg, rgba(31, 193, 107, 0.3) 0%, rgba(31, 193, 107, 0.25) 100%)',
                                            border: mountedTheme && isDark
                                                ? '1px solid rgba(107, 114, 128, 0.4)'
                                                : '1px solid rgba(156, 163, 175, 0.4)',
                                            backdropFilter: 'blur(12px)',
                                            WebkitBackdropFilter: 'blur(12px)',
                                        }}
                                    />
                                    
                                    {/* Filter Buttons */}
                                    {(['all', 'ranking', 'created', 'joined'] as PoolFilterType[]).map((filter, index) => {
                                        const labels = {
                                            all: t('pools.filterAll'),
                                            ranking: t('pools.filterRanking'),
                                            created: t('pools.filterCreated'),
                                            joined: t('pools.filterJoined'),
                                        };
                                        const isActive = activeFilter === filter;
                                        
                                        return (
                                            <Button
                                                key={filter}
                                                ref={(el) => {
                                                    filterRefs.current[index] = el;
                                                }}
                                                className="relative z-10 text-xs sm:text-sm font-medium px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 h-auto rounded-lg transition-all duration-300 bg-transparent border-0 whitespace-nowrap"
                                                style={{
                                                    color: isActive
                                                        ? (mountedTheme && isDark ? 'white' : '#1f2937')
                                                        : (mountedTheme && isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.6)'),
                                                    fontWeight: isActive ? '600' : '500',
                                                }}
                                                onClick={() => handleFilterChange(filter)}
                                                onMouseEnter={(e) => {
                                                    if (!isActive) {
                                                        e.currentTarget.style.color = mountedTheme && isDark 
                                                            ? 'rgba(255, 255, 255, 0.7)' 
                                                            : 'rgba(0, 0, 0, 0.8)';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!isActive) {
                                                        e.currentTarget.style.color = mountedTheme && isDark 
                                                            ? 'rgba(255, 255, 255, 0.5)' 
                                                            : 'rgba(0, 0, 0, 0.6)';
                                                    }
                                                }}
                                            >
                                                {labels[filter]}
                                            </Button>
                                        );
                                    })}
                                </div>
                                
                                {/* Search Input */}
                                <div className="relative w-full sm:w-auto sm:flex-1 md:flex-initial">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                        }}
                                        placeholder={t('pools.searchPlaceholder')}
                                        className="w-full sm:w-full md:w-[11vw] lg:w-[15vw] xl:w-[17vw] rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none dark:bg-gray-800/50 bg-gray-50/80 backdrop-blur-sm dark:border-white/20 border-gray-300/50 dark:text-white text-gray-900 tracking-wide shadow-sm focus:border-theme-primary-500/50 focus:ring-1 focus:ring-theme-primary-500/30 placeholder:text-gray-500 dark:placeholder:text-gray-400 placeholder:text-xs transition-all duration-200"
                                    />
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                                </div>
                            </div>
                        </div>

                        {/* Create Pool Button */}
                        <div className="flex items-center justify-center md:justify-end">
                            <Button
                                className="w-full md:w-auto
                                    bg-gradient-to-r from-theme-primary-500 to-theme-primary-400 
                                    hover:from-theme-primary-400 hover:to-theme-primary-500
                                    rounded-full 
                                    text-white font-semibold tracking-wide
                                    transition-all duration-300
                                    border-0
                                    text-xs sm:text-sm
                                    px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 h-auto"
                                onClick={() => setIsCreateModalOpen(true)}
                            >
                                {t('pools.createPoolBtn')}
                            </Button>
                        </div>
                    </div>



                    {/* Table View - Hidden on mobile/tablet */}
                    {viewStyle === 'table' && !isMobileOrTablet && (
                    <div 
                        className="overflow-hidden z-20 rounded-xl sm:rounded-2xl md:rounded-3xl backdrop-blur-xl"
                        style={{
                            background: mountedTheme && isDark
                                ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.4) 100%)'
                                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.6) 100%)',
                            border: mountedTheme && isDark
                                ? '1px solid rgba(107, 114, 128, 0.3)'
                                : '1px solid rgba(156, 163, 175, 0.3)',
                            boxShadow: mountedTheme && isDark
                                ? '0 8px 32px -8px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(107, 114, 128, 0.1) inset'
                                : '0 8px 32px -8px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(156, 163, 175, 0.1) inset',
                        }}
                    >
                        <div className="overflow-x-auto scrollbar-thin max-h-[60vh] sm:max-h-[65vh] md:max-h-[70vh] scroll-smooth">
                            <table className="min-w-full w-full">
                                <thead className="sticky top-0 z-10">
                                    <tr>
                                        <th 
                                            className="px-1 sm:px-2 md:px-3 py-1.5 sm:py-2 md:py-3 text-left text-[10px] sm:text-xs md:text-sm font-semibold w-[4%] sm:w-[3%] md:w-[2%]"
                                            style={{
                                                background: mountedTheme && isDark
                                                    ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.5) 100%)'
                                                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.7) 100%)',
                                                color: mountedTheme && isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                                                borderBottom: mountedTheme && isDark
                                                    ? '1px solid rgba(107, 114, 128, 0.3)'
                                                    : '1px solid rgba(156, 163, 175, 0.3)',
                                            }}
                                        >
                                            &ensp;
                                        </th>
                                        <th 
                                            className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-3 text-left text-[10px] sm:text-xs md:text-sm font-semibold min-w-[140px] sm:min-w-[180px]"
                                            style={{
                                                background: mountedTheme && isDark
                                                    ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.5) 100%)'
                                                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.7) 100%)',
                                                color: mountedTheme && isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                                                borderBottom: mountedTheme && isDark
                                                    ? '1px solid rgba(107, 114, 128, 0.3)'
                                                    : '1px solid rgba(156, 163, 175, 0.3)',
                                            }}
                                        >
                                            {t('pools.poolName')}
                                        </th>
                                        <th 
                                            className="hidden md:table-cell px-2 md:px-3 lg:px-4 py-1.5 sm:py-2 md:py-3 text-left text-[10px] sm:text-xs md:text-sm font-semibold"
                                            style={{
                                                background: mountedTheme && isDark
                                                    ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.5) 100%)'
                                                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.7) 100%)',
                                                color: mountedTheme && isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                                                borderBottom: mountedTheme && isDark
                                                    ? '1px solid rgba(107, 114, 128, 0.3)'
                                                    : '1px solid rgba(156, 163, 175, 0.3)',
                                            }}
                                        >
                                            {t('pools.uidLeader')}
                                        </th>
                                        <th 
                                            className="hidden lg:table-cell px-3 md:px-4 py-1.5 sm:py-2 md:py-3 text-left text-[10px] sm:text-xs md:text-sm font-semibold"
                                            style={{
                                                background: mountedTheme && isDark
                                                    ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.5) 100%)'
                                                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.7) 100%)',
                                                color: mountedTheme && isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                                                borderBottom: mountedTheme && isDark
                                                    ? '1px solid rgba(107, 114, 128, 0.3)'
                                                    : '1px solid rgba(156, 163, 175, 0.3)',
                                            }}
                                        >
                                            {t('pools.leaderAddress')}
                                        </th>
                                        <th 
                                            className="px-1.5 sm:px-2 md:px-3 py-1.5 sm:py-2 md:py-3 text-left text-[10px] sm:text-xs md:text-sm font-semibold w-[10%] sm:w-[8%]"
                                            style={{
                                                background: mountedTheme && isDark
                                                    ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.5) 100%)'
                                                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.7) 100%)',
                                                color: mountedTheme && isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                                                borderBottom: mountedTheme && isDark
                                                    ? '1px solid rgba(107, 114, 128, 0.3)'
                                                    : '1px solid rgba(156, 163, 175, 0.3)',
                                            }}
                                        >
                                            <span className="hidden sm:inline">{t('pools.members')}</span>
                                            <span className="sm:hidden">#</span>
                                        </th>
                                        <th 
                                            className="hidden sm:table-cell px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-3 text-left text-[10px] sm:text-xs md:text-sm font-semibold w-[12%]"
                                            style={{
                                                background: mountedTheme && isDark
                                                    ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.5) 100%)'
                                                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.7) 100%)',
                                                color: mountedTheme && isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                                                borderBottom: mountedTheme && isDark
                                                    ? '1px solid rgba(107, 114, 128, 0.3)'
                                                    : '1px solid rgba(156, 163, 175, 0.3)',
                                            }}
                                        >
                                            {t('pools.round')}
                                        </th>
                                        <th 
                                            className="hidden md:table-cell px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold w-[12%]"
                                            style={{
                                                background: mountedTheme && isDark
                                                    ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.5) 100%)'
                                                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.7) 100%)',
                                                color: mountedTheme && isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                                                borderBottom: mountedTheme && isDark
                                                    ? '1px solid rgba(107, 114, 128, 0.3)'
                                                    : '1px solid rgba(156, 163, 175, 0.3)',
                                            }}
                                        >
                                            {t('pools.volume')}
                                        </th>
                                        <th 
                                            className="hidden lg:table-cell px-3 md:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold w-[10%]"
                                            style={{
                                                background: mountedTheme && isDark
                                                    ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.5) 100%)'
                                                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.7) 100%)',
                                                color: mountedTheme && isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                                                borderBottom: mountedTheme && isDark
                                                    ? '1px solid rgba(107, 114, 128, 0.3)'
                                                    : '1px solid rgba(156, 163, 175, 0.3)',
                                            }}
                                        >
                                            {t('pools.created')}
                                        </th>
                                        <th 
                                            className="px-1.5 sm:px-2 md:px-3 py-1.5 sm:py-2 md:py-3 text-left text-[10px] sm:text-xs md:text-sm font-semibold w-[12%] sm:w-[10%]"
                                            style={{
                                                background: mountedTheme && isDark
                                                    ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.5) 100%)'
                                                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.7) 100%)',
                                                color: mountedTheme && isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                                                borderBottom: mountedTheme && isDark
                                                    ? '1px solid rgba(107, 114, 128, 0.3)'
                                                    : '1px solid rgba(156, 163, 175, 0.3)',
                                            }}
                                        >
                                            {t('pools.action')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPools.map((pool: AirdropPool, index: number) => {
                                        const rankingColor = getColorRanking(index);
                                        const hasRankingColor = rankingColor !== "";
                                        
                                        return (
                                        <tr 
                                            key={pool.poolId} 
                                            className={`transition-all duration-200 hover:opacity-90 ${rankingColor} ${hasRankingColor ? 'backdrop-blur-md' : ''}`}
                                            style={{
                                                background: hasRankingColor 
                                                    ? undefined
                                                    : (index % 2 === 0
                                                        ? (mountedTheme && isDark
                                                            ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.2) 100%)'
                                                            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.3) 100%)')
                                                        : (mountedTheme && isDark
                                                            ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.15) 100%)'
                                                            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.4) 100%)')),
                                                ...(hasRankingColor ? {
                                                    backdropFilter: 'blur(16px)',
                                                    WebkitBackdropFilter: 'blur(16px)',
                                                    borderTop: mountedTheme && isDark
                                                        ? '1px solid rgba(255, 255, 255, 0.2)'
                                                        : '1px solid rgba(255, 255, 255, 0.3)',
                                                    borderRight: mountedTheme && isDark
                                                        ? '1px solid rgba(255, 255, 255, 0.2)'
                                                        : '1px solid rgba(255, 255, 255, 0.3)',
                                                    borderBottom: mountedTheme && isDark
                                                        ? '1px solid rgba(255, 255, 255, 0.2)'
                                                        : '1px solid rgba(255, 255, 255, 0.3)',
                                                    borderLeft: mountedTheme && isDark
                                                        ? '1px solid rgba(255, 255, 255, 0.2)'
                                                        : '1px solid rgba(255, 255, 255, 0.3)',
                                                    boxShadow: mountedTheme && isDark
                                                        ? '0 8px 32px -8px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
                                                        : '0 8px 32px -8px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.2) inset',
                                                } : {
                                                    borderTop: index > 0 ? (mountedTheme && isDark
                                                        ? '1px solid rgba(107, 114, 128, 0.2)'
                                                        : '1px solid rgba(156, 163, 175, 0.2)') : 'none',
                                                }),
                                            }}
                                        >
                                            <td 
                                                className="px-1 sm:px-2 md:px-3 py-1.5 sm:py-2 md:py-3 text-[10px] sm:text-xs md:text-sm"
                                            >
                                                <div className="flex items-center justify-center gap-1 sm:gap-2 md:gap-3">
                                                    {getImgRanking(index)}
                                                </div>
                                            </td>
                                            <td 
                                                className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-3 text-[10px] sm:text-xs md:text-sm"
                                            >
                                                <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                                                    <div 
                                                        className="relative flex-shrink-0 rounded-xl sm:rounded-2xl p-0.5 sm:p-1"
                                                        style={{
                                                            background: mountedTheme && isDark
                                                                ? 'linear-gradient(135deg, rgba(107, 114, 128, 0.2) 0%, rgba(107, 114, 128, 0.1) 100%)'
                                                                : 'linear-gradient(135deg, rgba(156, 163, 175, 0.15) 0%, rgba(156, 163, 175, 0.1) 100%)',
                                                            border: mountedTheme && isDark
                                                                ? '1px solid rgba(107, 114, 128, 0.4)'
                                                                : '1px solid rgba(156, 163, 175, 0.4)',
                                                            boxShadow: mountedTheme && isDark
                                                                ? '0 4px 12px -4px rgba(107, 114, 128, 0.2)'
                                                                : '0 4px 12px -4px rgba(156, 163, 175, 0.15)',
                                                        }}
                                                    >
                                                    <img
                                                        src={pool.logo || "/logo.png"}
                                                        alt={pool.name}
                                                            className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg sm:rounded-xl object-cover"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.src = "/logo.png";
                                                        }}
                                                    />
                                                    </div>
                                                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                                        <div 
                                                            className="font-bold text-xs sm:text-sm md:text-base truncate"
                                                            style={{
                                                                color: '#1FC16B',
                                                            }}
                                                        >
                                                            {pool.name}
                                                        </div>
                                                        <div 
                                                            className="text-[10px] sm:text-xs font-medium hidden sm:block"
                                                            style={{
                                                                color: mountedTheme && isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                                                            }}
                                                        >
                                                            {pool.memberCount} {t('pools.members')}
                                                        </div>
                                                        {/* Mobile: Show round and volume info */}
                                                        <div className="flex items-center gap-2 sm:hidden text-[9px]">
                                                            <span style={{ color: mountedTheme && isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}>
                                                                {t('pools.round')}: <span className="font-semibold font-mono">{formatNumber(pool.roundVolume)}</span>
                                                            </span>
                                                            {activeFilter === 'ranking' && (
                                                                <span style={{ color: mountedTheme && isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}>
                                                                    | {t('pools.volume')}: <span className="font-semibold">{formatNumber(pool.totalVolume)}</span>
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td 
                                                className="hidden md:table-cell px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-mono font-semibold"
                                                style={{
                                                    color: mountedTheme && isDark ? 'rgba(255, 255, 255)' : 'rgba(0, 0, 0)',
                                                }}
                                            >
                                                {pool?.creatorBittworldUid || "N/A"}
                                            </td>
                                            <td 
                                                className="hidden lg:table-cell px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm dark:text-yellow-400 text-amber-600"
                                                                                    >
                                                <div className="flex items-center gap-2">
                                                    <span className="italic">{truncateString(pool.creatorAddress, 12)}</span>
                                                    <Copy 
                                                        className="w-3 h-3 cursor-pointer hover:opacity-70 transition-opacity flex-shrink-0" 
                                                        onClick={() => {
                                                    navigator.clipboard.writeText(pool.creatorAddress)
                                                    toast.success(t('pools.detailPage.copiedToClipboard'))
                                                        }} 
                                                    />
                                                </div>
                                            </td>
                                            <td 
                                                className="px-1.5 sm:px-2 md:px-3 py-1.5 sm:py-2 md:py-3 text-[10px] sm:text-xs md:text-sm font-semibold"
                                                style={{
                                                    color: mountedTheme && isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                                                }}
                                            >
                                                {pool.memberCount}
                                            </td>
                                            <td 
                                                className="hidden sm:table-cell px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-3 text-[10px] sm:text-xs md:text-sm font-mono font-semibold"
                                                style={{
                                                    color: mountedTheme && isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                                                }}
                                            >
                                                {formatNumber(pool.roundVolume)}
                                            </td>
                                            <td 
                                                className="hidden md:table-cell px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-3 text-[10px] sm:text-xs md:text-sm font-semibold"
                                                style={{
                                                    color: mountedTheme && isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                                                }}
                                            >
                                                {formatNumber(pool.totalVolume)}
                                            </td>
                                            <td 
                                                className="hidden lg:table-cell px-3 md:px-4 py-1.5 sm:py-2 md:py-3 text-[10px] sm:text-xs md:text-sm font-medium"
                                                style={{
                                                    color: mountedTheme && isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                                                }}
                                            >
                                                {formatDate(pool.creationDate)}
                                            </td>
                                            <td 
                                                className="px-1.5 sm:px-2 md:px-3 py-1.5 sm:py-2 md:py-3 text-[10px] sm:text-xs md:text-sm"
                                            >
                                                <Button
                                                    size="sm"
                                                    className="bg-transparent border border-theme-primary-500 text-theme-primary-500 dark:text-white 
                                                        hover:bg-gradient-to-r hover:from-theme-primary-400 hover:to-theme-primary-500 hover:text-white 
                                                        text-[10px] sm:text-xs px-1.5 sm:px-2 md:px-3 lg:px-4 py-0.5 sm:py-1 rounded-md sm:rounded-lg transition-all duration-300 whitespace-nowrap"
                                                    onClick={() => router.push(`/pools/${pool.poolId}`)}
                                                >
                                                    <span className="hidden sm:inline">{t('pools.detail')}</span>
                                                    <span className="sm:hidden">→</span>
                                                </Button>
                                            </td>
                                        </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    )}
                    
                    {/* Grid View */}
                    {viewStyle === 'grid' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                            {filteredPools.map((pool: AirdropPool, index: number) => {
                                const rankingColor = getColorRanking(index);
                                const hasRankingColor = rankingColor !== "";
                                
                                return (
                                    <div
                                        key={pool.poolId}
                                        className={`rounded-xl transition-all duration-300 hover:scale-[1.02] ${rankingColor}`}
                                        style={{
                                            background: hasRankingColor
                                                ? undefined
                                                : (mountedTheme && isDark
                                                    ? '#000000'
                                                    : '#ffffff'),
                                            border: hasRankingColor
                                                ? (mountedTheme && isDark
                                                    ? '1px solid rgba(255, 255, 255, 0.25)'
                                                    : '1px solid rgba(31, 193, 107, 0.2)')
                                                : (mountedTheme && isDark
                                                    ? '1px solid rgba(255, 255, 255, 0.1)'
                                                    : '1px solid rgba(156, 163, 175, 0.2)'),
                                            boxShadow: hasRankingColor
                                                ? (mountedTheme && isDark
                                                    ? '0 8px 32px -8px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.15) inset, 0 4px 16px -4px rgba(255, 255, 255, 0.1)'
                                                    : '0 8px 32px -8px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(31, 193, 107, 0.1) inset, 0 4px 16px -4px rgba(31, 193, 107, 0.08)')
                                                : (mountedTheme && isDark
                                                    ? '0 4px 12px -4px rgba(0, 0, 0, 0.5)'
                                                    : '0 4px 12px -4px rgba(0, 0, 0, 0.1)'),
                                        }}
                                    >
                                        <div className="p-4 sm:p-5 space-y-4">
                                            {/* Header with Logo and Name */}
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div 
                                                        className="relative flex-shrink-0 rounded-2xl p-1"
                                                        style={{
                                                            background: mountedTheme && isDark
                                                                ? 'linear-gradient(135deg, rgba(107, 114, 128, 0.2) 0%, rgba(107, 114, 128, 0.1) 100%)'
                                                                : 'linear-gradient(135deg, rgba(156, 163, 175, 0.15) 0%, rgba(156, 163, 175, 0.1) 100%)',
                                                            border: mountedTheme && isDark
                                                                ? '1px solid rgba(107, 114, 128, 0.4)'
                                                                : '1px solid rgba(156, 163, 175, 0.4)',
                                                            boxShadow: mountedTheme && isDark
                                                                ? '0 4px 12px -4px rgba(107, 114, 128, 0.2)'
                                                                : '0 4px 12px -4px rgba(156, 163, 175, 0.15)',
                                                        }}
                                                    >
                                                    <img
                                                        src={pool.logo || "/logo.png"}
                                                        alt={pool.name}
                                                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.src = "/logo.png";
                                                        }}
                                                    />
                                                    </div>
                                                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                                        <div 
                                                            className="font-bold text-sm sm:text-base truncate"
                                                            style={{
                                                                color: '#1FC16B',
                                                            }}
                                                        >
                                                            {pool.name}
                                                </div>
                                                        <div 
                                                            className="text-xs font-medium"
                                                            style={{
                                                                color: mountedTheme && isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.7)',
                                                            }}
                                                        >
                                                            {pool.memberCount} {t('pools.members')}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Ranking Badge */}
                                            {activeFilter === 'ranking' && getImgRanking(index)}
                                            
                                            {/* Pool Info */}
                                            <div className="space-y-2 text-xs">
                                                <div className="flex justify-between items-center">
                                                    <span style={{ color: mountedTheme && isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.7)' }}>
                                                        {t('pools.uidLeader')}:
                                                    </span>
                                                    <span 
                                                        className="font-mono font-semibold"
                                                        style={{ color: mountedTheme && isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)' }}
                                                    >
                                                {pool?.creatorBittworldUid || "N/A"}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span style={{ color: mountedTheme && isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.7)' }}>
                                                        {t('pools.leaderAddress')}:
                                                    </span>
                                                    <div className="flex items-center gap-1">
                                                        <span 
                                                            className="font-mono italic text-xs"
                                                            style={{ color: mountedTheme && isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)' }}
                                                        >
                                                            {truncateString(pool.creatorAddress, 8)}
                                                        </span>
                                                        <Copy 
                                                            className="w-3 h-3 cursor-pointer hover:opacity-70 transition-opacity flex-shrink-0" 
                                                            onClick={() => {
                                                    navigator.clipboard.writeText(pool.creatorAddress)
                                                    toast.success(t('pools.detailPage.copiedToClipboard'))
                                                            }}
                                                            style={{ color: mountedTheme && isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.7)' }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span style={{ color: mountedTheme && isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.7)' }}>
                                                        {t('pools.round')}:
                                                    </span>
                                                    <span 
                                                        className="font-mono font-semibold"
                                                        style={{ color: '#1FC16B' }}
                                                    >
                                                        {formatNumber(pool.roundVolume)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span style={{ color: mountedTheme && isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.7)' }}>
                                                        {t('pools.volume')}:
                                                    </span>
                                                    <span 
                                                        className="font-semibold"
                                                        style={{ color: '#1FC16B' }}
                                                    >
                                                {formatNumber(pool.totalVolume)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span style={{ color: mountedTheme && isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.7)' }}>
                                                        {t('pools.created')}:
                                                    </span>
                                                    <span style={{ color: mountedTheme && isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)' }}>
                                                {formatDate(pool.creationDate)}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            {/* Action Button */}
                                            <Button
                                                size="sm"
                                                className="w-full bg-transparent border border-theme-primary-500 text-theme-primary-500 dark:text-white 
                                                    hover:bg-gradient-to-r hover:from-theme-primary-400 hover:to-theme-primary-500 hover:text-white 
                                                    text-xs py-2 rounded-lg transition-all duration-300"
                                                onClick={() => router.push(`/pools/${pool.poolId}`)}
                                            >
                                                {t('pools.detail')}
                                            </Button>
                        </div>
                    </div>
                                );
                            })}
                        </div>
                    )}
                    
                    {/* Loading State */}
                    {isLoadingPools && (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary-500 mx-auto"></div>
                            <p className="mt-2 text-gray-500">{t('pools.loadingPools')}</p>
                        </div>
                    )}

                    {filteredPools.length === 0 && !isLoadingPools && (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <p className="text-sm sm:text-base">
                                {activeFilter === 'all'
                                    ? t('pools.noResult')
                                    : activeFilter === 'created'
                                        ? t('pools.noCreatedPools')
                                        : t('pools.noJoinedPools')
                                }
                            </p>
                        </div>
                    )}
                </div>
            </main>

            {/* Create Pool Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={handleCloseModal}>
                <DialogContent 
                    className="w-[95vw] sm:max-w-[500px] p-4 sm:p-5 sm:p-6"
                    style={{
                        position: 'fixed',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: mountedTheme && isDark
                            ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.75) 100%)'
                            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%)',
                        border: mountedTheme && isDark
                            ? '1px solid rgba(31, 193, 107, 0.4)'
                            : '1px solid rgba(31, 193, 107, 0.3)',
                        boxShadow: mountedTheme && isDark
                            ? '0 0 0 1px rgba(31, 193, 107, 0.3), 0 0 30px rgba(31, 193, 107, 0.25), 0 0 60px rgba(31, 193, 107, 0.15), 0 20px 60px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(107, 114, 128, 0.1) inset, 0 8px 32px -8px rgba(107, 114, 128, 0.15)'
                            : '0 0 0 1px rgba(31, 193, 107, 0.25), 0 0 30px rgba(31, 193, 107, 0.2), 0 0 60px rgba(31, 193, 107, 0.1), 0 20px 60px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(156, 163, 175, 0.1) inset, 0 8px 32px -8px rgba(156, 163, 175, 0.1)',
                    }}
                >
                    {/* Gradient Glow Overlay */}
                    {mountedTheme && (
                        <div 
                            className="absolute inset-0 pointer-events-none rounded-xl sm:rounded-2xl opacity-40"
                            style={{
                                background: isDark
                                    ? 'linear-gradient(135deg, rgba(31, 193, 107, 0.15) 0%, rgba(31, 193, 107, 0.05) 50%, rgba(31, 193, 107, 0.15) 100%)'
                                    : 'linear-gradient(135deg, rgba(31, 193, 107, 0.12) 0%, rgba(31, 193, 107, 0.04) 50%, rgba(31, 193, 107, 0.12) 100%)',
                            }}
                        />
                    )}
                    <div className="relative z-10">
                    <DialogHeader>
                        <DialogTitle>
                            {t('pools.createTitle')}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* Image Upload Area */}
                        <div className="relative">
                            <input
                                type="file"
                                id="pool-image"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                            {imagePreview ? (
                                <div 
                                    className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-sm"
                                    style={{
                                        background: mountedTheme && isDark
                                            ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.2) 100%)'
                                            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.4) 100%)',
                                        border: mountedTheme && isDark
                                            ? '1px solid rgba(107, 114, 128, 0.2)'
                                            : '1px solid rgba(156, 163, 175, 0.2)',
                                    }}
                                >
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-full border-2"
                                        style={{
                                            borderColor: mountedTheme && isDark
                                                ? 'rgba(107, 114, 128, 0.3)'
                                                : 'rgba(156, 163, 175, 0.3)',
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            setImagePreview(null)
                                            setCreateForm(prev => ({ ...prev, image: null }))
                                        }}
                                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ) : (
                                <div 
                                    className={`flex flex-col items-center justify-center pt-4 sm:pt-5 pb-5 sm:pb-6 rounded-xl sm:rounded-2xl cursor-pointer border-2 border-dashed transition-all duration-300 backdrop-blur-sm ${
                                        isDragOver 
                                            ? 'border-theme-primary-500' 
                                            : ''
                                    }`}
                                    style={{
                                        background: isDragOver
                                            ? (mountedTheme && isDark
                                                ? 'linear-gradient(135deg, rgba(31, 193, 107, 0.15) 0%, rgba(31, 193, 107, 0.1) 100%)'
                                                : 'linear-gradient(135deg, rgba(31, 193, 107, 0.12) 0%, rgba(31, 193, 107, 0.08) 100%)')
                                            : (mountedTheme && isDark
                                                ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.2) 100%)'
                                                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.4) 100%)'),
                                        borderColor: isDragOver
                                            ? '#1FC16B'
                                            : (mountedTheme && isDark
                                                ? 'rgba(107, 114, 128, 0.3)'
                                                : 'rgba(156, 163, 175, 0.3)'),
                                    }}
                                    onClick={() => document.getElementById('pool-image')?.click()}
                                    onDragOver={handleDragOver}
                                    onDragEnter={handleDragEnter}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    <Upload className={`w-6 h-6 sm:w-8 sm:h-8 mb-3 sm:mb-4 transition-colors ${
                                        isDragOver 
                                            ? 'text-theme-primary-500' 
                                            : (mountedTheme && isDark ? 'text-gray-400' : 'text-gray-500')
                                    }`} />
                                    <p className={`mb-2 text-xs sm:text-sm text-center transition-colors ${
                                        isDragOver 
                                            ? 'text-theme-primary-500' 
                                            : (mountedTheme && isDark ? 'text-gray-400' : 'text-gray-600')
                                    }`}>
                                        <span className="font-semibold">{t('pools.uploadImage')}</span> {t('pools.uploadDragDrop')}
                                    </p>
                                    <p className={`text-xs text-center transition-colors ${
                                        isDragOver 
                                            ? 'text-theme-primary-500' 
                                            : (mountedTheme && isDark ? 'text-gray-500' : 'text-gray-500')
                                    }`}>
                                        {t('pools.uploadFormats')}
                                    </p>
                                    {isDragOver && (
                                        <p className="text-xs text-theme-primary-500 font-medium mt-2">
                                            {t('pools.dropImageHere') || 'Drop image here'}
                                        </p>
                                    )}
                                </div>
                            )}
                            <div className="flex justify-center my-4">
                                <Button 
                                    className="text-xs sm:text-sm" 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={openLogoPicker}
                                    style={{
                                        borderColor: mountedTheme && isDark
                                            ? 'rgba(107, 114, 128, 0.3)'
                                            : 'rgba(156, 163, 175, 0.3)',
                                        background: mountedTheme && isDark
                                            ? 'rgba(0, 0, 0, 0.2)'
                                            : 'rgba(255, 255, 255, 0.3)',
                                    }}
                                >
                                    {t('pools.chooseFromSystem') ?? 'Choose from gallery'}
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {/* Pool Name */}
                        <div>
                            <FloatLabelInput
                                id="pool-name"
                                type="text"
                                label={`${t('pools.nameLabel')} *`}
                                value={createForm.name}
                                onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                                className="dark:bg-gray-800/50 bg-gray-50/80 backdrop-blur-sm dark:border-white/20 border-gray-300/50 rounded-xl dark:text-white text-gray-900 tracking-wide shadow-sm focus:border-theme-primary-500/50 focus:ring-1 focus:ring-theme-primary-500/30 text-sm sm:text-base"
                            />
                        </div>

                        <div>
                            <FloatLabelInput
                                id="pool-amount"
                                type="text"
                                label={`${t('pools.amountLabel')} * (Min: 500,000)`}
                                value={formatInputNumber(createForm.amount)}
                                onChange={(e) => {
                                    const cleanValue = e.target.value.replace(/[^\d]/g, '') // Chỉ cho phép số
                                    const num = Number(cleanValue)
                                    if (!isNaN(num)) {
                                        setCreateForm(prev => ({ ...prev, amount: num }))
                                    }
                                }}
                                className="dark:bg-gray-800/50 bg-gray-50/80 backdrop-blur-sm dark:border-white/20 border-gray-300/50 rounded-xl dark:text-white text-gray-900 tracking-wide shadow-sm focus:border-theme-primary-500/50 focus:ring-1 focus:ring-theme-primary-500/30 text-sm sm:text-base"
                            />
                        </div>

                        {/* Pool Description */}
                        <div>
                            <FloatLabelTextarea
                                id="pool-description"
                                label={`${t('pools.descLabel')} *`}
                                value={createForm.description}
                                onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                                className="dark:bg-gray-800/50 bg-gray-50/80 backdrop-blur-sm dark:border-white/20 border-gray-300/50 rounded-xl dark:text-white text-gray-900 tracking-wide shadow-sm focus:border-theme-primary-500/50 focus:ring-1 focus:ring-theme-primary-500/30 min-h-[80px] sm:min-h-[100px] text-sm sm:text-base"
                            />
                        </div>
                        <div className="flex items-start gap-2">
                            <Checkbox
                                id="pool-required"
                                checked={createForm.required}
                                onCheckedChange={(checked) => setCreateForm(prev => ({ ...prev, required: checked === true }))}
                            />
                            <div className="flex flex-col items-start gap-1">
                                <div className={`text-xs italic leading-4 ${mountedTheme && isDark ? 'text-red-400' : 'text-red-500'}`}>{t('pools.lockNote')}</div>
                                <div className={`text-xs italic leading-4 ${mountedTheme && isDark ? 'text-red-400' : 'text-red-500'}`}>{t('pools.required')}</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center w-full items-center mt-4">
                        <Button
                            onClick={handleCreatePool}
                            disabled={isSubmitting || createPoolMutation.isPending || !createForm.required}
                            className="w-full 
                                bg-gradient-to-r from-theme-primary-500 to-theme-primary-400 
                                hover:from-theme-primary-400 hover:to-theme-primary-500
                                rounded-full 
                                text-white font-semibold tracking-wide
                                transition-all duration-300
                                border-0
                                text-sm sm:text-base px-6 py-2.5 sm:py-2"
                        >
                            {(isSubmitting || createPoolMutation.isPending) ? t('pools.creating') : t('pools.createBtn')}
                        </Button>
                    </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* System Logo Picker */}
            <Dialog open={isLogoPickerOpen} onOpenChange={setIsLogoPickerOpen}>
                <DialogContent 
                    className="lg:max-w-2xl w-[90vw] p-4 sm:p-5 sm:p-6 relative"
                    style={{
                        position: 'fixed',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: mountedTheme && isDark
                            ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.75) 100%)'
                            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%)',
                        border: mountedTheme && isDark
                            ? '1px solid rgba(31, 193, 107, 0.4)'
                            : '1px solid rgba(31, 193, 107, 0.3)',
                        boxShadow: mountedTheme && isDark
                            ? '0 0 0 1px rgba(31, 193, 107, 0.3), 0 0 30px rgba(31, 193, 107, 0.25), 0 0 60px rgba(31, 193, 107, 0.15), 0 20px 60px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(107, 114, 128, 0.1) inset, 0 8px 32px -8px rgba(107, 114, 128, 0.15)'
                            : '0 0 0 1px rgba(31, 193, 107, 0.25), 0 0 30px rgba(31, 193, 107, 0.2), 0 0 60px rgba(31, 193, 107, 0.1), 0 20px 60px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(156, 163, 175, 0.1) inset, 0 8px 32px -8px rgba(156, 163, 175, 0.1)',
                    }}
                >
                    {/* Gradient Glow Overlay */}
                    {mountedTheme && (
                        <div 
                            className="absolute inset-0 pointer-events-none rounded-xl sm:rounded-2xl opacity-40"
                            style={{
                                background: isDark
                                    ? 'linear-gradient(135deg, rgba(31, 193, 107, 0.15) 0%, rgba(31, 193, 107, 0.05) 50%, rgba(31, 193, 107, 0.15) 100%)'
                                    : 'linear-gradient(135deg, rgba(31, 193, 107, 0.12) 0%, rgba(31, 193, 107, 0.04) 50%, rgba(31, 193, 107, 0.12) 100%)',
                            }}
                        />
                    )}
                    <div className="relative z-10">
                    <DialogHeader>
                        <DialogTitle>{t('pools.createTitle')}</DialogTitle>
                    </DialogHeader>
                    <div className="md:max-h-[74vh] max-h-[67vh] overflow-y-auto scrollbar-thin">
                        {isLoadingBoxLogos ? (
                            <div className={`text-sm text-center py-8 ${mountedTheme && isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {t('common.loading')}
                            </div>
                        ) : boxLogos.length === 0 ? (
                            <div className={`text-sm text-center py-8 ${mountedTheme && isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {t('pools.noSystemImages') ?? 'No images found'}
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
                                {boxLogos.map((url) => (
                                    <button
                                        key={url}
                                        type="button"
                                        className="rounded-lg p-2 sm:p-3 flex items-center justify-center transition-all duration-300 backdrop-blur-sm hover:scale-105 focus:outline-none"
                                        style={{
                                            background: mountedTheme && isDark
                                                ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.2) 100%)'
                                                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.4) 100%)',
                                            border: mountedTheme && isDark
                                                ? '1px solid rgba(107, 114, 128, 0.2)'
                                                : '1px solid rgba(156, 163, 175, 0.2)',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = '#1FC16B';
                                            e.currentTarget.style.background = mountedTheme && isDark
                                                ? 'linear-gradient(135deg, rgba(31, 193, 107, 0.15) 0%, rgba(31, 193, 107, 0.1) 100%)'
                                                : 'linear-gradient(135deg, rgba(31, 193, 107, 0.12) 0%, rgba(31, 193, 107, 0.08) 100%)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = mountedTheme && isDark
                                                ? 'rgba(107, 114, 128, 0.2)'
                                                : 'rgba(156, 163, 175, 0.2)';
                                            e.currentTarget.style.background = mountedTheme && isDark
                                                ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.2) 100%)'
                                                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.4) 100%)';
                                        }}
                                        onClick={() => {
                                            setImagePreview(url)
                                            setCreateForm(prev => ({ ...prev, image: url }))
                                            setIsLogoPickerOpen(false)
                                        }}
                                    >
                                        <img 
                                            src={url} 
                                            alt="logo" 
                                            className="w-10 h-10 sm:w-12 sm:h-12 md:w-20 md:h-20 object-cover rounded-md" 
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
