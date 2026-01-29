'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ClientDeadline, Client } from '@/types/database'
import { format, formatDistanceToNow } from 'date-fns'
import { Calendar, CheckCircle, Clock, AlertTriangle, TrendingUp, Plus, Activity } from 'lucide-react'
import Link from 'next/link'

type DeadlineWithClient = ClientDeadline & {
  clients: Client
}

interface ActivityItem {
  id: string
  type: 'completed' | 'extended' | 'created' | 'missed'
  deadline: DeadlineWithClient
  timestamp: Date
}

export default function ActivityPage() {
  const [deadlines, setDeadlines] = useState<DeadlineWithClient[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchDeadlines()
  }, [])

  async function fetchDeadlines() {
    setLoading(true)
    const { data } = await supabase
      .from('client_deadlines')
      .select('*, clients(*)')
      .order('updated_at', { ascending: false })
      .limit(100)

    setDeadlines(data as DeadlineWithClient[] || [])
    setLoading(false)
  }

  // Generate activity feed from deadlines
  const activities: ActivityItem[] = deadlines.flatMap(d => {
    const items: ActivityItem[] = []

    // Created activity (using created_at)
    if (d.created_at) {
      items.push({
        id: `${d.id}-created`,
        type: 'created',
        deadline: d,
        timestamp: new Date(d.created_at)
      })
    }

    // Completed activity
    if (d.status === 'completed' && d.completed_at) {
      items.push({
        id: `${d.id}-completed`,
        type: 'completed',
        deadline: d,
        timestamp: new Date(d.completed_at)
      })
    }

    // Extended activity
    if (d.status === 'extended' && d.extended_to) {
      items.push({
        id: `${d.id}-extended`,
        type: 'extended',
        deadline: d,
        timestamp: new Date(d.updated_at)
      })
    }

    return items
  }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 50)

  function getActivityIcon(type: string) {
    switch (type) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'extended':
        return <TrendingUp className="h-5 w-5 text-orange-500" />
      case 'created':
        return <Plus className="h-5 w-5 text-blue-500" />
      case 'missed':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-slate-400" />
    }
  }

  function getActivityText(activity: ActivityItem) {
    switch (activity.type) {
      case 'completed':
        return `Completed "${activity.deadline.name}" for ${activity.deadline.clients?.name}`
      case 'extended':
        return `Extended "${activity.deadline.name}" for ${activity.deadline.clients?.name} to ${format(new Date(activity.deadline.extended_to!), 'MMM d')}`
      case 'created':
        return `Created deadline "${activity.deadline.name}" for ${activity.deadline.clients?.name}`
      case 'missed':
        return `Missed deadline "${activity.deadline.name}" for ${activity.deadline.clients?.name}`
      default:
        return `Updated "${activity.deadline.name}"`
    }
  }

  function getActivityColor(type: string) {
    switch (type) {
      case 'completed':
        return 'border-green-200 bg-green-50'
      case 'extended':
        return 'border-orange-200 bg-orange-50'
      case 'created':
        return 'border-blue-200 bg-blue-50'
      case 'missed':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-slate-200 bg-slate-50'
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <Calendar className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-slate-900">DeadlineTracker</span>
            </div>
            <nav className="flex items-center gap-6">
              <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">Dashboard</Link>
              <Link href="/calendar" className="text-slate-600 hover:text-slate-900">Calendar</Link>
              <Link href="/activity" className="text-blue-600 font-medium">Activity</Link>
              <Link href="/clients" className="text-slate-600 hover:text-slate-900">Clients</Link>
              <Link href="/settings" className="text-slate-600 hover:text-slate-900">Settings</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Activity className="h-6 w-6 text-slate-400" />
          <h1 className="text-2xl font-bold text-slate-900">Activity Feed</h1>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <Activity className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-medium text-slate-900 mb-2">No activity yet</p>
            <p className="text-slate-500">Activity will appear here as you work with deadlines</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, idx) => {
              // Group by date
              const showDateHeader = idx === 0 || 
                format(activity.timestamp, 'yyyy-MM-dd') !== format(activities[idx - 1].timestamp, 'yyyy-MM-dd')

              return (
                <div key={activity.id}>
                  {showDateHeader && (
                    <div className="flex items-center gap-4 py-4">
                      <div className="h-px flex-1 bg-slate-200" />
                      <span className="text-sm font-medium text-slate-500">
                        {format(activity.timestamp, 'EEEE, MMMM d, yyyy')}
                      </span>
                      <div className="h-px flex-1 bg-slate-200" />
                    </div>
                  )}

                  <div className={`flex items-start gap-4 p-4 rounded-xl border ${getActivityColor(activity.type)}`}>
                    <div className="mt-0.5">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-900">{getActivityText(activity)}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-slate-500">
                          {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                        </span>
                        <span className="text-xs bg-white px-2 py-0.5 rounded border">
                          {activity.deadline.jurisdiction}
                        </span>
                        <span className="text-xs text-slate-500">
                          {activity.deadline.form_number}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/clients/${activity.deadline.client_id}`}
                      className="text-xs text-blue-600 hover:underline shrink-0"
                    >
                      View Client →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
