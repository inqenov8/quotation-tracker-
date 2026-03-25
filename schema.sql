-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT NOT NULL CHECK (role IN ('submitter', 'approver', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Quotes table
CREATE TABLE public.quotes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quote_id TEXT UNIQUE NOT NULL,
  date_received DATE NOT NULL,
  requested_by_am TEXT,
  requested_by_sa TEXT,
  source_channel TEXT,
  customer TEXT NOT NULL,
  opportunity_value NUMERIC(15,2),
  deal_stage TEXT,
  product_pillar TEXT NOT NULL,
  engagement_type TEXT,
  scope_description TEXT,
  special_requirements TEXT,
  assigned_pricer TEXT,
  vendor_cost NUMERIC(15,2),
  quoted_price NUMERIC(15,2),
  submitted_for_approval BOOLEAN DEFAULT false,
  approved_by TEXT,
  approval_date DATE,
  approval_decision TEXT,
  quote_status TEXT NOT NULL,
  dispatch_target TEXT,
  dispatched_to TEXT,
  date_dispatched DATE,
  remarks TEXT,
  request_type TEXT,
  expected_close_date DATE,
  internal_notes TEXT,
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Pricing line items
CREATE TABLE public.pricing_line_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  cost_item_desc TEXT NOT NULL,
  category TEXT,
  vendor_source TEXT,
  unit_cost NUMERIC(15,2) NOT NULL,
  qty NUMERIC(10,2) NOT NULL,
  total_cost NUMERIC(15,2) GENERATED ALWAYS AS (unit_cost * qty) STORED,
  markup_pct NUMERIC(5,2) NOT NULL,
  selling_price NUMERIC(15,2) GENERATED ALWAYS AS (total_cost * (1 + markup_pct)) STORED,
  notes TEXT,
  include_in_total BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Approval requests
CREATE TABLE public.approval_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  date_submitted DATE NOT NULL,
  submitted_by UUID REFERENCES profiles(id),
  customer TEXT,
  product_pillar TEXT,
  scope_summary TEXT,
  vendor_cost NUMERIC(15,2),
  quoted_price NUMERIC(15,2),
  gross_margin NUMERIC(15,2) GENERATED ALWAYS AS (quoted_price - vendor_cost) STORED,
  margin_pct NUMERIC(5,2) GENERATED ALWAYS AS ( (quoted_price - vendor_cost) / quoted_price ) STORED,
  approver UUID REFERENCES profiles(id),
  date_reviewed DATE,
  decision TEXT NOT NULL CHECK (decision IN ('Pending Approval','Approved','Revision Requested','Rejected')),
  conditions_comments TEXT,
  approved_version TEXT,
  followup_required BOOLEAN DEFAULT false,
  resubmission_count INTEGER DEFAULT 0,
  submission_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Dispatch log
CREATE TABLE public.dispatch_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  customer TEXT,
  approved_by TEXT,
  approval_date DATE,
  dispatched_by UUID REFERENCES profiles(id),
  dispatch_date DATE NOT NULL,
  sent_to_name TEXT,
  recipient_role TEXT,
  dispatch_method TEXT,
  quote_version TEXT,
  validity_days INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatch_log ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Quotes: submitters can read own; approvers/admins read all
CREATE POLICY "Submitters read own quotes" ON public.quotes FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Approvers and admins read all quotes" ON public.quotes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('approver', 'admin'))
);
CREATE POLICY "Submitters insert own quotes" ON public.quotes FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Submitters update own quotes" ON public.quotes FOR UPDATE USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Admins update any quote" ON public.quotes FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Pricing line items: policy based on quote ownership (simplified)
CREATE POLICY "Access based on quote ownership" ON public.pricing_line_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.quotes WHERE id = quote_id AND (created_by = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('approver', 'admin'))))
);

-- Approval requests: approvers/admins read all, submitters read own
CREATE POLICY "Approvers and admins read all approval requests" ON public.approval_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('approver', 'admin'))
);
CREATE POLICY "Submitters read own approval requests" ON public.approval_requests FOR SELECT USING (
  auth.uid() = submitted_by
);
CREATE POLICY "Submitters can insert" ON public.approval_requests FOR INSERT WITH CHECK (auth.uid() = submitted_by);
CREATE POLICY "Approvers can update" ON public.approval_requests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('approver', 'admin'))
);

-- Dispatch log: all authenticated can read, submitters/admins can insert
CREATE POLICY "All authenticated can read dispatch logs" ON public.dispatch_log FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Submitters and admins can insert" ON public.dispatch_log FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('submitter', 'admin'))
);

-- Optional: trigger to auto-create profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name', 'submitter');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
