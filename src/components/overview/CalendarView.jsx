"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import { addDays, format, startOfWeek, isSameDay } from "date-fns"

// Component for each day on the calendar.
const CalendarDay = ({ day, sessions }) => {
  return (
    <Droppable droppableId={format(day, "yyyy-MM-dd")}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`min-h-[250px] ${snapshot.isDraggingOver ? "bg-gray-100" : ""}`}
        >
          <CardHeader className="p-2">
            <CardTitle className="text-sm font-medium">{format(day, "EEE")}</CardTitle>
            <div className="text-xs text-gray-500">{format(day, "MMM d")}</div>
          </CardHeader>
          <CardContent className="p-2 overflow-y-auto max-h-[200px]">
            {sessions.map((session, index) => (
              <Draggable key={session.id.toString()} draggableId={session.id.toString()} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`bg-white p-2 mb-2 rounded shadow ${snapshot.isDragging ? "shadow-lg" : ""} min-h-[40px]`}
                    style={{
                      ...provided.draggableProps.style,
                      transition: snapshot.isDragging ? "none" : "transform 0.2s ease-out",
                    }}
                  >
                    <div className="truncate text-sm">{session.name}</div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </CardContent>
        </Card>
      )}
    </Droppable>
  )
}

const CalendarView = ({ mesocycle, onUpdate }) => {
  // Constant to control how many days are shown.
  // Change to 4 if you want a partial week view.
  const daysToDisplay = 7

  // Initialize viewStartDate from mesocycle sessions.
  const [viewStartDate, setViewStartDate] = useState(
    mesocycle?.sessions?.length ? startOfWeek(new Date(mesocycle.sessions[0].date)) : new Date(),
  )

  // Use local state for sessions to ensure immediate UI updates.
  const [sessions, setSessions] = useState(mesocycle.sessions || [])

  // Keep local sessions in sync if mesocycle prop changes.
  useEffect(() => {
    if (mesocycle?.sessions) {
      setSessions(mesocycle.sessions)
    }
  }, [mesocycle.sessions])

  const handleDragEnd = useCallback(
    (result) => {
      if (!result.destination) return

      // Create a copy of the sessions array.
      const newSessions = Array.from(sessions)
      const sourceIndex = newSessions.findIndex((session) => session.id.toString() === result.draggableId)
      const [movedSession] = newSessions.splice(sourceIndex, 1)

      // Update the session's date using the droppableId.
      const newDate = result.destination.droppableId
      movedSession.date = newDate

      // Reinsert the session.
      newSessions.push(movedSession)
      // Optional: sort sessions if needed (e.g., by date).
      newSessions.sort((a, b) => new Date(a.date) - new Date(b.date))

      // Update local state and notify parent.
      setSessions(newSessions)
      onUpdate({ ...mesocycle, sessions: newSessions })
    },
    [sessions, mesocycle, onUpdate],
  )

  if (!viewStartDate) {
    return <div>Loading mesocycle data...</div>
  }

  // Generate the days to display based on viewStartDate and daysToDisplay.
  const weekDays = Array.from({ length: daysToDisplay }, (_, i) => addDays(viewStartDate, i))

  return (
    <div className="space-y-4 relative">
      {/* Top Navigation Buttons (week-level navigation) */}
      <div className="flex justify-between items-center">
        <Button variant="outline" size="sm" onClick={() => setViewStartDate(addDays(viewStartDate, -7))}>
          <ChevronLeft className="h-4 w-4 mr-2" /> Previous Week
        </Button>
        {/* Week header based on the start of the week */}
        <h3 className="text-lg font-semibold">Week {format(startOfWeek(viewStartDate), "w")}</h3>
        <Button variant="outline" size="sm" onClick={() => setViewStartDate(addDays(viewStartDate, 7))}>
          Next Week <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        {/* Relative container to position overlay arrows */}
        <div className="relative">
          {/* Left overlay arrow: moves view one day backward */}
          <div className="absolute top-1/2 left-0 transform -translate-y-1/2 z-10">
            <Button variant="ghost" size="icon" onClick={() => setViewStartDate(addDays(viewStartDate, -1))}>
              <ChevronLeft className="h-6 w-6" />
            </Button>
          </div>
          {/* Right overlay arrow: moves view one day forward */}
          <div className="absolute top-1/2 right-0 transform -translate-y-1/2 z-10">
            <Button variant="ghost" size="icon" onClick={() => setViewStartDate(addDays(viewStartDate, 1))}>
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
          {/* Grid container for the days */}
          <div className={`grid ${daysToDisplay === 4 ? "grid-cols-4" : "grid-cols-7"} gap-4`}>
            {weekDays.map((day) => {
              const sessionsForDay = sessions.filter((session) => isSameDay(new Date(session.date), day))
              return <CalendarDay key={format(day, "yyyy-MM-dd")} day={day} sessions={sessionsForDay} />
            })}
          </div>
        </div>
      </DragDropContext>
    </div>
  )
}

export default CalendarView

