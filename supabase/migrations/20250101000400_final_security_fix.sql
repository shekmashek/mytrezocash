/*
          # [FINAL SECURITY FIX]
          This script enables Row Level Security (RLS) and creates permissive policies for the authenticated role on all application tables. This is a critical security measure to prevent unauthorized data access.

          ## Query Description: [This operation secures all data tables by enabling RLS. It ensures that only authenticated users can interact with the data, preventing public access. No data will be lost, but this is a fundamental change to data access rules.]
          
          ## Metadata:
          - Schema-Category: ["Security"]
          - Impact-Level: ["High"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Tables affected: projects, categories, tiers, budget_entries, actuals, payments, scenarios, scenario_entries, cash_accounts
          
          ## Security Implications:
          - RLS Status: [Enabled on all tables]
          - Policy Changes: [Yes, adds a default policy for authenticated users on all tables]
          - Auth Requirements: [Authenticated users only]
          
          ## Performance Impact:
          - Indexes: [No change]
          - Triggers: [No change]
          - Estimated Impact: [Low. RLS adds a minor overhead to queries, but it is essential for security.]
          */

-- Enable RLS for all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenario_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_accounts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones.
-- This makes the script safe to re-run.

-- Table: projects
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.projects;
CREATE POLICY "Allow all for authenticated users" ON public.projects FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Table: categories
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.categories;
CREATE POLICY "Allow all for authenticated users" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Table: tiers
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.tiers;
CREATE POLICY "Allow all for authenticated users" ON public.tiers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Table: budget_entries
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.budget_entries;
CREATE POLICY "Allow all for authenticated users" ON public.budget_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Table: actuals
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.actuals;
CREATE POLICY "Allow all for authenticated users" ON public.actuals FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Table: payments
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.payments;
CREATE POLICY "Allow all for authenticated users" ON public.payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Table: scenarios
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.scenarios;
CREATE POLICY "Allow all for authenticated users" ON public.scenarios FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Table: scenario_entries
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.scenario_entries;
CREATE POLICY "Allow all for authenticated users" ON public.scenario_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Table: cash_accounts
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.cash_accounts;
CREATE POLICY "Allow all for authenticated users" ON public.cash_accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);
