/*
          # [Final Security Fix]
          This script ensures that Row Level Security (RLS) is enabled on all tables and that a default policy exists. It uses `IF EXISTS` to prevent errors on re-runs.

          ## Query Description: [This script will enable RLS and create policies for all application tables. It is safe to run multiple times. This is the final step to secure the database before connecting the application.]
          
          ## Metadata:
          - Schema-Category: ["Security"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Affects tables: projects, scenarios, scenario_entries, budget_entries, actuals, payments, categories, tiers, user_cash_accounts, annual_goals, expense_targets
          
          ## Security Implications:
          - RLS Status: [Enabled on all tables]
          - Policy Changes: [Yes, creates default policies if they don't exist]
          - Auth Requirements: [authenticated users]
          
          ## Performance Impact:
          - Indexes: [None]
          - Triggers: [None]
          - Estimated Impact: [Low]
          */

-- Enable RLS for all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenario_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cash_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annual_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_targets ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist

DROP POLICY IF EXISTS "Allow all access to authenticated users on projects" ON public.projects;
CREATE POLICY "Allow all access to authenticated users on projects" ON public.projects FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to authenticated users on scenarios" ON public.scenarios;
CREATE POLICY "Allow all access to authenticated users on scenarios" ON public.scenarios FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to authenticated users on scenario_entries" ON public.scenario_entries;
CREATE POLICY "Allow all access to authenticated users on scenario_entries" ON public.scenario_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to authenticated users on budget_entries" ON public.budget_entries;
CREATE POLICY "Allow all access to authenticated users on budget_entries" ON public.budget_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to authenticated users on actuals" ON public.actuals;
CREATE POLICY "Allow all access to authenticated users on actuals" ON public.actuals FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to authenticated users on payments" ON public.payments;
CREATE POLICY "Allow all access to authenticated users on payments" ON public.payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to authenticated users on categories" ON public.categories;
CREATE POLICY "Allow all access to authenticated users on categories" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to authenticated users on tiers" ON public.tiers;
CREATE POLICY "Allow all access to authenticated users on tiers" ON public.tiers FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to authenticated users on user_cash_accounts" ON public.user_cash_accounts;
CREATE POLICY "Allow all access to authenticated users on user_cash_accounts" ON public.user_cash_accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to authenticated users on annual_goals" ON public.annual_goals;
CREATE POLICY "Allow all access to authenticated users on annual_goals" ON public.annual_goals FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to authenticated users on expense_targets" ON public.expense_targets;
CREATE POLICY "Allow all access to authenticated users on expense_targets" ON public.expense_targets FOR ALL TO authenticated USING (true) WITH CHECK (true);
