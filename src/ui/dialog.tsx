"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const isDark = resolvedTheme === 'dark' || (resolvedTheme === undefined && theme === 'dark')

  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        "fixed inset-0 z-50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      style={{
        background: mounted && isDark
          ? 'rgba(0, 0, 0, 0.7)'
          : 'rgba(0, 0, 0, 0.5)',
      }}
      {...props}
    />
  )
})
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    hiddenCloseButton?: boolean;
  }
>(({ className, children, ...props }, ref) => {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const isDark = resolvedTheme === 'dark' || (resolvedTheme === undefined && theme === 'dark')

  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 pl-3 pr-2 py-3 backdrop-blur-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-xl sm:rounded-2xl",
          className
        )}
        style={{
          background: mounted && isDark
            ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.7) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.85) 100%)',
          border: mounted && isDark
            ? '1px solid rgba(107, 114, 128, 0.3)'
            : '1px solid rgba(156, 163, 175, 0.3)',
          boxShadow: mounted && isDark
            ? '0 20px 60px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(107, 114, 128, 0.1) inset, 0 8px 32px -8px rgba(107, 114, 128, 0.15)'
            : '0 20px 60px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(156, 163, 175, 0.1) inset, 0 8px 32px -8px rgba(156, 163, 175, 0.1)',
        }}
        {...props}
      >
        {/* Gradient overlay for extra glassmorphism effect */}
        {mounted && (
          <div 
            className="absolute inset-0 pointer-events-none opacity-30 rounded-xl sm:rounded-2xl"
            style={{
              background: isDark
                ? 'linear-gradient(90deg, transparent 0%, rgba(31, 193, 107, 0.1) 50%, transparent 100%)'
                : 'linear-gradient(90deg, transparent 0%, rgba(31, 193, 107, 0.08) 50%, transparent 100%)',
            }}
          />
        )}
        <div className="relative z-10">
          {children as React.ReactNode}
        </div>
        <DialogPrimitive.Close 
          className={cn(
            "absolute right-3 sm:right-4 top-3 sm:top-4 rounded-lg p-1.5 sm:p-2 opacity-70 transition-all duration-300 hover:opacity-100 focus:outline-none disabled:pointer-events-none z-20",
            mounted && isDark
              ? "hover:bg-white/10 text-gray-300 hover:text-white"
              : "hover:bg-gray-100 text-gray-600 hover:text-gray-900",
            props.hiddenCloseButton ? 'hidden' : ''
          )}
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const isDark = resolvedTheme === 'dark' || (resolvedTheme === undefined && theme === 'dark')

  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn(
        "text-base sm:text-lg font-semibold leading-none tracking-tight",
        mounted && isDark ? "text-white" : "text-gray-900",
        className
      )}
      {...props}
    />
  )
})
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const isDark = resolvedTheme === 'dark' || (resolvedTheme === undefined && theme === 'dark')

  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn(
        "text-sm",
        mounted && isDark ? "text-gray-400" : "text-gray-600",
        className
      )}
      {...props}
    />
  )
})
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
