"use client"

import * as React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, CheckCircle, AlertCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

// Toast context that will hold all the toasts and expose methods to manage them
const ToastContext = createContext({
  toasts: [],
  toast: () => {},
  dismiss: () => {},
  clearAll: () => {}
})

/**
 * Custom hook to access the toast functionality
 */
export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

/**
 * Toast Provider component that manages toasts
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])
  const [isMounted, setIsMounted] = useState(false)

  // Set isMounted to true after component mounts (for SSR)
  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  // Display a new toast
  const toast = useCallback(({ title, description, variant = "default", duration = 5000 }) => {
    const id = Math.random().toString(36).substring(2, 9)
    
    setToasts(prev => [...prev, { id, title, description, variant, duration }])
    
    // Auto dismiss after duration
    if (duration) {
      setTimeout(() => {
        dismiss(id)
      }, duration)
    }
    
    return id
  }, [])

  // Dismiss a specific toast by its ID
  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Clear all toasts
  const clearAll = useCallback(() => {
    setToasts([])
  }, [])

  // Convenience methods for common toast types
  const success = useCallback((props) => {
    return toast({ ...props, variant: "success" })
  }, [toast])

  const error = useCallback((props) => {
    return toast({ ...props, variant: "destructive" })
  }, [toast])

  const info = useCallback((props) => {
    return toast({ ...props, variant: "info" })
  }, [toast])

  const warning = useCallback((props) => {
    return toast({ ...props, variant: "warning" })
  }, [toast])

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss, clearAll, success, error, info, warning }}>
      {children}
      {isMounted && <ToastContainer toasts={toasts} dismiss={dismiss} />}
    </ToastContext.Provider>
  )
}

/**
 * Toast Container component that renders all active toasts
 */
const ToastContainer = ({ toasts, dismiss }) => {
  // If there are no toasts, don't render the container
  if (!toasts.length) return null

  return createPortal(
    <div className="fixed top-0 right-0 z-50 p-4 flex flex-col items-end gap-2 max-w-md w-full">
      <AnimatePresence>
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </AnimatePresence>
    </div>,
    document.body
  )
}

/**
 * Individual toast component
 */
const Toast = ({ toast, onDismiss }) => {
  const { title, description, variant } = toast
  
  // Define styles for different toast variants
  const variantStyles = {
    default: {
      container: "bg-white border-gray-200",
      title: "text-gray-900",
      description: "text-gray-600",
      icon: <Info className="h-5 w-5 text-blue-500" />
    },
    success: {
      container: "bg-white border-green-200",
      title: "text-green-900",
      description: "text-green-700",
      icon: <CheckCircle className="h-5 w-5 text-green-500" />
    },
    destructive: {
      container: "bg-white border-red-200",
      title: "text-red-900",
      description: "text-red-700",
      icon: <AlertCircle className="h-5 w-5 text-red-500" />
    },
    warning: {
      container: "bg-white border-yellow-200",
      title: "text-yellow-900",
      description: "text-yellow-700",
      icon: <AlertCircle className="h-5 w-5 text-yellow-500" />
    },
    info: {
      container: "bg-white border-blue-200",
      title: "text-blue-900",
      description: "text-blue-700",
      icon: <Info className="h-5 w-5 text-blue-500" />
    }
  }
  
  const styles = variantStyles[variant] || variantStyles.default
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.85 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.85 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "rounded-lg border shadow-md overflow-hidden pointer-events-auto",
        styles.container
      )}
    >
      <div className="relative p-4 pr-8 flex gap-3">
        <div className="flex-shrink-0">
          {styles.icon}
        </div>
        
        <div className="flex-1 pt-0.5">
          {title && (
            <h3 className={cn("font-medium text-sm", styles.title)}>
              {title}
            </h3>
          )}
          
          {description && (
            <div className={cn("text-sm mt-1", styles.description)}>
              {description}
            </div>
          )}
        </div>
        
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 flex-shrink-0 rounded-full p-1 bg-white/50 hover:bg-gray-100 text-gray-400 hover:text-gray-500 transition"
          aria-label="Close toast"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  )
} 