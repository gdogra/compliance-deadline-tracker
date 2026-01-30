'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { EntityType } from '@/types/database'
import { Calendar, ArrowLeft, Building2, User, MapPin, Save } from 'lucide-react'
import Link from 'next/link'

const ENTITY_TYPES: { value: EntityType; label: string }[] = [
  { value: 'individual', label: 'Individual' },
  { value: 'sole_prop', label: 'Sole Proprietorship' },
  { value: 'llc', label: 'LLC' },
  { value: 's_corp', label: 'S-Corporation' },
  { value: 'c_corp', label: 'C-Corporation' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'non_profit', label: 'Non-Profit' },
  { value: 'trust', label: 'Trust' },
  { value: 'estate', label: 'Estate' },
]

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
]

const TAX_TYPES = [
  { value: 'income', label: 'Income Tax' },
  { value: 'payroll', label: 'Payroll Tax' },
  { value: 'sales', label: 'Sales Tax' },
  { value: 'franchise', label: 'Franchise Tax' },
  { value: 'estimated', label: 'Estimated Tax' },
]

export default function NewClientPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    entity_type: 'individual' as EntityType,
    ein: '',
    contact_email: '',
    contact_phone: '',
    states: [] as string[],
    tax_types: ['income', 'estimated'] as string[],
    fiscal_year_end: '12-31',
    notes: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  function handleStateToggle(state: string) {
    setFormData(prev => ({
      ...prev,
      states: prev.states.includes(state)
        ? prev.states.filter(s => s !== state)
        : [...prev.states, state]
    }))
  }

  function handleTaxTypeToggle(taxType: string) {
    setFormData(prev => ({
      ...prev,
      tax_types: prev.tax_types.includes(taxType)
        ? prev.tax_types.filter(t => t !== taxType)
        : [...prev.tax_types, taxType]
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // For now, we'll use a placeholder firm_id
    // In production, this would come from the authenticated user's session
    const { data: userData } = await supabase.auth.getUser()
    
    if (!userData.user) {
      // For demo purposes, create a default firm if not authenticated
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: firmData, error: firmError } = await (supabase.from('firms') as any)
        .insert({ name: 'Demo Firm' })
        .select()
        .single()

      if (firmError) {
        setError('Failed to create firm: ' + firmError.message)
        setLoading(false)
        return
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: clientData, error: clientError } = await (supabase.from('clients') as any)
        .insert({
          ...formData,
          firm_id: firmData.id,
        })
        .select()
        .single()

      if (clientError) {
        setError('Failed to create client: ' + clientError.message)
        setLoading(false)
        return
      }

      // Generate deadlines for current year
      const currentYear = new Date().getFullYear()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).rpc('generate_client_deadlines', {
        p_client_id: clientData.id,
        p_year: currentYear
      })

      router.push('/dashboard')
    } else {
      // Get user's firm
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: userProfile } = await (supabase.from('users') as any)
        .select('firm_id')
        .eq('id', userData.user.id)
        .single()

      if (!userProfile?.firm_id) {
        setError('User is not associated with a firm')
        setLoading(false)
        return
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: clientData, error: clientError } = await (supabase.from('clients') as any)
        .insert({
          ...formData,
          firm_id: userProfile.firm_id,
        })
        .select()
        .single()

      if (clientError) {
        setError('Failed to create client: ' + clientError.message)
        setLoading(false)
        return
      }

      // Generate deadlines for current year
      const currentYear = new Date().getFullYear()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).rpc('generate_client_deadlines', {
        p_client_id: clientData.id,
        p_year: currentYear
      })

      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <Link href="/dashboard" className="text-slate-500 hover:text-slate-700">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-semibold text-slate-900">Add New Client</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <User className="h-5 w-5 text-slate-400" />
              <h2 className="text-lg font-semibold text-slate-900">Basic Information</h2>
            </div>

            <div className="grid gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Client Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Smith or ABC Corporation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Entity Type *
                </label>
                <select
                  name="entity_type"
                  value={formData.entity_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ENTITY_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    EIN (if applicable)
                  </label>
                  <input
                    type="text"
                    name="ein"
                    value={formData.ein}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="XX-XXXXXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Fiscal Year End
                  </label>
                  <input
                    type="text"
                    name="fiscal_year_end"
                    value={formData.fiscal_year_end}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="12-31"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="client@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* States */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="h-5 w-5 text-slate-400" />
              <h2 className="text-lg font-semibold text-slate-900">States of Operation</h2>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Select all states where this client has tax obligations.
            </p>
            <div className="flex flex-wrap gap-2">
              {US_STATES.map(state => (
                <button
                  key={state}
                  type="button"
                  onClick={() => handleStateToggle(state)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                    formData.states.includes(state)
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {state}
                </button>
              ))}
            </div>
          </div>

          {/* Tax Types */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Building2 className="h-5 w-5 text-slate-400" />
              <h2 className="text-lg font-semibold text-slate-900">Tax Types</h2>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Select the types of taxes this client needs to file.
            </p>
            <div className="flex flex-wrap gap-3">
              {TAX_TYPES.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleTaxTypeToggle(type.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    formData.tax_types.includes(type.value)
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Notes</h2>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any additional notes about this client..."
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Link
              href="/dashboard"
              className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !formData.name || formData.states.length === 0}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Creating...' : 'Create Client'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
