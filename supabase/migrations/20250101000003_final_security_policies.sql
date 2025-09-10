/*
# [SECURITY FIX] Final RLS and Policy Configuration
This script provides a comprehensive and safe way to enable Row Level Security (RLS) and apply a default access policy to all application tables. It is designed to be run multiple times without causing errors.

## Query Description:
This script will:
1. Enable Row Level Security (RLS) on all tables. This is a critical security measure.
2. Drop any existing default policies on these tables to prevent conflicts.
3. Create a new default policy for each table that allows all actions (SELECT, INSERT, UPDATE, DELETE) for any logged-in user. This is a secure default for a single-user application.

This operation is safe and will not affect your data. It only changes security configurations.

## Metadata:
- Schema-Category: ["Security", "Safe"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: true (by disabling RLS or changing policies)

## Structure Details:
- Affects tables: projects, budget_entries, actuals, payments, tiers, scenarios, scenario_entries, cash_accounts, annual_goals, expense_targets
- Creates policies: "Allow all access to authenticated users on ..." for each table.

## Security Implications:
- RLS Status: Enabled on all tables.
- Policy Changes: Yes, sets a baseline "allow all for authenticated users" policy.
- Auth Requirements: Users must be authenticated to access data.
*/

-- Enable RLS for all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenario_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annual_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_targets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create them.
-- This makes the script safe to re-run.

-- Table: projects
DROP POLICY IF EXISTS "Allow all access to authenticated users on projects" ON public.projects;
CREATE POLICY "Allow all access to authenticated users on projects"
ON public.projects FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Table: budget_entries
DROP POLICY IF EXISTS "Allow all access to authenticated users on budget_entries" ON public.budget_entries;
CREATE POLICY "Allow all access to authenticated users on budget_entries"
ON public.budget_entries FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Table: actuals
DROP POLICY IF EXISTS "Allow all access to authenticated users on actuals" ON public.actuals;
CREATE POLICY "Allow all access to authenticated users on actuals"
ON public.actuals FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Table: payments
DROP POLICY IF EXISTS "Allow all access to authenticated users on payments" ON public.payments;
CREATE POLICY "Allow all access to authenticated users on payments"
ON public.payments FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Table: tiers
DROP POLICY IF EXISTS "Allow all access to authenticated users on tiers" ON public.tiers;
CREATE POLICY "Allow all access to authenticated users on tiers"
ON public.tiers FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Table: scenarios
DROP POLICY IF EXISTS "Allow all access to authenticated users on scenarios" ON public.scenarios;
CREATE POLICY "Allow all access to authenticated users on scenarios"
ON public.scenarios FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Table: scenario_entries
DROP POLICY IF EXISTS "Allow all access to authenticated users on scenario_entries" ON public.scenario_entries;
CREATE POLICY "Allow all access to authenticated users on scenario_entries"
ON public.scenario_entries FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Table: cash_accounts
DROP POLICY IF EXISTS "Allow all access to authenticated users on cash_accounts" ON public.cash_accounts;
CREATE POLICY "Allow all access to authenticated users on cash_accounts"
ON public.cash_accounts FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Table: annual_goals
DROP POLICY IF EXISTS "Allow all access to authenticated users on annual_goals" ON public.annual_goals;
CREATE POLICY "Allow all access to authenticated users on annual_goals"
ON public.annual_goals FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Table: expense_targets
DROP POLICY IF EXISTS "Allow all access to authenticated users on expense_targets" ON public.expense_targets;
CREATE POLICY "Allow all access to authenticated users on expense_targets"
ON public.expense_targets FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
