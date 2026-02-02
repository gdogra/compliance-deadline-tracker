// Integration Types

export type IntegrationProvider = 
  | 'quickbooks'
  | 'xero'
  | 'canopy'
  | 'taxdome'
  | 'karbon'
  | 'docusign'
  | 'adobe_sign'
  | 'slack'
  | 'teams'
  | 'email_parser'

export type IntegrationStatus = 'disconnected' | 'connected' | 'error' | 'syncing'

export interface IntegrationConfig {
  id: string
  firm_id: string
  provider: IntegrationProvider
  status: IntegrationStatus
  access_token?: string
  refresh_token?: string
  token_expires_at?: string
  webhook_url?: string
  settings: IntegrationSettings
  last_sync_at?: string
  last_error?: string
  created_at: string
  updated_at: string
}

export interface IntegrationSettings {
  // QuickBooks/Xero
  auto_import_clients?: boolean
  sync_frequency?: 'realtime' | 'hourly' | 'daily'
  import_inactive_clients?: boolean
  
  // Slack/Teams
  channel_id?: string
  channel_name?: string
  notify_overdue?: boolean
  notify_upcoming?: boolean
  notify_days_before?: number[]
  
  // DocuSign/Adobe Sign
  template_id?: string
  auto_send_extensions?: boolean
  
  // Email Parser
  forwarding_address?: string
  parse_irs_notices?: boolean
  parse_state_notices?: boolean
  auto_create_deadlines?: boolean
}

export interface IntegrationSyncLog {
  id: string
  integration_id: string
  action: 'import' | 'export' | 'sync' | 'webhook'
  status: 'success' | 'partial' | 'failed'
  records_processed: number
  records_created: number
  records_updated: number
  records_failed: number
  error_details?: string
  started_at: string
  completed_at?: string
}

// OAuth State for PKCE flow
export interface OAuthState {
  provider: IntegrationProvider
  firm_id: string
  redirect_uri: string
  code_verifier?: string
  state: string
  expires_at: number
}

// Provider-specific types
export interface QuickBooksCustomer {
  Id: string
  DisplayName: string
  CompanyName?: string
  PrimaryEmailAddr?: { Address: string }
  PrimaryPhone?: { FreeFormNumber: string }
  Active: boolean
  MetaData: {
    CreateTime: string
    LastUpdatedTime: string
  }
}

export interface XeroContact {
  ContactID: string
  Name: string
  EmailAddress?: string
  Phones?: Array<{ PhoneNumber: string; PhoneType: string }>
  ContactStatus: string
  UpdatedDateUTC: string
}

export interface SlackChannel {
  id: string
  name: string
  is_private: boolean
}

export interface ParsedAgencyNotice {
  notice_type: 'irs' | 'state'
  notice_id?: string
  agency: string
  client_identifier?: string
  due_date?: string
  amount_due?: number
  action_required?: string
  raw_text: string
  confidence: number
}
