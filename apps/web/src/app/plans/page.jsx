"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import MesoWizard from '../../components/mesoWizard/mesoWizard'
import CalendarView from '../../components/overview/CalendarView'
import PlanBuilder from '../../components/overview/PlanBuilder'
import PageBackground from '@/components/ui/PageBackground'

// Configure this page for dynamic rendering
export const dynamic = 'force-dynamic'

export default function PlansPage() {
  const router = useRouter()
  // Controlled tab state to ensure Wizard is default on load
  const [tab, setTab] = useState('wizard')

  // Ensure Wizard tab is selected on initial load
  useEffect(() => {
    setTab('wizard')
  }, [])

  // Handle completion of the wizard
  const handleComplete = (data) => {
    console.log('Training plan created:', data)
    router.push('/sessions')
  }

  return (
    <Tabs value={tab} onValueChange={setTab} className="min-h-screen">
      <TabsList className="flex space-x-4 p-4 bg-white">
        <TabsTrigger value="wizard">Wizard</TabsTrigger>
        <TabsTrigger value="calendar">Calendar</TabsTrigger>
        <TabsTrigger value="builder">Builder</TabsTrigger>
      </TabsList>

      <TabsContent value="wizard">
        <div className="w-full max-w-4xl mx-auto pt-4 sm:pt-6 px-4">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Create New Training Plan</h2>
          <PageBackground />
          <MesoWizard onComplete={handleComplete} />
        </div>
      </TabsContent>

      <TabsContent value="calendar">
        <div className="w-full max-w-6xl mx-auto p-4">
          <CalendarView />
        </div>
      </TabsContent>

      <TabsContent value="builder">
        <div className="w-full max-w-6xl mx-auto p-4">
          <PlanBuilder />
        </div>
      </TabsContent>
    </Tabs>
  )
} 