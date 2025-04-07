"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { Check, ChevronRight, Circle } from "lucide-react"

// Create context for dropdown menu
const DropdownMenuContext = React.createContext({
  open: false,
  setOpen: () => {},
  triggerRef: { current: null }
})

// Create context for dropdown submenu
const DropdownMenuSubContext = React.createContext({
  open: false,
  setOpen: () => {},
  triggerRef: { current: null }
})

// Create context for radio group
const DropdownMenuRadioContext = React.createContext({
  value: undefined,
  onValueChange: () => {}
})

const DropdownMenu = ({ children, open, onOpenChange }) => {
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
    <DropdownMenuContext.Provider 
      value={{ 
        open: internalOpen, 
        setOpen: handleOpenChange,
        triggerRef
      }}
    >
      {children}
    </DropdownMenuContext.Provider>
  )
}

const DropdownMenuTrigger = React.forwardRef(({ children, asChild, ...props }, forwardedRef) => {
  const { setOpen, triggerRef } = React.useContext(DropdownMenuContext)
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
        setOpen(prev => !prev)
      },
      ...(!asChild && props)
    }
  )
})
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

const DropdownMenuGroup = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("", className)}
    {...props}
  />
))
DropdownMenuGroup.displayName = "DropdownMenuGroup"

const DropdownMenuPortal = ({ children, container }) => {
  const { open } = React.useContext(DropdownMenuContext)
  const [mounted, setMounted] = React.useState(false)
  
  React.useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])
  
  if (!mounted || !open) return null
  
  return createPortal(children, container || document.body)
}

const DropdownMenuSub = ({ children, open, onOpenChange }) => {
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
    <DropdownMenuSubContext.Provider 
      value={{ 
        open: internalOpen, 
        setOpen: handleOpenChange,
        triggerRef
      }}
    >
      {children}
    </DropdownMenuSubContext.Provider>
  )
}

const DropdownMenuRadioGroup = React.forwardRef(({ className, value, onValueChange, ...props }, ref) => {
  return (
    <DropdownMenuRadioContext.Provider value={{ value, onValueChange }}>
      <div ref={ref} className={cn("", className)} {...props} />
    </DropdownMenuRadioContext.Provider>
  )
})
DropdownMenuRadioGroup.displayName = "DropdownMenuRadioGroup"

const DropdownMenuSubTrigger = React.forwardRef(({ className, inset, children, ...props }, ref) => {
  const { setOpen, triggerRef } = React.useContext(DropdownMenuSubContext)
  
  React.useEffect(() => {
    if (ref) {
      triggerRef.current = ref.current
    }
  }, [ref, triggerRef])
  
  return (
    <div
      ref={ref}
      className={cn(
        "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-slate-100 data-[state=open]:bg-slate-100 dark:focus:bg-slate-800 dark:data-[state=open]:bg-slate-800",
        inset && "pl-8",
        className
      )}
      onClick={() => setOpen(true)}
      {...props}
    >
      {children}
      <ChevronRight className="ml-auto h-4 w-4" />
    </div>
  )
})
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger"

const DropdownMenuSubContent = React.forwardRef(({ className, ...props }, ref) => {
  const { open } = React.useContext(DropdownMenuSubContext)
  
  if (!open) return null
  
  return (
    <div
      ref={ref}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border border-slate-200 bg-white p-1 text-slate-950 shadow-lg animate-in fade-in-80 data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50",
        className
      )}
      {...props}
    />
  )
})
DropdownMenuSubContent.displayName = "DropdownMenuSubContent"

const DropdownMenuContent = React.forwardRef(({ className, sideOffset = 4, ...props }, ref) => {
  const { open, triggerRef, setOpen } = React.useContext(DropdownMenuContext)
  const [position, setPosition] = React.useState({ top: 0, left: 0 })
  
  React.useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + window.scrollY + sideOffset,
        left: rect.left + window.scrollX
      })
    }
  }, [open, sideOffset, triggerRef])
  
  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        open && 
        ref.current && 
        !ref.current.contains(e.target) && 
        triggerRef.current && 
        !triggerRef.current.contains(e.target)
      ) {
        setOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, ref, triggerRef, setOpen])
  
  if (!open) return null
  
  return (
    <div
      ref={ref}
      style={{ 
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`
      }}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border border-slate-200 bg-white p-1 text-slate-950 shadow-md animate-in fade-in-80 data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50",
        className
      )}
      {...props}
    />
  )
})
DropdownMenuContent.displayName = "DropdownMenuContent"

const DropdownMenuItem = React.forwardRef(({ className, inset, onClick, ...props }, ref) => {
  const { setOpen } = React.useContext(DropdownMenuContext)
  
  const handleClick = (e) => {
    onClick?.(e)
    setOpen(false)
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-slate-100 focus:text-slate-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-slate-800 dark:focus:text-slate-50",
        inset && "pl-8",
        className
      )}
      onClick={handleClick}
      {...props}
    />
  )
})
DropdownMenuItem.displayName = "DropdownMenuItem"

const DropdownMenuCheckboxItem = React.forwardRef(({ className, children, checked, onCheckedChange, ...props }, ref) => {
  const { setOpen } = React.useContext(DropdownMenuContext)
  
  const handleClick = () => {
    onCheckedChange?.(!checked)
    setOpen(false)
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-slate-100 focus:text-slate-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-slate-800 dark:focus:text-slate-50",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {checked && <Check className="h-4 w-4" />}
      </span>
      {children}
    </div>
  )
})
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem"

const DropdownMenuRadioItem = React.forwardRef(({ className, children, value, ...props }, ref) => {
  const { value: radioValue, onValueChange } = React.useContext(DropdownMenuRadioContext)
  const { setOpen } = React.useContext(DropdownMenuContext)
  const isSelected = radioValue === value
  
  const handleClick = () => {
    onValueChange?.(value)
    setOpen(false)
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-slate-100 focus:text-slate-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-slate-800 dark:focus:text-slate-50",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Circle className="h-2 w-2 fill-current" />}
      </span>
      {children}
    </div>
  )
})
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem"

const DropdownMenuLabel = React.forwardRef(({ className, inset, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className)}
    {...props}
  />
))
DropdownMenuLabel.displayName = "DropdownMenuLabel"

const DropdownMenuSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-slate-200 dark:bg-slate-800", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = "DropdownMenuSeparator"

const DropdownMenuShortcut = ({ className, ...props }) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} 