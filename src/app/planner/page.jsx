"use client"
import { useRouter } from 'next/navigation'
import MesoWizard from "../../components/mesoWizard/mesoWizard"
import PageBackground from "@/components/ui/PageBackground"

export default function PlannerPage() {
  const router = useRouter();

  // Handle completion of the wizard
  const handleComplete = (data) => {
    console.log('Mesocycle/Microcycle created successfully:', data);
    
    // Navigate to the dashboard or appropriate page after completion
    // You can customize this based on your app's navigation structure
    router.push('/dashboard');
  }

  return (
    <div className="min-h-screen overflow-hidden">
      <PageBackground />
      
      {/* Optimized content container */}
      <div className="max-w-4xl mx-auto pt-4 sm:pt-6 px-2 sm:px-4">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Create New Mesocycle</h2>
        <MesoWizard onComplete={handleComplete} />
      </div>
    </div>
  )
} 