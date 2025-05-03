"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  User, 
  Calendar, 
  BarChart3, 
  Users, 
  Settings,
  ChevronRight,
  LogOut
} from "lucide-react";
import Image from "next/image";
import { useClerk, useUser } from "@clerk/nextjs";

/**
 * Sidebar Component
 * 
 * A responsive sidebar navigation component that adapts to desktop and mobile views.
 * Features animated transitions, active link highlighting, and a mobile overlay.
 * 
 * @component
 */
const Sidebar = ({ onCollapse }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { user } = useUser();
  
  // Detect if we're on mobile or desktop
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    // Initial check
    checkIfMobile();
    
    // Set up event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isOpen && e.target.id === "overlay") {
        setIsOpen(false);
      }
    };
    
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isOpen]);
  
  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);
  
  // Notify parent component when collapsed state changes
  useEffect(() => {
    if (onCollapse) {
      onCollapse(isCollapsed);
    }
  }, [isCollapsed, onCollapse]);
  
  // Replace the existing navItems array and mapping with two sections: athleteNavItems and coachNavItems
  // Athlete section nav items (only Workout and Performance)
  const athleteNavItems = [
    { name: "Workout", icon: <LayoutDashboard />, path: "/workout" },
    { name: "Performance", icon: <BarChart3 />, path: "/performance" },
  ];

  // Coach section nav items (Athletes, Plans, Insights)
  const coachNavItems = [
    { name: "Athletes", icon: <Users />, path: "/athletes" },
    { name: "Plans", icon: <Calendar />, path: "/plans" },
    { name: "Sessions", icon: <Calendar />, path: "/sessions" },
    { name: "Insights", icon: <BarChart3 />, path: "/insights" },
  ];
  
  // Animation variants for the sidebar - faster animation
  const sidebarVariants = {
    open: {
      x: 0,
      width: isCollapsed ? "80px" : "256px",
      transition: {
        type: "spring",
        duration: 0.1
      }
    },
    closed: {
      x: "-100%",
      width: isCollapsed ? "80px" : "256px",
      transition: {
        type: "spring",
        duration: 0.1
      }
    }
  };
  
  // Animation variants for the nav items - faster animation
  const itemVariants = {
    open: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.15
      }
    },
    closed: {
      opacity: 0,
      y: 20,
      transition: {
        duration: 0.15
      }
    }
  };
  
  // Animation variants for the overlay - faster animation
  const overlayVariants = {
    open: {
      opacity: 1,
      transition: {
        duration: 0.2
      }
    },
    closed: {
      opacity: 0,
      transition: {
        duration: 0.2
      }
    }
  };
  
  // Animation variants for text - faster animation
  const textVariants = {
    show: {
      opacity: 1,
      x: 0,
      display: "block",
      transition: {
        duration: 0.15
      }
    },
    hide: {
      opacity: 0,
      x: -10,
      transitionEnd: {
        display: "none"
      },
      transition: {
        duration: 0.15
      }
    }
  };
  
  // Handle collapse toggle
  const handleCollapseToggle = () => {
    setIsCollapsed(!isCollapsed);
  };
  
  // Handle logout
  const handleLogout = () => {
    signOut();
  };
  
  // Determine if sidebar should be shown
  const sidebarVisible = isOpen || !isMobile;
  
  return (
    <>
      {/* Mobile hamburger menu button - only visible on mobile */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 rounded-md bg-blue-600 text-white shadow-lg sm:hidden focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
        aria-label="Open navigation menu"
      >
        <Menu className="w-6 h-6" />
      </button>
      
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && isMobile && (
          <motion.div
            id="overlay"
            initial="closed"
            animate="open"
            exit="closed"
            variants={overlayVariants}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
      
      {/* Sidebar container */}
      <motion.aside
        initial={false}
        animate={sidebarVisible ? "open" : "closed"}
        variants={sidebarVariants}
        className={`fixed top-0 left-0 z-50 h-full shadow-xl sm:translate-x-0 transition-all duration-200 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
        style={{
          background: `linear-gradient(to bottom, var(--sidebar-gradient-from), var(--sidebar-gradient-via), var(--sidebar-gradient-to))`
        }}
        aria-label="Main navigation"
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header with logo and close button */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <Link href="/" className="flex items-center space-x-2 overflow-hidden">
              <Image 
                src="/logo.svg" 
                alt="Logo" 
                className="h-8 w-auto flex-shrink-0" 
                width={32}
                height={32}
                priority
              />
              <motion.span 
                variants={textVariants}
                animate={isCollapsed ? "hide" : "show"}
                className="font-bold text-xl whitespace-nowrap"
              >
                TrainFast
              </motion.span>
            </Link>
            <div className="flex items-center">
              {/* Collapse toggle button (desktop only) */}
              <button
                onClick={handleCollapseToggle}
                className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 hidden sm:block focus:outline-none focus:ring-2 focus:ring-gray-400"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <motion.div
                  animate={{ rotate: isCollapsed ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="w-5 h-5" />
                </motion.div>
              </button>
              
              {/* Close button (mobile only) */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 ml-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 sm:hidden focus:outline-none focus:ring-2 focus:ring-gray-400"
                aria-label="Close navigation menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          {/* Navigation links */}
          <nav className="flex-grow py-6 px-3 overflow-y-auto">
            <ul className="space-y-2">
              {/* Athlete section header */}
              <li className="px-4 pt-4 text-xs text-gray-400 uppercase">Athlete</li>
              {/* Athlete section */}
              {athleteNavItems.map(item => (
                <motion.li key={item.name} variants={itemVariants}>
                  <Link href={item.path} className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      pathname === item.path
                        ? "bg-blue-600 text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                        }`} aria-current={pathname === item.path ? "page" : undefined}>
                    <motion.div whileHover={{ rotate: 5, scale: 1.1 }} transition={{ duration: 0.2 }} className="text-xl flex-shrink-0">
                      {item.icon}
                    </motion.div>
                    <motion.span variants={textVariants} animate={isCollapsed ? "hide" : "show"}>
                      {item.name}
                    </motion.span>
                  </Link>
                </motion.li>
              ))}

              {/* Coach section header */}
              <li className="px-4 pt-4 text-xs text-gray-400 uppercase">Coach</li>

              {/* Coach section links */}
              {coachNavItems.map(item => (
                <motion.li key={item.name} variants={itemVariants}>
                  <Link href={item.path} className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                          pathname === item.path
                            ? "bg-green-600 text-white"
                            : "text-gray-300 hover:bg-gray-700 hover:text-white"
                        }`} aria-current={pathname === item.path ? "page" : undefined}>
                    <motion.div whileHover={{ rotate: 5, scale: 1.1 }} transition={{ duration: 0.2 }} className="text-xl flex-shrink-0">
                      {item.icon}
                    </motion.div>
                    <motion.span variants={textVariants} animate={isCollapsed ? "hide" : "show"}>
                      {item.name}
                    </motion.span>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </nav>
          
          {/* User profile section at bottom */}
          <div className="p-4 border-t border-gray-700 mt-auto">
            {!isCollapsed && (
              <div className="mb-4 px-4">
                <p className="text-sm text-gray-400">Logged in as</p>
                <p className="font-medium text-white">{user?.fullName || 'User'}</p>
              </div>
            )}
            
            <Link
              href="/profile"
              className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-gray-300 hover:bg-gray-700 hover:text-white`}
            >
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5" />
              </div>
              <motion.span 
                variants={textVariants}
                animate={isCollapsed ? "hide" : "show"}
              >
                Profile
              </motion.span>
            </Link>
            {/* Settings link moved to bottom under Profile */}
            <Link
              href="/settings"
              className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} space-x-3 px-4 py-3 mt-2 rounded-lg transition-all duration-200 text-gray-300 hover:bg-gray-700 hover:text-white`}
            >
              <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center flex-shrink-0">
                <Settings className="w-5 h-5" />
              </div>
              <motion.span
                variants={textVariants}
                animate={isCollapsed ? "hide" : "show"}
              >
                Settings
              </motion.span>
            </Link>
            
            <button
              onClick={handleLogout}
              className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} w-full space-x-3 px-4 py-3 mt-2 rounded-lg transition-all duration-200 text-gray-300 hover:bg-red-600 hover:text-white`}
            >
              <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <motion.span 
                variants={textVariants}
                animate={isCollapsed ? "hide" : "show"}
              >
                Logout
              </motion.span>
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar; 