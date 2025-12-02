-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Usuários podem criar itens de checklist" ON public.checklist_itens;

-- Create new INSERT policy: Only Admin/Gestor can insert
CREATE POLICY "Admin/Gestor pode criar itens de checklist" 
ON public.checklist_itens 
FOR INSERT 
WITH CHECK (is_admin_or_gestor(auth.uid()));

-- Add UPDATE policy for Admin/Gestor
CREATE POLICY "Admin/Gestor pode atualizar itens de checklist" 
ON public.checklist_itens 
FOR UPDATE 
USING (is_admin_or_gestor(auth.uid()));

-- Add DELETE policy for Admin/Gestor
CREATE POLICY "Admin/Gestor pode deletar itens de checklist" 
ON public.checklist_itens 
FOR DELETE 
USING (is_admin_or_gestor(auth.uid()));