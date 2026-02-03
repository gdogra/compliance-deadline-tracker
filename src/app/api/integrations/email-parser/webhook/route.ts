import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { processInboundEmail, createDeadlineFromNotice, InboundEmail } from '@/lib/integrations/email-parser'

// Webhook endpoint for inbound email parsing (e.g., SendGrid Inbound Parse)
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    let email: InboundEmail

    if (contentType.includes('application/json')) {
      email = await request.json()
    } else if (contentType.includes('multipart/form-data')) {
      // Handle SendGrid's multipart format
      const formData = await request.formData()
      email = {
        from: formData.get('from') as string || '',
        to: formData.get('to') as string || '',
        subject: formData.get('subject') as string || '',
        text: formData.get('text') as string || '',
        html: formData.get('html') as string || undefined,
      }
    } else {
      return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 })
    }

    // Extract firm ID from the recipient address
    // Format: notices-{hash}@parse.deadlinetracker.com
    const toMatch = email.to.match(/notices-([a-z0-9]+)@/i)
    if (!toMatch) {
      return NextResponse.json({ error: 'Invalid recipient address' }, { status: 400 })
    }

    const firmHash = toMatch[1]

    // TODO: Look up the firm by their forwarding address
    // Table 'integrations' needs to be created first
    const supabase = await createClient()
    // const { data: integration } = await supabase
    //   .from('integrations')
    //   .select('firm_id, settings')
    //   .eq('provider', 'email_parser')
    //   .eq('status', 'connected')
    //   .single()

    // // Verify the hash matches
    // if (!integration) {
    //   return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    // }

    // Mock integration data for now
    const integration = {
      firm_id: 'mock-firm-id',
      settings: { auto_create_deadlines: false }
    }

    // Parse the email for notice information
    const notice = processInboundEmail(email)

    if (!notice) {
      // TODO: Store unparsable email for manual review
      // Table 'parsed_notices' needs to be created first
      // await supabase.from('parsed_notices').insert({
      //   firm_id: integration.firm_id,
      //   raw_email: JSON.stringify(email),
      //   parsed_data: null,
      //   status: 'unparsed',
      //   confidence: 0,
      //   created_at: new Date().toISOString(),
      // })

      return NextResponse.json({ 
        success: true, 
        parsed: false,
        message: 'Email could not be parsed'
      })
    }

    // TODO: Store the parsed notice
    // Table 'parsed_notices' needs to be created first
    // const { data: savedNotice } = await supabase
    //   .from('parsed_notices')
    //   .insert({
    //     firm_id: integration.firm_id,
    //     raw_email: JSON.stringify(email),
    //     parsed_data: notice,
    //     status: 'pending_review',
    //     confidence: notice.confidence,
    //     created_at: new Date().toISOString(),
    //   })
    //   .select()
    //   .single()

    // If auto-create is enabled and confidence is high, try to match client and create deadline
    const settings = integration.settings as any
    if (settings.auto_create_deadlines && notice.confidence >= 0.8 && notice.client_identifier) {
      // Try to find matching client by EIN or SSN
      let clientQuery = supabase.from('clients').select('id').eq('firm_id', integration.firm_id)

      if (notice.client_identifier.startsWith('EIN:')) {
        const ein = notice.client_identifier.replace('EIN: ', '').replace(/-/g, '')
        clientQuery = clientQuery.eq('ein', ein)
      }

      const { data: client } = await clientQuery.single()

      if (client) {
        const clientData = client as { id: string }
        const deadlineData = createDeadlineFromNotice(notice, clientData.id)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('client_deadlines') as any).insert({
          client_id: clientData.id,
          ...deadlineData,
          status: 'pending',
        })

        // TODO: Update notice status
        // await supabase
        //   .from('parsed_notices')
        //   .update({ status: 'deadline_created' })
        //   .eq('id', savedNotice.id)

        return NextResponse.json({
          success: true,
          parsed: true,
          deadline_created: true,
          notice_id: 'temp_id', // savedNotice.id when table exists
        })
      }
    }

    return NextResponse.json({
      success: true,
      parsed: true,
      deadline_created: false,
      notice_id: 'temp_id', // savedNotice?.id when table exists
      confidence: notice.confidence,
    })
  } catch (err) {
    console.error('Email parser webhook error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Verify webhook is working
export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: 'email-parser-webhook' })
}
