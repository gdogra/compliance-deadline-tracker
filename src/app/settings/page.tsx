'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, Bell, User, Building2, CreditCard, Mail, Phone, Save, Check, Activity, Brain } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  const supabase = createClient();
  const [saved, setSaved] = useState(false)
  const [settings, setSettings] = useState({
    firmName: 'Demo Firm',
    email: 'demo@example.com',
    phone: '',
    alertEmail: true,
    alertSms: false,
    alertDays: [7, 3, 1],
  })

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

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
              <Link href="/settings" className="text-blue-600 font-medium">Settings</Link>
              <button 
                onClick={async () => {
                  const { error } = await supabase.auth.signOut();
                  if (!error) {
                    window.location.href = '/login';
                  }
                }}
                className="text-slate-600 hover:text-red-600 font-medium"
              >
                Logout
              </button>
              <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-8">Settings</h1>

        <div className="space-y-6">
          {/* Firm Settings */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Building2 className="h-5 w-5 text-slate-400" />
              <h2 className="text-lg font-semibold text-slate-900">Firm Information</h2>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Firm Name
                </label>
                <input
                  type="text"
                  value={settings.firmName}
                  onChange={(e) => setSettings({ ...settings, firmName: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <Mail className="h-4 w-4 inline mr-1" /> Email
                  </label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <Phone className="h-4 w-4 inline mr-1" /> Phone (for SMS)
                  </label>
                  <input
                    type="tel"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Alert Settings */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Bell className="h-5 w-5 text-slate-400" />
              <h2 className="text-lg font-semibold text-slate-900">Alert Preferences</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">Email Alerts</p>
                  <p className="text-sm text-slate-500">Receive deadline reminders via email</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, alertEmail: !settings.alertEmail })}
                  className={`w-12 h-6 rounded-full transition ${settings.alertEmail ? 'bg-blue-600' : 'bg-slate-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition transform ${settings.alertEmail ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">SMS Alerts</p>
                  <p className="text-sm text-slate-500">Receive deadline reminders via text message</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, alertSms: !settings.alertSms })}
                  className={`w-12 h-6 rounded-full transition ${settings.alertSms ? 'bg-blue-600' : 'bg-slate-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition transform ${settings.alertSms ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <div className="pt-4">
                <p className="font-medium text-slate-900 mb-2">Alert Schedule</p>
                <p className="text-sm text-slate-500 mb-3">Send reminders before deadlines:</p>
                <div className="flex flex-wrap gap-2">
                  {[14, 7, 3, 1, 0].map(days => (
                    <button
                      key={days}
                      onClick={() => {
                        const newDays = settings.alertDays.includes(days)
                          ? settings.alertDays.filter(d => d !== days)
                          : [...settings.alertDays, days].sort((a, b) => b - a)
                        setSettings({ ...settings, alertDays: newDays })
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                        settings.alertDays.includes(days)
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {days === 0 ? 'Day of' : `${days} days`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Subscription */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <CreditCard className="h-5 w-5 text-slate-400" />
              <h2 className="text-lg font-semibold text-slate-900">Subscription</h2>
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div>
                <p className="font-semibold text-blue-900">Team Plan</p>
                <p className="text-sm text-blue-700">Up to 5 users • 100 clients • Email + SMS alerts</p>
              </div>
              <span className="text-2xl font-bold text-blue-900">$79<span className="text-sm font-normal">/mo</span></span>
            </div>

            <div className="mt-4 flex gap-4">
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Change Plan
              </button>
              <button className="text-sm text-slate-500 hover:text-slate-700">
                Billing History
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
            >
              {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
