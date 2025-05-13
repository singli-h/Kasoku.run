"use client"

import { ChevronRight, ChevronLeft, Info, Loader2, User, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import ExerciseSectionManager from "../components/ExerciseSectionManager"
import ExerciseTimeline from "../components/ExerciseTimeline"
import { useState, useCallback, useEffect, useRef } from "react"
import { useSupabaseClient } from '@/lib/useSupabaseClient'
import { createParser } from 'eventsource-parser'
import Ajv from 'ajv'
import { ExerciseDetailsSchemaV1 } from '@/app/api/ai/exercise-details/schema'

/**
 * Step Three: Session & Exercise Planning
 * 
 * This step allows users to:
 * - Configure session details
 * - Select progression models
 * - Manage exercise sections
 * - Add and configure exercises
 * 
 * @param {Object} props - Component props
 * @param {Object} props.formData - Form data
 * @param {Function} props.handleSessionInputChange - Function to handle session input changes
 * @param {Function} props.handleAddExercise - Function to add an exercise
 * @param {Function} props.handleRemoveExercise - Function to remove an exercise
 * @param {Function} props.handleExerciseDetailChange - Function to handle exercise detail changes
 * @param {Function} props.handleExerciseReorder - Function to handle exercise reordering
 * @param {Function} props.getOrderedExercises - Function to get ordered exercises for a section
 * @param {Object} props.sessionSections - Session sections data
 * @param {Function} props.handleSetActiveSections - Function to set active sections
 * @param {Array} props.filteredExercises - Filtered exercises
 * @param {boolean} props.loadingExercises - Indicates if exercises are loading
 * @param {number} props.activeSession - Active session ID
 * @param {Function} props.setActiveSession - Function to set active session
 * @param {Object} props.errors - Validation errors
 * @param {Function} props.handleNext - Function to go to the next step
 * @param {Function} props.handleBack - Function to go to the previous step
 * @param {string} props.userRole - User role
 */
const StepTwoPlanner = ({
  formData,
  handleSessionInputChange,
  handleAddExercise,
  handleRemoveExercise,
  handleExerciseDetailChange,
  handleExerciseReorder,
  getOrderedExercises,
  sessionSections,
  handleSetActiveSections,
  filteredExercises,
  loadingExercises,
  activeSession,
  setActiveSession,
  errors,
  handleNext,
  handleBack,
  userRole,
}) => {
  // State to track supersets for each session
  const [sessionSupersets, setSessionSupersets] = useState({});

  // Global AI-Fill state
  const [aiLoadingAll, setAiLoadingAll] = useState(false);
  const [cooldownAll, setCooldownAll] = useState(0);
  const [historyAll, setHistoryAll] = useState([]);

  // Supabase and streaming AI states
  const supabase = useSupabaseClient()
  const [feedbackText, setFeedbackText] = useState('')
  const switchedToJson = useRef(false)
  const jsonBuffer = useRef('')

  // Initialize global cooldown from localStorage
  useEffect(() => {
    const key = 'aiCooldown:all';
    const last = parseInt(localStorage.getItem(key) || '0', 10);
    const now = Date.now();
    const diff = Math.max(0, 60 - Math.floor((now - last) / 1000));
    setCooldownAll(diff);
  }, []);

  // Countdown timer for global cooldown
  useEffect(() => {
    if (!cooldownAll) return;
    const id = setInterval(() => {
      setCooldownAll(prev => prev <= 1 ? (clearInterval(id), 0) : prev - 1);
    }, 1000);
    return () => clearInterval(id);
  }, [cooldownAll]);

  // Auto-fill all sessions with AI
  const handleAutoFillAll = useCallback(async () => {
    if (aiLoadingAll || cooldownAll) return
    setAiLoadingAll(true)
    setFeedbackText('')
    switchedToJson.current = false
    jsonBuffer.current = ''
    // Backup and cooldown
    const backup = formData.exercises.map(ex => ({ ...ex }))
    setHistoryAll(prev => [...prev, backup])
    const key = 'aiCooldown:all'
    localStorage.setItem(key, Date.now().toString())
    setCooldownAll(60)
    // Prepare payload
    const sessionsPayload = formData.sessions.map(s => ({
      sessionId: s.id,
      sessionName: s.name,
      weekday: s.weekday,
      exercises: formData.exercises
        .filter(ex => ex.session === s.id)
        .map(ex => {
          const existing = {}
          ['sets','reps','weight','rest','effort','rpe','velocity','power','distance','height','duration','tempo']
            .forEach(f => { if (ex[f] !== undefined && ex[f] !== '') existing[f] = ex[f] })
          return { presetId: ex.id, name: ex.name, type: ex.category, existing }
        })
    }))
    try {
      const { data: stream, error } = await supabase.functions.invoke('openai', {
        body: JSON.stringify({ trainingGoals: formData.goals, sessions: sessionsPayload }),
        headers: { 'Content-Type': 'application/json' }
      })
      if (error || !stream) {
        console.error('[AI] Function invoke error:', error)
        return
      }
      const parser = createParser(event => {
        if (event.type !== 'event') return
        if (event.data === '[DONE]') return
        const chunk = JSON.parse(event.data)
        const delta = chunk.choices[0].delta
        if (delta.content) {
          if (!switchedToJson.current) {
            setFeedbackText(prev => prev + delta.content)
          } else {
            jsonBuffer.current += delta.content
          }
          if (delta.content.includes('"session_details"')) {
            switchedToJson.current = true
            jsonBuffer.current = jsonBuffer.current.trimStart()
          }
        }
        if (delta.function_call?.arguments) {
          jsonBuffer.current += delta.function_call.arguments
        }
      })
      const reader = stream.getReader()
      let done = false
      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone
        if (value) {
          const text = new TextDecoder().decode(value)
          parser.feed(text)
        }
      }
      // Assemble and validate
      const fullText = `{"feedback":"${feedbackText.replace(/"/g, '\"')}",${jsonBuffer.current}`
      const payload = JSON.parse(fullText)
      const ajv = new Ajv()
      const valid = ajv.validate(ExerciseDetailsSchemaV1, payload)
      if (!valid) {
        console.error('[AI] Schema validation failed:', ajv.errors)
        return
      }
      payload.session_details.forEach(sess => {
        sess.details.forEach(detail => {
          Object.entries(detail).forEach(([field, value]) => {
            if (['presetId','explanation'].includes(field)) return
            handleExerciseDetailChange(detail.presetId, sess.sessionId, detail.presetId, field, value)
          })
        })
      })
    } catch (err) {
      console.error('[AI] Streaming error:', err)
    } finally {
      setAiLoadingAll(false)
    }
  }, [aiLoadingAll, cooldownAll, formData, handleExerciseDetailChange, supabase])

  // Revert all sessions to previous backup
  const handleRevertAll = useCallback(() => {
    const last = historyAll[historyAll.length - 1];
    if (!last) return;
    last.forEach(ex => {
      Object.entries(ex).forEach(([field, value]) => {
        if (['sets','reps','weight','rest','effort','rpe','velocity','power','distance','height','duration','tempo'].includes(field)) {
          handleExerciseDetailChange(ex.id, ex.session, ex.part, field, value);
        }
      });
    });
    setHistoryAll(prev => prev.slice(0, -1));
  }, [historyAll, handleExerciseDetailChange]);

  // Handle superset changes for a specific session
  const handleSupersetChange = useCallback((sessionId, supersets) => {
    console.log(`StepTwoPlanner: Updating supersets for session ${sessionId}:`, 
      supersets.map(s => ({ 
        id: s.id, 
        displayNumber: s.displayNumber, 
        exerciseCount: s.exercises?.length || 0 
      }))
    );
    
    setSessionSupersets(prev => ({
      ...prev,
      [sessionId]: supersets
    }));
  }, []);

  // Show loader while exercises are loading
  if (loadingExercises) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="animate-spin w-8 h-8 text-gray-500" />
      </div>
    )
  }

  // Get section name from ID
  const getSectionName = (sectionId) => {
    const sectionTypes = [
      { id: "warmup", name: "Warm-up" },
      { id: "gym", name: "Gym" },
      { id: "circuit", name: "Circuits" },
      { id: "plyometric", name: "Plyometrics" },
      { id: "isometric", name: "Isometrics" },
      { id: "sprint", name: "Sprints" },
      { id: "drill", name: "Drills" },
    ]
    
    const section = sectionTypes.find(s => s.id === sectionId)
    return section ? section.name : sectionId
  }
  
  // Weekday options
  const weekdays = [
    { value: "monday", label: "Monday" },
    { value: "tuesday", label: "Tuesday" },
    { value: "wednesday", label: "Wednesday" },
    { value: "thursday", label: "Thursday" },
    { value: "friday", label: "Friday" },
    { value: "saturday", label: "Saturday" },
    { value: "sunday", label: "Sunday" },
  ]
  
  // Get a list of already selected weekdays (excluding the current session)
  const getSelectedWeekdays = (currentSessionId) => {
    return formData.sessions
      .filter(s => s.id !== currentSessionId && s.weekday)
      .map(s => s.weekday)
  }
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Session & Exercise Planning</h2>
      <p className="text-gray-600">
        Configure your training sessions and add exercises to each section.
      </p>

      {/* Session Tabs */}
      <Tabs
        value={activeSession.toString()}
        onValueChange={(value) => setActiveSession(parseInt(value))}
        className="w-full"
      >
        <div className="mb-4 overflow-x-auto overscroll-x-contain">
          <TabsList className="flex w-max space-x-2 p-1 pb-8 pt-8">
            {formData.sessions.map((session) => (
              <TabsTrigger
                key={session.id}
                value={session.id.toString()}
                className="
                  whitespace-nowrap
                  px-4 py-2
                  border border-gray-300
                  rounded-md
                  bg-white
                  hover:bg-gray-50
                  transition-colors
                "
              >
                {(session.name || `Session ${session.id}`).length > 30
                  ? (session.name || `Session ${session.id}`).slice(0, 30) + "..."
                  : (session.name || `Session ${session.id}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {formData.sessions.map((session) => (
          <TabsContent key={session.id} value={session.id.toString()} className="space-y-6">
            {/* Session Details */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`session-name-${session.id}`} className="text-base font-medium">
                        Session Name
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Give this session a descriptive name (e.g., &quot;Upper Body Strength&quot;)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      id={`session-name-${session.id}`}
                      value={session.name}
                      onChange={(e) => handleSessionInputChange(session.id, "name", e.target.value)}
                      placeholder="e.g., Lower Body Power"
                      className={`mt-1 p-3 ${errors[`session-${session.id}-name`] ? "border-red-500" : ""}`}
                    />
                    {errors[`session-${session.id}-name`] && (
                      <p className="mt-1 text-sm text-red-500">{errors[`session-${session.id}-name`]}</p>
                    )}
                  </div>

                  {/* Weekday Selector */}
                  <div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`session-weekday-${session.id}`} className="text-base font-medium">
                        Weekday
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Select the weekday for this session. Multiple sessions per weekday are allowed.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <select
                      id={`session-weekday-${session.id}`}
                      value={session.weekday}
                      onChange={(e) => handleSessionInputChange(session.id, "weekday", e.target.value)}
                      className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select a weekday</option>
                      {weekdays.map((day) => (
                        <option key={day.value} value={day.value}>
                            {day.label}
                          </option>
                      ))}
                    </select>
                    {errors[`session-${session.id}-weekday`] && (
                      <p className="mt-1 text-sm text-red-500">{errors[`session-${session.id}-weekday`]}</p>
                    )}
                  </div>

                  {/* Session Mode Selector */}
                  {userRole === 'coach' && (
                  <div className="mt-4">
                    <div className="flex items-center gap-2">
                      <Label className="text-base font-medium">Session Mode</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Individual: Athlete logs this session; Group: Coach records all athletes&rsquo; results.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="flex space-x-2 mt-2">
                      <Button
                        size="sm"
                        variant={session.sessionMode === 'individual' ? 'default' : 'outline'}
                        onClick={() => handleSessionInputChange(session.id, 'sessionMode', 'individual')}
                        className="flex items-center"
                      >
                        <User className="mr-1 h-4 w-4" />
                        Individual
                      </Button>
                      <Button
                        size="sm"
                        variant={session.sessionMode === 'group' ? 'default' : 'outline'}
                        onClick={() => {
                          handleSessionInputChange(session.id, 'sessionMode', 'group')
                          // force only sprint section
                          handleSetActiveSections(session.id, ['sprint'])
                        }}
                        className="flex items-center"
                      >
                        <Users className="mr-1 h-4 w-4" />
                        Group
                      </Button>
                    </div>
                  </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Compute sections shown based on mode */}
            <ExerciseSectionManager
              sessionId={session.id}
              exercises={formData.exercises}
              filteredExercises={filteredExercises}
              handleAddExercise={handleAddExercise}
              handleRemoveExercise={handleRemoveExercise}
              handleExerciseDetailChange={handleExerciseDetailChange}
              handleExerciseReorder={handleExerciseReorder}
              getOrderedExercises={getOrderedExercises}
              errors={errors}
              activeSections={sessionSections[session.id] || []}
              setActiveSections={(sections) =>
                handleSetActiveSections(session.id, sections)
              }
              mode={session.sessionMode}
              onSupersetChange={(supersets) => handleSupersetChange(session.id, supersets)}
            />
            
            {/* Exercise Timeline */}
            {feedbackText && (
              <div className="mb-4 p-4 border-l-4 border-blue-400 bg-blue-50">
                <p className="italic text-gray-700 whitespace-pre-wrap">{feedbackText}</p>
              </div>
            )}
            <ExerciseTimeline
              sessionId={session.id}
              mode={session.sessionMode}
              activeSections={sessionSections[session.id] || []}
              handleExerciseDetailChange={handleExerciseDetailChange}
              errors={errors}
              getSectionName={getSectionName}
              getOrderedExercises={getOrderedExercises}
              supersets={sessionSupersets[session.id] || []}
              aiLoadingAll={aiLoadingAll}
              cooldownAll={cooldownAll}
              handleAutoFillAll={handleAutoFillAll}
              handleRevertAll={handleRevertAll}
              historyAllCount={historyAll.length}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button onClick={handleBack} variant="outline" className="px-6">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleNext} className="px-6">
          Next
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default StepTwoPlanner 