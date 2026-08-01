ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS phone2 text NOT NULL DEFAULT '';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS phone3 text NOT NULL DEFAULT '';

ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS server_employee_id uuid REFERENCES public.employees(id);
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS server_name text;

CREATE OR REPLACE FUNCTION public.list_active_employees()
RETURNS TABLE (id uuid, nom text, prenoms text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.id, e.nom, e.prenoms
  FROM public.employees e
  WHERE e.active = true
    AND auth.uid() IS NOT NULL
  ORDER BY e.nom, e.prenoms
$$;

REVOKE ALL ON FUNCTION public.list_active_employees() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_active_employees() TO authenticated;