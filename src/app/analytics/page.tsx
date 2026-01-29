'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ClientDeadline } from '@/types/database'
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns'
import { Calendar, TrendingUp, PieChart, BarChart3, CheckCircle, AlertTriangle, Clock } from 'lucide-react'
import Link from 'next/link'

export default function AnalyticsPage() {
  const [deadlines, setDeadlines] = useState<ClientDeadline[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchAllDeadlines()
  }, [])

  async function fetchAllDeadlines() {
    setLoading(true)
    const { data } = await supabase
      .from('client_deadlines')
      .select('*')
      .order('due_date', { ascending: true })

    setDeadlines(data || [])
    setLoading(false)
  }

  // Calculate stats
  const totalDeadlines = deadlines.length
  const completedDeadlines = deadlines.filter(d => d.status === 'completed').length
  const missedDeadlines = deadlines.filter(d => d.status === 'missed').length
  const extendedDeadlines = deadlines.filter(d => d.status === 'extended').length
  const pendingDeadlines = deadlines.filter(d => d.status === 'pending' || d.status === 'in_progress').length

  const completionRate = totalDeadlines > 0 ? Math.round((completedDeadlines / totalDeadlines) * 100) : 0

  // Group by jurisdiction
  const byJurisdiction = deadlines.reduce((acc, d) => {
    acc[d.jurisdiction] = (acc[d.jurisdiction] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Group by tax type
  const byTaxType = deadlines.reduce((acc, d) => {
    acc[d.tax_type] = (acc[d.tax_type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Monthly completion trend (last 6 months)
  const sixMonthsAgo = subMonths(new Date(), 6)
  const months = eachMonthOfInterval({ start: sixMonthsAgo, end: new Date() })
  
  const monthlyTrend = months.map(month => {
    const monthStart = startOfMonth(month)
    const monthEnd = endOfMonth(month)
    
    const monthDeadlines = deadlines.filter(d => {
      const dueDate = new Date(d.due_date)
      return dueDate >= monthStart && dueDate <= monthEnd
    })
    
    const completed = monthDeadlines.filter(d => d.status === 'completed').length
    const total = monthDeadlines.length
    
    return {
      month: format(month, 'MMM'),
      completed,
      total,
      rate: total > 0 ? Math.round((completed / total) * 100) : 0
    }
  })

  const maxTotal = Math.max(...monthlyTrend.map(m => m.total), 1)

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
              <Link href="/analytics" className="text-blue-600 font-medium">Analytics</Link>
              <Link href="/clients" className="text-slate-600 hover:text-slate-900">Clients</Link>
              <Link href="/settings" className="text-slate-600 hover:text-slate-900">Settings</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-8">Analytics</h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-500 text-sm">Total</span>
                  <BarChart3 className="h-5 w-5 text-slate-400" />
                </div>
                <p className="text-3xl font-bold text-slate-900">{totalDeadlines}</p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-500 text-sm">Completed</span>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-3xl font-bold text-green-600">{completedDeadlines}</p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-500 text-sm">Pending</span>
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-blue-600">{pendingDeadlines}</p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-500 text-sm">Extended</span>
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                </div>
                <p className="text-3xl font-bold text-orange-600">{extendedDeadlines}</p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-500 text-sm">Missed</span>
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <p className="text-3xl font-bold text-red-600">{missedDeadlines}</p>
              </div>
            </div>

            {/* Completion Rate */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Completion Rate</h3>
              <div className="flex items-center gap-6">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#e2e8f0"
                      strokeWidth="12"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#22c55e"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${completionRate * 3.52} 352`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-slate-900">{completionRate}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-slate-600">
                    {completedDeadlines} of {totalDeadlines} deadlines completed
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    {completionRate >= 90 ? '🎉 Excellent work!' :
                     completionRate >= 70 ? '👍 Good progress' :
                     completionRate >= 50 ? '⚠️ Room for improvement' :
                     '🚨 Needs attention'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Monthly Trend */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Monthly Trend (Last 6 Months)</h3>
                <div className="space-y-3">
                  {monthlyTrend.map((month) => (
                    <div key={month.month} className="flex items-center gap-4">
                      <span className="w-10 text-sm text-slate-500">{month.month}</span>
                      <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden flex">
                        <div 
                          className="bg-green-500 h-full transition-all"
                          style={{ width: `${(month.completed / maxTotal) * 100}%` }}
                        />
                        <div 
                          className="bg-slate-300 h-full transition-all"
                          style={{ width: `${((month.total - month.completed) / maxTotal) * 100}%` }}
                        />
                      </div>
                      <span className="w-16 text-right text-sm">
                        <span className="text-green-600 font-medium">{month.completed}</span>
                        <span className="text-slate-400">/{month.total}</span>
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-green-500 rounded"></span> Completed
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-slate-300 rounded"></span> Incomplete
                  </span>
                </div>
              </div>

              {/* By Jurisdiction */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">By Jurisdiction</h3>
                <div className="space-y-3">
                  {Object.entries(byJurisdiction)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8)
                    .map(([jurisdiction, count]) => (
                      <div key={jurisdiction} className="flex items-center gap-4">
                        <span className="w-16 text-sm font-medium text-slate-700">{jurisdiction}</span>
                        <div className="flex-1 h-6 bg-slate-100 rounded-lg overflow-hidden">
                          <div 
                            className="bg-blue-500 h-full transition-all"
                            style={{ width: `${(count / totalDeadlines) * 100}%` }}
                          />
                        </div>
                        <span className="w-12 text-right text-sm text-slate-600">{count}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* By Tax Type */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">By Tax Type</h3>
                <div className="space-y-3">
                  {Object.entries(byTaxType)
                    .sort((a, b) => b[1] - a[1])
                    .map(([taxType, count]) => (
                      <div key={taxType} className="flex items-center gap-4">
                        <span className="w-24 text-sm font-medium text-slate-700 capitalize">{taxType}</span>
                        <div className="flex-1 h-6 bg-slate-100 rounded-lg overflow-hidden">
                          <div 
                            className="bg-purple-500 h-full transition-all"
                            style={{ width: `${(count / totalDeadlines) * 100}%` }}
                          />
                        </div>
                        <span className="w-12 text-right text-sm text-slate-600">{count}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Quick Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-slate-900">
                      {Object.keys(byJurisdiction).length}
                    </p>
                    <p className="text-xs text-slate-500">Jurisdictions</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-slate-900">
                      {Object.keys(byTaxType).length}
                    </p>
                    <p className="text-xs text-slate-500">Tax Types</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-slate-900">
                      {deadlines.filter(d => d.form_number).length}
                    </p>
                    <p className="text-xs text-slate-500">With Forms</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-slate-900">
                      {new Set(deadlines.map(d => d.client_id)).size}
                    </p>
                    <p className="text-xs text-slate-500">Clients</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
