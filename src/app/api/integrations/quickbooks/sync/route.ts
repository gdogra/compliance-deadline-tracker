import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncCustomersToClients } from '@/lib/integrations/quickbooks'
import { logSync } from '@/lib/integrations'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userData } = await supabase
    .from('users')
    .select('firm_id')
    .eq('id', user.id)
    .single()

  if (!userData?.firm_id) {
    return NextResponse.json({ error: 'No firm associated' }, { status: 400 })
  }

  // Get integration
  const { data: integration } = await supabase
    .from('integrations')
    .select('*')
    .eq('firm_id', userData.firm_id)
    .eq('provider', 'quickbooks')
    .single()

  if (!integration || integration.status !== 'connected') {
    return NextResponse.json({ error: 'QuickBooks not connected' }, { status: 400 })
  }

  const startedAt = new Date().toISOString()

  try {
    // Update status to syncing
    await supabase
      .from('integrations')
      .update({ status: 'syncing' })
      .eq('id', integration.id)

    const result = await syncCustomersToClients(
      integration,
      userData.firm_id,
      supabase
    )

    // Log the sync
    await logSync({
      integration_id: integration.id,
      action: 'sync',
      status: 'success',
      records_processed: result.created + result.updated + result.skipped,
      records_created: result.created,
      records_updated: result.updated,
      records_failed: 0,
      started_at: startedAt,
      completed_at: new Date().toISOString(),
    })

    // Update integration
    await supabase
      .from('integrations')
      .update({
        status: 'connected',
        last_sync_at: new Date().toISOString(),
        last_error: null,
      })
      .eq('id', integration.id)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'

    await logSync({
      integration_id: integration.id,
      action: 'sync',
      status: 'failed',
      records_processed: 0,
      records_created: 0,
      records_updated: 0,
      records_failed: 0,
      error_details: errorMsg,
      started_at: startedAt,
      completed_at: new Date().toISOString(),
    })

    await supabase
      .from('integrations')
      .update({
        status: 'error',
        last_error: errorMsg,
      })
      .eq('id', integration.id)

    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
