"use client"
import React, { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import MesoWizard from '../../components/mesoWizard/mesoWizard'
import CalendarView from '../../components/overview/CalendarView'
import PresetGroupBuilder from '../../components/builder/PresetGroupBuilder'
import { useUserRole } from '@/context/UserRoleContext'
import { Wand2, CalendarDays, Wrench, Zap, Target, Clock, TrendingUp } from 'lucide-react'

// Configure this page for dynamic rendering
export const dynamic = 'force-dynamic'

export default function PlansPage() {
  const router = useRouter()
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
     {/* Navigation Tabs */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <Tabs value={tab} onValueChange={setTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 gap-0 h-auto p-1 bg-slate-100 rounded-lg">
                <TabsTrigger 
                  value="wizard" 
                  className="flex items-center justify-center gap-2 py-4 px-4 text-sm font-medium rounded-md data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all duration-200 ease-in-out hover:bg-slate-50"
                >
                  <Wand2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">Plan Wizard</span>
                  <span className="sm:hidden">Wizard</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="calendar" 
                  className="flex items-center justify-center gap-2 py-4 px-4 text-sm font-medium rounded-md data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all duration-200 ease-in-out hover:bg-slate-50"
                >
                  <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">Calendar View</span>
                  <span className="sm:hidden">Calendar</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="builder" 
                  className="flex items-center justify-center gap-2 py-4 px-4 text-sm font-medium rounded-md data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all duration-200 ease-in-out hover:bg-slate-50"
                >
                  <Wrench className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">Preset Builder</span>
                  <span className="sm:hidden">Builder</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <Tabs value={tab} onValueChange={setTab}>
            
            {/* Plan Wizard Tab */}
            <TabsContent value="wizard" className="mt-0 space-y-6">
              <Card className="bg-white shadow-lg border-0 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <CardTitle className="text-2xl sm:text-3xl flex items-center gap-3">
                    <Wand2 className="h-6 w-6 sm:h-8 sm:w-8" />
                    Create Your Training Plan
                  </CardTitle>
                  <CardDescription className="text-blue-100 text-base sm:text-lg">
                    Let our AI-powered wizard guide you through creating the perfect training program tailored to your goals
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="p-6 sm:p-8">
                    <Suspense fallback={<div className="flex items-center justify-center py-8">Loading wizard...</div>}>
                      <MesoWizard onComplete={handleComplete} />
                    </Suspense>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Calendar View Tab */}
            <TabsContent value="calendar" className="mt-0 space-y-6">
              <Card className="bg-white shadow-lg border-0 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                  <CardTitle className="text-2xl sm:text-3xl flex items-center gap-3">
                    <CalendarDays className="h-6 w-6 sm:h-8 sm:w-8" />
                    Training Calendar
                  </CardTitle>
                  <CardDescription className="text-green-100 text-base sm:text-lg">
                    View and manage your training schedule with our comprehensive calendar interface
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="p-6 sm:p-8">
                    <CalendarView />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preset Builder Tab */}
            <TabsContent value="builder" className="mt-0 space-y-6">
              <Card className="bg-white shadow-lg border-0 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
                  <CardTitle className="text-2xl sm:text-3xl flex items-center gap-3">
                    <Wrench className="h-6 w-6 sm:h-8 sm:w-8" />
                    Preset Builder
                  </CardTitle>
                  <CardDescription className="text-orange-100 text-base sm:text-lg">
                    Create and customize training presets for quick plan generation
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="p-6 sm:p-8">
                    <PresetGroupBuilder userRole={userRole} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </div>
  )
} 