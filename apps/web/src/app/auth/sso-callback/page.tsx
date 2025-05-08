"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, useSignIn, useSignUp } from "@clerk/nextjs";
import Image from "next/image";

export default function SSOCallback() {
  const { isLoaded, isSignedIn } = useAuth();
  const { signIn, setActive: setActiveSignIn } = useSignIn();
  const { signUp, setActive: setActiveSignUp } = useSignUp();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isLoaded) return;

    // If user is already signed in, redirect them
    if (isSignedIn) {
      router.push('/auth/session');
      return;
    }

    async function processCallback() {
      try {
        const signInUrl = searchParams.get("redirect_url");
        if (!signInUrl) throw new Error("Missing redirect URL");

        // Get the verification from the URL
        const verification = searchParams.get("__clerk_status");

        // Handle sign-in verification
        if (verification === "verified" && signIn) {
          const createdSessionId = searchParams.get("createdSessionId");
          if (!createdSessionId) throw new Error("Missing createdSessionId");
          
          await setActiveSignIn({ session: createdSessionId });
          router.push(signInUrl);
          return;
        }

        // Handle sign-up verification
        if (verification === "verified" && signUp) {
          const createdSessionId = searchParams.get("createdSessionId");
          if (!createdSessionId) throw new Error("Missing createdSessionId");
          
          await setActiveSignUp({ session: createdSessionId });
          router.push(signInUrl);
          return;
        }

        console.error("Invalid verification status");
        router.push("/login");
      } catch (error) {
        console.error("Error processing SSO callback:", error);
        router.push("/login");
      }
    }

    processCallback();
  }, [isLoaded, isSignedIn, router, signIn, signUp, setActiveSignIn, setActiveSignUp, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="mb-8 animate-pulse">
        <Image 
          src="/logo.svg" 
          alt="Kasoku Logo" 
          width={80}
          height={80}
          priority
        />
      </div>
      <h1 className="text-xl text-center">Completing sign in...</h1>
    </div>
  );
} 