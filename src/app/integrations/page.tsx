'use client'

import { useState } from 'react'
import { Calendar, Check, ExternalLink, Zap, Mail, MessageSquare, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface Integration {
  id: string
  name: string
  description: string
  icon: string
  connected: boolean
  category: 'calendar' | 'communication' | 'accounting' | 'storage'
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([
    { id: 'google-calendar', name: 'Google Calendar', description: 'Sync deadlines to your Google Calendar', icon: '📅', connected: false, category: 'calendar' },
    { id: 'outlook', name: 'Microsoft Outlook', description: 'Sync deadlines to Outlook Calendar', icon: '📆', connected: false, category: 'calendar' },
    { id: 'apple-calendar', name: 'Apple Calendar', description: 'Sync deadlines via iCal feed', icon: '🍎', connected: true, category: 'calendar' },
    { id: 'slack', name: 'Slack', description: 'Get deadline alerts in Slack channels', icon: '💬', connected: false, category: 'communication' },
    { id: 'email', name: 'Email Notifications', description: 'Send alerts via email', icon: '📧', connected: true, category: 'communication' },
    { id: 'sms', name: 'SMS Alerts', description: 'Text message reminders for urgent deadlines', icon: '📱', connected: false, category: 'communication' },
    { id: 'quickbooks', name: 'QuickBooks', description: 'Import clients from QuickBooks', icon: '📊', connected: false, category: 'accounting' },
    { id: 'xero', name: 'Xero', description: 'Import clients from Xero', icon: '💹', connected: false, category: 'accounting' },
    { id: 'google-drive', name: 'Google Drive', description: 'Attach documents from Drive', icon: '📁', connected: false, category: 'storage' },
    { id: 'dropbox', name: 'Dropbox', description: 'Attach documents from Dropbox', icon: '📦', connected: false, category: 'storage' },
  ])

  function toggleConnection(id: string) {
    setIntegrations(prev => prev.map(i => 
      i.id === id ? { ...i, connected: !i.connected } : i
    ))
  }

  const categories = [
    { id: 'calendar', name: 'Calendar Sync', icon: Calendar },
    { id: 'communication', name: 'Notifications', icon: MessageSquare },
    { id: 'accounting', name: 'Accounting', icon: Zap },
    { id: 'storage', name: 'File Storage', icon: Mail },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <Calendar className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-slate-900 dark:text-white">DeadlineTracker</span>
            </div>
            <nav className="flex items-center gap-6">
              <Link href="/dashboard" className="text-slate-600 dark:text-slate-300 hover:text-slate-900">Dashboard</Link>
              <Link href="/integrations" className="text-blue-600 font-medium">Integrations</Link>
              <Link href="/settings" className="text-slate-600 dark:text-slate-300 hover:text-slate-900">Settings</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Integrations</h1>
          <p className="text-slate-500">Connect DeadlineTracker with your favorite tools</p>
        </div>

        {/* iCal Feed */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white mb-1">
                📅 Universal Calendar Feed (iCal)
              </h2>
              <p className="text-sm text-slate-500 mb-4">
                Subscribe to this URL in any calendar app to see all your deadlines
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value="https://deadlinetracker.com/cal/abc123.ics"
                  className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-400"
                />
                <button
                  onClick={() => navigator.clipboard.writeText('https://deadlinetracker.com/cal/abc123.ics')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                >
                  Copy
                </button>
              </div>
            </div>
            <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Integration Categories */}
        {categories.map(category => {
          const categoryIntegrations = integrations.filter(i => i.category === category.id)
          const Icon = category.icon

          return (
            <div key={category.id} className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Icon className="h-5 w-5 text-slate-400" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{category.name}</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {categoryIntegrations.map(integration => (
                  <div
                    key={integration.id}
                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4"
                  >
                    <div className="text-3xl">{integration.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-slate-900 dark:text-white">{integration.name}</h3>
                      <p className="text-sm text-slate-500 truncate">{integration.description}</p>
                    </div>
                    <button
                      onClick={() => toggleConnection(integration.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                        integration.connected
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {integration.connected ? (
                        <span className="flex items-center gap-1">
                          <Check className="h-4 w-4" /> Connected
                        </span>
                      ) : (
                        'Connect'
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {/* Webhooks Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white mb-1">
                🔗 Webhooks & API
              </h2>
              <p className="text-sm text-slate-500">
                Build custom integrations with our API
              </p>
            </div>
            <span className="px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded text-xs font-medium">
              Firm Plan
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <ExternalLink className="h-4 w-4" />
              API Documentation
            </a>
            <a
              href="#"
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <ExternalLink className="h-4 w-4" />
              Webhook Settings
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
