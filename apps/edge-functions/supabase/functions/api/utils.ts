// CORS headers for all responses
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

// Enhanced error handler with context and status code
export const handleError = (error: any, context?: string) => {
  // Log error with context if provided
  console.error(context ? `[${context}] Error:` : 'Error:', error);

  // Determine appropriate status code
  let status = error.status || 400;
  if (error.code === 'PGRST116') status = 404; // Not found
  if (error.code === 'PGRST201') status = 403; // Forbidden
  if (error.code === '42501') status = 401;    // Unauthorized
  if (error.message?.includes('not found')) status = 404;
  if (error.message?.includes('permission denied')) status = 403;
  if (error.message?.includes('unauthorized')) status = 401;

  return new Response(
    JSON.stringify({ 
      status: "error",
      error: error.message || "An unexpected error occurred",
      context: context || 'server',
      timestamp: new Date().toISOString()
    }),
    {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}; 