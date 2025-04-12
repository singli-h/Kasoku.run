// CORS headers for all responses
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

// Standard error handler
export const handleError = (error: any) => {
  console.error(error);
  return new Response(
    JSON.stringify({ 
      status: "error",
      error: error.message || "An unexpected error occurred" 
    }),
    {
      status: error.status || 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}; 