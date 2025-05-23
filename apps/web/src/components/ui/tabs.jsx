"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Create context for tabs
const TabsContext = React.createContext({
  value: "",
  onValueChange: () => {},
  orientation: "horizontal"
})

const Tabs = ({ value, defaultValue, onValueChange, orientation = "horizontal", children, ...props }) => {
  // Support defaultValue for uncontrolled initial tab selection
  const [internalValue, setInternalValue] = React.useState(value ?? defaultValue ?? "")
  
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
    <TabsContext.Provider 
      value={{ 
        value: internalValue, 
        onValueChange: handleValueChange,
        orientation
      }}
    >
      <div {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    role="tablist"
    {...props}
  />
))
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef(({ className, value, children, ...props }, ref) => {
  const { value: selectedValue, onValueChange } = React.useContext(TabsContext)
  const isActive = selectedValue === value
  
  return (
    <button
      ref={ref}
      role="tab"
      aria-selected={isActive}
      data-state={isActive ? "active" : "inactive"}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        className
      )}
      onClick={() => onValueChange(value)}
      {...props}
    >
      {children}
    </button>
  )
})
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef(({ className, value, children, ...props }, ref) => {
  const { value: selectedValue } = React.useContext(TabsContext)
  const isActive = selectedValue === value
  
  if (!isActive) return null
  
  return (
    <div
      ref={ref}
      role="tabpanel"
      data-state={isActive ? "active" : "inactive"}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }

