"use client"

import { AlertCircle, X } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function ActiveBlockBanner() {
  const [dismissed, setDismissed] = useState(false)
  const router = useRouter()

  if (dismissed) return null

  const handleDismiss = () => {
    setDismissed(true)
    // Clean the URL query param
    router.replace("/plans", { scroll: false })
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pt-4">
      <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
        <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
        <p className="flex-1 text-sm text-foreground">
          You already have an active training block. Complete or delete it before creating a new one.
        </p>
        <button
          onClick={handleDismiss}
          className="shrink-0 rounded-md p-1 hover:bg-destructive/10"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  )
}
