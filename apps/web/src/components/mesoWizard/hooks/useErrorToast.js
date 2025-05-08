"use client"

import { useState, useCallback } from "react"

/**
 * Hook for handling error messages and displaying them as toasts/notifications
 * 
 * @returns {Object} - Functions and state for error handling
 */
export const useErrorToast = () => {
  const [errorToast, setErrorToast] = useState({
    visible: false,
    message: '',
    type: 'error', // 'error', 'success', 'warning'
  })

  /**
   * Show an error toast notification
   * 
   * @param {string} message - The error message to display
   * @param {Object} options - Additional options for the toast
   */
  const showError = useCallback((message, options = {}) => {
    setErrorToast({
      visible: true,
      message: message || 'An unexpected error occurred',
      type: 'error',
      ...options,
    })

    // Auto-hide the toast after 5 seconds
    setTimeout(() => {
      setErrorToast(prev => ({
        ...prev,
        visible: false,
      }))
    }, options.duration || 5000)
  }, [])

  /**
   * Show a success toast notification
   * 
   * @param {string} message - The success message to display
   * @param {Object} options - Additional options for the toast
   */
  const showSuccess = useCallback((message, options = {}) => {
    setErrorToast({
      visible: true,
      message: message || 'Operation completed successfully',
      type: 'success',
      ...options,
    })

    // Auto-hide the toast after 5 seconds
    setTimeout(() => {
      setErrorToast(prev => ({
        ...prev,
        visible: false,
      }))
    }, options.duration || 5000)
  }, [])

  /**
   * Hide the current toast notification
   */
  const hideToast = useCallback(() => {
    setErrorToast(prev => ({
      ...prev,
      visible: false,
    }))
  }, [])

  /**
   * Format API errors into a user-friendly message
   * 
   * @param {Error|string} error - The error object or message
   * @returns {string} - User-friendly error message
   */
  const formatApiError = useCallback((error) => {
    if (!error) return 'An unexpected error occurred'
    
    if (typeof error === 'string') return error
    
    if (error.response && error.response.data && error.response.data.message) {
      return error.response.data.message
    }
    
    if (error.message) return error.message
    
    return 'An unexpected error occurred'
  }, [])

  /**
   * The toast component that can be rendered in the UI
   */
  const Toast = useCallback(() => {
    if (!errorToast.visible) return null
    
    const bgColor = 
      errorToast.type === 'success' ? 'bg-green-100 border-green-400 text-green-700' :
      errorToast.type === 'warning' ? 'bg-yellow-100 border-yellow-400 text-yellow-700' :
      'bg-red-100 border-red-400 text-red-700'
    
    return (
      <div className={`fixed top-4 right-4 px-4 py-3 rounded border ${bgColor} max-w-md z-50`} role="alert">
        <strong className="font-bold mr-2">
          {errorToast.type === 'success' ? 'Success!' : 
           errorToast.type === 'warning' ? 'Warning:' : 
           'Error:'}
        </strong>
        <span className="block sm:inline">{errorToast.message}</span>
        <span 
          className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer"
          onClick={hideToast}
        >
          <svg 
            className={`fill-current h-6 w-6 ${
              errorToast.type === 'success' ? 'text-green-500' : 
              errorToast.type === 'warning' ? 'text-yellow-500' : 
              'text-red-500'
            }`} 
            role="button" 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 20 20"
          >
            <title>Close</title>
            <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
          </svg>
        </span>
      </div>
    )
  }, [errorToast, hideToast])

  return {
    errorToast,
    showError,
    showSuccess,
    hideToast,
    formatApiError,
    Toast
  }
} 