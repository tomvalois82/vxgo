
-- Enable RLS on crm_funil
ALTER TABLE public.crm_funil ENABLE ROW LEVEL SECURITY;

-- SELECT: users can see funis matching their config
CREATE POLICY "Users can view funis by config"
ON public.crm_funil
FOR SELECT
TO authenticated
USING (
  config = (SELECT u.config FROM public.usuario u WHERE u.uid = auth.uid() LIMIT 1)
);

-- INSERT: only superadm
CREATE POLICY "Superadm can insert funis"
ON public.crm_funil
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.usuario u WHERE u.uid = auth.uid() AND u.superadm = true)
);

-- UPDATE: only superadm
CREATE POLICY "Superadm can update funis"
ON public.crm_funil
FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.usuario u WHERE u.uid = auth.uid() AND u.superadm = true)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.usuario u WHERE u.uid = auth.uid() AND u.superadm = true)
);

-- DELETE: only superadm
CREATE POLICY "Superadm can delete funis"
ON public.crm_funil
FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.usuario u WHERE u.uid = auth.uid() AND u.superadm = true)
);
