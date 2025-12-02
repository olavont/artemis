-- Criar tipos enum
CREATE TYPE public.app_role AS ENUM ('agente', 'gestor', 'admin');
CREATE TYPE public.perfil_usuario AS ENUM ('agente', 'gestor', 'admin');
CREATE TYPE public.status_operacional AS ENUM ('disponivel', 'empenhada', 'devolvida', 'manutencao', 'inoperante', 'acidentada', 'batida');
CREATE TYPE public.situacao_licenciamento AS ENUM ('regular', 'irregular', 'vencido', 'em_processo');
CREATE TYPE public.tipo_item AS ENUM ('equipamento', 'ferramenta', 'epi', 'documento', 'acessorio', 'outro');
CREATE TYPE public.categoria_item AS ENUM ('seguranca', 'sinalizacao', 'mecanico', 'eletrico', 'comunicacao', 'outro');
CREATE TYPE public.obrigatoriedade_item AS ENUM ('obrigatorio', 'recomendado', 'opcional');
CREATE TYPE public.situacao_item AS ENUM ('sim', 'nao', 'tem', 'nao_tem', 'em_condicoes', 'sem_condicoes', 'bom', 'mau');
CREATE TYPE public.tipo_checklist AS ENUM ('empenho', 'devolucao');
CREATE TYPE public.condicao_mecanica AS ENUM ('em_condicoes', 'sem_condicoes');
CREATE TYPE public.estado_geral AS ENUM ('bom', 'mau', 'regular');
CREATE TYPE public.status_protocolo AS ENUM ('em_andamento', 'concluido', 'cancelado');
CREATE TYPE public.tipo_foto AS ENUM ('veiculo_geral', 'dano', 'item', 'painel', 'outro');

-- Tabela de perfis de usuários
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  matricula TEXT UNIQUE,
  perfil perfil_usuario NOT NULL DEFAULT 'agente',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de viaturas
CREATE TABLE public.viaturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placa TEXT UNIQUE NOT NULL,
  prefixo TEXT UNIQUE NOT NULL,
  chassi TEXT,
  renavam TEXT,
  marca TEXT,
  modelo TEXT,
  ano_fabricacao INTEGER,
  especie TEXT,
  categoria TEXT,
  tipo TEXT,
  situacao_licenciamento situacao_licenciamento DEFAULT 'regular',
  status_operacional status_operacional NOT NULL DEFAULT 'disponivel',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de itens de viatura
CREATE TABLE public.itens_viatura (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo tipo_item NOT NULL,
  categoria categoria_item NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de configuração de itens por viatura
CREATE TABLE public.viatura_itens_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viatura_id UUID REFERENCES public.viaturas(id) ON DELETE CASCADE,
  item_viatura_id UUID REFERENCES public.itens_viatura(id) ON DELETE CASCADE,
  quantidade_padrao INTEGER DEFAULT 1,
  obrigatoriedade obrigatoriedade_item NOT NULL DEFAULT 'recomendado',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(viatura_id, item_viatura_id)
);

-- Tabela de protocolos de empenho
CREATE TABLE public.protocolos_empenho (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_protocolo TEXT UNIQUE NOT NULL,
  viatura_id UUID NOT NULL REFERENCES public.viaturas(id),
  agente_responsavel_id UUID NOT NULL REFERENCES public.profiles(id),
  data_hora_empenho TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  latitude_empenho DECIMAL(10, 8),
  longitude_empenho DECIMAL(11, 8),
  local_empenho TEXT,
  status status_protocolo NOT NULL DEFAULT 'em_andamento',
  tempo_empenho_minutos INTEGER,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de protocolos de devolução
CREATE TABLE public.protocolos_devolucao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo_empenho_id UUID NOT NULL REFERENCES public.protocolos_empenho(id),
  agente_responsavel_id UUID NOT NULL REFERENCES public.profiles(id),
  data_hora_devolucao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  latitude_devolucao DECIMAL(10, 8),
  longitude_devolucao DECIMAL(11, 8),
  local_devolucao TEXT,
  tempo_empenho_total_minutos INTEGER,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de checklists de veículo
CREATE TABLE public.checklists_veiculo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo_empenho_id UUID REFERENCES public.protocolos_empenho(id),
  protocolo_devolucao_id UUID REFERENCES public.protocolos_devolucao(id),
  tipo_checklist tipo_checklist NOT NULL,
  placa_presente TEXT,
  placa_observacao TEXT,
  nivel_oleo TEXT,
  freio_status TEXT,
  freio_observacao TEXT,
  pneu_status TEXT,
  pneu_observacao TEXT,
  luzes_status TEXT,
  luzes_observacao TEXT,
  limpadores_status TEXT,
  limpadores_observacao TEXT,
  condicoes_mecanicas condicao_mecanica,
  estado_geral estado_geral,
  nivel_combustivel DECIMAL(5, 2),
  km_atual INTEGER,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de itens do checklist
CREATE TABLE public.checklist_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_veiculo_id UUID NOT NULL REFERENCES public.checklists_veiculo(id) ON DELETE CASCADE,
  item_viatura_id UUID NOT NULL REFERENCES public.itens_viatura(id),
  situacao situacao_item NOT NULL,
  quantidade INTEGER,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de fotos de checklist
CREATE TABLE public.fotos_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_veiculo_id UUID REFERENCES public.checklists_veiculo(id) ON DELETE CASCADE,
  protocolo_empenho_id UUID REFERENCES public.protocolos_empenho(id),
  protocolo_devolucao_id UUID REFERENCES public.protocolos_devolucao(id),
  url_foto TEXT NOT NULL,
  tipo_foto tipo_foto NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de log de status de viatura
CREATE TABLE public.log_status_viatura (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viatura_id UUID NOT NULL REFERENCES public.viaturas(id),
  status_anterior status_operacional,
  status_novo status_operacional NOT NULL,
  motivo TEXT,
  usuario_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_viatura ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viatura_itens_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocolos_empenho ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocolos_devolucao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklists_veiculo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fotos_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_status_viatura ENABLE ROW LEVEL SECURITY;

-- Função para verificar perfil do usuário
CREATE OR REPLACE FUNCTION public.get_user_perfil(user_id UUID)
RETURNS perfil_usuario
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT perfil FROM public.profiles WHERE id = user_id;
$$;

-- Função para verificar se é admin ou gestor
CREATE OR REPLACE FUNCTION public.is_admin_or_gestor(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id
    AND perfil IN ('admin', 'gestor')
    AND ativo = true
  );
$$;

-- Políticas RLS para profiles
CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admin/Gestor pode ver todos perfis"
  ON public.profiles FOR SELECT
  USING (public.is_admin_or_gestor(auth.uid()));

CREATE POLICY "Admin pode inserir perfis"
  ON public.profiles FOR INSERT
  WITH CHECK (public.get_user_perfil(auth.uid()) = 'admin');

CREATE POLICY "Admin pode atualizar perfis"
  ON public.profiles FOR UPDATE
  USING (public.get_user_perfil(auth.uid()) = 'admin');

-- Políticas RLS para viaturas
CREATE POLICY "Todos usuários autenticados podem ver viaturas"
  ON public.viaturas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin/Gestor pode inserir viaturas"
  ON public.viaturas FOR INSERT
  WITH CHECK (public.is_admin_or_gestor(auth.uid()));

CREATE POLICY "Admin/Gestor pode atualizar viaturas"
  ON public.viaturas FOR UPDATE
  USING (public.is_admin_or_gestor(auth.uid()));

CREATE POLICY "Admin pode deletar viaturas"
  ON public.viaturas FOR DELETE
  USING (public.get_user_perfil(auth.uid()) = 'admin');

-- Políticas RLS para itens_viatura
CREATE POLICY "Todos podem ver itens"
  ON public.itens_viatura FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin/Gestor pode gerenciar itens"
  ON public.itens_viatura FOR ALL
  USING (public.is_admin_or_gestor(auth.uid()));

-- Políticas RLS para viatura_itens_config
CREATE POLICY "Todos podem ver configurações de itens"
  ON public.viatura_itens_config FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin/Gestor pode gerenciar configurações"
  ON public.viatura_itens_config FOR ALL
  USING (public.is_admin_or_gestor(auth.uid()));

-- Políticas RLS para protocolos
CREATE POLICY "Usuários podem ver próprios protocolos"
  ON public.protocolos_empenho FOR SELECT
  USING (auth.uid() = agente_responsavel_id OR public.is_admin_or_gestor(auth.uid()));

CREATE POLICY "Agentes podem criar protocolos"
  ON public.protocolos_empenho FOR INSERT
  WITH CHECK (auth.uid() = agente_responsavel_id);

CREATE POLICY "Admin/Gestor pode atualizar protocolos"
  ON public.protocolos_empenho FOR UPDATE
  USING (public.is_admin_or_gestor(auth.uid()));

-- Políticas para devolução
CREATE POLICY "Usuários podem ver devoluções"
  ON public.protocolos_devolucao FOR SELECT
  USING (
    auth.uid() = agente_responsavel_id OR
    public.is_admin_or_gestor(auth.uid())
  );

CREATE POLICY "Agentes podem criar devoluções"
  ON public.protocolos_devolucao FOR INSERT
  WITH CHECK (auth.uid() = agente_responsavel_id);

-- Políticas para checklists
CREATE POLICY "Usuários podem ver checklists relacionados"
  ON public.checklists_veiculo FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar checklists"
  ON public.checklists_veiculo FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Políticas para checklist_itens
CREATE POLICY "Todos podem ver itens de checklist"
  ON public.checklist_itens FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários podem criar itens de checklist"
  ON public.checklist_itens FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Políticas para fotos
CREATE POLICY "Todos podem ver fotos"
  ON public.fotos_checklist FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários podem inserir fotos"
  ON public.fotos_checklist FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Políticas para logs
CREATE POLICY "Admin/Gestor pode ver logs"
  ON public.log_status_viatura FOR SELECT
  USING (public.is_admin_or_gestor(auth.uid()));

CREATE POLICY "Sistema pode inserir logs"
  ON public.log_status_viatura FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Trigger para criar profile automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, matricula, perfil)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.raw_user_meta_data->>'matricula',
    COALESCE((NEW.raw_user_meta_data->>'perfil')::perfil_usuario, 'gestor')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_viaturas_updated_at
  BEFORE UPDATE ON public.viaturas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para gerar número de protocolo
CREATE OR REPLACE FUNCTION public.gerar_numero_protocolo()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  ano TEXT;
  sequencia INTEGER;
  numero TEXT;
BEGIN
  ano := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero_protocolo FROM 5 FOR 6) AS INTEGER)), 0) + 1
  INTO sequencia
  FROM public.protocolos_empenho
  WHERE numero_protocolo LIKE ano || '%';
  
  numero := ano || LPAD(sequencia::TEXT, 6, '0');
  
  RETURN numero;
END;
$$;

-- Função para registrar mudança de status
CREATE OR REPLACE FUNCTION public.log_viatura_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status_operacional IS DISTINCT FROM NEW.status_operacional THEN
    INSERT INTO public.log_status_viatura (
      viatura_id,
      status_anterior,
      status_novo,
      usuario_id
    ) VALUES (
      NEW.id,
      OLD.status_operacional,
      NEW.status_operacional,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_status_change
  AFTER UPDATE ON public.viaturas
  FOR EACH ROW EXECUTE FUNCTION public.log_viatura_status_change();

-- Criar bucket para fotos de viaturas
INSERT INTO storage.buckets (id, name, public) VALUES ('vehicle-photos', 'vehicle-photos', true);

-- Políticas de storage para fotos
CREATE POLICY "Fotos são públicas para leitura"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vehicle-photos');

CREATE POLICY "Usuários autenticados podem fazer upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'vehicle-photos');

CREATE POLICY "Usuários autenticados podem deletar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'vehicle-photos');