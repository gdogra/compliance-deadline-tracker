'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ClientDeadline, Client } from '@/types/database'
import { format, isPast, isToday, subDays } from 'date-fns'
import { Calendar, FileText, Download, AlertTriangle, Clock, CheckCircle, TrendingUp } from 'lucide-react'
import Link from 'next/link'

type DeadlineWithClient = ClientDeadline & {
  clients: Client
}

type ReportType = 'missed' | 'upcoming' | 'completed' | 'extended' | 'all'

export default function ReportsPage() {
  const [deadlines, setDeadlines] = useState<DeadlineWithClient[]>([])
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState<ReportType>('missed')
  const [dateRange, setDateRange] = useState('30')

  const supabase = createClient()

  useEffect(() => {
    fetchDeadlines()
  }, [])

  async function fetchDeadlines() {
    setLoading(true)
    const { data } = await supabase
      .from('client_deadlines')
      .select('*, clients(*)')
      .order('due_date', { ascending: false })

    setDeadlines(data as DeadlineWithClient[] || [])
    setLoading(false)
  }

  const filteredDeadlines = deadlines.filter(d => {
    const dueDate = new Date(d.due_date)
    const cutoffDate = subDays(new Date(), parseInt(dateRange))
    
    // Date range filter
    if (dueDate < cutoffDate && reportType !== 'all') return false

    // Report type filter
    switch (reportType) {
      case 'missed':
        return (d.status === 'missed' || (d.status !== 'completed' && isPast(dueDate) && !isToday(dueDate)))
      case 'upcoming':
        return d.status !== 'completed' && !isPast(dueDate)
      case 'completed':
        return d.status === 'completed'
      case 'extended':
        return d.status === 'extended'
      default:
        return true
    }
  })

  function exportReport() {
    const reportName = `${reportType}-deadlines-report`
    const headers = ['Client', 'Deadline', 'Form', 'Due Date', 'Jurisdiction', 'Tax Type', 'Status', 'Extended To', 'Notes']
    
    const rows = filteredDeadlines.map(d => [
      d.clients?.name || '',
      d.name,
      d.form_number || '',
      format(new Date(d.due_date), 'yyyy-MM-dd'),
      d.jurisdiction,
      d.tax_type,
      d.status,
      d.extended_to ? format(new Date(d.extended_to), 'yyyy-MM-dd') : '',
      d.notes || ''
    ])

    const csvContent = [
      `Report: ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Deadlines`,
      `Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`,
      `Date Range: Last ${dateRange} days`,
      '',
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${reportName}-${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
  }

  const reportOptions = [
    { value: 'missed', label: 'Missed Deadlines', icon: AlertTriangle, color: 'text-red-600' },
    { value: 'upcoming', label: 'Upcoming Deadlines', icon: Clock, color: 'text-blue-600' },
    { value: 'completed', label: 'Completed Deadlines', icon: CheckCircle, color: 'text-green-600' },
    { value: 'extended', label: 'Extended Deadlines', icon: TrendingUp, color: 'text-orange-600' },
    { value: 'all', label: 'All Deadlines', icon: FileText, color: 'text-slate-600' },
  ]

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
              <Link href="/analytics" className="text-slate-600 hover:text-slate-900">Analytics</Link>
              <Link href="/reports" className="text-blue-600 font-medium">Reports</Link>
              <Link href="/clients" className="text-slate-600 hover:text-slate-900">Clients</Link>
              <Link href="/settings" className="text-slate-600 hover:text-slate-900">Settings</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <button
            onClick={exportReport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            <Download className="h-4 w-4" /> Export Report
          </button>
        </div>

        {/* Report Type Selection */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {reportOptions.map(option => {
            const Icon = option.icon
            return (
              <button
                key={option.value}
                onClick={() => setReportType(option.value as ReportType)}
                className={`p-4 rounded-xl border transition text-left ${
                  reportType === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <Icon className={`h-5 w-5 mb-2 ${option.color}`} />
                <p className="font-medium text-slate-900 text-sm">{option.label}</p>
                <p className="text-xs text-slate-500">
                  {deadlines.filter(d => {
                    if (option.value === 'missed') return d.status === 'missed' || (d.status !== 'completed' && isPast(new Date(d.due_date)) && !isToday(new Date(d.due_date)))
                    if (option.value === 'upcoming') return d.status !== 'completed' && !isPast(new Date(d.due_date))
                    if (option.value === 'completed') return d.status === 'completed'
                    if (option.value === 'extended') return d.status === 'extended'
                    return true
                  }).length} items
                </p>
              </button>
            )
          })}
        </div>

        {/* Date Range */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-700">Date Range:</span>
            <div className="flex gap-2">
              {['7', '30', '90', '365'].map(days => (
                <button
                  key={days}
                  onClick={() => setDateRange(days)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                    dateRange === days
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {days === '7' ? '7 days' : days === '30' ? '30 days' : days === '90' ? '90 days' : '1 year'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Report Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              {reportOptions.find(o => o.value === reportType)?.label}
              <span className="text-slate-400 font-normal ml-2">({filteredDeadlines.length})</span>
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : filteredDeadlines.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p>No data for this report</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Deadline</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Form</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Jurisdiction</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDeadlines.map(d => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <Link href={`/clients/${d.client_id}`} className="font-medium text-blue-600 hover:underline">
                          {d.clients?.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-slate-900">{d.name}</td>
                      <td className="px-6 py-4 text-slate-500">{d.form_number || '-'}</td>
                      <td className="px-6 py-4 text-slate-900">
                        {format(new Date(d.due_date), 'MMM d, yyyy')}
                        {d.extended_to && (
                          <span className="block text-xs text-orange-600">
                            → {format(new Date(d.extended_to), 'MMM d')}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium">
                          {d.jurisdiction}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          d.status === 'completed' ? 'bg-green-100 text-green-700' :
                          d.status === 'extended' ? 'bg-orange-100 text-orange-700' :
                          d.status === 'missed' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
