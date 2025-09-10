/*
# [Fix RLS Policies]
This script ensures that Row Level Security (RLS) is enabled on all public tables and creates a default policy that allows all actions for authenticated users. It is designed to be idempotent, meaning it can be run multiple times without causing errors.

## Query Description: [This operation secures all data tables by enabling Row Level Security. It drops any previously existing policies to prevent conflicts and re-creates them, ensuring a consistent security state. This is a critical safety measure with no risk to existing data.]

## Metadata:
- Schema-Category: ["Security", "Safe"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Affects RLS and policies for tables: projects, annual_goals, expense_targets, budget_entries, actuals, payments, scenarios, scenario_entries, tiers, user_cash_accounts.

## Security Implications:
- RLS Status: Enabled on all tables.
- Policy Changes: Yes, policies are reset to a known state.
- Auth Requirements: Access is restricted to the 'authenticated' role.

## Performance Impact:
- Indexes: [None]
- Triggers: [None]
- Estimated Impact: [Negligible performance impact. RLS adds a small overhead to queries, but it is essential for security.]
*/

-- Enable RLS and set policies for all tables

-- Table: projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to authenticated users on projects" ON public.projects;
CREATE POLICY "Allow all access to authenticated users on projects" ON public.projects FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Table: annual_goals
ALTER TABLE public.annual_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to authenticated users on annual_goals" ON public.annual_goals;
CREATE POLICY "Allow all access to authenticated users on annual_goals" ON public.annual_goals FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Table: expense_targets
ALTER TABLE public.expense_targets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to authenticated users on expense_targets" ON public.expense_targets;
CREATE POLICY "Allow all access to authenticated users on expense_targets" ON public.expense_targets FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Table: budget_entries
ALTER TABLE public.budget_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to authenticated users on budget_entries" ON public.budget_entries;
CREATE POLICY "Allow all access to authenticated users on budget_entries" ON public.budget_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Table: actuals
ALTER TABLE public.actuals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to authenticated users on actuals" ON public.actuals;
CREATE POLICY "Allow all access to authenticated users on actuals" ON public.actuals FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Table: payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to authenticated users on payments" ON public.payments;
CREATE POLICY "Allow all access to authenticated users on payments" ON public.payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Table: scenarios
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to authenticated users on scenarios" ON public.scenarios;
CREATE POLICY "Allow all access to authenticated users on scenarios" ON public.scenarios FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Table: scenario_entries
ALTER TABLE public.scenario_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to authenticated users on scenario_entries" ON public.scenario_entries;
CREATE POLICY "Allow all access to authenticated users on scenario_entries" ON public.scenario_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Table: tiers
ALTER TABLE public.tiers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to authenticated users on tiers" ON public.tiers;
CREATE POLICY "Allow all access to authenticated users on tiers" ON public.tiers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Table: user_cash_accounts
ALTER TABLE public.user_cash_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to authenticated users on user_cash_accounts" ON public.user_cash_accounts;
CREATE POLICY "Allow all access to authenticated users on user_cash_accounts" ON public.user_cash_accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);
