/*
<ai_context>
Session completion view component for the Sprint Session Dashboard.
Displays session summary, statistics, and provides option to start a new session.
Built for the 2025 Kasoku Sprint Session Dashboard with mobile-responsive design.
</ai_context>
*/

"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Clock, Users, Activity, RotateCcw, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { type LiveSprintSession } from '@/actions/training/sprint-session-actions'

interface SessionCompletedViewProps {
  session: LiveSprintSession
  onStartNewSession: () => void
}

export default function SessionCompletedView({ 
  session, 
  onStartNewSession 
}: SessionCompletedViewProps) {
  // Calculate session statistics
  const totalRounds = session.rounds.length
  const totalAthletes = session.athleteGroups.length
  const sessionDuration = session.endTime && session.startTime 
    ? Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000 / 60)
    : 0

  // Format session start time
  const sessionStartTime = new Date(session.startTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })

  const sessionDate = new Date(session.startTime).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Success Alert */}
      <Alert className="border-green-200 bg-green-50 text-green-800">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription>
          <span className="font-medium">Session Completed Successfully!</span>
          <br />
          All sprint data has been saved and is available for review in the performance analytics.
        </AlertDescription>
      </Alert>

      {/* Session Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Session Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Session Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Session Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Session Name:</span>
                  <span className="font-medium">{session.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{sessionDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Start Time:</span>
                  <span className="font-medium">{sessionStartTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{sessionDuration} minutes</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Performance Overview</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Rounds:</span>
                  <Badge variant="secondary">{totalRounds}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Athlete Groups:</span>
                  <Badge variant="secondary">{totalAthletes}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Completed
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Sprint Rounds Summary */}
          {totalRounds > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Sprint Rounds Completed</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {session.rounds.map((round, index) => (
                  <div 
                    key={index}
                    className="bg-gray-50 rounded-lg p-3 text-center"
                  >
                    <div className="text-lg font-bold text-blue-600">
                      {round.distance}m
                    </div>
                    <div className="text-xs text-gray-600">
                      Round {round.roundNumber}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={onStartNewSession}
              className="flex-1 h-12"
              size="lg"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Start New Session
            </Button>
            
            <Button 
              variant="outline" 
              className="flex-1 h-12"
              size="lg"
              onClick={() => {
                // TODO: Implement session data export functionality
                console.log('Export session data:', session)
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <span className="font-medium">View Performance Analytics:</span>
                <p className="text-gray-600 mt-1">
                  Check the Performance page to analyze sprint times, trends, and athlete progress from this session.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <span className="font-medium">Plan Next Session:</span>
                <p className="text-gray-600 mt-1">
                  Use the insights from today's session to adjust training plans and prepare for the next sprint session.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <span className="font-medium">Share Results:</span>
                <p className="text-gray-600 mt-1">
                  Export session data to share performance results with athletes and other coaching staff.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
} 