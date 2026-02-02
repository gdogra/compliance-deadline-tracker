// Xero Integration Service
import { IntegrationConfig, XeroContact } from '@/types/integrations'

const XERO_AUTH_URL = 'https://login.xero.com/identity/connect/authorize'
const XERO_TOKEN_URL = 'https://identity.xero.com/connect/token'
const XERO_API_BASE = 'https://api.xero.com/api.xro/2.0'

export interface XeroConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export function getAuthorizationUrl(config: XeroConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'openid profile email accounting.contacts accounting.settings offline_access',
    state,
  })
  return `${XERO_AUTH_URL}?${params.toString()}`
}

export async function exchangeCodeForTokens(
  config: XeroConfig,
  code: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number; id_token: string }> {
  const response = await fetch(XERO_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.redirectUri,
    }),
  })

  if (!response.ok) {
    throw new Error(`Xero token exchange failed: ${response.statusText}`)
  }

  return response.json()
}

export async function refreshAccessToken(
  config: XeroConfig,
  refreshToken: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const response = await fetch(XERO_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    throw new Error(`Xero token refresh failed: ${response.statusText}`)
  }

  return response.json()
}

export async function getTenantId(accessToken: string): Promise<string> {
  const response = await fetch('https://api.xero.com/connections', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to get Xero tenants: ${response.statusText}`)
  }

  const connections = await response.json()
  if (!connections.length) {
    throw new Error('No Xero organizations connected')
  }

  return connections[0].tenantId
}

export async function fetchContacts(
  accessToken: string,
  tenantId: string,
  includeArchived = false
): Promise<XeroContact[]> {
  const url = includeArchived
    ? `${XERO_API_BASE}/Contacts`
    : `${XERO_API_BASE}/Contacts?where=ContactStatus=="ACTIVE"`

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'xero-tenant-id': tenantId,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Xero API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data.Contacts || []
}

export function mapContactToClient(contact: XeroContact) {
  const phone = contact.Phones?.find(p => p.PhoneNumber)?.PhoneNumber || null

  return {
    external_id: contact.ContactID,
    name: contact.Name,
    contact_email: contact.EmailAddress || null,
    contact_phone: phone,
    is_active: contact.ContactStatus === 'ACTIVE',
    entity_type: 'llc' as const,
    states: [],
    tax_types: [],
    fiscal_year_end: '12-31',
  }
}

export async function syncContactsToClients(
  integration: IntegrationConfig,
  firmId: string,
  supabase: any
): Promise<{ created: number; updated: number; skipped: number }> {
  const settings = integration.settings as any
  const contacts = await fetchContacts(
    integration.access_token!,
    settings.tenant_id,
    settings.import_inactive_clients
  )

  let created = 0, updated = 0, skipped = 0

  for (const contact of contacts) {
    const clientData = mapContactToClient(contact)

    const { data: existing } = await supabase
      .from('clients')
      .select('id')
      .eq('firm_id', firmId)
      .or(`external_id.eq.${contact.ContactID},name.eq.${clientData.name}`)
      .single()

    if (existing) {
      if (settings.auto_import_clients) {
        await supabase
          .from('clients')
          .update({ ...clientData, external_id: contact.ContactID, external_source: 'xero' })
          .eq('id', existing.id)
        updated++
      } else {
        skipped++
      }
    } else {
      await supabase
        .from('clients')
        .insert({
          ...clientData,
          firm_id: firmId,
          external_id: contact.ContactID,
          external_source: 'xero',
        })
      created++
    }
  }

  return { created, updated, skipped }
}
