"use client"
import React, { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import PageBackground from '@/components/ui/PageBackground'
import { useUserRole } from '@/context/UserRoleContext'
import { Loader2 } from 'lucide-react' 

// Lazily load components to avoid circular dependencies
const MesoWizard = React.lazy(() => import('../../components/mesoWizard/mesoWizard'))
const CalendarView = React.lazy(() => import('../../components/overview/CalendarView'))
const PresetGroupBuilder = React.lazy(() => import('../../components/builder/PresetGroupBuilder'))

// Configure this page for dynamic rendering
export const dynamic = 'force-dynamic'

// Loading component
const LoadingComponent = () => (
  <div className="flex justify-center items-center h-[50vh]">
    <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
  </div>
)

export default function PlansPage() {
  const router = useRouter()
  // Controlled tab state to ensure Wizard is default on load
  const [tab, setTab] = useState('wizard')
  const { roleData, loading } = useUserRole();
  const userRole = roleData?.role;
  const [error, setError] = useState(null)

  // Ensure Wizard tab is selected on initial load
  useEffect(() => {
    setTab('wizard')
  }, [])

  // Handle completion of the wizard: assign sessions then redirect
  const handleComplete = async (result) => {
    try {
      console.log('Training plan created:', result)
      // Extract created preset-group IDs from API response
      const groups = result.apiResponse?.data?.groups || []
      // Assign training sessions for each group
      await Promise.all(
        groups.map((g) =>
          fetch(`/api/plans/preset-groups/${g.id}/assign`, {
            method: 'POST',
            credentials: 'include'
          }).then(res => {
            if (!res.ok) throw new Error(`Failed to assign session: ${res.status}`)
            return res.json()
          })
        )
      )
      // Redirect based on user role
      if (userRole === 'coach') {
        router.push('/sessions')
      } else {
        router.push('/workout')
      }
    } catch (err) {
      console.error('Error completing wizard:', err)
      setError(err.message)
    }
  }

  if (loading) {
    return <LoadingComponent />
  }

  return (
    <Tabs value={tab} onValueChange={setTab} className="min-h-screen">
      <TabsList className="flex space-x-4 p-4 bg-white">
        <TabsTrigger value="wizard">Wizard</TabsTrigger>
        <TabsTrigger value="calendar">Calendar</TabsTrigger>
        <TabsTrigger value="builder">Builder</TabsTrigger>
      </TabsList>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-4 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      <TabsContent value="wizard">
        <div className="w-full max-w-4xl mx-auto pt-4 sm:pt-6 px-4">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Create New Training Plan</h2>
          <PageBackground />
          <Suspense fallback={<LoadingComponent />}>
            <MesoWizard onComplete={handleComplete} />
          </Suspense>
        </div>
      </TabsContent>

      <TabsContent value="calendar">
        <div className="w-full max-w-6xl mx-auto p-4">
          <Suspense fallback={<LoadingComponent />}>
            <CalendarView />
          </Suspense>
        </div>
      </TabsContent>

      <TabsContent value="builder">
        <div className="w-full max-w-6xl mx-auto p-4">
          <Suspense fallback={<LoadingComponent />}>
            <PresetGroupBuilder userRole={userRole} />
          </Suspense>
        </div>
      </TabsContent>
    </Tabs>
  )
} 