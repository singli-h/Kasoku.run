import { serve } from "https://deno.land/std@0.188.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

Deno.serve(async (req) => {
  // Supabase client
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // User authentication
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.api.getUserByCookie(req);

  if (userError) {
    return new Response(JSON.stringify({ error: userError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Fetch all exercises
    const { data: exercises, error: exercisesError } = await supabase
      .from("Exercise")
      .select("*");

    // Fetch all preset groups
    const { data: presetGroups, error: presetGroupsError } = await supabase
      .from("ExercisePresetGroup")
      .select("*");

    // Fetch all training sessions for the user
    const { data: trainingSessions, error: trainingSessionsError } =
      await supabase
        .from("TrainingSessions")
        .select("*")
        .eq("AthleteId", user.id);

    // Calculate the start and end of the current week
    const today = new Date();
    const startOfWeek = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - today.getDay()
    );
    const endOfWeek = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - today.getDay() + 6
    );

    // Fetch current week's presets
    const { data: currentWeekPresets, error: currentWeekPresetsError } =
      await supabase
        .from("ExercisePresetGroup")
        .select("*")
        .gte("Date", startOfWeek.toISOString().split("T")[0])
        .lte("Date", endOfWeek.toISOString().split("T")[0]);

    // Fetch current week's training sessions for the user
    const { data: currentWeekSessions, error: currentWeekSessionsError } =
      await supabase
        .from("TrainingSessions")
        .select("*")
        .eq("AthleteId", user.id)
        .gte("DateTime", startOfWeek.toISOString())
        .lte("DateTime", endOfWeek.toISOString());

    // Fetch today's session or preset
    let todaysSessionOrPreset;
    const todaySession = currentWeekSessions.find((session) => {
      const sessionDate = new Date(session.DateTime);
      return (
        sessionDate.getDate() === today.getDate() &&
        sessionDate.getMonth() === today.getMonth() &&
        sessionDate.getFullYear() === today.getFullYear()
      );
    });

    if (todaySession) {
      // Fetch training exercises for today's session
      const { data: sessionExercises, error: sessionExercisesError } =
        await supabase
          .from("TrainingExercise")
          .select("*")
          .eq("TrainingSessionId", todaySession.id);

      if (sessionExercisesError) {
        throw new Error("Error fetching session exercises");
      }

      todaysSessionOrPreset = {
        type: "session",
        data: {
          ...todaySession,
          exercises: sessionExercises,
        },
      };
    } else {
      // Fetch presets for today
      const todayPreset = currentWeekPresets.find((preset) => {
        const presetDate = new Date(preset.Date);
        return (
          presetDate.getDate() === today.getDate() &&
          presetDate.getMonth() === today.getMonth() &&
          presetDate.getFullYear() === today.getFullYear()
        );
      });

      if (todayPreset) {
        // Fetch exercise presets for today's preset group
        const { data: presetExercises, error: presetExercisesError } =
          await supabase
            .from("ExercisePreset")
            .select("*")
            .eq("ExercisePresetGroupId", todayPreset.id);

        if (presetExercisesError) {
          throw new Error("Error fetching preset exercises");
        }

        todaysSessionOrPreset = {
          type: "preset",
          data: {
            ...todayPreset,
            exercises: presetExercises,
          },
        };
      }
    }

    // Check for errors
    if (
      exercisesError ||
      presetGroupsError ||
      trainingSessionsError ||
      currentWeekPresetsError ||
      currentWeekSessionsError
    ) {
      throw new Error("Error fetching data from Supabase");
    }

    // Construct the response
    const response = {
      exercises,
      presetGroups,
      trainingSessions,
      currentWeekPresets,
      currentWeekSessions,
      todaysSessionOrPreset,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
