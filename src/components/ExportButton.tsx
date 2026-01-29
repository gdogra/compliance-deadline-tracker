'use client'

import { Download } from 'lucide-react'
import { ClientDeadline, Client } from '@/types/database'
import { format } from 'date-fns'

type DeadlineWithClient = ClientDeadline & {
  clients: Client
}

interface ExportButtonProps {
  deadlines: DeadlineWithClient[]
}

export default function ExportButton({ deadlines }: ExportButtonProps) {
  function exportToCSV() {
    const headers = [
      'Client Name',
      'Deadline',
      'Form',
      'Due Date',
      'Jurisdiction',
      'Tax Type',
      'Status',
      'Extended To',
      'Notes'
    ]

    const rows = deadlines.map(d => [
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
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `deadlines-${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
  }

  return (
    <button
      onClick={exportToCSV}
      className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg font-medium hover:bg-slate-50 transition"
    >
      <Download className="h-4 w-4" />
      Export CSV
    </button>
  )
}
