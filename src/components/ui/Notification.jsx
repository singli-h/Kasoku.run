"use client"

import { useState, createContext, useContext } from "react"
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
  
  // Simple function to add a notification
  const showNotification = (message, type = "success", duration = 5000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9)
    
    // Add new notification
    setNotifications(prev => [...prev, { id, message, type }])
    
    // Set up auto-dismiss
    if (duration) {
      setTimeout(() => {
        dismissNotification(id)
      }, duration)
    }
    
    return id
  }
  
  // Simple function to remove a notification
  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }
  
  // Helper functions for common notification types
  const success = (message, duration = 5000) => showNotification(message, "success", duration)
  const error = (message, duration = 5000) => showNotification(message, "error", duration)
  const info = (message, duration = 5000) => showNotification(message, "info", duration)

  return (
    <NotificationContext.Provider value={{ showNotification, dismissNotification, success, error, info }}>
      {children}
      
      {/* Portal - Always rendered but visible only when notifications exist */}
      <div className="notification-container" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 20000 }}>
        <div 
          className="notification-overlay"
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: notifications.length ? 'rgba(0,0,0,0.3)' : 'transparent',
            pointerEvents: notifications.length ? 'auto' : 'none',
            zIndex: 20001,
            transition: 'background-color 0.2s'
          }}
          onClick={() => setNotifications([])}
        />
        
        <div 
          className="notification-content" 
          style={{ 
            position: 'fixed', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            width: '100%',
            maxWidth: '450px', 
            padding: '0 16px',
            pointerEvents: 'none',
            zIndex: 20002
          }}
        >
          <AnimatePresence>
            {notifications.map(notification => (
              <div key={notification.id} style={{ pointerEvents: 'auto', marginBottom: '8px' }}>
                <NotificationItem 
                  notification={notification} 
                  onDismiss={() => dismissNotification(notification.id)} 
                />
              </div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </NotificationContext.Provider>
  )
}

const NotificationItem = ({ notification, onDismiss }) => {
  // Define styles based on notification type
  const styles = {
    success: {
      bg: "bg-green-100",
      border: "border-green-500",
      icon: <CheckCircle className="w-7 h-7 text-green-600" />,
      text: "text-green-800"
    },
    error: {
      bg: "bg-red-100",
      border: "border-red-500",
      icon: <XCircle className="w-7 h-7 text-red-600" />,
      text: "text-red-800"
    },
    info: {
      bg: "bg-blue-100",
      border: "border-blue-500",
      icon: <Info className="w-7 h-7 text-blue-600" />,
      text: "text-blue-800"
    }
  }
  
  const { bg, border, icon, text } = styles[notification.type] || styles.info

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`${bg} ${border} border-2 rounded-lg shadow-lg overflow-hidden`}
      onClick={(e) => e.stopPropagation()}
      style={{ boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)' }}
    >
      <div className="relative p-4 flex items-center">
        <div className="flex-shrink-0 mr-3">
          {icon}
        </div>
        
        <div className={`flex-1 ${text} font-semibold`}>
          <p className="text-lg">
            {notification.message}
          </p>
        </div>
        
        <button
          onClick={onDismiss}
          className="ml-3 flex-shrink-0 rounded-full p-1 bg-white shadow hover:bg-gray-100"
          aria-label="Close notification"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>
      </div>
    </motion.div>
  )
} 