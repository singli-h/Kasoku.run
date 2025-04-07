# Edge Functions

This directory contains Supabase Edge Functions for the Running Website.

## Functions

- `dashboardExercises`: Edge function for handling dashboard exercises data
- `exercises`: Edge function for handling exercises data

## Development

To run the edge functions locally:

```bash
supabase functions serve
```

To deploy edge functions:

```bash
# Deploy all functions
supabase functions deploy

# Deploy a specific function
supabase functions deploy exercises --project-ref YOUR_PROJECT_REF
```

## Environment Variables

Environment variables for edge functions should be configured in the Supabase dashboard. 