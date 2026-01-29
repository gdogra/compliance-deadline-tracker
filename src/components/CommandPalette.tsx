'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Search, Calendar, Users, Settings, BarChart3, FileText, 
  Activity, Plus, Home, Moon, Sun, X
} from 'lucide-react'

interface Command {
  id: string
  label: string
  icon: React.ReactNode
  action: () => void
  shortcut?: string
  category: 'navigation' | 'action' | 'settings'
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const commands: Command[] = [
    // Navigation
    { id: 'dashboard', label: 'Go to Dashboard', icon: <Home className="h-4 w-4" />, action: () => router.push('/dashboard'), shortcut: 'G D', category: 'navigation' },
    { id: 'calendar', label: 'Go to Calendar', icon: <Calendar className="h-4 w-4" />, action: () => router.push('/calendar'), shortcut: 'G C', category: 'navigation' },
    { id: 'clients', label: 'Go to Clients', icon: <Users className="h-4 w-4" />, action: () => router.push('/clients'), shortcut: 'G L', category: 'navigation' },
    { id: 'analytics', label: 'Go to Analytics', icon: <BarChart3 className="h-4 w-4" />, action: () => router.push('/analytics'), shortcut: 'G A', category: 'navigation' },
    { id: 'reports', label: 'Go to Reports', icon: <FileText className="h-4 w-4" />, action: () => router.push('/reports'), shortcut: 'G R', category: 'navigation' },
    { id: 'activity', label: 'Go to Activity', icon: <Activity className="h-4 w-4" />, action: () => router.push('/activity'), category: 'navigation' },
    { id: 'settings', label: 'Go to Settings', icon: <Settings className="h-4 w-4" />, action: () => router.push('/settings'), shortcut: 'G S', category: 'navigation' },
    
    // Actions
    { id: 'new-client', label: 'Add New Client', icon: <Plus className="h-4 w-4" />, action: () => router.push('/clients/new'), shortcut: 'N C', category: 'action' },
    { id: 'new-deadline', label: 'Add Custom Deadline', icon: <Plus className="h-4 w-4" />, action: () => router.push('/deadlines/new'), shortcut: 'N D', category: 'action' },
    { id: 'import', label: 'Import Clients', icon: <Plus className="h-4 w-4" />, action: () => router.push('/clients/import'), category: 'action' },
    { id: 'team', label: 'Manage Team', icon: <Users className="h-4 w-4" />, action: () => router.push('/team'), category: 'action' },
    
    // Settings
    { id: 'dark-mode', label: 'Toggle Dark Mode', icon: <Moon className="h-4 w-4" />, action: () => {
      document.documentElement.classList.toggle('dark')
      localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light')
    }, shortcut: 'T D', category: 'settings' },
  ]

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Cmd+K or Ctrl+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
        setQuery('')
        setSelectedIndex(0)
      }

      // Escape to close
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }

      // Navigate with arrows
      if (open && e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1))
      }
      if (open && e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
      }

      // Enter to execute
      if (open && e.key === 'Enter' && filteredCommands[selectedIndex]) {
        e.preventDefault()
        filteredCommands[selectedIndex].action()
        setOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, filteredCommands, selectedIndex])

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 border-b border-slate-200 dark:border-slate-700">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 py-4 bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-700 rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              No commands found
            </div>
          ) : (
            <>
              {['navigation', 'action', 'settings'].map(category => {
                const categoryCommands = filteredCommands.filter(c => c.category === category)
                if (categoryCommands.length === 0) return null

                return (
                  <div key={category} className="mb-2">
                    <div className="px-2 py-1 text-xs font-semibold text-slate-400 uppercase">
                      {category}
                    </div>
                    {categoryCommands.map((cmd, idx) => {
                      const globalIdx = filteredCommands.indexOf(cmd)
                      return (
                        <button
                          key={cmd.id}
                          onClick={() => {
                            cmd.action()
                            setOpen(false)
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition ${
                            globalIdx === selectedIndex
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          {cmd.icon}
                          <span className="flex-1">{cmd.label}</span>
                          {cmd.shortcut && (
                            <kbd className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                              {cmd.shortcut}
                            </kbd>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-400 flex items-center gap-4">
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>ESC Close</span>
        </div>
      </div>
    </div>
  )
}
