/*
          # [Final RLS Security Fix]
          This script enables Row Level Security (RLS) on the remaining public tables and applies a permissive "allow all" policy for authenticated users. This is the final step to secure the database for a single-user environment.

          ## Query Description: [This operation secures the database by restricting access to authenticated users only. It prevents anonymous access to your data, resolving the critical security advisories. No data will be lost.]
          
          ## Metadata:
          - Schema-Category: ["Security"]
          - Impact-Level: ["High"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Tables affected: budget_entries, scenarios, scenario_entries, tiers
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [Yes]
          - Auth Requirements: [Requires authenticated user for access]
          
          ## Performance Impact:
          - Indexes: [No change]
          - Triggers: [No change]
          - Estimated Impact: [Low. RLS adds a minor overhead, but it's negligible for this application's scale.]
          */

-- Enable RLS for budget_entries
ALTER TABLE public.budget_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.budget_entries;
CREATE POLICY "Allow all for authenticated users" ON public.budget_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Enable RLS for scenarios
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.scenarios;
CREATE POLICY "Allow all for authenticated users" ON public.scenarios FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Enable RLS for scenario_entries
ALTER TABLE public.scenario_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.scenario_entries;
CREATE POLICY "Allow all for authenticated users" ON public.scenario_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Enable RLS for tiers
ALTER TABLE public.tiers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.tiers;
CREATE POLICY "Allow all for authenticated users" ON public.tiers FOR ALL TO authenticated USING (true) WITH CHECK (true);
