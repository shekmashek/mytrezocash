/*
          # [SECURITY] Enable RLS for remaining tables
          This script enables Row Level Security (RLS) on the final set of public tables to ensure that all data is protected by default. It applies a permissive policy that allows all actions for authenticated users, which is suitable for a single-user application while preventing anonymous access.

          ## Query Description: [This operation secures the 'scenarios', 'scenario_entries', and 'tiers' tables by enabling RLS and setting a default access policy. This is a critical security measure to prevent unauthorized data exposure. No data will be lost, but access will be restricted to authenticated requests.]
          
          ## Metadata:
          - Schema-Category: ["Security"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Tables affected: `scenarios`, `scenario_entries`, `tiers`
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [Yes]
          - Auth Requirements: [All actions will require authentication]
          
          ## Performance Impact:
          - Indexes: [None]
          - Triggers: [None]
          - Estimated Impact: [Negligible performance impact on queries for authenticated users.]
          */

-- Enable RLS for scenarios
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to authenticated users on scenarios" ON public.scenarios FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Enable RLS for scenario_entries
ALTER TABLE public.scenario_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to authenticated users on scenario_entries" ON public.scenario_entries FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Enable RLS for tiers
ALTER TABLE public.tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to authenticated users on tiers" ON public.tiers FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
