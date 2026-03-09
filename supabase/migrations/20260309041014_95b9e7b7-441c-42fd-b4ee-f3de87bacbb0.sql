-- Remove insecure policy that allowed users to manage their own roles
DROP POLICY IF EXISTS "Service role can manage roles" ON public.user_roles;

-- Keep only read access to own roles; no INSERT/UPDATE/DELETE policies for authenticated users
-- (role assignment should only happen through trusted backend/service operations)