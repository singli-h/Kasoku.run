// apps/web/src/lib/localStorageManager.ts

import type { MesoWizardFormData } from '@/components/mesoWizard/hooks/useMesoWizardState';

// Placeholder for MesoWizardFormData if not importing directly
// interface MesoWizardFormData {  // REMOVED THIS LOCAL DEFINITION
//   name: string;
//   description: string;
//   weeks: number;
//   startDate: string;
//   // Add other fields from the actual MesoWizardFormData
//   sessions: any[]; // Replace any with actual session type
//   sessionDays: Record<string, string | null>;
//   sessionSections: Record<string, any>; // Replace any
//   exercises: any[]; // Replace any
//   exerciseOrder: Record<string, string[]>;
//   progressionModel?: string;
//   progressionValue?: number | string;
//   planType?: string;
// }

export interface CachedWizardData {
  version: string;
  currentStep: number;
  formData: MesoWizardFormData;
  activeSessionId: string | null;
  feedbackText: string;
}

const CACHE_KEY_PREFIX = "mesoWizardState";
const CACHE_VERSION = "1.0.0"; // Or align with the next version needed, e.g., "v6.0.0"

function getFullCacheKey(): string {
  return `${CACHE_KEY_PREFIX}_${CACHE_VERSION}`;
}

export function saveWizardProgress(data: Omit<CachedWizardData, 'version'>): void {
  if (typeof window === 'undefined') return;
  try {
    const fullKey = getFullCacheKey();
    const dataToSave: CachedWizardData = { ...data, version: CACHE_VERSION };
    localStorage.setItem(fullKey, JSON.stringify(dataToSave));
  } catch (error) {
    console.error("Error saving wizard progress to localStorage:", error);
  }
}

export function loadWizardProgress(): CachedWizardData | null {
  if (typeof window === 'undefined') return null;
  const fullKey = getFullCacheKey();
  try {
    const serializedData = localStorage.getItem(fullKey);
    if (serializedData === null) {
      return null;
    }
    const parsedData: CachedWizardData = JSON.parse(serializedData);

    if (parsedData.version !== CACHE_VERSION) {
      console.warn(`Cache version mismatch. Expected ${CACHE_VERSION}, found ${parsedData.version}. Discarding old cache.`);
      localStorage.removeItem(fullKey);
      return null;
    }
    return parsedData;
  } catch (error) {
    console.error("Error loading wizard progress from localStorage or parsing failed:", error);
    localStorage.removeItem(fullKey);
    return null;
  }
}

export function clearCurrentWizardProgressCache(): void {
    if (typeof window === 'undefined') return;
    try {
        const fullKey = getFullCacheKey();
        localStorage.removeItem(fullKey);
        console.log(`Cleared cache for key: ${fullKey}`);
    } catch (error) {
        console.error("Error clearing current wizard progress cache:", error);
    }
} 