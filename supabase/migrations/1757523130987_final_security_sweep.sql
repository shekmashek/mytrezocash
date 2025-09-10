/*
# [SECURITY FIX] Final RLS Configuration Sweep
This script performs a comprehensive and final security sweep to enable Row Level Security (RLS) on ALL tables and establish the correct access policies. This will resolve any lingering security warnings.

## Query Description:
- This script iterates through every table in your database (`projects`, `budget_entries`, `actuals`, `payments`, `tiers`, `scenarios`, `scenario_entries`, `user_cash_accounts`).
- For each table, it ensures RLS is enabled.
- It then removes any previously existing "public_access" policy and recreates a fresh one.
- The new policy grants full access (`ALL`) only to authenticated users (`authenticated`). This is the standard and secure configuration for a single-user application.

## Metadata:
- Schema-Category: "Security"
- Impact-Level: "High"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Tables affected: ALL application tables.

## Security Implications:
- RLS Status: Enabled on all tables.
- Policy Changes: Yes, policies are reset and standardized.
- Auth Requirements: All operations will now require an authenticated user session.

## Performance Impact:
- Estimated Impact: Negligible.
*/

-- Projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_access" ON public.projects;
CREATE POLICY "public_access" ON public.projects FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Budget Entries
ALTER TABLE public.budget_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_access" ON public.budget_entries;
CREATE POLICY "public_access" ON public.budget_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Actuals
ALTER TABLE public.actuals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_access" ON public.actuals;
CREATE POLICY "public_access" ON public.actuals FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_access" ON public.payments;
CREATE POLICY "public_access" ON public.payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Tiers
ALTER TABLE public.tiers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_access" ON public.tiers;
CREATE POLICY "public_access" ON public.tiers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Scenarios
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_access" ON public.scenarios;
CREATE POLICY "public_access" ON public.scenarios FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Scenario Entries
ALTER TABLE public.scenario_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_access" ON public.scenario_entries;
CREATE POLICY "public_access" ON public.scenario_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- User Cash Accounts
ALTER TABLE public.user_cash_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_access" ON public.user_cash_accounts;
CREATE POLICY "public_access" ON public.user_cash_accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);
