"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from '@clerk/nextjs';
import Image from "next/image";

/**
 * Session Handler Page
 * 
 * This page is responsible for checking onboarding status after login
 * and redirecting the user to the appropriate page.
 */
export default function SessionHandler() {
  const { isLoaded, isSignedIn, session } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Don't do anything until Clerk is loaded
    if (!isLoaded) return;

    // If user is not signed in, redirect to login
    if (!isSignedIn) {
      router.push("/login");
      return;
    }

    async function checkOnboardingStatus() {
      if (!session) {
        console.error('Clerk session not available yet');
        return;
      }
      try {
        const token = await session.getToken();
        const res = await fetch('/api/users/status', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const body = await res.json();
        const data = body.data;
        
        // Redirect based on onboarding status
        if (data.onboardingCompleted) {
          // If onboarding is completed, go to planner
          router.push('/planner');
        } else {
          // If onboarding is not completed, go to onboarding
          router.push('/onboarding');
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // Default to onboarding on error
        router.push('/onboarding');
      }
    }

    // Check onboarding status
    checkOnboardingStatus();
  }, [isLoaded, isSignedIn, router, session]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="mb-8 animate-pulse">
        <Image 
          src="/logo.svg" 
          alt="RunningApp Logo" 
          width={80}
          height={80}
          priority
        />
      </div>
      <h1 className="text-xl text-center">Redirecting you to the right place...</h1>
    </div>
  );
} 