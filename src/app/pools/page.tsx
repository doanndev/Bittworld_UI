"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, Star, Settings, ChevronDown, Copy, Upload, X } from "lucide-react"
import { Button } from "@/app/components/ui/button"
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
        amount: 1000000,
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

        if (createForm.amount < 1000000) {
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
        if (stakeAmount < 1000000) {
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
                amount: 1000000
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
            return "bg-gradient-to-r from-[#068b81] to-[#026669]";
        } else if (activeFilter === 'ranking' && index === 1) {
            return "bg-gradient-to-r from-[#569200] to-[#1C5400]";
        } else if (activeFilter === 'ranking' && index === 2) {
            return "bg-gradient-to-r from-[#0059D0] to-[#002F92]";
        }
        return "";
    }
    const getImgRanking = (index: number) => {
        if (activeFilter === 'ranking' && index === 0) {
            return <img src={"/firsth.png"} alt="ranking" className="w-10 h-12" />
        } else if (activeFilter === 'ranking' && index === 1) {
            return <img src={"/sectionth.png"} alt="ranking" className="w-10 h-12" />
        } else if (activeFilter === 'ranking' && index === 2) {
            return <img src={"/threeth.png"} alt="ranking" className="w-10 h-12" />
        } else {
            return <div className="md:w-10 md:h-12 w-8 h-8 flex items-center justify-center">{index + 1}</div>
        }
    }

    return (
        <div className="flex-1 bg-white dark:bg-black text-gray-900 dark:text-white">
            {/* Main Content */}
            <main className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-10">
                <div className="2xl:container mx-auto ">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-theme-primary-500 mb-6 sm:mb-8 lg:mb-12">BITTWORLD POOL</h1>

                    {/* Search and Actions */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-6">
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <Button
                                    className={`text-xs flex-1 sm:text-sm font-medium px-3 sm:px-4 py-2 sm:py-2 h-auto sm:max-h-[30px] w-full sm:w-auto transition-colors ${activeFilter === 'all'
                                        ? 'text-theme-primary-500 underline underline-offset-8'
                                        : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                    onClick={() => handleFilterChange('all')}
                                >
                                    {t('pools.filterAll')}
                                </Button>
                                <Button
                                    className={`text-xs flex-1 sm:text-sm font-medium px-3 sm:px-4 py-2 sm:py-2 h-auto sm:max-h-[30px] w-full sm:w-auto transition-colors ${activeFilter === 'ranking'
                                        ? 'text-theme-primary-500 underline underline-offset-8'
                                        : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                    onClick={() => handleFilterChange('ranking')}
                                >
                                    {t('pools.filterRanking')}
                                </Button>
                                <Button
                                    className={`text-xs flex-1 sm:text-sm font-medium px-3 sm:px-4 py-2 sm:py-2 h-auto sm:max-h-[30px] w-full sm:w-auto transition-colors ${activeFilter === 'created'
                                        ? 'text-theme-primary-500 underline underline-offset-8'
                                        : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                    onClick={() => handleFilterChange('created')}
                                >
                                    {t('pools.filterCreated')}
                                </Button>
                                <Button
                                    className={`text-xs flex-1 sm:text-sm font-medium px-3 sm:px-4 py-2 sm:py-2 h-auto sm:max-h-[30px] w-full sm:w-auto transition-colors ${activeFilter === 'joined'
                                        ? 'text-theme-primary-500 underline underline-offset-8'
                                        : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                    onClick={() => handleFilterChange('joined')}
                                >
                                    {t('pools.filterJoined')}
                                </Button>
                            </div>
                            <div className="relative w-full sm:w-auto">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                    }}
                                    placeholder={t('pools.searchPlaceholder')}
                                    className="w-full sm:w-[11vw] xl:w-[17vw] rounded-full py-1.5 pl-10 pr-4 text-sm focus:outline-none bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 border border-gray-300 dark:border-gray-600 placeholder:text-gray-500 dark:placeholder:text-gray-400 placeholder:text-xs"
                                />
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                            </div>
                        </div>


                        <div className="flex space-x-4 w-full sm:w-auto">
                            <div className="flex space-x-4 w-full sm:w-auto">
                                <Button
                                    className="bg-theme-primary-500 text-white text-xs sm:text-sm font-medium hover:bg-green-500 px-3 sm:px-4 py-2 sm:py-2 h-auto sm:max-h-[30px] w-full sm:w-auto"
                                    onClick={() => router.push('/airdrop-rewards')}
                                >
                                    {t('airdropRewards.title')}
                                </Button>
                            </div>
                            <div className="flex space-x-4 w-full sm:w-auto">
                                <Button
                                    className="bg-theme-primary-500 text-white text-xs sm:text-sm font-medium hover:bg-green-500 px-3 sm:px-4 py-2 sm:py-2 h-auto sm:max-h-[30px] w-full sm:w-auto"
                                    onClick={() => setIsCreateModalOpen(true)}
                                >
                                    {t('pools.createPoolBtn')}
                                </Button>
                            </div>
                        </div>
                    </div>



                    {/* Mobile Card Layout */}
                    <div className="sm:hidden space-y-3">
                        {filteredPools.map((pool: AirdropPool, index: number) => (
                            <div key={pool.poolId} className={`bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none ${getColorRanking(index)}`}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        {getImgRanking(index)}
                                        <img
                                            src={pool.logo || "/logo.png"}
                                            alt={pool.name}
                                            className="w-8 h-8 rounded-full"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = "/logo.png";
                                            }}
                                        />
                                        <div>
                                            <div className="font-medium text-sm text-gray-900 dark:text-white">{pool.name}</div>
                                            <div className="text-xs text-gray-500 dark:text-white">{pool.memberCount} {t('pools.members')}</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleFavorite(pool.poolId.toString())}
                                        className="text-white hover:text-yellow-500 dark:text-white dark:hover:text-yellow-400 transition-colors p-1"
                                    >
                                        <Star className={`w-5 h-5 ${favoritePools.includes(pool.poolId.toString()) ? "fill-yellow-500 text-yellow-500 dark:fill-yellow-400 dark:text-yellow-400" : ""}`} />
                                    </button>
                                </div>

                                <div className="space-y-2 text-xs mb-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-white">{t('pools.uidLeader')}:</span>
                                        <span className="font-mono text-gray-900 dark:text-white">{pool?.creatorBittworldUid || "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 dark:text-white">{t('pools.leaderAddress')}:</span>
                                        <span className="font-mono text-yellow-500 flex items-center gap-1">{truncateString(pool.creatorAddress, 12)} <Copy className="w-3 h-3 cursor-pointer" onClick={() => {
                                            navigator.clipboard.writeText(pool.creatorAddress)
                                            toast.success(t('pools.detailPage.copiedToClipboard'))
                                        }} /></span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-white">{t('pools.volume')}:</span>
                                        <span className="font-mono text-gray-900 dark:text-white">{formatNumber(pool.totalVolume)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-white">{t('pools.round')}:</span>
                                        <span className="font-mono text-gray-900 dark:text-white">{formatNumber(pool.roundVolume)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-white">{t('pools.created')}:</span>
                                        <span className="text-gray-900 dark:text-white">{formatDate(pool.creationDate)}</span>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <Button
                                        size="sm"
                                        className="w-full bg-transparent border border-theme-primary-500 text-theme-primary-500 dark:text-white hover:bg-theme-primary-500 hover:text-white text-xs py-2"
                                        onClick={() => router.push(`/pools/${pool.poolId}`)}
                                    >
                                        {t('pools.detail')}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Tablet Optimized Table */}
                    <div className="hidden sm:block lg:hidden overflow-hidden z-20 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900">
                        <div className="overflow-x-auto scrollbar-thin max-h-[60vh] scroll-smooth">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 w-[5%]">&ensp;</th>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 w-[30%]">{t('pools.poolName')}</th>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 w-[10%]">{t('pools.uidLeader')}</th>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 w-[10%]">{t('pools.leaderAddress')}</th>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 w-[10%]">{t('pools.members')}</th>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 w-[10%]">{t('pools.round')}</th>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 w-[10%]">{t('pools.volume')}</th>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 w-[10%]">{t('pools.action')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPools.map((pool: AirdropPool, index: number) => (
                                        <tr key={pool.poolId} className={`border-t border-gray-200 dark:border-gray-700 ${index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800"}`}>
                                            <td className="px-2 py-2 text-xs text-gray-900 dark:text-gray-300">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => toggleFavorite(pool.poolId.toString())}
                                                        className="text-gray-400 hover:text-yellow-500 dark:text-gray-500 dark:hover:text-yellow-400 transition-colors p-1"
                                                    >
                                                        <Star className={`w-4 h-4 ${favoritePools.includes(pool.poolId.toString()) ? "fill-yellow-500 text-yellow-500 dark:fill-yellow-400 dark:text-yellow-400" : ""}`} />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-2 py-2 text-xs text-gray-900 dark:text-gray-300">
                                                <div className="flex items-center gap-2">
                                                    <img
                                                        src={pool.logo || "/logo.png"}
                                                        alt={pool.name}
                                                        className="w-5 h-5 rounded-full"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.src = "/logo.png";
                                                        }}
                                                    />
                                                    <div className="flex flex-col">
                                                        <div className="font-medium">{pool.name}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">{pool.memberCount} {t('pools.members')}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-2 py-2 text-xs text-gray-900 dark:text-gray-300">
                                                {pool?.creatorBittworldUid || "N/A"}
                                            </td>
                                            <td className="px-2 py-2 text-xs text-gray-900 dark:text-gray-300">
                                                {truncateString(pool.creatorAddress, 12)} <Copy className="w-3 h-3 cursor-pointer" onClick={() => {
                                                    navigator.clipboard.writeText(pool.creatorAddress)
                                                    toast.success(t('pools.detailPage.copiedToClipboard'))
                                                }} />
                                            </td>
                                            <td className="px-2 py-2 text-xs text-gray-900 dark:text-gray-300">
                                                {pool.memberCount}
                                            </td>
                                            <td className="px-2 py-2 text-xs text-gray-900 dark:text-gray-300">
                                                <span className="font-mono">{formatNumber(pool.roundVolume)}</span>
                                            </td>
                                            <td className="px-2 py-2 text-xs text-gray-900 dark:text-gray-300">
                                                <Button
                                                    size="sm"
                                                    className="bg-transparent border border-theme-primary-500 text-theme-primary-500 dark:text-white hover:bg-theme-primary-500 hover:text-white text-xs px-2 py-1"
                                                    onClick={() => router.push(`/pools/${pool.poolId}`)}
                                                >
                                                    {t('pools.detail')}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Desktop Full Table */}
                    <div className="hidden lg:block overflow-hidden z-20 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900">
                        <div className="overflow-x-auto scrollbar-thin max-h-[65vh] scroll-smooth">
                            <table className="min-w-[800px] w-full">
                                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 w-[2%]">&ensp;</th>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 w-auto">{t('pools.poolName')}</th>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 w-auto">{t('pools.uidLeader')}</th>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 w-auto">{t('pools.leaderAddress')}</th>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 w-[8%]">{t('pools.members')}</th>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 w-[12%]">{t('pools.round')}</th>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 w-[12%]">{t('pools.volume')}</th>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 w-[10%]">{t('pools.created')}</th>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 w-[10%]"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPools.map((pool: AirdropPool, index: number) => (
                                        <tr key={pool.poolId} className={`border-t border-gray-200 dark:border-gray-700 ${getColorRanking(index)} ${index % 2 === 0 ? "bg-white dark:bg-[#171717]" : "bg-gray-50 dark:bg-[#525252]/60"}`}>
                                            <td className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-900 dark:text-white">
                                                <div className="flex items-center gap-3">
                                                    {getImgRanking(index)}
                                                </div>
                                            </td>
                                            <td className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-900 dark:text-white">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={pool.logo || "/logo.png"}
                                                        alt={pool.name}
                                                        className="w-5 h-5 sm:w-6 sm:h-6 rounded-full"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.src = "/logo.png";
                                                        }}
                                                    />
                                                    <div className="flex flex-col ml-1">
                                                        <div className="font-medium">{pool.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-900 dark:text-white">
                                                {pool?.creatorBittworldUid || "N/A"}
                                            </td>
                                            <td className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-yellow-500 italic flex items-center md:min-h-16 gap-2">
                                                {truncateString(pool.creatorAddress, 12)}
                                                <Copy className="w-3 h-3" onClick={() => {
                                                    navigator.clipboard.writeText(pool.creatorAddress)
                                                    toast.success(t('pools.detailPage.copiedToClipboard'))
                                                }} />
                                            </td>
                                            <td className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-900 dark:text-white">
                                                {pool.memberCount}
                                            </td>
                                            <td className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-[#6ae1ec]">
                                                <span className="font-mono font-semibold">{formatNumber(pool.roundVolume)}</span>
                                            </td>
                                            <td className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-900 dark:text-white">
                                                {formatNumber(pool.totalVolume)}
                                            </td>
                                            <td className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm italic text-gray-900 dark:text-white">
                                                {formatDate(pool.creationDate)}
                                            </td>
                                            <td className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-900 dark:text-white">
                                                <Button
                                                    size="sm"
                                                    className="bg-transparent border border-theme-primary-500 text-theme-primary-500 dark:text-white hover:bg-theme-primary-500 hover:text-white text-xs px-4 py-1"
                                                    onClick={() => {
                                                        router.push(`/pools/${pool.poolId}`)
                                                    }}
                                                >
                                                    {t('pools.detail')}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
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
                <DialogContent className="w-[95vw] sm:max-w-[500px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
                    <DialogHeader>
                        <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
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
                                <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-full border border-gray-300 dark:border-gray-600"
                                    />
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            setImagePreview(null)
                                            setCreateForm(prev => ({ ...prev, image: null }))
                                        }}
                                        className="absolute top-0 right-0 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                                    >
                                        <X className="w-2 h-2" />
                                    </button>
                                </div>
                            ) : (
                                <div 
                                    className={`flex flex-col items-center justify-center pt-4 sm:pt-5 pb-5 sm:pb-6 bg-gray-100 dark:bg-gray-800 rounded-md cursor-pointer border-2 border-dashed transition-colors ${
                                        isDragOver 
                                            ? 'border-theme-primary-500 bg-theme-primary-50 dark:bg-theme-primary-900/20' 
                                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                                    }`}
                                    onClick={() => document.getElementById('pool-image')?.click()}
                                    onDragOver={handleDragOver}
                                    onDragEnter={handleDragEnter}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    <Upload className={`w-6 h-6 sm:w-8 sm:h-8 mb-3 sm:mb-4 transition-colors ${
                                        isDragOver 
                                            ? 'text-theme-primary-500' 
                                            : 'text-gray-400 dark:text-gray-500'
                                    }`} />
                                    <p className={`mb-2 text-xs sm:text-sm text-center transition-colors ${
                                        isDragOver 
                                            ? 'text-theme-primary-600 dark:text-theme-primary-400' 
                                            : 'text-gray-600 dark:text-gray-400'
                                    }`}>
                                        <span className="font-semibold">{t('pools.uploadImage')}</span> {t('pools.uploadDragDrop')}
                                    </p>
                                    <p className={`text-xs text-center transition-colors ${
                                        isDragOver 
                                            ? 'text-theme-primary-500 dark:text-theme-primary-400' 
                                            : 'text-gray-500 dark:text-gray-500'
                                    }`}>
                                        {t('pools.uploadFormats')}
                                    </p>
                                    {isDragOver && (
                                        <p className="text-xs text-theme-primary-600 dark:text-theme-primary-400 font-medium mt-2">
                                            {t('pools.dropImageHere') || 'Drop image here'}
                                        </p>
                                    )}
                                </div>
                            )}
                            <div className="flex justify-center mt-4">
                                <Button className="text-xs sm:text-sm !border-white/50" variant="outline" size="sm" onClick={openLogoPicker}>
                                    {t('pools.chooseFromSystem') ?? 'Choose from gallery'}
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {/* Pool Name */}
                        <div className="space-y-2">
                            <Label htmlFor="pool-name" className="text-gray-900 dark:text-white text-sm sm:text-base">
                                {t('pools.nameLabel')} *
                            </Label>
                            <Input
                                id="pool-name"
                                value={createForm.name}
                                onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder={t('pools.namePlaceholder')}
                                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="pool-amount" className="text-gray-900 dark:text-white text-sm sm:text-base">
                                {t('pools.amountLabel')} * (Min: 1,000,000)
                            </Label>
                            <Input
                                id="pool-amount"
                                type="text"
                                value={formatInputNumber(createForm.amount)}
                                onChange={(e) => {
                                    const cleanValue = e.target.value.replace(/[^\d]/g, '') // Chỉ cho phép số
                                    const num = Number(cleanValue)
                                    if (!isNaN(num)) {
                                        setCreateForm(prev => ({ ...prev, amount: num }))
                                    }
                                }}
                                placeholder={t('pools.amountPlaceholder')}
                                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                            />
                        </div>

                        {/* Pool Description */}
                        <div className="space-y-2">
                            <Label htmlFor="pool-description" className="text-gray-900 dark:text-white text-sm sm:text-base">
                                {t('pools.descLabel')} *
                            </Label>
                            <Textarea
                                id="pool-description"
                                value={createForm.description}
                                onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                                placeholder={t('pools.descPlaceholder')}
                                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 min-h-[80px] sm:min-h-[100px] text-sm sm:text-base focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                            />
                        </div>
                        <div className="flex items-start gap-2">
                            <Checkbox
                                id="pool-required"
                                checked={createForm.required}
                                onCheckedChange={(checked) => setCreateForm(prev => ({ ...prev, required: checked === true }))}
                            />
                            <div className="flex flex-col items-start gap-1">
                                <div className="text-xs text-red-500 dark:text-red-400 italic leading-4">{t('pools.lockNote')}</div>
                                <div className="text-xs text-red-500 dark:text-red-400 italic leading-4">{t('pools.required')}</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center w-full items-center mt-4">
                        <Button
                            onClick={handleCreatePool}
                            disabled={isSubmitting || createPoolMutation.isPending || !createForm.required}
                            className="bg-theme-primary-500 text-white font-semibold hover:bg-green-500 text-sm sm:text-base px-6 py-2"
                        >
                            {(isSubmitting || createPoolMutation.isPending) ? t('pools.creating') : t('pools.createBtn')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* System Logo Picker */}
            <Dialog open={isLogoPickerOpen} onOpenChange={setIsLogoPickerOpen}>
                <DialogContent className="bg-white dark:bg-gray-800 lg:max-w-2xl w-[90vw]">
                    <DialogHeader>
                        <DialogTitle className="text-base sm:text-lg">{t('pools.createTitle')}</DialogTitle>
                    </DialogHeader>
                    <div className="md:max-h-[74vh] max-h-[67vh] overflow-y-auto">
                        {isLoadingBoxLogos ? (
                            <div className="text-sm text-gray-500 dark:text-gray-400">{t('common.loading')}</div>
                        ) : boxLogos.length === 0 ? (
                            <div className="text-sm text-gray-500 dark:text-gray-400">{t('pools.noSystemImages') ?? 'No images found'}</div>
                        ) : (
                            <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
                                {boxLogos.map((url) => (
                                    <button
                                        key={url}
                                        type="button"
                                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 flex items-center justify-center hover:border-theme-primary-500 focus:outline-none"
                                        onClick={() => {
                                            setImagePreview(url)
                                            setCreateForm(prev => ({ ...prev, image: url }))
                                            setIsLogoPickerOpen(false)
                                        }}
                                    >
                                        <img src={url} alt="logo" className="w-10 h-10 md:w-20 md:h-20 object-cover rounded-md" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
