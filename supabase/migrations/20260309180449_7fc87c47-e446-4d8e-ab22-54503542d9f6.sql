
-- Create a SECURITY DEFINER function to check superadm status (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_superadm(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuario
    WHERE uid = _user_id
      AND superadm = true
  )
$$;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own user info" ON public.usuario;
DROP POLICY IF EXISTS "Super admins can view all users" ON public.usuario;
DROP POLICY IF EXISTS "Users can update their own user info" ON public.usuario;
DROP POLICY IF EXISTS "Super admins can update any user" ON public.usuario;

-- Recreate SELECT policies using the function
CREATE POLICY "Users can view their own user info"
ON public.usuario
FOR SELECT
TO authenticated
USING (auth.uid() = uid);

CREATE POLICY "Super admins can view all users"
ON public.usuario
FOR SELECT
TO authenticated
USING (public.is_superadm(auth.uid()));

-- Recreate UPDATE policies using the function
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
USING (public.is_superadm(auth.uid()))
WITH CHECK (public.is_superadm(auth.uid()));
