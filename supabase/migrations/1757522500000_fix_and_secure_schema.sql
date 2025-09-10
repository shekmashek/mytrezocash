/*
          # [Schema Reset and Creation]
          This script will drop existing tables if they exist and recreate the entire database schema.

          ## Query Description: [This operation will first attempt to delete any existing tables to ensure a clean setup. It will then recreate all necessary tables, relationships, and initial data. This is a destructive operation on the listed tables but is necessary to fix the previous migration error. No data will be lost as the tables were not created correctly in the first place.]
          
          ## Metadata:
          - Schema-Category: ["Structural", "Data"]
          - Impact-Level: ["High"]
          - Requires-Backup: [false]
          - Reversible: [false]
          
          ## Structure Details:
          - Drops and recreates: projects, budget_entries, actuals, payments, scenarios, scenario_entries, categories, sub_categories, tiers, user_cash_accounts.
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [Yes]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [Added]
          - Triggers: [None]
          - Estimated Impact: [Low, as this is initial setup.]
          */

-- Drop existing tables to ensure a clean slate
DROP TABLE IF EXISTS public.scenario_entries CASCADE;
DROP TABLE IF EXISTS public.scenarios CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.actuals CASCADE;
DROP TABLE IF EXISTS public.budget_entries CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.sub_categories CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.tiers CASCADE;
DROP TABLE IF EXISTS public.user_cash_accounts CASCADE;

-- Create Projects Table
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    expense_targets JSONB,
    annual_goals JSONB,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Main Categories Table
CREATE TABLE public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'revenue' or 'expense'
    is_fixed BOOLEAN DEFAULT FALSE
);

-- Create Sub-Categories Table
CREATE TABLE public.sub_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    main_category_id TEXT REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    UNIQUE(main_category_id, name)
);

-- Create Tiers (Third Parties) Table
CREATE TABLE public.tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'client' or 'fournisseur'
    UNIQUE(name, type)
);

-- Create User Cash Accounts Table
CREATE TABLE public.user_cash_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    main_category_id TEXT NOT NULL,
    name TEXT NOT NULL,
    initial_balance NUMERIC(15, 2) DEFAULT 0.00,
    initial_balance_date DATE NOT NULL,
    UNIQUE(name)
);

-- Create Budget Entries Table
CREATE TABLE public.budget_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'revenu' or 'depense'
    category_name TEXT NOT NULL,
    frequency TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    date DATE, -- For 'ponctuel'
    start_date DATE, -- For recurring
    end_date DATE, -- For recurring
    supplier_name TEXT NOT NULL,
    description TEXT,
    payments JSONB, -- For 'irregulier' or 'provision'
    provision_details JSONB,
    is_off_budget BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Actuals Table
CREATE TABLE public.actuals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    budget_id UUID, -- Can be null for off-budget items
    type TEXT NOT NULL, -- 'payable' or 'receivable'
    category_name TEXT NOT NULL,
    date DATE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    third_party_name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, partially_paid, paid, partially_received, received
    is_off_budget BOOLEAN DEFAULT FALSE,
    is_provision BOOLEAN DEFAULT FALSE,
    is_final_provision_payment BOOLEAN DEFAULT FALSE,
    provision_details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Payments Table
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actual_id UUID REFERENCES public.actuals(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL,
    paid_amount NUMERIC(15, 2) NOT NULL,
    cash_account_id UUID REFERENCES public.user_cash_accounts(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Scenarios Table
CREATE TABLE public.scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Scenario Entries (Deltas) Table
CREATE TABLE public.scenario_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID REFERENCES public.scenarios(id) ON DELETE CASCADE,
    budget_entry_id UUID NOT NULL, -- References an ID from budget_entries OR a new temp ID
    is_deleted BOOLEAN DEFAULT FALSE,
    -- Fields that can be overridden
    type TEXT,
    category_name TEXT,
    frequency TEXT,
    amount NUMERIC(15, 2),
    date DATE,
    start_date DATE,
    end_date DATE,
    supplier_name TEXT,
    description TEXT,
    payments JSONB,
    provision_details JSONB,
    is_off_budget BOOLEAN,
    UNIQUE(scenario_id, budget_entry_id)
);

-- Insert initial data for Categories
INSERT INTO public.categories (id, name, type, is_fixed) VALUES
('rev-main-1', 'Entrées des Ventes', 'revenue', false),
('rev-main-2', 'Entrées Financières', 'revenue', false),
('rev-main-3', 'Autres Entrées', 'revenue', false),
('exp-main-1', 'Exploitation', 'expense', true),
('exp-main-2', 'Masse Salariale', 'expense', true),
('exp-main-3', 'Investissement', 'expense', true),
('exp-main-4', 'Financement', 'expense', true),
('exp-main-5', 'Épargne et Provision', 'expense', true),
('exp-main-6', 'Exceptionnel', 'expense', true),
('exp-main-7', 'Impôts et Taxes', 'expense', true),
('exp-main-8', 'Formation', 'expense', true),
('exp-main-9', 'Innovation, Recherche et développement', 'expense', true);

-- Enable RLS on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cash_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenario_entries ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all actions for authenticated users
CREATE POLICY "Allow all access to authenticated users on projects" ON public.projects FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to authenticated users on categories" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to authenticated users on sub_categories" ON public.sub_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to authenticated users on tiers" ON public.tiers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to authenticated users on user_cash_accounts" ON public.user_cash_accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to authenticated users on budget_entries" ON public.budget_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to authenticated users on actuals" ON public.actuals FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to authenticated users on payments" ON public.payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to authenticated users on scenarios" ON public.scenarios FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to authenticated users on scenario_entries" ON public.scenario_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);
