"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import MesoWizard from '../../components/mesoWizard/mesoWizard'
import CalendarView from '../../components/overview/CalendarView'
import PresetGroupBuilder from '../../components/builder/PresetGroupBuilder'
import PageBackground from '@/components/ui/PageBackground'
import { useUserRole } from '@/context/UserRoleContext'

// Configure this page for dynamic rendering
export const dynamic = 'force-dynamic'

export default function PlansPage() {
  const router = useRouter()
  // Controlled tab state to ensure Wizard is default on load
  const [tab, setTab] = useState('wizard')
  const { roleData } = useUserRole();
  const userRole = roleData?.role;

  // Ensure Wizard tab is selected on initial load
  useEffect(() => {
    setTab('wizard')
  }, [])

  // Handle completion of the wizard: assign sessions then redirect
  const handleComplete = async (result) => {
    console.log('Training plan created:', result)
    // Extract created preset-group IDs from API response
    const groups = result.apiResponse?.data?.groups || []
    // Assign training sessions for each group
    await Promise.all(
      groups.map((g) =>
        fetch(`/api/plans/preset-groups/${g.id}/assign-sessions`, {
          method: 'POST',
          credentials: 'include'
        })
      )
    )
    // Redirect based on user role
    if (userRole === 'coach') {
      router.push('/sessions')
    } else {
      router.push('/workout')
    }
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
          <PresetGroupBuilder userRole={userRole} />
        </div>
      </TabsContent>
    </Tabs>
  )
} 