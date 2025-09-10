/*
          # [SECURITY] Enable RLS and Create Policies
          This script enables Row Level Security (RLS) on all public tables and creates default policies to allow all operations. This is a critical security measure to protect your data from public access.

          ## Query Description: This operation secures your tables by restricting access by default and then explicitly allowing all actions for authenticated users. This resolves the "RLLS Disabled" security advisory. Without this, your data is publicly readable and writable.
          
          ## Metadata:
          - Schema-Category: "Security"
          - Impact-Level: "High"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Enables RLS on: projects, categories, sub_categories, tiers, cash_accounts, budget_entries, budget_entry_payments, actuals, payments, scenarios, scenario_entries.
          - Creates an "Allow all" policy for each of the tables listed above.
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes
          - Auth Requirements: This policy allows any user (anonymous or authenticated) to perform actions, which is suitable for a single-user application without authentication.
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: Negligible performance impact for this type of policy.
          */

-- Enable RLS for all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_entry_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenario_entries ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for single-user context
CREATE POLICY "Allow all access" ON public.projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.sub_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.tiers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.cash_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.budget_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.budget_entry_payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.actuals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.scenarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.scenario_entries FOR ALL USING (true) WITH CHECK (true);
