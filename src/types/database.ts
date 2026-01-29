export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type EntityType = 
  | 'individual' 
  | 'sole_prop' 
  | 'llc' 
  | 's_corp' 
  | 'c_corp' 
  | 'partnership' 
  | 'non_profit' 
  | 'trust' 
  | 'estate'

export type DeadlineStatus = 'pending' | 'in_progress' | 'completed' | 'extended' | 'missed'

export type UserRole = 'owner' | 'admin' | 'member'

export type Plan = 'free' | 'solo' | 'team' | 'firm'

export interface Database {
  public: {
    Tables: {
      firms: {
        Row: {
          id: string
          name: string
          plan: Plan
          billing_email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          plan?: Plan
          billing_email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          plan?: Plan
          billing_email?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          firm_id: string | null
          email: string
          full_name: string | null
          role: UserRole
          alert_email: boolean
          alert_sms: boolean
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          firm_id?: string | null
          email: string
          full_name?: string | null
          role?: UserRole
          alert_email?: boolean
          alert_sms?: boolean
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          firm_id?: string | null
          email?: string
          full_name?: string | null
          role?: UserRole
          alert_email?: boolean
          alert_sms?: boolean
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          firm_id: string
          name: string
          entity_type: EntityType
          ein: string | null
          ssn_last4: string | null
          contact_email: string | null
          contact_phone: string | null
          states: string[]
          tax_types: string[]
          fiscal_year_end: string
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          firm_id: string
          name: string
          entity_type: EntityType
          ein?: string | null
          ssn_last4?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          states?: string[]
          tax_types?: string[]
          fiscal_year_end?: string
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          firm_id?: string
          name?: string
          entity_type?: EntityType
          ein?: string | null
          ssn_last4?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          states?: string[]
          tax_types?: string[]
          fiscal_year_end?: string
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      deadline_templates: {
        Row: {
          id: string
          jurisdiction: string
          tax_type: string
          entity_types: string[]
          name: string
          description: string | null
          form_number: string | null
          base_date_rule: Json
          penalty_info: string | null
          links: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          jurisdiction: string
          tax_type: string
          entity_types: string[]
          name: string
          description?: string | null
          form_number?: string | null
          base_date_rule: Json
          penalty_info?: string | null
          links?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          jurisdiction?: string
          tax_type?: string
          entity_types?: string[]
          name?: string
          description?: string | null
          form_number?: string | null
          base_date_rule?: Json
          penalty_info?: string | null
          links?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      client_deadlines: {
        Row: {
          id: string
          client_id: string
          template_id: string | null
          name: string
          description: string | null
          form_number: string | null
          due_date: string
          jurisdiction: string
          tax_type: string
          status: DeadlineStatus
          completed_at: string | null
          completed_by: string | null
          extended_to: string | null
          notes: string | null
          penalty_info: string | null
          links: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          template_id?: string | null
          name: string
          description?: string | null
          form_number?: string | null
          due_date: string
          jurisdiction: string
          tax_type: string
          status?: DeadlineStatus
          completed_at?: string | null
          completed_by?: string | null
          extended_to?: string | null
          notes?: string | null
          penalty_info?: string | null
          links?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          template_id?: string | null
          name?: string
          description?: string | null
          form_number?: string | null
          due_date?: string
          jurisdiction?: string
          tax_type?: string
          status?: DeadlineStatus
          completed_at?: string | null
          completed_by?: string | null
          extended_to?: string | null
          notes?: string | null
          penalty_info?: string | null
          links?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_client_deadlines: {
        Args: {
          p_client_id: string
          p_year: number
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Firm = Database['public']['Tables']['firms']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type DeadlineTemplate = Database['public']['Tables']['deadline_templates']['Row']
export type ClientDeadline = Database['public']['Tables']['client_deadlines']['Row']

// Extended types with relations
export type ClientWithDeadlines = Client & {
  client_deadlines: ClientDeadline[]
}

export type DeadlineWithClient = ClientDeadline & {
  clients: Client
}
