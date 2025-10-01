"use client"

import { CheckCircle2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect } from "react"

interface SuccessToastProps {
  message: string
  onClose: () => void
  autoClose?: boolean
  duration?: number
}

export function SuccessToast({ message, onClose, autoClose = true, duration = 3000 }: SuccessToastProps) {
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [autoClose, duration, onClose])

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <div className="bg-green-600 text-white rounded-lg shadow-lg p-4 border border-green-700">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{message}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0 text-white hover:bg-green-700">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
