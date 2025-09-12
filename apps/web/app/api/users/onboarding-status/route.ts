import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import supabase from "@/lib/supabase-server"
import { getDbUserId } from "@/lib/user-cache"

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ onboarding_completed: false }, { status: 200 })

    const dbUserId = await getDbUserId(userId)
    const { data, error } = await supabase
      .from("users")
      .select("onboarding_completed")
      .eq("id", dbUserId)
      .single()

    if (error && error.code !== "PGRST116") {
      return NextResponse.json({ onboarding_completed: false }, { status: 200 })
    }

    return NextResponse.json({ onboarding_completed: data?.onboarding_completed === true }, { status: 200 })
  } catch {
    return NextResponse.json({ onboarding_completed: false }, { status: 200 })
  }
}


