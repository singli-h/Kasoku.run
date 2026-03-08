'use client'

/**
 * useSpeechRecognition Hook
 *
 * Provides voice-to-text functionality using the Web Speech API.
 * Handles browser compatibility, recording state, and transcription.
 */

import { useState, useCallback, useEffect, useRef } from 'react'

interface SpeechRecognitionResult {
  /** Whether the browser supports speech recognition */
  isSupported: boolean
  /** Whether currently recording */
  isListening: boolean
  /** Current transcript (interim + final) */
  transcript: string
  /** Error message if any */
  error: string | null
  /** Start listening */
  startListening: () => void
  /** Stop listening */
  stopListening: () => void
  /** Reset transcript */
  resetTranscript: () => void
}

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: {
    isFinal: boolean
    [index: number]: {
      transcript: string
      confidence: number
    }
  }
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance
    webkitSpeechRecognition: new () => SpeechRecognitionInstance
  }
}

/**
 * Hook for speech-to-text functionality.
 *
 * @param onTranscript - Callback when final transcript is available
 * @returns Speech recognition state and controls
 *
 * @example
 * ```tsx
 * const { isListening, startListening, stopListening, transcript } = useSpeechRecognition({
 *   onTranscript: (text) => setInput(prev => prev + text)
 * })
 * ```
 */
export function useSpeechRecognition(options?: {
  onTranscript?: (transcript: string) => void
  continuous?: boolean
  language?: string
}): SpeechRecognitionResult {
  const { onTranscript, continuous = false, language = 'en-US' } = options ?? {}

  const [isSupported, setIsSupported] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const onTranscriptRef = useRef(onTranscript)

  // Keep callback ref updated
  useEffect(() => {
    onTranscriptRef.current = onTranscript
  }, [onTranscript])

  // Check browser support and initialize
  useEffect(() => {
    const SpeechRecognition =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null

    if (SpeechRecognition) {
      setIsSupported(true)
      const recognition = new SpeechRecognition()
      recognition.continuous = continuous
      recognition.interimResults = true
      recognition.lang = language

      recognition.onstart = () => {
        setIsListening(true)
        setError(null)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          if (result.isFinal) {
            finalTranscript += result[0].transcript
          } else {
            interimTranscript += result[0].transcript
          }
        }

        // Show interim results while speaking
        setTranscript(finalTranscript || interimTranscript)

        // Call callback with final transcript
        if (finalTranscript && onTranscriptRef.current) {
          onTranscriptRef.current(finalTranscript)
        }
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('[SpeechRecognition] Error:', event.error)
        setIsListening(false)

        switch (event.error) {
          case 'not-allowed':
            setError('Microphone access denied. Please allow microphone access.')
            break
          case 'no-speech':
            setError('No speech detected. Please try again.')
            break
          case 'network':
            setError('Network error. Please check your connection.')
            break
          case 'aborted':
            // User aborted, not an error
            break
          default:
            setError(`Speech recognition error: ${event.error}`)
        }
      }

      recognitionRef.current = recognition
    } else {
      setIsSupported(false)
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [continuous, language])

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setError(null)
      setTranscript('')
      try {
        recognitionRef.current.start()
      } catch (err) {
        console.error('[SpeechRecognition] Start error:', err)
        setError('Failed to start speech recognition')
      }
    }
  }, [isListening])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }, [isListening])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setError(null)
  }, [])

  return {
    isSupported,
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  }
}
