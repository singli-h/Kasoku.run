"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import MesoWizard from '../../components/mesoWizard/mesoWizard'
import CalendarView from '../../components/overview/CalendarView'
import PresetGroupBuilder from '../../components/builder/PresetGroupBuilder'
import PageBackground from '@/components/ui/PageBackground'
import { useUserRole } from '@/context/UserRoleContext'
import { Wand2, CalendarDays, Wrench } from 'lucide-react'

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
    <Tabs value={tab} onValueChange={setTab} className="min-h-screen flex flex-col">
      <div className="sticky top-0 z-10 bg-gradient-to-b from-white via-white/90 to-white/0 pb-2">
        <div className="container mx-auto px-4">
          <TabsList className="grid w-full grid-cols-3 gap-2 h-auto p-2 rounded-lg bg-slate-100 shadow-sm">
            <TabsTrigger 
              value="wizard" 
              className="flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-150 ease-in-out hover:bg-slate-200 data-[state=active]:hover:bg-primary/90"
            >
              <Wand2 className="h-5 w-5" />
              Plan Wizard
            </TabsTrigger>
            <TabsTrigger 
              value="calendar" 
              className="flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-150 ease-in-out hover:bg-slate-200 data-[state=active]:hover:bg-primary/90"
            >
              <CalendarDays className="h-5 w-5" />
              Calendar View
            </TabsTrigger>
            <TabsTrigger 
              value="builder" 
              className="flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-150 ease-in-out hover:bg-slate-200 data-[state=active]:hover:bg-primary/90"
            >
              <Wrench className="h-5 w-5" />
              Preset Builder
            </TabsTrigger>
          </TabsList>
        </div>
      </div>

      <div className="flex-grow">
        <TabsContent value="wizard" className="mt-0 pt-6 sm:pt-8">
          <div className="w-full max-w-4xl mx-auto px-4">
            <h1 className="text-3xl font-bold tracking-tight mb-6 text-center text-gray-800">Create Your Training Plan</h1>
            <PageBackground />
            <MesoWizard onComplete={handleComplete} />
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="mt-0 pt-6 sm:pt-8">
          <div className="w-full max-w-6xl mx-auto p-4">
            <h1 className="text-3xl font-bold tracking-tight mb-6 text-gray-800">Training Calendar</h1>
            <CalendarView />
          </div>
        </TabsContent>

        <TabsContent value="builder" className="mt-0 pt-6 sm:pt-8">
          <div className="w-full max-w-7xl mx-auto p-4">
            {/* Title for builder is handled within GroupListView now */}
            <PresetGroupBuilder userRole={userRole} />
          </div>
        </TabsContent>
      </div>
    </Tabs>
  )
} 