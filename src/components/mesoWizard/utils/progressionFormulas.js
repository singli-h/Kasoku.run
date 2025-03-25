// Helper: Clamp a value between min and max.
function clamp(value, min = 1, max = 10) {
  return Math.max(min, Math.min(max, value));
}

// Helper: Compute effective week and maximum effective weeks when accounting for deloads.
function getEffectiveWeek(week, totalWeeks, deloadFrequency) {
  if (!deloadFrequency) {
    return { effectiveWeek: week, maxEffectiveWeeks: totalWeeks };
  }
  // Count how many deload weeks have passed (every nth week is a deload).
  const deloadsSoFar = Math.floor((week - 1) / deloadFrequency);
  const effectiveWeek = week - deloadsSoFar;
  // Estimate the total effective weeks in the macrocycle.
  const totalDeloads = Math.floor((totalWeeks - 1) / deloadFrequency);
  const maxEffectiveWeeks = totalWeeks - totalDeloads;
  return { effectiveWeek, maxEffectiveWeeks };
}

/* 
  1. Linear Progression
  The load increases linearly from the base value to 10 (the maximum defined for the macrocycle).
  The effective progress fraction is calculated from week 1 (fraction = 0) to the final effective week (fraction = 1).
*/
function linearProgression(baseIntensity, baseVolume, week, macrocycleLength, deloadFrequency, deloadFactor = 0.8, progressionRate = 0.05) {
  const { effectiveWeek } = getEffectiveWeek(week, macrocycleLength, deloadFrequency);
  
  // Use the progression rate to calculate a more dynamic progression
  // Instead of a linear fraction, use an exponential growth formula
  let intensity = baseIntensity * Math.pow(1 + progressionRate, effectiveWeek - 1);
  let volume = baseVolume * Math.pow(1 + progressionRate, effectiveWeek - 1);
  
  // Apply deload reduction if this week is a scheduled deload.
  if (deloadFrequency && week % deloadFrequency === 0) {
    intensity *= deloadFactor;
    volume *= deloadFactor;
  }
  
  return {
    intensity: clamp(intensity, 1, 10),
    volume: clamp(volume, 1, 10)
  };
}

/* 
  2. Undulating Progression
  Combines a linear trend (progressing from the base to 10 over the macrocycle) with an oscillatory component.
  The oscillation is added on top of the trend so that, for example, one week might be slightly higher or lower.
*/
function undulatingProgression(baseIntensity, baseVolume, week, macrocycleLength, amplitude = 1, period = 3, deloadFrequency, deloadFactor = 0.8) {
  const { effectiveWeek, maxEffectiveWeeks } = getEffectiveWeek(week, macrocycleLength, deloadFrequency);
  const progressFraction = (maxEffectiveWeeks > 1) ? (effectiveWeek - 1) / (maxEffectiveWeeks - 1) : 0;
  
  // Linear trend from base to 10 plus an oscillatory sine/cosine wave.
  let intensity = baseIntensity + (10 - baseIntensity) * progressFraction + amplitude * Math.sin(2 * Math.PI * (week - 1) / period);
  let volume = baseVolume + (10 - baseVolume) * progressFraction + amplitude * Math.cos(2 * Math.PI * (week - 1) / period);
  
  if (deloadFrequency && week % deloadFrequency === 0) {
    intensity *= deloadFactor;
    volume *= deloadFactor;
  }
  
  return {
    intensity: clamp(intensity, 1, 10),
    volume: clamp(volume, 1, 10)
  };
}

/* 
  3. Accumulation Phase
  Focuses on high volume with only a modest increase in intensity.
  - Intensity increases slowly using a square-root progression (i.e. √progressFraction) to limit early gains.
  - Volume ramps linearly to the upper bound (10 on the scale).
*/
function accumulationPhase(baseIntensity, baseVolume, week, macrocycleLength, intensityDelta = 2, deloadFrequency, deloadFactor = 0.8) {
  const { effectiveWeek, maxEffectiveWeeks } = getEffectiveWeek(week, macrocycleLength, deloadFrequency);
  const progressFraction = (maxEffectiveWeeks > 1) ? (effectiveWeek - 1) / (maxEffectiveWeeks - 1) : 0;
  
  // Use a square-root curve for intensity progression for a more gradual early increase.
  let intensity = baseIntensity + intensityDelta * Math.sqrt(progressFraction);
  // Volume increases linearly toward the maximum (10) on this scale.
  let volume = baseVolume + (10 - baseVolume) * progressFraction;
  
  if (deloadFrequency && week % deloadFrequency === 0) {
    intensity *= deloadFactor;
    volume *= deloadFactor;
  }
  
  return {
    intensity: clamp(intensity, 1, 10),
    volume: clamp(volume, 1, 10)
  };
}

/* 
  4. Transmutation Phase
  Emphasizes high intensity while limiting changes in volume.
  - Intensity increases sharply toward 10 using a power progression (progressFraction^1.5).
  - Volume changes only slightly (by volumeDelta, which can be positive or negative) using the same progression.
*/
function transmutationPhase(baseIntensity, baseVolume, week, macrocycleLength, volumeDelta = 2, deloadFrequency, deloadFactor = 0.8) {
  const { effectiveWeek, maxEffectiveWeeks } = getEffectiveWeek(week, macrocycleLength, deloadFrequency);
  const progressFraction = (maxEffectiveWeeks > 1) ? (effectiveWeek - 1) / (maxEffectiveWeeks - 1) : 0;
  
  // Use a 1.5 exponent to drive intensity up more steeply toward 10 in the later weeks.
  let intensity = baseIntensity + (10 - baseIntensity) * Math.pow(progressFraction, 1.5);
  // Volume shifts only slightly. If volumeDelta is positive, volume increases modestly; if negative, volume decreases.
  let volume = baseVolume + volumeDelta * Math.pow(progressFraction, 1.5);
  
  if (deloadFrequency && week % deloadFrequency === 0) {
    intensity *= deloadFactor;
    volume *= deloadFactor;
  }
  
  return {
    intensity: clamp(intensity, 1, 10),
    volume: clamp(volume, 1, 10)
  };
}

/* 
  5. Realization (Peaking/Tapering) Phase
  The goal is to peak for competition by having maximum intensity (reaching 10) 
  while significantly reducing volume (tapering toward a target value).
  The targetVolume parameter (default 3) sets the desired volume level at peak.
*/
function realizationPhase(baseIntensity, baseVolume, week, macrocycleLength, targetVolume = 3, deloadFrequency, deloadFactor = 0.8) {
  const { effectiveWeek, maxEffectiveWeeks } = getEffectiveWeek(week, macrocycleLength, deloadFrequency);
  const progressFraction = (maxEffectiveWeeks > 1) ? (effectiveWeek - 1) / (maxEffectiveWeeks - 1) : 0;
  
  let intensity = baseIntensity + (10 - baseIntensity) * progressFraction; // Progress to maximum intensity.
  let volume = baseVolume + (targetVolume - baseVolume) * progressFraction;  // Taper volume toward targetVolume.
  
  if (deloadFrequency && week % deloadFrequency === 0) {
    intensity *= deloadFactor;
    volume *= deloadFactor;
  }
  
  return {
    intensity: clamp(intensity, 1, 10),
    volume: clamp(volume, 1, 10)
  };
}

// Generate a complete progression template for a given model
function generateProgressionTemplate(modelType, duration, baseIntensity, baseVolume, options = {}) {
  const {
    deloadFrequency = null,
    deloadFactor = 0.8,
    amplitude = 1,
    period = 3,
    intensityDelta = 2,
    volumeDelta = 2,
    targetVolume = 3,
    progressionRate = 0.05
  } = options;
  
  const template = [];
  for (let week = 1; week <= duration; week++) {
    let values;
    
    switch (modelType) {
      case 'linear':
        values = linearProgression(baseIntensity, baseVolume, week, duration, deloadFrequency, deloadFactor, progressionRate);
        break;
      case 'undulating':
        values = undulatingProgression(baseIntensity, baseVolume, week, duration, amplitude, period, deloadFrequency, deloadFactor);
        break;
      case 'accumulation':
        values = accumulationPhase(baseIntensity, baseVolume, week, duration, intensityDelta, deloadFrequency, deloadFactor);
        break;
      case 'transmutation':
        values = transmutationPhase(baseIntensity, baseVolume, week, duration, volumeDelta, deloadFrequency, deloadFactor);
        break;
      case 'realization':
        values = realizationPhase(baseIntensity, baseVolume, week, duration, targetVolume, deloadFrequency, deloadFactor);
        break;
      default:
        values = linearProgression(baseIntensity, baseVolume, week, duration, deloadFrequency, deloadFactor, progressionRate);
    }
    
    template.push({
      week,
      intensity: Math.round(values.intensity),
      volume: Math.round(values.volume)
    });
  }
  
  return template;
}

export {
  clamp,
  getEffectiveWeek,
  linearProgression,
  undulatingProgression,
  accumulationPhase,
  transmutationPhase,
  realizationPhase,
  generateProgressionTemplate
}; 