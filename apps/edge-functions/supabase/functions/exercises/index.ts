// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.188.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

interface Exercise {
  id: number;
  name: string;
  description?: string;
  video_url?: string;
  exercise_type_id?: number;
  unit_id?: number;
  
}

async function getExercise(supabaseClient: createClient, id: string) {
  const { data: exercise, error } = await supabaseClient
    .from("exercises")
    .select("*")
    .eq("Id", id); // Note: Using "Id" as per your table schema
  if (error) {
    if (error.message === "No row found") {
      return new Response(JSON.stringify({ error: "Exercise not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404, // Not Found
      });
    } else {
      throw error; // Re-throw other errors
    }
  }

  return new Response(JSON.stringify({ exercise }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function getAllExercises(supabaseClient: createClient) {
  const { data: exercises, error } = await supabaseClient
    .from("exercises")
    .select("*");
  if (error) throw error;

  return new Response(JSON.stringify({ exercises }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function deleteExercise(supabaseClient: createClient, id: string) {
  const { error } = await supabaseClient
    .from("exercises")
    .delete()
    .eq("id", id); // Note: Using "Id"
  if (error) throw error;

  return new Response(JSON.stringify({}), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function updateExercise(
  supabaseClient: createClient,
  id: string,
  exercise: Exercise,
) {
  const { error } = await supabaseClient
    .from("exercises")
    .update(exercise)
    .eq("Id", id); // Note: Using "Id"
  if (error) throw error;

  return new Response(JSON.stringify({ exercise }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function createExercise(supabaseClient: createClient, exercise: Exercise) {
  const { error } = await supabaseClient.from("exercises").insert(exercise);
  if (error) throw error;

  return new Response(JSON.stringify({ exercise }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

Deno.serve(async (req) => {
  const { url, method } = req;

  if (method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      },
    );

    const taskPattern = new URLPattern({ pathname: "/exercises/:id" });
    const matchingPath = taskPattern.exec(url);
    const id = matchingPath ? matchingPath.pathname.groups.id : null;

    let exercise = null;
    if (method === "POST" || method === "PUT") {
      const body = await req.json();
      exercise = body.exercise;
    }

    if (id && method === "GET") {
      return getExercise(supabaseClient, id as string);
    } else if (id && method === "PUT") {
      return updateExercise(supabaseClient, id as string, exercise);
    } else if (id && method === "DELETE") {
      return deleteExercise(supabaseClient, id as string);
    } else if (method === "POST") {
      return createExercise(supabaseClient, exercise);
    } else if (method === "GET") {
      return getAllExercises(supabaseClient);
    } else {
      return new Response("Method not allowed", { status: 405 });
    }
  } catch (error) {
    console.error(error);

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});