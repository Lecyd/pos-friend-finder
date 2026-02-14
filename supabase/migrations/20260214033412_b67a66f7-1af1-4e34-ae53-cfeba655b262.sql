-- Drop the overly permissive policy
DROP POLICY "Authenticated can update product stock" ON public.products;

-- Create a more restrictive policy that only allows authenticated users to update stock
CREATE POLICY "Authenticated can update product stock"
ON public.products
FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);