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

    const { message, context } = await request.json()

    // Validate input
    if (!message) {
      return Response.json({ error: 'Message is required' }, { status: 400 })
    }

    // Get relevant client data if context includes client info
    let clientData = null
    let deadlineData = null
    
    if (context?.clientId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('clients') as any)
        .select('*')
        .eq('id', context.clientId)
        .single()
      clientData = data
    }
    
    if (context?.deadlineId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('client_deadlines') as any)
        .select('*')
        .eq('id', context.deadlineId)
        .single()
      deadlineData = data
    }

    // Process the natural language query
    const response = await processNaturalLanguageQuery(message, clientData, deadlineData, user)

    return Response.json({ 
      success: true, 
      response,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error processing conversational query:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function processNaturalLanguageQuery(message: string, client: Client | null, deadline: ClientDeadline | null, user: any) {
  // Normalize the message for processing
  const lowerMessage = message.toLowerCase()
  
  // Extract intent from the message
  const intent = analyzeIntent(lowerMessage)
  
  // Generate response based on intent
  switch (intent.type) {
    case 'deadline_inquiry':
      return await handleDeadlineInquiry(intent, client, deadline)
    case 'penalty_calculation':
      return await handlePenaltyCalculation(intent, client, deadline)
    case 'extension_request':
      return await handleExtensionRequest(intent, client, deadline)
    case 'compliance_guidance':
      return await handleComplianceGuidance(intent, client, deadline)
    case 'filing_requirement':
      return await handleFilingRequirement(intent, client, deadline)
    default:
      return await handleGeneralInquiry(message, client, deadline)
  }
}

function analyzeIntent(message: string) {
  // Simple keyword-based intent recognition (would be more sophisticated with NLP in production)
  if (message.includes('miss') || message.includes('late') || message.includes('extension')) {
    return { type: 'deadline_inquiry', details: extractDeadlineInfo(message) }
  }
  if (message.includes('penalty') || message.includes('fine') || message.includes('fee')) {
    return { type: 'penalty_calculation', details: extractDeadlineInfo(message) }
  }
  if (message.includes('extension') || message.includes('file extension') || message.includes('more time')) {
    return { type: 'extension_request', details: extractDeadlineInfo(message) }
  }
  if (message.includes('what') && (message.includes('do') || message.includes('need'))) {
    return { type: 'compliance_guidance', details: extractDeadlineInfo(message) }
  }
  if (message.includes('file') || message.includes('filing') || message.includes('form')) {
    return { type: 'filing_requirement', details: extractDeadlineInfo(message) }
  }
  
  return { type: 'general', details: extractDeadlineInfo(message) }
}

function extractDeadlineInfo(message: string) {
  // Extract deadline-related information from the message
  const deadlineRegex = /(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/gi
  const entityRegex = /(individual|s-corp|c-corp|llc|partnership|s-cor[ps])/gi
  const taxTypeRegex = /(income|payroll|estimated|corporate|partnership)/gi
  const jurisdictionRegex = /(federal|state|ca|ny|tx|fl|il)/gi
  
  const deadlineMatch = message.match(deadlineRegex)?.[0] || null
  const entityMatch = message.match(entityRegex)?.[0] || null
  const taxTypeMatch = message.match(taxTypeRegex)?.[0] || null
  const jurisdictionMatch = message.match(jurisdictionRegex)?.[0] || null
  
  return {
    deadline_date: deadlineMatch,
    entity_type: entityMatch,
    tax_type: taxTypeMatch,
    jurisdiction: jurisdictionMatch
  }
}

async function handleDeadlineInquiry(intent: any, client: Client | null, deadline: ClientDeadline | null) {
  const response = {
    type: 'deadline_inquiry_response',
    title: 'Deadline Information',
    content: [] as string[],
    recommendations: [] as string[]
  }
  
  if (deadline) {
    const dueDate = new Date(deadline.due_date)
    const daysRemaining = Math.ceil(
      (dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
    
    response.content.push(`The ${deadline.name} for ${client?.name || 'your client'} is due on ${dueDate.toDateString()}`)
    
    if (daysRemaining <= 0) {
      response.content.push(`This deadline was due ${Math.abs(daysRemaining)} day(s) ago`)
      response.recommendations.push('File immediately to minimize penalties')
    } else if (daysRemaining <= 7) {
      response.content.push(`Only ${daysRemaining} day(s) remaining until this deadline`)
      response.recommendations.push('Prioritize completing this filing')
    } else if (daysRemaining <= 30) {
      response.content.push(`This deadline is approaching in ${daysRemaining} day(s)`)
      response.recommendations.push('Begin preparation now')
    } else {
      response.content.push(`Sufficient time remains before this deadline`)
      response.recommendations.push('Continue with standard preparation timeline')
    }
  } else {
    response.content.push('I need more specific information about which deadline you\'re asking about.')
    response.recommendations.push('Please specify the deadline name or provide client information.')
  }
  
  return response
}

async function handlePenaltyCalculation(intent: any, client: Client | null, deadline: ClientDeadline | null) {
  const response = {
    type: 'penalty_calculation_response',
    title: 'Penalty Information',
    content: [] as string[],
    calculations: [] as any[],
    recommendations: [] as string[]
  }
  
  if (deadline) {
    // Simulate penalty calculation (real implementation would use IRS/State guidelines)
    const dueDate = new Date(deadline.due_date)
    const currentDate = new Date()
    const daysLate = Math.floor(
      (currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    
    if (daysLate > 0) {
      // Calculate approximate penalties
      let failureToPayPenalty = 0
      let failureToFilePenalty = 0
      let interest = 0
      
      // Simplified penalty calculation
      const baseAmount = estimateTaxLiability(client, deadline) // Placeholder function
      
      if (deadline.status === 'missed') {
        failureToPayPenalty = Math.min(baseAmount * 0.25, baseAmount * (daysLate * 0.005)) // Max 25%, 0.5% per month
        failureToFilePenalty = Math.min(baseAmount * 0.45, baseAmount * (daysLate * 0.0005)) // Max 45%, 0.05% per month
        interest = baseAmount * (daysLate * 0.0007) // Approximate interest rate
      }
      
      response.content.push(`For the ${deadline.name} deadline:`)
      response.calculations.push({
        type: 'failure_to_pay_penalty',
        description: 'Failure to Pay Penalty',
        amount: `$${failureToPayPenalty.toFixed(2)}`,
        formula: `Min(25% of tax due, 0.5% per month)`
      })
      
      response.calculations.push({
        type: 'failure_to_file_penalty',
        description: 'Failure to File Penalty',
        amount: `$${failureToFilePenalty.toFixed(2)}`,
        formula: `Min(45% of tax due, 0.05% per month)`
      })
      
      response.calculations.push({
        type: 'interest',
        description: 'Interest',
        amount: `$${interest.toFixed(2)}`,
        formula: `Approximately 0.07% per day`
      })
      
      response.recommendations.push('Consider filing Form 843 to request penalty abatement if reasonable cause exists')
      response.recommendations.push('Make payment immediately to reduce ongoing penalties')
    } else {
      response.content.push(`The ${deadline.name} deadline has not yet passed.`)
      response.content.push('No penalties have accrued yet.')
      response.recommendations.push('File before the due date to avoid penalties')
    }
  } else {
    response.content.push('I need more specific information about the deadline to calculate penalties.')
    response.recommendations.push('Please specify the deadline or provide client information.')
  }
  
  return response
}

async function handleExtensionRequest(intent: any, client: Client | null, deadline: ClientDeadline | null) {
  const response = {
    type: 'extension_request_response',
    title: 'Extension Information',
    content: [] as string[],
    forms: [] as any[],
    recommendations: [] as string[]
  }
  
  if (deadline) {
    const entity = client?.entity_type || 'individual'
    
    if (entity === 'c_corp' && deadline.tax_type === 'income') {
      response.forms.push({
        form_number: '7004',
        name: 'Application for Automatic Extension of Time To File Certain Business Income Tax, Information, and Other Returns',
        deadline_extension: '6 months',
        due_date: 'Must be filed by original due date'
      })
      
      response.content.push(`For a C-Corp income tax return, you can file Form 7004 to request an extension.`)
      response.content.push(`This grants an automatic 6-month extension to file (but not pay taxes).`)
      response.recommendations.push('Ensure payment of any tax liability is made by the original due date')
      response.recommendations.push('File Form 7004 before the original deadline')
    } else if ((entity === 's_corp' || entity === 'partnership') && deadline.tax_type === 'income') {
      response.forms.push({
        form_number: '7004',
        name: 'Application for Automatic Extension of Time To File Certain Business Income Tax, Information, and Other Returns',
        deadline_extension: '6 months',
        due_date: 'Must be filed by original due date'
      })
      
      response.content.push(`For an S-Corp or Partnership income tax return, you can file Form 7004 to request an extension.`)
      response.content.push(`This grants an automatic 6-month extension to file.`)
      response.recommendations.push('File Form 7004 before the original deadline')
    } else if (entity === 'individual' && deadline.tax_type === 'income') {
      response.forms.push({
        form_number: '4868',
        name: 'Application for Automatic Extension of Time To File U.S. Individual Income Tax Return',
        deadline_extension: '6 months',
        due_date: 'Must be filed by original due date'
      })
      
      response.content.push(`For an individual income tax return, you can file Form 4868 to request an extension.`)
      response.content.push(`This grants an automatic 6-month extension to file (but not pay taxes).`)
      response.recommendations.push('Ensure payment of any tax liability is made by the original due date')
      response.recommendations.push('File Form 4868 before the original deadline')
    } else {
      response.content.push(`Extension options vary by entity type and tax type.`)
      response.content.push(`Contact us for specific guidance on extending this deadline.`)
      response.recommendations.push('Research the appropriate extension form for this specific filing')
    }
  } else {
    response.content.push('I need more specific information about the deadline to advise on extensions.')
    response.recommendations.push('Please specify the deadline or provide client information.')
  }
  
  return response
}

async function handleComplianceGuidance(intent: any, client: Client | null, deadline: ClientDeadline | null) {
  const response = {
    type: 'compliance_guidance_response',
    title: 'Compliance Guidance',
    content: [] as string[],
    requirements: [] as string[],
    recommendations: [] as string[]
  }
  
  if (client && deadline) {
    response.content.push(`For a ${client.entity_type} filing ${deadline.tax_type} in ${deadline.jurisdiction}, here's what you need to know:`)
    
    // Entity-specific guidance
    switch (client.entity_type) {
      case 'c_corp':
        response.requirements.push('Form 1120 - U.S. Corporation Income Tax Return')
        response.requirements.push('Accurate financial statements')
        response.requirements.push('Supporting schedules and forms')
        response.requirements.push('Payment of any tax liability')
        
        response.recommendations.push('Ensure all corporate formalities are met')
        response.recommendations.push('Verify accuracy of financial statements')
        response.recommendations.push('Consider estimated tax payments for next year')
        break
        
      case 's_corp':
        response.requirements.push('Form 1120S - U.S. Income Tax Return for an S Corporation')
        response.requirements.push('Schedule K-1 for each shareholder')
        response.requirements.push('Payment of any tax liability')
        
        response.recommendations.push('Distribute Schedule K-1s to shareholders timely')
        response.recommendations.push('Verify S-election is still valid')
        break
        
      case 'partnership':
        response.requirements.push('Form 1065 - U.S. Return of Partnership Income')
        response.requirements.push('Schedule K-1 for each partner')
        response.requirements.push('Partner information verification')
        
        response.recommendations.push('Ensure all partners have received Schedule K-1s')
        response.recommendations.push('Verify partnership agreement terms')
        break
        
      default:
        response.requirements.push('Appropriate tax return form')
        response.requirements.push('Required supporting documentation')
        response.requirements.push('Payment of any tax liability')
        
        response.recommendations.push('Verify all required forms are included')
        response.recommendations.push('Double-check calculations')
    }
    
    // Jurisdiction-specific guidance
    if (deadline.jurisdiction !== 'federal') {
      response.requirements.push(`${deadline.jurisdiction.toUpperCase()} state return`)
      response.recommendations.push(`Verify nexus status in ${deadline.jurisdiction}`)
    }
  } else {
    response.content.push('Compliance requirements depend on client entity type and specific deadline.')
    response.recommendations.push('Provide client and deadline information for specific guidance.')
  }
  
  return response
}

async function handleFilingRequirement(intent: any, client: Client | null, deadline: ClientDeadline | null) {
  const response = {
    type: 'filing_requirement_response',
    title: 'Filing Requirements',
    content: [] as string[],
    required_forms: [] as string[],
    supporting_documents: [] as string[],
    recommendations: [] as string[]
  }
  
  if (client && deadline) {
    response.content.push(`For the ${deadline.name} filing for ${client.name}:`)
    
    // Determine required forms based on entity type and tax type
    const forms = determineRequiredForms(client.entity_type, deadline.tax_type, deadline.jurisdiction)
    response.required_forms = forms
    
    // Add jurisdiction-specific requirements
    if (deadline.jurisdiction !== 'federal') {
      response.supporting_documents.push(`${deadline.jurisdiction.toUpperCase()} state-specific forms`)
      response.supporting_documents.push(`State-specific payment methods`)
    }
    
    response.recommendations.push('Verify all required forms are properly completed')
    response.recommendations.push('Ensure all supporting documentation is attached')
    response.recommendations.push('Submit by the deadline to avoid penalties')
  } else {
    response.content.push('Filing requirements depend on specific client and deadline information.')
    response.recommendations.push('Provide client and deadline details for specific requirements.')
  }
  
  return response
}

async function handleGeneralInquiry(message: string, client: Client | null, deadline: ClientDeadline | null) {
  const response = {
    type: 'general_response',
    title: 'Compliance Assistant Response',
    content: [] as string[],
    recommendations: [] as string[]
  }
  
  // Handle common general questions
  if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
    response.content.push('Hello! I\'m your compliance assistant. I can help with:')
    response.content.push('- Deadline inquiries and status')
    response.content.push('- Penalty calculations')
    response.content.push('- Extension requests')
    response.content.push('- Filing requirements')
    response.content.push('- Compliance guidance')
    response.recommendations.push('Ask me a specific question about your compliance needs!')
  } else if (message.includes('thank')) {
    response.content.push('You\'re welcome! Is there anything else I can help with?')
  } else {
    response.content.push('I\'m here to help with compliance questions. I can assist with:')
    response.content.push('- Checking deadline status')
    response.content.push('- Calculating potential penalties')
    response.content.push('- Determining extension options')
    response.content.push('- Understanding filing requirements')
    response.content.push('- Providing compliance guidance')
    response.recommendations.push('Try asking a specific question like "What happens if I miss the March 15th deadline for my S-Corp?"')
  }
  
  return response
}

// Helper functions
function estimateTaxLiability(client: Client | null, deadline: ClientDeadline | null): number {
  // Placeholder function to estimate tax liability
  // In a real implementation, this would connect to financial data
  return 10000 // Default estimate
}

function determineRequiredForms(entityType: string, taxType: string, jurisdiction: string): string[] {
  const forms: string[] = []
  
  // Base forms by entity type
  switch (entityType) {
    case 'c_corp':
      forms.push('Form 1120')
      break
    case 's_corp':
      forms.push('Form 1120S')
      break
    case 'partnership':
      forms.push('Form 1065')
      break
    case 'individual':
      forms.push('Form 1040')
      break
    default:
      forms.push('Appropriate entity tax return')
  }
  
  // Add tax-type specific forms
  if (taxType === 'payroll') {
    forms.push('Form 941', 'Form 940', 'Various state payroll forms')
  } else if (taxType === 'estimated') {
    forms.push('Form 1040-ES', 'Form 1120-W', 'State estimated payment forms')
  }
  
  // Add jurisdiction-specific forms
  if (jurisdiction !== 'federal') {
    forms.push(`${jurisdiction.toUpperCase()} state return`)
  }
  
  return forms
}