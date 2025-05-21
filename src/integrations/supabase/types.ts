export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      atividade: {
        Row: {
          concluida: boolean | null
          created_at: string
          data_hora: string | null
          descricao: string | null
          id: number
          id_lead: number | null
          id_oportunidade: number | null
          id_usuario: number | null
          obs: string | null
          tipo: string | null
        }
        Insert: {
          concluida?: boolean | null
          created_at?: string
          data_hora?: string | null
          descricao?: string | null
          id?: number
          id_lead?: number | null
          id_oportunidade?: number | null
          id_usuario?: number | null
          obs?: string | null
          tipo?: string | null
        }
        Update: {
          concluida?: boolean | null
          created_at?: string
          data_hora?: string | null
          descricao?: string | null
          id?: number
          id_lead?: number | null
          id_oportunidade?: number | null
          id_usuario?: number | null
          obs?: string | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atividade_id_lead_fkey"
            columns: ["id_lead"]
            isOneToOne: false
            referencedRelation: "lead"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividade_id_oportunidade_fkey"
            columns: ["id_oportunidade"]
            isOneToOne: false
            referencedRelation: "opotunidade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividade_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      avaliacoes: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      barbearia_gigante_profissionais: {
        Row: {
          calendar_client_ID: string | null
          calendar_Client_Secret: string | null
          created_at: string
          id: number
          nome: string | null
          telefone: string | null
        }
        Insert: {
          calendar_client_ID?: string | null
          calendar_Client_Secret?: string | null
          created_at?: string
          id?: number
          nome?: string | null
          telefone?: string | null
        }
        Update: {
          calendar_client_ID?: string | null
          calendar_Client_Secret?: string | null
          created_at?: string
          id?: number
          nome?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      barberia_gigante_historico: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      config: {
        Row: {
          alertaNovo: boolean | null
          apikeyvoice: string | null
          codVoice: string | null
          created_at: string
          empresa: string | null
          evo_instancia: string | null
          evo_key: string | null
          grupoReceptor: string | null
          id: number
          idusuario: number | null
          receptor: Database["public"]["Enums"]["cargos"] | null
          telefone: string | null
        }
        Insert: {
          alertaNovo?: boolean | null
          apikeyvoice?: string | null
          codVoice?: string | null
          created_at?: string
          empresa?: string | null
          evo_instancia?: string | null
          evo_key?: string | null
          grupoReceptor?: string | null
          id?: number
          idusuario?: number | null
          receptor?: Database["public"]["Enums"]["cargos"] | null
          telefone?: string | null
        }
        Update: {
          alertaNovo?: boolean | null
          apikeyvoice?: string | null
          codVoice?: string | null
          created_at?: string
          empresa?: string | null
          evo_instancia?: string | null
          evo_key?: string | null
          grupoReceptor?: string | null
          id?: number
          idusuario?: number | null
          receptor?: Database["public"]["Enums"]["cargos"] | null
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "config_idusuario_fkey"
            columns: ["idusuario"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      dados_cliente: {
        Row: {
          created_at: string | null
          id: number
          sessionid: string | null
          telefone: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          sessionid?: string | null
          telefone?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          sessionid?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      estoque: {
        Row: {
          ano: string | null
          ano_fabricacao: string | null
          cambio: string | null
          caracteristicas: string | null
          categoria: string | null
          cautelar: string | null
          config: number | null
          cor: string | null
          created_at: string
          fabricante: string | null
          ficha_tecnica: string | null
          foto: string | null
          fotos: string[] | null
          garantia: string | null
          id: number
          idEstoqueBubble: string | null
          idOlx: string | null
          km: string | null
          modelo: string | null
          motor: string | null
          observacao: string | null
          status: string | null
          tipo_veiculo: string | null
          uid: string | null
          usuario: number | null
          valor: string | null
          video: string | null
        }
        Insert: {
          ano?: string | null
          ano_fabricacao?: string | null
          cambio?: string | null
          caracteristicas?: string | null
          categoria?: string | null
          cautelar?: string | null
          config?: number | null
          cor?: string | null
          created_at?: string
          fabricante?: string | null
          ficha_tecnica?: string | null
          foto?: string | null
          fotos?: string[] | null
          garantia?: string | null
          id?: number
          idEstoqueBubble?: string | null
          idOlx?: string | null
          km?: string | null
          modelo?: string | null
          motor?: string | null
          observacao?: string | null
          status?: string | null
          tipo_veiculo?: string | null
          uid?: string | null
          usuario?: number | null
          valor?: string | null
          video?: string | null
        }
        Update: {
          ano?: string | null
          ano_fabricacao?: string | null
          cambio?: string | null
          caracteristicas?: string | null
          categoria?: string | null
          cautelar?: string | null
          config?: number | null
          cor?: string | null
          created_at?: string
          fabricante?: string | null
          ficha_tecnica?: string | null
          foto?: string | null
          fotos?: string[] | null
          garantia?: string | null
          id?: number
          idEstoqueBubble?: string | null
          idOlx?: string | null
          km?: string | null
          modelo?: string | null
          motor?: string | null
          observacao?: string | null
          status?: string | null
          tipo_veiculo?: string | null
          uid?: string | null
          usuario?: number | null
          valor?: string | null
          video?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estoque_config_fkey"
            columns: ["config"]
            isOneToOne: false
            referencedRelation: "config"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_usuario_fkey"
            columns: ["usuario"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_iputinga: {
        Row: {
          ano: string | null
          ano_fabricacao: string | null
          cambio: string | null
          caracteristicas: string | null
          categoria: string | null
          cautelar: string | null
          config: number | null
          cor: string | null
          created_at: string
          fabricante: string | null
          ficha_tecnica: string | null
          foto: string | null
          fotos: string[] | null
          garantia: string | null
          id: number
          idEstoqueBubble: string | null
          idolx: string | null
          km: string | null
          modelo: string | null
          motor: string | null
          observacao: string | null
          status: string | null
          tipo_veiculo: string | null
          uid: string | null
          valor: string | null
          video: string | null
        }
        Insert: {
          ano?: string | null
          ano_fabricacao?: string | null
          cambio?: string | null
          caracteristicas?: string | null
          categoria?: string | null
          cautelar?: string | null
          config?: number | null
          cor?: string | null
          created_at?: string
          fabricante?: string | null
          ficha_tecnica?: string | null
          foto?: string | null
          fotos?: string[] | null
          garantia?: string | null
          id?: number
          idEstoqueBubble?: string | null
          idolx?: string | null
          km?: string | null
          modelo?: string | null
          motor?: string | null
          observacao?: string | null
          status?: string | null
          tipo_veiculo?: string | null
          uid?: string | null
          valor?: string | null
          video?: string | null
        }
        Update: {
          ano?: string | null
          ano_fabricacao?: string | null
          cambio?: string | null
          caracteristicas?: string | null
          categoria?: string | null
          cautelar?: string | null
          config?: number | null
          cor?: string | null
          created_at?: string
          fabricante?: string | null
          ficha_tecnica?: string | null
          foto?: string | null
          fotos?: string[] | null
          garantia?: string | null
          id?: number
          idEstoqueBubble?: string | null
          idolx?: string | null
          km?: string | null
          modelo?: string | null
          motor?: string | null
          observacao?: string | null
          status?: string | null
          tipo_veiculo?: string | null
          uid?: string | null
          valor?: string | null
          video?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estoque_iputinga_config_fkey"
            columns: ["config"]
            isOneToOne: false
            referencedRelation: "config"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban: {
        Row: {
          created_at: string
          descricao: string | null
          id: number
          posicao: number | null
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: number
          posicao?: number | null
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: number
          posicao?: number | null
        }
        Relationships: []
      }
      lead: {
        Row: {
          created_at: string
          email: string | null
          id: number
          idUsuario: number | null
          interesse: string | null
          nome: string | null
          Origem: string | null
          session_id_olx: string | null
          session_id_whatsaap: string | null
          telefone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: number
          idUsuario?: number | null
          interesse?: string | null
          nome?: string | null
          Origem?: string | null
          session_id_olx?: string | null
          session_id_whatsaap?: string | null
          telefone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: number
          idUsuario?: number | null
          interesse?: string | null
          nome?: string | null
          Origem?: string | null
          session_id_olx?: string | null
          session_id_whatsaap?: string | null
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_idUsuario_fkey"
            columns: ["idUsuario"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      n8n_historico_olx_vx: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      n8n_megan_followup: {
        Row: {
          created_at: string
          encerrado: boolean | null
          etapa: number | null
          id: number
          instancia: string | null
          mensagem: string | null
          telefone: string | null
          time: string | null
          token: string | null
          url_agente: string | null
        }
        Insert: {
          created_at?: string
          encerrado?: boolean | null
          etapa?: number | null
          id?: number
          instancia?: string | null
          mensagem?: string | null
          telefone?: string | null
          time?: string | null
          token?: string | null
          url_agente?: string | null
        }
        Update: {
          created_at?: string
          encerrado?: boolean | null
          etapa?: number | null
          id?: number
          instancia?: string | null
          mensagem?: string | null
          telefone?: string | null
          time?: string | null
          token?: string | null
          url_agente?: string | null
        }
        Relationships: []
      }
      n8n_megan_historico: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      opotunidade: {
        Row: {
          created_at: string
          data_criacao: string | null
          id: number
          id_kanban: number | null
          id_lead: number | null
          id_usuario: number | null
          idEstoque: number | null
          obs: string | null
          resumo: string | null
          session_id_olx: string | null
          session_id_whatsapp: string | null
          status: string | null
          titulo: string | null
          ultima_interacao: string | null
          valor: string | null
        }
        Insert: {
          created_at?: string
          data_criacao?: string | null
          id?: number
          id_kanban?: number | null
          id_lead?: number | null
          id_usuario?: number | null
          idEstoque?: number | null
          obs?: string | null
          resumo?: string | null
          session_id_olx?: string | null
          session_id_whatsapp?: string | null
          status?: string | null
          titulo?: string | null
          ultima_interacao?: string | null
          valor?: string | null
        }
        Update: {
          created_at?: string
          data_criacao?: string | null
          id?: number
          id_kanban?: number | null
          id_lead?: number | null
          id_usuario?: number | null
          idEstoque?: number | null
          obs?: string | null
          resumo?: string | null
          session_id_olx?: string | null
          session_id_whatsapp?: string | null
          status?: string | null
          titulo?: string | null
          ultima_interacao?: string | null
          valor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opotunidade_id_kanban_fkey"
            columns: ["id_kanban"]
            isOneToOne: false
            referencedRelation: "kanban"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opotunidade_id_lead_fkey"
            columns: ["id_lead"]
            isOneToOne: false
            referencedRelation: "lead"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opotunidade_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      usuario: {
        Row: {
          apikeyvoice: string | null
          ativo: boolean | null
          auth_id: string | null
          cargo: Database["public"]["Enums"]["cargos"] | null
          codVoice: string | null
          config: number | null
          created_at: string
          credencialOlx: string | null
          email: string | null
          evo_instancia: string | null
          evo_key: string | null
          id: number
          idbubble: string | null
          n8nOlx: string | null
          nome: string | null
          tbEstoque: string | null
          tbHistorico: string | null
          tbHistoricoOlx: string | null
          telefone: string | null
          uid: string | null
        }
        Insert: {
          apikeyvoice?: string | null
          ativo?: boolean | null
          auth_id?: string | null
          cargo?: Database["public"]["Enums"]["cargos"] | null
          codVoice?: string | null
          config?: number | null
          created_at?: string
          credencialOlx?: string | null
          email?: string | null
          evo_instancia?: string | null
          evo_key?: string | null
          id?: number
          idbubble?: string | null
          n8nOlx?: string | null
          nome?: string | null
          tbEstoque?: string | null
          tbHistorico?: string | null
          tbHistoricoOlx?: string | null
          telefone?: string | null
          uid?: string | null
        }
        Update: {
          apikeyvoice?: string | null
          ativo?: boolean | null
          auth_id?: string | null
          cargo?: Database["public"]["Enums"]["cargos"] | null
          codVoice?: string | null
          config?: number | null
          created_at?: string
          credencialOlx?: string | null
          email?: string | null
          evo_instancia?: string | null
          evo_key?: string | null
          id?: number
          idbubble?: string | null
          n8nOlx?: string | null
          nome?: string | null
          tbEstoque?: string | null
          tbHistorico?: string | null
          tbHistoricoOlx?: string | null
          telefone?: string | null
          uid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuario_config_fkey"
            columns: ["config"]
            isOneToOne: false
            referencedRelation: "config"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
    }
    Enums: {
      cargos: "Gerente" | "Supervisor" | "Vendedor" | "Avaliador"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      cargos: ["Gerente", "Supervisor", "Vendedor", "Avaliador"],
    },
  },
} as const
