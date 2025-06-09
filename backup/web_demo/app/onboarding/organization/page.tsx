"use server"

import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { OrganizationWizard } from '@/components/features/organization/components/organization-wizard'

export default async function OrganizationOnboardingPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/login')
  }

  const supabase = createServerSupabaseClient()
  
  // Check if user already has an organization
  const { data: user, error: userError } = await supabase
    .from('users')
    .select(`
      id,
      memberships (
        id,
        organization_id,
        organizations (
          id,
          name
        )
      )
    `)
    .eq('clerk_id', userId)
    .single()

  if (userError) {
    console.error('Error fetching user:', userError)
    // Continue to wizard if there's an error - let the wizard handle it
  }

  // If user already has an organization, redirect to dashboard
  if (user?.memberships && user.memberships.length > 0) {
    redirect('/dashboard')
  }

  return <OrganizationWizard />
}