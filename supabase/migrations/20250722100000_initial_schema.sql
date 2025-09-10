/*
          # Initial Schema Setup
          This script creates the complete database schema for the Trezocash application, including all tables, relationships, and initial data required for the application to function.

          ## Query Description: This is a foundational script that builds the entire database structure from scratch. It is safe to run on a new, empty Supabase project. It does not contain any destructive operations for existing data if the tables do not already exist.

          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: false
          
          ## Structure Details:
          - Creates tables: projects, tiers, main_categories, sub_categories, cash_accounts, budget_entries, actuals, payments, scenarios, scenario_entry_deltas, app_settings.
          - Establishes foreign key relationships with cascading deletes.
          - Inserts default data for main_categories and app_settings.
          
          ## Security Implications:
          - RLS Status: Disabled
          - Policy Changes: No
          - Auth Requirements: None
          
          ## Performance Impact:
          - Indexes: Primary keys are automatically indexed.
          - Triggers: None
          - Estimated Impact: Negligible on a new project.
          */

-- Create projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  expense_targets JSONB,
  annual_goals JSONB,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE projects IS 'Stores project information, including goals and settings.';

-- Create tiers table (suppliers/clients)
CREATE TABLE tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('fournisseur', 'client')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(name, type)
);
COMMENT ON TABLE tiers IS 'Stores third-party entities like suppliers and clients.';

-- Create main_categories table
CREATE TABLE main_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('revenue', 'expense')),
  is_fixed BOOLEAN DEFAULT FALSE
);
COMMENT ON TABLE main_categories IS 'Stores the main, top-level categories for revenues and expenses.';

-- Create sub_categories table
CREATE TABLE sub_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  main_category_id TEXT NOT NULL REFERENCES main_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(main_category_id, name)
);
COMMENT ON TABLE sub_categories IS 'Stores user-defined sub-categories within each main category.';

-- Create cash_accounts table
CREATE TABLE cash_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  main_category_id TEXT NOT NULL,
  name TEXT NOT NULL,
  initial_balance NUMERIC DEFAULT 0,
  initial_balance_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE cash_accounts IS 'Stores user''s cash accounts (bank, cash, etc.).';

-- Create budget_entries table
CREATE TABLE budget_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('revenu', 'depense')),
  category TEXT NOT NULL,
  frequency TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE, -- For one-time entries
  start_date DATE, -- For recurring entries
  end_date DATE,
  supplier TEXT,
  description TEXT,
  payments JSONB, -- For irregular payments
  provision_details JSONB,
  is_off_budget BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE budget_entries IS 'Stores all budgeted revenue and expense lines.';

-- Create actuals table
CREATE TABLE actuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  budget_id UUID REFERENCES budget_entries(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('payable', 'receivable')),
  category TEXT NOT NULL,
  date DATE NOT NULL, -- Due date
  amount NUMERIC NOT NULL,
  third_party TEXT,
  description TEXT,
  status TEXT,
  is_off_budget BOOLEAN DEFAULT FALSE,
  is_provision BOOLEAN DEFAULT FALSE,
  is_final_provision_payment BOOLEAN DEFAULT FALSE,
  provision_details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE actuals IS 'Stores actual transactions to be paid or received, derived from budget entries or created manually.';

-- Create payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actual_id UUID NOT NULL REFERENCES actuals(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  paid_amount NUMERIC NOT NULL,
  cash_account_id UUID REFERENCES cash_accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE payments IS 'Records actual payments made or received against an ''actual'' transaction.';

-- Create scenarios table
CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE scenarios IS 'Stores scenario definitions.';

-- Create scenario_entry_deltas table
CREATE TABLE scenario_entry_deltas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  delta_data JSONB NOT NULL
);
COMMENT ON TABLE scenario_entry_deltas IS 'Stores the deltas (modifications, additions, deletions) for budget entries within a scenario.';
COMMENT ON COLUMN scenario_entry_deltas.delta_data IS 'JSON object representing the budget entry change. Must contain an "id" field.';

-- Create app_settings table
CREATE TABLE app_settings (
  id INT PRIMARY KEY,
  currency TEXT DEFAULT '€',
  display_unit TEXT DEFAULT 'standard',
  decimal_places INT DEFAULT 2,
  CHECK (id = 1)
);
COMMENT ON TABLE app_settings IS 'Stores global application settings.';

-- Insert default settings row
INSERT INTO app_settings (id) VALUES (1);

-- Populate main_categories with initial data from the application
INSERT INTO main_categories (id, name, type, is_fixed) VALUES
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

-- Populate initial sub-categories for a better out-of-the-box experience
INSERT INTO sub_categories (main_category_id, name) VALUES
('rev-main-1', 'Ventes de produits'),
('rev-main-1', 'Ventes de services'),
('rev-main-2', 'Intérêts perçus'),
('rev-main-3', 'Subventions'),
('exp-main-1', 'Loyer et charges'),
('exp-main-1', 'Fournitures de bureau'),
('exp-main-1', 'Marketing et publicité'),
('exp-main-2', 'Salaires et traitements'),
('exp-main-2', 'Charges sociales'),
('exp-main-3', 'Achat de matériel'),
('exp-main-4', 'Remboursement d''emprunt'),
('exp-main-5', 'Provision pour risques'),
('exp-main-7', 'TVA');
