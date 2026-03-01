
-- Create employee_roles table
CREATE TABLE public.employee_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage employee_roles" ON public.employee_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view employee_roles" ON public.employee_roles FOR SELECT
  USING (true);

-- Seed default roles
INSERT INTO public.employee_roles (name) VALUES
  ('Serveuse'), ('Gardien'), ('Cuisinière'), ('Agent nettoyage'), ('Caissière'), ('Manager'), ('Livreur');

-- Create employees table
CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  prenoms text NOT NULL,
  telephone text,
  photo_url text,
  salaire numeric NOT NULL DEFAULT 0,
  role_id uuid REFERENCES public.employee_roles(id) ON DELETE SET NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage employees" ON public.employees FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view employees" ON public.employees FOR SELECT
  USING (true);
