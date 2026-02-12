
-- Fix sale_lines INSERT policy: restrict to users who own the parent sale
DROP POLICY "Authenticated can insert sale lines" ON public.sale_lines;
CREATE POLICY "Users can insert sale lines for own sales" ON public.sale_lines 
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.sales WHERE sales.id = sale_id AND sales.user_id = auth.uid())
  );

-- Fix credit_notes UPDATE policy: restrict to admins/managers or creator
DROP POLICY "Users can update credit notes" ON public.credit_notes;
CREATE POLICY "Admins/managers can update credit notes" ON public.credit_notes 
  FOR UPDATE TO authenticated 
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR auth.uid() = created_by);
