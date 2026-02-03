import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Client, ClientDeadline } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get user session to verify access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clientId, deadlineId, entityType, taxType, jurisdiction } = await request.json()

    // Get client data if client ID provided
    let clientData: Client | null = null
    if (clientId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('clients') as any)
        .select('*')
        .eq('id', clientId)
        .single()
      clientData = data
    }

    // Get deadline data if deadline ID provided
    let deadlineData: ClientDeadline | null = null
    if (deadlineId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('client_deadlines') as any)
        .select('*')
        .eq('id', deadlineId)
        .single()
      deadlineData = data
    }

    // Generate smart recommendations based on available data
    const recommendations = generateSmartRecommendations(
      clientData, 
      deadlineData, 
      entityType, 
      taxType, 
      jurisdiction
    )

    return Response.json({ 
      success: true, 
      recommendations,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error generating smart recommendations:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateSmartRecommendations(
  client: Client | null, 
  deadline: ClientDeadline | null, 
  entityType?: string, 
  taxType?: string, 
  jurisdiction?: string
) {
  const recommendations = []
  
  // Determine entity type to use
  const effectiveEntityType = entityType || client?.entity_type || 'individual'
  
  // Determine tax type to use
  const effectiveTaxType = taxType || deadline?.tax_type || 'income'
  
  // Determine jurisdiction to use
  const effectiveJurisdiction = jurisdiction || deadline?.jurisdiction || 'federal'
  
  // Entity-specific recommendations
  switch (effectiveEntityType) {
    case 'c_corp':
      recommendations.push({
        id: 'c_corp_estimated',
        type: 'estimated_payment',
        title: 'Consider quarterly estimated payments',
        description: 'C-Corps typically need to make quarterly estimated tax payments to avoid penalties',
        priority: 'high',
        action: 'Review payment schedule and ensure timely deposits'
      })
      
      if (effectiveTaxType === 'income') {
        recommendations.push({
          id: 'c_corp_return_deadline',
          type: 'filing_deadline',
          title: 'Corporate tax return deadline',
          description: 'Form 1120 due by March 15th (or 15th day of 3rd month)',
          priority: 'critical',
          action: 'Prepare and file Form 1120 by deadline'
        })
      }
      break
      
    case 's_corp':
      recommendations.push({
        id: 's_corp_estimated',
        type: 'estimated_payment',
        title: 'Estimated payments may be required',
        description: 'S-Corps may need to make estimated tax payments if annual tax liability exceeds threshold',
        priority: 'medium',
        action: 'Calculate if estimated payments are required'
      })
      
      if (effectiveTaxType === 'income') {
        recommendations.push({
          id: 's_corp_return_deadline',
          type: 'filing_deadline',
          title: 'S-Corp tax return deadline',
          description: 'Form 1120S due by March 15th (or 15th day of 3rd month)',
          priority: 'critical',
          action: 'Prepare and file Form 1120S by deadline'
        })
      }
      break
      
    case 'partnership':
      recommendations.push({
        id: 'partnership_k1',
        type: 'k1_distribution',
        title: 'Schedule K-1 distribution',
        description: 'Form 1065 due by March 15th; K-1s must be distributed to partners',
        priority: 'high',
        action: 'Ensure K-1s are prepared and distributed by partner deadline'
      })
      break
      
    case 'llc':
      recommendations.push({
        id: 'llc_classification',
        type: 'classification_review',
        title: 'Review tax classification',
        description: 'LLC tax treatment varies based on election; confirm correct filing requirements',
        priority: 'medium',
        action: 'Verify LLC election status and applicable forms'
      })
      break
      
    default:
      // Individual recommendations
      if (effectiveTaxType === 'estimated') {
        recommendations.push({
          id: 'individual_estimated',
          type: 'estimated_payment',
          title: 'Estimated tax payment strategy',
          description: 'Individuals with self-employment or investment income should consider quarterly payments',
          priority: 'medium',
          action: 'Calculate if estimated payments are needed to avoid underpayment penalty'
        })
      }
  }
  
  // Jurisdiction-specific recommendations
  if (effectiveJurisdiction === 'CA') {
    recommendations.push({
      id: 'ca_state_requirements',
      type: 'state_compliance',
      title: 'California-specific requirements',
      description: 'CA has additional forms and requirements beyond federal',
      priority: 'high',
      action: 'Review FTB forms and state-specific deadlines'
    })
  } else if (effectiveJurisdiction === 'NY') {
    recommendations.push({
      id: 'ny_state_requirements',
      type: 'state_compliance',
      title: 'New York-specific requirements',
      description: 'NY has complex residency and filing requirements',
      priority: 'high',
      action: 'Verify correct forms and filing status for NY'
    })
  }
  
  // Tax-type specific recommendations
  if (effectiveTaxType === 'payroll') {
    recommendations.push({
      id: 'payroll_compliance',
      type: 'payroll_requirements',
      title: 'Payroll tax compliance',
      description: 'Payroll taxes have strict deposit and filing requirements',
      priority: 'critical',
      action: 'Ensure timely deposits and accurate filings to avoid penalties'
    })
    
    recommendations.push({
      id: 'payroll_calendar',
      type: 'payroll_schedule',
      title: 'Payroll tax calendar',
      description: 'Create calendar for payroll tax deposit and filing deadlines',
      priority: 'high',
      action: 'Set up recurring reminders for payroll obligations'
    })
  }
  
  if (effectiveTaxType === 'estimated') {
    recommendations.push({
      id: 'estimated_penalty',
      type: 'penalty_avoidance',
      title: 'Underpayment penalty avoidance',
      description: 'Estimate payments must meet safe harbor requirements',
      priority: 'high',
      action: 'Calculate safe harbor amounts to avoid penalties'
    })
  }
  
  // General recommendations based on client history
  if (client?.notes?.includes('has_missed_deadlines')) {
    recommendations.push({
      id: 'extension_consideration',
      type: 'extension_strategy',
      title: 'Consider filing extensions',
      description: 'Client has history of missed deadlines; extensions may prevent penalties',
      priority: 'high',
      action: 'Evaluate if extension is appropriate for this deadline'
    })
  }
  
  // Return recommendations sorted by priority
  return recommendations.sort((a, b) => {
    const priorityOrder: { [key: string]: number } = { critical: 4, high: 3, medium: 2, low: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })
}