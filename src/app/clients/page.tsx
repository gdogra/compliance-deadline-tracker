'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Client } from '@/types/database'
import { Calendar, Plus, Search, Building2, User, MapPin, ChevronRight, Activity, Brain } from 'lucide-react'
import Link from 'next/link'

const ENTITY_LABELS: Record<string, string> = {
  individual: 'Individual',
  sole_prop: 'Sole Prop',
  llc: 'LLC',
  s_corp: 'S-Corp',
  c_corp: 'C-Corp',
  partnership: 'Partnership',
  non_profit: 'Non-Profit',
  trust: 'Trust',
  estate: 'Estate',
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  const supabase = createClient()

  useEffect(() => {
    fetchClients()
  }, [])

  async function fetchClients() {
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('clients') as any)
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching clients:', error)
    } else {
      setClients(data || [])
    }
    setLoading(false)
  }

  const filteredClients = clients.filter(c =>
    searchQuery === '' ||
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.entity_type.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
              <Link href="/clients" className="text-slate-600 hover:text-slate-900">Clients</Link>
              <Link href="/compliance-intelligence" className="text-slate-600 hover:text-slate-900">Compliance Intelligence</Link>
              <Link href="/ai-insights" className="text-blue-600 font-medium">AI Insights</Link>
              <Link href="/settings" className="text-slate-600 hover:text-slate-900">Settings</Link>
              <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
            <p className="text-slate-500">{clients.length} active clients</p>
          </div>
          <Link
            href="/clients/new"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            <Plus className="h-5 w-5" /> Add Client
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Clients Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-500">Loading clients...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-medium text-slate-900 mb-2">
              {searchQuery ? 'No clients found' : 'No clients yet'}
            </p>
            <p className="text-slate-500 mb-4">
              {searchQuery ? 'Try a different search term' : 'Add your first client to get started'}
            </p>
            {!searchQuery && (
              <Link
                href="/clients/new"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                <Plus className="h-5 w-5" /> Add Client
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredClients.map((client) => (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md hover:border-slate-300 transition group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    {client.entity_type === 'individual' ? (
                      <User className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Building2 className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-500 transition" />
                </div>

                <h3 className="font-semibold text-slate-900 mb-1 truncate">{client.name}</h3>
                <p className="text-sm text-slate-500 mb-3">{ENTITY_LABELS[client.entity_type] || client.entity_type}</p>

                {client.states && client.states.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="h-3 w-3" />
                    <span>{client.states.join(', ')}</span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
