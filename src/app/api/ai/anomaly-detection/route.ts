import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Client, ClientDeadline } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get user session to verify access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First get the user's profile to get firm_id
    const { data: userProfile, error } = await supabase
      .from('users')
      .select('firm_id')
      .eq('id', user.id)
      .single()

    if (error || !userProfile) {
      return Response.json({ error: 'User profile not found' }, { status: 404 })
    }

    const firmId = (userProfile as { firm_id: string }).firm_id
    if (!firmId) {
      return Response.json({ error: 'No firm ID found for user' }, { status: 403 })
    }

    // Get all clients for the user's firm first
    const { data: clients } = await supabase
      .from('clients')
      .select('*')
      .eq('firm_id', firmId)

    if (!clients || clients.length === 0) {
      return Response.json({ 
        success: true, 
        anomalies: [],
        summary: {
          total_anomalies: 0,
          high_priority_count: 0,
          medium_priority_count: 0,
          low_priority_count: 0
        },
        timestamp: new Date().toISOString()
      })
    }

    const clientIds = (clients as { id: string }[]).map(client => client.id)

    // Get all client deadlines for the user's firm
    const { data: deadlines } = await supabase
      .from('client_deadlines')
      .select(`
        *,
        clients (*)
      `)
      .in('client_id', clientIds)
      .order('created_at', { ascending: false })
      .limit(1000) // Limit to recent deadlines for performance

    if (!deadlines) {
      return Response.json({ error: 'Failed to fetch deadlines' }, { status: 500 })
    }

    // Perform anomaly detection
    const anomalies = detectAnomalies(deadlines as (ClientDeadline & { clients: Client })[], clients || [])

    return Response.json({ 
      success: true, 
      anomalies,
      summary: {
        total_anomalies: anomalies.length,
        high_priority_count: anomalies.filter(a => a.priority === 'high').length,
        medium_priority_count: anomalies.filter(a => a.priority === 'medium').length,
        low_priority_count: anomalies.filter(a => a.priority === 'low').length
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error detecting anomalies:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function detectAnomalies(deadlines: (ClientDeadline & { clients: Client })[], clients: Client[]) {
  const anomalies: any[] = []
  
  // Group deadlines by client to analyze patterns
  const deadlinesByClient = deadlines.reduce((acc, deadline) => {
    if (!acc[deadline.client_id]) {
      acc[deadline.client_id] = []
    }
    acc[deadline.client_id].push(deadline)
    return acc
  }, {} as Record<string, ClientDeadline[]>)
  
  // Analyze each client's deadline patterns
  Object.entries(deadlinesByClient).forEach(([clientId, clientDeadlines]) => {
    const client = clients.find(c => c.id === clientId)
    
    // 1. Unusual spike in deadline volume
    const recentDeadlines = clientDeadlines.filter(dl => 
      new Date(dl.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
    )
    
    if (recentDeadlines.length > 5 && recentDeadlines.length > clientDeadlines.length * 0.3) {
      anomalies.push({
        id: `spike_${clientId}`,
        type: 'volume_spike',
        client_id: clientId,
        client_name: client?.name || 'Unknown Client',
        description: `Unusual increase in deadline creation (${recentDeadlines.length} in last 30 days)`,
        details: {
          recent_count: recentDeadlines.length,
          historical_avg: Math.round(clientDeadlines.length / (calculateClientHistoryLength(clientDeadlines) || 1) * 30),
          period: 'last_30_days'
        },
        priority: 'medium',
        category: 'business_change',
        recommended_action: 'Investigate reason for increased deadline volume'
      })
    }
    
    // 2. Pattern deviation in deadline types
    const deadlineTypes = clientDeadlines.reduce((acc, dl) => {
      acc[dl.tax_type] = (acc[dl.tax_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Check if new deadline types appear that weren't previously common for this client
    const recentDeadlineTypes = recentDeadlines.reduce((acc, dl) => {
      acc[dl.tax_type] = (acc[dl.tax_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    Object.keys(recentDeadlineTypes).forEach(type => {
      if (!deadlineTypes[type] || deadlineTypes[type] < 3) {
        // This deadline type is rare for this client
        anomalies.push({
          id: `new_type_${clientId}_${type}`,
          type: 'new_deadline_type',
          client_id: clientId,
          client_name: client?.name || 'Unknown Client',
          description: `New deadline type '${type}' for client`,
          details: {
            deadline_type: type,
            previous_occurrences: deadlineTypes[type] || 0,
            recent_occurrences: recentDeadlineTypes[type]
          },
          priority: 'medium',
          category: 'business_change',
          recommended_action: 'Verify this deadline type aligns with client business activities'
        })
      }
    })
    
    // 3. Status pattern analysis
    const statusBreakdown = clientDeadlines.reduce((acc, dl) => {
      acc[dl.status] = (acc[dl.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Check if status patterns have changed recently
    const recentStatusBreakdown = recentDeadlines.reduce((acc, dl) => {
      acc[dl.status] = (acc[dl.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const historicalMissedRate = statusBreakdown.missed ? 
      statusBreakdown.missed / (statusBreakdown.missed + statusBreakdown.completed) : 0
    const recentMissedRate = recentStatusBreakdown.missed ? 
      recentStatusBreakdown.missed / (recentStatusBreakdown.missed + (recentStatusBreakdown.completed || 1)) : 0
    
    if (recentMissedRate > historicalMissedRate * 2 && recentMissedRate > 0.1) {
      anomalies.push({
        id: `increased_missed_rate_${clientId}`,
        type: 'increased_missed_rate',
        client_id: clientId,
        client_name: client?.name || 'Unknown Client',
        description: `Increased deadline miss rate (${(recentMissedRate * 100).toFixed(1)}% vs historical ${(historicalMissedRate * 100).toFixed(1)}%)`,
        details: {
          historical_miss_rate: historicalMissedRate,
          recent_miss_rate: recentMissedRate,
          historical_total: statusBreakdown.missed + statusBreakdown.completed,
          recent_total: recentStatusBreakdown.missed + (recentStatusBreakdown.completed || 0)
        },
        priority: 'high',
        category: 'performance_degradation',
        recommended_action: 'Review client communication and deadline management process'
      })
    }
    
    // 4. Unusual deadline timing
    const upcomingDeadlines = clientDeadlines.filter(dl => 
      new Date(dl.due_date) > new Date() && dl.status === 'pending'
    )
    
    upcomingDeadlines.forEach(dl => {
      const daysUntilDeadline = Math.ceil(
        (new Date(dl.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
      
      // Check if deadline is unusually soon (less than 14 days) for this client
      if (daysUntilDeadline < 14 && client?.entity_type !== 'individual') {
        // For business entities, deadlines with less than 2 weeks notice are unusual
        anomalies.push({
          id: `short_notice_${dl.id}`,
          type: 'short_notice_deadline',
          client_id: clientId,
          client_name: client?.name || 'Unknown Client',
          description: `Unusually short notice for ${dl.name} deadline (${daysUntilDeadline} days remaining)`,
          details: {
            deadline_name: dl.name,
            due_date: dl.due_date,
            days_remaining: daysUntilDeadline,
            deadline_type: dl.tax_type,
            jurisdiction: dl.jurisdiction
          },
          priority: 'medium',
          category: 'timing_issue',
          recommended_action: 'Assess feasibility of meeting deadline or consider extension'
        })
      }
    })
    
    // 5. Client-specific pattern analysis
    if (client?.notes?.includes('seasonal_business')) {
      // Look for deadlines outside normal seasonal patterns
      const monthCounts = clientDeadlines.reduce((acc, dl) => {
        const month = new Date(dl.due_date).getMonth()
        acc[month] = (acc[month] || 0) + 1
        return acc
      }, {} as Record<number, number>)
      
      // Find if there are unusual deadlines in off-season months
      // (This is a simplified example - real implementation would have more sophisticated seasonal analysis)
    }
  })
  
  // Sort anomalies by priority and recency
  return anomalies.sort((a, b) => {
    const priorityOrder: { [key: string]: number } = { critical: 4, high: 3, medium: 2, low: 1 }
    // Primary sort: priority
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
    if (priorityDiff !== 0) return priorityDiff
    // Secondary sort: alphabetical by client name
    return a.client_name.localeCompare(b.client_name)
  })
}

function calculateClientHistoryLength(deadlines: ClientDeadline[]): number {
  if (deadlines.length < 2) return 0
  
  const sortedDeadlines = [...deadlines].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
  
  const firstDate = new Date(sortedDeadlines[0].created_at).getTime()
  const lastDate = new Date(sortedDeadlines[sortedDeadlines.length - 1].created_at).getTime()
  
  // Return approximate number of days between first and last deadline
  return (lastDate - firstDate) / (1000 * 60 * 60 * 24)
}