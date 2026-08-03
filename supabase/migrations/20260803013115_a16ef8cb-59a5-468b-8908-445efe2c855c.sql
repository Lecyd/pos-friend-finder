CREATE OR REPLACE FUNCTION public.mark_credit_note_used(_credit_note_id uuid, _sale_id uuid)
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
        used_in_sale_id = _sale_id
    WHERE id = _credit_note_id
      AND used = false;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket avoir introuvable ou déjà utilisé';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_credit_note_used(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_credit_note_used(uuid, uuid) TO authenticated;