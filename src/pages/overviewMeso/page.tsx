"use client"

import { useState } from "react"
import MesocycleWizard from "../plannerMeso/MesocycleWizard"
import MesocycleOverview from "./MesocycleOverview"
import PlanBuilder from "./PlanBuilder"
import CalendarView from "./CalendarView"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/common/Tabs"
import { mockMesocycle } from "../../../mockData"

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1)
  const [mesocycleData, setMesocycleData] = useState(null)

  const handleWizardComplete = (data: any) => {
    // In a real application, you would send this data to your backend
    // and receive the AI-generated mesocycle in response.
    // For now, we'll just use our mock data.
    setMesocycleData(mockMesocycle)
    setCurrentStep(2)
  }

  const handleMesocycleUpdate = (updatedMesocycle: any) => {
    setMesocycleData(updatedMesocycle)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-center text-blue-800">Mesocycle Planner</h1>
        {currentStep === 1 && <MesocycleWizard onComplete={handleWizardComplete} />}
        {currentStep === 2 && mesocycleData && (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="plan">Plan Builder</TabsTrigger>
              <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <MesocycleOverview mesocycle={mesocycleData} />
            </TabsContent>
            <TabsContent value="plan">
              <PlanBuilder mesocycle={mesocycleData} onUpdate={handleMesocycleUpdate} />
            </TabsContent>
            <TabsContent value="calendar">
              <CalendarView mesocycle={mesocycleData} onUpdate={handleMesocycleUpdate} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}

