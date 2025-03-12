"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

// Create context for tooltip
const TooltipContext = React.createContext({
  open: false,
  setOpen: () => {},
  triggerRef: { current: null }
})

const TooltipProvider = ({ children, delayDuration = 700 }) => {
  return React.Children.map(children, child => 
    React.cloneElement(child, { delayDuration })
  )
}

const Tooltip = ({ children, open, defaultOpen, onOpenChange, delayDuration = 700 }) => {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen || open || false)
  const triggerRef = React.useRef(null)
  const timeoutRef = React.useRef(null)
  
  React.useEffect(() => {
    if (open !== undefined) {
      setInternalOpen(open)
    }
  }, [open])
  
  const handleOpenChange = React.useCallback((value) => {
    setInternalOpen(value)
    onOpenChange?.(value)
  }, [onOpenChange])
  
  const handleOpen = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      handleOpenChange(true)
    }, delayDuration)
  }, [delayDuration, handleOpenChange])
  
  const handleClose = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    handleOpenChange(false)
  }, [handleOpenChange])
  
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
  
  return (
    <TooltipContext.Provider 
      value={{ 
        open: internalOpen, 
        setOpen: handleOpenChange,
        triggerRef,
        handleOpen,
        handleClose
      }}
    >
      {children}
    </TooltipContext.Provider>
  )
}

const TooltipTrigger = React.forwardRef(({ children, asChild, ...props }, forwardedRef) => {
  const { triggerRef, handleOpen, handleClose } = React.useContext(TooltipContext)
  const ref = React.useRef(null)
  
  React.useImperativeHandle(forwardedRef, () => ref.current)
  React.useEffect(() => {
    if (forwardedRef) {
      triggerRef.current = ref.current
    }
  }, [forwardedRef, triggerRef])
  
  const Comp = asChild ? React.Children.only(children).type : "button"
  
  return React.cloneElement(
    asChild ? React.Children.only(children) : <Comp type="button" {...props} />,
    {
      ref,
      onMouseEnter: (e) => {
        const childOnMouseEnter = asChild ? React.Children.only(children).props.onMouseEnter : props.onMouseEnter
        childOnMouseEnter?.(e)
        handleOpen()
      },
      onMouseLeave: (e) => {
        const childOnMouseLeave = asChild ? React.Children.only(children).props.onMouseLeave : props.onMouseLeave
        childOnMouseLeave?.(e)
        handleClose()
      },
      onFocus: (e) => {
        const childOnFocus = asChild ? React.Children.only(children).props.onFocus : props.onFocus
        childOnFocus?.(e)
        handleOpen()
      },
      onBlur: (e) => {
        const childOnBlur = asChild ? React.Children.only(children).props.onBlur : props.onBlur
        childOnBlur?.(e)
        handleClose()
      },
      ...(!asChild && props)
    }
  )
})
TooltipTrigger.displayName = "TooltipTrigger"

const TooltipContent = React.forwardRef(({ className, sideOffset = 4, ...props }, ref) => {
  const { open, triggerRef } = React.useContext(TooltipContext)
  const [position, setPosition] = React.useState({ top: 0, left: 0 })
  const [mounted, setMounted] = React.useState(false)
  
  React.useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])
  
  React.useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + window.scrollY + sideOffset,
        left: rect.left + window.scrollX + rect.width / 2
      })
    }
  }, [open, sideOffset, triggerRef])
  
  if (!mounted || !open) return null
  
  return createPortal(
    <div
      ref={ref}
      role="tooltip"
      style={{ 
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)'
      }}
      className={cn(
        "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />,
    document.body
  )
})
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } 