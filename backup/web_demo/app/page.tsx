"use server"

import { redirect } from "next/navigation"
 
export default async function RootPage() {
  // Redirect users to login page instead of marketing content
  redirect("/login")
} 