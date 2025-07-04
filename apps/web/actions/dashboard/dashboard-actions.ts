"use server"

import supabase from "@/lib/supabase-server"
import { auth } from "@clerk/nextjs/server"
import type { ActionState } from "@/types/server-action-types"
import type { DashboardData, Task, AIConversation, DashboardStats } from "@/components/features/dashboard/types/dashboard-types"
import type { Tables } from "@/types/database"

async function getRecentTasksFromDB(userId: string): Promise<Task[]> {
  const { data: athleteData, error: athleteError } = await supabase
    .from("athletes")
    .select("id")
    .eq("user_id", parseInt(userId))
    .single()

  if (athleteError || !athleteData) {
    console.error("Error fetching athlete ID:", athleteError)
    return []
  }

  const athleteId = athleteData.id

  const { data, error } = await supabase
    .from("exercise_training_sessions")
    .select(
      `
      id,
      description,
      status,
      date_time,
      athletes (
        users (
          id,
          first_name,
          last_name,
          email,
          avatar_url
        )
      )
    `
    )
    .eq("athlete_id", athleteId)
    .order("date_time", { ascending: false })
    .limit(5)

  if (error) {
    console.error("Error fetching recent tasks:", error)
    return []
  }

  return data.map((session: any) => ({
    id: session.id.toString(),
    title: session.description || 'Untitled Session',
    status: session.status === 'completed' ? 'completed' : session.status === 'in_progress' ? 'in-progress' : 'todo',
    dueDate: new Date(session.date_time),
    assignee: session.athletes?.users ? {
      id: session.athletes.users.id.toString(),
      firstName: session.athletes.users.first_name || '',
      lastName: session.athletes.users.last_name || '',
      email: session.athletes.users.email,
      avatar: session.athletes.users.avatar_url || '',
      initials: `${session.athletes.users.first_name?.[0] || ''}${session.athletes.users.last_name?.[0] || ''}`
    } : undefined,
    createdAt: new Date(session.date_time),
    updatedAt: new Date(session.date_time),
  }))
  }

async function getAIActivityFromDB(userId: string): Promise<AIConversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(5)

  if (error) {
    console.error("Error fetching AI activity:", error)
    return []
  }

  return data.map((convo: any) => ({
    id: convo.id,
    title: convo.title,
    lastMessage: convo.last_message || '',
    timestamp: new Date(convo.updated_at),
    isUnread: false, // This needs a schema change to support
    messageCount: convo.message_count,
  }))
}

async function getDashboardStatsFromDB(userId: string): Promise<DashboardStats> {
  const { data: athleteData, error: athleteError } = await supabase
    .from("athletes")
    .select("id")
    .eq("user_id", parseInt(userId))
    .single()

  if (athleteError || !athleteData) {
    console.error("Error fetching athlete ID for stats:", athleteError)
    return {
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      activeConversations: 0
    }
  }

  const athleteId = athleteData.id

  const { count: totalTasks, error: totalTasksError } = await supabase
    .from("exercise_training_sessions")
    .select("id", { count: "exact", head: true })
    .eq("athlete_id", athleteId)

  const { count: completedTasks, error: completedTasksError } = await supabase
    .from("exercise_training_sessions")
    .select("id", { count: "exact", head: true })
    .eq("athlete_id", athleteId)
    .eq("status", "completed")

  const { count: inProgressTasks, error: inProgressTasksError } =
    await supabase
      .from("exercise_training_sessions")
      .select("id", { count: "exact", head: true })
      .eq("athlete_id", athleteId)
      .eq("status", "in-progress")

  const { count: activeConversations, error: activeConversationsError } =
    await supabase
      .from("conversations")
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
    // .eq('is_unread', true) // is_unread doesn't exist

  if (totalTasksError || completedTasksError || inProgressTasksError || activeConversationsError) {
    console.error({ totalTasksError, completedTasksError, inProgressTasksError, activeConversationsError })
  }

  return {
    totalTasks: totalTasks || 0,
    completedTasks: completedTasks || 0,
    inProgressTasks: inProgressTasks || 0,
    activeConversations: activeConversations || 0,
  }
}


export async function getDashboardDataAction(): Promise<ActionState<DashboardData>> {
  try {
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return {
        isSuccess: false,
        message: "Authentication required"
      }
    }

    const { data: user } = await supabase.from('users').select('id').eq('clerk_id', clerkUserId).single()

    if (!user) {
      return {
        isSuccess: false,
        message: "User not found"
      }
    }
    const userId = user.id.toString()


    const [recentTasks, aiActivity, stats] = await Promise.all([
      getRecentTasksFromDB(userId),
      getAIActivityFromDB(userId),
      getDashboardStatsFromDB(userId)
    ])

    const dashboardData: DashboardData = {
      recentTasks,
      aiActivity,
      stats
    }

    return {
      isSuccess: true,
      message: "Dashboard data retrieved successfully",
      data: dashboardData
    }
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return {
      isSuccess: false,
      message: "Failed to load dashboard data"
    }
  }
}

export async function getRecentTasksAction(): Promise<ActionState<Task[]>> {
  try {
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return {
        isSuccess: false,
        message: "Authentication required"
      }
    }
    const { data: user } = await supabase.from('users').select('id').eq('clerk_id', clerkUserId).single()

    if (!user) {
      return {
        isSuccess: false,
        message: "User not found"
      }
    }
    const userId = user.id.toString()

    const tasks = await getRecentTasksFromDB(userId)

    return {
      isSuccess: true,
      message: "Recent tasks retrieved successfully",
      data: tasks
    }
  } catch (error) {
    console.error("Error fetching recent tasks:", error)
    return {
      isSuccess: false,
      message: "Failed to load recent tasks"
    }
  }
}

export async function getAICopilotActivityAction(): Promise<ActionState<AIConversation[]>> {
  try {
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return {
        isSuccess: false,
        message: "Authentication required"
      }
    }

    const { data: user } = await supabase.from('users').select('id').eq('clerk_id', clerkUserId).single()

    if (!user) {
      return {
        isSuccess: false,
        message: "User not found"
      }
    }
    const userId = user.id.toString()

    const activities = await getAIActivityFromDB(userId)

    return {
      isSuccess: true,
      message: "AI activity retrieved successfully",
      data: activities
    }
  } catch (error) {
    console.error("Error fetching AI activity:", error)
    return {
      isSuccess: false,
      message: "Failed to load AI activity"
    }
  }
}

export async function getDashboardStatsAction(): Promise<ActionState<DashboardStats>> {
  try {
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return {
        isSuccess: false,
        message: "Authentication required"
      }
    }

    const { data: user } = await supabase.from('users').select('id').eq('clerk_id', clerkUserId).single()

    if (!user) {
      return {
        isSuccess: false,
        message: "User not found"
      }
    }
    const userId = user.id.toString()

    const stats = await getDashboardStatsFromDB(userId)

    return {
      isSuccess: true,
      message: "Dashboard stats retrieved successfully",
      data: stats
    }
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return {
      isSuccess: false,
      message: "Failed to load dashboard stats"
    }
  }
} 