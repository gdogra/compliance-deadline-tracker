'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Calendar, ArrowLeft, Upload, FileText, CheckCircle, AlertTriangle, Download } from 'lucide-react'
import Link from 'next/link'

interface ImportRow {
  name: string
  entity_type: string
  ein?: string
  contact_email?: string
  contact_phone?: string
  states: string
  notes?: string
  valid: boolean
  error?: string
}

export default function ImportClientsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'done'>('upload')
  const [rows, setRows] = useState<ImportRow[]>([])
  const [importedCount, setImportedCount] = useState(0)
  const [errorCount, setErrorCount] = useState(0)

  const VALID_ENTITY_TYPES = ['individual', 'sole_prop', 'llc', 's_corp', 'c_corp', 'partnership', 'non_profit', 'trust', 'estate']

  function downloadTemplate() {
    const headers = 'name,entity_type,ein,contact_email,contact_phone,states,notes'
    const example1 = 'John Smith,individual,,john@email.com,(555) 123-4567,CA,New client'
    const example2 = 'Acme Corp,s_corp,12-3456789,cfo@acme.com,(555) 987-6543,"CA,TX,NY",Multiple state operations'
    const example3 = 'Smith & Associates,partnership,98-7654321,admin@smith.com,,"FL,GA",'

    const content = [headers, example1, example2, example3].join('\n')
    const blob = new Blob([content], { type: 'text/csv' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'client-import-template.csv'
    link.click()
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      parseCSV(text)
    }
    reader.readAsText(file)
  }

  function parseCSV(text: string) {
    const lines = text.split('\n').filter(line => line.trim())
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim())

    const parsed: ImportRow[] = []

    for (let i = 1; i < lines.length; i++) {
      // Handle quoted fields with commas
      const matches = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || []
      const values = matches.map(v => v.replace(/^"|"$/g, '').trim())

      const row: Record<string, string> = {}
      headers.forEach((h, idx) => {
        row[h] = values[idx] || ''
      })

      // Validate
      let valid = true
      let error = ''

      if (!row.name) {
        valid = false
        error = 'Name is required'
      } else if (!row.entity_type || !VALID_ENTITY_TYPES.includes(row.entity_type.toLowerCase())) {
        valid = false
        error = `Invalid entity type: ${row.entity_type}. Valid: ${VALID_ENTITY_TYPES.join(', ')}`
      } else if (!row.states) {
        valid = false
        error = 'At least one state is required'
      }

      parsed.push({
        name: row.name || '',
        entity_type: row.entity_type?.toLowerCase() || '',
        ein: row.ein,
        contact_email: row.contact_email,
        contact_phone: row.contact_phone,
        states: row.states || '',
        notes: row.notes,
        valid,
        error
      })
    }

    setRows(parsed)
    setStep('preview')
  }

  async function doImport() {
    setStep('importing')
    let imported = 0
    let errors = 0

    // Get or create a demo firm
    const { data: firms } = await supabase.from('firms').select('id').limit(1)
    let firmId = firms?.[0]?.id

    if (!firmId) {
      const { data: newFirm } = await supabase
        .from('firms')
        .insert({ name: 'My Firm' })
        .select()
        .single()
      firmId = newFirm?.id
    }

    for (const row of rows) {
      if (!row.valid) {
        errors++
        continue
      }

      const states = row.states.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)

      const { data: client, error } = await supabase
        .from('clients')
        .insert({
          firm_id: firmId,
          name: row.name,
          entity_type: row.entity_type,
          ein: row.ein || null,
          contact_email: row.contact_email || null,
          contact_phone: row.contact_phone || null,
          states,
          notes: row.notes || null,
          tax_types: ['income', 'estimated']
        })
        .select()
        .single()

      if (error) {
        errors++
      } else {
        imported++
        // Generate deadlines
        const currentYear = new Date().getFullYear()
        await supabase.rpc('generate_client_deadlines', {
          p_client_id: client.id,
          p_year: currentYear
        })
      }
    }

    setImportedCount(imported)
    setErrorCount(errors)
    setStep('done')
  }

  const validCount = rows.filter(r => r.valid).length
  const invalidCount = rows.filter(r => !r.valid).length

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <Link href="/clients" className="text-slate-500 hover:text-slate-700">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-semibold text-slate-900 dark:text-white">Import Clients</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Steps */}
        <div className="flex items-center gap-4 mb-8">
          {['Upload', 'Preview', 'Import'].map((s, idx) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                (step === 'upload' && idx === 0) ||
                (step === 'preview' && idx === 1) ||
                ((step === 'importing' || step === 'done') && idx === 2)
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
              }`}>
                {idx + 1}
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-400">{s}</span>
              {idx < 2 && <div className="w-8 h-px bg-slate-300 dark:bg-slate-600" />}
            </div>
          ))}
        </div>

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8">
            <div className="text-center mb-8">
              <Upload className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Upload CSV File
              </h2>
              <p className="text-slate-500">
                Import multiple clients at once from a CSV file
              </p>
            </div>

            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center mb-6">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                <FileText className="h-5 w-5" />
                Select CSV File
              </label>
              <p className="text-sm text-slate-500 mt-4">
                or drag and drop your file here
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Need a template?</p>
                <p className="text-sm text-slate-500">Download our CSV template with example data</p>
              </div>
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <Download className="h-4 w-4" />
                Download Template
              </button>
            </div>
          </div>
        )}

        {/* Preview Step */}
        {step === 'preview' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Preview ({rows.length} rows)
                </h2>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" /> {validCount} valid
                  </span>
                  {invalidCount > 0 && (
                    <span className="flex items-center gap-1 text-red-600">
                      <AlertTriangle className="h-4 w-4" /> {invalidCount} errors
                    </span>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900">
                    <tr>
                      <th className="px-3 py-2 text-left text-slate-500">Status</th>
                      <th className="px-3 py-2 text-left text-slate-500">Name</th>
                      <th className="px-3 py-2 text-left text-slate-500">Type</th>
                      <th className="px-3 py-2 text-left text-slate-500">States</th>
                      <th className="px-3 py-2 text-left text-slate-500">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {rows.map((row, idx) => (
                      <tr key={idx} className={row.valid ? '' : 'bg-red-50 dark:bg-red-900/20'}>
                        <td className="px-3 py-2">
                          {row.valid ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-500" title={row.error} />
                          )}
                        </td>
                        <td className="px-3 py-2 font-medium text-slate-900 dark:text-white">{row.name}</td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{row.entity_type}</td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{row.states}</td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{row.contact_email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => { setStep('upload'); setRows([]) }}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Back
              </button>
              <button
                onClick={doImport}
                disabled={validCount === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                Import {validCount} Clients
              </button>
            </div>
          </div>
        )}

        {/* Importing Step */}
        {step === 'importing' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
            <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-6"></div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Importing Clients...
            </h2>
            <p className="text-slate-500">
              Please wait while we import your clients and generate their deadlines
            </p>
          </div>
        )}

        {/* Done Step */}
        {step === 'done' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Import Complete!
            </h2>
            <p className="text-slate-500 mb-6">
              Successfully imported {importedCount} clients
              {errorCount > 0 && ` (${errorCount} failed)`}
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/clients"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                View Clients
              </Link>
              <Link
                href="/dashboard"
                className="px-6 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
