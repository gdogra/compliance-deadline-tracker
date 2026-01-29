'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Client, ClientDeadline } from '@/types/database'
import { format, isPast, isToday } from 'date-fns'
import { 
  Calendar, ArrowLeft, Building2, User, MapPin, Mail, Phone, 
  CheckCircle, Clock, AlertTriangle, ExternalLink, FileText, Edit, Trash2
} from 'lucide-react'
import Link from 'next/link'

const ENTITY_LABELS: Record<string, string> = {
  individual: 'Individual',
  sole_prop: 'Sole Proprietorship',
  llc: 'LLC',
  s_corp: 'S-Corporation',
  c_corp: 'C-Corporation',
  partnership: 'Partnership',
  non_profit: 'Non-Profit',
  trust: 'Trust',
  estate: 'Estate',
}

export default function ClientDetailPage() {
  const params = useParams()
  const [client, setClient] = useState<Client | null>(null)
  const [deadlines, setDeadlines] = useState<ClientDeadline[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')

  const supabase = createClient()

  useEffect(() => {
    if (params.id) {
      fetchClient()
      fetchDeadlines()
    }
  }, [params.id])

  async function fetchClient() {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', params.id)
      .single()

    if (!error && data) {
      setClient(data)
    }
  }

  async function fetchDeadlines() {
    setLoading(true)
    const { data, error } = await supabase
      .from('client_deadlines')
      .select('*')
      .eq('client_id', params.id)
      .order('due_date', { ascending: true })

    if (!error) {
      setDeadlines(data || [])
    }
    setLoading(false)
  }

  async function markComplete(deadlineId: string) {
    await supabase
      .from('client_deadlines')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', deadlineId)
    fetchDeadlines()
  }

  async function markExtended(deadlineId: string) {
    const extendedDate = prompt('Enter new due date (YYYY-MM-DD):')
    if (extendedDate) {
      await supabase
        .from('client_deadlines')
        .update({ status: 'extended', extended_to: extendedDate })
        .eq('id', deadlineId)
      fetchDeadlines()
    }
  }

  const filteredDeadlines = deadlines.filter(d => {
    if (filter === 'pending') return d.status !== 'completed'
    if (filter === 'completed') return d.status === 'completed'
    return true
  })

  const stats = {
    total: deadlines.length,
    completed: deadlines.filter(d => d.status === 'completed').length,
    overdue: deadlines.filter(d => d.status !== 'completed' && isPast(new Date(d.due_date)) && !isToday(new Date(d.due_date))).length,
    upcoming: deadlines.filter(d => d.status !== 'completed' && !isPast(new Date(d.due_date))).length,
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <Link href="/clients" className="text-slate-500 hover:text-slate-700">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Calendar className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-semibold text-slate-900">{client.name}</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Client Info Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                  {client.entity_type === 'individual' ? (
                    <User className="h-8 w-8 text-blue-600" />
                  ) : (
                    <Building2 className="h-8 w-8 text-blue-600" />
                  )}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">{client.name}</h1>
                  <p className="text-slate-500">{ENTITY_LABELS[client.entity_type]}</p>
                </div>
              </div>

              <div className="space-y-3">
                {client.ein && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">EIN: {client.ein}</span>
                  </div>
                )}
                {client.contact_email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <a href={`mailto:${client.contact_email}`} className="text-blue-600 hover:underline">
                      {client.contact_email}
                    </a>
                  </div>
                )}
                {client.contact_phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">{client.contact_phone}</span>
                  </div>
                )}
                {client.states && client.states.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">{client.states.join(', ')}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-6">
                <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50">
                  <Edit className="h-4 w-4" /> Edit
                </button>
                <button className="flex items-center justify-center gap-1 px-3 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Deadline Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                  <p className="text-xs text-slate-500">Total</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                  <p className="text-xs text-slate-500">Completed</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                  <p className="text-xs text-slate-500">Overdue</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{stats.upcoming}</p>
                  <p className="text-xs text-slate-500">Upcoming</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {client.notes && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-2">Notes</h3>
                <p className="text-sm text-slate-600">{client.notes}</p>
              </div>
            )}
          </div>

          {/* Deadlines */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">Deadlines</h2>
                  <div className="flex gap-2">
                    {(['all', 'pending', 'completed'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                          filter === f
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                </div>
              ) : filteredDeadlines.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>No deadlines found</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredDeadlines.map(deadline => {
                    const isOverdue = deadline.status !== 'completed' && isPast(new Date(deadline.due_date)) && !isToday(new Date(deadline.due_date))
                    
                    return (
                      <div key={deadline.id} className="p-4 hover:bg-slate-50 transition">
                        <div className="flex items-start gap-4">
                          <div className={`mt-1 p-2 rounded-lg ${
                            deadline.status === 'completed' ? 'bg-green-100' :
                            isOverdue ? 'bg-red-100' : 'bg-blue-100'
                          }`}>
                            {deadline.status === 'completed' ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : isOverdue ? (
                              <AlertTriangle className="h-5 w-5 text-red-600" />
                            ) : (
                              <Clock className="h-5 w-5 text-blue-600" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className={`font-medium ${deadline.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                                  {deadline.name}
                                </p>
                                <p className="text-sm text-slate-500">{deadline.description}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-slate-900'}`}>
                                  {format(new Date(deadline.due_date), 'MMM d, yyyy')}
                                </p>
                                {deadline.extended_to && (
                                  <p className="text-xs text-orange-600">
                                    Extended to {format(new Date(deadline.extended_to), 'MMM d')}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">{deadline.jurisdiction}</span>
                              <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">{deadline.tax_type}</span>
                              {deadline.form_number && (
                                <span className="text-xs text-slate-500">{deadline.form_number}</span>
                              )}
                            </div>

                            {deadline.status !== 'completed' && (
                              <div className="flex items-center gap-2 mt-3">
                                <button
                                  onClick={() => markComplete(deadline.id)}
                                  className="text-xs px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                  Mark Complete
                                </button>
                                <button
                                  onClick={() => markExtended(deadline.id)}
                                  className="text-xs px-3 py-1 border border-slate-300 rounded-lg hover:bg-slate-50"
                                >
                                  File Extension
                                </button>
                                {deadline.links && Array.isArray(deadline.links) && deadline.links.length > 0 && (
                                  <a
                                    href={(deadline.links[0] as { url: string }).url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs px-3 py-1 text-blue-600 hover:underline flex items-center gap-1"
                                  >
                                    <ExternalLink className="h-3 w-3" /> Open Form
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
