-- 1. Restrict credit_notes visibility
DROP POLICY IF EXISTS "Users view own or unused credit notes; admin/manager all" ON public.credit_notes;
CREATE POLICY "Owner or admin/manager can view credit notes"
ON public.credit_notes FOR SELECT TO authenticated
USING (
  auth.uid() = created_by
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'manager'::app_role)
);

-- 2. Safe lookup for checkout (no client_id / created_by leakage)
CREATE OR REPLACE FUNCTION public.list_available_credit_notes()
RETURNS TABLE(id uuid, amount numeric, date timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cn.id, cn.amount, cn.date
  FROM public.credit_notes cn
  WHERE cn.used = false
    AND auth.uid() IS NOT NULL
  ORDER BY cn.date DESC
$$;
REVOKE ALL ON FUNCTION public.list_available_credit_notes() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_available_credit_notes() TO authenticated;

-- 3. Atomic redemption: reserve first (sale id optional), then attach sale
CREATE OR REPLACE FUNCTION public.mark_credit_note_used(_credit_note_id uuid, _sale_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Non autorisé';
  END IF;

  UPDATE public.credit_notes
    SET used = true,
        used_in_sale_id = COALESCE(_sale_id, used_in_sale_id)
    WHERE id = _credit_note_id
      AND used = false;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket avoir introuvable ou déjà utilisé';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.attach_credit_note_to_sale(_credit_note_id uuid, _sale_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Non autorisé';
  END IF;

  UPDATE public.credit_notes
    SET used_in_sale_id = _sale_id
    WHERE id = _credit_note_id
      AND used = true
      AND used_in_sale_id IS NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.attach_credit_note_to_sale(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.attach_credit_note_to_sale(uuid, uuid) TO authenticated;

-- 4. Server-side file type enforcement on uploads bucket
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
CREATE POLICY "Authenticated users can upload safe images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'uploads'
  AND owner = auth.uid()
  AND lower(storage.extension(name)) IN ('png', 'jpg', 'jpeg', 'webp')
  AND (
    metadata IS NULL
    OR metadata->>'mimetype' IS NULL
    OR lower(metadata->>'mimetype') IN ('image/png', 'image/jpeg', 'image/jpg', 'image/webp')
  )
);

DROP POLICY IF EXISTS "Owners can update own files" ON storage.objects;
CREATE POLICY "Owners can update own safe images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'uploads' AND owner = auth.uid())
WITH CHECK (
  bucket_id = 'uploads'
  AND owner = auth.uid()
  AND lower(storage.extension(name)) IN ('png', 'jpg', 'jpeg', 'webp')
  AND (
    metadata IS NULL
    OR metadata->>'mimetype' IS NULL
    OR lower(metadata->>'mimetype') IN ('image/png', 'image/jpeg', 'image/jpg', 'image/webp')
  )
);