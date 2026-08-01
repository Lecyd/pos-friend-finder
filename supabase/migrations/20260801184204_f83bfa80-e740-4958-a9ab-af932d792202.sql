CREATE OR REPLACE FUNCTION public.list_suppliers()
RETURNS TABLE (id uuid, name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.name
  FROM public.suppliers s
  WHERE auth.uid() IS NOT NULL
  ORDER BY s.name
$$;

REVOKE ALL ON FUNCTION public.list_suppliers() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_suppliers() TO authenticated;