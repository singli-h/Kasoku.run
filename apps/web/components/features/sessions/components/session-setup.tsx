/*
<ai_context>
SessionSetup - Configuration component for setting up sprint training sessions.
Allows selection of athlete groups, session presets, and initial round configuration.
Features mobile-responsive design and intuitive multi-selection interface.
</ai_context>
*/

"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Users, 
  Play, 
  Settings, 
  CheckCircle, 
  Circle,
  Zap,
  Clock,
  Target,
  AlertCircle,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import type {
  AthleteGroupWithAthletes,
  SprintSessionPreset,
  SprintDistance,
  SprintRound
} from "@/actions/sessions/sprint-session-actions"

interface SessionSetupProps {
  athleteGroups: AthleteGroupWithAthletes[]
  sessionPresets: SprintSessionPreset[]
  predefinedDistances: SprintDistance[]
  onStartSession: (
    sessionName: string,
    selectedGroupIds: number[],
    selectedPresetId: number | null,
    initialRounds: SprintRound[]
  ) => void
  isLoading?: boolean
}

// Common sprint configurations for quick setup
const QUICK_CONFIGURATIONS = [
  {
    id: 'speed-endurance',
    name: 'Speed Endurance',
    description: '4 rounds of 40m sprints',
    rounds: [
      { roundNumber: 1, distance: 40, label: '40m' },
      { roundNumber: 2, distance: 40, label: '40m' },
      { roundNumber: 3, distance: 40, label: '40m' },
      { roundNumber: 4, distance: 40, label: '40m' },
    ],
    icon: '⚡'
  },
  {
    id: 'mixed-distances',
    name: 'Mixed Distances',
    description: '30m, 50m, 100m progression',
    rounds: [
      { roundNumber: 1, distance: 30, label: '30m' },
      { roundNumber: 2, distance: 50, label: '50m' },
      { roundNumber: 3, distance: 100, label: '100m' },
    ],
    icon: '🎯'
  },
  {
    id: 'acceleration',
    name: 'Acceleration Focus',
    description: '6 rounds of 30m sprints',
    rounds: [
      { roundNumber: 1, distance: 30, label: '30m' },
      { roundNumber: 2, distance: 30, label: '30m' },
      { roundNumber: 3, distance: 30, label: '30m' },
      { roundNumber: 4, distance: 30, label: '30m' },
      { roundNumber: 5, distance: 30, label: '30m' },
      { roundNumber: 6, distance: 30, label: '30m' },
    ],
    icon: '🚀'
  },
  {
    id: 'max-speed',
    name: 'Max Speed',
    description: '3 rounds of 100m sprints',
    rounds: [
      { roundNumber: 1, distance: 100, label: '100m' },
      { roundNumber: 2, distance: 100, label: '100m' },
      { roundNumber: 3, distance: 100, label: '100m' },
    ],
    icon: '🔥'
  }
]

export default function SessionSetup({
  athleteGroups,
  sessionPresets,
  predefinedDistances,
  onStartSession,
  isLoading = false
}: SessionSetupProps) {
  const [sessionName, setSessionName] = useState("")
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([])
  const [selectedPresetId, setSelectedPresetId] = useState<number | null>(null)
  const [selectedConfiguration, setSelectedConfiguration] = useState<string>("")
  const [customRounds, setCustomRounds] = useState<SprintRound[]>([])
  const [useQuickConfig, setUseQuickConfig] = useState(true)
  const { toast } = useToast()

  // Auto-generate session name based on selections
  useEffect(() => {
    if (selectedGroupIds.length > 0 && !sessionName) {
      const groupNames = athleteGroups
        .filter(group => selectedGroupIds.includes(group.id))
        .map(group => group.group_name)
        .join(', ')
      
      const timestamp = new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
      
      setSessionName(`Sprint Session - ${groupNames} (${timestamp})`)
    }
  }, [selectedGroupIds, athleteGroups, sessionName])

  // Handle group selection
  const handleGroupToggle = (groupId: number) => {
    setSelectedGroupIds(prev => 
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    )
  }

  // Handle quick configuration selection
  const handleConfigurationSelect = (configId: string) => {
    const config = QUICK_CONFIGURATIONS.find(c => c.id === configId)
    if (config) {
      setSelectedConfiguration(configId)
      setCustomRounds(config.rounds)
    }
  }

  // Handle starting the session
  const handleStartSession = () => {
    // Validation
    if (!sessionName.trim()) {
      toast({
        title: "Session Name Required",
        description: "Please provide a name for your sprint session.",
        variant: "destructive",
      })
      return
    }

    if (selectedGroupIds.length === 0) {
      toast({
        title: "Select Athlete Groups",
        description: "Please select at least one athlete group for the session.",
        variant: "destructive",
      })
      return
    }

    let finalRounds: SprintRound[]
    
    if (useQuickConfig && selectedConfiguration) {
      const config = QUICK_CONFIGURATIONS.find(c => c.id === selectedConfiguration)
      finalRounds = config ? config.rounds : []
    } else {
      finalRounds = customRounds
    }

    if (finalRounds.length === 0) {
      toast({
        title: "Configure Sprint Rounds",
        description: "Please select a quick configuration or add custom sprint rounds.",
        variant: "destructive",
      })
      return
    }

    onStartSession(sessionName.trim(), selectedGroupIds, selectedPresetId, finalRounds)
  }

  // Calculate total athletes across selected groups
  const totalAthletes = athleteGroups
    .filter(group => selectedGroupIds.includes(group.id))
    .reduce((total, group) => total + group.athletes.length, 0)

  // Check if ready to start
  const isReadyToStart = sessionName.trim() && 
                        selectedGroupIds.length > 0 && 
                        ((useQuickConfig && selectedConfiguration) || (!useQuickConfig && customRounds.length > 0))

  return (
    <div className="space-y-6">
      
      {/* Session Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Sprint Session Setup
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure your sprint training session for multiple athlete groups
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          
          {/* Session Name */}
          <div className="space-y-2">
            <Label htmlFor="session-name">Session Name</Label>
            <Input
              id="session-name"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="Enter session name..."
              className="w-full"
            />
          </div>

          {/* Athlete Group Selection */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Select Athlete Groups</Label>
              <p className="text-sm text-muted-foreground">
                Choose which athlete groups will participate in this session
              </p>
            </div>
            
            {athleteGroups.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No athlete groups found. Please create athlete groups first before setting up a session.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {athleteGroups.map((group) => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedGroupIds.includes(group.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleGroupToggle(group.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {selectedGroupIds.includes(group.id) ? (
                            <CheckCircle className="h-5 w-5 text-blue-600" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400" />
                          )}
                          <h3 className="font-medium">{group.group_name}</h3>
                          <Badge variant="secondary">
                            {group.athletes.length} athletes
                          </Badge>
                        </div>
                        
                        {/* Athlete list preview */}
                        <div className="text-sm text-gray-600">
                          {group.athletes.slice(0, 3).map(athlete => athlete.name).join(', ')}
                          {group.athletes.length > 3 && ` +${group.athletes.length - 3} more`}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            
            {selectedGroupIds.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <Users className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  {selectedGroupIds.length} group{selectedGroupIds.length > 1 ? 's' : ''} selected ({totalAthletes} total athletes)
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* Sprint Configuration */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Sprint Configuration</Label>
              <p className="text-sm text-muted-foreground">
                Choose a quick configuration or set up custom sprint rounds
              </p>
            </div>

            {/* Quick Configuration Toggle */}
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="use-quick-config" 
                  checked={useQuickConfig}
                  onCheckedChange={(checked) => setUseQuickConfig(checked as boolean)}
                />
                <Label htmlFor="use-quick-config">Use Quick Configuration</Label>
              </div>
              
              {!useQuickConfig && (
                <Badge variant="outline">
                  Custom setup
                </Badge>
              )}
            </div>

            {/* Quick Configurations */}
            {useQuickConfig && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {QUICK_CONFIGURATIONS.map((config) => (
                  <motion.div
                    key={config.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedConfiguration === config.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleConfigurationSelect(config.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{config.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {selectedConfiguration === config.id ? (
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Circle className="h-4 w-4 text-gray-400" />
                          )}
                          <h3 className="font-medium">{config.name}</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {config.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {config.rounds.length} rounds
                          </Badge>
                          <div className="text-xs text-gray-500">
                            {config.rounds.map(r => `${r.distance}m`).join(', ')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Custom Configuration Preview */}
            {!useQuickConfig && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Custom Sprint Configuration</span>
                </div>
                
                {customRounds.length === 0 ? (
                  <p className="text-sm text-gray-600">
                    You can add custom sprint rounds after starting the session.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">
                      {customRounds.length} rounds configured:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {customRounds.map(round => (
                        <Badge key={round.roundNumber} variant="outline">
                          Round {round.roundNumber}: {round.distance}m
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Session Preset (Optional) */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Session Preset (Optional)</Label>
              <p className="text-sm text-muted-foreground">
                Link this session to an existing training plan preset
              </p>
            </div>
            
            <Select 
              value={selectedPresetId ? selectedPresetId.toString() : "none"} 
              onValueChange={(value) => setSelectedPresetId(value === "none" ? null : Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a session preset (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No preset</SelectItem>
                {sessionPresets.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id.toString()}>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      <span>{preset.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Session Summary */}
          {selectedGroupIds.length > 0 && (
            <div className="border rounded-lg p-4 bg-blue-50">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">Session Summary</span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-800">Groups:</span>
                  <span className="font-medium text-blue-900">
                    {selectedGroupIds.length} ({totalAthletes} athletes)
                  </span>
                </div>
                
                {useQuickConfig && selectedConfiguration && (
                  <div className="flex justify-between">
                    <span className="text-blue-800">Configuration:</span>
                    <span className="font-medium text-blue-900">
                      {QUICK_CONFIGURATIONS.find(c => c.id === selectedConfiguration)?.name}
                    </span>
                  </div>
                )}
                
                {!useQuickConfig && (
                  <div className="flex justify-between">
                    <span className="text-blue-800">Setup:</span>
                    <span className="font-medium text-blue-900">Custom configuration</span>
                  </div>
                )}
                
                {selectedPresetId && (
                  <div className="flex justify-between">
                    <span className="text-blue-800">Preset:</span>
                    <span className="font-medium text-blue-900">
                      {sessionPresets.find(p => p.id === selectedPresetId)?.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Start Session Button */}
          <Button
            onClick={handleStartSession}
            disabled={!isReadyToStart || isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Starting Session...
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5" />
                Start Sprint Session
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 