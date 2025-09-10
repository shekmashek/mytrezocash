/*
          # [Final Schema and RLS Setup]
          This is a comprehensive script to reset and build the entire database schema. It drops all existing application tables to ensure a clean state, then recreates them with the correct structure and relationships. Finally, it enables Row Level Security (RLS) and applies a default policy to all tables to secure the application.

          ## Query Description: [This operation will completely reset your database tables before rebuilding them. All current data in the tables will be lost. This is necessary to fix the schema errors. Please ensure you have no critical data you wish to keep, or back it up before proceeding.]
          
          ## Metadata:
          - Schema-Category: ["Dangerous", "Structural"]
          - Impact-Level: ["High"]
          - Requires-Backup: [true]
          - Reversible: [false]
          
          ## Structure Details:
          - Drops all existing app tables if they exist.
          - Creates types: entry_type, frequency_type, actual_status, tier_type.
          - Creates tables: projects, annual_goals, expense_targets, scenarios, categories, tiers, user_cash_accounts, budget_entries, budget_entry_payments, actuals, actual_payments, scenario_entries.
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [Yes]
          - Auth Requirements: [Requires authenticated user for all access]
          
          ## Performance Impact:
          - Indexes: [Primary keys and foreign keys will be indexed]
          - Triggers: [None]
          - Estimated Impact: [Low, as tables will be empty initially]
*/

-- Drop existing objects in reverse order of dependency to avoid errors
DROP TABLE IF EXISTS public.scenario_entries CASCADE;
DROP TABLE IF EXISTS public.actual_payments CASCADE;
DROP TABLE IF EXISTS public.actuals CASCADE;
DROP TABLE IF EXISTS public.budget_entry_payments CASCADE;
DROP TABLE IF EXISTS public.budget_entries CASCADE;
DROP TABLE IF EXISTS public.expense_targets CASCADE;
DROP TABLE IF EXISTS public.annual_goals CASCADE;
DROP TABLE IF EXISTS public.scenarios CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.user_cash_accounts CASCADE;
DROP TABLE IF EXISTS public.tiers CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;

DROP TYPE IF EXISTS public.entry_type;
DROP TYPE IF EXISTS public.frequency_type;
DROP TYPE IF EXISTS public.actual_status;
DROP TYPE IF EXISTS public.tier_type;

-- Create custom types
CREATE TYPE public.entry_type AS ENUM ('revenu', 'depense');
CREATE TYPE public.frequency_type AS ENUM ('ponctuel', 'mensuel', 'bimestriel', 'trimestriel', 'annuel', 'hebdomadaire', 'irregulier', 'provision');
CREATE TYPE public.actual_status AS ENUM ('pending', 'partially_paid', 'paid', 'partially_received', 'received');
CREATE TYPE public.tier_type AS ENUM ('client', 'fournisseur');

-- Create tables
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.annual_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    year INT NOT NULL,
    revenue BIGINT DEFAULT 0,
    expense BIGINT DEFAULT 0,
    UNIQUE(project_id, year)
);

CREATE TABLE public.expense_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    targets JSONB,
    UNIQUE(project_id)
);

CREATE TABLE public.scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type public.entry_type NOT NULL,
    is_fixed BOOLEAN NOT NULL DEFAULT FALSE,
    sub_categories JSONB
);

CREATE TABLE public.tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type public.tier_type NOT NULL,
    UNIQUE(name, type)
);

CREATE TABLE public.user_cash_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    main_category_id TEXT NOT NULL,
    name TEXT NOT NULL,
    initial_balance DECIMAL(15, 2) DEFAULT 0,
    initial_balance_date DATE NOT NULL
);

CREATE TABLE public.budget_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    type public.entry_type NOT NULL,
    category TEXT NOT NULL,
    frequency public.frequency_type NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    date DATE,
    start_date DATE,
    end_date DATE,
    supplier TEXT,
    description TEXT,
    is_off_budget BOOLEAN DEFAULT FALSE,
    provision_details JSONB
);

CREATE TABLE public.budget_entry_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_entry_id UUID NOT NULL REFERENCES public.budget_entries(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    amount DECIMAL(15, 2) NOT NULL
);

CREATE TABLE public.actuals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    budget_id UUID REFERENCES public.budget_entries(id) ON DELETE SET NULL,
    type public.entry_type NOT NULL,
    category TEXT NOT NULL,
    date DATE NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    third_party TEXT,
    description TEXT,
    status public.actual_status NOT NULL,
    is_off_budget BOOLEAN DEFAULT FALSE,
    is_provision BOOLEAN DEFAULT FALSE,
    is_final_provision_payment BOOLEAN DEFAULT FALSE,
    provision_details JSONB
);

CREATE TABLE public.actual_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actual_id UUID NOT NULL REFERENCES public.actuals(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL,
    paid_amount DECIMAL(15, 2) NOT NULL,
    cash_account_id UUID REFERENCES public.user_cash_accounts(id) ON DELETE SET NULL
);

CREATE TABLE public.scenario_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID NOT NULL REFERENCES public.scenarios(id) ON DELETE CASCADE,
    budget_entry_id UUID REFERENCES public.budget_entries(id) ON DELETE CASCADE,
    entry_data JSONB,
    is_deleted BOOLEAN DEFAULT FALSE,
    UNIQUE(scenario_id, budget_entry_id)
);

-- Enable RLS and create policies for all tables
DO $$
DECLARE
    t_name TEXT;
BEGIN
    FOR t_name IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          AND table_name NOT LIKE 'pg_%'
          AND table_name NOT LIKE 'sql_%'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t_name);
        EXECUTE format('DROP POLICY IF EXISTS "Allow all access to authenticated users on %I" ON public.%I;', t_name, t_name);
        EXECUTE format('CREATE POLICY "Allow all access to authenticated users on %I" ON public.%I FOR ALL USING (auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''authenticated'');', t_name, t_name);
    END LOOP;
END;
$$;

-- Insert initial data
INSERT INTO public.categories (id, name, type, is_fixed, sub_categories) VALUES
('rev-main-1', 'Entrées des Ventes', 'revenu', false, '[{"id": "c1a", "name": "Ventes de produits"}, {"id": "c1b", "name": "Ventes de services"}]'),
('rev-main-2', 'Entrées Financières', 'revenu', false, '[{"id": "c2a", "name": "Intérêts perçus"}]'),
('rev-main-3', 'Autres Entrées', 'revenu', false, '[{"id": "c3a", "name": "Subventions"}, {"id": "c3b", "name": "Revenus Exceptionnels"}]'),
('exp-main-1', 'Exploitation', 'depense', true, '[{"id": "c4a", "name": "Loyer et charges"}, {"id": "c4b", "name": "Fournitures de bureau"}, {"id": "c4c", "name": "Marketing et publicité"}, {"id": "c4d", "name": "Frais de déplacement"}]'),
('exp-main-2', 'Masse Salariale', 'depense', true, '[{"id": "c5a", "name": "Salaires et traitements"}, {"id": "c5b", "name": "Charges sociales"}]'),
('exp-main-3', 'Investissement', 'depense', true, '[{"id": "c6a", "name": "Achat de matériel"}, {"id": "c6b", "name": "Logiciels"}]'),
('exp-main-4', 'Financement', 'depense', true, '[{"id": "c7a", "name": "Remboursement d''emprunt"}, {"id": "c7b", "name": "Intérêts d''emprunt"}]'),
('exp-main-5', 'Épargne et Provision', 'depense', true, '[{"id": "c8a", "name": "Provision pour risques"}]'),
('exp-main-6', 'Exceptionnel', 'depense', true, '[{"id": "c9a", "name": "Amendes"}, {"id": "c9b", "name": "Dons"}]'),
('exp-main-7', 'Impôts et Taxes', 'depense', true, '[{"id": "c10a", "name": "Impôt sur les sociétés"}, {"id": "c10b", "name": "TVA"}, {"id": "c10c", "name": "Autres taxes"}]'),
('exp-main-8', 'Formation', 'depense', true, '[]'),
('exp-main-9', 'Innovation, Recherche et développement', 'depense', true, '[]');
