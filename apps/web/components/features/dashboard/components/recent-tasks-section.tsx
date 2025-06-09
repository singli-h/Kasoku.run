"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ExternalLink, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { TASK_STATUS_CONFIG } from "../constants/dashboard-config"
import type { Task } from "../types/dashboard-types"

interface RecentTasksSectionProps {
  tasks: Task[]
}

export function RecentTasksSection({ tasks }: RecentTasksSectionProps) {
  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-foreground">Recent Tasks</CardTitle>
            <CardDescription className="text-muted-foreground">
              Your latest tasks and updates
            </CardDescription>
          </div>
          <Link 
            href="/tasks" 
            className="flex items-center text-sm text-primary hover:text-primary/80 transition-colors font-semibold border border-transparent hover:border-primary/20 px-2 py-1 rounded-md"
          >
            View All
            <ExternalLink className="ml-1 h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground mb-2">No tasks yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first task to get started!
            </p>
            <Link 
              href="/tasks/create" 
              className="inline-flex items-center mt-4 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors"
            >
              Create Task
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.slice(0, 5).map((task) => {
              const statusConfig = TASK_STATUS_CONFIG[task.status]
              
              return (
                <div 
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      task.status === 'completed' && "bg-green-500",
                      task.status === 'in-progress' && "bg-blue-500",
                      task.status === 'todo' && "bg-gray-400 dark:bg-gray-600"
                    )} />
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-foreground truncate">
                        {task.title}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge 
                          variant={statusConfig.variant}
                          className={cn(
                            "text-xs",
                            // Light theme with hover states to maintain same colors
                            task.status === 'todo' && "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-gray-200",
                            task.status === 'in-progress' && "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100 hover:text-blue-800 dark:hover:bg-blue-900/30 dark:hover:text-blue-300",
                            task.status === 'completed' && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-100 hover:text-green-800 dark:hover:bg-green-900/30 dark:hover:text-green-300"
                          )}
                        >
                          {statusConfig.label}
                        </Badge>
                        {task.dueDate && (
                          <span className="text-xs text-muted-foreground">
                            Due {formatDistanceToNow(task.dueDate, { addSuffix: true })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {task.assignee && (
                    <Avatar className="h-8 w-8 border-2 border-border">
                      <AvatarImage src={task.assignee.avatar} alt={task.assignee.initials} />
                      <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                        {task.assignee.initials}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 