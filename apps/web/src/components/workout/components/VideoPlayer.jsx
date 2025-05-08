"use client"

import React from "react"

/**
 * VideoPlayer Component
 * Renders a video player with controls
 * 
 * @param {Object} props
 * @param {string} props.url - The URL of the video to play
 */
const VideoPlayer = ({ url }) => {
  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-4">
      <video
        className="w-full h-full"
        controls
        preload="none"
        poster="/video-placeholder.jpg"
      >
        <source src={url} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  )
}

export default VideoPlayer 