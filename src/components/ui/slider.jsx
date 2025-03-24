"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef(({ className, ...props }, ref) => {
  // Additional props
  const { value: sliderValue = [0], max = 100, variant = "default", style, ...sliderProps } = props;
  
  // Get gradient style for track based on variant
  const getGradientStyle = (variant, customStyle) => {
    // If a custom style is provided, use that instead
    if (customStyle) {
      return customStyle;
    }

    switch (variant) {
      case 'intensity':
        // Orange to red gradient - exact match to Training Intensity
        return {
          background: 'linear-gradient(to right, hsla(25, 70%, 62%, 0.7), hsla(0, 90%, 40%, 0.9))'
        };
      case 'volume':
        // Blue to purple gradient - exact match to Training Volume
        return {
          background: 'linear-gradient(to right, hsla(210, 65%, 65%, 0.7), hsla(270, 85%, 40%, 0.9))'
        };
      default:
        // For default case, use the black gradient that matches the baseline sliders
        return {
          background: 'linear-gradient(to right, hsla(0, 0%, 40%, 0.7), hsla(0, 0%, 10%, 0.9))'
        };
    }
  };

  // Get HSL-based thumb border color
  const getThumbStyle = (value, min, max, variant) => {
    // Get the current position as a percentage
    const percent = ((value - min) / (max - min)) * 100;
    
    // For intensity variant, use gradient from orange to red
    if (variant === 'intensity') {
      const hue = 25 - (25 * percent / 100); // 25 (orange) to 0 (red)
      return {
        borderColor: `hsla(${hue}, 80%, 50%, 0.9)`,
        boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.2)'
      };
    }
    
    // For volume variant, use gradient from blue to purple
    if (variant === 'volume') {
      const hue = 210 + (60 * percent / 100); // 210 (blue) to 270 (purple)
      return {
        borderColor: `hsla(${hue}, 80%, 50%, 0.9)`,
        boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.2)'
      };
    }
    
    // For default variant, use gray/black to match baseline training sliders
    return {
      borderColor: 'hsla(0, 0%, 40%, 0.9)',
      boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.2)'
    };
  };

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn("relative flex w-full touch-none select-none items-center", className)}
      value={sliderValue}
      max={max}
      {...sliderProps}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-gray-200">
        {/* Apply the gradient to the filled portion of the slider only */}
        <SliderPrimitive.Range 
          className="absolute h-full" 
          style={getGradientStyle(variant, style)}
        />
      </SliderPrimitive.Track>
      {sliderValue.map((value, i) => (
        <SliderPrimitive.Thumb
          key={i}
          className="block h-5 w-5 rounded-full border-2 bg-white shadow-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:border-opacity-80"
          style={getThumbStyle(value, 0, max, variant)}
        />
      ))}
    </SliderPrimitive.Root>
  );
});
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider } 