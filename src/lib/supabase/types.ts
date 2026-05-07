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
      requisicoes: {
        Row: {
          created_at: string
          hash_cripto: string | null
          id: string
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
      usuarios: {
        Row: {
          created_at: string
          email: string
          id: string
          role: Database['public']['Enums']['role_usuario']
          status: Database['public']['Enums']['status_usuario']
          tipo: Database['public']['Enums']['tipo_usuario']
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          role?: Database['public']['Enums']['role_usuario']
          status?: Database['public']['Enums']['status_usuario']
          tipo?: Database['public']['Enums']['tipo_usuario']
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          role?: Database['public']['Enums']['role_usuario']
          status?: Database['public']['Enums']['status_usuario']
          tipo?: Database['public']['Enums']['tipo_usuario']
          updated_at?: string
        }
        Relationships: []
      }
      usuarios_pf: {
        Row: {
          cpf: string
          data_nascimento: string | null
          id: string
          nome: string
          selfie_url: string | null
          user_id: string
        }
        Insert: {
          cpf: string
          data_nascimento?: string | null
          id?: string
          nome: string
          selfie_url?: string | null
          user_id: string
        }
        Update: {
          cpf?: string
          data_nascimento?: string | null
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
          user_id: string
        }
        Insert: {
          cnpj: string
          documentos_url?: string | null
          id?: string
          razao_social: string
          user_id: string
        }
        Update: {
          cnpj?: string
          documentos_url?: string | null
          id?: string
          razao_social?: string
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
      is_admin: { Args: never; Returns: boolean }
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
// Table: usuarios
//   id: uuid (not null)
//   email: text (not null)
//   tipo: tipo_usuario (not null, default: 'PF'::tipo_usuario)
//   status: status_usuario (not null, default: 'pendente'::status_usuario)
//   role: role_usuario (not null, default: 'cliente'::role_usuario)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: usuarios_pf
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (not null)
//   cpf: text (not null)
//   nome: text (not null)
//   data_nascimento: date (nullable)
//   selfie_url: text (nullable)
// Table: usuarios_pj
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (not null)
//   cnpj: text (not null)
//   razao_social: text (not null)
//   documentos_url: text (nullable)

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
// Table: favorecidos
//   PRIMARY KEY favorecidos_pkey: PRIMARY KEY (id)
//   FOREIGN KEY favorecidos_user_id_fkey: FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
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
//   Policy "auditoria_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios   WHERE ((usuarios.id = auth.uid()) AND (usuarios.role = 'admin'::role_usuario))))
// Table: cestas_clientes
//   Policy "cestas_clientes_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
// Table: cestas_itens
//   Policy "cestas_itens_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (cesta_id IN ( SELECT cestas_clientes.id    FROM cestas_clientes   WHERE (cestas_clientes.user_id = auth.uid())))
// Table: contas
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
// Table: favorecidos
//   Policy "favorecidos_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (user_id = auth.uid())
//   Policy "favorecidos_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
// Table: requisicoes
//   Policy "requisicoes_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (user_id = auth.uid())
//   Policy "requisicoes_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
// Table: servicos
//   Policy "servicos_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
// Table: taxas_servicos
//   Policy "taxas_servicos_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
// Table: usuarios
//   Policy "usuarios_insert" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: true
//   Policy "usuarios_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((id = auth.uid()) OR is_admin())
//   Policy "usuarios_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (id = auth.uid())
// Table: usuarios_pf
//   Policy "usuarios_pf_insert" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: true
//   Policy "usuarios_pf_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
//   Policy "usuarios_pf_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
// Table: usuarios_pj
//   Policy "usuarios_pj_insert" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: true
//   Policy "usuarios_pj_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
//   Policy "usuarios_pj_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())

// --- DATABASE FUNCTIONS ---
// FUNCTION handle_new_user()
//   CREATE OR REPLACE FUNCTION public.handle_new_user()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     INSERT INTO public.usuarios (id, email, role, status, tipo)
//     VALUES (
//       NEW.id,
//       NEW.email,
//       'cliente',
//       'pendente',
//       COALESCE((NEW.raw_user_meta_data->>'tipo'), 'PF')::public.tipo_usuario
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

// --- INDEXES ---
// Table: contas
//   CREATE UNIQUE INDEX contas_user_id_key ON public.contas USING btree (user_id)
// Table: servicos
//   CREATE UNIQUE INDEX servicos_nome_key ON public.servicos USING btree (nome)
// Table: usuarios_pf
//   CREATE UNIQUE INDEX usuarios_pf_cpf_key ON public.usuarios_pf USING btree (cpf)
// Table: usuarios_pj
//   CREATE UNIQUE INDEX usuarios_pj_cnpj_key ON public.usuarios_pj USING btree (cnpj)
