-- Drop the existing permissive policy
DROP POLICY IF EXISTS "Usuários podem ver checklists relacionados" ON public.checklists_veiculo;

-- Create new policy: Admin/Gestor can see all, agents only see their own
CREATE POLICY "Usuários podem ver checklists relacionados" 
ON public.checklists_veiculo 
FOR SELECT 
USING (
  -- Admin/Gestor can see all checklists
  is_admin_or_gestor(auth.uid())
  OR
  -- Agents can only see checklists from their own protocols (empenho)
  (protocolo_empenho_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.protocolos_empenho 
    WHERE id = protocolo_empenho_id 
    AND agente_responsavel_id = auth.uid()
  ))
  OR
  -- Agents can only see checklists from their own protocols (devolução)
  (protocolo_devolucao_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.protocolos_devolucao 
    WHERE id = protocolo_devolucao_id 
    AND agente_responsavel_id = auth.uid()
  ))
);