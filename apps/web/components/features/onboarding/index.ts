/*
<ai_context>
Index file for onboarding feature components.
Exports all onboarding-related components for clean imports.
</ai_context>
*/

export { default as LegacyOnboardingForm } from "./legacy-onboarding-form"
export { default as OnboardingFormSkeleton } from "./onboarding-form-skeleton"
export { default as LegacyEnhancedOnboardingWizard } from "./legacy-enhanced-onboarding-wizard"
export { default as OnboardingWizard } from "./onboarding-wizard"

// Export the new wizard as the default onboarding component
export { default as OnboardingForm } from "./onboarding-wizard" 