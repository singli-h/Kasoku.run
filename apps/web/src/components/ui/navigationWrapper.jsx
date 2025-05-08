"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import useOnboardingStatus from "@/hooks/useOnboardingStatus";
import { useAuth } from "@clerk/nextjs";

// Dynamically import components to avoid SSR issues
const Header = dynamic(() => import("./header"), { ssr: false });
const Sidebar = dynamic(() => import("./sidebar"), { ssr: false });

/**
 * Navigation Wrapper Component
 * 
 * A client component that conditionally renders either the Header or Sidebar
 * based on the current route.
 * 
 * @component
 */
const NavigationWrapper = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Define routes that should use the header
  const headerRoutes = ['/'];
  
  // Define routes that should have no navigation
  const noNavRoutes = ['/login', '/register', '/auth', '/onboarding'];
  
  // Check if current path should use header
  const shouldUseHeader = headerRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // Check if current path should have no navigation
  const shouldHaveNoNav = noNavRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if onboarding is completed
  // Only check for routes that need authentication and aren't already part of the onboarding flow
  const shouldCheckOnboarding = isSignedIn && 
    !shouldHaveNoNav && 
    !pathname.startsWith('/onboarding');

  useOnboardingStatus({
    redirect: shouldCheckOnboarding,
    redirectTo: '/onboarding',
    requireOnboarding: shouldCheckOnboarding
  });
  
  // Handle sidebar collapse state
  const handleSidebarCollapse = (collapsed) => {
    setIsSidebarCollapsed(collapsed);
  };
  
  // If route should have no navigation, render only children
  if (shouldHaveNoNav) {
    return <main>{children}</main>;
  }
  
  return (
    <>
      {shouldUseHeader ? (
        <>
          <Header />
          <main className="grow pt-16">{children}</main>
        </>
      ) : (
        <div className="flex h-screen overflow-hidden">
          <Sidebar onCollapse={handleSidebarCollapse} />
          <main 
            className={`flex-1 overflow-y-auto transition-all duration-200 ${
              isSidebarCollapsed 
                ? 'pl-0 sm:pl-20' 
                : 'pl-0 sm:pl-64'
            } pt-16 sm:pt-0`}
          >
            {/* Preserve any max-width containers that might be in the children */}
            {children}
          </main>
        </div>
      )}
    </>
  );
};

export default NavigationWrapper; 