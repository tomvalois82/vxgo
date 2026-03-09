
CREATE POLICY "Super admins can update any user"
ON public.usuario
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.usuario u
    WHERE u.uid = auth.uid() AND u.superadm = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.usuario u
    WHERE u.uid = auth.uid() AND u.superadm = true
  )
);
