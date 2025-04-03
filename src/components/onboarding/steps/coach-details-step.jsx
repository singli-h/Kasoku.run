"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Medal } from "lucide-react"

export default function CoachDetailsStep({ userData, updateUserData, onNext, onPrev }) {
  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}

    if (!userData.firstName) newErrors.firstName = "First name is required"
    if (!userData.lastName) newErrors.lastName = "Last name is required"
    if (!userData.birthday) newErrors.birthday = "Birthday is required"
    if (!userData.teamName) newErrors.teamName = "Team name is required"
    if (!userData.sportFocus) newErrors.sportFocus = "Sport focus is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleContinue = () => {
    if (validateForm()) {
      onNext()
    }
  }

  const sportOptions = [
    "Track & Field - Sprints",
    "Track & Field - Distance",
    "Football/Soccer",
    "Basketball",
    "Swimming",
    "Triathlon",
    "CrossFit",
    "Other",
  ]

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white">Coach Profile</h2>
        <p className="text-white/70 mt-2">Tell us about yourself and your team</p>
      </div>

      <div className="space-y-6">
        {/* Personal Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-white">First Name</Label>
            <Input
              id="firstName"
              placeholder="Enter your first name"
              value={userData.firstName}
              onChange={(e) => updateUserData({ firstName: e.target.value })}
              className={`bg-[#262C3A] border-white/10 text-white placeholder:text-white/40 ${errors.firstName ? "border-red-500" : "focus:border-[#2563EB]"}`}
            />
            {errors.firstName && <p className="text-sm text-red-500">{errors.firstName}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-white">Last Name</Label>
            <Input
              id="lastName"
              placeholder="Enter your last name"
              value={userData.lastName}
              onChange={(e) => updateUserData({ lastName: e.target.value })}
              className={`bg-[#262C3A] border-white/10 text-white placeholder:text-white/40 ${errors.lastName ? "border-red-500" : "focus:border-[#2563EB]"}`}
            />
            {errors.lastName && <p className="text-sm text-red-500">{errors.lastName}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthday" className="text-white">Birthday</Label>
          <Input
            id="birthday"
            type="date"
            value={userData.birthday}
            onChange={(e) => updateUserData({ birthday: e.target.value })}
            className={`bg-[#262C3A] border-white/10 text-white ${errors.birthday ? "border-red-500" : "focus:border-[#2563EB]"}`}
          />
          {errors.birthday && <p className="text-sm text-red-500">{errors.birthday}</p>}
        </div>

        {/* Team Information */}
        <div className="pt-4 border-t border-white/10">
          <h3 className="font-medium text-white mb-4">Team Information</h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="teamName" className="flex items-center gap-2 text-white">
                <Users className="w-4 h-4 text-[#2563EB]" />
                Team Name
              </Label>
              <Input
                id="teamName"
                placeholder="Enter your team or group name"
                value={userData.teamName}
                onChange={(e) => updateUserData({ teamName: e.target.value })}
                className={`bg-[#262C3A] border-white/10 text-white placeholder:text-white/40 ${errors.teamName ? "border-red-500" : "focus:border-[#2563EB]"}`}
              />
              {errors.teamName && <p className="text-sm text-red-500">{errors.teamName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sportFocus" className="flex items-center gap-2 text-white">
                <Medal className="w-4 h-4 text-[#2563EB]" />
                Sport Focus
              </Label>
              <Select 
                value={userData.sportFocus} 
                onValueChange={(value) => updateUserData({ sportFocus: value })}
              >
                <SelectTrigger 
                  id="sportFocus" 
                  className={`bg-[#262C3A] border-white/10 text-white ${errors.sportFocus ? "border-red-500" : "focus:border-[#2563EB]"}`}
                >
                  <SelectValue placeholder="Select your primary sport" />
                </SelectTrigger>
                <SelectContent className="bg-[#262C3A] border-white/10">
                  {sportOptions.map((sport) => (
                    <SelectItem 
                      key={sport} 
                      value={sport}
                      className="text-white hover:bg-[#2E364A] focus:bg-[#2E364A]"
                    >
                      {sport}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.sportFocus && <p className="text-sm text-red-500">{errors.sportFocus}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <Button 
          variant="outline" 
          onClick={onPrev}
          className="bg-[#262C3A] border-white/10 text-white hover:bg-[#2E364A] hover:border-white/20"
        >
          Back
        </Button>
        <Button 
          onClick={handleContinue}
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
        >
          Continue
        </Button>
      </div>
    </div>
  )
} 