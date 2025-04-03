"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Waves, TrendingUp, AreaChart, Flame, Target } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { generateProgressionTemplate } from "../utils/progressionFormulas"

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
const sliderStyles = {
  intensity: {
    background: "linear-gradient(to right, hsla(25, 70%, 62%, 0.7), hsla(0, 90%, 40%, 0.9))"
  },
  volume: {
    background: "linear-gradient(to right, hsla(210, 65%, 65%, 0.7), hsla(270, 85%, 40%, 0.9))"
  },
  default: {
    background: `
    linear-gradient(to right, hsl(0, 8%, 100%, 0.4), hsla(0, 90%, 90%, 0)),
    linear-gradient(to bottom, hsla(13, 80%, 50%, 0.8) 49%, hsla(240, 75%, 55%, 0.8) 51%)
  `,
  backgroundBlendMode: 'lighten'
  }
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
      progressionRate,
      taperStart
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
    <div className="space-y-6 max-w-full">
      {/* Apply the hideScrollbarCSS */}
      <style dangerouslySetInnerHTML={{ __html: hideScrollbarCSS }} />

      <p className="text-sm text-gray-600 px-1">
        Apply evidence-based progression patterns with precise mathematical models for optimal training adaptation
      </p>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Improved tabs with better visual indication and responsive layout */}
        <div className="mb-5 overflow-x-auto pb-3 pt-1 -mx-1 px-1 hide-scrollbar">
          <TabsList className="flex w-max md:w-full space-x-1 p-1 md:grid md:grid-cols-5 lg:gap-1">
            <TabsTrigger 
              value="linear" 
              className={`flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2.5 min-h-11 transition-all duration-200 rounded-md border ${
                activeTab === "linear" 
                ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm" 
                : "border-transparent hover:bg-gray-50"
              }`}
            >
              <TrendingUp className={`h-4 w-4 ${activeTab === "linear" ? "text-blue-600" : "text-gray-500"}`} />
              <span className={activeTab === "linear" ? "font-medium text-blue-700" : "text-gray-700"}>Linear</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="undulating" 
              className={`flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2.5 min-h-11 transition-all duration-200 rounded-md border ${
                activeTab === "undulating" 
                ? "bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200 shadow-sm" 
                : "border-transparent hover:bg-gray-50"
              }`}
            >
              <Waves className={`h-4 w-4 ${activeTab === "undulating" ? "text-cyan-600" : "text-gray-500"}`} />
              <span className={activeTab === "undulating" ? "font-medium text-cyan-700" : "text-gray-700"}>Undulating</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="accumulation" 
              className={`flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2.5 min-h-11 transition-all duration-200 rounded-md border ${
                activeTab === "accumulation" 
                ? "bg-gradient-to-r from-teal-50 to-emerald-50 border-teal-200 shadow-sm" 
                : "border-transparent hover:bg-gray-50"
              }`}
            >
              <AreaChart className={`h-4 w-4 ${activeTab === "accumulation" ? "text-teal-600" : "text-gray-500"}`} />
              <span className={activeTab === "accumulation" ? "font-medium text-teal-700" : "text-gray-700"}>Accumulation</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="transmutation" 
              className={`flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2.5 min-h-11 transition-all duration-200 rounded-md border ${
                activeTab === "transmutation" 
                ? "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 shadow-sm" 
                : "border-transparent hover:bg-gray-50"
              }`}
            >
              <Flame className={`h-4 w-4 ${activeTab === "transmutation" ? "text-orange-600" : "text-gray-500"}`} />
              <span className={activeTab === "transmutation" ? "font-medium text-orange-700" : "text-gray-700"}>Transmutation</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="realization" 
              className={`flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2.5 min-h-11 transition-all duration-200 rounded-md border ${
                activeTab === "realization" 
                ? "bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 shadow-sm" 
                : "border-transparent hover:bg-gray-50"
              }`}
            >
              <Target className={`h-4 w-4 ${activeTab === "realization" ? "text-purple-600" : "text-gray-500"}`} />
              <span className={activeTab === "realization" ? "font-medium text-purple-700" : "text-gray-700"}>Realization</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Add a visual indicator for the selected model */}
        <div className="mb-4 px-1">
          <div className={`text-sm rounded-md p-3 flex items-start gap-3 ${
            activeTab === "linear" ? "bg-blue-50 border border-blue-100" :
            activeTab === "undulating" ? "bg-cyan-50 border border-cyan-100" :
            activeTab === "accumulation" ? "bg-teal-50 border border-teal-100" :
            activeTab === "transmutation" ? "bg-amber-50 border border-amber-100" :
            "bg-purple-50 border border-purple-100"
          }`}>
            <div className={`mt-0.5 ${
              activeTab === "linear" ? "text-blue-600" :
              activeTab === "undulating" ? "text-cyan-600" :
              activeTab === "accumulation" ? "text-teal-600" :
              activeTab === "transmutation" ? "text-orange-600" :
              "text-purple-600"
            }`}>
              {activeTab === "linear" ? <TrendingUp className="h-5 w-5" /> :
               activeTab === "undulating" ? <Waves className="h-5 w-5" /> :
               activeTab === "accumulation" ? <AreaChart className="h-5 w-5" /> :
               activeTab === "transmutation" ? <Flame className="h-5 w-5" /> :
               <Target className="h-5 w-5" />
              }
            </div>
            <div>
              <p className={`font-medium ${
                activeTab === "linear" ? "text-blue-800" :
                activeTab === "undulating" ? "text-cyan-800" :
                activeTab === "accumulation" ? "text-teal-800" :
                activeTab === "transmutation" ? "text-orange-800" :
                "text-purple-800"
              }`}>
                {activeTab === "linear" ? "Linear Progression" :
                 activeTab === "undulating" ? "Undulating Progression" :
                 activeTab === "accumulation" ? "Accumulation Phase" :
                 activeTab === "transmutation" ? "Transmutation Phase" :
                 "Realization Phase"}
              </p>
              <p className="text-gray-600 text-sm mt-1">
                {activeTab === "linear" 
                  ? "Consistent weekly increases in both intensity and volume for steady progress." 
                  : activeTab === "undulating" 
                  ? "Wave-like patterns of intensity and volume for varied stimulus and recovery."
                  : activeTab === "accumulation" 
                  ? "Focus on building volume with moderate intensity increases to establish a foundation."
                  : activeTab === "transmutation" 
                  ? "Emphasize intensity development while managing volume for strength gains."
                  : "Peak for performance by maxing intensity while reducing volume for supercompensation."
                }
              </p>
            </div>
          </div>
        </div>

        {/* Model-Specific Options */}
        <Card className="mb-4 border border-gray-200">
          <CardContent className="pt-5 px-4 sm:px-6">
            <div className="space-y-4">
              <h4 className="font-medium text-base sm:text-lg">{
                activeTab === "linear" ? "Linear Progression Options" :
                activeTab === "undulating" ? "Undulating Progression Options" :
                activeTab === "accumulation" ? "Accumulation Phase Options" :
                activeTab === "transmutation" ? "Transmutation Phase Options" :
                "Realization Phase Options"
              }</h4>

              {activeTab === "linear" && (
                <div>
                  <Label htmlFor="progressionRate" className="text-sm mb-1 block">
                    Weekly Progression Rate
                  </Label>
                  <div className="flex items-center gap-2 mt-3 touch-action-manipulation">
                    <div className="min-w-5 h-5 rounded-sm" style={sliderStyles.default}></div>
                    <div className="flex-1">
                      <Slider
                        id="progressionRate"
                        key="progression-rate-slider"
                        value={[progressionRate * 100]}
                        min={1}
                        max={20}
                        step={4}
                        className="flex-1"
                        onValueChange={(value) => setProgressionRate(value[0] / 100)}
                        variant="default"
                        style={sliderStyles.default}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "undulating" && (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-4">
                  <div>
                    <Label htmlFor="amplitude" className="text-sm mb-1 block">
                      Wave Amplitude
                    </Label>
                    <div className="flex items-center gap-2 mt-3 touch-action-manipulation">
                      <div className="min-w-5 h-5 rounded-sm" style={sliderStyles.default}></div>
                      <div className="flex-1">
                        <Slider
                          id="amplitude"
                          key="amplitude-slider"
                          value={[amplitude * 10]}
                          min={5}
                          max={20}
                          step={5}
                          className="flex-1"
                          onValueChange={(value) => setAmplitude(value[0] / 10)}
                          variant="default"
                          style={sliderStyles.default}
                        />
                      </div>
                      <span className="text-xs font-medium w-8 text-right">{amplitude.toFixed(1)}</span>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="period" className="text-sm mb-1 block">
                      Wave Period (every {period} weeks)
                    </Label>
                    <div className="flex items-center gap-2 mt-3 touch-action-manipulation">
                      <div className="min-w-5 h-5 rounded-sm" style={{
                        background: sliderStyles.default
                      }}></div>
                      <div className="flex-1">
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
                          style={sliderStyles.default}
                        />
                      </div>
                      <span className="text-xs font-medium w-8 text-right">{period}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "accumulation" && (
                <div>
                  <Label htmlFor="intensityDelta" className="text-sm mb-1 block">
                    Intensity Change
                  </Label>
                  <div className="flex items-center gap-2 mt-3 touch-action-manipulation">
                    <div className="min-w-5 h-5 rounded-sm" style={sliderStyles.intensity}></div>
                    <div className="flex-1">
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
                    <span className="text-xs font-medium w-10 text-right">+{intensityDelta}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Intensity increases gradually while volume increases significantly
                  </p>
                </div>
              )}

              {activeTab === "transmutation" && (
                <div>
                  <Label htmlFor="volumeDelta" className="text-sm mb-1 block">
                    Volume Change
                  </Label>
                  <div className="flex items-center gap-2 mt-3 touch-action-manipulation">
                    <div className="min-w-5 h-5 rounded-sm" style={sliderStyles.volume}></div>
                    <div className="flex-1">
                      <Slider
                        id="volumeDelta"
                        value={[volumeDelta]}
                        min={-5}
                        max={5}
                        step={1}
                        className="flex-1"
                        onValueChange={(value) => setVolumeDelta(value[0])}
                        variant="volume"
                      />
                    </div>
                    <span className="text-xs font-medium w-10 text-right">{volumeDelta > 0 ? `+${volumeDelta}` : volumeDelta}</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-gray-500">Volume Decreases</span>
                    <span className="text-xs text-gray-500">Volume Increases</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Intensity increases significantly while volume {volumeDelta < 0 ? "decreases" : "increases slightly"}
                  </p>
                </div>
              )}

              {activeTab === "realization" && (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-4">
                  <div>
                    <Label htmlFor="targetVolume" className="text-sm mb-1 block">
                      Final Week Volume Level
                    </Label>
                    <div className="flex items-center gap-2 mt-3 touch-action-manipulation">
                      <div className="min-w-5 h-5 rounded-sm" style={sliderStyles.volume}></div>
                      <div className="flex-1">
                        <Slider
                          id="targetVolume"
                          value={[targetVolume]}
                          min={1}
                          max={5}
                          step={1}
                          className="flex-1"
                          onValueChange={(value) => setTargetVolume(value[0])}
                          variant="volume"
                        />
                      </div>
                      <span className="text-xs font-medium w-8 text-right">{targetVolume}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Sets the exact volume level for the final week (lower values = more aggressive taper)
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="taperStart" className="text-sm mb-1 block">
                      Taper Start From Week
                    </Label>
                    <div className="flex items-center gap-2 mt-3 touch-action-manipulation">
                      <div className="min-w-5 h-5 rounded-sm" style={{
                        background: sliderStyles.default
                      }}></div>
                      <div className="flex-1">
                        <Slider
                          id="taperStart"
                          key="taper-start-slider"
                          value={[taperStart]}
                          min={1}
                          max={Math.max(duration - 1, Math.ceil(duration / 3) + 1)}
                          step={1}
                          className="flex-1"
                          onValueChange={(value) => setTaperStart(value[0])}
                          variant="default"
                          style={sliderStyles.default}
                        />
                      </div>
                      <span className="text-xs font-medium w-8 text-right">{taperStart}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Deload Options */}
        <Card className="mb-5 border border-gray-200">
          <CardContent className="pt-5 px-4 sm:px-6">
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="includeDeload" 
                    checked={includeDeload}
                    onChange={(e) => setIncludeDeload(e.target.checked)}
                    className="rounded text-primary h-5 w-5" 
                  />
                  <Label htmlFor="includeDeload" className="cursor-pointer font-medium">
                    Include Deload Weeks
                  </Label>
                </div>
                {includeDeload && (
                  <span className="text-sm text-gray-500 mt-1 sm:mt-0 bg-gray-50 px-2 py-1 rounded">
                    {getDeloadPercentage()} reduction
                  </span>
                )}
              </div>

              {includeDeload && (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-4">
                  <div>
                    <Label htmlFor="deloadFrequency" className="text-sm mb-1 block">
                      Frequency (every X weeks)
                    </Label>
                    <select
                      id="deloadFrequency"
                      value={deloadFrequency} 
                      onChange={(e) => setDeloadFrequency(e.target.value)}
                      className="w-full p-3 mt-1 border rounded-md text-base"
                    >
                      <option value="2">2 weeks</option>
                      <option value="3">3 weeks</option>
                      <option value="4">4 weeks</option>
                      <option value="6">6 weeks</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="deloadFactor" className="text-sm mb-1 block">
                      Deload Intensity
                    </Label>
                    <div className="flex items-center gap-2 mt-3 touch-action-manipulation">
                      <div className="min-w-5 h-5 rounded-sm" style={{
                        background: sliderStyles.default
                      }}></div>
                      <div className="flex-1">
                        <Slider 
                          id="deloadFactor"
                          key="deload-factor-slider"
                          value={[deloadFactor * 100]} 
                          min={30}
                          max={80}
                          step={5}
                          className="flex-1"
                          onValueChange={(value) => setDeloadFactor(value[0] / 100)}
                          variant="default"
                          style={sliderStyles.default}
                        />
                      </div>
                      <span className="text-xs font-medium w-10 text-right">{Math.round(deloadFactor * 100)}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center sm:justify-end">
          <Button 
            onClick={() => handleApplyTemplate(activeTab)}
            className={`w-full sm:w-auto px-5 py-2.5 text-base font-medium text-white transition-all duration-200 ${
              activeTab === "linear" 
                ? "bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800" 
                : activeTab === "undulating" 
                ? "bg-gradient-to-br from-cyan-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800"
                : activeTab === "accumulation" 
                ? "bg-gradient-to-br from-teal-600 to-emerald-700 hover:from-teal-700 hover:to-emerald-800"
                : activeTab === "transmutation" 
                ? "bg-gradient-to-br from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800"
                : "bg-gradient-to-br from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800"
            }`}
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

