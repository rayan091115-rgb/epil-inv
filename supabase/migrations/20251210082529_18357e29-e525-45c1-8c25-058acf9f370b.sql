-- Fix RLS policy for profiles to allow admins to view all profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Allow users to view their own profile OR admins to view all
CREATE POLICY "Users can view own profile or admins all"
ON public.profiles
FOR SELECT
USING (
  user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
);

-- Allow users to update their own profile OR admins to update all
CREATE POLICY "Users can update own profile or admins all"
ON public.profiles
FOR UPDATE
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Allow admins to insert profiles
CREATE POLICY "Admins can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

-- Allow admins to delete profiles
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));