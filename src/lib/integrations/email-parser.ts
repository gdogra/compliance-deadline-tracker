// Email Parser for Agency Notices
import { ParsedAgencyNotice } from '@/types/integrations'

// Patterns for IRS notices
const IRS_PATTERNS = {
  notice_id: /Notice\s*(?:Number|#|No\.?)?\s*[:.]?\s*([A-Z]{2,3}[-\s]?\d+)/i,
  due_date: /(?:Response|Due|Payment)\s+(?:Due\s+)?(?:Date|By)?\s*[:.]?\s*(\d{1,2}\/\d{1,2}\/\d{2,4}|\w+\s+\d{1,2},?\s+\d{4})/i,
  amount: /(?:Amount\s+(?:Due|Owed)|Balance|Tax\s+Due)\s*[:.]?\s*\$?([\d,]+\.?\d*)/i,
  ein: /(?:EIN|Employer\s+ID(?:entification)?\s+Number)\s*[:.]?\s*(\d{2}[-\s]?\d{7})/i,
  ssn_partial: /(?:SSN|Social\s+Security)\s*[:.]?\s*XXX-XX-(\d{4})/i,
  cp_notice: /CP\s*(\d+[A-Z]?)/i,
  ltr_notice: /LTR\s*(\d+[A-Z]?)/i,
}

// Patterns for state notices
const STATE_PATTERNS = {
  california: {
    notice_id: /(?:Notice|ID)\s*[:.]?\s*(\d{10,})/i,
    due_date: /(?:Response|Due|Payment)\s+(?:Date)?\s*[:.]?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
    amount: /(?:Amount|Balance|Due)\s*[:.]?\s*\$?([\d,]+\.?\d*)/i,
  },
  texas: {
    notice_id: /(?:Notice|Case)\s*(?:#|No\.?)?\s*[:.]?\s*(\d{8,})/i,
    due_date: /(?:Due|By)\s*[:.]?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
    amount: /(?:Amount|Due|Owed)\s*[:.]?\s*\$?([\d,]+\.?\d*)/i,
  },
  new_york: {
    notice_id: /(?:Assessment|Notice)\s*(?:#|No\.?)?\s*[:.]?\s*([A-Z]?\d{8,})/i,
    due_date: /(?:Response|Due)\s+Date\s*[:.]?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
    amount: /(?:Amount|Balance)\s*[:.]?\s*\$?([\d,]+\.?\d*)/i,
  },
}

// Common action phrases
const ACTION_PATTERNS = [
  { pattern: /response\s+required/i, action: 'Response required - review notice and respond by due date' },
  { pattern: /payment\s+(?:due|required)/i, action: 'Payment required - submit payment by due date' },
  { pattern: /additional\s+(?:information|documentation)\s+(?:needed|required)/i, action: 'Provide additional documentation' },
  { pattern: /examination|audit/i, action: 'Audit notice - prepare documentation and schedule appointment' },
  { pattern: /intent\s+to\s+(?:levy|seize)/i, action: 'URGENT: Intent to levy - immediate action required' },
  { pattern: /notice\s+of\s+deficiency/i, action: 'Notice of deficiency - 90 days to petition Tax Court' },
  { pattern: /balance\s+due/i, action: 'Balance due - payment or payment plan required' },
  { pattern: /refund/i, action: 'Refund notice - verify amount and processing' },
]

function detectAgency(text: string): { type: 'irs' | 'state'; agency: string; state?: string } {
  const lowerText = text.toLowerCase()

  if (lowerText.includes('internal revenue service') || lowerText.includes('irs') || lowerText.includes('department of the treasury')) {
    return { type: 'irs', agency: 'Internal Revenue Service (IRS)' }
  }

  if (lowerText.includes('franchise tax board') || lowerText.includes('california')) {
    return { type: 'state', agency: 'California Franchise Tax Board', state: 'CA' }
  }

  if (lowerText.includes('texas comptroller') || lowerText.includes('texas')) {
    return { type: 'state', agency: 'Texas Comptroller', state: 'TX' }
  }

  if (lowerText.includes('new york state') || lowerText.includes('nys tax')) {
    return { type: 'state', agency: 'New York State Department of Taxation', state: 'NY' }
  }

  if (lowerText.includes('florida department of revenue')) {
    return { type: 'state', agency: 'Florida Department of Revenue', state: 'FL' }
  }

  if (lowerText.includes('illinois department of revenue')) {
    return { type: 'state', agency: 'Illinois Department of Revenue', state: 'IL' }
  }

  // Default to generic state if we detect "state" but can't identify which
  if (lowerText.includes('state') && lowerText.includes('tax')) {
    return { type: 'state', agency: 'State Tax Agency (Unidentified)' }
  }

  return { type: 'irs', agency: 'Unknown Agency' }
}

function extractDate(text: string): string | undefined {
  const patterns = [
    /(\d{1,2}\/\d{1,2}\/\d{4})/,
    /(\d{1,2}\/\d{1,2}\/\d{2})/,
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/i,
    /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      // Try to normalize to ISO date
      const dateStr = match[0]
      const parsed = new Date(dateStr)
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0]
      }
      return dateStr
    }
  }

  return undefined
}

function extractAmount(text: string): number | undefined {
  const match = text.match(/\$?([\d,]+\.?\d*)/g)
  if (match) {
    // Find the largest amount (likely the total due)
    const amounts = match
      .map(m => parseFloat(m.replace(/[$,]/g, '')))
      .filter(n => !isNaN(n) && n > 0)
    
    if (amounts.length > 0) {
      return Math.max(...amounts)
    }
  }
  return undefined
}

function extractClientIdentifier(text: string): string | undefined {
  // Try EIN first
  const einMatch = text.match(IRS_PATTERNS.ein)
  if (einMatch) {
    return `EIN: ${einMatch[1].replace(/\s/g, '-')}`
  }

  // Try partial SSN
  const ssnMatch = text.match(IRS_PATTERNS.ssn_partial)
  if (ssnMatch) {
    return `SSN: XXX-XX-${ssnMatch[1]}`
  }

  return undefined
}

function detectAction(text: string): string | undefined {
  for (const { pattern, action } of ACTION_PATTERNS) {
    if (pattern.test(text)) {
      return action
    }
  }
  return undefined
}

function calculateConfidence(notice: Partial<ParsedAgencyNotice>): number {
  let confidence = 0.5 // Base confidence

  if (notice.notice_id) confidence += 0.15
  if (notice.due_date) confidence += 0.15
  if (notice.client_identifier) confidence += 0.1
  if (notice.amount_due) confidence += 0.05
  if (notice.action_required) confidence += 0.05

  return Math.min(confidence, 1)
}

export function parseEmailForNotice(
  subject: string,
  body: string,
  fromAddress?: string
): ParsedAgencyNotice | null {
  const fullText = `${subject}\n${body}`

  // Detect which agency this is from
  const { type, agency, state } = detectAgency(fullText)

  // Extract notice ID based on type
  let noticeId: string | undefined
  if (type === 'irs') {
    const cpMatch = fullText.match(IRS_PATTERNS.cp_notice)
    const ltrMatch = fullText.match(IRS_PATTERNS.ltr_notice)
    const genericMatch = fullText.match(IRS_PATTERNS.notice_id)
    noticeId = cpMatch?.[0] || ltrMatch?.[0] || genericMatch?.[1]
  } else if (state && STATE_PATTERNS[state.toLowerCase() as keyof typeof STATE_PATTERNS]) {
    const statePatterns = STATE_PATTERNS[state.toLowerCase() as keyof typeof STATE_PATTERNS]
    const match = fullText.match(statePatterns.notice_id)
    noticeId = match?.[1]
  }

  // Extract due date
  let dueDate: string | undefined
  const dueDateMatch = fullText.match(IRS_PATTERNS.due_date)
  if (dueDateMatch) {
    dueDate = extractDate(dueDateMatch[0])
  } else {
    dueDate = extractDate(fullText)
  }

  // Extract amount
  const amountMatch = fullText.match(IRS_PATTERNS.amount)
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : extractAmount(fullText)

  // Extract client identifier
  const clientId = extractClientIdentifier(fullText)

  // Detect required action
  const action = detectAction(fullText)

  const notice: ParsedAgencyNotice = {
    notice_type: type,
    notice_id: noticeId,
    agency,
    client_identifier: clientId,
    due_date: dueDate,
    amount_due: amount,
    action_required: action,
    raw_text: fullText.substring(0, 2000), // Limit stored text
    confidence: 0,
  }

  notice.confidence = calculateConfidence(notice)

  // Only return if we have some useful information
  if (notice.confidence >= 0.5) {
    return notice
  }

  return null
}

export function createDeadlineFromNotice(
  notice: ParsedAgencyNotice,
  clientId: string
): {
  name: string
  description: string
  due_date: string
  jurisdiction: string
  tax_type: string
  notes: string
} {
  const name = notice.notice_id
    ? `Respond to ${notice.agency} ${notice.notice_id}`
    : `${notice.agency} Notice Response`

  const description = notice.action_required || 'Review and respond to agency notice'

  const jurisdiction = notice.notice_type === 'irs' ? 'federal' : 'CA' // Default state, should be inferred

  return {
    name,
    description,
    due_date: notice.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    jurisdiction,
    tax_type: 'correspondence',
    notes: `Auto-created from parsed email notice.\n\nAmount Due: ${notice.amount_due ? `$${notice.amount_due.toLocaleString()}` : 'N/A'}\nClient ID: ${notice.client_identifier || 'N/A'}\nConfidence: ${(notice.confidence * 100).toFixed(0)}%`,
  }
}

// Webhook handler for incoming emails (e.g., from SendGrid Inbound Parse)
export interface InboundEmail {
  from: string
  to: string
  subject: string
  text: string
  html?: string
  attachments?: Array<{ filename: string; content: string; contentType: string }>
}

export function processInboundEmail(email: InboundEmail): ParsedAgencyNotice | null {
  // Use plain text if available, otherwise strip HTML
  const body = email.text || email.html?.replace(/<[^>]+>/g, ' ') || ''
  return parseEmailForNotice(email.subject, body, email.from)
}
