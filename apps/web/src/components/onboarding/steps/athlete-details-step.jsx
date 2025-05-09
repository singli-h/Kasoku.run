"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Target } from "lucide-react"
import { motion } from "framer-motion"
import { useSession } from '@clerk/nextjs'

export default function AthleteDetailsStep({ userData, updateUserData, onNext, onPrev }) {
  const { session, isLoaded: isSessionLoaded, isSignedIn } = useSession()
  const [errors, setErrors] = useState({})
  const [events, setEvents] = useState({ track: [], field: [], combined: [] })
  const [loading, setLoading] = useState(true)
  const [currentSelection, setCurrentSelection] = useState("")
  const [selectedEvents, setSelectedEvents] = useState(userData.events || [])

  // Fetch events when component mounts
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true)
      if (!isSessionLoaded) return
      if (!isSignedIn) {
        console.error('Not signed in for fetching events')
        setLoading(false)
        return
      }
      try {
        const token = await session.getToken()
        const res = await fetch('/api/events', { headers: { Authorization: `Bearer ${token}` } })
        const body = await res.json()
        if (!res.ok || body.status !== 'success') throw new Error(body.message || 'Failed to fetch events')
        // API returns data as an array of events
        const eventsList = Array.isArray(body.data) ? body.data : (body.data.events || [])
        // Group events by type
        const grouped = { track: [], field: [], combined: [] }
        eventsList.forEach(evt => {
          const cat = evt.type?.toLowerCase() || 'track'
          if (!grouped[cat]) grouped[cat] = []
          grouped[cat].push(evt)
        })
        setEvents(grouped)
      } catch (err) {
        console.error('Error fetching events:', err)
        setEvents({ track: [], field: [], combined: [] })
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
    if (userData.events) {
      setSelectedEvents(userData.events)
    }
  }, [session, isSessionLoaded, isSignedIn, userData.events])

  const validateForm = () => {
    const newErrors = {}

    if (!userData.firstName?.trim()) newErrors.firstName = "First name is required"
    if (!userData.lastName?.trim()) newErrors.lastName = "Last name is required"
    if (!userData.birthdate) newErrors.birthdate = "Birthdate is required"
    if (!userData.height) newErrors.height = "Height is required"
    else if (isNaN(userData.height) || userData.height < 100 || userData.height > 250) {
      newErrors.height = "Height must be between 100-250 cm"
    }
    if (!userData.weight) newErrors.weight = "Weight is required"
    else if (isNaN(userData.weight) || userData.weight < 30 || userData.weight > 200) {
      newErrors.weight = "Weight must be between 30-200 kg"
    }
    if (!userData.trainingHistory?.trim()) newErrors.trainingHistory = "Training experience is required"
    if (!userData.trainingGoals?.trim()) newErrors.trainingGoals = "Training goals are required"
    if (selectedEvents.length === 0) newErrors.events = "Please select at least one event"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddEvent = (eventId) => {
    if (eventId && !selectedEvents.some(e => e.id === eventId)) {
      // Find the event object from all categories
      const allEvents = [...events.track, ...events.field, ...events.combined]
      const eventObj = allEvents.find(e => e.id === eventId)
      
      if (eventObj) {
        const newSelectedEvents = [...selectedEvents, eventObj]
        setSelectedEvents(newSelectedEvents)
        updateUserData({ events: newSelectedEvents })
      }
    }
    setCurrentSelection("")
  }

  const handleRemoveEvent = (eventId) => {
    const newSelectedEvents = selectedEvents.filter(event => event.id !== eventId)
    setSelectedEvents(newSelectedEvents)
    updateUserData({ events: newSelectedEvents })
  }

  const handleContinue = () => {
    if (validateForm()) {
      onNext()
    }
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-3"
      >
        <h2 className="text-3xl font-bold text-white">
          Tell us about yourself
        </h2>
        <p className="text-lg text-white/70">
          Help us personalize your training experience
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-white">First Name</Label>
            <Input
              id="firstName"
              value={userData.firstName}
              onChange={(e) => updateUserData({ firstName: e.target.value })}
              variant="onboarding"
              className={errors.firstName ? "border-red-500" : ""}
            />
            {errors.firstName && <p className="text-sm text-red-500">{errors.firstName}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-white">Last Name</Label>
            <Input
              id="lastName"
              value={userData.lastName}
              onChange={(e) => updateUserData({ lastName: e.target.value })}
              variant="onboarding"
              className={errors.lastName ? "border-red-500" : ""}
            />
            {errors.lastName && <p className="text-sm text-red-500">{errors.lastName}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="birthdate" className="text-white">Birthdate</Label>
            <Input
              id="birthdate"
              type="date"
              value={userData.birthdate}
              onChange={(e) => updateUserData({ birthdate: e.target.value })}
              variant="onboarding"
              className={errors.birthdate ? "border-red-500" : ""}
            />
            {errors.birthdate && <p className="text-sm text-red-500">{errors.birthdate}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="height" className="text-white">Height (cm)</Label>
            <Input
              id="height"
              type="number"
              placeholder="175"
              value={userData.height}
              onChange={(e) => updateUserData({ height: e.target.value })}
              variant="onboarding"
              className={errors.height ? "border-red-500" : ""}
            />
            {errors.height && <p className="text-sm text-red-500">{errors.height}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="weight" className="text-white">Weight (kg)</Label>
            <Input
              id="weight"
              type="number"
              placeholder="70"
              value={userData.weight}
              onChange={(e) => updateUserData({ weight: e.target.value })}
              variant="onboarding"
              className={errors.weight ? "border-red-500" : ""}
            />
            {errors.weight && <p className="text-sm text-red-500">{errors.weight}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="trainingHistory" className="text-white">Training Experience (years)</Label>
          <Select
            value={userData.trainingHistory}
            onValueChange={(value) => updateUserData({ trainingHistory: value })}
          >
            <SelectTrigger
              id="trainingHistory"
              className={`bg-white border-gray-200 text-gray-900 hover:border-gray-300 ${errors.trainingHistory ? "border-red-500" : ""}`}
            >
              <SelectValue placeholder="Select your experience level" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200">
              <SelectItem value="beginner" className="text-gray-900">1-3 years</SelectItem>
              <SelectItem value="intermediate" className="text-gray-900">4-7 years</SelectItem>
              <SelectItem value="advanced" className="text-gray-900">8-12 years</SelectItem>
              <SelectItem value="expert" className="text-gray-900">12+ years</SelectItem>
            </SelectContent>
          </Select>
          {errors.trainingHistory && <p className="text-sm text-red-500">{errors.trainingHistory}</p>}
        </div>

        {/* Event Selection */}
        <div className="space-y-6">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="event-select" className="text-white">Select Events</Label>
            <Select value={currentSelection} onValueChange={handleAddEvent} disabled={loading}>
              <SelectTrigger id="event-select" className={`bg-white border-gray-200 text-gray-900 hover:border-gray-300 ${errors.events ? "border-red-500" : ""}`}>
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                {loading ? (
                  <div className="py-2 text-center text-gray-500">Loading events...</div>
                ) : (
                  <>
                    {events.track.length > 0 && (
                      <SelectGroup>
                        <SelectLabel className="text-gray-700">Track Events</SelectLabel>
                        {events.track.map((event) => (
                          <SelectItem 
                            key={event.id} 
                            value={event.id} 
                            disabled={selectedEvents.some(e => e.id === event.id)}
                            className="text-gray-900"
                          >
                            {event.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                    {events.field.length > 0 && (
                      <SelectGroup>
                        <SelectLabel className="text-gray-700">Field Events</SelectLabel>
                        {events.field.map((event) => (
                          <SelectItem 
                            key={event.id} 
                            value={event.id} 
                            disabled={selectedEvents.some(e => e.id === event.id)}
                            className="text-gray-900"
                          >
                            {event.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                    {events.combined.length > 0 && (
                      <SelectGroup>
                        <SelectLabel className="text-gray-700">Combined Events</SelectLabel>
                        {events.combined.map((event) => (
                          <SelectItem 
                            key={event.id} 
                            value={event.id} 
                            disabled={selectedEvents.some(e => e.id === event.id)}
                            className="text-gray-900"
                          >
                            {event.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                  </>
                )}
              </SelectContent>
            </Select>
            {errors.events && <p className="text-sm text-red-500">{errors.events}</p>}
          </div>

          <div className="min-h-[100px] bg-white/10 border border-white/20 rounded-md p-4">
            <h2 className="text-sm font-medium text-white mb-2">Selected Events</h2>
            {selectedEvents.length === 0 ? (
              <p className="text-sm text-white/50">No events selected</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedEvents.map((event) => (
                  <Badge key={event.id} variant="secondary" className="flex items-center gap-1 py-1.5 bg-white/20 text-white">
                    {event.name}
                    <button
                      onClick={() => handleRemoveEvent(event.id)}
                      className="ml-1 rounded-full hover:bg-white/10 p-0.5"
                      aria-label={`Remove ${event.name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="trainingGoals" className="text-white">What are your training goals?</Label>
          <Textarea
            id="trainingGoals"
            placeholder="Tell us about your training goals and what you want to achieve..."
            value={userData.trainingGoals}
            onChange={(e) => updateUserData({ trainingGoals: e.target.value })}
            className={`bg-white border-gray-200 text-gray-900 placeholder:text-gray-500 min-h-[100px] focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 hover:border-gray-300 ${errors.trainingGoals ? "border-red-500" : ""}`}
          />
          {errors.trainingGoals && <p className="text-sm text-red-500">{errors.trainingGoals}</p>}
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="flex justify-between pt-4"
      >
        <Button
          variant="outline"
          onClick={onPrev}
          className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 px-8"
        >
          Back
        </Button>
        <Button
          onClick={handleContinue}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-600/20 px-8"
        >
          Continue
        </Button>
      </motion.div>
    </div>
  )
} 