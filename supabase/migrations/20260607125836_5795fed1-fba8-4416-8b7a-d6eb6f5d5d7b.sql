
-- 1. Restrict employees/employee_roles/opening_sale SELECT to authenticated
ALTER POLICY "Authenticated can view employees" ON public.employees TO authenticated;
ALTER POLICY "Admins can manage employees" ON public.employees TO authenticated;
ALTER POLICY "Authenticated can view employee_roles" ON public.employee_roles TO authenticated;
ALTER POLICY "Admins can manage employee_roles" ON public.employee_roles TO authenticated;
ALTER POLICY "Authenticated can view opening_sale" ON public.opening_sale TO authenticated;
ALTER POLICY "Users can insert opening_sale" ON public.opening_sale TO authenticated;
ALTER POLICY "Users can update own opening_sale" ON public.opening_sale TO authenticated;

-- 2. Products: drop overpermissive UPDATE, create secure stock decrement RPC
DROP POLICY IF EXISTS "Authenticated can update product stock" ON public.products;

CREATE OR REPLACE FUNCTION public.decrement_product_stock(_product_id uuid, _qty integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Non autorisé';
  END IF;
  IF _qty <= 0 THEN
    RAISE EXCEPTION 'Quantité invalide';
  END IF;
  UPDATE public.products
    SET stock = stock - _qty,
        updated_at = now()
    WHERE id = _product_id AND stock >= _qty;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stock insuffisant ou produit introuvable';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.decrement_product_stock(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.decrement_product_stock(uuid, integer) TO authenticated;

-- 3. Revoke EXECUTE on internal SECURITY DEFINER functions from anon
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 4. Storage: drop overly broad policies, recreate scoped to owner for write ops
DROP POLICY IF EXISTS "Public read access on uploads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;

CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'uploads' AND owner = auth.uid());

CREATE POLICY "Owners can update own files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'uploads' AND owner = auth.uid())
WITH CHECK (bucket_id = 'uploads' AND owner = auth.uid());

CREATE POLICY "Owners or admins can delete files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'uploads' AND (
    owner = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'manager'::app_role)
  )
);
