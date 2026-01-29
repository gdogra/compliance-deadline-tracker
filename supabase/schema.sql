-- Compliance Deadline Tracker Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CORE TABLES
-- ============================================

-- Firms (multi-tenant)
CREATE TABLE firms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'solo', 'team', 'firm')),
  billing_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  firm_id UUID REFERENCES firms(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  alert_email BOOLEAN DEFAULT true,
  alert_sms BOOLEAN DEFAULT false,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('individual', 'sole_prop', 'llc', 's_corp', 'c_corp', 'partnership', 'non_profit', 'trust', 'estate')),
  ein TEXT,
  ssn_last4 TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  states TEXT[] DEFAULT '{}',
  tax_types TEXT[] DEFAULT '{}',
  fiscal_year_end TEXT DEFAULT '12-31', -- MM-DD format
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DEADLINE ENGINE
-- ============================================

-- Deadline Templates (master list of all possible deadlines)
CREATE TABLE deadline_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  jurisdiction TEXT NOT NULL, -- 'federal', 'CA', 'TX', 'NY', etc.
  tax_type TEXT NOT NULL, -- 'income', 'payroll', 'sales', 'franchise', 'estimated'
  entity_types TEXT[] NOT NULL, -- which entity types this applies to
  name TEXT NOT NULL,
  description TEXT,
  form_number TEXT,
  base_date_rule JSONB NOT NULL, -- rules for calculating due date
  penalty_info TEXT,
  links JSONB DEFAULT '[]', -- [{name: "IRS Direct Pay", url: "..."}]
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client Deadlines (generated instances for each client)
CREATE TABLE client_deadlines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  template_id UUID REFERENCES deadline_templates(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  form_number TEXT,
  due_date DATE NOT NULL,
  jurisdiction TEXT NOT NULL,
  tax_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'extended', 'missed')),
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id),
  extended_to DATE,
  notes TEXT,
  penalty_info TEXT,
  links JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom Deadlines (user-created, not from templates)
CREATE TABLE custom_deadlines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE, -- null = firm-wide
  name TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  recurrence TEXT CHECK (recurrence IN ('none', 'monthly', 'quarterly', 'annually')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'missed')),
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ALERTS
-- ============================================

-- Alert Log
CREATE TABLE alert_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deadline_id UUID NOT NULL, -- can reference client_deadlines or custom_deadlines
  deadline_type TEXT NOT NULL CHECK (deadline_type IN ('standard', 'custom')),
  user_id UUID REFERENCES users(id),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
  days_before INTEGER NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced')),
  error_message TEXT
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_clients_firm ON clients(firm_id);
CREATE INDEX idx_clients_active ON clients(firm_id, is_active);
CREATE INDEX idx_client_deadlines_client ON client_deadlines(client_id);
CREATE INDEX idx_client_deadlines_due ON client_deadlines(due_date);
CREATE INDEX idx_client_deadlines_status ON client_deadlines(status);
CREATE INDEX idx_deadline_templates_jurisdiction ON deadline_templates(jurisdiction);
CREATE INDEX idx_deadline_templates_tax_type ON deadline_templates(tax_type);
CREATE INDEX idx_alert_log_deadline ON alert_log(deadline_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_log ENABLE ROW LEVEL SECURITY;

-- Users can only see their own firm's data
CREATE POLICY "Users can view own firm" ON firms
  FOR SELECT USING (id IN (SELECT firm_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view own profile" ON users
  FOR ALL USING (id = auth.uid() OR firm_id IN (SELECT firm_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage own firm clients" ON clients
  FOR ALL USING (firm_id IN (SELECT firm_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage own firm deadlines" ON client_deadlines
  FOR ALL USING (client_id IN (SELECT id FROM clients WHERE firm_id IN (SELECT firm_id FROM users WHERE id = auth.uid())));

CREATE POLICY "Users can manage own firm custom deadlines" ON custom_deadlines
  FOR ALL USING (firm_id IN (SELECT firm_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view own alerts" ON alert_log
  FOR SELECT USING (user_id = auth.uid());

-- Deadline templates are public read
ALTER TABLE deadline_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read deadline templates" ON deadline_templates
  FOR SELECT USING (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to generate deadlines for a client
CREATE OR REPLACE FUNCTION generate_client_deadlines(p_client_id UUID, p_year INTEGER)
RETURNS INTEGER AS $$
DECLARE
  v_client RECORD;
  v_template RECORD;
  v_due_date DATE;
  v_count INTEGER := 0;
BEGIN
  -- Get client info
  SELECT * INTO v_client FROM clients WHERE id = p_client_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Client not found';
  END IF;

  -- Loop through applicable templates
  FOR v_template IN 
    SELECT * FROM deadline_templates 
    WHERE is_active = true
    AND (jurisdiction = 'federal' OR jurisdiction = ANY(v_client.states))
    AND v_client.entity_type = ANY(entity_types)
  LOOP
    -- Calculate due date based on template rules
    -- This is simplified - real implementation would parse base_date_rule JSONB
    v_due_date := (p_year || '-' || (v_template.base_date_rule->>'month') || '-' || (v_template.base_date_rule->>'day'))::DATE;
    
    -- Skip if deadline already exists
    IF NOT EXISTS (
      SELECT 1 FROM client_deadlines 
      WHERE client_id = p_client_id 
      AND template_id = v_template.id 
      AND EXTRACT(YEAR FROM due_date) = p_year
    ) THEN
      INSERT INTO client_deadlines (
        client_id, template_id, name, description, form_number,
        due_date, jurisdiction, tax_type, penalty_info, links
      ) VALUES (
        p_client_id, v_template.id, v_template.name, v_template.description,
        v_template.form_number, v_due_date, v_template.jurisdiction,
        v_template.tax_type, v_template.penalty_info, v_template.links
      );
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_firms_updated_at BEFORE UPDATE ON firms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_client_deadlines_updated_at BEFORE UPDATE ON client_deadlines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_deadline_templates_updated_at BEFORE UPDATE ON deadline_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
