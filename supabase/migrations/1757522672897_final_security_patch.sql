/*
          # [SECURITY PATCH] Enable RLS on remaining tables
          This script enables Row Level Security (RLS) on the remaining public tables and applies a default policy to allow access only to authenticated users. This is a critical step to prevent unauthorized public access to your data.

          ## Query Description: [This operation secures your database. It enables RLS on several tables and creates policies that restrict access to authenticated users only. This change is safe and necessary for data protection. No data will be lost or modified.]
          
          ## Metadata:
          - Schema-Category: ["Security"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Tables affected: projects, tiers, user_cash_accounts, scenarios
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [Yes]
          - Auth Requirements: [authenticated role]
          
          ## Performance Impact:
          - Indexes: [None]
          - Triggers: [None]
          - Estimated Impact: [Negligible performance impact. RLS adds a small overhead to queries, but it is essential for security.]
          */

-- Enable RLS for projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.projects;
CREATE POLICY "Enable all access for authenticated users" ON public.projects FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Enable RLS for tiers
ALTER TABLE public.tiers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.tiers;
CREATE POLICY "Enable all access for authenticated users" ON public.tiers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Enable RLS for user_cash_accounts
ALTER TABLE public.user_cash_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.user_cash_accounts;
CREATE POLICY "Enable all access for authenticated users" ON public.user_cash_accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Enable RLS for scenarios
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.scenarios;
CREATE POLICY "Enable all access for authenticated users" ON public.scenarios FOR ALL TO authenticated USING (true) WITH CHECK (true);
