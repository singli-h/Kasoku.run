"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Create context for tooltip
const TooltipContext = React.createContext({
  open: false,
  setOpen: () => {},
  triggerRef: { current: null }
})

const TooltipProvider = ({ children, delayDuration = 700 }) => {
  // Wrap children in a relative positioned div to serve as positioning context
  return (
    <div className="relative inline-flex overflow-visible" style={{ zIndex: 50 }}>
      {React.Children.map(children, child => 
        React.cloneElement(child, { delayDuration })
      )}
    </div>
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

const TooltipContent = React.forwardRef(({ className, ...props }, ref) => {
  const { open, triggerRef } = React.useContext(TooltipContext)
  
  if (!open) return null
  
  return (
    <div
      ref={ref}
      role="tooltip"
      style={{
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginTop: '5px',
        zIndex: 9999,
        width: 'auto',
        minWidth: '300px',
        maxWidth: '750px'
      }}
      className={cn(
        "overflow-visible rounded-md border bg-white px-3 py-1.5 text-sm shadow-md animate-in fade-in-0 zoom-in-95 whitespace-normal break-words",
        className
      )}
      {...props}
    />
  )
})
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } 