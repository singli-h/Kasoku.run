/*
<ai_context>
SprintDistanceManager - Component for managing sprint rounds and distances.
Allows adding/removing sprints, setting custom distances, and provides
quick access to common sprint distances. Mobile-responsive with touch-optimized controls.
</ai_context>
*/

"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Target,
  Zap,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import type { SprintRound } from "@/actions/sessions/sprint-session-actions"

interface SprintDistanceManagerProps {
  rounds: SprintRound[]
  onAddRound: (round: SprintRound) => void
  onRemoveRound: (roundNumber: number) => void
  disabled?: boolean
}

// Predefined common sprint distances
const COMMON_DISTANCES = [
  { value: 30, label: "30m", icon: "🏃‍♂️" },
  { value: 40, label: "40m", icon: "🏃‍♀️" },
  { value: 50, label: "50m", icon: "⚡" },
  { value: 60, label: "60m", icon: "💨" },
  { value: 100, label: "100m", icon: "🔥" },
  { value: 150, label: "150m", icon: "🚀" },
  { value: 200, label: "200m", icon: "⭐" },
  { value: 400, label: "400m", icon: "🎯" },
]

interface RoundCardProps {
  round: SprintRound
  onRemove: (roundNumber: number) => void
  onUpdateDistance: (roundNumber: number, newDistance: number) => void
  disabled?: boolean
}

function RoundCard({ round, onRemove, onUpdateDistance, disabled = false }: RoundCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editDistance, setEditDistance] = useState(round.distance.toString())
  const { toast } = useToast()

  const handleSaveDistance = () => {
    const newDistance = parseInt(editDistance, 10)
    
    if (isNaN(newDistance) || newDistance <= 0 || newDistance > 1000) {
      toast({
        title: "Invalid Distance",
        description: "Distance must be between 1 and 1000 meters",
        variant: "destructive",
      })
      return
    }

    onUpdateDistance(round.roundNumber, newDistance)
    setIsEditing(false)
    
    toast({
      title: "Distance Updated",
      description: `Round ${round.roundNumber} distance set to ${newDistance}m`,
    })
  }

  const handleCancelEdit = () => {
    setEditDistance(round.distance.toString())
    setIsEditing(false)
  }

  const getDistanceCategory = (distance: number) => {
    if (distance <= 60) return { color: "bg-green-100 text-green-800", label: "Short" }
    if (distance <= 100) return { color: "bg-blue-100 text-blue-800", label: "Medium" }
    if (distance <= 200) return { color: "bg-orange-100 text-orange-800", label: "Long" }
    return { color: "bg-red-100 text-red-800", label: "Extended" }
  }

  const category = getDistanceCategory(round.distance)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative"
    >
      <Card className={`${disabled ? 'opacity-60' : ''} hover:shadow-md transition-shadow`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Round {round.roundNumber}</span>
              <Badge variant="outline" className={category.color}>
                {category.label}
              </Badge>
            </div>
            
            {!disabled && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="h-8 w-8 p-0"
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove Sprint Round</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to remove Round {round.roundNumber} ({round.distance}m)? 
                        This will delete all recorded times for this round.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onRemove(round.roundNumber)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Remove Round
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>

          {/* Distance display/edit */}
          <div className="space-y-2">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={editDistance}
                  onChange={(e) => setEditDistance(e.target.value)}
                  className="flex-1"
                  min="1"
                  max="1000"
                  placeholder="Distance in meters"
                />
                <span className="text-sm text-gray-500">m</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSaveDistance}
                    className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelEdit}
                    className="h-8 w-8 p-0 text-gray-600"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {round.distance}m
                </div>
                <div className="text-xs text-gray-500">
                  {round.label || 'Custom distance'}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function SprintDistanceManager({
  rounds,
  onAddRound,
  onRemoveRound,
  disabled = false
}: SprintDistanceManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedDistance, setSelectedDistance] = useState<string>("")
  const [customDistance, setCustomDistance] = useState("")
  const { toast } = useToast()

  const handleAddRound = () => {
    let distance: number
    let label: string

    if (selectedDistance === "custom") {
      distance = parseInt(customDistance, 10)
      label = `${distance}m Custom`
      
      if (isNaN(distance) || distance <= 0 || distance > 1000) {
        toast({
          title: "Invalid Distance",
          description: "Distance must be between 1 and 1000 meters",
          variant: "destructive",
        })
        return
      }
    } else {
      distance = parseInt(selectedDistance, 10)
      const commonDistance = COMMON_DISTANCES.find(d => d.value === distance)
      label = commonDistance ? commonDistance.label : `${distance}m`
    }

    // Check if this distance already exists
    if (rounds.some(round => round.distance === distance)) {
      toast({
        title: "Distance Already Exists",
        description: `A round with ${distance}m distance already exists`,
        variant: "destructive",
      })
      return
    }

    const newRoundNumber = rounds.length > 0 ? Math.max(...rounds.map(r => r.roundNumber)) + 1 : 1
    
    const newRound: SprintRound = {
      roundNumber: newRoundNumber,
      distance,
      label
    }

    onAddRound(newRound)
    
    // Reset form
    setSelectedDistance("")
    setCustomDistance("")
    setShowAddForm(false)
  }

  const handleUpdateDistance = (roundNumber: number, newDistance: number) => {
    // Find and update the round
    const round = rounds.find(r => r.roundNumber === roundNumber)
    if (round) {
      const updatedRound: SprintRound = {
        ...round,
        distance: newDistance,
        label: `${newDistance}m`
      }
      // Since we can't directly update, we need to remove and add
      onRemoveRound(roundNumber)
      onAddRound(updatedRound)
    }
  }

  const handleQuickAdd = (distance: number) => {
    if (rounds.some(round => round.distance === distance)) {
      toast({
        title: "Distance Already Exists",
        description: `A round with ${distance}m distance already exists`,
        variant: "destructive",
      })
      return
    }

    const commonDistance = COMMON_DISTANCES.find(d => d.value === distance)
    const newRoundNumber = rounds.length > 0 ? Math.max(...rounds.map(r => r.roundNumber)) + 1 : 1
    
    const newRound: SprintRound = {
      roundNumber: newRoundNumber,
      distance,
      label: commonDistance ? commonDistance.label : `${distance}m`
    }

    onAddRound(newRound)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            <CardTitle>Sprint Rounds</CardTitle>
            <Badge variant="outline">
              {rounds.length} rounds
            </Badge>
          </div>
          
          {!disabled && (
            <Button
              onClick={() => setShowAddForm(true)}
              disabled={showAddForm}
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Round
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        
        {/* Quick add buttons for common distances */}
        {!disabled && rounds.length === 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Quick Add Common Distances:</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {COMMON_DISTANCES.slice(0, 8).map((distance) => (
                <Button
                  key={distance.value}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAdd(distance.value)}
                  className="flex items-center gap-2"
                >
                  <span>{distance.icon}</span>
                  <span>{distance.label}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Add round form */}
        <AnimatePresence>
          {showAddForm && !disabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border rounded-lg p-4 bg-gray-50"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Plus className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Add New Sprint Round</span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label>Select Distance</Label>
                    <Select value={selectedDistance} onValueChange={setSelectedDistance}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a distance" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_DISTANCES.map((distance) => (
                          <SelectItem 
                            key={distance.value} 
                            value={distance.value.toString()}
                            disabled={rounds.some(round => round.distance === distance.value)}
                          >
                            <div className="flex items-center gap-2">
                              <span>{distance.icon}</span>
                              <span>{distance.label}</span>
                              {rounds.some(round => round.distance === distance.value) && (
                                <Badge variant="secondary" className="ml-2">Added</Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">
                          🔧 Custom Distance
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedDistance === "custom" && (
                    <div>
                      <Label>Custom Distance (meters)</Label>
                      <Input
                        type="number"
                        value={customDistance}
                        onChange={(e) => setCustomDistance(e.target.value)}
                        placeholder="Enter distance in meters"
                        min="1"
                        max="1000"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    onClick={handleAddRound}
                    disabled={!selectedDistance || (selectedDistance === "custom" && !customDistance)}
                    size="sm"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Add Round
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false)
                      setSelectedDistance("")
                      setCustomDistance("")
                    }}
                    size="sm"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current rounds */}
        {rounds.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-medium">Current Rounds:</span>
              <Badge variant="secondary">
                {rounds.length} rounds configured
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <AnimatePresence>
                {rounds
                  .sort((a, b) => a.roundNumber - b.roundNumber)
                  .map((round) => (
                    <RoundCard
                      key={round.roundNumber}
                      round={round}
                      onRemove={onRemoveRound}
                      onUpdateDistance={handleUpdateDistance}
                      disabled={disabled}
                    />
                  ))}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Sprint Rounds
            </h3>
            <p className="text-gray-500 mb-4">
              Add sprint rounds to begin tracking performance
            </p>
            {!disabled && (
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Round
              </Button>
            )}
          </div>
        )}

        {/* Info message */}
        {rounds.length > 0 && !disabled && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <span className="font-medium">Tip:</span> You can edit distances by clicking the edit icon on each round. 
              Removing a round will delete all recorded performance data for that round.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 