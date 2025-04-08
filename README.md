# Running Website Monorepo

This monorepo contains both the Next.js frontend application and the Supabase Edge Functions for the Running Website project.

## Structure

```
/
├── apps/
│   ├── web/             # Next.js frontend application
│   │   ├── src/
│   │   ├── public/
│   │   ├── package.json
│   │   └── ...
│   │
│   └── edge-functions/  # Supabase Edge Functions
│       ├── supabase/
│       │   └── functions/
│       └── ...
│
├── package.json        # Root package.json for managing workspaces
├── vercel.json         # Vercel deployment configuration
└── README.md
```

## Development

### Frontend (Next.js)

```bash
# Run the development server
npm run dev:web

# Build for production
npm run build:web

# Start the production server
npm run start:web

# Run linting
npm run lint:web
```

### Edge Functions (Supabase)

```bash
# Deploy edge functions
# First, update the project reference in the root package.json
npm run deploy:edge

# Or, navigate to the edge-functions directory and deploy directly
cd apps/edge-functions
npx supabase functions deploy --project-ref YOUR_PROJECT_REF
```

## Deployment

### Frontend (Next.js)

The web app is configured to deploy to Vercel using the monorepo structure. 

#### Vercel Deployment Instructions

1. In your Vercel project settings:
   - Set the "Root Directory" to `apps/web`
   - Make sure "Include files outside the Root Directory in the Build Step" is **disabled**
   - Vercel will use the configuration in `vercel.json` at the root of the repo

2. If you encounter SWC compiler issues, the following dependencies have been added to `apps/web/package.json`:
   ```
   "@next/swc-linux-x64-gnu": "13.5.9",
   "@next/swc-linux-x64-musl": "13.5.9"
   ```

3. The `.npmrc` file in `apps/web` contains settings to disable workspace detection in the web app directory.

### Edge Functions (Supabase)

Edge functions are deployed directly to Supabase using the Supabase CLI.

## Environment Variables

- For frontend environment variables, update `.env.local` in the `apps/web` directory
- For edge functions, configure environment variables in the Supabase dashboard

# Runner Tracker
v0.4
1. UI for planning Periodization
2. OpenAI for reviewing and suggestion
3. Enforce JWT Verification for edge function

v0.3
1. Import exsisting exercise and sprint program
2. Create Sprint page for displaying sprint session and allow record running times
3. Allow user to view the sprint progression and volume

v0.2
1. Create login feature, differ feature for coach and athlete
2. Allow user to view the exercises progression and volume with chart.js/D3.js
3. Provide Auto Gym progression generation with formula
4. Import Exercise and Sprint data

v0.15
1. Allow user to modify the Sprint and save in database 
2. Allow coach to create new Sprint preset for future weeks 
3. Display a Sprint preset with correct UI 
6. All data validation before submitting to database

v0.1
1. Allow user to modify the Exercises and save in database ✅
2. Allow coach to create new Exercises preset for future weeks ✅
3. Display a Exercises preset with correct UI ✅
4. Able to swicth between Day1/2/3 ✅
5. Select week to view past Exercises ✅
6. All data validation before submitting to database

    <PackageReference Include="Microsoft.AspNet.Cors" Version="5.3.0" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="8.0.10">
    <PackageReference Include="Microsoft.VisualStudio.Web.CodeGeneration.Design" Version="8.0.6" />
    <PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="8.0.4" />
    <PackageReference Include="Swashbuckle.AspNetCore" Version="6.4.0" />

