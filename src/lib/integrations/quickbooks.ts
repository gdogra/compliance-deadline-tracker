// QuickBooks Integration Service
import { IntegrationConfig, QuickBooksCustomer } from '@/types/integrations'

const QB_AUTH_URL = 'https://appcenter.intuit.com/connect/oauth2'
const QB_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer'
const QB_API_BASE = 'https://quickbooks.api.intuit.com/v3/company'

export interface QuickBooksConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  environment: 'sandbox' | 'production'
}

export function getAuthorizationUrl(config: QuickBooksConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'com.intuit.quickbooks.accounting',
    state,
  })
  return `${QB_AUTH_URL}?${params.toString()}`
}

export async function exchangeCodeForTokens(
  config: QuickBooksConfig,
  code: string,
  realmId: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number; realm_id: string }> {
  const response = await fetch(QB_TOKEN_URL, {
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
    throw new Error(`QuickBooks token exchange failed: ${response.statusText}`)
  }

  const data = await response.json()
  return { ...data, realm_id: realmId }
}

export async function refreshAccessToken(
  config: QuickBooksConfig,
  refreshToken: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const response = await fetch(QB_TOKEN_URL, {
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
    throw new Error(`QuickBooks token refresh failed: ${response.statusText}`)
  }

  return response.json()
}

export async function fetchCustomers(
  accessToken: string,
  realmId: string,
  includeInactive = false
): Promise<QuickBooksCustomer[]> {
  const query = includeInactive
    ? "SELECT * FROM Customer MAXRESULTS 1000"
    : "SELECT * FROM Customer WHERE Active = true MAXRESULTS 1000"

  const response = await fetch(
    `${QB_API_BASE}/${realmId}/query?query=${encodeURIComponent(query)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    }
  )

  if (!response.ok) {
    throw new Error(`QuickBooks API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data.QueryResponse?.Customer || []
}

export function mapCustomerToClient(customer: QuickBooksCustomer) {
  return {
    external_id: customer.Id,
    name: customer.DisplayName || customer.CompanyName || 'Unknown',
    contact_email: customer.PrimaryEmailAddr?.Address || null,
    contact_phone: customer.PrimaryPhone?.FreeFormNumber || null,
    is_active: customer.Active,
    // Default entity type - user should refine this
    entity_type: 'llc' as const,
    states: [],
    tax_types: [],
    fiscal_year_end: '12-31',
  }
}

export async function syncCustomersToClients(
  integration: IntegrationConfig,
  firmId: string,
  supabase: any
): Promise<{ created: number; updated: number; skipped: number }> {
  const settings = integration.settings as any
  const customers = await fetchCustomers(
    integration.access_token!,
    settings.realm_id,
    settings.import_inactive_clients
  )

  let created = 0, updated = 0, skipped = 0

  for (const customer of customers) {
    const clientData = mapCustomerToClient(customer)

    // Check if client exists by external ID or name
    const { data: existing } = await supabase
      .from('clients')
      .select('id')
      .eq('firm_id', firmId)
      .or(`external_id.eq.${customer.Id},name.eq.${clientData.name}`)
      .single()

    if (existing) {
      if (settings.auto_import_clients) {
        await supabase
          .from('clients')
          .update({ ...clientData, external_id: customer.Id, external_source: 'quickbooks' })
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
          external_id: customer.Id,
          external_source: 'quickbooks',
        })
      created++
    }
  }

  return { created, updated, skipped }
}
