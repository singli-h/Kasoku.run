"use client";

import React from "react";
import { AlertCircle, XCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type ErrorSeverity = "error" | "warning" | "info" | "success";

interface ErrorMessageProps {
  message: string;
  severity?: ErrorSeverity;
  className?: string;
  showIcon?: boolean;
  variant?: "inline" | "block" | "toast";
}

/**
 * Standardized error message component
 * Provides consistent error display across the entire webapp
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  severity = "error",
  className,
  showIcon = true,
  variant = "inline",
}) => {
  const getIcon = () => {
    switch (severity) {
      case "error":
        return <XCircle className="h-4 w-4 flex-shrink-0" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 flex-shrink-0" />;
      case "info":
        return <Info className="h-4 w-4 flex-shrink-0" />;
      case "success":
        return <AlertCircle className="h-4 w-4 flex-shrink-0" />;
      default:
        return <XCircle className="h-4 w-4 flex-shrink-0" />;
    }
  };

  const getStyles = () => {
    const baseStyles = "flex items-start gap-2";
    
    switch (variant) {
      case "inline":
        return cn(
          baseStyles,
          "text-sm mt-1",
          severity === "error" && "text-red-500",
          severity === "warning" && "text-yellow-600",
          severity === "info" && "text-blue-600",
          severity === "success" && "text-green-600"
        );
      
      case "block":
        return cn(
          baseStyles,
          "p-3 rounded-md border text-sm",
          severity === "error" && "bg-red-50 border-red-200 text-red-700",
          severity === "warning" && "bg-yellow-50 border-yellow-200 text-yellow-700",
          severity === "info" && "bg-blue-50 border-blue-200 text-blue-700",
          severity === "success" && "bg-green-50 border-green-200 text-green-700"
        );
      
      case "toast":
        return cn(
          baseStyles,
          "fixed top-4 right-4 px-4 py-3 rounded-md border shadow-lg z-50 max-w-md",
          severity === "error" && "bg-red-100 border-red-400 text-red-700",
          severity === "warning" && "bg-yellow-100 border-yellow-400 text-yellow-700",
          severity === "info" && "bg-blue-100 border-blue-400 text-blue-700",
          severity === "success" && "bg-green-100 border-green-400 text-green-700"
        );
      
      default:
        return cn(baseStyles, "text-red-500 text-sm mt-1");
    }
  };

  return (
    <div className={cn(getStyles(), className)} role="alert">
      {showIcon && getIcon()}
      <span className="flex-1">{message}</span>
    </div>
  );
};

interface FieldErrorProps {
  error?: string;
  _fieldName?: string;
  className?: string;
}

/**
 * Specialized component for form field errors
 * Maintains backward compatibility with existing form error patterns
 */
export const FieldError: React.FC<FieldErrorProps> = ({
  error,
  _fieldName,
  className,
}) => {
  if (!error) return null;

  return (
    <ErrorMessage
      message={error}
      severity="error"
      variant="inline"
      showIcon={false}
      className={className}
    />
  );
};

interface ErrorSummaryProps {
  errors: Record<string, string>;
  title?: string;
  className?: string;
  maxErrors?: number;
}

/**
 * Component for displaying multiple errors at once
 * Useful for form validation summaries
 */
export const ErrorSummary: React.FC<ErrorSummaryProps> = ({
  errors,
  title = "Please fix the following issues:",
  className,
  maxErrors = 5,
}) => {
  const errorEntries = Object.entries(errors);
  
  if (errorEntries.length === 0) return null;

  const displayedErrors = errorEntries.slice(0, maxErrors);
  const remainingCount = errorEntries.length - maxErrors;

  return (
    <div className={cn("space-y-2", className)}>
      <ErrorMessage
        message={title}
        severity="error"
        variant="block"
        showIcon={true}
      />
      <div className="space-y-1 ml-6">
        {displayedErrors.map(([key, message]) => (
          <div key={key} className="text-sm text-red-600">
            • {message}
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="text-sm text-red-500 italic">
            ...and {remainingCount} more issue{remainingCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage; 