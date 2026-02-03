import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeCodeForTokens } from '@/lib/integrations/slack'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      new URL(`/integrations?error=${encodeURIComponent(error)}`, request.url)
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/integrations?error=missing_params', request.url)
    )
  }

  const cookieStore = await cookies()
  const storedState = cookieStore.get('slack_oauth_state')
  
  if (!storedState) {
    return NextResponse.redirect(
      new URL('/integrations?error=invalid_state', request.url)
    )
  }

  const { state: expectedState, firm_id } = JSON.parse(storedState.value)
  
  if (state !== expectedState) {
    return NextResponse.redirect(
      new URL('/integrations?error=state_mismatch', request.url)
    )
  }

  cookieStore.delete('slack_oauth_state')

  try {
    const config = {
      clientId: process.env.SLACK_CLIENT_ID || '',
      clientSecret: process.env.SLACK_CLIENT_SECRET || '',
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/slack/callback`,
    }

    const tokens = await exchangeCodeForTokens(config, code)

    const supabase = await createClient()
    // TODO: Store integration in database
    // Table 'integrations' needs to be created first
    // await supabase.from('integrations').upsert({
    //   firm_id,
    //   provider: 'slack',
    //   status: 'connected',
    //   access_token: tokens.access_token,
    //   settings: {
    //     team_id: tokens.team.id,
    //     team_name: tokens.team.name,
    //     webhook_url: tokens.incoming_webhook?.url,
    //     channel_id: tokens.incoming_webhook?.channel,
    //     notify_overdue: true,
    //     notify_upcoming: true,
    //     notify_days_before: [1, 3, 7],
    //   },
    //   updated_at: new Date().toISOString(),
    // }, {
    //   onConflict: 'firm_id,provider',
    // })

    return NextResponse.redirect(
      new URL('/integrations?success=slack', request.url)
    )
  } catch (err) {
    console.error('Slack callback error:', err)
    return NextResponse.redirect(
      new URL(`/integrations?error=${encodeURIComponent(err instanceof Error ? err.message : 'Unknown error')}`, request.url)
    )
  }
}
