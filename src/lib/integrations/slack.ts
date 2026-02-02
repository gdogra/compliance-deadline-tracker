// Slack Integration Service
import { IntegrationConfig, SlackChannel } from '@/types/integrations'

const SLACK_AUTH_URL = 'https://slack.com/oauth/v2/authorize'
const SLACK_TOKEN_URL = 'https://slack.com/api/oauth.v2.access'
const SLACK_API_BASE = 'https://slack.com/api'

export interface SlackConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export function getAuthorizationUrl(config: SlackConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: 'channels:read,chat:write,chat:write.public,incoming-webhook',
    state,
  })
  return `${SLACK_AUTH_URL}?${params.toString()}`
}

export async function exchangeCodeForTokens(
  config: SlackConfig,
  code: string
): Promise<{ access_token: string; team: { id: string; name: string }; incoming_webhook?: { url: string; channel: string } }> {
  const response = await fetch(SLACK_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri,
    }),
  })

  const data = await response.json()
  if (!data.ok) {
    throw new Error(`Slack token exchange failed: ${data.error}`)
  }

  return data
}

export async function listChannels(accessToken: string): Promise<SlackChannel[]> {
  const response = await fetch(`${SLACK_API_BASE}/conversations.list?types=public_channel,private_channel`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  const data = await response.json()
  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error}`)
  }

  return data.channels.map((ch: any) => ({
    id: ch.id,
    name: ch.name,
    is_private: ch.is_private,
  }))
}

export async function sendMessage(
  accessToken: string,
  channelId: string,
  text: string,
  blocks?: any[]
): Promise<void> {
  const response = await fetch(`${SLACK_API_BASE}/chat.postMessage`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      channel: channelId,
      text,
      blocks,
    }),
  })

  const data = await response.json()
  if (!data.ok) {
    throw new Error(`Slack send message failed: ${data.error}`)
  }
}

// Deadline notification templates
export function buildDeadlineNotification(
  type: 'overdue' | 'upcoming' | 'due_today',
  deadlines: Array<{
    name: string
    client_name: string
    due_date: string
    form_number?: string
    jurisdiction: string
  }>
): { text: string; blocks: any[] } {
  const emoji = type === 'overdue' ? '🚨' : type === 'due_today' ? '⚠️' : '📅'
  const title = type === 'overdue'
    ? `${emoji} Overdue Deadlines Alert`
    : type === 'due_today'
    ? `${emoji} Deadlines Due Today`
    : `${emoji} Upcoming Deadlines`

  const text = `${title}: ${deadlines.length} deadline(s) need attention`

  const blocks: any[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: title, emoji: true },
    },
    { type: 'divider' },
  ]

  deadlines.slice(0, 10).forEach(d => {
    blocks.push({
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*${d.client_name}*\n${d.name}` },
        { type: 'mrkdwn', text: `*Due:* ${d.due_date}\n*${d.jurisdiction}* ${d.form_number || ''}` },
      ],
    })
  })

  if (deadlines.length > 10) {
    blocks.push({
      type: 'context',
      elements: [{ type: 'mrkdwn', text: `_...and ${deadlines.length - 10} more_` }],
    })
  }

  blocks.push({
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: { type: 'plain_text', text: '📋 View All Deadlines', emoji: true },
        url: process.env.NEXT_PUBLIC_APP_URL + '/dashboard',
        action_id: 'view_deadlines',
      },
    ],
  })

  return { text, blocks }
}

export async function sendDeadlineAlert(
  integration: IntegrationConfig,
  type: 'overdue' | 'upcoming' | 'due_today',
  deadlines: any[]
): Promise<void> {
  if (!integration.access_token || !integration.settings.channel_id) {
    throw new Error('Slack integration not properly configured')
  }

  const { text, blocks } = buildDeadlineNotification(type, deadlines)
  await sendMessage(integration.access_token, integration.settings.channel_id, text, blocks)
}
