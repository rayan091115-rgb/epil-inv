-- Fix RESTRICTIVE policies to PERMISSIVE for profiles table
-- Drop and recreate policies with correct permissive mode

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own profile or admins all" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile or admins all" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;

-- Recreate as PERMISSIVE policies (default behavior)
CREATE POLICY "Profiles viewable by owner or admin"
ON public.profiles FOR SELECT
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Profiles updatable by owner or admin"
ON public.profiles FOR UPDATE
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'))
WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Profiles insertable by system or admin"
ON public.profiles FOR INSERT
WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Profiles deletable by admin only"
ON public.profiles FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Fix user_roles SELECT policy to be permissive
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
CREATE POLICY "User roles viewable by owner or admin"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Fix equipment policies to be permissive
DROP POLICY IF EXISTS "Everyone can view equipment" ON public.equipment;
DROP POLICY IF EXISTS "Admins and moderators can insert equipment" ON public.equipment;
DROP POLICY IF EXISTS "Admins and moderators can update equipment" ON public.equipment;
DROP POLICY IF EXISTS "Only admins can delete equipment" ON public.equipment;

CREATE POLICY "Equipment viewable by authenticated users"
ON public.equipment FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Equipment insertable by admin or moderator"
ON public.equipment FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

CREATE POLICY "Equipment updatable by admin or moderator"
ON public.equipment FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

CREATE POLICY "Equipment deletable by admin only"
ON public.equipment FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Fix system_logs policies
DROP POLICY IF EXISTS "Only admins can view logs" ON public.system_logs;
DROP POLICY IF EXISTS "System can insert logs" ON public.system_logs;

CREATE POLICY "Logs viewable by admin"
ON public.system_logs FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Logs insertable by authenticated users"
ON public.system_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Fix scan_history policies  
DROP POLICY IF EXISTS "Technicians can view scan history" ON public.scan_history;
DROP POLICY IF EXISTS "Technicians can insert scan history" ON public.scan_history;
DROP POLICY IF EXISTS "Technicians can delete scan history" ON public.scan_history;

CREATE POLICY "Scan history viewable by authenticated"
ON public.scan_history FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Scan history insertable by authenticated"
ON public.scan_history FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Scan history deletable by admin"
ON public.scan_history FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));