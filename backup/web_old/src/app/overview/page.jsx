"use client"

import { useState, useEffect } from "react"
import { useSession } from '@clerk/nextjs';
import CalendarView from "../../components/overview/CalendarView"
import PlanBuilder from "../../components/overview/PlanBuilder"
import MesocycleOverview from "../../components/overview/MesocycleOverview"
import WeeklyOverview from "../../components/overview/WeeklyOverview"
import { Calendar, ListOrdered, BarChart } from "lucide-react"

const CustomButton = ({ children, isActive, className = "", ...props }) => {
  return (
    <button
      className={`h-24 flex flex-col items-center justify-center gap-2 p-4 rounded-lg transition-all
        ${
          isActive 
            ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
            : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
        }
        ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default function OverviewPage() {
  const { session, isLoaded: isSessionLoaded, isSignedIn } = useSession();
  const [mesocycles, setMesocycles] = useState([]);
  const [mesocycle, setMesocycle] = useState(null);
  const [loadingMesocycles, setLoadingMesocycles] = useState(true);
  const [errorMesocycles, setErrorMesocycles] = useState(null);
  const [activeView, setActiveView] = useState("calendar")

  const handleMesocycleUpdate = (updatedMesocycle) => {
    setMesocycle(updatedMesocycle)
    // Here you would typically save the updated mesocycle to your API or state management solution
  }

  useEffect(() => {
    if (!isSessionLoaded) return;
    if (!isSignedIn) {
      setErrorMesocycles('Not signed in');
      setLoadingMesocycles(false);
      return;
    }
    const fetchMesocycles = async () => {
      try {
        const token = await session.getToken();
        const res = await fetch('/api/plans/mesocycle', { headers: { Authorization: `Bearer ${token}` } });
        const body = await res.json();
        if (!res.ok || body.status !== 'success') throw new Error(body.message || 'Failed to fetch mesocycles');
        setMesocycles(body.data);
        setMesocycle(body.data[0] || null);
      } catch (err) {
        setErrorMesocycles(err.message);
      } finally {
        setLoadingMesocycles(false);
      }
    };
    fetchMesocycles();
  }, [session, isSessionLoaded, isSignedIn]);

  if (loadingMesocycles) return <div>Loading mesocycles...</div>;
  if (errorMesocycles) return <div>Error: {errorMesocycles}</div>;
  if (!mesocycle) return <div>No mesocycles available</div>;

  const renderActiveView = () => {
    switch (activeView) {
      case "calendar":
        return <CalendarView mesocycle={mesocycle} onUpdate={handleMesocycleUpdate} />
      case "planBuilder":
        return <PlanBuilder mesocycle={mesocycle} onUpdate={handleMesocycleUpdate} />
      case "mesocycleOverview":
        return <MesocycleOverview mesocycle={mesocycle} />
      default:
        return null
    }
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Mesocycle Overview</h1>
        
        {/* Weekly Overview Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Weekly Progress</h2>
          <WeeklyOverview />
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-8">
          <CustomButton
            onClick={() => setActiveView("calendar")}
            isActive={activeView === "calendar"}
          >
            <Calendar className="w-6 h-6" />
            <span className="text-sm font-medium">Calendar View</span>
          </CustomButton>
          
          <CustomButton
            onClick={() => setActiveView("planBuilder")}
            isActive={activeView === "planBuilder"}
          >
            <ListOrdered className="w-6 h-6" />
            <span className="text-sm font-medium">Plan Builder</span>
          </CustomButton>
          
          <CustomButton
            onClick={() => setActiveView("mesocycleOverview")}
            isActive={activeView === "mesocycleOverview"}
          >
            <BarChart className="w-6 h-6" />
            <span className="text-sm font-medium">Progress Overview</span>
          </CustomButton>
        </div>
        <div className="mt-6">{renderActiveView()}</div>
      </div>
    </main>
  )
}

