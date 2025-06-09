"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const DialogContext = React.createContext({
  open: false,
  setOpen: () => {},
  triggerRef: { current: null }
})

const Dialog = ({ children, open, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = React.useState(open || false)
  const triggerRef = React.useRef(null)
  
  React.useEffect(() => {
    if (open !== undefined) {
      setInternalOpen(open)
    }
  }, [open])
  
  const handleOpenChange = React.useCallback((value) => {
    setInternalOpen(value)
    onOpenChange?.(value)
  }, [onOpenChange])
  
  return (
    <DialogContext.Provider 
      value={{ 
        open: internalOpen, 
        setOpen: handleOpenChange,
        triggerRef
      }}
    >
      {children}
    </DialogContext.Provider>
  )
}

const DialogTrigger = React.forwardRef(({ children, asChild, ...props }, forwardedRef) => {
  const { setOpen, triggerRef } = React.useContext(DialogContext)
  const ref = React.useRef(null)
  
  React.useImperativeHandle(forwardedRef, () => ref.current)
  React.useEffect(() => {
    if (forwardedRef) {
      triggerRef.current = ref.current
    }
  }, [forwardedRef])
  
  const Comp = asChild ? React.Children.only(children).type : "button"
  
  return React.cloneElement(
    asChild ? React.Children.only(children) : <Comp {...props} />,
    {
      ref,
      onClick: (e) => {
        const childOnClick = asChild ? React.Children.only(children).props.onClick : props.onClick
        childOnClick?.(e)
        setOpen(true)
      },
      ...(!asChild && props)
    }
  )
})
DialogTrigger.displayName = "DialogTrigger"

const DialogPortal = ({ children, container }) => {
  const { open } = React.useContext(DialogContext)
  const [mounted, setMounted] = React.useState(false)
  
  React.useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])
  
  if (!mounted || !open) return null
  
  return createPortal(children, container || document.body)
}

const DialogClose = React.forwardRef(({ children, asChild, ...props }, forwardedRef) => {
  const { setOpen } = React.useContext(DialogContext)
  const Comp = asChild ? React.Children.only(children).type : "button"
  
  return React.cloneElement(
    asChild ? React.Children.only(children) : <Comp {...props} />,
    {
      ref: forwardedRef,
      onClick: (e) => {
        const childOnClick = asChild ? React.Children.only(children).props.onClick : props.onClick
        childOnClick?.(e)
        setOpen(false)
      },
      ...(!asChild && props)
    }
  )
})
DialogClose.displayName = "DialogClose"

const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => {
  const { setOpen } = React.useContext(DialogContext)
  
  return (
    <div
      ref={ref}
      className={cn(
        "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      onClick={() => setOpen(false)}
      {...props}
    />
  )
})
DialogOverlay.displayName = "DialogOverlay"

const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <DialogPortal>
      <DialogOverlay />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
          className
        )}
        onClick={(e) => {
          e.stopPropagation();
        }}
        {...props}
      >
        {children}
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
      </div>
    </DialogPortal>
  )
})
DialogContent.displayName = "DialogContent"

const DialogHeader = ({ className, ...props }) => (
  <div
    className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({ className, ...props }) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = "DialogDescription"

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