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
import { useAuthenticatedSupabaseClient } from '@/lib/supabase'
import { useSession } from '@clerk/nextjs'
import { useToast } from '@/components/ui/toast'

/**
 * Step Two: Session & Exercise Planning (Updated documentation for new AI flow)
 * 
 * This step allows users to:
 * - Configure session details
 * - Select progression models
 * - Manage exercise sections
 * - Add and configure exercises
 * - Auto-fill exercise details using AI via a streaming Edge Function
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
 * @param {Object} props.athleteProfile - Athlete profile data
 * @param {boolean} props.profileLoading - Indicates if athlete profile is loading
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
  athleteProfile,
  profileLoading,
}) => {
  // State to track supersets for each session
  const [sessionSupersets, setSessionSupersets] = useState({});

  // Global AI-Fill state
  const [aiLoadingAll, setAiLoadingAll] = useState(false);
  const [cooldownAll, setCooldownAll] = useState(0);
  const [historyAll, setHistoryAll] = useState([]);

  // Get the authenticated Supabase client using the new hook
  const supabase = useAuthenticatedSupabaseClient(); 
  const { session: clerkSession } = useSession(); // Still useful for checking if session exists before calling
  const { toast } = useToast()
  const [feedbackText, setFeedbackText] = useState('')

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

  // Revert all sessions to previous backup
  const handleRevertAll = useCallback(() => {
    const last = historyAll[historyAll.length - 1];
    if (!last) return;
    last.forEach(ex => {
      Object.entries(ex).forEach(([field, value]) => {
        // Ensure all relevant fields are considered for reverting
        if (['id', 'session', 'part', 'sets','reps','weight','rest','effort','rpe','velocity','power','distance','height','duration','tempo', 'supersetId'].includes(field)) {
          // Check if the field is one of the detailed metrics or key identifiers
          if (field !== 'id' && field !== 'session' && field !== 'part' && field !== 'supersetId') {
             handleExerciseDetailChange(ex.id, ex.session, ex.part, field, value);
          } else if (field === 'supersetId') { // Specifically handle supersetId revert
             handleExerciseDetailChange(ex.id, ex.session, ex.part, 'supersetId', value);
          }
          // For other fields like 'id', 'session', 'part', they are identifiers and don't need to be reverted via handleExerciseDetailChange
        }
      });
    });
    setHistoryAll(prev => prev.slice(0, -1));
    toast.info("Changes have been reverted to the previous state.");
  }, [historyAll, handleExerciseDetailChange, toast]);

  // Auto-fill all sessions with AI (JSON response)
  const handleAutoFillAll = useCallback(async () => {
    if (aiLoadingAll || cooldownAll) return;
    if (!clerkSession) {
      toast.error("Please sign in to use AI features.");
      return;
    }
    if (userRole === 'athlete' && profileLoading) {
      toast.info("Athlete profile is loading, please wait a moment and try again.");
      setAiLoadingAll(false);
      return;
    }

    setAiLoadingAll(true);
    setFeedbackText('');

    // Backup current state
    const backup = formData.exercises.map(ex => ({ ...ex }));
    setHistoryAll(prev => [...prev, backup]);
    localStorage.setItem('aiCooldown:all', Date.now().toString());
    setCooldownAll(60);

    // Prepare payload
    const sessionsPayload = formData.sessions.map(s => ({
      sessionId: s.id,
      sessionName: s.name,
      weekday: s.weekday,
      exercises: formData.exercises
        .filter(ex => ex.session === s.id)
        .map(ex => {
          const existing = {};
            ['sets','reps','weight','rest','effort','rpe','velocity','power','distance','height','duration','tempo']
            .forEach(f => { if (ex[f] !== undefined && ex[f] !== '') existing[f] = ex[f]; });
          return { presetId: ex.id, name: ex.name, part: ex.part, existing };
        })
        .filter(Boolean)
    }));

    // Base user context
    const userContext = {
      trainingGoals: formData.goals,
      sessions: sessionsPayload,
    };

    // System prompt initialization
    let systemPrompt = `You are an expert strength-and-conditioning coach with deep knowledge of exercise programming.\nYou need to provide feedback based on the user's overall training goals and exercises choices. You will also need to provide all the exercise details,you should not leave any exercise's set and reps empty.**For gym exercises**, always use effort over weight.Optional fields (distance, height, duration, tempo, velocity, power) may be left empty if not applicable.`;

    // If user is an athlete and profile data is available, add it to context and enhance prompt
    if (userRole === 'athlete' && athleteProfile) {
      userContext.athleteProfile = {
        age: athleteProfile.age,
        sex: athleteProfile.sex,
        weight: athleteProfile.weight,
        height: athleteProfile.height,
        training_history: athleteProfile.training_history,
      };
      systemPrompt += `\n\nConsider the following athlete profile for tailoring the plan:\n\`\`\`json\n${JSON.stringify(userContext.athleteProfile, null, 2)}\n\`\`\`\nTailor exercise selection, sets, reps, intensity, and overall plan structure based on this profile. If specific metrics like age, weight, or height are missing, make reasonable assumptions or focus on training history and goals.`;
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify(userContext) },
    ];

    try {
      const { data: result, error } = await supabase.functions.invoke('openai', { body: { messages } });
      if (error) {
        toast.error(`AI service error: ${error.message}`);
        handleRevertAll();
      } else {
        // Apply AI response
        setFeedbackText(result.feedback);
        result.session_details.forEach(sess =>
          sess.details.forEach(detail => {
            const { presetId, part, supersetId, /* explanation, */ ...metrics } = detail;
            Object.entries(metrics).forEach(([field, value]) =>
              handleExerciseDetailChange(presetId, sess.sessionId, part, field, value)
            );
            if (supersetId) handleExerciseDetailChange(presetId, sess.sessionId, part, 'supersetId', supersetId);
          })
        );
        toast.success("AI suggestions applied!");
      }
    } catch (err) {
      toast.error(`Error: ${err.message}`);
      handleRevertAll();
    } finally {
      setAiLoadingAll(false);
    }
  }, [aiLoadingAll, cooldownAll, formData, handleExerciseDetailChange, clerkSession, toast, handleRevertAll, supabase, userRole, athleteProfile, profileLoading]);

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
    <div className="space-y-6 relative" aria-busy={aiLoadingAll}>
      {aiLoadingAll && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <Loader2 className="animate-spin w-10 h-10 text-blue-500 mb-4" />
          <span className="text-lg font-medium text-gray-700" aria-live="polite">
            AI is analyzing your plan…
          </span>
        </div>
      )}
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