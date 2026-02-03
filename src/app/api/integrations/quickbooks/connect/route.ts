import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthorizationUrl } from '@/lib/integrations/quickbooks'
import { cookies } from 'next/headers'
import { randomUUID as uuidv4 } from 'crypto'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Get user's firm
  const { data: userData } = await supabase
    .from('users')
    .select('firm_id')
    .eq('id', user.id)
    .single()

  if (!userData) {
    return NextResponse.json({ error: 'No firm associated with user' }, { status: 400 })
  }

  const firmId = (userData as { firm_id: string }).firm_id
  if (!firmId) {
    return NextResponse.json({ error: 'No firm associated with user' }, { status: 400 })
  }

  const state = uuidv4()
  
  // Store state in cookie for validation on callback
  const cookieStore = await cookies()
  cookieStore.set('qb_oauth_state', JSON.stringify({
    state,
    firm_id: firmId,
  }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600, // 10 minutes
    path: '/',
  })

  const config = {
    clientId: process.env.QUICKBOOKS_CLIENT_ID || '',
    clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET || '',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/quickbooks/callback`,
    environment: (process.env.QUICKBOOKS_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production',
  }

  const authUrl = getAuthorizationUrl(config, state)
  return NextResponse.redirect(authUrl)
}
