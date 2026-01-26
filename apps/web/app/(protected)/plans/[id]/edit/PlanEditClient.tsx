/**
 * DEPRECATED: PlanEditClient.tsx
 *
 * This component has been replaced by the unified IndividualPlanPage at /plans/[id]
 * with integrated AI assistance. The edit route now redirects to the main plan page.
 *
 * Task: T068 from tasks.md
 * Date deprecated: 2025-01-25
 * Replaced by: apps/web/components/features/plans/individual/IndividualPlanPageWithAI.tsx
 * Redirect implemented in: apps/web/app/(protected)/plans/[id]/edit/page.tsx
 *
 * Preserved for reference only - DO NOT USE
 */

export default function PlanEditClient() {
  return null
}

// ============================================================================
// ORIGINAL CODE PRESERVED BELOW FOR REFERENCE
// ============================================================================
//
// 'use client'
//
// /**
//  * PlanEditClient - DEPRECATED
//  *
//  * This component has been deprecated in favor of the unified plan page.
//  * AI editing is now integrated directly into IndividualPlanPageWithAI.
//  *
//  * Implements T068 from tasks.md (Phase 13: Route Deprecation)
//  * PRESERVED for reference - do not delete.
//  *
//  * @see docs/features/plans/individual/tasks.md
//  * @deprecated Use IndividualPlanPageWithAI instead
//  */
//
// // T068: Component preserved but not exported from the deprecated edit page.
// // The code below is kept for reference and potential future use.
//
// import { useState, useMemo } from 'react'
// import { useRouter } from 'next/navigation'
// import { motion } from 'framer-motion'
// import {
//   ArrowLeft,
//   Bot,
//   Calendar,
//   Clock,
//   Dumbbell,
//   Loader2,
//   MessageSquare,
//   Send,
//   Sparkles,
// } from 'lucide-react'
// import { Button } from '@/components/ui/button'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { Input } from '@/components/ui/input'
// import { WeekStepper } from '@/components/features/first-experience/WeekStepper'
// import type { MesocycleWithDetails } from '@/types/training'
// import type { ProposedWeek, ProposedSession, ProposedExercise, ProposedSet } from '@/components/features/first-experience/types'
//
// // ============================================================================
// // Types
// // ============================================================================
//
// interface PlanEditClientProps {
//   trainingBlock: MesocycleWithDetails
// }
//
// // ============================================================================
// // Helpers
// // ============================================================================
//
// const DAY_LABELS: Record<number, string> = {
//   0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat'
// }
//
// function formatDateRange(start: string | null, end: string | null): string {
//   if (!start || !end) return ''
//   const startDate = new Date(start)
//   const endDate = new Date(end)
//   const startMonth = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
//   const endMonth = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
//   return `${startMonth} - ${endMonth}`
// }
//
// /**
//  * Convert MesocycleWithDetails to ProposedWeek[] for WeekStepper
//  */
// function convertToProposedWeeks(trainingBlock: MesocycleWithDetails): ProposedWeek[] {
//   if (!trainingBlock.microcycles) return []
//
//   return trainingBlock.microcycles.map((microcycle, index) => {
//     const sessions: ProposedSession[] = (microcycle.session_plans ?? []).map((session) => {
//       const exercises: ProposedExercise[] = (session.session_plan_exercises ?? []).map((exercise) => {
//         const sets: ProposedSet[] = (exercise.session_plan_sets ?? []).map((set) => ({
//           reps: set.reps ?? 10,
//           weight: null,
//           restSeconds: set.rest_time ?? 60,
//           rpe: set.rpe ?? null,
//         }))
//
//         return {
//           exerciseId: exercise.exercise_id ?? 0,
//           exerciseName: exercise.exercise?.name ?? 'Exercise',
//           sets,
//           notes: exercise.notes ?? undefined,
//         }
//       })
//
//       return {
//         id: session.id,
//         name: session.name ?? 'Workout',
//         dayOfWeek: session.day ?? 1,
//         exercises,
//         estimatedDuration: 60, // Default
//       }
//     })
//
//     return {
//       id: String(microcycle.id),
//       weekNumber: index + 1,
//       name: microcycle.name ?? `Week ${index + 1}`,
//       sessions,
//       isDeload: microcycle.name?.toLowerCase().includes('deload') ?? false,
//     }
//   })
// }
//
// // ============================================================================
// // Component
// // ============================================================================
//
// export function PlanEditClient({ trainingBlock }: PlanEditClientProps) {
//   const router = useRouter()
//   const [selectedWeekIndex, setSelectedWeekIndex] = useState(0)
//   const [chatInput, setChatInput] = useState('')
//   const [isProcessing, setIsProcessing] = useState(false)
//   const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
//     {
//       role: 'assistant',
//       content: `I can help you refine "${trainingBlock.name || 'your training block'}". What changes would you like to make? For example:\n\n• "Add more leg exercises to Week 2"\n• "Replace bench press with dumbbell variations"\n• "Make Week 4 a deload week"\n• "Add a rest day on Wednesday"`,
//     },
//   ])
//
//   // Convert training block to WeekStepper format
//   const weeks = useMemo(() => convertToProposedWeeks(trainingBlock), [trainingBlock])
//
//   // Calculate stats
//   const totalWorkouts = trainingBlock.microcycles?.reduce(
//     (sum, mc) => sum + (mc.session_plans?.length ?? 0),
//     0
//   ) ?? 0
//   const totalWeeks = trainingBlock.microcycles?.length ?? 0
//
//   const handleSendMessage = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!chatInput.trim() || isProcessing) return
//
//     const userMessage = chatInput.trim()
//     setChatInput('')
//     setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
//     setIsProcessing(true)
//
//     // TODO: Integrate with AI plan modification API
//     // For now, show a placeholder response
//     setTimeout(() => {
//       setMessages((prev) => [
//         ...prev,
//         {
//           role: 'assistant',
//           content:
//             "I understand you'd like to make changes. The AI-powered editing feature is coming soon! For now, you can use the Session Planner to manually edit individual workouts.",
//         },
//       ])
//       setIsProcessing(false)
//     }, 1500)
//   }
//
//   return (
//     <div className="min-h-screen bg-background">
//       {/* Header */}
//       <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/40">
//         <div className="container max-w-5xl mx-auto px-4 py-4">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-3">
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 onClick={() => router.push(`/plans/${trainingBlock.id}`)}
//               >
//                 <ArrowLeft className="h-5 w-5" />
//               </Button>
//               <div>
//                 <h1 className="text-lg font-semibold flex items-center gap-2">
//                   <Sparkles className="h-5 w-5 text-primary" />
//                   Edit with AI
//                 </h1>
//                 <p className="text-sm text-muted-foreground">
//                   {trainingBlock.name || 'Training Block'}
//                 </p>
//               </div>
//             </div>
//
//             <Button
//               variant="outline"
//               onClick={() => router.push(`/plans/${trainingBlock.id}`)}
//             >
//               Done
//             </Button>
//           </div>
//         </div>
//       </header>
//
//       {/* Content */}
//       <main className="container max-w-5xl mx-auto px-4 py-6">
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           {/* Left: Plan Preview */}
//           <div className="space-y-4">
//             {/* Block Summary */}
//             <Card>
//               <CardContent className="py-4">
//                 <div className="flex items-center gap-4 text-sm">
//                   <div className="flex items-center gap-1.5 text-muted-foreground">
//                     <Calendar className="h-4 w-4" />
//                     <span>{formatDateRange(trainingBlock.start_date, trainingBlock.end_date)}</span>
//                   </div>
//                   <div className="flex items-center gap-1.5 text-muted-foreground">
//                     <Clock className="h-4 w-4" />
//                     <span>{totalWeeks} weeks</span>
//                   </div>
//                   <div className="flex items-center gap-1.5 text-muted-foreground">
//                     <Dumbbell className="h-4 w-4" />
//                     <span>{totalWorkouts} workouts</span>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//
//             {/* Week Preview */}
//             {weeks.length > 0 && (
//               <WeekStepper
//                 weeks={weeks}
//                 selectedIndex={selectedWeekIndex}
//                 approvedWeeks={weeks.length}
//                 onSelectWeek={setSelectedWeekIndex}
//               />
//             )}
//           </div>
//
//           {/* Right: Chat Interface */}
//           <div className="lg:sticky lg:top-24 lg:self-start">
//             <Card className="flex flex-col h-[500px]">
//               <CardHeader className="py-3 px-4 border-b">
//                 <CardTitle className="text-base flex items-center gap-2">
//                   <MessageSquare className="h-4 w-4" />
//                   AI Assistant
//                 </CardTitle>
//               </CardHeader>
//
//               {/* Messages */}
//               <div className="flex-1 overflow-y-auto p-4 space-y-4">
//                 {messages.map((message, index) => (
//                   <motion.div
//                     key={index}
//                     initial={{ opacity: 0, y: 10 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
//                   >
//                     {message.role === 'assistant' && (
//                       <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
//                         <Bot className="h-4 w-4 text-primary" />
//                       </div>
//                     )}
//                     <div
//                       className={`rounded-lg px-4 py-2 max-w-[85%] ${
//                         message.role === 'user'
//                           ? 'bg-primary text-primary-foreground'
//                           : 'bg-muted'
//                       }`}
//                     >
//                       <p className="text-sm whitespace-pre-wrap">{message.content}</p>
//                     </div>
//                   </motion.div>
//                 ))}
//
//                 {isProcessing && (
//                   <motion.div
//                     initial={{ opacity: 0 }}
//                     animate={{ opacity: 1 }}
//                     className="flex gap-3"
//                   >
//                     <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
//                       <Loader2 className="h-4 w-4 text-primary animate-spin" />
//                     </div>
//                     <div className="bg-muted rounded-lg px-4 py-2">
//                       <p className="text-sm text-muted-foreground">Thinking...</p>
//                     </div>
//                   </motion.div>
//                 )}
//               </div>
//
//               {/* Input */}
//               <div className="p-4 border-t">
//                 <form onSubmit={handleSendMessage} className="flex gap-2">
//                   <Input
//                     value={chatInput}
//                     onChange={(e) => setChatInput(e.target.value)}
//                     placeholder="Ask to modify your plan..."
//                     disabled={isProcessing}
//                     className="flex-1"
//                   />
//                   <Button type="submit" size="icon" disabled={!chatInput.trim() || isProcessing}>
//                     <Send className="h-4 w-4" />
//                   </Button>
//                 </form>
//               </div>
//             </Card>
//           </div>
//         </div>
//       </main>
//     </div>
//   )
// }
//
// ============================================================================
