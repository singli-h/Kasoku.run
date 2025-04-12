"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from "framer-motion"

export default function CoachDetailsStep({ userData, updateUserData, onNext, onPrev }) {
  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}

    if (!userData.firstName?.trim()) newErrors.firstName = "First name is required"
    if (!userData.lastName?.trim()) newErrors.lastName = "Last name is required"
    if (!userData.birthdate) newErrors.birthdate = "Birthdate is required"
    if (!userData.specialization?.trim()) newErrors.specialization = "Specialization is required"
    if (!userData.experience?.trim()) newErrors.experience = "Experience level is required"
    if (!userData.coachingPhilosophy?.trim()) newErrors.coachingPhilosophy = "Coaching philosophy is required"
    if (!userData.sportFocus?.trim()) newErrors.sportFocus = "Sport focus is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
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
          Tell us about your coaching
        </h2>
        <p className="text-lg text-white/70">
          Help us understand your coaching style and expertise
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="specialization" className="text-white">Specialization</Label>
            <Select
              value={userData.specialization}
              onValueChange={(value) => updateUserData({ specialization: value })}
            >
              <SelectTrigger
                id="specialization"
                className={`bg-white border-gray-200 text-gray-900 hover:border-gray-300 ${errors.specialization ? "border-red-500" : ""}`}
              >
                <SelectValue placeholder="Select your specialization" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                <SelectItem value="sprint" className="text-gray-900">Sprint Training</SelectItem>
                <SelectItem value="strength" className="text-gray-900">Strength & Conditioning</SelectItem>
                <SelectItem value="technique" className="text-gray-900">Technique Development</SelectItem>
                <SelectItem value="recovery" className="text-gray-900">Recovery & Rehabilitation</SelectItem>
                <SelectItem value="performance" className="text-gray-900">Performance Analysis</SelectItem>
              </SelectContent>
            </Select>
            {errors.specialization && <p className="text-sm text-red-500">{errors.specialization}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience" className="text-white">Experience Level</Label>
            <Select
              value={userData.experience}
              onValueChange={(value) => updateUserData({ experience: value })}
            >
              <SelectTrigger
                id="experience"
                className={`bg-white border-gray-200 text-gray-900 hover:border-gray-300 ${errors.experience ? "border-red-500" : ""}`}
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
            {errors.experience && <p className="text-sm text-red-500">{errors.experience}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sportFocus" className="text-white">Sport Focus</Label>
          <Select
            value={userData.sportFocus}
            onValueChange={(value) => updateUserData({ sportFocus: value })}
          >
            <SelectTrigger
              id="sportFocus"
              className={`bg-white border-gray-200 text-gray-900 hover:border-gray-300 ${errors.sportFocus ? "border-red-500" : ""}`}
            >
              <SelectValue placeholder="Select your sport focus" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200">
              <SelectItem value="track" className="text-gray-900">Track & Field</SelectItem>
              <SelectItem value="combined" className="text-gray-900">Team Sports</SelectItem>
              <SelectItem value="cross_country" className="text-gray-900">Power Lifting</SelectItem>
              <SelectItem value="field" className="text-gray-900">Cross Country</SelectItem>
              <SelectItem value="road_running" className="text-gray-900">Other</SelectItem>
            </SelectContent>
          </Select>
          {errors.sportFocus && <p className="text-sm text-red-500">{errors.sportFocus}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="coachingPhilosophy" className="text-white">What&apos;s your coaching philosophy?</Label>
          <Textarea
            id="coachingPhilosophy"
            placeholder="Tell us about your approach to coaching and what makes you unique..."
            value={userData.coachingPhilosophy}
            onChange={(e) => updateUserData({ coachingPhilosophy: e.target.value })}
            className={`bg-white border-gray-200 text-gray-900 placeholder:text-gray-500 min-h-[100px] focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 hover:border-gray-300 ${errors.coachingPhilosophy ? "border-red-500" : ""}`}
          />
          {errors.coachingPhilosophy && <p className="text-sm text-red-500">{errors.coachingPhilosophy}</p>}
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