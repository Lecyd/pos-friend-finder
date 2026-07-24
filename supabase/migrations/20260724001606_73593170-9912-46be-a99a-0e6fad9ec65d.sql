
-- Revoke anon SELECT on all public tables (prevents GraphQL/PostgREST discovery)
REVOKE SELECT ON ALL TABLES IN SCHEMA public FROM anon;

-- profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users view own profile or admin/manager view all"
ON public.profiles FOR SELECT TO authenticated
USING (
  auth.uid() = id
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
);

-- employees
DROP POLICY IF EXISTS "Authenticated can view employees" ON public.employees;
CREATE POLICY "Admins/managers view employees"
ON public.employees FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
);

-- sales
DROP POLICY IF EXISTS "Authenticated can view sales" ON public.sales;
CREATE POLICY "Users view own sales or admin/manager view all"
ON public.sales FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
);

-- sale_lines
DROP POLICY IF EXISTS "Authenticated can view sale lines" ON public.sale_lines;
CREATE POLICY "Users view own sale lines or admin/manager view all"
ON public.sale_lines FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.sales s WHERE s.id = sale_lines.sale_id AND s.user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
);

-- expenses
DROP POLICY IF EXISTS "Authenticated can view expenses" ON public.expenses;
CREATE POLICY "Users view own expenses or admin/manager view all"
ON public.expenses FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
);

-- stock_entries
DROP POLICY IF EXISTS "Authenticated can view stock entries" ON public.stock_entries;
CREATE POLICY "Users view own stock entries or admin/manager view all"
ON public.stock_entries FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
);

-- credit_notes (cashiers still need to see unused avoirs to apply them at checkout)
DROP POLICY IF EXISTS "Authenticated can view credit notes" ON public.credit_notes;
CREATE POLICY "Users view own or unused credit notes; admin/manager all"
ON public.credit_notes FOR SELECT TO authenticated
USING (
  auth.uid() = created_by
  OR used = false
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
);

-- day_closures
DROP POLICY IF EXISTS "Authenticated can view day closures" ON public.day_closures;
CREATE POLICY "Users view own day closures or admin/manager view all"
ON public.day_closures FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
);

-- opening_sale
DROP POLICY IF EXISTS "Authenticated can view opening_sale" ON public.opening_sale;
CREATE POLICY "Users view own opening_sale or admin/manager view all"
ON public.opening_sale FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
);

-- suppliers
DROP POLICY IF EXISTS "Authenticated can view suppliers" ON public.suppliers;
CREATE POLICY "Admins/managers view suppliers"
ON public.suppliers FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
);
