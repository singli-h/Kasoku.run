import { z } from "zod";

/**
 * Validation schemas for Preset Group Editor
 * 
 * These schemas ensure data integrity before submitting to the API
 * and provide clear error messages for invalid input.
 */

// Base preset group schema for creation
export const createPresetGroupSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less")
    .trim(),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional()
    .or(z.literal("")),
  date: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => {
      if (!val || val === "") return true;
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, "Invalid date format"),
  sessionMode: z
    .enum(["individual", "group"], {
      errorMap: () => ({ message: "Session mode must be either 'individual' or 'group'" })
    })
    .default("individual"),
  athleteGroupId: z
    .string()
    .optional()
    .or(z.literal(""))
    .or(z.number().transform(String))
});

// Schema for updating preset groups (same as create but with optional name)
export const updatePresetGroupSchema = createPresetGroupSchema.extend({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less")
    .trim()
    .optional()
});

// Schema for preset details within a preset
export const presetDetailSchema = z.object({
  set_number: z.number().int().min(1, "Set number must be at least 1").optional(),
  setNumber: z.number().int().min(1, "Set number must be at least 1").optional(),
  reps: z.number().int().min(0, "Reps must be 0 or greater").optional(),
  weight: z.number().min(0, "Weight must be 0 or greater").optional(),
  resistance: z.number().min(0, "Resistance must be 0 or greater").optional(),
  resistance_unit_id: z.string().optional(),
  resistanceUnitId: z.string().optional(),
  distance: z.number().min(0, "Distance must be 0 or greater").optional(),
  height: z.number().min(0, "Height must be 0 or greater").optional(),
  tempo: z.string().max(20, "Tempo must be 20 characters or less").optional(),
  rest_time: z.number().min(0, "Rest time must be 0 or greater").optional(),
  power: z.number().min(0, "Power must be 0 or greater").optional(),
  velocity: z.number().min(0, "Velocity must be 0 or greater").optional(),
  effort: z.number().min(0, "Effort must be 0 or greater").max(10, "Effort must be 10 or less").optional(),
  performing_time: z.number().min(0, "Performing time must be 0 or greater").optional(),
  metadata: z.record(z.any()).optional()
});

// Schema for individual presets within a preset group
export const presetSchema = z.object({
  exercise_id: z.string().min(1, "Exercise ID is required").optional(),
  exerciseId: z.string().min(1, "Exercise ID is required").optional(),
  superset_id: z.string().optional(),
  supersetId: z.string().optional(),
  preset_order: z.number().int().min(0, "Preset order must be 0 or greater").optional(),
  notes: z.string().max(1000, "Notes must be 1000 characters or less").optional(),
  presetDetails: z.array(presetDetailSchema).optional()
}).refine((data) => {
  // Ensure at least one exercise ID field is provided
  return data.exercise_id || data.exerciseId;
}, {
  message: "Exercise ID is required",
  path: ["exercise_id"]
});

// Complete schema for updating preset groups with presets
export const updatePresetGroupWithPresetsSchema = updatePresetGroupSchema.extend({
  presets: z.array(presetSchema).optional().default([])
});

// Schema for form data used in the UI
export const presetGroupFormSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less")
    .trim(),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional()
    .default(""),
  date: z
    .string()
    .optional()
    .default("")
    .refine((val) => {
      if (!val || val === "") return true;
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, "Invalid date format"),
  sessionMode: z
    .enum(["individual", "group"], {
      errorMap: () => ({ message: "Session mode must be either 'individual' or 'group'" })
    })
    .default("individual"),
  athleteGroupId: z
    .string()
    .optional()
    .default("")
});

// Type exports for TypeScript
export type CreatePresetGroupData = z.infer<typeof createPresetGroupSchema>;
export type UpdatePresetGroupData = z.infer<typeof updatePresetGroupSchema>;
export type PresetDetailData = z.infer<typeof presetDetailSchema>;
export type PresetData = z.infer<typeof presetSchema>;
export type UpdatePresetGroupWithPresetsData = z.infer<typeof updatePresetGroupWithPresetsSchema>;
export type PresetGroupFormData = z.infer<typeof presetGroupFormSchema>;

/**
 * Validation helper functions
 */

// Validate preset group creation data
export function validateCreatePresetGroup(data: unknown): { success: true; data: CreatePresetGroupData } | { success: false; errors: Record<string, string> } {
  const result = createPresetGroupSchema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: Record<string, string> = {};
  result.error.errors.forEach((error) => {
    const path = error.path.join('.');
    errors[path] = error.message;
  });
  
  return { success: false, errors };
}

// Validate preset group update data
export function validateUpdatePresetGroup(data: unknown): { success: true; data: UpdatePresetGroupData } | { success: false; errors: Record<string, string> } {
  const result = updatePresetGroupSchema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: Record<string, string> = {};
  result.error.errors.forEach((error) => {
    const path = error.path.join('.');
    errors[path] = error.message;
  });
  
  return { success: false, errors };
}

// Validate preset group form data
export function validatePresetGroupForm(data: unknown): { success: true; data: PresetGroupFormData } | { success: false; errors: Record<string, string> } {
  const result = presetGroupFormSchema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: Record<string, string> = {};
  result.error.errors.forEach((error) => {
    const path = error.path.join('.');
    errors[path] = error.message;
  });
  
  return { success: false, errors };
}

// Validate complete preset group with presets data
export function validateUpdatePresetGroupWithPresets(data: unknown): { success: true; data: UpdatePresetGroupWithPresetsData } | { success: false; errors: Record<string, string> } {
  const result = updatePresetGroupWithPresetsSchema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: Record<string, string> = {};
  result.error.errors.forEach((error) => {
    const path = error.path.join('.');
    errors[path] = error.message;
  });
  
  return { success: false, errors };
} 