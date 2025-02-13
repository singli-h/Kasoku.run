"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/common/Card"
import Button from "../../components/common/Button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import { addDays, format, startOfWeek, isSameDay } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"

const CalendarView = ({ mesocycle, onUpdate }: { mesocycle: any, onUpdate: (newMesocycle: any) => void }) => {
  const [currentWeek, setCurrentWeek] = useState<number>(0)
  const [viewStartDate, setViewStartDate] = useState<Date>(startOfWeek(new Date(mesocycle.sessions[0].date)))

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const newMesocycle = JSON.parse(JSON.stringify(mesocycle))
    const [movedSession] = newMesocycle.sessions.splice(result.source.index, 1)

    const [, dayIndex] = result.destination.droppableId.split("-").map(Number)
    const newDate = addDays(viewStartDate, dayIndex)
    movedSession.date = format(newDate, "yyyy-MM-dd")

    const destinationIndex = newMesocycle.sessions.findIndex((session: any) => new Date(session.date) > newDate)

    if (destinationIndex === -1) {
      newMesocycle.sessions.push(movedSession)
    } else {
      newMesocycle.sessions.splice(destinationIndex, 0, movedSession)
    }

    onUpdate(newMesocycle)
  }

  const moveWeekView = (days: number) => {
    setViewStartDate((prevDate) => addDays(prevDate, days))
  }

  const updateWeekNumber = () => {
    const middleOfView = addDays(viewStartDate, 3)
    const weekOfMiddle = Math.floor(
      (middleOfView.getTime() - startOfWeek(new Date(mesocycle.sessions[0].date)).getTime()) / (7 * 24 * 60 * 60 * 1000),
    )
    setCurrentWeek(weekOfMiddle)
  }

  useEffect(() => {
    updateWeekNumber()
  }, [viewStartDate, mesocycle.sessions[0].date])

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentWeek((prev) => Math.max(0, prev - 1))}
          disabled={currentWeek === 0}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          <ChevronLeft className="h-4 w-4 mr-2" /> Previous Week
        </Button>
        <h3 className="text-2xl font-semibold text-center text-blue-800">Week {currentWeek + 1}</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentWeek((prev) => Math.min(3, prev + 1))}
          disabled={currentWeek === 3}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          Next Week <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-7 gap-4">
          {Array.from({ length: 7 }, (_, i) => addDays(viewStartDate, i)).map((day, dayIndex) => (
            <Droppable key={format(day, "yyyy-MM-dd")} droppableId={`${currentWeek}-${dayIndex}`}>
              {(provided, snapshot) => (
                <Card
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`min-h-[250px] bg-white shadow-md rounded-lg ${snapshot.isDraggingOver ? "bg-gray-100" : ""}`}
                >
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg font-semibold text-gray-700">{format(day, "EEE")}</CardTitle>
                    <div className="text-xs text-gray-500">{format(day, "MMM d")}</div>
                  </CardHeader>
                  <CardContent className="p-4 overflow-y-auto max-h-[200px]">
                    <AnimatePresence>
                      {mesocycle.sessions
                        .filter((session) => isSameDay(new Date(session.date), day))
                        .map((session, index) => (
                          <Draggable key={session.id} draggableId={session.id.toString()} index={index}>
                            {(provided, snapshot) => (
                              <motion.div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className={`bg-white p-2 mb-2 rounded shadow ${snapshot.isDragging ? "shadow-lg" : ""} min-h-[40px]`}
                                style={{
                                  ...provided.draggableProps.style,
                                  transition: snapshot.isDragging ? "none" : "transform 0.2s ease-out",
                                }}
                              >
                                <div className="truncate text-sm text-gray-700">{session.name}</div>
                              </motion.div>
                            )}
                          </Draggable>
                        ))}
                    </AnimatePresence>
                    {provided.placeholder}
                  </CardContent>
                </Card>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white"
        onClick={() => moveWeekView(-2)}
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white"
        onClick={() => moveWeekView(2)}
      >
        <ChevronRight className="h-6 w-6" />
      </Button>
    </div>
  )
}

export default CalendarView

