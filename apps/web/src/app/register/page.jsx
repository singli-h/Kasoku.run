"use client"

import Image from "next/image"
import { SignUp } from "@clerk/nextjs"

const RegisterPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <Image 
          src="/logo.svg" 
          alt="RunningApp Logo" 
          width={80}
          height={80}
          priority
        />
      </div>
      
      <SignUp
        appearance={{
          layout: {
            logoPlacement: "none",
            socialButtonsVariant: "iconButton",
          }
        }}
      />
    </div>
  )
}

export default RegisterPage 