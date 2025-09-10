/*
# [SECURITY] Comprehensive RLS Policy Application
This script enables Row Level Security (RLS) and applies a permissive "allow all" policy for authenticated users on all remaining application tables. This is a critical security measure to prevent unauthorized public access.

## Query Description: [This operation secures all data tables by enabling RLS and setting a default policy. It ensures that only authenticated users can interact with the data, resolving the "RLS Disabled in Public" security advisories. There is no risk of data loss.]

## Metadata:
- Schema-Category: ["Security", "Structural"]
- Impact-Level: ["High"]
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Affects tables: projects, categories, tiers, user_cash_accounts, budget_entries, actuals, payments, scenarios, scenario_entries
- Enables RLS on these tables.
- Creates an "Allow all access to authenticated users" policy for each table.

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes
- Auth Requirements: All access to these tables will now require an authenticated user session.

## Performance Impact:
- Indexes: [None]
- Triggers: [None]
- Estimated Impact: [Negligible performance impact. RLS checks are highly optimized by PostgreSQL.]
*/

-- Enable RLS and set policy for 'projects'
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.projects;
CREATE POLICY "Allow all access to authenticated users"
ON public.projects
FOR ALL
TO authenticated
USING (true);

-- Enable RLS and set policy for 'categories'
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.categories;
CREATE POLICY "Allow all access to authenticated users"
ON public.categories
FOR ALL
TO authenticated
USING (true);

-- Enable RLS and set policy for 'tiers'
ALTER TABLE public.tiers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.tiers;
CREATE POLICY "Allow all access to authenticated users"
ON public.tiers
FOR ALL
TO authenticated
USING (true);

-- Enable RLS and set policy for 'user_cash_accounts'
ALTER TABLE public.user_cash_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.user_cash_accounts;
CREATE POLICY "Allow all access to authenticated users"
ON public.user_cash_accounts
FOR ALL
TO authenticated
USING (true);

-- Enable RLS and set policy for 'budget_entries'
ALTER TABLE public.budget_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.budget_entries;
CREATE POLICY "Allow all access to authenticated users"
ON public.budget_entries
FOR ALL
TO authenticated
USING (true);

-- Enable RLS and set policy for 'actuals'
ALTER TABLE public.actuals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.actuals;
CREATE POLICY "Allow all access to authenticated users"
ON public.actuals
FOR ALL
TO authenticated
USING (true);

-- Enable RLS and set policy for 'payments'
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.payments;
CREATE POLICY "Allow all access to authenticated users"
ON public.payments
FOR ALL
TO authenticated
USING (true);

-- Enable RLS and set policy for 'scenarios'
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.scenarios;
CREATE POLICY "Allow all access to authenticated users"
ON public.scenarios
FOR ALL
TO authenticated
USING (true);

-- Enable RLS and set policy for 'scenario_entries'
ALTER TABLE public.scenario_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.scenario_entries;
CREATE POLICY "Allow all access to authenticated users"
ON public.scenario_entries
FOR ALL
TO authenticated
USING (true);
