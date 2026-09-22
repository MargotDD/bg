# Business Girls — Supabase + Netlify

1. Create a Supabase project.
2. Open **SQL Editor** and run `supabase/schema.sql`.
3. In Supabase Auth settings, for easiest testing, disable email confirmation. If email confirmation stays on, a newly registered user must confirm email before first login.
4. In Netlify, add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Redeploy the site.

The app keeps its existing UI and Admin Tools. Login/register uses Supabase Auth. App data is stored in Supabase. Company state is stored in `company_states`; invitations use a 7-day token and the database function `accept_company_invite`.

Important: never put the Supabase `service_role` key in the frontend or Netlify public environment. Only use the `anon`/publishable key.


## WebRTC TURN
The app supports optional TURN ICE servers through the VITE_TURN_ICE_SERVERS environment variable. Without it, calls use the built-in Google STUN servers. For production reliability, configure a TURN provider and paste its ICE server array into the Netlify environment variable VITE_TURN_ICE_SERVERS. Do not put a TURN provider master/secret key in frontend code.
