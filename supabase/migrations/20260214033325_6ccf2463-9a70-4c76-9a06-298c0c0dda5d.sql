CREATE POLICY "Authenticated can update product stock"
ON public.products
FOR UPDATE
USING (true)
WITH CHECK (true);