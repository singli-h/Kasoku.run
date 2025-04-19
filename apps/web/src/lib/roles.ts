import { createServerSupabaseClient } from "@/lib/supabase";

/**
 * Fetches user role data and specific role IDs (athlete or coach) from the database.
 */
export async function getUserRoleData(clerkId: string) {
  const supabase = createServerSupabaseClient();
  // Fetch the user record and role from metadata
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, metadata->>role as role")
    .eq("clerk_id", clerkId)
    .single<{ id: number; role: string }>();

  if (userError || !user) {
    throw new Error("User not found");
  }

  const { id: userId, role } = user;

  // For athlete, fetch athlete ID and group ID
  if (role === "athlete") {
    const { data: athlete, error: athleteError } = await supabase
      .from("athletes")
      .select("id, athlete_group_id")
      .eq("user_id", userId)
      .single<{ id: number; athlete_group_id: number }>();
    if (athleteError || !athlete) {
      throw new Error("Athlete record not found");
    }
    return { userId, role, athleteId: athlete.id, athleteGroupId: athlete.athlete_group_id };
  }

  // For coach, fetch coach ID
  if (role === "coach") {
    const { data: coach, error: coachError } = await supabase
      .from("coaches")
      .select("id")
      .eq("user_id", userId)
      .single<{ id: number }>();
    if (coachError || !coach) {
      throw new Error("Coach record not found");
    }
    return { userId, role, coachId: coach.id };
  }

  // Default return for other roles
  return { userId, role };
} 