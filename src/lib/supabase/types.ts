// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      auditoria: {
        Row: {
          acao: string
          admin_id: string | null
          id: string
          registro_id: string
          tabela: string
          taxa_aplicada: number | null
          timestamp: string
        }
        Insert: {
          acao: string
          admin_id?: string | null
          id?: string
          registro_id: string
          tabela: string
          taxa_aplicada?: number | null
          timestamp?: string
        }
        Update: {
          acao?: string
          admin_id?: string | null
          id?: string
          registro_id?: string
          tabela?: string
          taxa_aplicada?: number | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: 'auditoria_admin_id_fkey'
            columns: ['admin_id']
            isOneToOne: false
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          },
        ]
      }
      cestas_clientes: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'cestas_clientes_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          },
        ]
      }
      cestas_itens: {
        Row: {
          ativo: boolean
          cesta_id: string
          id: string
          servico_id: string
          taxa_fixa: number
          taxa_percentual: number
        }
        Insert: {
          ativo?: boolean
          cesta_id: string
          id?: string
          servico_id: string
          taxa_fixa?: number
          taxa_percentual?: number
        }
        Update: {
          ativo?: boolean
          cesta_id?: string
          id?: string
          servico_id?: string
          taxa_fixa?: number
          taxa_percentual?: number
        }
        Relationships: [
          {
            foreignKeyName: 'cestas_itens_cesta_id_fkey'
            columns: ['cesta_id']
            isOneToOne: false
            referencedRelation: 'cestas_clientes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'cestas_itens_servico_id_fkey'
            columns: ['servico_id']
            isOneToOne: false
            referencedRelation: 'servicos'
            referencedColumns: ['id']
          },
        ]
      }
      contas: {
        Row: {
          id: string
          saldo: number
          saldo_bloqueado: number
          user_id: string
        }
        Insert: {
          id?: string
          saldo?: number
          saldo_bloqueado?: number
          user_id: string
        }
        Update: {
          id?: string
          saldo?: number
          saldo_bloqueado?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'contas_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          },
        ]
      }
      depositos: {
        Row: {
          admin_id: string | null
          confirmed_at: string | null
          created_at: string
          id: string
          status: string
          user_id: string
          valor: number
        }
        Insert: {
          admin_id?: string | null
          confirmed_at?: string | null
          created_at?: string
          id?: string
          status?: string
          user_id: string
          valor: number
        }
        Update: {
          admin_id?: string | null
          confirmed_at?: string | null
          created_at?: string
          id?: string
          status?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: 'depositos_admin_id_fkey'
            columns: ['admin_id']
            isOneToOne: false
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'depositos_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          },
        ]
      }
      emails_log: {
        Row: {
          created_at: string | null
          erro: string | null
          id: string
          proxima_tentativa: string | null
          status: string
          tentativas: number | null
          tipo: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          erro?: string | null
          id?: string
          proxima_tentativa?: string | null
          status: string
          tentativas?: number | null
          tipo: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          erro?: string | null
          id?: string
          proxima_tentativa?: string | null
          status?: string
          tentativas?: number | null
          tipo?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'emails_log_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          },
        ]
      }
      emails_pendentes: {
        Row: {
          assunto: string
          created_at: string | null
          email: string
          erro: string | null
          id: string
          payload: Json | null
          proxima_tentativa: string | null
          status: string | null
          template: string
          tentativas: number | null
          tipo: string | null
          user_id: string | null
        }
        Insert: {
          assunto: string
          created_at?: string | null
          email: string
          erro?: string | null
          id?: string
          payload?: Json | null
          proxima_tentativa?: string | null
          status?: string | null
          template: string
          tentativas?: number | null
          tipo?: string | null
          user_id?: string | null
        }
        Update: {
          assunto?: string
          created_at?: string | null
          email?: string
          erro?: string | null
          id?: string
          payload?: Json | null
          proxima_tentativa?: string | null
          status?: string | null
          template?: string
          tentativas?: number | null
          tipo?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'emails_pendentes_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          },
        ]
      }
      favorecidos: {
        Row: {
          agencia: string | null
          banco: string | null
          chave_pix: string | null
          conta: string | null
          id: string
          nome: string
          salvo: boolean
          tipo: string
          user_id: string
        }
        Insert: {
          agencia?: string | null
          banco?: string | null
          chave_pix?: string | null
          conta?: string | null
          id?: string
          nome: string
          salvo?: boolean
          tipo: string
          user_id: string
        }
        Update: {
          agencia?: string | null
          banco?: string | null
          chave_pix?: string | null
          conta?: string | null
          id?: string
          nome?: string
          salvo?: boolean
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'favorecidos_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          },
        ]
      }
      historico_logins: {
        Row: {
          created_at: string
          dispositivo: string | null
          id: string
          ip: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          dispositivo?: string | null
          id?: string
          ip?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          dispositivo?: string | null
          id?: string
          ip?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'historico_logins_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          },
        ]
      }
      notificacoes: {
        Row: {
          created_at: string
          id: string
          lida: boolean
          link: string | null
          mensagem: string
          tipo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lida?: boolean
          link?: string | null
          mensagem: string
          tipo: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lida?: boolean
          link?: string | null
          mensagem?: string
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notificacoes_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          },
        ]
      }
      password_reset_attempts: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      requisicoes: {
        Row: {
          created_at: string
          hash_cripto: string | null
          id: string
          metadados: Json | null
          processed_at: string | null
          processed_by: string | null
          rede: string | null
          status: string
          taxa_aplicada: number
          tipo: string
          user_id: string
          valor: number
          valor_total: number
        }
        Insert: {
          created_at?: string
          hash_cripto?: string | null
          id?: string
          metadados?: Json | null
          processed_at?: string | null
          processed_by?: string | null
          rede?: string | null
          status?: string
          taxa_aplicada?: number
          tipo: string
          user_id: string
          valor: number
          valor_total: number
        }
        Update: {
          created_at?: string
          hash_cripto?: string | null
          id?: string
          metadados?: Json | null
          processed_at?: string | null
          processed_by?: string | null
          rede?: string | null
          status?: string
          taxa_aplicada?: number
          tipo?: string
          user_id?: string
          valor?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: 'requisicoes_processed_by_fkey'
            columns: ['processed_by']
            isOneToOne: false
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'requisicoes_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          },
        ]
      }
      servicos: {
        Row: {
          ativo: boolean
          descricao: string | null
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          descricao?: string | null
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          descricao?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      taxas_servicos: {
        Row: {
          descricao: string | null
          id: string
          percentual: number
          servico_id: string
          valor_fixo: number
        }
        Insert: {
          descricao?: string | null
          id?: string
          percentual?: number
          servico_id: string
          valor_fixo?: number
        }
        Update: {
          descricao?: string | null
          id?: string
          percentual?: number
          servico_id?: string
          valor_fixo?: number
        }
        Relationships: [
          {
            foreignKeyName: 'taxas_servicos_servico_id_fkey'
            columns: ['servico_id']
            isOneToOne: false
            referencedRelation: 'servicos'
            referencedColumns: ['id']
          },
        ]
      }
      transacoes: {
        Row: {
          created_at: string
          data_operacao: string
          descricao: string
          descricao_taxa: string | null
          id: string
          saldo_anterior: number
          saldo_posterior: number
          status: string
          tipo: string
          tipo_movimento: string
          transacao_pai_id: string | null
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          created_at?: string
          data_operacao?: string
          descricao: string
          descricao_taxa?: string | null
          id?: string
          saldo_anterior?: number
          saldo_posterior?: number
          status?: string
          tipo: string
          tipo_movimento: string
          transacao_pai_id?: string | null
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          created_at?: string
          data_operacao?: string
          descricao?: string
          descricao_taxa?: string | null
          id?: string
          saldo_anterior?: number
          saldo_posterior?: number
          status?: string
          tipo?: string
          tipo_movimento?: string
          transacao_pai_id?: string | null
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: 'transacoes_transacao_pai_id_fkey'
            columns: ['transacao_pai_id']
            isOneToOne: false
            referencedRelation: 'transacoes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transacoes_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          },
        ]
      }
      usuarios: {
        Row: {
          created_at: string
          email: string
          endereco_cep: string | null
          endereco_cidade: string | null
          endereco_complemento: string | null
          endereco_estado: string | null
          endereco_numero: string | null
          endereco_rua: string | null
          foto_url: string | null
          id: string
          limite_alerta_saldo: number
          role: Database['public']['Enums']['role_usuario']
          status: Database['public']['Enums']['status_usuario']
          telefone: string | null
          tipo: Database['public']['Enums']['tipo_usuario']
          ultimo_alerta_saldo: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_complemento?: string | null
          endereco_estado?: string | null
          endereco_numero?: string | null
          endereco_rua?: string | null
          foto_url?: string | null
          id: string
          limite_alerta_saldo?: number
          role?: Database['public']['Enums']['role_usuario']
          status?: Database['public']['Enums']['status_usuario']
          telefone?: string | null
          tipo?: Database['public']['Enums']['tipo_usuario']
          ultimo_alerta_saldo?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_complemento?: string | null
          endereco_estado?: string | null
          endereco_numero?: string | null
          endereco_rua?: string | null
          foto_url?: string | null
          id?: string
          limite_alerta_saldo?: number
          role?: Database['public']['Enums']['role_usuario']
          status?: Database['public']['Enums']['status_usuario']
          telefone?: string | null
          tipo?: Database['public']['Enums']['tipo_usuario']
          ultimo_alerta_saldo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      usuarios_pf: {
        Row: {
          cpf: string
          data_nascimento: string | null
          documento_identidade_url: string | null
          id: string
          nome: string
          selfie_url: string | null
          user_id: string
        }
        Insert: {
          cpf: string
          data_nascimento?: string | null
          documento_identidade_url?: string | null
          id?: string
          nome: string
          selfie_url?: string | null
          user_id: string
        }
        Update: {
          cpf?: string
          data_nascimento?: string | null
          documento_identidade_url?: string | null
          id?: string
          nome?: string
          selfie_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'usuarios_pf_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          },
        ]
      }
      usuarios_pj: {
        Row: {
          cnpj: string
          documentos_url: string | null
          id: string
          razao_social: string
          resp_cpf: string | null
          resp_data_nascimento: string | null
          resp_documento_url: string | null
          resp_nome: string | null
          resp_selfie_url: string | null
          user_id: string
        }
        Insert: {
          cnpj: string
          documentos_url?: string | null
          id?: string
          razao_social: string
          resp_cpf?: string | null
          resp_data_nascimento?: string | null
          resp_documento_url?: string | null
          resp_nome?: string | null
          resp_selfie_url?: string | null
          user_id: string
        }
        Update: {
          cnpj?: string
          documentos_url?: string | null
          id?: string
          razao_social?: string
          resp_cpf?: string | null
          resp_data_nascimento?: string | null
          resp_documento_url?: string | null
          resp_nome?: string | null
          resp_selfie_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'usuarios_pj_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_update_user_email: {
        Args: { p_email: string; p_user_id: string }
        Returns: undefined
      }
      aprovar_requisicao: {
        Args: { p_admin_id: string; req_id: string }
        Returns: undefined
      }
      aprovar_usuario: {
        Args: { p_admin_id: string; p_user_id: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      realizar_deposito: {
        Args: { p_admin_id: string; p_cliente_id: string; p_valor: number }
        Returns: undefined
      }
      reprovar_requisicao: {
        Args: { p_admin_id: string; req_id: string }
        Returns: undefined
      }
      reprovar_usuario: {
        Args: { p_admin_id: string; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      role_usuario: 'cliente' | 'admin'
      status_usuario: 'pendente' | 'aprovado' | 'reprovado'
      tipo_usuario: 'PF' | 'PJ'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      role_usuario: ['cliente', 'admin'],
      status_usuario: ['pendente', 'aprovado', 'reprovado'],
      tipo_usuario: ['PF', 'PJ'],
    },
  },
} as const

// ====== DATABASE EXTENDED CONTEXT (auto-generated) ======
// This section contains actual PostgreSQL column types, constraints, RLS policies,
// functions, triggers, indexes and materialized views not present in the type definitions above.
// IMPORTANT: The TypeScript types above map UUID, TEXT, VARCHAR all to "string".
// Use the COLUMN TYPES section below to know the real PostgreSQL type for each column.
// Always use the correct PostgreSQL type when writing SQL migrations.

// --- COLUMN TYPES (actual PostgreSQL types) ---
// Use this to know the real database type when writing migrations.
// "string" in TypeScript types above may be uuid, text, varchar, timestamptz, etc.
// Table: auditoria
//   id: uuid (not null, default: gen_random_uuid())
//   admin_id: uuid (nullable)
//   acao: text (not null)
//   tabela: text (not null)
//   registro_id: uuid (not null)
//   taxa_aplicada: numeric (nullable)
//   timestamp: timestamp with time zone (not null, default: now())
// Table: cestas_clientes
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (not null)
//   nome: text (not null)
//   ativo: boolean (not null, default: true)
//   created_at: timestamp with time zone (not null, default: now())
// Table: cestas_itens
//   id: uuid (not null, default: gen_random_uuid())
//   cesta_id: uuid (not null)
//   servico_id: uuid (not null)
//   taxa_percentual: numeric (not null, default: 0)
//   taxa_fixa: numeric (not null, default: 0)
//   ativo: boolean (not null, default: true)
// Table: contas
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (not null)
//   saldo: numeric (not null, default: 0)
//   saldo_bloqueado: numeric (not null, default: 0)
// Table: depositos
//   id: uuid (not null, default: gen_random_uuid())
//   admin_id: uuid (nullable)
//   user_id: uuid (not null)
//   valor: numeric (not null)
//   status: text (not null, default: 'pendente'::text)
//   created_at: timestamp with time zone (not null, default: now())
//   confirmed_at: timestamp with time zone (nullable)
// Table: emails_log
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (nullable)
//   tipo: text (not null)
//   status: text (not null)
//   tentativas: integer (nullable, default: 1)
//   proxima_tentativa: timestamp with time zone (nullable)
//   erro: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: emails_pendentes
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (nullable)
//   email: text (not null)
//   assunto: text (not null)
//   template: text (not null)
//   tentativas: integer (nullable, default: 0)
//   erro: text (nullable)
//   status: text (nullable, default: 'pendente'::text)
//   created_at: timestamp with time zone (nullable, default: now())
//   tipo: text (nullable)
//   payload: jsonb (nullable)
//   proxima_tentativa: timestamp with time zone (nullable)
// Table: favorecidos
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (not null)
//   tipo: text (not null)
//   chave_pix: text (nullable)
//   conta: text (nullable)
//   agencia: text (nullable)
//   banco: text (nullable)
//   nome: text (not null)
//   salvo: boolean (not null, default: true)
// Table: historico_logins
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (not null)
//   ip: text (nullable)
//   dispositivo: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
// Table: notificacoes
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (not null)
//   tipo: text (not null)
//   mensagem: text (not null)
//   lida: boolean (not null, default: false)
//   link: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
// Table: password_reset_attempts
//   id: uuid (not null, default: gen_random_uuid())
//   email: text (not null)
//   created_at: timestamp with time zone (not null, default: now())
// Table: password_reset_tokens
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (not null)
//   token: text (not null)
//   email: text (not null)
//   expires_at: timestamp with time zone (not null)
//   used_at: timestamp with time zone (nullable)
//   created_at: timestamp with time zone (not null, default: now())
// Table: requisicoes
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (not null)
//   tipo: text (not null)
//   valor: numeric (not null)
//   taxa_aplicada: numeric (not null, default: 0)
//   valor_total: numeric (not null)
//   status: text (not null, default: 'pendente'::text)
//   hash_cripto: text (nullable)
//   rede: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   processed_at: timestamp with time zone (nullable)
//   processed_by: uuid (nullable)
//   metadados: jsonb (nullable, default: '{}'::jsonb)
// Table: servicos
//   id: uuid (not null, default: gen_random_uuid())
//   nome: text (not null)
//   descricao: text (nullable)
//   ativo: boolean (not null, default: true)
// Table: taxas_servicos
//   id: uuid (not null, default: gen_random_uuid())
//   servico_id: uuid (not null)
//   percentual: numeric (not null, default: 0)
//   valor_fixo: numeric (not null, default: 0)
//   descricao: text (nullable)
// Table: transacoes
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (not null)
//   tipo: text (not null)
//   transacao_pai_id: uuid (nullable)
//   descricao: text (not null)
//   descricao_taxa: text (nullable)
//   valor: numeric (not null)
//   tipo_movimento: text (not null)
//   saldo_anterior: numeric (not null, default: 0)
//   saldo_posterior: numeric (not null, default: 0)
//   status: text (not null, default: 'pendente'::text)
//   data_operacao: timestamp with time zone (not null, default: now())
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: usuarios
//   id: uuid (not null)
//   email: text (not null)
//   tipo: tipo_usuario (not null, default: 'PF'::tipo_usuario)
//   status: status_usuario (not null, default: 'pendente'::status_usuario)
//   role: role_usuario (not null, default: 'cliente'::role_usuario)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
//   limite_alerta_saldo: numeric (not null, default: 500)
//   ultimo_alerta_saldo: timestamp with time zone (nullable)
//   telefone: text (nullable)
//   endereco_rua: text (nullable)
//   endereco_numero: text (nullable)
//   endereco_complemento: text (nullable)
//   endereco_cep: text (nullable)
//   endereco_cidade: text (nullable)
//   endereco_estado: text (nullable)
//   foto_url: text (nullable)
// Table: usuarios_pf
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (not null)
//   cpf: text (not null)
//   nome: text (not null)
//   data_nascimento: date (nullable)
//   selfie_url: text (nullable)
//   documento_identidade_url: text (nullable)
// Table: usuarios_pj
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (not null)
//   cnpj: text (not null)
//   razao_social: text (not null)
//   documentos_url: text (nullable)
//   resp_nome: text (nullable)
//   resp_cpf: text (nullable)
//   resp_data_nascimento: date (nullable)
//   resp_selfie_url: text (nullable)
//   resp_documento_url: text (nullable)

// --- CONSTRAINTS ---
// Table: auditoria
//   FOREIGN KEY auditoria_admin_id_fkey: FOREIGN KEY (admin_id) REFERENCES usuarios(id)
//   PRIMARY KEY auditoria_pkey: PRIMARY KEY (id)
// Table: cestas_clientes
//   PRIMARY KEY cestas_clientes_pkey: PRIMARY KEY (id)
//   FOREIGN KEY cestas_clientes_user_id_fkey: FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
// Table: cestas_itens
//   FOREIGN KEY cestas_itens_cesta_id_fkey: FOREIGN KEY (cesta_id) REFERENCES cestas_clientes(id) ON DELETE CASCADE
//   PRIMARY KEY cestas_itens_pkey: PRIMARY KEY (id)
//   FOREIGN KEY cestas_itens_servico_id_fkey: FOREIGN KEY (servico_id) REFERENCES servicos(id) ON DELETE CASCADE
// Table: contas
//   PRIMARY KEY contas_pkey: PRIMARY KEY (id)
//   FOREIGN KEY contas_user_id_fkey: FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
//   UNIQUE contas_user_id_key: UNIQUE (user_id)
// Table: depositos
//   FOREIGN KEY depositos_admin_id_fkey: FOREIGN KEY (admin_id) REFERENCES usuarios(id)
//   PRIMARY KEY depositos_pkey: PRIMARY KEY (id)
//   FOREIGN KEY depositos_user_id_fkey: FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
// Table: emails_log
//   PRIMARY KEY emails_log_pkey: PRIMARY KEY (id)
//   FOREIGN KEY emails_log_user_id_fkey: FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
// Table: emails_pendentes
//   PRIMARY KEY emails_pendentes_pkey: PRIMARY KEY (id)
//   FOREIGN KEY emails_pendentes_user_id_fkey: FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
// Table: favorecidos
//   PRIMARY KEY favorecidos_pkey: PRIMARY KEY (id)
//   FOREIGN KEY favorecidos_user_id_fkey: FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
// Table: historico_logins
//   PRIMARY KEY historico_logins_pkey: PRIMARY KEY (id)
//   FOREIGN KEY historico_logins_user_id_fkey: FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
// Table: notificacoes
//   PRIMARY KEY notificacoes_pkey: PRIMARY KEY (id)
//   CHECK notificacoes_tipo_check: CHECK ((tipo = ANY (ARRAY['sucesso'::text, 'aviso'::text, 'erro'::text])))
//   FOREIGN KEY notificacoes_user_id_fkey: FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
// Table: password_reset_attempts
//   PRIMARY KEY password_reset_attempts_pkey: PRIMARY KEY (id)
// Table: password_reset_tokens
//   PRIMARY KEY password_reset_tokens_pkey: PRIMARY KEY (id)
//   UNIQUE password_reset_tokens_token_key: UNIQUE (token)
//   FOREIGN KEY password_reset_tokens_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
// Table: requisicoes
//   PRIMARY KEY requisicoes_pkey: PRIMARY KEY (id)
//   FOREIGN KEY requisicoes_processed_by_fkey: FOREIGN KEY (processed_by) REFERENCES usuarios(id)
//   FOREIGN KEY requisicoes_user_id_fkey: FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
// Table: servicos
//   UNIQUE servicos_nome_key: UNIQUE (nome)
//   PRIMARY KEY servicos_pkey: PRIMARY KEY (id)
// Table: taxas_servicos
//   PRIMARY KEY taxas_servicos_pkey: PRIMARY KEY (id)
//   FOREIGN KEY taxas_servicos_servico_id_fkey: FOREIGN KEY (servico_id) REFERENCES servicos(id) ON DELETE CASCADE
// Table: transacoes
//   PRIMARY KEY transacoes_pkey: PRIMARY KEY (id)
//   CHECK transacoes_status_check: CHECK ((status = ANY (ARRAY['pendente'::text, 'concluido'::text, 'cancelado'::text])))
//   CHECK transacoes_tipo_check: CHECK ((tipo = ANY (ARRAY['operacao'::text, 'taxa'::text])))
//   CHECK transacoes_tipo_movimento_check: CHECK ((tipo_movimento = ANY (ARRAY['entrada'::text, 'saida'::text])))
//   FOREIGN KEY transacoes_transacao_pai_id_fkey: FOREIGN KEY (transacao_pai_id) REFERENCES transacoes(id) ON DELETE CASCADE
//   FOREIGN KEY transacoes_user_id_fkey: FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
//   CHECK transacoes_valor_check: CHECK ((valor >= (0)::numeric))
// Table: usuarios
//   FOREIGN KEY usuarios_id_fkey: FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
//   PRIMARY KEY usuarios_pkey: PRIMARY KEY (id)
// Table: usuarios_pf
//   UNIQUE usuarios_pf_cpf_key: UNIQUE (cpf)
//   PRIMARY KEY usuarios_pf_pkey: PRIMARY KEY (id)
//   FOREIGN KEY usuarios_pf_user_id_fkey: FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
// Table: usuarios_pj
//   UNIQUE usuarios_pj_cnpj_key: UNIQUE (cnpj)
//   PRIMARY KEY usuarios_pj_pkey: PRIMARY KEY (id)
//   FOREIGN KEY usuarios_pj_user_id_fkey: FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE

// --- ROW LEVEL SECURITY POLICIES ---
// Table: auditoria
//   Policy "auditoria_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: is_admin()
//   Policy "auditoria_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios   WHERE ((usuarios.id = auth.uid()) AND (usuarios.role = 'admin'::role_usuario))))
// Table: cestas_clientes
//   Policy "cestas_clientes_admin_all" (ALL, PERMISSIVE) roles={authenticated}
//     USING: is_admin()
//     WITH CHECK: is_admin()
//   Policy "cestas_clientes_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
// Table: cestas_itens
//   Policy "cestas_itens_admin_all" (ALL, PERMISSIVE) roles={authenticated}
//     USING: is_admin()
//     WITH CHECK: is_admin()
//   Policy "cestas_itens_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (cesta_id IN ( SELECT cestas_clientes.id    FROM cestas_clientes   WHERE (cestas_clientes.user_id = auth.uid())))
// Table: contas
//   Policy "contas_admin_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: is_admin()
//   Policy "contas_insert" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: true
//   Policy "contas_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
//   Policy "contas_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
// Table: depositos
//   Policy "depositos_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (user_id = auth.uid())
//   Policy "depositos_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
// Table: emails_log
//   Policy "admin_all_emails_log" (ALL, PERMISSIVE) roles={authenticated}
//     USING: is_admin()
// Table: emails_pendentes
//   Policy "admin_all_emails_pendentes" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios   WHERE ((usuarios.id = auth.uid()) AND (usuarios.role = 'admin'::role_usuario))))
// Table: favorecidos
//   Policy "favorecidos_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (user_id = auth.uid())
//   Policy "favorecidos_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
// Table: historico_logins
//   Policy "historico_logins_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (user_id = auth.uid())
//   Policy "historico_logins_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
// Table: notificacoes
//   Policy "notificacoes_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
//   Policy "notificacoes_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
//     WITH CHECK: (user_id = auth.uid())
// Table: password_reset_attempts
//   Policy "admin_all_attempts" (ALL, PERMISSIVE) roles={authenticated}
//     USING: is_admin()
//     WITH CHECK: is_admin()
// Table: password_reset_tokens
//   Policy "admin_delete_token" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios   WHERE ((usuarios.id = auth.uid()) AND (usuarios.role = 'admin'::role_usuario))))
//   Policy "public_insert_token" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: true
//   Policy "public_select_token" (SELECT, PERMISSIVE) roles={public}
//     USING: ((expires_at > now()) AND (used_at IS NULL))
//   Policy "public_update_token" (UPDATE, PERMISSIVE) roles={public}
//     USING: ((expires_at > now()) AND (used_at IS NULL))
//     WITH CHECK: true
// Table: requisicoes
//   Policy "requisicoes_admin_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: is_admin()
//   Policy "requisicoes_admin_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: is_admin()
//     WITH CHECK: is_admin()
//   Policy "requisicoes_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (user_id = auth.uid())
//   Policy "requisicoes_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
// Table: servicos
//   Policy "servicos_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "servicos_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: is_admin()
//     WITH CHECK: is_admin()
// Table: taxas_servicos
//   Policy "taxas_servicos_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: is_admin()
//   Policy "taxas_servicos_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "taxas_servicos_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: is_admin()
//     WITH CHECK: is_admin()
// Table: transacoes
//   Policy "transacoes_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: ((user_id = auth.uid()) AND (status = 'cancelado'::text))
//   Policy "transacoes_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (user_id = auth.uid())
//   Policy "transacoes_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
//   Policy "transacoes_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: ((user_id = auth.uid()) AND (status <> 'concluido'::text))
//     WITH CHECK: ((user_id = auth.uid()) AND (status <> 'concluido'::text))
// Table: usuarios
//   Policy "usuarios_admin_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: is_admin()
//     WITH CHECK: is_admin()
//   Policy "usuarios_insert" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: true
//   Policy "usuarios_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((id = auth.uid()) OR is_admin())
//   Policy "usuarios_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (id = auth.uid())
// Table: usuarios_pf
//   Policy "usuarios_pf_admin_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: is_admin()
//   Policy "usuarios_pf_insert" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: true
//   Policy "usuarios_pf_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
//   Policy "usuarios_pf_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
// Table: usuarios_pj
//   Policy "usuarios_pj_admin_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: is_admin()
//   Policy "usuarios_pj_insert" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: true
//   Policy "usuarios_pj_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
//   Policy "usuarios_pj_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())

// --- DATABASE FUNCTIONS ---
// FUNCTION admin_update_user_email(uuid, text)
//   CREATE OR REPLACE FUNCTION public.admin_update_user_email(p_user_id uuid, p_email text)
//    RETURNS void
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     IF NOT public.is_admin() THEN
//       RAISE EXCEPTION 'Acesso negado';
//     END IF;
//
//     UPDATE auth.users
//     SET email = p_email
//     WHERE id = p_user_id;
//
//     UPDATE public.usuarios
//     SET email = p_email
//     WHERE id = p_user_id;
//   END;
//   $function$
//
// FUNCTION aprovar_requisicao(uuid, uuid)
//   CREATE OR REPLACE FUNCTION public.aprovar_requisicao(req_id uuid, p_admin_id uuid)
//    RETURNS void
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     UPDATE public.requisicoes
//     SET status = 'aprovado', processed_by = p_admin_id, processed_at = NOW()
//     WHERE id = req_id;
//
//     -- Insert auditoria
//     INSERT INTO public.auditoria (admin_id, acao, tabela, registro_id)
//     VALUES (p_admin_id, 'aprovou_requisicao', 'requisicoes', req_id);
//   END;
//   $function$
//
// FUNCTION aprovar_usuario(uuid, uuid)
//   CREATE OR REPLACE FUNCTION public.aprovar_usuario(p_user_id uuid, p_admin_id uuid)
//    RETURNS void
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     v_cesta_id uuid;
//   BEGIN
//     -- Update usuario
//     UPDATE public.usuarios SET status = 'aprovado' WHERE id = p_user_id;
//
//     -- Create default cesta if not exists
//     IF NOT EXISTS (SELECT 1 FROM public.cestas_clientes WHERE user_id = p_user_id AND nome = 'Cesta Padrão') THEN
//       INSERT INTO public.cestas_clientes (user_id, nome, ativo)
//       VALUES (p_user_id, 'Cesta Padrão', true)
//       RETURNING id INTO v_cesta_id;
//     END IF;
//
//     -- Insert auditoria
//     INSERT INTO public.auditoria (admin_id, acao, tabela, registro_id)
//     VALUES (p_admin_id, 'aprovou_usuario', 'usuarios', p_user_id);
//   END;
//   $function$
//
// FUNCTION handle_new_user()
//   CREATE OR REPLACE FUNCTION public.handle_new_user()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     v_limite numeric;
//   BEGIN
//     -- Tenta pegar o limite configurado do admin
//     SELECT limite_alerta_saldo INTO v_limite FROM public.usuarios WHERE role = 'admin' LIMIT 1;
//     IF v_limite IS NULL THEN
//       v_limite := 500;
//     END IF;
//
//     INSERT INTO public.usuarios (id, email, role, status, tipo, limite_alerta_saldo)
//     VALUES (
//       NEW.id,
//       NEW.email,
//       'cliente',
//       'pendente',
//       COALESCE((NEW.raw_user_meta_data->>'tipo'), 'PF')::public.tipo_usuario,
//       v_limite
//     )
//     ON CONFLICT (id) DO UPDATE SET
//       status = 'pendente',
//       tipo = EXCLUDED.tipo;
//
//     INSERT INTO public.contas (user_id, saldo, saldo_bloqueado)
//     VALUES (NEW.id, 0, 0)
//     ON CONFLICT (user_id) DO NOTHING;
//
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION is_admin()
//   CREATE OR REPLACE FUNCTION public.is_admin()
//    RETURNS boolean
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     RETURN EXISTS (
//       SELECT 1
//       FROM public.usuarios
//       WHERE id = auth.uid() AND role = 'admin'
//     );
//   END;
//   $function$
//
// FUNCTION notify_admin_new_requisicao()
//   CREATE OR REPLACE FUNCTION public.notify_admin_new_requisicao()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     v_nome text;
//   BEGIN
//     SELECT COALESCE(pf.nome, pj.razao_social, 'Cliente') INTO v_nome
//     FROM public.usuarios u
//     LEFT JOIN public.usuarios_pf pf ON u.id = pf.user_id
//     LEFT JOIN public.usuarios_pj pj ON u.id = pj.user_id
//     WHERE u.id = NEW.user_id
//     LIMIT 1;
//
//     INSERT INTO public.notificacoes (user_id, tipo, mensagem, link)
//     SELECT id, 'aviso', 'Nova requisição de ' || v_nome || ' aguardando análise', '/admin/painel'
//     FROM public.usuarios WHERE role = 'admin';
//
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION notify_admin_new_usuario_pf()
//   CREATE OR REPLACE FUNCTION public.notify_admin_new_usuario_pf()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     INSERT INTO public.notificacoes (user_id, tipo, mensagem, link)
//     SELECT id, 'aviso', 'Novo cadastro de ' || NEW.nome || ' aguardando aprovação', '/admin/clientes'
//     FROM public.usuarios WHERE role = 'admin';
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION notify_admin_new_usuario_pj()
//   CREATE OR REPLACE FUNCTION public.notify_admin_new_usuario_pj()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     INSERT INTO public.notificacoes (user_id, tipo, mensagem, link)
//     SELECT id, 'aviso', 'Novo cadastro de ' || NEW.razao_social || ' aguardando aprovação', '/admin/clientes'
//     FROM public.usuarios WHERE role = 'admin';
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION notify_depositos()
//   CREATE OR REPLACE FUNCTION public.notify_depositos()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     IF NEW.admin_id IS NOT NULL THEN
//       INSERT INTO public.notificacoes (user_id, tipo, mensagem, link)
//       VALUES (NEW.user_id, 'sucesso', 'Depósito de R$ ' || NEW.valor || ' recebido com sucesso', '/extrato');
//     END IF;
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION notify_requisicoes_update()
//   CREATE OR REPLACE FUNCTION public.notify_requisicoes_update()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     IF OLD.status = 'pendente' AND NEW.status = 'aprovado' THEN
//       INSERT INTO public.notificacoes (user_id, tipo, mensagem, link)
//       VALUES (NEW.user_id, 'sucesso', 'Sua requisição de R$ ' || NEW.valor_total || ' foi aprovada', '/extrato');
//     ELSIF OLD.status = 'pendente' AND NEW.status = 'reprovado' THEN
//       INSERT INTO public.notificacoes (user_id, tipo, mensagem, link)
//       VALUES (NEW.user_id, 'erro', 'Sua requisição de R$ ' || NEW.valor_total || ' foi reprovada', '/extrato');
//     END IF;
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION notify_usuarios_update()
//   CREATE OR REPLACE FUNCTION public.notify_usuarios_update()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     IF OLD.status = 'pendente' AND NEW.status = 'aprovado' THEN
//       INSERT INTO public.notificacoes (user_id, tipo, mensagem, link)
//       VALUES (NEW.id, 'sucesso', 'Seu cadastro foi aprovado! Bem-vindo', '/perfil');
//     ELSIF OLD.status = 'pendente' AND NEW.status = 'reprovado' THEN
//       INSERT INTO public.notificacoes (user_id, tipo, mensagem, link)
//       VALUES (NEW.id, 'erro', 'Seu cadastro foi reprovado', '/perfil');
//     END IF;
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION realizar_deposito(uuid, numeric, uuid)
//   CREATE OR REPLACE FUNCTION public.realizar_deposito(p_cliente_id uuid, p_valor numeric, p_admin_id uuid)
//    RETURNS void
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     v_deposito_id uuid;
//   BEGIN
//     -- Verify if caller is admin
//     IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND role = 'admin') THEN
//       RAISE EXCEPTION 'Acesso negado';
//     END IF;
//
//     -- Update account balance
//     UPDATE public.contas
//     SET saldo = saldo + p_valor
//     WHERE user_id = p_cliente_id;
//
//     -- Insert deposit record
//     INSERT INTO public.depositos (admin_id, user_id, valor, status, confirmed_at)
//     VALUES (p_admin_id, p_cliente_id, p_valor, 'confirmado', NOW())
//     RETURNING id INTO v_deposito_id;
//
//     -- Insert audit log
//     INSERT INTO public.auditoria (admin_id, acao, tabela, registro_id)
//     VALUES (p_admin_id, 'depositou_saldo', 'depositos', v_deposito_id);
//   END;
//   $function$
//
// FUNCTION reprovar_requisicao(uuid, uuid)
//   CREATE OR REPLACE FUNCTION public.reprovar_requisicao(req_id uuid, p_admin_id uuid)
//    RETURNS void
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     v_req record;
//   BEGIN
//     -- get the request
//     SELECT * INTO v_req FROM public.requisicoes WHERE id = req_id;
//
//     IF v_req.status != 'pendente' THEN
//       RAISE EXCEPTION 'Requisição não está pendente';
//     END IF;
//
//     -- update requisicao
//     UPDATE public.requisicoes
//     SET status = 'reprovado', processed_by = p_admin_id, processed_at = NOW()
//     WHERE id = req_id;
//
//     -- return balance to the user
//     UPDATE public.contas
//     SET saldo = saldo + v_req.valor_total
//     WHERE user_id = v_req.user_id;
//
//     -- insert auditoria
//     INSERT INTO public.auditoria (admin_id, acao, tabela, registro_id)
//     VALUES (p_admin_id, 'reprovou_requisicao', 'requisicoes', req_id);
//   END;
//   $function$
//
// FUNCTION reprovar_usuario(uuid, uuid)
//   CREATE OR REPLACE FUNCTION public.reprovar_usuario(p_user_id uuid, p_admin_id uuid)
//    RETURNS void
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     -- Update usuario
//     UPDATE public.usuarios SET status = 'reprovado' WHERE id = p_user_id;
//
//     -- Insert auditoria
//     INSERT INTO public.auditoria (admin_id, acao, tabela, registro_id)
//     VALUES (p_admin_id, 'reprovou_usuario', 'usuarios', p_user_id);
//   END;
//   $function$
//
// FUNCTION trigger_clean_expired_tokens()
//   CREATE OR REPLACE FUNCTION public.trigger_clean_expired_tokens()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//       DELETE FROM public.password_reset_tokens
//       WHERE expires_at < NOW() OR used_at < NOW() - INTERVAL '24 hours';
//       RETURN NULL;
//   END;
//   $function$
//
// FUNCTION trigger_enviar_email_confirmacao_cadastro()
//   CREATE OR REPLACE FUNCTION public.trigger_enviar_email_confirmacao_cadastro()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     edge_function_url text := 'https://hwqaevtrzwfqeldprbsy.supabase.co/functions/v1/enviar_email_confirmacao_cadastro';
//     payload jsonb;
//   BEGIN
//     IF TG_OP = 'INSERT' AND NEW.status = 'pendente' THEN
//       payload := jsonb_build_object(
//         'type', 'INSERT',
//         'table', 'usuarios',
//         'record', row_to_json(NEW)
//       );
//       PERFORM net.http_post(
//           url := edge_function_url,
//           headers := '{"Content-Type": "application/json"}'::jsonb,
//           body := payload
//       );
//     END IF;
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION trigger_notify_alerta_saldo()
//   CREATE OR REPLACE FUNCTION public.trigger_notify_alerta_saldo()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     edge_function_url text := 'https://hwqaevtrzwfqeldprbsy.supabase.co/functions/v1/enviar_email_alerta_saldo_baixo';
//     payload jsonb;
//     v_limite numeric;
//     v_ultimo timestamptz;
//   BEGIN
//     IF TG_OP = 'UPDATE' AND NEW.saldo < OLD.saldo THEN
//       SELECT limite_alerta_saldo, ultimo_alerta_saldo INTO v_limite, v_ultimo
//       FROM public.usuarios WHERE id = NEW.user_id;
//
//       IF NEW.saldo < v_limite AND (v_ultimo IS NULL OR v_ultimo < NOW() - INTERVAL '1 day') THEN
//         payload := jsonb_build_object(
//           'type', 'UPDATE',
//           'table', 'contas',
//           'record', row_to_json(NEW),
//           'old_record', row_to_json(OLD),
//           'limite', v_limite
//         );
//         PERFORM net.http_post(
//             url := edge_function_url,
//             headers := '{"Content-Type": "application/json"}'::jsonb,
//             body := payload
//         );
//       END IF;
//     END IF;
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION trigger_notify_deposito()
//   CREATE OR REPLACE FUNCTION public.trigger_notify_deposito()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     edge_function_url text := 'https://hwqaevtrzwfqeldprbsy.supabase.co/functions/v1/enviar_email_deposito_creditado';
//     payload jsonb;
//   BEGIN
//     IF (TG_OP = 'INSERT' AND NEW.status = 'confirmado') OR
//        (TG_OP = 'UPDATE' AND OLD.status != NEW.status AND NEW.status = 'confirmado') THEN
//       payload := jsonb_build_object(
//         'type', TG_OP,
//         'table', 'depositos',
//         'record', row_to_json(NEW),
//         'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE null END
//       );
//       PERFORM net.http_post(
//           url := edge_function_url,
//           headers := '{"Content-Type": "application/json"}'::jsonb,
//           body := payload
//       );
//     END IF;
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION trigger_notify_requisicao()
//   CREATE OR REPLACE FUNCTION public.trigger_notify_requisicao()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     edge_function_url text := 'https://hwqaevtrzwfqeldprbsy.supabase.co/functions/v1/enviar_email_requisicao_processada';
//     payload jsonb;
//   BEGIN
//     IF OLD.status != NEW.status AND NEW.status IN ('aprovado', 'reprovado') THEN
//       payload := jsonb_build_object(
//         'type', 'UPDATE',
//         'table', 'requisicoes',
//         'record', row_to_json(NEW),
//         'old_record', row_to_json(OLD)
//       );
//       PERFORM net.http_post(
//           url := edge_function_url,
//           headers := '{"Content-Type": "application/json"}'::jsonb,
//           body := payload
//       );
//     END IF;
//     RETURN NEW;
//   END;
//   $function$
//

// --- TRIGGERS ---
// Table: contas
//   on_conta_saldo_updated_notify: CREATE TRIGGER on_conta_saldo_updated_notify AFTER UPDATE ON public.contas FOR EACH ROW EXECUTE FUNCTION trigger_notify_alerta_saldo()
// Table: depositos
//   on_deposito_inserted: CREATE TRIGGER on_deposito_inserted AFTER INSERT ON public.depositos FOR EACH ROW EXECUTE FUNCTION notify_depositos()
//   on_deposito_status_change_notify_email: CREATE TRIGGER on_deposito_status_change_notify_email AFTER INSERT OR UPDATE ON public.depositos FOR EACH ROW EXECUTE FUNCTION trigger_notify_deposito()
// Table: password_reset_tokens
//   on_token_insert_clean: CREATE TRIGGER on_token_insert_clean AFTER INSERT ON public.password_reset_tokens FOR EACH STATEMENT EXECUTE FUNCTION trigger_clean_expired_tokens()
// Table: requisicoes
//   on_requisicao_inserted: CREATE TRIGGER on_requisicao_inserted AFTER INSERT ON public.requisicoes FOR EACH ROW EXECUTE FUNCTION notify_admin_new_requisicao()
//   on_requisicao_status_change_notify_email: CREATE TRIGGER on_requisicao_status_change_notify_email AFTER UPDATE ON public.requisicoes FOR EACH ROW EXECUTE FUNCTION trigger_notify_requisicao()
//   on_requisicao_updated: CREATE TRIGGER on_requisicao_updated AFTER UPDATE ON public.requisicoes FOR EACH ROW EXECUTE FUNCTION notify_requisicoes_update()
// Table: usuarios
//   on_usuario_inserted_notify: CREATE TRIGGER on_usuario_inserted_notify AFTER INSERT ON public.usuarios FOR EACH ROW EXECUTE FUNCTION trigger_enviar_email_confirmacao_cadastro()
//   on_usuario_updated: CREATE TRIGGER on_usuario_updated AFTER UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION notify_usuarios_update()
// Table: usuarios_pf
//   on_usuario_pf_inserted: CREATE TRIGGER on_usuario_pf_inserted AFTER INSERT ON public.usuarios_pf FOR EACH ROW EXECUTE FUNCTION notify_admin_new_usuario_pf()
// Table: usuarios_pj
//   on_usuario_pj_inserted: CREATE TRIGGER on_usuario_pj_inserted AFTER INSERT ON public.usuarios_pj FOR EACH ROW EXECUTE FUNCTION notify_admin_new_usuario_pj()

// --- INDEXES ---
// Table: contas
//   CREATE UNIQUE INDEX contas_user_id_key ON public.contas USING btree (user_id)
// Table: notificacoes
//   CREATE INDEX notificacoes_user_id_idx ON public.notificacoes USING btree (user_id)
// Table: password_reset_attempts
//   CREATE INDEX password_reset_attempts_created_at_idx ON public.password_reset_attempts USING btree (created_at)
//   CREATE INDEX password_reset_attempts_email_idx ON public.password_reset_attempts USING btree (email)
// Table: password_reset_tokens
//   CREATE INDEX password_reset_tokens_expires_at_idx ON public.password_reset_tokens USING btree (expires_at)
//   CREATE INDEX password_reset_tokens_token_idx ON public.password_reset_tokens USING btree (token)
//   CREATE UNIQUE INDEX password_reset_tokens_token_key ON public.password_reset_tokens USING btree (token)
//   CREATE INDEX password_reset_tokens_user_id_idx ON public.password_reset_tokens USING btree (user_id)
// Table: servicos
//   CREATE UNIQUE INDEX servicos_nome_key ON public.servicos USING btree (nome)
// Table: transacoes
//   CREATE INDEX transacoes_data_operacao_idx ON public.transacoes USING btree (data_operacao)
//   CREATE INDEX transacoes_status_idx ON public.transacoes USING btree (status)
//   CREATE INDEX transacoes_transacao_pai_id_idx ON public.transacoes USING btree (transacao_pai_id)
//   CREATE INDEX transacoes_user_id_idx ON public.transacoes USING btree (user_id)
// Table: usuarios_pf
//   CREATE UNIQUE INDEX usuarios_pf_cpf_key ON public.usuarios_pf USING btree (cpf)
// Table: usuarios_pj
//   CREATE UNIQUE INDEX usuarios_pj_cnpj_key ON public.usuarios_pj USING btree (cnpj)
