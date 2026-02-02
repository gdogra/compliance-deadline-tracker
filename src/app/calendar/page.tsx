'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ClientDeadline, Client } from '@/types/database'
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, 
  isSameDay, addMonths, subMonths, isToday, isPast
} from 'date-fns'
import { Calendar, ChevronLeft, ChevronRight, X, Activity } from 'lucide-react'
import Link from 'next/link'

type DeadlineWithClient = ClientDeadline & {
  clients: Client
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [deadlines, setDeadlines] = useState<DeadlineWithClient[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchDeadlines()
  }, [currentMonth])

  async function fetchDeadlines() {
    setLoading(true)
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('client_deadlines') as any)
      .select('*, clients(*)')
      .gte('due_date', start)
      .lte('due_date', end)
      .order('due_date', { ascending: true })

    if (!error) {
      setDeadlines(data as DeadlineWithClient[] || [])
    }
    setLoading(false)
  }

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  })

  // Pad start of month to align with week
  const startDay = startOfMonth(currentMonth).getDay()
  const paddedDays = [...Array(startDay).fill(null), ...days]

  function getDeadlinesForDay(date: Date) {
    return deadlines.filter(d => isSameDay(new Date(d.due_date), date))
  }

  function getStatusColor(deadline: DeadlineWithClient) {
    if (deadline.status === 'completed') return 'bg-green-500'
    if (isPast(new Date(deadline.due_date)) && !isToday(new Date(deadline.due_date))) return 'bg-red-500'
    return 'bg-blue-500'
  }

  const selectedDeadlines = selectedDate ? getDeadlinesForDay(selectedDate) : []

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
              <Link href="/calendar" className="text-blue-600 font-medium">Calendar</Link>
              <Link href="/clients" className="text-slate-600 hover:text-slate-900">Clients</Link>
              <Link href="/compliance-intelligence" className="text-slate-600 hover:text-slate-900">Compliance Intelligence</Link>
              <Link href="/settings" className="text-slate-600 hover:text-slate-900">Settings</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Calendar */}
          <div className="flex-1">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-2 hover:bg-slate-100 rounded-lg transition"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h2 className="text-xl font-semibold text-slate-900">
                  {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-2 hover:bg-slate-100 rounded-lg transition"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-slate-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {paddedDays.map((day, idx) => {
                  if (!day) {
                    return <div key={`empty-${idx}`} className="h-24" />
                  }

                  const dayDeadlines = getDeadlinesForDay(day)
                  const isSelected = selectedDate && isSameDay(day, selectedDate)

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={`h-24 p-2 border rounded-lg text-left transition hover:bg-slate-50 ${
                        isToday(day) ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
                      } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                    >
                      <span className={`text-sm font-medium ${
                        isToday(day) ? 'text-blue-600' : 'text-slate-900'
                      }`}>
                        {format(day, 'd')}
                      </span>
                      
                      <div className="mt-1 space-y-1">
                        {dayDeadlines.slice(0, 3).map(d => (
                          <div
                            key={d.id}
                            className={`text-xs px-1.5 py-0.5 rounded truncate text-white ${getStatusColor(d)}`}
                          >
                            {d.clients?.name?.split(' ')[0] || 'Client'}
                          </div>
                        ))}
                        {dayDeadlines.length > 3 && (
                          <div className="text-xs text-slate-500">
                            +{dayDeadlines.length - 3} more
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Selected Day Sidebar */}
          <div className="w-80">
            <div className="bg-white rounded-xl border border-slate-200 p-6 sticky top-24">
              {selectedDate ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900">
                      {format(selectedDate, 'EEEE, MMM d')}
                    </h3>
                    <button
                      onClick={() => setSelectedDate(null)}
                      className="p-1 hover:bg-slate-100 rounded"
                    >
                      <X className="h-4 w-4 text-slate-400" />
                    </button>
                  </div>

                  {selectedDeadlines.length === 0 ? (
                    <p className="text-slate-500 text-sm">No deadlines on this day</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedDeadlines.map(d => (
                        <div
                          key={d.id}
                          className={`p-3 rounded-lg border-l-4 bg-slate-50 ${
                            d.status === 'completed' ? 'border-green-500' :
                            isPast(new Date(d.due_date)) ? 'border-red-500' : 'border-blue-500'
                          }`}
                        >
                          <p className="font-medium text-slate-900 text-sm">{d.name}</p>
                          <p className="text-xs text-slate-500">{d.clients?.name}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs bg-slate-200 px-2 py-0.5 rounded">
                              {d.jurisdiction}
                            </span>
                            {d.form_number && (
                              <span className="text-xs text-slate-500">{d.form_number}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-slate-500 py-8">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">Select a day to view deadlines</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
