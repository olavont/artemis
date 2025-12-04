-- Drop existing delete policy
DROP POLICY IF EXISTS "Admin pode deletar viaturas" ON public.viaturas;

-- Create new policy allowing both admin and gestor to delete
CREATE POLICY "Admin/Gestor pode deletar viaturas" 
ON public.viaturas 
FOR DELETE 
USING (is_admin_or_gestor(auth.uid()));