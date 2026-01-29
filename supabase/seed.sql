-- Seed Data: Deadline Templates
-- Run this AFTER schema.sql

-- ============================================
-- FEDERAL DEADLINES
-- ============================================

-- Individual Tax
INSERT INTO deadline_templates (jurisdiction, tax_type, entity_types, name, description, form_number, base_date_rule, penalty_info, links) VALUES
('federal', 'income', ARRAY['individual'], 'Individual Tax Return', 'Annual individual income tax return', '1040', '{"month": "04", "day": "15", "type": "fixed"}', 'Failure-to-file penalty: 5% per month up to 25%. Failure-to-pay: 0.5% per month.', '[{"name": "IRS Free File", "url": "https://www.irs.gov/filing/free-file-do-your-federal-taxes-for-free"}, {"name": "IRS Direct Pay", "url": "https://www.irs.gov/payments/direct-pay"}]'),
('federal', 'income', ARRAY['individual'], 'Extended Individual Return', 'Individual return on 6-month extension', '1040', '{"month": "10", "day": "15", "type": "fixed"}', 'Extension only extends filing, not payment. Interest accrues from April 15.', '[{"name": "IRS Free File", "url": "https://www.irs.gov/filing/free-file-do-your-federal-taxes-for-free"}]');

-- S-Corp
INSERT INTO deadline_templates (jurisdiction, tax_type, entity_types, name, description, form_number, base_date_rule, penalty_info, links) VALUES
('federal', 'income', ARRAY['s_corp'], 'S-Corp Tax Return', 'Annual S-Corporation income tax return', '1120S', '{"month": "03", "day": "15", "type": "fixed"}', 'Penalty: $220/month per shareholder (2024 rate), up to 12 months.', '[{"name": "Form 1120S Instructions", "url": "https://www.irs.gov/instructions/i1120s"}]'),
('federal', 'income', ARRAY['s_corp'], 'Extended S-Corp Return', 'S-Corp return on 6-month extension', '1120S', '{"month": "09", "day": "15", "type": "fixed"}', 'Extension only extends filing. Penalties apply for late filing.', '[{"name": "Form 7004", "url": "https://www.irs.gov/forms-pubs/about-form-7004"}]');

-- C-Corp
INSERT INTO deadline_templates (jurisdiction, tax_type, entity_types, name, description, form_number, base_date_rule, penalty_info, links) VALUES
('federal', 'income', ARRAY['c_corp'], 'C-Corp Tax Return', 'Annual C-Corporation income tax return', '1120', '{"month": "04", "day": "15", "type": "fixed"}', 'Failure-to-file: 5% per month. Failure-to-pay: 0.5% per month. Max 25%.', '[{"name": "Form 1120 Instructions", "url": "https://www.irs.gov/instructions/i1120"}]'),
('federal', 'income', ARRAY['c_corp'], 'Extended C-Corp Return', 'C-Corp return on 6-month extension', '1120', '{"month": "10", "day": "15", "type": "fixed"}', 'Extension only extends filing, not payment.', '[{"name": "Form 7004", "url": "https://www.irs.gov/forms-pubs/about-form-7004"}]');

-- Partnership
INSERT INTO deadline_templates (jurisdiction, tax_type, entity_types, name, description, form_number, base_date_rule, penalty_info, links) VALUES
('federal', 'income', ARRAY['partnership', 'llc'], 'Partnership Tax Return', 'Annual partnership/LLC tax return', '1065', '{"month": "03", "day": "15", "type": "fixed"}', 'Penalty: $220/month per partner (2024 rate), up to 12 months.', '[{"name": "Form 1065 Instructions", "url": "https://www.irs.gov/instructions/i1065"}]'),
('federal', 'income', ARRAY['partnership', 'llc'], 'Extended Partnership Return', 'Partnership return on 6-month extension', '1065', '{"month": "09", "day": "15", "type": "fixed"}', 'Extension only extends filing.', '[{"name": "Form 7004", "url": "https://www.irs.gov/forms-pubs/about-form-7004"}]');

-- Estimated Tax
INSERT INTO deadline_templates (jurisdiction, tax_type, entity_types, name, description, form_number, base_date_rule, penalty_info, links) VALUES
('federal', 'estimated', ARRAY['individual', 'sole_prop', 'llc', 's_corp', 'c_corp', 'partnership'], 'Q1 Estimated Tax', 'First quarter estimated tax payment', '1040-ES', '{"month": "04", "day": "15", "type": "fixed"}', 'Underpayment penalty ~8% annually on shortfall.', '[{"name": "EFTPS", "url": "https://www.eftps.gov"}, {"name": "IRS Direct Pay", "url": "https://www.irs.gov/payments/direct-pay"}]'),
('federal', 'estimated', ARRAY['individual', 'sole_prop', 'llc', 's_corp', 'c_corp', 'partnership'], 'Q2 Estimated Tax', 'Second quarter estimated tax payment', '1040-ES', '{"month": "06", "day": "15", "type": "fixed"}', 'Underpayment penalty ~8% annually on shortfall.', '[{"name": "EFTPS", "url": "https://www.eftps.gov"}, {"name": "IRS Direct Pay", "url": "https://www.irs.gov/payments/direct-pay"}]'),
('federal', 'estimated', ARRAY['individual', 'sole_prop', 'llc', 's_corp', 'c_corp', 'partnership'], 'Q3 Estimated Tax', 'Third quarter estimated tax payment', '1040-ES', '{"month": "09", "day": "15", "type": "fixed"}', 'Underpayment penalty ~8% annually on shortfall.', '[{"name": "EFTPS", "url": "https://www.eftps.gov"}, {"name": "IRS Direct Pay", "url": "https://www.irs.gov/payments/direct-pay"}]'),
('federal', 'estimated', ARRAY['individual', 'sole_prop', 'llc', 's_corp', 'c_corp', 'partnership'], 'Q4 Estimated Tax', 'Fourth quarter estimated tax payment', '1040-ES', '{"month": "01", "day": "15", "type": "fixed", "year_offset": 1}', 'Underpayment penalty ~8% annually on shortfall.', '[{"name": "EFTPS", "url": "https://www.eftps.gov"}, {"name": "IRS Direct Pay", "url": "https://www.irs.gov/payments/direct-pay"}]');

-- Payroll (941)
INSERT INTO deadline_templates (jurisdiction, tax_type, entity_types, name, description, form_number, base_date_rule, penalty_info, links) VALUES
('federal', 'payroll', ARRAY['sole_prop', 'llc', 's_corp', 'c_corp', 'partnership', 'non_profit'], 'Q1 Payroll Tax Return', 'Quarterly federal payroll tax return', '941', '{"month": "04", "day": "30", "type": "fixed"}', 'Failure-to-file: 5%/month. Failure-to-deposit: 2-15% depending on lateness.', '[{"name": "Form 941", "url": "https://www.irs.gov/forms-pubs/about-form-941"}, {"name": "EFTPS", "url": "https://www.eftps.gov"}]'),
('federal', 'payroll', ARRAY['sole_prop', 'llc', 's_corp', 'c_corp', 'partnership', 'non_profit'], 'Q2 Payroll Tax Return', 'Quarterly federal payroll tax return', '941', '{"month": "07", "day": "31", "type": "fixed"}', 'Failure-to-file: 5%/month. Failure-to-deposit: 2-15% depending on lateness.', '[{"name": "Form 941", "url": "https://www.irs.gov/forms-pubs/about-form-941"}]'),
('federal', 'payroll', ARRAY['sole_prop', 'llc', 's_corp', 'c_corp', 'partnership', 'non_profit'], 'Q3 Payroll Tax Return', 'Quarterly federal payroll tax return', '941', '{"month": "10", "day": "31", "type": "fixed"}', 'Failure-to-file: 5%/month. Failure-to-deposit: 2-15% depending on lateness.', '[{"name": "Form 941", "url": "https://www.irs.gov/forms-pubs/about-form-941"}]'),
('federal', 'payroll', ARRAY['sole_prop', 'llc', 's_corp', 'c_corp', 'partnership', 'non_profit'], 'Q4 Payroll Tax Return', 'Quarterly federal payroll tax return', '941', '{"month": "01", "day": "31", "type": "fixed", "year_offset": 1}', 'Failure-to-file: 5%/month. Failure-to-deposit: 2-15% depending on lateness.', '[{"name": "Form 941", "url": "https://www.irs.gov/forms-pubs/about-form-941"}]');

-- Annual Payroll
INSERT INTO deadline_templates (jurisdiction, tax_type, entity_types, name, description, form_number, base_date_rule, penalty_info, links) VALUES
('federal', 'payroll', ARRAY['sole_prop', 'llc', 's_corp', 'c_corp', 'partnership', 'non_profit'], 'Annual FUTA Return', 'Federal unemployment tax return', '940', '{"month": "01", "day": "31", "type": "fixed", "year_offset": 1}', 'Penalty for late deposit: 2-15%. Late filing: 5%/month up to 25%.', '[{"name": "Form 940", "url": "https://www.irs.gov/forms-pubs/about-form-940"}]'),
('federal', 'payroll', ARRAY['sole_prop', 'llc', 's_corp', 'c_corp', 'partnership', 'non_profit'], 'W-2 to Employees', 'Provide W-2 forms to employees', 'W-2', '{"month": "01", "day": "31", "type": "fixed", "year_offset": 1}', 'Penalty: $60-$310 per form depending on lateness.', '[{"name": "W-2 Instructions", "url": "https://www.irs.gov/instructions/iw2w3"}]'),
('federal', 'payroll', ARRAY['sole_prop', 'llc', 's_corp', 'c_corp', 'partnership', 'non_profit'], 'W-2/W-3 to SSA', 'File W-2/W-3 with Social Security', 'W-2/W-3', '{"month": "01", "day": "31", "type": "fixed", "year_offset": 1}', 'Penalty: $60-$310 per form depending on lateness.', '[{"name": "SSA BSO", "url": "https://www.ssa.gov/bso/bsowelcome.htm"}]');

-- 1099s
INSERT INTO deadline_templates (jurisdiction, tax_type, entity_types, name, description, form_number, base_date_rule, penalty_info, links) VALUES
('federal', 'information', ARRAY['sole_prop', 'llc', 's_corp', 'c_corp', 'partnership', 'non_profit'], '1099-NEC Filing', 'Nonemployee compensation reporting', '1099-NEC', '{"month": "01", "day": "31", "type": "fixed", "year_offset": 1}', 'Penalty: $60-$310 per form depending on lateness.', '[{"name": "Form 1099-NEC", "url": "https://www.irs.gov/forms-pubs/about-form-1099-nec"}]'),
('federal', 'information', ARRAY['sole_prop', 'llc', 's_corp', 'c_corp', 'partnership', 'non_profit'], '1099-MISC Filing (paper)', 'Miscellaneous income reporting (paper)', '1099-MISC', '{"month": "02", "day": "28", "type": "fixed", "year_offset": 1}', 'Penalty: $60-$310 per form.', '[{"name": "Form 1099-MISC", "url": "https://www.irs.gov/forms-pubs/about-form-1099-misc"}]'),
('federal', 'information', ARRAY['sole_prop', 'llc', 's_corp', 'c_corp', 'partnership', 'non_profit'], '1099-MISC Filing (electronic)', 'Miscellaneous income reporting (e-file)', '1099-MISC', '{"month": "03", "day": "31", "type": "fixed", "year_offset": 1}', 'Penalty: $60-$310 per form.', '[{"name": "IRS FIRE System", "url": "https://www.irs.gov/e-file-providers/filing-information-returns-electronically-fire"}]');

-- ============================================
-- CALIFORNIA DEADLINES
-- ============================================

INSERT INTO deadline_templates (jurisdiction, tax_type, entity_types, name, description, form_number, base_date_rule, penalty_info, links) VALUES
('CA', 'income', ARRAY['individual'], 'CA Individual Tax Return', 'California individual income tax', '540', '{"month": "04", "day": "15", "type": "fixed"}', 'Penalty: 5% + 0.5%/month. Interest on unpaid tax.', '[{"name": "FTB e-file", "url": "https://www.ftb.ca.gov/file/ways-to-file/online/index.html"}]'),
('CA', 'income', ARRAY['s_corp'], 'CA S-Corp Return', 'California S-Corporation return', '100S', '{"month": "03", "day": "15", "type": "fixed"}', 'Penalty: $18/shareholder/month.', '[{"name": "FTB Forms", "url": "https://www.ftb.ca.gov/forms/index.html"}]'),
('CA', 'income', ARRAY['c_corp'], 'CA C-Corp Return', 'California C-Corporation return', '100', '{"month": "04", "day": "15", "type": "fixed"}', 'Penalty: 5% + 0.5%/month of unpaid tax.', '[{"name": "FTB Forms", "url": "https://www.ftb.ca.gov/forms/index.html"}]'),
('CA', 'income', ARRAY['partnership', 'llc'], 'CA Partnership/LLC Return', 'California partnership/LLC return', '565/568', '{"month": "03", "day": "15", "type": "fixed"}', 'Penalty: $18/partner/month.', '[{"name": "FTB Forms", "url": "https://www.ftb.ca.gov/forms/index.html"}]'),
('CA', 'franchise', ARRAY['llc', 's_corp', 'c_corp', 'partnership'], 'CA Minimum Franchise Tax', 'Annual $800 minimum franchise tax', '3522', '{"month": "04", "day": "15", "type": "fixed"}', '$800 minimum tax due regardless of income.', '[{"name": "FTB Pay", "url": "https://www.ftb.ca.gov/pay/index.html"}]'),
('CA', 'franchise', ARRAY['llc'], 'CA LLC Fee', 'Annual LLC fee for LLCs with >$250K gross receipts', '3536', '{"month": "06", "day": "15", "type": "fixed"}', 'Fee ranges $900-$11,790 based on gross receipts.', '[{"name": "LLC Fee Table", "url": "https://www.ftb.ca.gov/file/business/types/limited-liability-company/index.html"}]');

-- ============================================
-- TEXAS DEADLINES
-- ============================================

INSERT INTO deadline_templates (jurisdiction, tax_type, entity_types, name, description, form_number, base_date_rule, penalty_info, links) VALUES
('TX', 'franchise', ARRAY['llc', 's_corp', 'c_corp', 'partnership'], 'TX Franchise Tax Return', 'Texas franchise tax return', '05-158', '{"month": "05", "day": "15", "type": "fixed"}', 'Penalty: 5% if 1-30 days late, 10% if >30 days late.', '[{"name": "TX Comptroller", "url": "https://comptroller.texas.gov/taxes/franchise/"}]'),
('TX', 'franchise', ARRAY['llc', 's_corp', 'c_corp', 'partnership'], 'TX Public Information Report', 'Annual public information report', '05-102', '{"month": "05", "day": "15", "type": "fixed"}', 'Must be filed with franchise tax return.', '[{"name": "TX Comptroller", "url": "https://comptroller.texas.gov/taxes/franchise/"}]'),
('TX', 'franchise', ARRAY['llc', 's_corp', 'c_corp', 'partnership'], 'TX Extended Franchise Tax', 'Franchise tax on extension', '05-158', '{"month": "11", "day": "15", "type": "fixed"}', 'Extension is automatic if 90% of tax paid by May 15.', '[{"name": "TX Comptroller", "url": "https://comptroller.texas.gov/taxes/franchise/"}]');

-- ============================================
-- NEW YORK DEADLINES
-- ============================================

INSERT INTO deadline_templates (jurisdiction, tax_type, entity_types, name, description, form_number, base_date_rule, penalty_info, links) VALUES
('NY', 'income', ARRAY['individual'], 'NY Individual Tax Return', 'New York individual income tax', 'IT-201', '{"month": "04", "day": "15", "type": "fixed"}', 'Penalty: 5%/month up to 25%. Interest on unpaid tax.', '[{"name": "NY Tax Online", "url": "https://www.tax.ny.gov/online/"}]'),
('NY', 'income', ARRAY['s_corp'], 'NY S-Corp Return', 'New York S-Corporation return', 'CT-3-S', '{"month": "03", "day": "15", "type": "fixed"}', 'Penalty: $50/shareholder/month.', '[{"name": "NY Tax Forms", "url": "https://www.tax.ny.gov/forms/"}]'),
('NY', 'income', ARRAY['c_corp'], 'NY C-Corp Return', 'New York C-Corporation return', 'CT-3', '{"month": "04", "day": "15", "type": "fixed"}', 'Penalty: 5%/month up to 25%.', '[{"name": "NY Tax Forms", "url": "https://www.tax.ny.gov/forms/"}]'),
('NY', 'income', ARRAY['partnership', 'llc'], 'NY Partnership Return', 'New York partnership return', 'IT-204', '{"month": "03", "day": "15", "type": "fixed"}', 'Penalty: $50/partner/month.', '[{"name": "NY Tax Forms", "url": "https://www.tax.ny.gov/forms/"}]');

-- ============================================
-- FLORIDA DEADLINES
-- ============================================

INSERT INTO deadline_templates (jurisdiction, tax_type, entity_types, name, description, form_number, base_date_rule, penalty_info, links) VALUES
('FL', 'income', ARRAY['c_corp'], 'FL Corporate Income Tax', 'Florida corporate income tax (C-Corps only)', 'F-1120', '{"month": "05", "day": "01", "type": "fixed"}', 'Penalty: 10% per month up to 50%.', '[{"name": "FL DOR", "url": "https://floridarevenue.com/taxes/taxesfees/Pages/corporate.aspx"}]'),
('FL', 'annual', ARRAY['llc', 's_corp', 'c_corp', 'partnership'], 'FL Annual Report', 'Florida annual report filing', 'N/A', '{"month": "05", "day": "01", "type": "fixed"}', '$400 late fee after May 1.', '[{"name": "Sunbiz", "url": "https://dos.myflorida.com/sunbiz/"}]');

-- ============================================
-- ILLINOIS DEADLINES
-- ============================================

INSERT INTO deadline_templates (jurisdiction, tax_type, entity_types, name, description, form_number, base_date_rule, penalty_info, links) VALUES
('IL', 'income', ARRAY['individual'], 'IL Individual Tax Return', 'Illinois individual income tax', 'IL-1040', '{"month": "04", "day": "15", "type": "fixed"}', 'Penalty: 2%/month up to 25%.', '[{"name": "IL MyTax", "url": "https://mytax.illinois.gov/"}]'),
('IL', 'income', ARRAY['s_corp', 'c_corp'], 'IL Corporate Income Tax', 'Illinois corporate income tax', 'IL-1120', '{"month": "04", "day": "15", "type": "fixed"}', 'Penalty: 2%/month up to 25%.', '[{"name": "IL MyTax", "url": "https://mytax.illinois.gov/"}]'),
('IL', 'income', ARRAY['partnership', 'llc'], 'IL Partnership Return', 'Illinois partnership return', 'IL-1065', '{"month": "04", "day": "15", "type": "fixed"}', 'Penalty: $150/partner/month.', '[{"name": "IL MyTax", "url": "https://mytax.illinois.gov/"}]'),
('IL', 'annual', ARRAY['llc', 's_corp', 'c_corp', 'partnership'], 'IL Annual Report', 'Illinois annual report', 'N/A', '{"month": "anniversary", "day": "first", "type": "anniversary"}', '$100-$300 depending on entity type.', '[{"name": "IL SOS", "url": "https://www.ilsos.gov/corporatellc/"}]');
