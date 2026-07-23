-- Enable pg_cron extension (available on Supabase Pro plans)
-- If on free tier, you can invoke the edge function manually or use an external cron service.
-- Uncomment the lines below if pg_cron is available:

-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the weekly digest to run every Sunday at 9:00 AM UTC
-- SELECT cron.schedule(
--   'weekly-garden-digest',
--   '0 9 * * 0',  -- Every Sunday at 09:00 UTC
--   $$
--   SELECT net.http_post(
--     url := current_setting('app.settings.supabase_url') || '/functions/v1/weekly-digest',
--     headers := jsonb_build_object(
--       'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
--       'Content-Type', 'application/json'
--     ),
--     body := '{}'::jsonb
--   );
--   $$
-- );

-- Alternative: Use Supabase Dashboard > Database > Extensions > pg_cron
-- Or use the Supabase CLI: supabase functions deploy weekly-digest
-- Then set up a cron trigger in the Supabase Dashboard under Edge Functions > Schedules
