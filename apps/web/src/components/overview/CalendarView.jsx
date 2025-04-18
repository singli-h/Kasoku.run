"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import Button from "../ui/button"
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"
import { 
  addDays, 
  format, 
  startOfWeek, 
  isSameDay, 
  getWeek, 
  isToday, 
  addWeeks, 
  subWeeks,
  parseISO
} from "date-fns"
import { useBrowserSupabaseClient } from '@/lib/supabase'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core"
import {
  sortableKeyboardCoordinates,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { restrictToWindowEdges } from "@dnd-kit/modifiers"
import { useMediaQuery } from "../../hooks/useMediaQuery"

const CalendarView = () => {
  const [mesocycleData, setMesocycleData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [viewDate, setViewDate] = useState(new Date())
  const [sessions, setSessions] = useState([])
  const [activeItem, setActiveItem] = useState(null)
  const [days, setDays] = useState([])
  const [numDisplayDays] = useState(14) // Always show 14 days
  
  // Media queries for responsive design
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
  const isMobile = useMediaQuery('(max-width: 767px)')
  
  // Setup DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  
  const supabase = useBrowserSupabaseClient()
  
  // Side effects - update sessions when mesocycle changes
  useEffect(() => {
    const fetchMesocycleData = async () => {
      try {
        setLoading(true)
        // Invoke Supabase Edge Function for mesocycle
        const { data: raw, error: fnErr } = await supabase.functions.invoke('api', {
          method: 'GET',
          query: { path: '/dashboard/mesocycle' }
        })
        if (fnErr) throw fnErr
        const json = JSON.parse(raw)
        setMesocycleData(json.data)
      } catch (err) {
        console.error('Error fetching mesocycle data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchMesocycleData()
  }, [])
  
  useEffect(() => {
    if (mesocycleData?.sessions?.length) {
      setSessions(mesocycleData.sessions)
    }
  }, [mesocycleData?.sessions])
  
  // Calculate days to display
  useEffect(() => {
    const startDay = startOfWeek(viewDate, { weekStartsOn: 1 }) // Week starts on Monday
    
    const daysArray = Array.from({ length: numDisplayDays }, (_, i) => {
      const day = addDays(startDay, i)
      return {
        date: day,
        weekNum: getWeek(day),
        sessions: sessions.filter(session => {
          const sessionDate = parseISO(session.date)
          return isSameDay(sessionDate, day)
        })
      }
    })
    
    setDays(daysArray)
  }, [viewDate, sessions, numDisplayDays])
  
  // Handle navigation
  const goToNextWeek = useCallback(() => {
    setViewDate(prevDate => addWeeks(prevDate, 1))
  }, [])
  
  const goToPrevWeek = useCallback(() => {
    setViewDate(prevDate => subWeeks(prevDate, 1))
  }, [])
  
  const goToToday = useCallback(() => {
    setViewDate(new Date())
  }, [])
  
  // Handle drag operations
  const handleDragStart = useCallback((event) => {
    const { active } = event
    const draggedSession = sessions.find(session => session.id === active.id)
    setActiveItem(draggedSession)
  }, [sessions])
  
  const handleDragEnd = useCallback((event) => {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      const updatedSessions = sessions.map(session => {
        if (session.id === active.id) {
          // Parse the day from the over.id (format: day-YYYY-MM-DD)
          const dateString = over.id.split("day-")[1]
          return {
            ...session,
            date: dateString
          }
        }
        return session
      })
      
      setSessions(updatedSessions)
    }
    
    setActiveItem(null)
  }, [sessions])
  
  // Session Item Component
  const SessionItem = ({ session }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: session.id,
      data: { session }
    })
    
    const style = {
      transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      transition,
      opacity: isDragging ? 0.5 : 1,
      zIndex: isDragging ? 999 : 1,
    }
    
    return (
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        className="bg-white border border-gray-200 p-3 mb-2 rounded-md cursor-move shadow-sm hover:shadow-md transition-all"
        style={style}
      >
        <h4 className="font-medium text-sm mb-1 text-gray-800">{
          session.exercises.length > 0 
            ? `${session.exercises[0].name} + ${session.exercises.length - 1} more`
            : "Untitled Session"
        }</h4>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{session.exercises.length} exercises</span>
          <span>{format(parseISO(session.date), "h:mm a")}</span>
        </div>
      </div>
    )
  }
  
  // Day Component
  const DayComponent = ({ day }) => {
    const isCurrentDay = isToday(day.date)
    
    return (
      <div 
        id={`day-${format(day.date, "yyyy-MM-dd")}`}
        className={`min-w-[150px] border ${isCurrentDay ? 'border-blue-400 bg-blue-50' : 'border-gray-200'} rounded-lg overflow-hidden min-h-[260px] h-full`}
      >
        <div className={`px-3 py-2 ${isCurrentDay ? 'bg-blue-100 text-blue-700' : 'bg-gray-50 text-gray-700'} border-b`}>
          <div className="text-center">
            <div className="text-xs text-gray-500">W{day.weekNum}</div>
            <div className="font-bold">{format(day.date, "EEE")}</div>
            <div className="text-sm">{format(day.date, "MMM d")}</div>
          </div>
        </div>
        
        <SortableContext 
          items={day.sessions.map(s => s.id)} 
          strategy={verticalListSortingStrategy}
        >
          <div className="px-2 py-3 h-full">
            {day.sessions.length > 0 ? (
              day.sessions.map(session => (
                <SessionItem key={session.id} session={session} />
              ))
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-400 text-sm">No sessions</p>
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    )
  }
  
  // DragOverlay component for improved UX
  const DraggedSessionOverlay = ({ session }) => {
    if (!session) return null
    
    return (
      <div className="bg-white border-2 border-blue-400 p-3 rounded-md shadow-lg w-[200px]">
        <h4 className="font-medium text-sm mb-1 text-gray-800">{
          session.exercises.length > 0 
            ? `${session.exercises[0].name} + ${session.exercises.length - 1} more`
            : "Untitled Session"
        }</h4>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{session.exercises.length} exercises</span>
          <span>{format(parseISO(session.date), "h:mm a")}</span>
        </div>
      </div>
    )
  }
  
  // Determine days per row based on screen size
  const getGridLayout = () => {
    if (isDesktop) return "grid-cols-7"
    if (isTablet) return "grid-cols-4"
    if (isMobile) return "grid-cols-2"
    return "grid-cols-7"
  }
  
  // Calculate current week information
  const firstWeekNum = getWeek(days[0]?.date || viewDate)
  const secondWeekNum = getWeek(days[7]?.date || addDays(viewDate, 7))
  const weekStart = format(startOfWeek(viewDate, { weekStartsOn: 1 }), "MMM d")
  const weekEnd = format(addDays(startOfWeek(viewDate, { weekStartsOn: 1 }), numDisplayDays - 1), "MMM d")
  
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!mesocycleData) return <div>No data available</div>
  
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 border-b gap-3">
        <CardTitle>Training Calendar</CardTitle>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goToToday}
            className="gap-1 w-full sm:w-auto"
          >
            <CalendarDays size={16} />
            Today
          </Button>
          <div className="flex w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={goToPrevWeek}
              className="rounded-r-none"
            >
              <ChevronLeft size={16} />
            </Button>
            <span className="flex items-center justify-center px-4 border-t border-b border-gray-300 bg-white text-sm font-medium text-gray-700 whitespace-nowrap">
              Weeks {firstWeekNum}-{secondWeekNum}: {weekStart} - {weekEnd}
            </span>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={goToNextWeek}
              className="rounded-l-none"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToWindowEdges]}
        >
          <div className={`grid ${getGridLayout()} gap-4`}>
            {days.map((day) => (
              <DayComponent key={format(day.date, "yyyy-MM-dd")} day={day} />
            ))}
          </div>
          <DragOverlay>
            {activeItem ? <DraggedSessionOverlay session={activeItem} /> : null}
          </DragOverlay>
        </DndContext>
      </CardContent>
    </Card>
  )
}

export default CalendarView
