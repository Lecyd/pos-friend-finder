
CREATE TABLE public.opening_sale (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  is_open boolean NOT NULL DEFAULT false,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.opening_sale ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view opening_sale" ON public.opening_sale FOR SELECT USING (true);
CREATE POLICY "Users can insert opening_sale" ON public.opening_sale FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own opening_sale" ON public.opening_sale FOR UPDATE USING (auth.uid() = user_id);
