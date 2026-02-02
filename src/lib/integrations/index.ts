// Integration Service - Central Manager
import { createClient } from '@/lib/supabase/client'
import { IntegrationConfig, IntegrationProvider, IntegrationSyncLog } from '@/types/integrations'

export * from './quickbooks'
export * from './xero'
export * from './slack'
export * from './teams'
export * from './docusign'
export * from './email-parser'

// Get environment variables for integrations
export function getIntegrationConfig(provider: IntegrationProvider) {
  const configs: Record<IntegrationProvider, { clientId: string; clientSecret: string; redirectUri: string }> = {
    quickbooks: {
      clientId: process.env.QUICKBOOKS_CLIENT_ID || '',
      clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET || '',
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/quickbooks/callback`,
    },
    xero: {
      clientId: process.env.XERO_CLIENT_ID || '',
      clientSecret: process.env.XERO_CLIENT_SECRET || '',
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/xero/callback`,
    },
    canopy: {
      clientId: process.env.CANOPY_CLIENT_ID || '',
      clientSecret: process.env.CANOPY_CLIENT_SECRET || '',
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/canopy/callback`,
    },
    taxdome: {
      clientId: process.env.TAXDOME_CLIENT_ID || '',
      clientSecret: process.env.TAXDOME_CLIENT_SECRET || '',
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/taxdome/callback`,
    },
    karbon: {
      clientId: process.env.KARBON_CLIENT_ID || '',
      clientSecret: process.env.KARBON_CLIENT_SECRET || '',
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/karbon/callback`,
    },
    docusign: {
      clientId: process.env.DOCUSIGN_CLIENT_ID || '',
      clientSecret: process.env.DOCUSIGN_CLIENT_SECRET || '',
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/docusign/callback`,
    },
    adobe_sign: {
      clientId: process.env.ADOBE_SIGN_CLIENT_ID || '',
      clientSecret: process.env.ADOBE_SIGN_CLIENT_SECRET || '',
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/adobe-sign/callback`,
    },
    slack: {
      clientId: process.env.SLACK_CLIENT_ID || '',
      clientSecret: process.env.SLACK_CLIENT_SECRET || '',
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/slack/callback`,
    },
    teams: {
      clientId: process.env.TEAMS_CLIENT_ID || '',
      clientSecret: process.env.TEAMS_CLIENT_SECRET || '',
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/teams/callback`,
    },
    email_parser: {
      clientId: '',
      clientSecret: '',
      redirectUri: '',
    },
  }

  return configs[provider]
}

// Database operations for integrations
export async function getIntegration(firmId: string, provider: IntegrationProvider): Promise<IntegrationConfig | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('firm_id', firmId)
    .eq('provider', provider)
    .single()

  if (error || !data) return null
  return data as IntegrationConfig
}

export async function getIntegrations(firmId: string): Promise<IntegrationConfig[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('firm_id', firmId)

  if (error) return []
  return data as IntegrationConfig[]
}

export async function upsertIntegration(integration: Partial<IntegrationConfig> & { firm_id: string; provider: IntegrationProvider }): Promise<IntegrationConfig> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('integrations')
    .upsert(
      {
        ...integration,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'firm_id,provider',
      }
    )
    .select()
    .single()

  if (error) throw error
  return data as IntegrationConfig
}

export async function disconnectIntegration(firmId: string, provider: IntegrationProvider): Promise<void> {
  const supabase = createClient()
  await supabase
    .from('integrations')
    .update({
      status: 'disconnected',
      access_token: null,
      refresh_token: null,
      token_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('firm_id', firmId)
    .eq('provider', provider)
}

export async function logSync(log: Omit<IntegrationSyncLog, 'id'>): Promise<void> {
  const supabase = createClient()
  await supabase.from('integration_sync_logs').insert(log)
}

export async function getSyncLogs(integrationId: string, limit = 10): Promise<IntegrationSyncLog[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('integration_sync_logs')
    .select('*')
    .eq('integration_id', integrationId)
    .order('started_at', { ascending: false })
    .limit(limit)

  return data as IntegrationSyncLog[] || []
}

// Generate unique forwarding email for email parser
export function generateForwardingEmail(firmId: string): string {
  const hash = Buffer.from(firmId).toString('base64').substring(0, 8).toLowerCase()
  return `notices-${hash}@parse.deadlinetracker.com`
}

// Token refresh scheduler
export async function refreshExpiringTokens(): Promise<void> {
  const supabase = createClient()
  const expiryThreshold = new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes from now

  const { data: expiring } = await supabase
    .from('integrations')
    .select('*')
    .eq('status', 'connected')
    .lt('token_expires_at', expiryThreshold)
    .not('refresh_token', 'is', null)

  if (!expiring) return

  for (const integration of expiring) {
    try {
      const config = getIntegrationConfig(integration.provider as IntegrationProvider)
      let newTokens

      switch (integration.provider) {
        case 'quickbooks':
          const qb = await import('./quickbooks')
          newTokens = await qb.refreshAccessToken(config as any, integration.refresh_token!)
          break
        case 'xero':
          const xero = await import('./xero')
          newTokens = await xero.refreshAccessToken(config as any, integration.refresh_token!)
          break
        case 'teams':
          const teams = await import('./teams')
          newTokens = await teams.refreshAccessToken(config as any, integration.refresh_token!)
          break
        // Slack tokens don't expire, DocuSign handled separately
        default:
          continue
      }

      if (newTokens) {
        await supabase
          .from('integrations')
          .update({
            access_token: newTokens.access_token,
            refresh_token: newTokens.refresh_token || integration.refresh_token,
            token_expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', integration.id)
      }
    } catch (error) {
      console.error(`Failed to refresh token for ${integration.provider}:`, error)
      await supabase
        .from('integrations')
        .update({
          status: 'error',
          last_error: `Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', integration.id)
    }
  }
}
