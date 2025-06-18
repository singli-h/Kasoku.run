/**
 * Video Player Component
 * Responsive video player with multiple source support and fallback demo links
 * 
 * Based on the effective video system from the original Kasoku workout system
 * Handles YouTube, Vimeo, direct video URLs, and graceful fallbacks
 */

"use client"

import { useState, useMemo } from "react"
import { Play, ExternalLink, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface VideoPlayerProps {
  url: string | null | undefined
  title?: string
  className?: string
  showFallback?: boolean
  autoPlay?: boolean
  controls?: boolean
}

// Helper function to detect video type and generate embed URLs
const getVideoEmbedInfo = (url: string) => {
  if (!url) return null

  // YouTube detection
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  const youtubeMatch = url.match(youtubeRegex)
  if (youtubeMatch) {
    return {
      type: 'youtube',
      id: youtubeMatch[1],
      embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}`,
      thumbnailUrl: `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`
    }
  }

  // Vimeo detection
  const vimeoRegex = /(?:vimeo\.com\/)([0-9]+)/
  const vimeoMatch = url.match(vimeoRegex)
  if (vimeoMatch) {
    return {
      type: 'vimeo',
      id: vimeoMatch[1],
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      thumbnailUrl: null // Vimeo thumbnails require API call
    }
  }

  // Direct video URL (mp4, webm, etc.)
  if (url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i)) {
    return {
      type: 'direct',
      id: null,
      embedUrl: url,
      thumbnailUrl: null
    }
  }

  // Default to external link
  return {
    type: 'external',
    id: null,
    embedUrl: null,
    thumbnailUrl: null
  }
}

/**
 * Embedded video iframe component
 */
function EmbeddedVideo({ 
  embedUrl, 
  title, 
  type, 
  autoPlay = false, 
  onError 
}: {
  embedUrl: string
  title?: string
  type: string
  autoPlay?: boolean
  onError: () => void
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    onError()
  }

  // Build iframe src with appropriate parameters
  const iframeSrc = useMemo(() => {
    let src = embedUrl
    
    if (type === 'youtube') {
      const params = new URLSearchParams()
      if (autoPlay) params.append('autoplay', '1')
      params.append('rel', '0') // Don't show related videos
      params.append('modestbranding', '1') // Minimal YouTube branding
      
      if (params.toString()) {
        src += `?${params.toString()}`
      }
    } else if (type === 'vimeo') {
      const params = new URLSearchParams()
      if (autoPlay) params.append('autoplay', '1')
      params.append('title', '0')
      params.append('byline', '0')
      params.append('portrait', '0')
      
      if (params.toString()) {
        src += `?${params.toString()}`
      }
    }
    
    return src
  }, [embedUrl, type, autoPlay])

  if (hasError) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
        <div className="text-center p-4">
          <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Unable to load video</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
        </div>
      )}
      
      <iframe
        src={iframeSrc}
        title={title || "Exercise video"}
        className="w-full h-full rounded-lg"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        onLoad={handleLoad}
        onError={handleError}
        style={{ border: 'none' }}
      />
    </div>
  )
}

/**
 * Direct video player component
 */
function DirectVideo({ 
  url, 
  title, 
  controls = true, 
  autoPlay = false,
  onError 
}: {
  url: string
  title?: string
  controls?: boolean
  autoPlay?: boolean
  onError: () => void
}) {
  const [hasError, setHasError] = useState(false)

  const handleError = () => {
    setHasError(true)
    onError()
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
        <div className="text-center p-4">
          <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Unable to load video</p>
        </div>
      </div>
    )
  }

  return (
    <video
      className="w-full h-full rounded-lg"
      controls={controls}
      autoPlay={autoPlay}
      preload="metadata"
      onError={handleError}
      poster="/video-placeholder.jpg" // You can add a placeholder image
    >
      <source src={url} type="video/mp4" />
      <source src={url} type="video/webm" />
      <source src={url} type="video/ogg" />
      Your browser does not support the video tag.
    </video>
  )
}

/**
 * Video fallback component - shows demo link button
 */
function VideoFallback({ url, title }: { url: string; title?: string }) {
  return (
    <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
      <div className="text-center p-6">
        <Play className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-sm text-gray-600 mb-4">
          {title ? `${title} Demo` : "Exercise Demo Video"}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
          className="gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          Watch Demo
        </Button>
      </div>
    </div>
  )
}

/**
 * Main VideoPlayer component
 */
export function VideoPlayer({
  url,
  title,
  className,
  showFallback = true,
  autoPlay = false,
  controls = true
}: VideoPlayerProps) {
  const [showEmbedded, setShowEmbedded] = useState(true)

  // Parse video URL and determine type
  const videoInfo = useMemo(() => {
    if (!url) return null
    return getVideoEmbedInfo(url)
  }, [url])

  const handleVideoError = () => {
    setShowEmbedded(false)
  }

  // No URL provided
  if (!url || !videoInfo) {
    return null
  }

  // If embedded player failed and no fallback, don't render
  if (!showEmbedded && !showFallback) {
    return null
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-0">
        <div className="relative w-full aspect-video">
          {showEmbedded && videoInfo.embedUrl ? (
            // Show embedded player
            videoInfo.type === 'direct' ? (
              <DirectVideo
                url={videoInfo.embedUrl}
                title={title}
                controls={controls}
                autoPlay={autoPlay}
                onError={handleVideoError}
              />
            ) : (
              <EmbeddedVideo
                embedUrl={videoInfo.embedUrl}
                title={title}
                type={videoInfo.type}
                autoPlay={autoPlay}
                onError={handleVideoError}
              />
            )
          ) : (
            // Show fallback demo link
            showFallback && <VideoFallback url={url} title={title} />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Compact video player for inline use
 */
export function CompactVideoPlayer({
  url,
  title,
  className
}: VideoPlayerProps) {
  if (!url) return null

  return (
    <div className={cn("aspect-video", className)}>
      <VideoPlayer 
        url={url} 
        title={title} 
        showFallback={true}
        autoPlay={false}
        controls={true}
      />
    </div>
  )
}

/**
 * Video demo button - minimal component for space-constrained areas
 */
export function VideoDemoButton({
  url,
  title,
  className,
  variant = "outline",
  size = "sm"
}: VideoPlayerProps & {
  variant?: "outline" | "default" | "ghost"
  size?: "sm" | "default" | "lg"
}) {
  if (!url) return null

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
      className={cn("gap-2", className)}
    >
      <Play className="h-4 w-4" />
      {title || "Demo"}
    </Button>
  )
} 