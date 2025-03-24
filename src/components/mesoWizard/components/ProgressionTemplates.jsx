"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowUpRight, Waves, Timer, BarChart3, TrendingUp, AreaChart, Activity, Flame, Target } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { generateProgressionTemplate, clamp } from "../utils/progressionFormulas"

// CSS for styling the sliders according to intensity/volume color scheme
const sliderStyles = {
  intensity: {
    background: "linear-gradient(to right, hsla(25, 70%, 62%, 0.7), hsla(0, 90%, 40%, 0.9))"
  },
  volume: {
    background: "linear-gradient(to right, hsla(210, 65%, 65%, 0.7), hsla(270, 85%, 40%, 0.9))"
  },
  default: {
    background: "linear-gradient(to right, hsla(0, 0%, 40%, 0.7), hsla(0, 0%, 10%, 0.9))"
  },
  // Use split style for indicators to show it affects both intensity and volume
  diagonal: {
    background: "linear-gradient(to bottom, hsla(15, 80%, 50%, 1) 49%, hsla(240, 75%, 50%, 1) 51%)"
  }
};

/**
 * Calculate effective weeks accounting for deload weeks
 * @param {number} week - Current week (1-indexed)
 * @param {number} deloadFrequency - How often deload occurs
 * @returns {number} Effective training weeks
 */
const getEffectiveWeeks = (week, deloadFrequency) => {
  if (!deloadFrequency) return week;
  // Formula: effectiveWeeks = week - Math.floor((week - 1) / deloadFrequency)
  const deloads = Math.floor((week - 1) / deloadFrequency);
  return week - deloads;
};

/**
 * Apply deload effect to calculated values
 * @param {number} week - Current week (1-indexed)
 * @param {number} intensity - Calculated intensity
 * @param {number} volume - Calculated volume
 * @param {boolean} includeDeload - Whether to include deload weeks
 * @param {number} deloadFrequency - How often deload occurs
 * @param {number} deloadFactor - Multiplier for deload weeks (0.8 = 20% reduction)
 * @returns {Object} Adjusted intensity and volume
 */
const applyDeload = (week, intensity, volume, includeDeload, deloadFrequency, deloadFactor = 0.8) => {
  if (includeDeload && (week % deloadFrequency === 0)) {
    intensity *= deloadFactor;
    volume *= deloadFactor;
  }
  return { intensity, volume };
};

/**
 * Linear Progression:
 * Base formula: New Load = Base Load × (1 + r)^(effectiveWeeks - 1)
 * Increases intensity and volume by a constant percentage each week.
 */
const calculateLinearProgression = (duration, baseIntensity, baseVolume, includeDeload = false, deloadFrequency = 4, progressionRate = 0.05) => {
  const validDuration = Math.max(3, Math.min(12, duration || 4));
  const validBaseIntensity = clamp(baseIntensity || 5);
  const validBaseVolume = clamp(baseVolume || 5);

  const progression = [];
  for (let i = 1; i <= validDuration; i++) {
    const effectiveWeeks = getEffectiveWeeks(i, includeDeload ? deloadFrequency : null);
    
    // Formula: base * (1 + progressionRate)^(effectiveWeeks - 1)
    let intensity = validBaseIntensity * Math.pow(1 + progressionRate, effectiveWeeks - 1);
    let volume = validBaseVolume * Math.pow(1 + progressionRate, effectiveWeeks - 1);
    
    // Apply deload if applicable
    const adjusted = applyDeload(i, intensity, volume, includeDeload, deloadFrequency);
    
    progression.push({
      week: i,
      intensity: clamp(adjusted.intensity),
      volume: clamp(adjusted.volume)
    });
  }
  return progression;
};

/**
 * Undulating Progression:
 * Uses sine/cosine functions to create wave-like patterns for intensity and volume.
 * intensity = base + amplitude * sin(2π * (week - 1) / period)
 * volume = base + amplitude * cos(2π * (week - 1) / period)
 */
const calculateUndulatingProgression = (duration, baseIntensity, baseVolume, includeDeload = false, deloadFrequency = 4, amplitude = 1, period = 3) => {
  const validDuration = Math.max(3, Math.min(12, duration || 4));
  const validBaseIntensity = clamp(baseIntensity || 5);
  const validBaseVolume = clamp(baseVolume || 5);

  const progression = [];
  for (let i = 1; i <= validDuration; i++) {
    // Calculate oscillatory component (using week-1 for zero-indexing)
    let intensity = validBaseIntensity + amplitude * Math.sin(2 * Math.PI * (i - 1) / period);
    let volume = validBaseVolume + amplitude * Math.cos(2 * Math.PI * (i - 1) / period);
    
    // Add a slight progressive trend to ensure overall progress
    intensity += 0.1 * i;
    volume += 0.1 * i;
    
    // Apply deload if applicable
    const adjusted = applyDeload(i, intensity, volume, includeDeload, deloadFrequency);
    
    progression.push({
      week: i,
      intensity: clamp(adjusted.intensity),
      volume: clamp(adjusted.volume)
    });
  }
  return progression;
};

/**
 * Realization (Peaking/Tapering) Phase:
 * Intensity = Base * (1 + taper_rate)^(effectiveWeeks - 1)
 * Volume = Base * exp(-taper_rate * effectiveWeeks)
 */
const calculatePeakingProgression = (duration, baseIntensity, baseVolume, includeDeload = false, deloadFrequency = 4, taperRate = 0.1, taperStart = null) => {
  const validDuration = Math.max(3, Math.min(12, duration || 4));
  const validBaseIntensity = clamp(baseIntensity || 5);
  const validBaseVolume = clamp(baseVolume || 5);
  
  // If taperStart is not explicitly set, default to 2/3 of the duration
  const taperWeek = taperStart || Math.round(validDuration * 2/3);

  const progression = [];
  for (let i = 1; i <= validDuration; i++) {
    const effectiveWeeks = getEffectiveWeeks(i, includeDeload ? deloadFrequency : null);
    
    let intensity, volume;
    
    if (i < taperWeek) {
      // Accumulation phase - gradual increase in both
      intensity = validBaseIntensity * Math.pow(1 + 0.03, effectiveWeeks - 1);
      volume = validBaseVolume * Math.pow(1 + 0.05, effectiveWeeks - 1);
    } else {
      // Realization/taper phase - increase intensity, decrease volume
      const taperWeeks = i - taperWeek + 1;
      intensity = validBaseIntensity * Math.pow(1 + taperRate, effectiveWeeks - 1);
      volume = validBaseVolume * Math.exp(-taperRate * taperWeeks);
    }
    
    // Apply deload if applicable
    const adjusted = applyDeload(i, intensity, volume, includeDeload, deloadFrequency);
    
    progression.push({
      week: i,
      intensity: clamp(adjusted.intensity),
      volume: clamp(adjusted.volume)
    });
  }
  return progression;
};

const ProgressionTemplates = ({ duration = 4, baseIntensity = 5, baseVolume = 5, onApplyTemplate = () => {} }) => {
  const [activeTab, setActiveTab] = useState("linear");
  const [includeDeload, setIncludeDeload] = useState(false);
  const [deloadFrequency, setDeloadFrequency] = useState("4");
  const [deloadFactor, setDeloadFactor] = useState(0.8);
  
  // Model-specific parameters
  const [progressionRate, setProgressionRate] = useState(0.05);
  const [amplitude, setAmplitude] = useState(1);
  const [period, setPeriod] = useState(3);
  const [intensityDelta, setIntensityDelta] = useState(2);
  const [volumeDelta, setVolumeDelta] = useState(2);
  const [targetVolume, setTargetVolume] = useState(3);
  const [taperStart, setTaperStart] = useState(Math.round(duration * 2/3));
  
  // Update taper start when duration changes
  useEffect(() => {
    setTaperStart(Math.round(duration * 2/3));
  }, [duration]);

  const handleApplyTemplate = (templateType) => {
    const deloadFreq = includeDeload ? parseInt(deloadFrequency) : null;
    const options = {
      deloadFrequency: deloadFreq,
      deloadFactor,
      amplitude,
      period,
      intensityDelta,
      volumeDelta,
      targetVolume,
          progressionRate
    };

    const template = generateProgressionTemplate(
      templateType,
          duration, 
          baseIntensity, 
          baseVolume, 
      options
    );

    onApplyTemplate(template, templateType);
  };

  const getDeloadPercentage = () => {
    return `${Math.round((1 - deloadFactor) * 100)}%`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Progression Templates</h3>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          Scientific Formula-Based
        </span>
      </div>
      <p className="text-sm text-gray-600">
        Apply evidence-based progression patterns with precise mathematical models for optimal training adaptation
      </p>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="linear" className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Linear</span>
          </TabsTrigger>
          <TabsTrigger value="undulating" className="flex items-center gap-1">
            <Waves className="h-4 w-4" />
            <span className="hidden sm:inline">Undulating</span>
          </TabsTrigger>
          <TabsTrigger value="accumulation" className="flex items-center gap-1">
            <AreaChart className="h-4 w-4" />
            <span className="hidden sm:inline">Accumulation</span>
          </TabsTrigger>
          <TabsTrigger value="transmutation" className="flex items-center gap-1">
            <Flame className="h-4 w-4" />
            <span className="hidden sm:inline">Transmutation</span>
          </TabsTrigger>
          <TabsTrigger value="realization" className="flex items-center gap-1">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Realization</span>
          </TabsTrigger>
        </TabsList>

        {/* Model-Specific Options */}
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h4 className="font-medium">{
                activeTab === "linear" ? "Linear Progression Options" :
                activeTab === "undulating" ? "Undulating Progression Options" :
                activeTab === "accumulation" ? "Accumulation Phase Options" :
                activeTab === "transmutation" ? "Transmutation Phase Options" :
                "Realization Phase Options"
              }</h4>

              {activeTab === "linear" && (
                <div>
                  <Label htmlFor="progressionRate" className="text-sm">
                    Weekly Progression Rate ({Math.round(progressionRate * 100)}%)
                  </Label>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-4 h-4 rounded-sm" style={{
                      background: "linear-gradient(to bottom, hsla(15, 80%, 50%, 1) 49%, hsla(240, 75%, 50%, 1) 51%)"
                    }}></div>
                    <Slider
                      id="progressionRate"
                      key="progression-rate-slider"
                      value={[progressionRate * 100]}
                      min={1}
                      max={20}
                      step={1}
                      className="flex-1"
                      onValueChange={(value) => setProgressionRate(value[0] / 100)}
                      variant="default"
                    />
                  </div>
                </div>
              )}

              {activeTab === "undulating" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amplitude" className="text-sm">
                      Wave Amplitude ({amplitude.toFixed(1)})
                    </Label>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-4 h-4 rounded-sm" style={{
                        background: "linear-gradient(to bottom, hsla(15, 80%, 50%, 1) 49%, hsla(240, 75%, 50%, 1) 51%)"
                      }}></div>
                      <Slider
                        id="amplitude"
                        key="amplitude-slider"
                        value={[amplitude * 10]}
                        min={5}
                        max={20}
                        step={1}
                        className="flex-1"
                        onValueChange={(value) => setAmplitude(value[0] / 10)}
                        variant="default"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="period" className="text-sm">
                      Wave Period (every {period} weeks)
                    </Label>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-4 h-4 rounded-sm" style={{
                        background: "linear-gradient(to bottom, hsla(15, 80%, 50%, 1) 49%, hsla(240, 75%, 50%, 1) 51%)"
                      }}></div>
                      <Slider
                        id="period"
                        key="period-slider"
                        value={[period]}
                        min={2}
                        max={6}
                        step={1}
                        className="flex-1"
                        onValueChange={(value) => setPeriod(value[0])}
                        variant="default"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "accumulation" && (
                <div>
                  <Label htmlFor="intensityDelta" className="text-sm">
                    Intensity Delta (maximum +{intensityDelta} points)
                  </Label>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-4 h-4 rounded-sm" style={sliderStyles.intensity}></div>
                    <Slider
                      id="intensityDelta"
                      value={[intensityDelta]}
                      min={1}
                      max={5}
                      step={1}
                      className="flex-1"
                      onValueChange={(value) => setIntensityDelta(value[0])}
                      variant="intensity"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Intensity increases gradually while volume maximizes
                  </p>
                </div>
              )}

              {activeTab === "transmutation" && (
                <div>
                  <Label htmlFor="volumeDelta" className="text-sm">
                    Volume Delta (maximum +{volumeDelta} points)
                  </Label>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-4 h-4 rounded-sm" style={sliderStyles.volume}></div>
                    <Slider
                      id="volumeDelta"
                      value={[volumeDelta]}
                      min={1}
                      max={5}
                      step={1}
                      className="flex-1"
                      onValueChange={(value) => setVolumeDelta(value[0])}
                      variant="volume"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Volume increases moderately while intensity maximizes
                  </p>
                </div>
              )}

              {activeTab === "realization" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="targetVolume" className="text-sm">
                      Target Taper Volume ({targetVolume})
                    </Label>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-4 h-4 rounded-sm" style={sliderStyles.volume}></div>
                      <Slider
                        id="targetVolume"
                        value={[targetVolume]}
                        min={1}
                        max={7}
                        step={1}
                        className="flex-1"
                        onValueChange={(value) => setTargetVolume(value[0])}
                        variant="volume"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="taperStart" className="text-sm">
                      Taper Start (week {taperStart})
                    </Label>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-4 h-4 rounded-sm" style={{
                        background: "linear-gradient(to bottom, hsla(15, 80%, 50%, 1) 49%, hsla(240, 75%, 50%, 1) 51%)"
                      }}></div>
                      <Slider
                        id="taperStart"
                        key="taper-start-slider"
                        value={[taperStart]}
                        min={Math.ceil(duration / 3)}
                        max={Math.max(duration - 1, Math.ceil(duration / 3) + 1)}
                        step={1}
                        className="flex-1"
                        onValueChange={(value) => setTaperStart(value[0])}
                        variant="default"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Deload Options */}
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="includeDeload" 
              checked={includeDeload}
              onChange={(e) => setIncludeDeload(e.target.checked)}
                    className="rounded text-primary h-4 w-4" 
            />
                  <Label htmlFor="includeDeload" className="cursor-pointer">
                    Include Deload Weeks
                  </Label>
          </div>
          {includeDeload && (
                  <span className="text-xs text-gray-500">
                    {getDeloadPercentage()} reduction
                  </span>
                )}
              </div>

              {includeDeload && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="deloadFrequency" className="text-sm">
                      Frequency (every X weeks)
                    </Label>
                    <select
                      id="deloadFrequency"
              value={deloadFrequency} 
                      onChange={(e) => setDeloadFrequency(e.target.value)}
                      className="w-full p-2 mt-1 border rounded-md"
                    >
                      <option value="2">2 weeks</option>
                      <option value="3">3 weeks</option>
                      <option value="4">4 weeks</option>
                      <option value="6">6 weeks</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="deloadFactor" className="text-sm">
                      Deload to {Math.round(deloadFactor * 100)}%
                    </Label>
                    <div className="flex items-center gap-2 mt-3">
                      <div className="w-4 h-4 rounded-sm" style={{
                        background: "linear-gradient(to bottom, hsla(15, 80%, 50%, 1) 49%, hsla(240, 75%, 50%, 1) 51%)"
                      }}></div>
                      <Slider 
                        id="deloadFactor"
                        key="deload-factor-slider"
                        value={[deloadFactor * 100]} 
                        min={40}
                        max={70}
                        step={5}
                        className="flex-1"
                        onValueChange={(value) => setDeloadFactor(value[0] / 100)}
                        variant="default"
                      />
                    </div>
                  </div>
                </div>
          )}
        </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button 
            onClick={() => handleApplyTemplate(activeTab)}
            className="bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
          >
            Apply {
              activeTab === "linear" ? "Linear" :
              activeTab === "undulating" ? "Undulating" :
              activeTab === "accumulation" ? "Accumulation" :
              activeTab === "transmutation" ? "Transmutation" :
              "Realization"
            } Model
                </Button>
              </div>
      </Tabs>
    </div>
  );
}

export default ProgressionTemplates;

