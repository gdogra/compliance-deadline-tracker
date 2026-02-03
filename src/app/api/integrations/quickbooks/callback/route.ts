import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeCodeForTokens } from '@/lib/integrations/quickbooks'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const realmId = searchParams.get('realmId')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      new URL(`/integrations?error=${encodeURIComponent(error)}`, request.url)
    )
  }

  if (!code || !state || !realmId) {
    return NextResponse.redirect(
      new URL('/integrations?error=missing_params', request.url)
    )
  }

  // Validate state
  const cookieStore = await cookies()
  const storedState = cookieStore.get('qb_oauth_state')
  
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

  // Clear the state cookie
  cookieStore.delete('qb_oauth_state')

  try {
    const config = {
      clientId: process.env.QUICKBOOKS_CLIENT_ID || '',
      clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET || '',
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/quickbooks/callback`,
      environment: (process.env.QUICKBOOKS_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production',
    }

    const tokens = await exchangeCodeForTokens(config, code, realmId)

    // TODO: Store integration in database
    // Table 'integrations' needs to be created first
    const supabase = await createClient()
    // await supabase.from('integrations').upsert({
    //   firm_id,
    //   provider: 'quickbooks',
    //   status: 'connected',
    //   access_token: tokens.access_token,
    //   refresh_token: tokens.refresh_token,
    //   token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    //   settings: {
    //     realm_id: realmId,
    //     auto_import_clients: true,
    //     sync_frequency: 'daily',
    //     import_inactive_clients: false,
    //   },
    //   updated_at: new Date().toISOString(),
    // }, {
    //   onConflict: 'firm_id,provider',
    // })

    return NextResponse.redirect(
      new URL('/integrations?success=quickbooks', request.url)
    )
  } catch (err) {
    console.error('QuickBooks callback error:', err)
    return NextResponse.redirect(
      new URL(`/integrations?error=${encodeURIComponent(err instanceof Error ? err.message : 'Unknown error')}`, request.url)
    )
  }
}
