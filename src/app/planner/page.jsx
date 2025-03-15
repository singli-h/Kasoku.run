import MesoWizard from "../../components/mesoWizard/mesoWizard"

export default function PlannerPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Full-page background gradient with no gaps */}
      <div className="fixed inset-0 -z-20 overflow-hidden pointer-events-none">
        {/* Top gradient extends beyond the viewport */}
        <div 
          className="fixed -top-[10vh] -left-[10vw] w-[120vw] h-[120vh] max-w-none"
          style={{
            background: 'radial-gradient(ellipse at 20% 20%, rgba(88, 28, 135, 0.09), rgba(88, 28, 135, 0.04) 50%, transparent 80%)',
            filter: 'blur(70px)',
          }}
        ></div>
        <div 
          className="fixed -bottom-[10vh] -right-[10vw] w-[120vw] h-[120vh] max-w-none"
          style={{
            background: 'radial-gradient(ellipse at 80% 80%, rgba(37, 99, 235, 0.09), rgba(37, 99, 235, 0.04) 50%, transparent 80%)',
            filter: 'blur(70px)',
          }}
        ></div>
      </div>
      
      {/* Content container with padding inside */}
      <div className="max-w-4xl mx-auto relative z-10 pt-8 px-4">
        <h2 className="text-2xl font-bold mb-6">Create New Mesocycle</h2>
        <MesoWizard />
      </div>
    </div>
  )
} 