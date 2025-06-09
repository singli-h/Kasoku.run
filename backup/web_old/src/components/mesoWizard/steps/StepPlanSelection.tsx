"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { MesoWizardFormData } from "../hooks/useMesoWizardState";

interface StepPlanSelectionProps {
  formData: Pick<MesoWizardFormData, 'planType'>;
  handleInputChange: (_field: 'planType', _value: MesoWizardFormData['planType']) => void;
  handleNext: () => void;
}

/**
 * Step One: Plan Selection
 * 
 * This step allows users to select between different plan types
 */
const StepPlanSelection: React.FC<StepPlanSelectionProps> = React.memo(({ formData, handleInputChange, handleNext }) => {
  const initialSelection = formData.planType === "macrocycle" || formData.planType === undefined 
                           ? "mesocycle" 
                           : formData.planType;
  const [selection, setSelection] = useState<"mesocycle" | "microcycle" | "macrocycle">(initialSelection);
  const [showMacrocycleAlert, setShowMacrocycleAlert] = useState(false);
  const [error, setError] = useState("");

  const handleSelectionChange = (selectedPlan: "mesocycle" | "microcycle" | "macrocycle") => {
    if (selectedPlan === "macrocycle") {
      setShowMacrocycleAlert(true);
      return;
    }
    
    setSelection(selectedPlan);
    setError("");
    
    handleInputChange("planType", selectedPlan);
  };

  // Handle keyboard navigation for plan selection cards
  const handleCardKeyDown = (event: React.KeyboardEvent, planType: "mesocycle" | "microcycle" | "macrocycle") => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleSelectionChange(planType);
    }
  };

  const handleNextClick = () => {
    if (formData.planType === "macrocycle" || !formData.planType) {
      setError("Please select a valid plan type (Mesocycle or Microcycle) to continue.");
      if (formData.planType === "macrocycle" && !showMacrocycleAlert) {
        setShowMacrocycleAlert(true);
      }
      return;
    }
    if (!selection || selection === "macrocycle") {
      setError("Please select a valid plan type (Mesocycle or Microcycle) to continue.");
      return;
    }
    handleNext();
  };

  return (
    <main className="space-y-1">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-3">Choose Your Training Plan Type</h2>
        <p className="text-gray-600 max-w-xl mx-auto">
          Select how you want to structure your training plan. This will determine the scope and organization of your program.
        </p>
      </div>

      <section 
        role="radiogroup"
        aria-labelledby="plan-selection-heading"
        aria-describedby="plan-selection-description"
        aria-required="true"
        className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8"
      >
        <div id="plan-selection-heading" className="sr-only">Training Plan Type Selection</div>
        <div id="plan-selection-description" className="sr-only">
          Choose between Mesocycle (4-8 weeks), Microcycle (1 week), or Macrocycle (coming soon) training plans
        </div>
        
        {/* Mesocycle Card */}
        <div>
          <Card 
            role="radio"
            tabIndex={0}
            aria-checked={selection === "mesocycle"}
            aria-labelledby="mesocycle-heading"
            aria-describedby="mesocycle-description"
            onClick={() => handleSelectionChange("mesocycle")}
            onKeyDown={(e) => handleCardKeyDown(e, "mesocycle")}
            className={`h-full cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              selection === "mesocycle" 
                ? "border-2 border-blue-500 bg-blue-50 shadow-md" 
                : "border border-gray-200 hover:border-gray-300 hover:shadow-sm"
            }`}
          >
            <div className="p-6">
              <div className="text-center mb-4">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    className="w-8 h-8 text-blue-500"
                    aria-hidden="true"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="9" y1="3" x2="9" y2="21"></line>
                    <line x1="15" y1="3" x2="15" y2="21"></line>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="3" y1="15" x2="21" y2="15"></line>
                  </svg>
                </div>
                <h3 id="mesocycle-heading" className="text-xl font-bold mb-2 text-blue-700">Mesocycle Plan</h3>
                <p className="text-gray-600">
                  Plan your training week-by-week with volume and intensity targets.
                </p>
              </div>
              
              <div id="mesocycle-description" className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 text-blue-500 mr-2" aria-hidden="true">✓</div>
                  <p>Typically spans 4-8 weeks focused on specific goals</p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 text-blue-500 mr-2" aria-hidden="true">✓</div>
                  <p>Progressive overload with weekly progression</p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 text-blue-500 mr-2" aria-hidden="true">✓</div>
                  <p>Ideal for strength, hypertrophy or conditioning focus</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Microcycle Card */}
        <div>
          <Card 
            role="radio"
            tabIndex={0}
            aria-checked={selection === "microcycle"}
            aria-labelledby="microcycle-heading"
            aria-describedby="microcycle-description"
            onClick={() => handleSelectionChange("microcycle")}
            onKeyDown={(e) => handleCardKeyDown(e, "microcycle")}
            className={`h-full cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
              selection === "microcycle" 
                ? "border-2 border-green-500 bg-green-50 shadow-md" 
                : "border border-gray-200 hover:border-gray-300 hover:shadow-sm"
            }`}
          >
            <div className="p-6">
              <div className="text-center mb-4">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    className="w-8 h-8 text-green-500"
                    aria-hidden="true"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="3" y1="15" x2="21" y2="15"></line>
                    <line x1="9" y1="3" x2="9" y2="21"></line>
                  </svg>
                </div>
                <h3 id="microcycle-heading" className="text-xl font-bold mb-2 text-green-700">Microcycle Plan</h3>
                <p className="text-gray-600">
                  Simple one-week training plan for quick implementation.
                </p>
              </div>
              
              <div id="microcycle-description" className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 text-green-500 mr-2" aria-hidden="true">✓</div>
                  <p>One-week plan with daily workout structure</p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 text-green-500 mr-2" aria-hidden="true">✓</div>
                  <p>Quick setup without complex progression patterns</p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 text-green-500 mr-2" aria-hidden="true">✓</div>
                  <p>Perfect for busy schedules or specific short-term goals</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Macrocycle Card */}
        <div className="relative">
          <div className="absolute -top-3 right-6 z-10 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
            Coming Soon
          </div>
          
          <Card 
            role="radio"
            tabIndex={0}
            aria-checked={selection === "macrocycle"}
            aria-labelledby="macrocycle-heading"
            aria-describedby="macrocycle-description"
            aria-disabled="true"
            onClick={() => handleSelectionChange("macrocycle")}
            onKeyDown={(e) => handleCardKeyDown(e, "macrocycle")}
            className="h-full cursor-pointer border border-gray-200 opacity-80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 hover:border-gray-300 hover:shadow-sm"
          >
            <div className="p-6">
              <div className="text-center mb-4">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-orange-100 flex items-center justify-center">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    className="w-8 h-8 text-orange-500"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <h3 id="macrocycle-heading" className="text-xl font-bold mb-2 text-orange-700">Macrocycle Plan</h3>
                <p className="text-gray-600">
                  Long-term season planning. (Coming soon)
                </p>
              </div>
              
              <div id="macrocycle-description" className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 text-orange-400 mr-2" aria-hidden="true">✓</div>
                  <p>Typically spans multiple months or an entire season</p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 text-orange-400 mr-2" aria-hidden="true">✓</div>
                  <p>Periodized approach with phases for different adaptations</p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 text-orange-400 mr-2" aria-hidden="true">✓</div>
                  <p>Ideal for athletes with specific competition seasons</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {error && (
        <div 
          role="alert"
          aria-live="polite"
          className="text-center text-red-500 font-medium"
        >
          {error}
        </div>
      )}

      {showMacrocycleAlert && (
        <Alert 
          role="alert"
          aria-live="assertive"
          className="mt-4 bg-orange-50 border-orange-200"
        >
          <AlertCircle className="h-4 w-4 text-orange-500" />
          <AlertDescription>
            Macrocycle planning is not yet available. Please select Mesocycle or Microcycle Plan to continue.
          </AlertDescription>
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-auto" 
            onClick={() => setShowMacrocycleAlert(false)}
            aria-label="Dismiss macrocycle unavailable message"
          >
            Dismiss
          </Button>
        </Alert>
      )}

      <div className="flex justify-end">
        <Button 
          onClick={handleNextClick} 
          size="lg"
          className="px-6 bg-blue-600 hover:bg-blue-700 text-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          disabled={selection === "macrocycle" || formData.planType === "macrocycle"}
          aria-describedby={error ? "plan-selection-error" : undefined}
        >
          Continue
        </Button>
      </div>
    </main>
  );
});

StepPlanSelection.displayName = 'StepPlanSelection';

export default StepPlanSelection; 