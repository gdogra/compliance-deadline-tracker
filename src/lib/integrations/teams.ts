// Microsoft Teams Integration Service
import { IntegrationConfig } from '@/types/integrations'

const MS_AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'
const MS_TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token'
const GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0'

export interface TeamsConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export function getAuthorizationUrl(config: TeamsConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'https://graph.microsoft.com/ChannelMessage.Send https://graph.microsoft.com/Team.ReadBasic.All https://graph.microsoft.com/Channel.ReadBasic.All offline_access',
    state,
  })
  return `${MS_AUTH_URL}?${params.toString()}`
}

export async function exchangeCodeForTokens(
  config: TeamsConfig,
  code: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const response = await fetch(MS_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!response.ok) {
    throw new Error(`Teams token exchange failed: ${response.statusText}`)
  }

  return response.json()
}

export async function refreshAccessToken(
  config: TeamsConfig,
  refreshToken: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const response = await fetch(MS_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    throw new Error(`Teams token refresh failed: ${response.statusText}`)
  }

  return response.json()
}

export interface TeamsTeam {
  id: string
  displayName: string
}

export interface TeamsChannel {
  id: string
  displayName: string
  teamId: string
}

export async function listTeams(accessToken: string): Promise<TeamsTeam[]> {
  const response = await fetch(`${GRAPH_API_BASE}/me/joinedTeams`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Teams API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data.value.map((t: any) => ({
    id: t.id,
    displayName: t.displayName,
  }))
}

export async function listChannels(accessToken: string, teamId: string): Promise<TeamsChannel[]> {
  const response = await fetch(`${GRAPH_API_BASE}/teams/${teamId}/channels`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Teams API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data.value.map((c: any) => ({
    id: c.id,
    displayName: c.displayName,
    teamId,
  }))
}

export async function sendMessage(
  accessToken: string,
  teamId: string,
  channelId: string,
  content: string
): Promise<void> {
  const response = await fetch(
    `${GRAPH_API_BASE}/teams/${teamId}/channels/${channelId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        body: {
          contentType: 'html',
          content,
        },
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`Teams send message failed: ${response.statusText}`)
  }
}

export function buildDeadlineNotificationHtml(
  type: 'overdue' | 'upcoming' | 'due_today',
  deadlines: Array<{
    name: string
    client_name: string
    due_date: string
    form_number?: string
    jurisdiction: string
  }>
): string {
  const emoji = type === 'overdue' ? '🚨' : type === 'due_today' ? '⚠️' : '📅'
  const title = type === 'overdue'
    ? `${emoji} Overdue Deadlines Alert`
    : type === 'due_today'
    ? `${emoji} Deadlines Due Today`
    : `${emoji} Upcoming Deadlines`

  let html = `<h2>${title}</h2><p><strong>${deadlines.length}</strong> deadline(s) need attention</p><table>`
  html += '<tr><th>Client</th><th>Deadline</th><th>Due Date</th><th>Jurisdiction</th></tr>'

  deadlines.slice(0, 10).forEach(d => {
    html += `<tr><td>${d.client_name}</td><td>${d.name} ${d.form_number || ''}</td><td>${d.due_date}</td><td>${d.jurisdiction}</td></tr>`
  })

  html += '</table>'

  if (deadlines.length > 10) {
    html += `<p><em>...and ${deadlines.length - 10} more</em></p>`
  }

  html += `<p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">View All Deadlines →</a></p>`

  return html
}

export async function sendDeadlineAlert(
  integration: IntegrationConfig,
  type: 'overdue' | 'upcoming' | 'due_today',
  deadlines: any[]
): Promise<void> {
  const settings = integration.settings as any
  if (!integration.access_token || !settings.team_id || !settings.channel_id) {
    throw new Error('Teams integration not properly configured')
  }

  const content = buildDeadlineNotificationHtml(type, deadlines)
  await sendMessage(integration.access_token, settings.team_id, settings.channel_id, content)
}
