
-- Drop existing restrictive UPDATE policies
DROP POLICY IF EXISTS "Users can update their own user info" ON public.usuario;
DROP POLICY IF EXISTS "Super admins can update any user" ON public.usuario;

-- Recreate as PERMISSIVE (default) so ANY matching policy grants access
CREATE POLICY "Users can update their own user info"
ON public.usuario
FOR UPDATE
TO authenticated
USING (auth.uid() = uid)
WITH CHECK (auth.uid() = uid);

CREATE POLICY "Super admins can update any user"
ON public.usuario
FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.usuario u WHERE u.uid = auth.uid() AND u.superadm = true)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.usuario u WHERE u.uid = auth.uid() AND u.superadm = true)
);

-- Also fix SELECT so super admins can view all users
DROP POLICY IF EXISTS "Users can view their own user info" ON public.usuario;

CREATE POLICY "Users can view their own user info"
ON public.usuario
FOR SELECT
TO authenticated
USING (auth.uid() = uid);

CREATE POLICY "Super admins can view all users"
ON public.usuario
FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.usuario u WHERE u.uid = auth.uid() AND u.superadm = true)
);
