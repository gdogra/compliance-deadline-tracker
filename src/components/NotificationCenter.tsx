'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ClientDeadline, Client } from '@/types/database'
import { format, isPast, isToday, isTomorrow, addDays } from 'date-fns'
import { Bell, AlertTriangle, Clock, Calendar, X, CheckCircle } from 'lucide-react'
import Link from 'next/link'

type DeadlineWithClient = ClientDeadline & {
  clients: Client
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const [deadlines, setDeadlines] = useState<DeadlineWithClient[]>([])
  const [loading, setLoading] = useState(true)
  const ref = useRef<HTMLDivElement>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchUpcoming()
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function fetchUpcoming() {
    setLoading(true)
    const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd')
    
    const { data } = await supabase
      .from('client_deadlines')
      .select('*, clients(*)')
      .neq('status', 'completed')
      .lte('due_date', nextWeek)
      .order('due_date', { ascending: true })
      .limit(20)

    setDeadlines(data as DeadlineWithClient[] || [])
    setLoading(false)
  }

  const overdueCount = deadlines.filter(d => 
    isPast(new Date(d.due_date)) && !isToday(new Date(d.due_date))
  ).length

  const todayCount = deadlines.filter(d => isToday(new Date(d.due_date))).length
  const tomorrowCount = deadlines.filter(d => isTomorrow(new Date(d.due_date))).length

  const totalAlerts = overdueCount + todayCount

  function getUrgencyColor(dueDate: string) {
    const date = new Date(dueDate)
    if (isPast(date) && !isToday(date)) return 'bg-red-100 text-red-700 border-red-200'
    if (isToday(date)) return 'bg-orange-100 text-orange-700 border-orange-200'
    if (isTomorrow(date)) return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    return 'bg-blue-100 text-blue-700 border-blue-200'
  }

  function getUrgencyLabel(dueDate: string) {
    const date = new Date(dueDate)
    if (isPast(date) && !isToday(date)) return 'Overdue'
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    return format(date, 'EEE')
  }

  async function markComplete(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('client_deadlines') as any)
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', id)
    fetchUpcoming()
  }

  return (
    <div ref={ref} className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
      >
        <Bell className="h-5 w-5 text-slate-500 dark:text-slate-400" />
        {totalAlerts > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {totalAlerts > 9 ? '9+' : totalAlerts}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-2 p-3 border-b border-slate-200 dark:border-slate-700">
            <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-lg font-bold text-red-600">{overdueCount}</p>
              <p className="text-xs text-red-600/70">Overdue</p>
            </div>
            <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <p className="text-lg font-bold text-orange-600">{todayCount}</p>
              <p className="text-xs text-orange-600/70">Today</p>
            </div>
            <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-lg font-bold text-yellow-600">{tomorrowCount}</p>
              <p className="text-xs text-yellow-600/70">Tomorrow</p>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
              </div>
            ) : deadlines.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p>No upcoming deadlines</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {deadlines.map(d => (
                  <div key={d.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 p-1.5 rounded ${
                        isPast(new Date(d.due_date)) && !isToday(new Date(d.due_date))
                          ? 'bg-red-100 dark:bg-red-900/30'
                          : isToday(new Date(d.due_date))
                          ? 'bg-orange-100 dark:bg-orange-900/30'
                          : 'bg-blue-100 dark:bg-blue-900/30'
                      }`}>
                        {isPast(new Date(d.due_date)) && !isToday(new Date(d.due_date)) ? (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        ) : isToday(new Date(d.due_date)) ? (
                          <Clock className="h-4 w-4 text-orange-600" />
                        ) : (
                          <Calendar className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {d.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {d.clients?.name} • {d.form_number || d.jurisdiction}
                        </p>
                        <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded border ${getUrgencyColor(d.due_date)}`}>
                          {getUrgencyLabel(d.due_date)} • {format(new Date(d.due_date), 'MMM d')}
                        </span>
                      </div>
                      <button
                        onClick={() => markComplete(d.id)}
                        className="p-1 text-slate-400 hover:text-green-600 transition"
                        title="Mark complete"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all deadlines →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
