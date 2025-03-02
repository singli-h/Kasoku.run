"use client"

import { useState, useEffect, createContext, useContext } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, XCircle, X, Info } from "lucide-react"

// Create context for notifications
const NotificationContext = createContext(null)

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider")
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])
  
  useEffect(() => {
    // Function to handle scroll events 
    const handleScroll = () => {
      // Force a re-render when scrolling to keep notifications in view
      if (notifications.length > 0) {
        setNotifications(prev => [...prev]);
      }
    };
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
    
    // Clean up
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [notifications.length]);

  const showNotification = (message, type = "success", duration = 5000) => {
    const id = Date.now()
    
    // Log to ensure the function is called
    console.error("Showing notification:", message, type);
    
    setNotifications(prev => [
      ...prev,
      { id, message, type, duration }
    ])
    
    // Auto dismiss
    if (duration) {
      setTimeout(() => {
        dismissNotification(id)
      }, duration)
    }
    
    return id
  }
  
  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }
  
  // Dismiss all notifications
  const dismissAllNotifications = () => {
    setNotifications([])
  }
  
  // Helper functions for common notifications
  const success = (message, duration) => showNotification(message, "success", duration)
  const error = (message, duration) => showNotification(message, "error", duration)
  const info = (message, duration) => showNotification(message, "info", duration)

  return (
    <NotificationContext.Provider value={{ showNotification, dismissNotification, success, error, info }}>
      {children}
      <NotificationContainer 
        notifications={notifications} 
        onDismiss={dismissNotification} 
        onDismissAll={dismissAllNotifications} 
      />
    </NotificationContext.Provider>
  )
}

const NotificationContainer = ({ notifications, onDismiss, onDismissAll }) => {
  // Return early if no notifications
  if (notifications.length === 0) return null;
  
  // Handle click outside the notification
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onDismissAll();
    }
  };
  
  // Get scroll position for fixed notifications that follow scroll
  const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
  
  return (
    <div 
      className="fixed inset-0 z-[9999]"
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        pointerEvents: 'auto' 
      }}
      onClick={handleBackdropClick}
    >
      <div className="bg-black bg-opacity-30 absolute inset-0" />
      
      {/* Position in the viewport center, adjusting for scroll */}
      <div 
        className="absolute max-w-md"
        style={{ 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
        }}
      >
        <AnimatePresence>
          {notifications.map(notification => (
            <NotificationItem 
              key={notification.id} 
              notification={notification} 
              onDismiss={() => onDismiss(notification.id)} 
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

const NotificationItem = ({ notification, onDismiss }) => {
  // Define styles based on notification type
  const styles = {
    success: {
      bg: "bg-green-100 border-green-500",
      icon: <CheckCircle className="w-8 h-8 text-green-500" />,
      text: "text-green-800"
    },
    error: {
      bg: "bg-red-100 border-red-500",
      icon: <XCircle className="w-8 h-8 text-red-500" />,
      text: "text-red-800"
    },
    info: {
      bg: "bg-blue-100 border-blue-500",
      icon: <Info className="w-8 h-8 text-blue-500" />,
      text: "text-blue-800"
    }
  }
  
  const { bg, icon, text } = styles[notification.type] || styles.info

  // Using useEffect for component mount tracking
  useEffect(() => {
    console.error("Notification rendered:", notification.message);
  }, [notification.message]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{ duration: 0.3 }}
      className={`rounded-xl shadow-2xl border-l-4 ${bg} py-6 px-8 flex items-center w-full sm:w-96 backdrop-blur-sm mb-4 relative mx-4 sm:mx-0`}
      style={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
      onClick={(e) => e.stopPropagation()} // Prevent clicks from bubbling to backdrop
    >
      <div className="flex-shrink-0 mr-5">
        {icon}
      </div>
      <div className={`flex-1 ${text} pr-6`}>
        <p className="text-lg font-medium">{notification.message}</p>
      </div>
      
      {/* More prominent close button */}
      <button 
        onClick={onDismiss}
        className="absolute top-2 right-2 p-2 rounded-full bg-gray-300 hover:bg-gray-400 text-gray-800 hover:text-black focus:outline-none transition-all duration-200 transform hover:scale-110"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  )
} 