"use client"

import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { MessageSquare, MoreHorizontal, User, Clock, Calendar, Edit, PenSquare, Send } from 'lucide-react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'

/**
 * AthleteProfile shows detailed view of a single athlete.
 * @param {{ athlete: Object }} props
 */
export default function AthleteProfile({ athlete }) {
  const [activeTab, setActiveTab] = useState('overview')
  // Placeholder data
  const trainingHistory = []
  const messages = []
  const notes = []

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            <Avatar className="h-24 w-24 border-4 border-background">
              <AvatarImage src={athlete.user.avatar_url || '/placeholder.svg'} alt={`${athlete.user.first_name} ${athlete.user.last_name}`} />
              <AvatarFallback className="text-2xl">{athlete.user.first_name.charAt(0)}</AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-2xl font-bold">{athlete.user.first_name} {athlete.user.last_name}</h2>
                  <p className="text-muted-foreground">{athlete.user.email}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="font-normal">{athlete.group.group_name}</Badge>
                  <Badge variant={athlete.status === 'active' ? 'default' : athlete.status === 'inactive' ? 'secondary' : 'outline'} className="font-normal">
                    {athlete.status.charAt(0).toUpperCase() + athlete.status.slice(1)}
                  </Badge>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-sm">{athlete.user.bio || ''}</p>
              </div>

              <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Member Since</p>
                    <p className="text-sm font-medium">{new Date(athlete.user.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Last Active</p>
                    <p className="text-sm font-medium">{new Date(athlete.user.last_active).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Next Session</p>
                    <p className="text-sm font-medium">{athlete.nextSession ? new Date(athlete.nextSession).toLocaleString() : 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <MessageSquare className="mr-2 h-4 w-4" /> Message
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" /><span className="sr-only">More options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Edit Profile</DropdownMenuItem>
                  <DropdownMenuItem>Change Group</DropdownMenuItem>
                  <DropdownMenuItem>Schedule Session</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">Deactivate Account</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 p-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Details</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Height: {athlete.height} m</p>
              <p>Weight: {athlete.weight} kg</p>
              <p>Experience: {athlete.experience}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Training Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{athlete.training_goals}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {Array.isArray(athlete.events) && athlete.events.map((e, i) => <Badge key={i}>{e}</Badge>)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training" className="p-4">
          <p>No training sessions scheduled.</p>
        </TabsContent>

        <TabsContent value="metrics" className="p-4">
          <p>No performance metrics yet.</p>
        </TabsContent>

        <TabsContent value="messages" className="p-4">
          <Button><MessageSquare className="mr-2" /> Send Message</Button>
        </TabsContent>

        <TabsContent value="notes" className="p-4">
          <p>No notes added.</p>
        </TabsContent>

        <TabsContent value="settings" className="p-4">
          <Button variant="destructive">Deactivate Athlete</Button>
        </TabsContent>
      </Tabs>
    </div>
  )
} 