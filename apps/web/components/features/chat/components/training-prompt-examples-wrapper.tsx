"use client"

import { useRouter } from "next/navigation"
import { TrainingPromptExamples } from "./training-prompt-examples"

interface TrainingPromptExamplesWrapperProps {
  className?: string
}

export function TrainingPromptExamplesWrapper({ 
  className 
}: TrainingPromptExamplesWrapperProps) {
  const router = useRouter()

  const handleSelectPrompt = (prompt: string) => {
    // Navigate to new conversation with the selected prompt
    const encodedPrompt = encodeURIComponent(prompt)
    router.push(`/copilot/new?prompt=${encodedPrompt}`)
  }

  return (
    <TrainingPromptExamples 
      onSelectPrompt={handleSelectPrompt}
      className={className}
    />
  )
} 