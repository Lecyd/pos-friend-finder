CREATE OR REPLACE FUNCTION public.settle_deferred_sale(
  _sale_id uuid,
  _amount_received numeric,
  _amount_returned numeric DEFAULT 0,
  _credit_note_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _owner uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Non autorisé';
  END IF;

  SELECT user_id INTO _owner FROM public.sales WHERE id = _sale_id AND status = 'deferred';
  IF _owner IS NULL THEN
    RAISE EXCEPTION 'Facture en attente introuvable';
  END IF;

  IF _owner <> auth.uid()
     AND NOT public.has_role(auth.uid(), 'admin'::app_role)
     AND NOT public.has_role(auth.uid(), 'manager'::app_role) THEN
    RAISE EXCEPTION 'Non autorisé';
  END IF;

  UPDATE public.sales
    SET status = 'completed',
        amount_received = COALESCE(_amount_received, 0),
        amount_returned = COALESCE(_amount_returned, 0),
        credit_note_id = COALESCE(_credit_note_id, credit_note_id),
        date = date
    WHERE id = _sale_id;
END;
$$;

REVOKE ALL ON FUNCTION public.settle_deferred_sale(uuid, numeric, numeric, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.settle_deferred_sale(uuid, numeric, numeric, uuid) TO authenticated;