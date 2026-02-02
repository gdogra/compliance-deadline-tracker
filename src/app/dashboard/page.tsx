'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ClientDeadline, Client } from '@/types/database'
import { format, isToday, isTomorrow, isThisWeek, isPast, addDays } from 'date-fns'
import { 
  Calendar, Bell, CheckCircle, Clock, AlertTriangle, 
  ChevronRight, Plus, Search, ExternalLink, Download, X, Filter,
  BarChart3, FileText, Activity, Square, CheckSquare, Moon, Sun, Brain
} from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const ThemeToggle = dynamic(() => import('@/components/ThemeToggle'), { ssr: false })
const NotificationCenter = dynamic(() => import('@/components/NotificationCenter'), { ssr: false })

type DeadlineWithClient = ClientDeadline & {
  clients: Client
}

const JURISDICTIONS = ['federal', 'CA', 'TX', 'NY', 'FL', 'IL']
const TAX_TYPES = ['income', 'payroll', 'estimated', 'franchise', 'sales', 'information']

export default function Dashboard() {
  const [deadlines, setDeadlines] = useState<DeadlineWithClient[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'overdue' | 'thisWeek' | 'upcoming'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<string[]>([])
  const [selectedTaxTypes, setSelectedTaxTypes] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const supabase = createClient()

  useEffect(() => {
    fetchDeadlines()
  }, [])

  async function fetchDeadlines() {
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('client_deadlines') as any)
      .select(`
        *,
        clients (*)
      `)
      .neq('status', 'completed')
      .order('due_date', { ascending: true })

    if (error) {
      console.error('Error fetching deadlines:', error)
    } else {
      setDeadlines(data as DeadlineWithClient[] || [])
    }
    setLoading(false)
  }

  async function markComplete(deadlineId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('client_deadlines') as any)
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', deadlineId)

    if (!error) {
      fetchDeadlines()
    }
  }

  async function bulkMarkComplete() {
    if (selectedIds.size === 0) return
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('client_deadlines') as any)
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .in('id', Array.from(selectedIds))

    if (!error) {
      setSelectedIds(new Set())
      fetchDeadlines()
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function toggleSelectAll() {
    if (selectedIds.size === filteredDeadlines.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredDeadlines.map(d => d.id)))
    }
  }

  function exportToCSV() {
    const headers = ['Client', 'Deadline', 'Form', 'Due Date', 'Jurisdiction', 'Tax Type', 'Status']
    const rows = filteredDeadlines.map(d => [
      d.clients?.name || '',
      d.name,
      d.form_number || '',
      format(new Date(d.due_date), 'yyyy-MM-dd'),
      d.jurisdiction,
      d.tax_type,
      d.status
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `deadlines-${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
  }

  const filteredDeadlines = deadlines.filter(d => {
    const dueDate = new Date(d.due_date)
    
    // Search filter
    const matchesSearch = searchQuery === '' || 
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.clients?.name.toLowerCase().includes(searchQuery.toLowerCase())

    // Jurisdiction filter
    const matchesJurisdiction = selectedJurisdictions.length === 0 ||
      selectedJurisdictions.includes(d.jurisdiction)

    // Tax type filter
    const matchesTaxType = selectedTaxTypes.length === 0 ||
      selectedTaxTypes.includes(d.tax_type)

    if (!matchesSearch || !matchesJurisdiction || !matchesTaxType) return false

    // Time filter
    switch (filter) {
      case 'overdue':
        return isPast(dueDate) && !isToday(dueDate)
      case 'thisWeek':
        return isThisWeek(dueDate)
      case 'upcoming':
        return dueDate > addDays(new Date(), 7)
      default:
        return true
    }
  })

  const overdueCount = deadlines.filter(d => isPast(new Date(d.due_date)) && !isToday(new Date(d.due_date))).length
  const thisWeekCount = deadlines.filter(d => isThisWeek(new Date(d.due_date))).length
  const upcomingCount = deadlines.filter(d => new Date(d.due_date) > addDays(new Date(), 7)).length

  function getStatusColor(dueDate: string) {
    const date = new Date(dueDate)
    if (isPast(date) && !isToday(date)) return 'text-red-600 bg-red-50 border-red-200'
    if (isToday(date) || isTomorrow(date)) return 'text-orange-600 bg-orange-50 border-orange-200'
    if (isThisWeek(date)) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-green-600 bg-green-50 border-green-200'
  }

  function getStatusLabel(dueDate: string) {
    const date = new Date(dueDate)
    if (isPast(date) && !isToday(date)) return 'Overdue'
    if (isToday(date)) return 'Due Today'
    if (isTomorrow(date)) return 'Due Tomorrow'
    if (isThisWeek(date)) return 'This Week'
    return format(date, 'MMM d')
  }

  const hasActiveFilters = selectedJurisdictions.length > 0 || selectedTaxTypes.length > 0

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
            <nav className="flex items-center gap-4">
              <Link href="/dashboard" className="text-blue-600 font-medium">Dashboard</Link>
              <Link href="/calendar" className="text-slate-600 hover:text-slate-900 dark:text-slate-300">Calendar</Link>
              <Link href="/analytics" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 flex items-center gap-1">
                <BarChart3 className="h-4 w-4" />
              </Link>
              <Link href="/reports" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 flex items-center gap-1">
                <FileText className="h-4 w-4" />
              </Link>
              <Link href="/activity" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 flex items-center gap-1">
                <Activity className="h-4 w-4" />
              </Link>
              <Link href="/clients" className="text-slate-600 hover:text-slate-900 dark:text-slate-300">Clients</Link>
              <Link href="/compliance-intelligence" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 flex items-center gap-1">
                <Activity className="h-4 w-4" />
              </Link>
              <Link href="/ai-insights" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 flex items-center gap-1">
                <Brain className="h-4 w-4" />
              </Link>
              <Link href="/settings" className="text-slate-600 hover:text-slate-900 dark:text-slate-300">Settings</Link>
              <NotificationCenter />
              <ThemeToggle />
              <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-700 rounded">
                ⌘K
              </kbd>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <button 
            onClick={() => setFilter('overdue')}
            className={`p-6 rounded-xl border transition ${filter === 'overdue' ? 'border-red-500 bg-red-50' : 'bg-white border-slate-200 hover:border-slate-300'}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Overdue</p>
                <p className="text-3xl font-bold text-red-600">{overdueCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </button>

          <button 
            onClick={() => setFilter('thisWeek')}
            className={`p-6 rounded-xl border transition ${filter === 'thisWeek' ? 'border-yellow-500 bg-yellow-50' : 'bg-white border-slate-200 hover:border-slate-300'}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">This Week</p>
                <p className="text-3xl font-bold text-yellow-600">{thisWeekCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </button>

          <button 
            onClick={() => setFilter('upcoming')}
            className={`p-6 rounded-xl border transition ${filter === 'upcoming' ? 'border-green-500 bg-green-50' : 'bg-white border-slate-200 hover:border-slate-300'}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Upcoming</p>
                <p className="text-3xl font-bold text-green-600">{upcomingCount}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-400" />
            </div>
          </button>

          <button 
            onClick={() => setFilter('all')}
            className={`p-6 rounded-xl border transition ${filter === 'all' ? 'border-blue-500 bg-blue-50' : 'bg-white border-slate-200 hover:border-slate-300'}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Pending</p>
                <p className="text-3xl font-bold text-blue-600">{deadlines.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-400" />
            </div>
          </button>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search deadlines or clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-lg font-medium transition ${
                hasActiveFilters ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters {hasActiveFilters && `(${selectedJurisdictions.length + selectedTaxTypes.length})`}
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 rounded-lg font-medium hover:bg-slate-50 transition"
            >
              <Download className="h-4 w-4" /> Export
            </button>
            <Link
              href="/deadlines/new"
              className="flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-600 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              <Plus className="h-4 w-4" /> Deadline
            </Link>
            <Link
              href="/clients/new"
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              <Plus className="h-5 w-5" /> Client
            </Link>
          </div>

          {/* Filter Chips */}
          {showFilters && (
            <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Jurisdiction</p>
                <div className="flex flex-wrap gap-2">
                  {JURISDICTIONS.map(j => (
                    <button
                      key={j}
                      onClick={() => setSelectedJurisdictions(prev =>
                        prev.includes(j) ? prev.filter(x => x !== j) : [...prev, j]
                      )}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                        selectedJurisdictions.includes(j)
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {j}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Tax Type</p>
                <div className="flex flex-wrap gap-2">
                  {TAX_TYPES.map(t => (
                    <button
                      key={t}
                      onClick={() => setSelectedTaxTypes(prev =>
                        prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
                      )}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                        selectedTaxTypes.includes(t)
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setSelectedJurisdictions([])
                    setSelectedTaxTypes([])
                  }}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <X className="h-4 w-4" /> Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Deadlines List */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSelectAll}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                {selectedIds.size === filteredDeadlines.length && filteredDeadlines.length > 0 ? (
                  <CheckSquare className="h-5 w-5 text-blue-600" />
                ) : (
                  <Square className="h-5 w-5" />
                )}
              </button>
              <h2 className="text-lg font-semibold text-slate-900">
                {filter === 'all' ? 'All Deadlines' : 
                 filter === 'overdue' ? 'Overdue Deadlines' :
                 filter === 'thisWeek' ? 'Due This Week' : 'Upcoming Deadlines'}
                <span className="text-slate-400 font-normal ml-2">({filteredDeadlines.length})</span>
              </h2>
            </div>
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">{selectedIds.size} selected</span>
                <button
                  onClick={bulkMarkComplete}
                  className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
                >
                  <CheckCircle className="h-4 w-4" /> Complete All
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="text-sm text-slate-500 hover:text-slate-700"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              Loading deadlines...
            </div>
          ) : filteredDeadlines.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium mb-2">No deadlines found</p>
              <p className="text-sm">
                {searchQuery || hasActiveFilters ? 'Try adjusting your filters' : 'Add a client to get started'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredDeadlines.map((deadline) => (
                <div 
                  key={deadline.id}
                  className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-4"
                >
                  <button
                    onClick={() => toggleSelect(deadline.id)}
                    className="text-slate-400 hover:text-slate-600 transition"
                  >
                    {selectedIds.has(deadline.id) ? (
                      <CheckSquare className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                  </button>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(deadline.due_date)}`}>
                    {getStatusLabel(deadline.due_date)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{deadline.name}</p>
                    <p className="text-sm text-slate-500">
                      <Link href={`/clients/${deadline.client_id}`} className="hover:text-blue-600 hover:underline">
                        {deadline.clients?.name}
                      </Link>
                      {' • '}{deadline.jurisdiction} • {deadline.form_number || 'No form'}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">
                      {format(new Date(deadline.due_date), 'MMM d, yyyy')}
                    </p>
                    <p className="text-xs text-slate-500">{deadline.tax_type}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {deadline.links && Array.isArray(deadline.links) && deadline.links.length > 0 && (
                      <a
                        href={(deadline.links[0] as { url: string }).url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-slate-400 hover:text-blue-600 transition"
                        title="Open form link"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <button
                      onClick={() => markComplete(deadline.id)}
                      className="p-2 text-slate-400 hover:text-green-600 transition"
                      title="Mark complete"
                    >
                      <CheckCircle className="h-5 w-5" />
                    </button>
                    <Link href={`/clients/${deadline.client_id}`}>
                      <ChevronRight className="h-5 w-5 text-slate-300 hover:text-slate-500" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
