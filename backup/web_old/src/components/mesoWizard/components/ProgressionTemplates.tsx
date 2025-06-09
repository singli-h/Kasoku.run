"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Waves, TrendingUp, AreaChart, Flame, Target } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { generateProgressionTemplate } from "../utils/progressionFormulas";
import type { WeeklyProgressionData } from "@/types/exercise-planner";

// CSS for hiding scrollbar while maintaining scrolling functionality
const hideScrollbarCSS = `
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

// CSS for styling the sliders according to intensity/volume color scheme
const sliderStyles: Record<string, React.CSSProperties> = {
  intensity: {
    // Define if needed, or remove if Tailwind classes handle it
  },
  volume: {
    // Define if needed, or remove if Tailwind classes handle it
  },
};

interface ProgressionTemplate {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  options?: Record<string, { label: string; min: number; max: number; step: number; defaultValue: number }>;
}

interface ProgressionTemplatesProps {
  duration: number;
  baseIntensity: number;
  baseVolume: number;
  onApplyTemplate: (template: WeeklyProgressionData[], modelType: string) => void;
  currentModel: string | null;
}

const ProgressionTemplates: React.FC<ProgressionTemplatesProps> = ({
  duration,
  baseIntensity,
  baseVolume,
  onApplyTemplate,
  currentModel,
}) => {
  const [activeTab, setActiveTab] = useState<string>("linear");
  const [templateOptions, setTemplateOptions] = useState<Record<string, Record<string, number>>>({});

  const templates: ProgressionTemplate[] = [
    {
      id: "linear",
      name: "Linear",
      icon: TrendingUp,
      description: "Gradual increase in intensity and/or volume.",
      options: {
        progressionRate: { label: "Weekly Increase %", min: 1, max: 10, step: 0.5, defaultValue: 2.5 },
        deloadFrequency: { label: "Deload Every (Weeks)", min: 2, max: 8, step: 1, defaultValue: 4 },
      }
    },
    {
      id: "undulating",
      name: "Undulating",
      icon: Waves,
      description: "Varies intensity and volume within the week or across weeks.",
      options: {
        amplitude: { label: "Variation Amplitude", min: 1, max: 3, step: 0.5, defaultValue: 1.5 },
        period: { label: "Cycle Length (Weeks)", min: 2, max: 4, step: 1, defaultValue: 3 },
      }
    },
    {
      id: "accumulation",
      name: "Accumulation",
      icon: AreaChart,
      description: "Focus on increasing volume, intensity maintained or slightly increased.",
       options: {
        intensityDelta: { label: "Intensity Increment", min: 0, max: 5, step: 0.5, defaultValue: 1 },
      }
    },
    {
      id: "transmutation",
      name: "Transmutation",
      icon: Flame,
      description: "Focus on increasing intensity, volume maintained or slightly decreased.",
      options: {
        volumeDelta: { label: "Volume Reduction", min: 0, max: 5, step: 0.5, defaultValue: 1 },
      }
    },
    {
      id: "realization",
      name: "Realization (Peaking)",
      icon: Target,
      description: "Significant drop in volume, intensity remains high or slightly decreases to allow for peak performance.",
      options: {
        targetVolume: { label: "Taper Volume Level", min: 1, max: 5, step: 1, defaultValue: 3 },
        taperStartWeek: {label: "Start Taper (Week)", min: 1, max: duration, step: 1, defaultValue: Math.max(1, duration -1)}
      }
    },
  ];

  useEffect(() => {
    const newTemplateOptionsData: Record<string, Record<string, number>> = {};
    templates.forEach(template => {
      if (template.options) {
        const currentTemplateOptions = template.options;
        if (!newTemplateOptionsData[template.id]) {
            newTemplateOptionsData[template.id] = {};
        }
        (Object.keys(currentTemplateOptions) as Array<keyof typeof currentTemplateOptions>).forEach(optKey => {
          const optionConfig = currentTemplateOptions[optKey];
          const optionsForCurrentTemplate = newTemplateOptionsData[template.id];
          if (optionsForCurrentTemplate && optionConfig && typeof optionConfig.defaultValue === 'number') {
            optionsForCurrentTemplate[optKey] = optionConfig.defaultValue;
          }
        });
      }
    });
    setTemplateOptions(newTemplateOptionsData);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  const handleApply = (templateId: string) => {
    const optionsForTemplate = templateOptions[templateId] || {};
    const generatedTemplate = generateProgressionTemplate(
      templateId,
      duration,
      baseIntensity,
      baseVolume,
      optionsForTemplate
    );
    onApplyTemplate(generatedTemplate, templateId);
  };

  const handleOptionChange = (templateId: string, optionKey: string, value: number) => {
    setTemplateOptions(prev => ({
      ...prev,
      [templateId]: {
        ...prev[templateId],
        [optionKey]: value,
      }
    }));
  };

  const selectedTemplate = templates.find(t => t.id === activeTab);

  return (
    <Card className="w-full max-w-lg shadow-md">
       <style dangerouslySetInnerHTML={{ __html: hideScrollbarCSS }} />
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <Label className="text-sm font-medium">Progression Models</Label>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList className="h-8 hide-scrollbar overflow-x-auto">
              {templates.map((template) => (
                <TabsTrigger
                  key={template.id}
                  value={template.id}
                  className="px-2.5 py-1 text-xs h-auto"
                >
                  <template.icon className="h-3.5 w-3.5 mr-1.5" />
                  {template.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {selectedTemplate && (
          <div className="bg-gray-50 p-3 rounded-md mb-3">
            <p className="text-xs text-gray-600 leading-relaxed">{selectedTemplate.description}</p>
            {selectedTemplate.options && Object.keys(selectedTemplate.options).length > 0 && (
              <div className="mt-2 space-y-2">
                {Object.entries(selectedTemplate.options).map(([optKey, optConfig]) => (
                  <div key={optKey} className="grid grid-cols-2 items-center gap-2">
                    <Label htmlFor={`${selectedTemplate.id}-${optKey}`} className="text-xs whitespace-nowrap">
                      {optConfig.label}:
                    </Label>
                    <div className="flex items-center gap-2">
                      <Slider
                        id={`${selectedTemplate.id}-${optKey}`}
                        min={optConfig.min}
                        max={optConfig.max}
                        step={optConfig.step}
                        value={[templateOptions[selectedTemplate.id]?.[optKey] ?? optConfig.defaultValue]}
                        onValueChange={(val) => {
                          if (val && val.length > 0 && typeof val[0] === 'number') {
                            handleOptionChange(selectedTemplate.id, optKey, val[0]);
                          }
                        }}
                        className="w-full [&>span:first-child]:h-2.5 [&>span>span]:h-2.5 [&>span>span]:w-2.5 [&>span]:bg-gray-200"
                      />
                      <span className="text-xs w-10 text-right">
                        {templateOptions[selectedTemplate.id]?.[optKey] ?? optConfig.defaultValue}
                        {optKey.includes('Rate') || optKey.includes('Delta') ? '%' : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <Button
          onClick={() => handleApply(activeTab)}
          className="w-full h-9 text-sm"
          disabled={currentModel === activeTab}
        >
          {currentModel === activeTab ? "Model Applied" : `Apply ${templates.find(t => t.id === activeTab)?.name} Model`}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProgressionTemplates; 