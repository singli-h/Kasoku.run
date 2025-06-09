/*
<ai_context>
Athlete summary card component for displaying athlete information and quick stats.
Based on the SummaryCards patterns from the original Kasoku web_old athletes system.
Provides overview metrics and quick actions for athlete management.
</ai_context>
*/

"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  User, 
  TrendingUp, 
  Calendar, 
  Trophy,
  MoreVertical,
  MessageSquare,
  Settings
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface AthleteStats {
  totalWorkouts?: number
  weeklyStreak?: number
  lastActive?: string
  completionRate?: number
  currentProgram?: string
  personalRecords?: number
}

interface Athlete {
  id: string
  firstName: string
  lastName: string
  email: string
  avatar?: string
  status: 'active' | 'inactive' | 'pending'
  joinDate?: string
  stats?: AthleteStats
  groupName?: string
  role?: string
}

interface AthleteSummaryCardProps {
  athlete: Athlete
  onViewProfile?: (athleteId: string) => void
  onStartChat?: (athleteId: string) => void
  onAssignProgram?: (athleteId: string) => void
  onViewProgress?: (athleteId: string) => void
  onManageSettings?: (athleteId: string) => void
  showQuickActions?: boolean
  compact?: boolean
  className?: string
}

export function AthleteSummaryCard({
  athlete,
  onViewProfile,
  onStartChat,
  onAssignProgram,
  onViewProgress,
  onManageSettings,
  showQuickActions = true,
  compact = false,
  className = ""
}: AthleteSummaryCardProps) {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'inactive': return 'bg-gray-500'
      case 'pending': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  if (compact) {
    return (
      <Card className={`hover:shadow-md transition-shadow ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={athlete.avatar} />
                  <AvatarFallback>{getInitials(athlete.firstName, athlete.lastName)}</AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(athlete.status)}`} />
              </div>
              
              <div>
                <p className="font-medium">{athlete.firstName} {athlete.lastName}</p>
                <p className="text-sm text-muted-foreground">{athlete.email}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {athlete.groupName && (
                <Badge variant="outline" className="text-xs">
                  {athlete.groupName}
                </Badge>
              )}
              
              {showQuickActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewProfile?.(athlete.id)}>
                      <User className="w-4 h-4 mr-2" />
                      View Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onViewProgress?.(athlete.id)}>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      View Progress
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStartChat?.(athlete.id)}>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Start Chat
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`hover:shadow-md transition-shadow ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage src={athlete.avatar} />
                <AvatarFallback>{getInitials(athlete.firstName, athlete.lastName)}</AvatarFallback>
              </Avatar>
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(athlete.status)}`} />
            </div>
            
            <div>
              <CardTitle className="text-lg">{athlete.firstName} {athlete.lastName}</CardTitle>
              <p className="text-sm text-muted-foreground">{athlete.email}</p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant={athlete.status === 'active' ? 'default' : 'secondary'}>
                  {athlete.status}
                </Badge>
                {athlete.groupName && (
                  <Badge variant="outline" className="text-xs">
                    {athlete.groupName}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {showQuickActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewProfile?.(athlete.id)}>
                  <User className="w-4 h-4 mr-2" />
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewProgress?.(athlete.id)}>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Progress
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStartChat?.(athlete.id)}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Start Chat
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAssignProgram?.(athlete.id)}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Assign Program
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onManageSettings?.(athlete.id)}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-primary">{athlete.stats?.totalWorkouts || 0}</p>
            <p className="text-xs text-muted-foreground">Total Workouts</p>
          </div>
          
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{athlete.stats?.weeklyStreak || 0}</p>
            <p className="text-xs text-muted-foreground">Week Streak</p>
          </div>
          
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">{athlete.stats?.completionRate || 0}%</p>
            <p className="text-xs text-muted-foreground">Completion Rate</p>
          </div>
          
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{athlete.stats?.personalRecords || 0}</p>
            <p className="text-xs text-muted-foreground">Personal Records</p>
          </div>
        </div>
        
        {/* Additional Info */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Active:</span>
            <span>{formatDate(athlete.stats?.lastActive)}</span>
          </div>
          
          {athlete.stats?.currentProgram && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Program:</span>
              <span className="truncate ml-2">{athlete.stats.currentProgram}</span>
            </div>
          )}
          
          {athlete.joinDate && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Member Since:</span>
              <span>{new Date(athlete.joinDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
        
        {/* Quick Actions */}
        {showQuickActions && (
          <div className="flex space-x-2 pt-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1"
              onClick={() => onViewProfile?.(athlete.id)}
            >
              <User className="w-4 h-4 mr-1" />
              Profile
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1"
              onClick={() => onViewProgress?.(athlete.id)}
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              Progress
            </Button>
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => onStartChat?.(athlete.id)}
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              Chat
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 