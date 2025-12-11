export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_itens: {
        Row: {
          checklist_veiculo_id: string
          created_at: string
          id: string
          item_viatura_id: string
          observacoes: string | null
          quantidade: number | null
          situacao: Database["public"]["Enums"]["situacao_item"]
        }
        Insert: {
          checklist_veiculo_id: string
          created_at?: string
          id?: string
          item_viatura_id: string
          observacoes?: string | null
          quantidade?: number | null
          situacao: Database["public"]["Enums"]["situacao_item"]
        }
        Update: {
          checklist_veiculo_id?: string
          created_at?: string
          id?: string
          item_viatura_id?: string
          observacoes?: string | null
          quantidade?: number | null
          situacao?: Database["public"]["Enums"]["situacao_item"]
        }
        Relationships: [
          {
            foreignKeyName: "checklist_itens_checklist_veiculo_id_fkey"
            columns: ["checklist_veiculo_id"]
            isOneToOne: false
            referencedRelation: "checklists_veiculo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_itens_item_viatura_id_fkey"
            columns: ["item_viatura_id"]
            isOneToOne: false
            referencedRelation: "itens_viatura"
            referencedColumns: ["id"]
          },
        ]
      }
      checklists_veiculo: {
        Row: {
          condicoes_mecanicas:
            | Database["public"]["Enums"]["condicao_mecanica"]
            | null
          created_at: string
          estado_geral: Database["public"]["Enums"]["estado_geral"] | null
          freio_observacao: string | null
          freio_status: string | null
          id: string
          km_atual: number | null
          limpadores_observacao: string | null
          limpadores_status: string | null
          luzes_observacao: string | null
          luzes_status: string | null
          nivel_combustivel: number | null
          nivel_oleo: string | null
          observacoes: string | null
          placa_observacao: string | null
          placa_presente: string | null
          pneu_observacao: string | null
          pneu_status: string | null
          protocolo_devolucao_id: string | null
          protocolo_empenho_id: string | null
          tipo_checklist: Database["public"]["Enums"]["tipo_checklist"]
        }
        Insert: {
          condicoes_mecanicas?:
            | Database["public"]["Enums"]["condicao_mecanica"]
            | null
          created_at?: string
          estado_geral?: Database["public"]["Enums"]["estado_geral"] | null
          freio_observacao?: string | null
          freio_status?: string | null
          id?: string
          km_atual?: number | null
          limpadores_observacao?: string | null
          limpadores_status?: string | null
          luzes_observacao?: string | null
          luzes_status?: string | null
          nivel_combustivel?: number | null
          nivel_oleo?: string | null
          observacoes?: string | null
          placa_observacao?: string | null
          placa_presente?: string | null
          pneu_observacao?: string | null
          pneu_status?: string | null
          protocolo_devolucao_id?: string | null
          protocolo_empenho_id?: string | null
          tipo_checklist: Database["public"]["Enums"]["tipo_checklist"]
        }
        Update: {
          condicoes_mecanicas?:
            | Database["public"]["Enums"]["condicao_mecanica"]
            | null
          created_at?: string
          estado_geral?: Database["public"]["Enums"]["estado_geral"] | null
          freio_observacao?: string | null
          freio_status?: string | null
          id?: string
          km_atual?: number | null
          limpadores_observacao?: string | null
          limpadores_status?: string | null
          luzes_observacao?: string | null
          luzes_status?: string | null
          nivel_combustivel?: number | null
          nivel_oleo?: string | null
          observacoes?: string | null
          placa_observacao?: string | null
          placa_presente?: string | null
          pneu_observacao?: string | null
          pneu_status?: string | null
          protocolo_devolucao_id?: string | null
          protocolo_empenho_id?: string | null
          tipo_checklist?: Database["public"]["Enums"]["tipo_checklist"]
        }
        Relationships: [
          {
            foreignKeyName: "checklists_veiculo_protocolo_devolucao_id_fkey"
            columns: ["protocolo_devolucao_id"]
            isOneToOne: false
            referencedRelation: "protocolos_devolucao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklists_veiculo_protocolo_empenho_id_fkey"
            columns: ["protocolo_empenho_id"]
            isOneToOne: false
            referencedRelation: "protocolos_empenho"
            referencedColumns: ["id"]
          },
        ]
      }
      fotos_checklist: {
        Row: {
          checklist_veiculo_id: string | null
          created_at: string
          descricao: string | null
          id: string
          protocolo_devolucao_id: string | null
          protocolo_empenho_id: string | null
          tipo_foto: Database["public"]["Enums"]["tipo_foto"]
          url_foto: string
        }
        Insert: {
          checklist_veiculo_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          protocolo_devolucao_id?: string | null
          protocolo_empenho_id?: string | null
          tipo_foto: Database["public"]["Enums"]["tipo_foto"]
          url_foto: string
        }
        Update: {
          checklist_veiculo_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          protocolo_devolucao_id?: string | null
          protocolo_empenho_id?: string | null
          tipo_foto?: Database["public"]["Enums"]["tipo_foto"]
          url_foto?: string
        }
        Relationships: [
          {
            foreignKeyName: "fotos_checklist_checklist_veiculo_id_fkey"
            columns: ["checklist_veiculo_id"]
            isOneToOne: false
            referencedRelation: "checklists_veiculo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fotos_checklist_protocolo_devolucao_id_fkey"
            columns: ["protocolo_devolucao_id"]
            isOneToOne: false
            referencedRelation: "protocolos_devolucao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fotos_checklist_protocolo_empenho_id_fkey"
            columns: ["protocolo_empenho_id"]
            isOneToOne: false
            referencedRelation: "protocolos_empenho"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_viatura: {
        Row: {
          categoria: Database["public"]["Enums"]["categoria_item"]
          created_at: string
          descricao: string | null
          id: string
          nome: string
          tipo: Database["public"]["Enums"]["tipo_item"]
        }
        Insert: {
          categoria: Database["public"]["Enums"]["categoria_item"]
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          tipo: Database["public"]["Enums"]["tipo_item"]
        }
        Update: {
          categoria?: Database["public"]["Enums"]["categoria_item"]
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          tipo?: Database["public"]["Enums"]["tipo_item"]
        }
        Relationships: []
      }
      log_status_viatura: {
        Row: {
          created_at: string
          id: string
          motivo: string | null
          status_anterior:
            | Database["public"]["Enums"]["status_operacional"]
            | null
          status_novo: Database["public"]["Enums"]["status_operacional"]
          usuario_id: string | null
          viatura_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          motivo?: string | null
          status_anterior?:
            | Database["public"]["Enums"]["status_operacional"]
            | null
          status_novo: Database["public"]["Enums"]["status_operacional"]
          usuario_id?: string | null
          viatura_id: string
        }
        Update: {
          created_at?: string
          id?: string
          motivo?: string | null
          status_anterior?:
            | Database["public"]["Enums"]["status_operacional"]
            | null
          status_novo?: Database["public"]["Enums"]["status_operacional"]
          usuario_id?: string | null
          viatura_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "log_status_viatura_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "log_status_viatura_viatura_id_fkey"
            columns: ["viatura_id"]
            isOneToOne: false
            referencedRelation: "viaturas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          matricula: string | null
          nome: string
          perfil: Database["public"]["Enums"]["perfil_usuario"]
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id: string
          matricula?: string | null
          nome: string
          perfil?: Database["public"]["Enums"]["perfil_usuario"]
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          matricula?: string | null
          nome?: string
          perfil?: Database["public"]["Enums"]["perfil_usuario"]
          updated_at?: string
        }
        Relationships: []
      }
      protocolos_devolucao: {
        Row: {
          agente_responsavel_id: string
          created_at: string
          data_hora_devolucao: string
          id: string
          latitude_devolucao: number | null
          local_devolucao: string | null
          longitude_devolucao: number | null
          nome_agente: string | null
          observacoes: string | null
          protocolo_empenho_id: string
          tempo_empenho_total_minutos: number | null
        }
        Insert: {
          agente_responsavel_id: string
          created_at?: string
          data_hora_devolucao?: string
          id?: string
          latitude_devolucao?: number | null
          local_devolucao?: string | null
          longitude_devolucao?: number | null
          nome_agente?: string | null
          observacoes?: string | null
          protocolo_empenho_id: string
          tempo_empenho_total_minutos?: number | null
        }
        Update: {
          agente_responsavel_id?: string
          created_at?: string
          data_hora_devolucao?: string
          id?: string
          latitude_devolucao?: number | null
          local_devolucao?: string | null
          longitude_devolucao?: number | null
          nome_agente?: string | null
          observacoes?: string | null
          protocolo_empenho_id?: string
          tempo_empenho_total_minutos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "protocolos_devolucao_agente_responsavel_id_fkey"
            columns: ["agente_responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protocolos_devolucao_protocolo_empenho_id_fkey"
            columns: ["protocolo_empenho_id"]
            isOneToOne: false
            referencedRelation: "protocolos_empenho"
            referencedColumns: ["id"]
          },
        ]
      }
      protocolos_empenho: {
        Row: {
          agente_responsavel_id: string
          created_at: string
          data_hora_empenho: string
          id: string
          latitude_empenho: number | null
          local_empenho: string | null
          longitude_empenho: number | null
          nome_agente: string | null
          numero_protocolo: string
          observacoes: string | null
          status: Database["public"]["Enums"]["status_protocolo"]
          tempo_empenho_minutos: number | null
          viatura_id: string
        }
        Insert: {
          agente_responsavel_id: string
          created_at?: string
          data_hora_empenho?: string
          id?: string
          latitude_empenho?: number | null
          local_empenho?: string | null
          longitude_empenho?: number | null
          nome_agente?: string | null
          numero_protocolo: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["status_protocolo"]
          tempo_empenho_minutos?: number | null
          viatura_id: string
        }
        Update: {
          agente_responsavel_id?: string
          created_at?: string
          data_hora_empenho?: string
          id?: string
          latitude_empenho?: number | null
          local_empenho?: string | null
          longitude_empenho?: number | null
          nome_agente?: string | null
          numero_protocolo?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["status_protocolo"]
          tempo_empenho_minutos?: number | null
          viatura_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocolos_empenho_agente_responsavel_id_fkey"
            columns: ["agente_responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protocolos_empenho_viatura_id_fkey"
            columns: ["viatura_id"]
            isOneToOne: false
            referencedRelation: "viaturas"
            referencedColumns: ["id"]
          },
        ]
      }
      viatura_itens_config: {
        Row: {
          created_at: string
          id: string
          item_viatura_id: string | null
          obrigatoriedade: Database["public"]["Enums"]["obrigatoriedade_item"]
          quantidade_padrao: number | null
          viatura_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          item_viatura_id?: string | null
          obrigatoriedade?: Database["public"]["Enums"]["obrigatoriedade_item"]
          quantidade_padrao?: number | null
          viatura_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          item_viatura_id?: string | null
          obrigatoriedade?: Database["public"]["Enums"]["obrigatoriedade_item"]
          quantidade_padrao?: number | null
          viatura_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "viatura_itens_config_item_viatura_id_fkey"
            columns: ["item_viatura_id"]
            isOneToOne: false
            referencedRelation: "itens_viatura"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viatura_itens_config_viatura_id_fkey"
            columns: ["viatura_id"]
            isOneToOne: false
            referencedRelation: "viaturas"
            referencedColumns: ["id"]
          },
        ]
      }
      viaturas: {
        Row: {
          ano_fabricacao: number | null
          categoria: string | null
          chassi: string | null
          created_at: string
          especie: string | null
          id: string
          km_atual: number | null
          km_inicial: number | null
          marca: string | null
          modelo: string | null
          observacoes: string | null
          placa: string
          prefixo: string
          renavam: string | null
          situacao_licenciamento:
            | Database["public"]["Enums"]["situacao_licenciamento"]
            | null
          status_operacional: Database["public"]["Enums"]["status_operacional"]
          tipo: string | null
          updated_at: string
        }
        Insert: {
          ano_fabricacao?: number | null
          categoria?: string | null
          chassi?: string | null
          created_at?: string
          especie?: string | null
          id?: string
          km_atual?: number | null
          km_inicial?: number | null
          marca?: string | null
          modelo?: string | null
          observacoes?: string | null
          placa: string
          prefixo: string
          renavam?: string | null
          situacao_licenciamento?:
            | Database["public"]["Enums"]["situacao_licenciamento"]
            | null
          status_operacional?: Database["public"]["Enums"]["status_operacional"]
          tipo?: string | null
          updated_at?: string
        }
        Update: {
          ano_fabricacao?: number | null
          categoria?: string | null
          chassi?: string | null
          created_at?: string
          especie?: string | null
          id?: string
          km_atual?: number | null
          km_inicial?: number | null
          marca?: string | null
          modelo?: string | null
          observacoes?: string | null
          placa?: string
          prefixo?: string
          renavam?: string | null
          situacao_licenciamento?:
            | Database["public"]["Enums"]["situacao_licenciamento"]
            | null
          status_operacional?: Database["public"]["Enums"]["status_operacional"]
          tipo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      gerar_numero_protocolo: { Args: never; Returns: string }
      get_user_perfil: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["perfil_usuario"]
      }
      is_admin_or_gestor: { Args: { user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "agente" | "gestor" | "admin"
      categoria_item:
        | "seguranca"
        | "sinalizacao"
        | "mecanico"
        | "eletrico"
        | "comunicacao"
        | "outro"
      condicao_mecanica: "em_condicoes" | "sem_condicoes"
      estado_geral: "bom" | "mau" | "regular"
      obrigatoriedade_item: "obrigatorio" | "recomendado" | "opcional"
      perfil_usuario: "agente" | "gestor" | "admin"
      situacao_item:
        | "sim"
        | "nao"
        | "tem"
        | "nao_tem"
        | "em_condicoes"
        | "sem_condicoes"
        | "bom"
        | "mau"
        | "presente"
        | "incompleto"
        | "ausente"
      situacao_licenciamento:
        | "regular"
        | "irregular"
        | "vencido"
        | "em_processo"
      status_operacional:
        | "disponivel"
        | "empenhada"
        | "devolvida"
        | "manutencao"
        | "inoperante"
        | "acidentada"
        | "batida"
      status_protocolo: "em_andamento" | "concluido" | "cancelado"
      tipo_checklist: "empenho" | "devolucao"
      tipo_foto: "veiculo_geral" | "dano" | "item" | "painel" | "outro"
      tipo_item:
        | "equipamento"
        | "ferramenta"
        | "epi"
        | "documento"
        | "acessorio"
        | "outro"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["agente", "gestor", "admin"],
      categoria_item: [
        "seguranca",
        "sinalizacao",
        "mecanico",
        "eletrico",
        "comunicacao",
        "outro",
      ],
      condicao_mecanica: ["em_condicoes", "sem_condicoes"],
      estado_geral: ["bom", "mau", "regular"],
      obrigatoriedade_item: ["obrigatorio", "recomendado", "opcional"],
      perfil_usuario: ["agente", "gestor", "admin"],
      situacao_item: [
        "sim",
        "nao",
        "tem",
        "nao_tem",
        "em_condicoes",
        "sem_condicoes",
        "bom",
        "mau",
        "presente",
        "incompleto",
        "ausente",
      ],
      situacao_licenciamento: [
        "regular",
        "irregular",
        "vencido",
        "em_processo",
      ],
      status_operacional: [
        "disponivel",
        "empenhada",
        "devolvida",
        "manutencao",
        "inoperante",
        "acidentada",
        "batida",
      ],
      status_protocolo: ["em_andamento", "concluido", "cancelado"],
      tipo_checklist: ["empenho", "devolucao"],
      tipo_foto: ["veiculo_geral", "dano", "item", "painel", "outro"],
      tipo_item: [
        "equipamento",
        "ferramenta",
        "epi",
        "documento",
        "acessorio",
        "outro",
      ],
    },
  },
} as const
