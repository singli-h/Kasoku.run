"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Create context for radio group
const RadioGroupContext = React.createContext({
  value: "",
  onValueChange: () => {},
  name: ""
})

const RadioGroup = React.forwardRef(({ className, value, onValueChange, name, ...props }, ref) => {
  const [internalValue, setInternalValue] = React.useState(value || "")
  
  React.useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value)
    }
  }, [value])
  
  const handleValueChange = React.useCallback((newValue) => {
    setInternalValue(newValue)
    onValueChange?.(newValue)
  }, [onValueChange])
  
  return (
    <RadioGroupContext.Provider 
      value={{ 
        value: internalValue, 
        onValueChange: handleValueChange,
        name
      }}
    >
      <div 
        ref={ref}
        role="radiogroup"
        className={cn("grid gap-2", className)}
        {...props}
      />
    </RadioGroupContext.Provider>
  )
})
RadioGroup.displayName = "RadioGroup"

const RadioGroupItem = React.forwardRef(({ className, value, ...props }, ref) => {
  const { value: groupValue, onValueChange, name } = React.useContext(RadioGroupContext)
  const id = React.useId()
  
  return (
    <span className="flex items-center space-x-2">
      <input
        ref={ref}
        type="radio"
        id={id}
        name={name}
        value={value}
        checked={value === groupValue}
        onChange={() => onValueChange(value)}
        className="sr-only"
        {...props}
      />
      <label
        htmlFor={id}
        className={cn(
          "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center",
          className
        )}
      >
        {value === groupValue && (
          <div className="h-2 w-2 rounded-full bg-current" />
        )}
      </label>
    </span>
  )
})
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem } 