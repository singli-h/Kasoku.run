"use server"

import { auth } from "@clerk/nextjs/server"
import type { ActionState } from "@/types/server-action-types"
import type { DashboardData, Task, AIConversation, DashboardStats } from "@/components/features/dashboard/types/dashboard-types"

// Mock data for now - replace with actual database calls
const mockTasks: Task[] = [
  {
    id: "1",
    title: "Implement user authentication",
    status: "in-progress",
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    assignee: {
      id: "user1",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      initials: "JD"
    },
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
  },
  {
    id: "2",
    title: "Setup CI/CD pipeline",
    status: "completed",
    assignee: {
      id: "user2",
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@example.com",
      initials: "JS"
    },
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  },
  {
    id: "3",
    title: "Design landing page",
    status: "todo",
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    assignee: {
      id: "user3",
      firstName: "Alice",
      lastName: "Johnson",
      email: "alice@example.com",
      initials: "AJ"
    },
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  }
]

const mockAIActivities: AIConversation[] = [
  {
    id: "conv1",
    title: "Help with React hooks",
    lastMessage: "You can use useEffect with an empty dependency array to run code only once when the component mounts...",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    isUnread: true,
    messageCount: 5
  },
  {
    id: "conv2",
    title: "Database schema design",
    lastMessage: "For user authentication, you'll want to create a users table with email, password hash, and profile information...",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    isUnread: false,
    messageCount: 12
  },
  {
    id: "conv3",
    title: "API endpoint optimization",
    lastMessage: "Consider using database indexing on frequently queried fields to improve performance...",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    isUnread: false,
    messageCount: 8
  }
]

export async function getDashboardDataAction(): Promise<ActionState<DashboardData>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "Authentication required"
      }
    }

    // TODO: Replace with actual database queries
    // const recentTasks = await getRecentTasksFromDB(userId)
    // const aiActivity = await getAIActivityFromDB(userId)
    // const stats = await getDashboardStatsFromDB(userId)

    const stats: DashboardStats = {
      totalTasks: mockTasks.length,
      completedTasks: mockTasks.filter(t => t.status === 'completed').length,
      inProgressTasks: mockTasks.filter(t => t.status === 'in-progress').length,
      activeConversations: mockAIActivities.filter(c => c.isUnread).length
    }

    const dashboardData: DashboardData = {
      recentTasks: mockTasks.slice(0, 5), // Get 5 most recent
      aiActivity: mockAIActivities.slice(0, 5), // Get 5 most recent
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
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "Authentication required"
      }
    }

    // TODO: Replace with actual database query
    // const tasks = await getRecentTasksFromDB(userId, 5)

    return {
      isSuccess: true,
      message: "Recent tasks retrieved successfully",
      data: mockTasks.slice(0, 5)
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
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "Authentication required"
      }
    }

    // TODO: Replace with actual database query
    // const activities = await getAIActivitiesFromDB(userId, 5)

    return {
      isSuccess: true,
      message: "AI activity retrieved successfully",
      data: mockAIActivities.slice(0, 5)
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
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "Authentication required"
      }
    }

    // TODO: Replace with actual database queries
    const stats: DashboardStats = {
      totalTasks: mockTasks.length,
      completedTasks: mockTasks.filter(t => t.status === 'completed').length,
      inProgressTasks: mockTasks.filter(t => t.status === 'in-progress').length,
      activeConversations: mockAIActivities.filter(c => c.isUnread).length
    }

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