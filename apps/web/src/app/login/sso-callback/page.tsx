"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, useSignIn } from "@clerk/nextjs";
import Image from "next/image";

export default function SSOCallback() {
  const { isLoaded, isSignedIn } = useAuth();
  const { signIn, setActive } = useSignIn();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Don't do anything until Clerk is loaded
    if (!isLoaded) return;

    // If user is already signed in, redirect them to the session handler
    if (isSignedIn) {
      router.push('/auth/session');
      return;
    }

    async function processCallback() {
      try {
        // Get required parameters from the URL
        const createdSessionId = searchParams.get("createdSessionId");
        
        if (!createdSessionId || !signIn) {
          console.error("Missing createdSessionId or signIn not ready");
          // Redirect to login if there's an error
          router.push("/login");
          return;
        }

        // Complete the sign-in process by activating the created session
        await setActive({ session: createdSessionId });
        
        // Redirect to the session handler to check onboarding status
        router.push('/auth/session');
      } catch (error) {
        console.error("Error processing SSO callback:", error);
        router.push("/login");
      }
    }

    processCallback();
  }, [isLoaded, isSignedIn, router, signIn, setActive, searchParams]);

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
      <h1 className="text-xl text-center">Completing sign in...</h1>
    </div>
  );
} 