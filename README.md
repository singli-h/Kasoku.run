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

The web app is configured to deploy to Vercel. In your Vercel project settings, set the "Root Directory" to `apps/web`.

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

## Monorepo with Turborepo

This project is set up as a monorepo using [Turborepo](https://turbo.build/), which provides build optimizations and caching.

### Available Commands

- `npm run dev` - Run development servers for all apps
- `npm run dev:web` - Run development server for just the web app
- `npm run build` - Build all apps
- `npm run build:web` - Build just the web app
- `npm run lint` - Lint all apps

### Deployment

The web app is configured to deploy to Vercel. The deployment is set up to:

1. Only build the web app (not the entire monorepo)
2. Take advantage of Turborepo's caching for faster builds

The deployment configuration is in the `vercel.json` file.

## Deploying to Vercel

This monorepo is configured for easy deployment to Vercel. To deploy the front-end application (apps/web) to Vercel:

1. Connect your GitHub repository to Vercel
2. In the Vercel project settings, set the "Root Directory" to `apps/web`
3. Vercel will automatically detect the Next.js project and use the proper build settings

With this configuration:
- Only the front-end app will be deployed to Vercel
- The build process will be optimized for your Next.js app
- Vercel will ignore other parts of the monorepo

### Local Development

For local development with Turborepo:

```bash
# Run just the web app
npm run dev:web

# Build just the web app
npm run build:web

# Run lint on just the web app
npm run lint:web
```

### Performance Benefits

The monorepo is set up with Turborepo which provides:
- Incremental builds
- Local build caching
- Optimized task running

