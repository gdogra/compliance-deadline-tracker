import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ClientDeadline, Client } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get user session to verify access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get client deadlines for the user's firm
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: deadlines } = await (supabase.from('client_deadlines') as any)
      .select(`
        *,
        clients (*)
      `)
      .eq('firm_id', user.firm_id)
      .gt('due_date', new Date().toISOString())

    if (!deadlines) {
      return Response.json({ error: 'Failed to fetch deadlines' }, { status: 500 })
    }

    // Calculate predictive risk scores for each deadline
    const riskScores = deadlines.map((deadline: ClientDeadline & { clients: Client }) => {
      // Simple risk calculation algorithm (would be more sophisticated in production)
      let riskScore = 0
      
      // Higher risk for certain tax types
      if (deadline.tax_type === 'payroll') riskScore += 20
      if (deadline.tax_type === 'estimated') riskScore += 15
      
      // Higher risk for certain jurisdictions
      if (deadline.jurisdiction === 'federal') riskScore += 10
      if (deadline.jurisdiction === 'CA') riskScore += 15
      
      // Higher risk based on past performance of client
      if (deadline.clients?.notes?.includes('has_missed_deadlines')) riskScore += 25
      
      // Higher risk as deadline approaches
      const daysUntilDeadline = Math.ceil(
        (new Date(deadline.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
      
      if (daysUntilDeadline <= 7) riskScore += 30
      else if (daysUntilDeadline <= 30) riskScore += 15
      
      // Cap the score at 100
      riskScore = Math.min(riskScore, 100)
      
      return {
        deadline_id: deadline.id,
        client_name: deadline.clients?.name,
        deadline_name: deadline.name,
        due_date: deadline.due_date,
        tax_type: deadline.tax_type,
        jurisdiction: deadline.jurisdiction,
        risk_score: riskScore,
        risk_level: riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low',
        recommendations: generateRecommendations(deadline, riskScore)
      }
    })

    // Sort by risk score descending
    riskScores.sort((a, b) => b.risk_score - a.risk_score)

    return Response.json({ 
      success: true, 
      risk_scores: riskScores,
      summary: {
        high_risk_count: riskScores.filter(r => r.risk_level === 'high').length,
        medium_risk_count: riskScores.filter(r => r.risk_level === 'medium').length,
        total_deadlines: riskScores.length
      }
    })
  } catch (error) {
    console.error('Error calculating predictive risk scores:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateRecommendations(deadline: ClientDeadline & { clients: Client }, riskScore: number) {
  const recommendations = []
  
  if (riskScore >= 70) {
    recommendations.push("Consider filing extension to avoid penalty")
    recommendations.push("Assign additional resources to this deadline")
    recommendations.push("Review client's supporting documentation early")
  } else if (riskScore >= 40) {
    recommendations.push("Schedule initial review of preparation materials")
    recommendations.push("Confirm receipt of all required documents")
  }
  
  if (deadline.tax_type === 'payroll') {
    recommendations.push("Verify payroll tax deposits are current")
  }
  
  if (deadline.jurisdiction === 'CA') {
    recommendations.push("Ensure California-specific forms are prepared")
  }
  
  return recommendations
}