"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Target } from "lucide-react"
import { motion } from "framer-motion"

export default function AthleteDetailsStep({ userData, updateUserData, onNext, onPrev }) {
  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}

    if (!userData.firstName?.trim()) newErrors.firstName = "First name is required"
    if (!userData.lastName?.trim()) newErrors.lastName = "Last name is required"
    if (!userData.birthday) newErrors.birthday = "Birthday is required"
    if (!userData.height) newErrors.height = "Height is required"
    else if (isNaN(userData.height) || userData.height < 100 || userData.height > 250) {
      newErrors.height = "Height must be between 100-250 cm"
    }
    if (!userData.weight) newErrors.weight = "Weight is required"
    else if (isNaN(userData.weight) || userData.weight < 30 || userData.weight > 200) {
      newErrors.weight = "Weight must be between 30-200 kg"
    }
    if (!userData.sprintGoals?.trim()) newErrors.sprintGoals = "Sprint goals are required"

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
            <Label htmlFor="birthday" className="text-white">Birthday</Label>
            <Input
              id="birthday"
              type="date"
              value={userData.birthday}
              onChange={(e) => updateUserData({ birthday: e.target.value })}
              variant="onboarding"
              className={errors.birthday ? "border-red-500" : ""}
            />
            {errors.birthday && <p className="text-sm text-red-500">{errors.birthday}</p>}
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
          <Label htmlFor="sprintGoals" className="text-white">What are your sprint goals?</Label>
          <Textarea
            id="sprintGoals"
            placeholder="Tell us about your sprint goals and what you want to achieve..."
            value={userData.sprintGoals}
            onChange={(e) => updateUserData({ sprintGoals: e.target.value })}
            className={`bg-white border-gray-200 text-gray-900 placeholder:text-gray-500 min-h-[100px] focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 hover:border-gray-300 ${errors.sprintGoals ? "border-red-500" : ""}`}
          />
          {errors.sprintGoals && <p className="text-sm text-red-500">{errors.sprintGoals}</p>}
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