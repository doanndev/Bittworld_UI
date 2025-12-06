"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useTheme } from 'next-themes'
import { ArrowLeft, Star, Users, TrendingUp, Calendar, Settings, Copy, Share2, MoreVertical, ChevronDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FileInput } from "@/components/ui/file-input"
import { toast } from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getBalanceInfo, getInforWallet } from "@/services/api/TelegramWalletService"
import { useAuth } from "@/hooks/useAuth"
import { useLang } from '@/lang/useLang'
import { useBittPrice } from "@/hooks/useBittPrice"
import {
    getAirdropPoolDetail,
    getAirdropPoolDetailV1,
    stakeAirdropPool,
    updateAirdropPool,
    getPoolRewards,
    type AirdropPool,
    type StakePoolRequest,
    type UpdatePoolRequest
} from "@/services/api/PoolServices"
import { truncateString } from "@/utils/format"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog"
import { listBoxLogos } from "@/services/other"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/ui/alert-dialog"
import { Checkbox } from "@/ui/checkbox"

interface PoolMember {
    memberId: number
    solanaAddress: string
    nickname: string
    isCreator: boolean
    joinDate: string
    totalStaked: number
    stakeCount: number
    status: 'pending' | 'active' | 'withdraw' | 'error'
    bittworldUid: string
}

interface PoolTransaction {
    transactionId: number
    memberId: number
    solanaAddress: string
    bittworldUid: string
    nickname: string
    isCreator: boolean
    stakeAmount: number
    transactionDate: string
    status: string
    transactionHash: string | null
}

export default function PoolDetail() {
    const params = useParams()
    const router = useRouter()
    const poolId = params.poolId as string
    const { isAuthenticated } = useAuth()
    const { t } = useLang()
    const queryClient = useQueryClient()
    const { theme, resolvedTheme } = useTheme()
    const [mountedTheme, setMountedTheme] = useState(false)
    const isDark = resolvedTheme === 'dark' || (resolvedTheme === undefined && theme === 'dark')
    const [required, setRequired] = useState(false)
    const { price: bittPrice } = useBittPrice()
    console.log("bittPrice", bittPrice)

    useEffect(() => {
        setMountedTheme(true)
    }, [])

    // State
    const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'transactions' | 'rewards'>('overview')
    const [stakeAmount, setStakeAmount] = useState(1000000)
    const [isStaking, setIsStaking] = useState(false)
    const [isConfirmingStake, setIsConfirmingStake] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState<UpdatePoolRequest>({
        describe: '',
        logo: undefined
    })
    const [logoPreview, setLogoPreview] = useState<string | null>(null)
    const [isLogoPickerOpen, setIsLogoPickerOpen] = useState(false)
    const [boxLogos, setBoxLogos] = useState<string[]>([])
    const [isLoadingBoxLogos, setIsLoadingBoxLogos] = useState(false)
    const [lastBittPrice, setLastBittPrice] = useState<number | null>(null)

    // Query để lấy thông tin wallet
    const { data: walletInfor } = useQuery({
        queryKey: ["wallet-infor"],
        queryFn: getInforWallet,
        enabled: isAuthenticated,
        refetchOnMount: true,
    })

    // Query để lấy chi tiết pool
    const { data: poolDetail, isLoading: isLoadingPool } = useQuery({
        queryKey: ["pool-detail", poolId],
        queryFn: () => getAirdropPoolDetail(parseInt(poolId)),
        enabled: isAuthenticated && !!poolId,
        refetchOnMount: true,
        staleTime: 0,
        refetchOnWindowFocus: false,
    })

    const { data: poolDetailV1, isLoading: isLoadingPoolV1 } = useQuery({
        queryKey: ["pool-detail-v1", poolId],
        queryFn: () => getAirdropPoolDetailV1(parseInt(poolId)),
        enabled: isAuthenticated && !!poolId,
        refetchOnMount: true,
        staleTime: 0,
        refetchOnWindowFocus: false,
    })

    // Invalidate queries when poolId changes
    useEffect(() => {
        if (poolId) {
            queryClient.invalidateQueries({ queryKey: ["pool-detail", poolId] })
            queryClient.invalidateQueries({ queryKey: ["pool-detail-v1", poolId] })
        }
    }, [poolId, queryClient])

    // Invalidate queries when bittPrice changes to update USD values
    useEffect(() => {
        if (bittPrice && poolId) {
            // Check if price has changed significantly
            if (lastBittPrice && Math.abs(bittPrice.price - lastBittPrice) > 0.0001) {
                // Show toast notification for price update
                toast.success(`Bitt price updated: $${bittPrice.price.toFixed(6)}`, {
                    duration: 2000,
                    position: 'top-right'
                })

                // Invalidate queries to refresh data
                queryClient.invalidateQueries({ queryKey: ["pool-detail", poolId] })
                queryClient.invalidateQueries({ queryKey: ["pool-detail-v1", poolId] })
            }

            // Update last known price
            setLastBittPrice(bittPrice.price)
        }
    }, [bittPrice, poolId, queryClient, lastBittPrice])

    const { data: balance, isLoading: isBalanceLoading } = useQuery({
        queryKey: ['balance'],
        queryFn: getBalanceInfo,
        refetchInterval: 5000,
        refetchOnMount: true,
    })

    console.log("balance", balance)

    // Lấy dữ liệu members từ API response
    const members = poolDetail?.members || []

    // Lấy dữ liệu transactions từ poolDetailV1
    const transactions = poolDetailV1?.data?.transactions || []

    // Mutation để stake pool
    const stakePoolMutation = useMutation({
        mutationFn: async (data: StakePoolRequest) => {
            return await stakeAirdropPool(data)
        },
        onSuccess: (data) => {
            toast.success(t('pools.detailPage.stakeSuccessful'))
            queryClient.invalidateQueries({ queryKey: ["pool-detail", poolId] })
            setIsStaking(false)
            setIsConfirmingStake(false)
        },
        onError: (error: any) => {
            let message = t('pools.detailPage.stakeFailed')

            // Check if it's an insufficient balance error
            if (error.response?.data?.message?.includes('Insufficient token')) {
                const errorMessage = error.response.data.message
                // Extract current and required values from error message
                const currentMatch = errorMessage.match(/Current: (\d+)/)
                const requiredMatch = errorMessage.match(/Required: (\d+)/)

                if (currentMatch && requiredMatch) {
                    const current = parseInt(currentMatch[1])
                    const required = parseInt(requiredMatch[1])
                    message = t('pools.detailPage.insufficient_token_balance', {
                        current: current.toLocaleString(),
                        required: required.toLocaleString()
                    })
                }
            }
            if (error.response?.data?.message?.includes('must stake at least 500,000 BITT')) {
                message = t('pools.detailPage.minimumStakeAmount')
            }

            toast.error(message)
            setIsStaking(false)
            setIsConfirmingStake(false)
        }
    })

    // Mutation để cập nhật pool
    const updatePoolMutation = useMutation({
        mutationFn: async (data: UpdatePoolRequest) => {
            return await updateAirdropPool(poolId, data)
        },
        onSuccess: (data) => {
            toast.success(t('pools.detailPage.updateSuccessful'))
            queryClient.invalidateQueries({ queryKey: ["pool-detail", poolId] })
            queryClient.invalidateQueries({ queryKey: ["pool-detail-v1", poolId] })
            setIsEditing(false)
            setEditForm({ describe: '', logo: undefined })
            setLogoPreview(null)
        },
        onError: (error: any) => {
            let message = t('pools.detailPage.updateFailed')

            if (error.response?.data?.message) {
                message = error.response.data.message
            }

            toast.error(message)
        }
    })

    const handleUpdatePool = async () => {
        if (!editForm.describe?.trim() && !editForm.logo) {
            toast.error(t('pools.detailPage.updateFieldsRequired'))
            return
        }

        const updateData: UpdatePoolRequest = {}
        if (editForm.describe?.trim()) {
            updateData.describe = editForm.describe.trim()
        }
        if (editForm.logo) {
            updateData.logo = editForm.logo
        }

        await updatePoolMutation.mutateAsync(updateData)
    }

    const handleEditClick = () => {
        setEditForm({
            describe: poolDetail?.describe || '',
            logo: undefined
        })
        // Initialize logo preview with current logo if it exists
        if (poolDetail?.logo) {
            setLogoPreview(poolDetail.logo)
        } else {
            setLogoPreview(null)
        }
        setIsEditing(true)
    }

    const openLogoPicker = async () => {
        setIsLogoPickerOpen(true)
        if (boxLogos.length === 0) {
            try {
                setIsLoadingBoxLogos(true)
                const logos = await listBoxLogos()
                setBoxLogos(logos)
            } catch (e) {
                toast.error('Failed to load system logos')
            } finally {
                setIsLoadingBoxLogos(false)
            }
        }
    }

    const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
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

            setEditForm({ ...editForm, logo: file })

            // Create preview
            const reader = new FileReader()
            reader.onload = (e) => {
                setLogoPreview(e.target?.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const copyPoolLink = () => {
        navigator.clipboard.writeText(window.location.href)
        toast.success(t('pools.detailPage.poolLinkCopied'))
    }

    const sharePool = () => {
        if (navigator.share) {
            navigator.share({
                title: poolDetail?.name || 'Pool',
                url: window.location.href
            })
        } else {
            copyPoolLink()
        }
    }

    // Format functions
    const formatNumber = (num: number) => {
        return new Intl.NumberFormat().format(num)
    }

    const formatInputNumber = (value: string | number) => {
        if (!value) return ''
        const numValue = typeof value === 'string' ? value.replace(/,/g, '') : value
        const num = Number(numValue)
        if (isNaN(num)) return ''
        return new Intl.NumberFormat().format(num)
    }

    const parseInputNumber = (value: string) => {
        if (!value) return 0
        const cleanValue = value.replace(/[^\d]/g, '') // Chỉ cho phép số
        const num = Number(cleanValue)
        return isNaN(num) ? 0 : num
    }

    const handleInputChange = (value: string) => {
        const cleanValue = value.replace(/[^\d]/g, '') // Chỉ cho phép số
        const num = Number(cleanValue)
        if (!isNaN(num)) {
            setStakeAmount(num)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString()
    }

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString()
    }

    if (isLoadingPool) {
        return (
            <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary-500"></div>
                </div>
            </div>
        )
    }

    if (!poolDetail) {
        return (
            <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
                <div className="flex items-center justify-center min-h-screen px-4">
                    <div className="text-center">
                        <h2 className="text-xl sm:text-2xl font-semibold mb-4">{t('pools.detailPage.poolNotFound')}</h2>
                        <Button onClick={() => router.push('/pools')} className="text-base px-6 py-3">
                            {t('pools.detailPage.backToPools')}
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    const isCreator = poolDetail.userStakeInfo?.isCreator || false

    const handleStake = async () => {
        // if (!isCreator && stakeAmount && stakeAmount < 1000000) {
        //     toast.error(t('pools.detailPage.minimumStakeAmount'))
        //     return
        // }

        setIsConfirmingStake(true)
    }

    return (
        <div className="flex-1 bg-transparent text-gray-900 dark:text-white mt-10">
            {/* Header - Responsive */}
            <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 mb-4 sm:mb-5">
                <div className="px-3 sm:px-4 lg:px-8 py-3 sm:py-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push('/pools')}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <div className="flex items-center gap-2 sm:gap-3">
                                <img
                                    src={poolDetail.logo || "/logo.png"}
                                    alt={poolDetail.name}
                                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = "/logo.png";
                                    }}
                                />
                                <div className="min-w-0 flex-1">
                                    <h1 className="text-lg sm:text-xl font-bold truncate">{poolDetail.name}</h1>
                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                                        #{poolDetail.poolId} • {poolDetail.slug}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={copyPoolLink}
                                className="hidden sm:flex items-center gap-2 text-xs sm:text-sm"
                            >
                                <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">{t('pools.detailPage.copy')}</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={sharePool}
                                className="hidden sm:flex items-center gap-2 text-xs sm:text-sm"
                            >
                                <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">{t('pools.detailPage.share')}</span>
                            </Button>
                            {/* Mobile action buttons */}
                            <div className="flex sm:hidden gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={copyPoolLink}
                                    className="p-2"
                                >
                                    <Copy className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={sharePool}
                                    className="p-2"
                                >
                                    <Share2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
                <div className="max-w-7xl mx-auto">
                    {/* Pool Stats - Glassmorphism Card */}
                    <div className="mb-6 sm:mb-8">
                        <div 
                            className="rounded-3xl px-4 sm:px-6 py-4 sm:py-6 backdrop-blur-xl"
                            style={{
                                background: mountedTheme && isDark
                                    ? 'rgba(31, 193, 107, 0.15)'
                                    : 'rgba(31, 193, 107, 0.12)',
                                border: mountedTheme && isDark
                                    ? '1px solid rgba(31, 193, 107, 0.25)'
                                    : '1px solid rgba(31, 193, 107, 0.2)',
                                boxShadow: mountedTheme && isDark
                                    ? '0 8px 32px -4px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(31, 193, 107, 0.1) inset'
                                    : '0 8px 32px -4px rgba(31, 193, 107, 0.15), 0 0 0 1px rgba(31, 193, 107, 0.08) inset',
                            }}
                        >
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-0">
                                {/* Total Volume Section */}
                                <div 
                                    className="flex flex-col px-3 sm:px-4 py-2 sm:py-3 border-r last:border-r-0"
                                    style={{
                                        borderColor: mountedTheme && isDark
                                            ? 'rgba(255, 255, 255, 0.1)'
                                            : 'rgba(31, 193, 107, 0.15)'
                                    }}
                                >
                                    <p className={`text-xs sm:text-sm mb-3 sm:mb-4 font-normal ${mountedTheme && isDark ? 'text-white/90' : 'text-gray-700'}`}>{t('pools.detailPage.totalVolume')}:</p>
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#1FC16B] rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                                            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                        </div>
                                        <p className={`text-base sm:text-lg font-bold truncate ${mountedTheme && isDark ? 'text-white' : 'text-gray-900'}`}>{formatNumber(poolDetail.totalVolume)}</p>
                                    </div>
                                </div>

                                {/* Members Count Section */}
                                <div 
                                    className="flex flex-col px-3 sm:px-4 py-2 sm:py-3 border-r last:border-r-0"
                                    style={{
                                        borderColor: mountedTheme && isDark
                                            ? 'rgba(255, 255, 255, 0.1)'
                                            : 'rgba(31, 193, 107, 0.15)'
                                    }}
                                >
                                    <p className={`text-xs sm:text-sm mb-3 sm:mb-4 font-normal ${mountedTheme && isDark ? 'text-white/90' : 'text-gray-700'}`}>{t('pools.detailPage.membersCount')}:</p>
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#1FC16B] rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                                            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                        </div>
                                        <p className={`text-base sm:text-lg font-bold ${mountedTheme && isDark ? 'text-white' : 'text-gray-900'}`}>{poolDetail.memberCount}</p>
                                    </div>
                                </div>

                                {/* Created Date Section */}
                                <div 
                                    className="flex flex-col px-3 sm:px-4 py-2 sm:py-3 border-r last:border-r-0"
                                    style={{
                                        borderColor: mountedTheme && isDark
                                            ? 'rgba(255, 255, 255, 0.1)'
                                            : 'rgba(31, 193, 107, 0.15)'
                                    }}
                                >
                                    <p className={`text-xs sm:text-sm mb-3 sm:mb-4 font-normal ${mountedTheme && isDark ? 'text-white/90' : 'text-gray-700'}`}>{t('pools.detailPage.created')}:</p>
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#1FC16B] rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                                            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                        </div>
                                        <p className={`text-base sm:text-lg font-bold truncate ${mountedTheme && isDark ? 'text-white' : 'text-gray-900'}`}>{formatDate(poolDetail.creationDate)}</p>
                                    </div>
                                </div>

                                {/* Status Section */}
                                <div 
                                    className="flex flex-col px-3 sm:px-4 py-2 sm:py-3 border-r last:border-r-0"
                                    style={{
                                        borderColor: mountedTheme && isDark
                                            ? 'rgba(255, 255, 255, 0.1)'
                                            : 'rgba(31, 193, 107, 0.15)'
                                    }}
                                >
                                    <p className={`text-xs sm:text-sm mb-3 sm:mb-4 font-normal capitalize ${mountedTheme && isDark ? 'text-white/90' : 'text-gray-700'}`}>{t('pools.detailPage.status')}:</p>
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#1FC16B] rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                                            <Star className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                        </div>
                                        <p className={`text-base sm:text-lg font-bold uppercase truncate ${mountedTheme && isDark ? 'text-white' : 'text-gray-900'}`}>{t(`pools.detailPage.${poolDetail.status}`)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs - Responsive */}
                    <div className="border-b border-gray-200 dark:border-gray-700 mb-4 sm:mb-6">
                        {/* Desktop Tabs */}
                        <nav className="hidden sm:flex space-x-6 lg:space-x-8">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm lg:text-base ${activeTab === 'overview'
                                    ? 'border-theme-primary-500 text-theme-primary-500'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                {t('pools.detailPage.overview')}
                            </button>
                            {poolDetail?.members && (
                                <button
                                    onClick={() => setActiveTab('members')}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm lg:text-base ${activeTab === 'members'
                                        ? 'border-theme-primary-500 text-theme-primary-500'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    {t('pools.detailPage.members')} ({members.length})
                                </button>
                            )}
                            {poolDetailV1?.data?.transactions && (
                                <button
                                    onClick={() => setActiveTab('transactions')}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm lg:text-base ${activeTab === 'transactions'
                                        ? 'border-theme-primary-500 text-theme-primary-500'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    {t('pools.detailPage.transactions')}
                                </button>
                            )}
                            {poolDetailV1?.data?.rewards && (
                                <button
                                    onClick={() => setActiveTab('rewards')}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm lg:text-base ${activeTab === 'rewards'
                                        ? 'border-theme-primary-500 text-theme-primary-500'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    {t('pools.detailPage.rewards')}
                                </button>
                            )}
                        </nav>

                        {/* Mobile Tabs - Pill Style */}
                        <div className="sm:hidden">
                            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                <button
                                    onClick={() => setActiveTab('overview')}
                                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${activeTab === 'overview'
                                        ? 'bg-white dark:bg-gray-800 text-theme-primary-500 shadow-sm'
                                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                >
                                    {t('pools.detailPage.overview')}
                                </button>
                                {
                                    poolDetail?.members && (
                                        <button
                                            onClick={() => setActiveTab('members')}
                                            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${activeTab === 'members'
                                                ? 'bg-white dark:bg-gray-800 text-theme-primary-500 shadow-sm'
                                                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                                                }`}
                                        >
                                            {t('pools.detailPage.members')}
                                        </button>
                                    )
                                }
                                {poolDetailV1?.data?.transactions && (
                                    <button
                                        onClick={() => setActiveTab('transactions')}
                                        className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${activeTab === 'transactions'
                                            ? 'bg-white dark:bg-gray-800 text-theme-primary-500 shadow-sm'
                                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                                            }`}
                                    >
                                        {t('pools.detailPage.transactions')}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="space-y-4 sm:space-y-6">
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="md:grid flex flex-col-reverse grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                                {/* Pool Description */}
                                <div className="lg:col-span-2">
                                    <div 
                                        className="rounded-3xl p-4 sm:p-6 backdrop-blur-xl"
                                        style={{
                                            background: mountedTheme && isDark
                                                ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.4) 100%)'
                                                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.6) 100%)',
                                            border: mountedTheme && isDark
                                                ? '1px solid rgba(107, 114, 128, 0.3)'
                                                : '1px solid rgba(156, 163, 175, 0.3)',
                                            boxShadow: mountedTheme && isDark
                                                ? '0 4px 12px -4px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(107, 114, 128, 0.1) inset'
                                                : '0 4px 12px -4px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(156, 163, 175, 0.1) inset',
                                        }}
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-base sm:text-lg font-semibold">{t('pools.detailPage.aboutPool')}</h3>
                                            {isCreator && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleEditClick}
                                                    className="text-xs sm:text-sm"
                                                >
                                                    <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                                    {t('pools.detailPage.edit')}
                                                </Button>
                                            )}
                                        </div>

                                        {isEditing ? (
                                            <div className="space-y-4 dark:bg-theme-neutral-900/30 bg-theme-neutral-100 rounded-lg p-4">
                                                <div className="flex md:flex-row flex-col 2xl:gap-3 gap-2 justify-between w-full">
                                                    <div className="basis-1/2">
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                            {t('pools.detailPage.description')}
                                                        </label>
                                                        <textarea
                                                            value={editForm.describe || ''}
                                                            onChange={(e) => setEditForm({ ...editForm, describe: e.target.value })}
                                                            className="w-full outline-none px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-theme-primary-500 focus:border-transparent"
                                                            rows={3}
                                                            placeholder={t('pools.detailPage.enterDescription')}
                                                        />
                                                    </div>
                                                    <div className="basis-1/2">
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                            {t('pools.detailPage.logoUpdate')}
                                                        </label>
                                                        <div className="flex flex-row  gap-2 justify-around">
                                                            <div className="flex flex-col justify-around gap-2">
                                                                <FileInput
                                                                    accept="image/*"
                                                                    onChange={handleLogoUpload}
                                                                    placeholder={t('pools.fileInputPlaceholder')}
                                                                    className="max-w-[200px] max-h-10"
                                                                />
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={openLogoPicker}
                                                                    className="text-xs sm:text-sm border !border-white/50"
                                                                >
                                                                    {t('pools.chooseFromSystem') ?? 'Choose from system'}
                                                                </Button>
                                                            </div>
                                                            <div className="mt-2 h-fit relative inline-block bg-theme-neutral-1000 dark:bg-theme-neutral-100 rounded-full p-1">
                                                                <img
                                                                    src={logoPreview ? logoPreview : (poolDetail?.logo || "/placeholder.png")}
                                                                    alt="Logo Preview"
                                                                    className="w-20 h-20 object-cover rounded-full border border-gray-300 dark:border-gray-600"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setLogoPreview(null)
                                                                        setEditForm({ ...editForm, logo: undefined })
                                                                    }}
                                                                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 justify-end">
                                                    <Button
                                                        onClick={handleUpdatePool}
                                                        disabled={updatePoolMutation.isPending}
                                                        className="text-xs sm:text-sm bg-theme-primary-500 hover:bg-green-500 text-white py-3 sm:py-2 px-4 max-h-8"
                                                    >
                                                        {updatePoolMutation.isPending ? t('pools.detailPage.updating') : t('pools.detailPage.save')}
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => {
                                                            setIsEditing(false)
                                                            setEditForm({ describe: '', logo: undefined })
                                                            setLogoPreview(null)
                                                        }}
                                                        className="text-xs sm:text-sm max-h-8"
                                                    >
                                                        {t('pools.detailPage.cancel')}
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="leading-relaxed text-theme-primary-500 text-sm sm:text-base mb-4">
                                                {t('pools.detailPage.description')} &ensp; <span className="font-mono italic text-gray-500 dark:text-gray-400 text-xs sm:text-sm">{poolDetail.describe || "This is a community-driven liquidity pool focused on providing sustainable returns to its members through strategic token staking and yield farming opportunities."}</span>
                                            </p>
                                        )}

                                        <div className="md:block hidden space-y-2 sm:space-y-3 text-sm sm:text-base">
                                            <div className="flex flex-row justify-between sm:items-center gap-2 sm:gap-0 mb-3">
                                                <span className="text-sm sm:text-base text-gray-500 dark:text-gray-400">{t('pools.detailPage.creatorAddress')}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-yellow-500 italic text-sm sm:text-base">{truncateString(poolDetail.creatorAddress, 12)}</span>
                                                    <Copy className="w-3 h-3 sm:w-4 sm:h-4 cursor-pointer" onClick={() => {
                                                        navigator.clipboard.writeText(poolDetail.creatorAddress)
                                                        toast.success(t('pools.detailPage.copiedToClipboard'))
                                                    }} />
                                                </div>
                                            </div>
                                            <div className="space-y-2 sm:space-y-3 text-sm sm:text-base">
                                                <div className="flex flex-row justify-between sm:items-center gap-1 sm:gap-0">
                                                    <span className="text-gray-500 dark:text-gray-400">{t('pools.detailPage.poolId')}</span>
                                                    <span className="font-mono">{poolDetail.poolId}</span>
                                                </div>
                                                <div className="flex flex-row justify-between sm:items-center gap-1 sm:gap-0">
                                                    <span className="text-gray-500 dark:text-gray-400">{t('pools.detailPage.creationDate')}</span>
                                                    <span>{formatDate(poolDetail.creationDate)}</span>
                                                </div>
                                                {poolDetail.endDate && (
                                                    <div className="flex flex-row justify-between sm:items-center gap-1 sm:gap-0">
                                                        <span className="text-gray-500 dark:text-gray-400">{t('pools.detailPage.endDate')}</span>
                                                        <span>{formatDate(poolDetail.endDate)}</span>
                                                    </div>
                                                )}
                                                <div className="flex flex-row justify-between sm:items-center gap-1 sm:gap-0">
                                                    <span className="text-gray-500 dark:text-gray-400">{t('pools.detailPage.status')}</span>
                                                    <span className={`px-2 sm:px-3 py-1 rounded text-xs uppercase font-semibold ${poolDetail.status === 'active' ? 'bg-green-100 text-green-800' :
                                                        poolDetail.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                        {t(`pools.detailPage.${poolDetail.status}`)}
                                                    </span>
                                                </div>
                                                {poolDetail.transactionHash && (
                                                    <div className="flex flex-row justify-between sm:items-center gap-1 sm:gap-0">
                                                        <span className="text-gray-500 dark:text-gray-400">{t('pools.detailPage.transactionHash')}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono text-yellow-500 italic text-xs">{truncateString(poolDetail.transactionHash, 16)}</span>
                                                            <Copy className="w-3 h-3 cursor-pointer" onClick={() => {
                                                                navigator.clipboard.writeText(poolDetail.transactionHash)
                                                                toast.success(t('pools.detailPage.copiedToClipboard'))
                                                            }} />
                                                        </div>
                                                    </div>
                                                )}
                                                {poolDetail.userStakeInfo && (
                                                    <>
                                                        <div className="flex flex-row justify-between sm:items-center gap-1 sm:gap-0">
                                                            <span className="text-gray-500 dark:text-gray-400">{t('pools.detailPage.poolStake')}</span>
                                                            <span className="font-mono text-[#53DAE6]">{formatNumber(poolDetail.userStakeInfo.totalStaked)}</span>
                                                        </div>
                                                        <div className="flex flex-row justify-between sm:items-center gap-1 sm:gap-0">
                                                            <span className="text-gray-500 dark:text-gray-400">{t('pools.detailPage.stakeCount')}</span>
                                                            <span>{poolDetail.userStakeInfo.stakeCount}</span>
                                                        </div>
                                                        <div className="flex flex-row justify-between sm:items-center gap-1 sm:gap-0">
                                                            <span className="text-gray-500 dark:text-gray-400">{t('pools.detailPage.joinDate')}</span>
                                                            <span className="text-gray-500 dark:text-gray-400 italic text-xs sm:text-sm">{formatDate(poolDetail.userStakeInfo.joinDate)}</span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Stake Section */}
                                <div className="lg:col-span-1">
                                    <div 
                                        className="rounded-3xl p-4 sm:p-6 backdrop-blur-xl"
                                        style={{
                                            background: mountedTheme && isDark
                                                ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.4) 100%)'
                                                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.6) 100%)',
                                            border: mountedTheme && isDark
                                                ? '1px solid rgba(107, 114, 128, 0.3)'
                                                : '1px solid rgba(156, 163, 175, 0.3)',
                                            boxShadow: mountedTheme && isDark
                                                ? '0 4px 12px -4px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(107, 114, 128, 0.1) inset'
                                                : '0 4px 12px -4px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(156, 163, 175, 0.1) inset',
                                        }}
                                    >
                                        <h3 className="text-base sm:text-lg font-semibold mb-4">{t('pools.detailPage.stakeInPool')}</h3>

                                        {!isCreator ? (
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        {t('pools.detailPage.amountToStake')}
                                                    </label>
                                                    <div className="flex flex-row justify-between gap-2 h-full">
                                                        <input
                                                            type="text"
                                                            value={formatInputNumber(stakeAmount)}
                                                            onChange={(e) => handleInputChange(e.target.value)}
                                                            className="w-full px-3 outline-none py-2 text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-theme-primary-500 focus:border-transparent"
                                                            placeholder={t('pools.detailPage.enterAmount')}
                                                        />
                                                        <button className="text-xs bg-theme-primary-500 text-white px-3 py-1 whitespace-nowrap rounded-md h-10" onClick={() => {
                                                            setStakeAmount(balance?.bitt?.token_balance ?? 0)
                                                        }}>
                                                            {t('swap.max')} 
                                                        </button>
                                                    </div>
                                                    <div className="flex flex-row justify-end mt-1">
                                                        
                                                        <p className="text-xs text-theme-primary-500 mt-1">
                                                            {t('pools.detailPage.balanceBitt')}: {formatNumber(balance?.bitt?.token_balance ?? 0)}
                                                        </p>
                                                    </div>
                                                </div>

                                                <Button
                                                    onClick={handleStake}
                                                    disabled={isStaking || stakePoolMutation.isPending}
                                                    className="w-full bg-theme-primary-500 hover:bg-green-500 text-white py-3 sm:py-2 text-base"
                                                >
                                                    {isStaking || stakePoolMutation.isPending ? t('pools.detailPage.staking') : t('pools.detailPage.stakeNow')}
                                                </Button>
                                                <div className="text-[9px] text-red-400 italic mt-1">
                                                    {t('pools.detailPage.virtualAssetsWarning')}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <p className="text-sm sm:text-base text-yellow-500 italic mb-4">
                                                    {t('pools.detailPage.youAreCreator')}
                                                </p>
                                                <div className="space-y-2 mb-4 text-sm sm:text-base">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500 dark:text-gray-400">{t('pools.detailPage.yourStaked')}</span>
                                                        <span className="font-mono">{formatNumber(poolDetail.userStakeInfo?.totalStaked || 0)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500 dark:text-gray-400">{t('pools.detailPage.stakedCount')}</span>
                                                        <span>{poolDetail.userStakeInfo?.stakeCount || 0}</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm sm:text-base text-theme-primary-500 mb-2 uppercase font-semibold">
                                                        {t('pools.detailPage.amountToStake')}
                                                    </label>
                                                    <div className="flex items-center gap-2 h-full">
                                                        <input
                                                            type="text"
                                                            value={formatInputNumber(stakeAmount)}
                                                            onChange={(e) => handleInputChange(e.target.value)}
                                                            className="w-full px-3 py-2 text-base outline-none border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-theme-primary-500 focus:border-transparent"
                                                            placeholder={t('pools.detailPage.enterAmount')}
                                                        />
                                                        <button className="text-xs bg-theme-primary-500 text-white px-3 whitespace-nowrap py-1 rounded-md h-10" onClick={() => {
                                                            setStakeAmount(balance?.bitt?.token_balance ?? 0)
                                                        }}>
                                                            {t('swap.max')}
                                                        </button></div>
                                                    <div className="flex flex-row justify-end mt-1">
                                                        <p className="text-xs text-theme-primary-500 mt-1">
                                                            {t('pools.detailPage.balanceBitt')}: {formatNumber(balance?.bitt?.token_balance ?? 0)}
                                                        </p>
                                                    </div>
                                                </div>

                                                <Button
                                                    onClick={handleStake}
                                                    disabled={isStaking || stakePoolMutation.isPending || !stakeAmount}
                                                    className={`w-full bg-theme-primary-500 hover:bg-theme-primary-600 text-white mt-4 py-3 sm:py-2 text-base ${!stakeAmount ? 'opacity-50 cursor-not-allowed' : ' '}`}
                                                >
                                                    {isStaking || stakePoolMutation.isPending ? t('pools.detailPage.staking') : t('pools.detailPage.stakeNow')}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Members Tab */}
                        {activeTab === 'members' && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
                                    <h3 className="text-base sm:text-lg font-semibold">{t('pools.detailPage.poolMembers')}</h3>
                                </div>

                                {/* Desktop Table */}
                                <div className="hidden sm:block overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    {t('pools.detailPage.member')}
                                                </th>
                                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    BITTWORLD UID
                                                </th>
                                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    {t('pools.detailPage.stakeAmount')}
                                                </th>
                                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    <div className="flex items-center gap-2">
                                                        <span>{t('pools.detailPage.value')}</span>
                                                    </div>
                                                </th>
                                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    <div className="flex items-center gap-2">
                                                        <span>{t('pools.detailPage.valueBitt')}</span>
                                                    </div>
                                                </th>
                                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    {t('pools.detailPage.joinDate')}
                                                </th>
                                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    {t('pools.detailPage.role')}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {members.map((member: PoolMember) => (
                                                <tr key={member.memberId}>
                                                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <img
                                                                className="h-8 w-8 rounded-full"
                                                                src="/user-icon.png"
                                                                alt={member.nickname}
                                                            />
                                                            <div className="ml-3 sm:ml-4">
                                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                                    {member.nickname}
                                                                </div>
                                                                <div className="text-xs text-yellow-500 italic flex items-center gap-1">
                                                                    {member.solanaAddress.slice(0, 8)}...{member.solanaAddress.slice(-8)}
                                                                    <Copy className="w-3 h-3" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                                                        <div className="text-sm text-yellow-500 font-mono flex items-center gap-1 cursor-pointer" onClick={() => {
                                                            navigator.clipboard.writeText(member.bittworldUid)
                                                            toast.success(t('pools.detailPage.copiedToClipboard'))
                                                        }} >
                                                            {member.bittworldUid} <Copy className="w-3 h-3" />
                                                        </div>
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900 dark:text-white font-mono">
                                                            {formatNumber(member.totalStaked)}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                                                        <div className="text-sm text-green-500 font-semibold">
                                                            ${bittPrice ? (formatNumber(bittPrice.price * member.totalStaked)) : '0.00'}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                                                        <div className="text-sm text-green-500 font-semibold">
                                                            ${bittPrice ? bittPrice.price : '0.00'}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                                            {formatDate(member.joinDate)}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap flex gap-2 items-center">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${member.isCreator
                                                            ? 'bg-purple-100 text-purple-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {member.isCreator ? t('pools.detailPage.creator') : t('pools.detailPage.member')}
                                                        </span>
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${member.status === 'active' ? 'bg-green-100 text-green-800' :
                                                            member.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                member.status === 'withdraw' ? 'bg-blue-100 text-blue-800' :
                                                                    'bg-red-100 text-red-800'
                                                            }`}>
                                                            {member.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Card Layout */}
                                <div className="sm:hidden">
                                    <div className="p-3 space-y-3">
                                        {members.map((member: PoolMember) => (
                                            <div key={member.memberId} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        className="h-10 w-10 rounded-full"
                                                        src="/user-icon.png"
                                                        alt={member.nickname}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                            {member.nickname}
                                                        </div>
                                                        <div className="text-xs text-yellow-500 italic flex items-center gap-1">
                                                            {member.solanaAddress.slice(0, 4)}...{member.solanaAddress.slice(-4)}
                                                            <Copy className="w-3 h-3" />
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${member.isCreator
                                                            ? 'bg-purple-100 text-purple-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {member.isCreator ? t('pools.detailPage.creator') : t('pools.detailPage.member')}
                                                        </span>
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${member.status === 'active' ? 'bg-green-100 text-green-800' :
                                                            member.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                member.status === 'withdraw' ? 'bg-blue-100 text-blue-800' :
                                                                    'bg-red-100 text-red-800'
                                                            }`}>
                                                            {t(`pools.detailPage.${member.status}`)}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-3 text-sm">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-gray-500 dark:text-white">BITTWORLD UID</span>
                                                        <div className="text-yellow-500 font-mono flex items-center gap-1 cursor-pointer" onClick={() => {
                                                            navigator.clipboard.writeText(member.bittworldUid)
                                                            toast.success(t('pools.detailPage.copiedToClipboard'))
                                                        }}>
                                                            {member.bittworldUid}
                                                            <Copy className="w-3 h-3" />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-gray-500 dark:text-white">{t('pools.detailPage.stakeAmount')}</span>
                                                        <div className="font-mono text-gray-900 dark:text-white">
                                                            {formatNumber(member.totalStaked)}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-black dark:text-white">{t('pools.detailPage.value')}:</span>
                                                        </div>
                                                        <div className="font-mono text-green-500 text-base font-semibold">
                                                            ${bittPrice ? (formatNumber(bittPrice.price * member.totalStaked)) : '0.00'}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-black dark:text-white">{t('pools.detailPage.valueBitt')}:</span>
                                                        </div>
                                                        <div className="font-mono text-green-500 flex items-center gap-2">
                                                            {bittPrice && (
                                                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                            )}
                                                            ${bittPrice ? bittPrice.price : '0.00'}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-gray-500 dark:text-white">{t('pools.detailPage.joinDate')}:</span>
                                                        <div className="text-gray-900 dark:text-white">
                                                            {formatDate(member.joinDate)}
                                                        </div>
                                                    </div>
                                                </div>


                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Transactions Tab */}
                        {activeTab === 'transactions' && transactions?.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                {/* Desktop Table */}
                                <div className="hidden sm:block overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    BITTWORLD UID
                                                </th>
                                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    {t('pools.detailPage.user')}
                                                </th>
                                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    {t('pools.detailPage.amount')}
                                                </th>
                                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    <div className="flex items-center gap-2">
                                                        <span>{t('pools.detailPage.value')}</span>
                                                    </div>
                                                </th>
                                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    <div className="flex items-center gap-2">
                                                        <span>{t('pools.detailPage.valueBitt')}</span>
                                                    </div>
                                                </th>
                                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    {t('pools.detailPage.date')}
                                                </th>
                                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    {t('pools.detailPage.transactionHash')}
                                                </th>
                                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    {t('pools.detailPage.type')}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {transactions.map((tx: PoolTransaction) => (
                                                <tr key={tx.transactionId}>
                                                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                                                        <div className="text-sm text-yellow-500 italic flex items-center gap-2 cursor-pointer" onClick={() => {
                                                            navigator.clipboard.writeText(tx.bittworldUid)
                                                            toast.success(t('pools.detailPage.copiedToClipboard'))
                                                        }}>
                                                            {tx.bittworldUid}
                                                            <Copy className="w-3 h-3" />
                                                        </div>
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900 dark:text-white">
                                                            {tx.nickname}
                                                        </div>
                                                        <div className="text-xs text-yellow-500 italic flex items-center gap-1 cursor-pointer" onClick={() => {
                                                            navigator.clipboard.writeText(tx.solanaAddress)
                                                            toast.success(t('pools.detailPage.copiedToClipboard'))
                                                        }}>
                                                            {truncateString(tx.solanaAddress, 12) ?? '-'}
                                                            <Copy className="w-3 h-3" />
                                                        </div>
                                                    </td>

                                                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900 dark:text-white font-mono">
                                                            {formatNumber(tx.stakeAmount)}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                                                        <div className=" text-green-500 text-base font-semibold">
                                                            ${bittPrice ? (formatNumber(bittPrice.price * tx.stakeAmount)) : '0.00'}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                                                        <div className="text-sm text-green-500 font-semibold">
                                                            ${bittPrice ? bittPrice.price : '0.00'}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                                            {formatDateTime(tx.transactionDate)}
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            {t(`pools.detailPage.${tx.status}`)}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                                                        <div className="text-sm text-yellow-500 italic flex items-center gap-1 cursor-pointer" onClick={() => {
                                                            navigator.clipboard.writeText(tx.transactionHash || '')
                                                            toast.success(t('pools.detailPage.copiedToClipboard'))
                                                        }}>
                                                            {truncateString(tx.transactionHash || '', 12) ?? '-'}
                                                            <Copy className="w-3 h-3" />
                                                        </div>
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                                                        <div className="flex flex-col gap-1">
                                                            {tx.isCreator ? (
                                                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                                                    {t('pools.detailPage.creator')}
                                                                </span>
                                                            ) : <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                                {t('pools.detailPage.stake')}
                                                            </span>}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Card Layout */}
                                <div className="sm:hidden">
                                    <div className="p-3 space-y-3">
                                        {transactions.map((tx: PoolTransaction) => (
                                            <div key={tx.transactionId} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex flex-col gap-1">
                                                        {tx.isCreator ? (
                                                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                                                {t('pools.detailPage.creator')}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                                {t('pools.detailPage.stake')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {formatDateTime(tx.transactionDate)}
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-black dark:text-white">BITTWORLD UID:</span>
                                                        <div className="text-yellow-500 truncate flex items-center gap-1 cursor-pointer text-sm" onClick={() => {
                                                            navigator.clipboard.writeText(tx.bittworldUid)
                                                            toast.success(t('pools.detailPage.copiedToClipboard'))
                                                        }} >
                                                            {tx.bittworldUid} <Copy className="w-3 h-3" />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-black dark:text-white">{t('pools.detailPage.amount')}:</span>
                                                        <div className="font-mono text-gray-900 dark:text-white">
                                                            {formatNumber(tx.stakeAmount)}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-black dark:text-white">{t('pools.detailPage.value')}:</span>
                                                        </div>
                                                        <div className="font-mono text-green-500 text-base font-semibold">
                                                            ${bittPrice ? (formatNumber(bittPrice.price * tx.stakeAmount)) : '0.00'}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-black dark:text-white">{t('pools.detailPage.valueBitt')}:</span>
                                                        </div>
                                                        <div className="font-mono text-green-500 flex items-center gap-2">
                                                            {bittPrice && (
                                                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                            )}
                                                            ${bittPrice ? bittPrice.price : '0.00'}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-black dark:text-white">{t('pools.detailPage.user')}:</span>
                                                        <div className="text-gray-900 dark:text-white truncate">
                                                            {tx.nickname}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AlertDialog open={isConfirmingStake} onOpenChange={setIsConfirmingStake}>
                <AlertDialogContent className="bg-white dark:bg-gray-800 max-w-sm sm:max-w-lg">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base sm:text-lg">{t('pools.detailPage.confirmStake')}</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm">
                            {t('pools.detailPage.confirmStakeMessage').replace('{amount}', formatNumber(stakeAmount)).replace('{poolName}', poolDetail.name)}
                            <div className="flex items-start gap-2 mt-2">
                                <Checkbox
                                    id="pool-required"
                                    checked={required}
                                    onCheckedChange={(checked) => setRequired(checked === true)}
                                />
                                <div className="flex flex-col items-start gap-2 ">
                                    <div className="text-[10px] text-red-500 dark:text-red-400 italic leading-[9px]">{t('pools.lockNote')}</div>
                                    <div className="text-[10px] text-red-500 dark:text-red-400 italic leading-[9px]">{t('pools.required')}</div>
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel onClick={() => setIsConfirmingStake(false)} className="w-full sm:w-auto max-h-[30px]">
                            {t('pools.detailPage.cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction disabled={!required} className="bg-theme-primary-500 max-h-[30px] hover:bg-green-500 text-white w-full sm:w-auto" onClick={() => {
                            setIsConfirmingStake(false)
                            setIsStaking(true)
                            const stakeData: StakePoolRequest = {
                                poolId: parseInt(poolId),
                                stakeAmount
                            }
                            stakePoolMutation.mutate(stakeData)
                        }}>
                            {isStaking || stakePoolMutation.isPending ? t('pools.detailPage.staking') : t('pools.detailPage.stakeNow')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={isLogoPickerOpen} onOpenChange={setIsLogoPickerOpen}>
                <DialogContent className="bg-white dark:bg-gray-800 max-w-2xl w-[90vw]">
                    <DialogHeader>
                        <DialogTitle className="text-base sm:text-lg">{t('pools.detailPage.logoUpdate')}</DialogTitle>
                    </DialogHeader>
                    <div className="py-2 max-h-[74vh] overflow-y-auto">
                        {isLoadingBoxLogos ? (
                            <div className="text-sm text-gray-500 dark:text-gray-400">{t('common.loading')}</div>
                        ) : boxLogos.length === 0 ? (
                            <div className="text-sm text-gray-500 dark:text-gray-400">{t('pools.detailPage.noSystemImages')}</div>
                        ) : (
                            <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
                                {boxLogos.map((url) => (
                                    <button
                                        key={url}
                                        type="button"
                                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 flex items-center justify-center hover:border-theme-primary-500 focus:outline-none"
                                        onClick={() => {
                                            setLogoPreview(url)
                                            setEditForm({ ...editForm, logo: url })
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