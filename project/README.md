# Business Girls

Business Girls is a Vite + React app using Supabase for authentication, shared company data, invitations, chat and realtime features.

## GitHub + Vercel

1. Create a GitHub repository and upload this project.
2. Import that repository into Vercel.
3. Framework: **Vite**
4. Build command: `npm run build`
5. Output directory: `dist`
6. Add these Vercel Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_TURN_ICE_SERVERS` (optional)

The invitation system uses Supabase RPCs and works from links such as `https://your-domain.vercel.app/?invite=CODE`.

## Supabase

Run `supabase/schema.sql` in the Supabase SQL Editor. The SQL creates the profile, company membership, company state and invitation tables/functions.

Only the public Supabase anon key belongs in `VITE_*` variables. Never put a service-role key in the frontend.

## Local development

```bash
npm install
npm run dev
```
