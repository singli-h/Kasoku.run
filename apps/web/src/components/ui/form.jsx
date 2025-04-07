/**
 * Form Component Library
 * 
 * A comprehensive form component system built on top of react-hook-form.
 * Provides accessible form controls with built-in validation and error handling.
 * 
 * Features:
 * - Form context management
 * - Field-level validation
 * - Accessible form controls
 * - Error message handling
 * - Description support
 * 
 * @module Form
 */

"use client"

import * as React from "react"
import {
  Controller,
  FormProvider,
  useFormContext,
} from "react-hook-form"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

// Custom Slot component to replace Radix UI's Slot
const Slot = React.forwardRef(({ children, ...props }, ref) => {
  if (!children) {
    return null
  }

  if (typeof children === "function") {
    return children({ ...props, ref })
  }

  const child = React.Children.only(children)
  return React.cloneElement(child, {
    ...props,
    ...child.props,
    ref: ref
      ? (node) => {
          if (typeof ref === "function") {
            ref(node)
          } else if (ref) {
            ref.current = node
          }
          const childRef = child.ref
          if (childRef) {
            if (typeof childRef === "function") {
              childRef(node)
            } else {
              childRef.current = node
            }
          }
        }
      : child.ref,
  })
})
Slot.displayName = "Slot"

// Re-export FormProvider as Form for better semantic meaning
const Form = FormProvider

// Create context for form field state
const FormFieldContext = React.createContext({})

/**
 * FormField Component
 * Provides context and control for individual form fields
 */
const FormField = (props) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

/**
 * Custom hook for accessing form field context and state
 * Provides field metadata, validation state, and accessibility attributes
 */
const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()

  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

// Create context for form item state
const FormItemContext = React.createContext({})

/**
 * FormItem Component
 * Container component for form fields with spacing and context
 */
const FormItem = React.forwardRef(({ className, ...props }, ref) => {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = "FormItem"

/**
 * FormLabel Component
 * Accessible label component with error state styling
 */
const FormLabel = React.forwardRef(({ className, children, ...props }, ref) => {
  const { error, formItemId } = useFormField()

  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    >
      {children}
    </Label>
  )
})
FormLabel.displayName = "FormLabel"

/**
 * FormControl Component
 * Wrapper for form inputs with accessibility attributes
 */
const FormControl = React.forwardRef(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  )
})
FormControl.displayName = "FormControl"

/**
 * FormDescription Component
 * Helper text component for form fields
 */
const FormDescription = React.forwardRef(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

/**
 * FormMessage Component
 * Error message display for form fields
 */
const FormMessage = React.forwardRef(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message) : children

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
} 