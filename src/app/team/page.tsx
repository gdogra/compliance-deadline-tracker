'use client'

import { useState } from 'react'
import { Calendar, Users, Plus, Mail, Shield, MoreVertical, Trash2, Edit, UserPlus } from 'lucide-react'
import Link from 'next/link'

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'owner' | 'admin' | 'member'
  avatar?: string
  status: 'active' | 'pending'
  assignedClients: number
}

export default function TeamPage() {
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')

  // Demo team data
  const [members] = useState<TeamMember[]>([
    { id: '1', name: 'You', email: 'you@yourfirm.com', role: 'owner', status: 'active', assignedClients: 15 },
    { id: '2', name: 'Sarah Johnson', email: 'sarah@yourfirm.com', role: 'admin', status: 'active', assignedClients: 12 },
    { id: '3', name: 'Mike Chen', email: 'mike@yourfirm.com', role: 'member', status: 'active', assignedClients: 8 },
    { id: '4', name: 'Pending Invite', email: 'new@yourfirm.com', role: 'member', status: 'pending', assignedClients: 0 },
  ])

  function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    // In production, this would send an invite
    alert(`Invite sent to ${inviteEmail} as ${inviteRole}`)
    setInviteEmail('')
    setShowInvite(false)
  }

  function getRoleBadge(role: string) {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
      case 'admin':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
    }
  }

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
              <Link href="/clients" className="text-slate-600 dark:text-slate-300 hover:text-slate-900">Clients</Link>
              <Link href="/team" className="text-blue-600 font-medium">Team</Link>
              <Link href="/settings" className="text-slate-600 dark:text-slate-300 hover:text-slate-900">Settings</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Team</h1>
            <p className="text-slate-500">{members.length} members</p>
          </div>
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            <UserPlus className="h-4 w-4" />
            Invite Member
          </button>
        </div>

        {/* Invite Modal */}
        {showInvite && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowInvite(false)} />
            <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Invite Team Member
              </h2>
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-white"
                    placeholder="colleague@yourfirm.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="member">Member — Can view and complete deadlines</option>
                    <option value="admin">Admin — Can manage clients and team</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowInvite(false)}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                  >
                    Send Invite
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Roles Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
          <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Role Permissions</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-1 ${getRoleBadge('owner')}`}>
                Owner
              </span>
              <p className="text-blue-800 dark:text-blue-300">Full access, billing, delete firm</p>
            </div>
            <div>
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-1 ${getRoleBadge('admin')}`}>
                Admin
              </span>
              <p className="text-blue-800 dark:text-blue-300">Manage clients, team, and settings</p>
            </div>
            <div>
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-1 ${getRoleBadge('member')}`}>
                Member
              </span>
              <p className="text-blue-800 dark:text-blue-300">View and complete assigned deadlines</p>
            </div>
          </div>
        </div>

        {/* Team List */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {members.map(member => (
              <div key={member.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                {/* Avatar */}
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900 dark:text-white">{member.name}</p>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRoleBadge(member.role)}`}>
                      {member.role}
                    </span>
                    {member.status === 'pending' && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                        Pending
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {member.email}
                  </p>
                </div>

                {/* Stats */}
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {member.assignedClients}
                  </p>
                  <p className="text-xs text-slate-500">clients</p>
                </div>

                {/* Actions */}
                {member.role !== 'owner' && (
                  <div className="relative group">
                    <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 hidden group-hover:block">
                      <button className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                        <Edit className="h-4 w-4" /> Edit Role
                      </button>
                      <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                        <Trash2 className="h-4 w-4" /> Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Upgrade Banner */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg mb-1">Need more seats?</h3>
              <p className="text-blue-100">
                Upgrade to Firm plan for unlimited team members
              </p>
            </div>
            <Link
              href="/settings"
              className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition"
            >
              Upgrade Plan
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
