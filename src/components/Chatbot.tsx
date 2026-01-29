'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageCircle, X, Send, Bot, User, Sparkles, Calendar, CheckCircle, Search } from 'lucide-react'
import { format, isToday, isTomorrow, isThisWeek, isPast, addDays } from 'date-fns'
import Link from 'next/link'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  actions?: ChatAction[]
}

interface ChatAction {
  type: 'link' | 'complete' | 'view'
  label: string
  href?: string
  deadlineId?: string
  clientId?: string
}

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your DeadlineTracker assistant. I can help you find deadlines, answer tax questions, or navigate the app. Try asking:\n\n• \"What's due this week?\"\n• \"Show me overdue deadlines\"\n• \"When is the 1040 deadline?\"\n• \"Add a new client\"",
      timestamp: new Date()
    }
  ])
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    // Process the message
    const response = await processMessage(input.trim())
    
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
      actions: response.actions
    }

    setMessages(prev => [...prev, assistantMessage])
    setLoading(false)
  }

  async function processMessage(query: string): Promise<{ content: string; actions?: ChatAction[] }> {
    const lowerQuery = query.toLowerCase()

    // Check for deadline queries
    if (lowerQuery.includes('due') || lowerQuery.includes('deadline') || lowerQuery.includes('upcoming')) {
      return await handleDeadlineQuery(lowerQuery)
    }

    // Check for overdue
    if (lowerQuery.includes('overdue') || lowerQuery.includes('missed') || lowerQuery.includes('late')) {
      return await handleOverdueQuery()
    }

    // Check for specific form questions
    if (lowerQuery.includes('1040') || lowerQuery.includes('1120') || lowerQuery.includes('1065') || lowerQuery.includes('941')) {
      return await handleFormQuery(lowerQuery)
    }

    // Check for client queries
    if (lowerQuery.includes('client')) {
      if (lowerQuery.includes('add') || lowerQuery.includes('new') || lowerQuery.includes('create')) {
        return {
          content: "I can help you add a new client! Click the button below to get started.",
          actions: [{ type: 'link', label: 'Add New Client', href: '/clients/new' }]
        }
      }
      return await handleClientQuery(lowerQuery)
    }

    // Navigation queries
    if (lowerQuery.includes('calendar')) {
      return {
        content: "Here's your calendar view with all deadlines displayed by date.",
        actions: [{ type: 'link', label: 'Open Calendar', href: '/calendar' }]
      }
    }

    if (lowerQuery.includes('report') || lowerQuery.includes('analytics')) {
      return {
        content: "I can show you reports and analytics for your deadlines.",
        actions: [
          { type: 'link', label: 'View Analytics', href: '/analytics' },
          { type: 'link', label: 'View Reports', href: '/reports' }
        ]
      }
    }

    if (lowerQuery.includes('setting') || lowerQuery.includes('alert') || lowerQuery.includes('notification')) {
      return {
        content: "You can manage your alert preferences and notification settings here.",
        actions: [{ type: 'link', label: 'Open Settings', href: '/settings' }]
      }
    }

    if (lowerQuery.includes('team') || lowerQuery.includes('invite') || lowerQuery.includes('member')) {
      return {
        content: "You can manage your team members and invite new colleagues here.",
        actions: [{ type: 'link', label: 'Manage Team', href: '/team' }]
      }
    }

    if (lowerQuery.includes('import') || lowerQuery.includes('csv') || lowerQuery.includes('bulk')) {
      return {
        content: "You can import multiple clients at once using a CSV file.",
        actions: [{ type: 'link', label: 'Import Clients', href: '/clients/import' }]
      }
    }

    // Tax knowledge base
    if (lowerQuery.includes('extension') || lowerQuery.includes('extend')) {
      return {
        content: "**Filing Extensions:**\n\n• **Individuals (1040):** File Form 4868 by April 15 for automatic 6-month extension to October 15. Extension is for filing only - taxes owed are still due April 15.\n\n• **Businesses:** File Form 7004 for automatic extensions. S-Corps & Partnerships get 6 months (March 15 → September 15). C-Corps get 6 months (April 15 → October 15).\n\n• **Tip:** Estimate and pay 90% of tax liability to avoid penalties.",
        actions: [{ type: 'link', label: 'View Extended Deadlines', href: '/reports' }]
      }
    }

    if (lowerQuery.includes('penalty') || lowerQuery.includes('penalt')) {
      return {
        content: "**Common Tax Penalties:**\n\n• **Failure to File:** 5% per month up to 25% of unpaid tax\n• **Failure to Pay:** 0.5% per month up to 25%\n• **Estimated Tax Underpayment:** ~8% annually on shortfall\n• **Information Returns (1099s):** $60-$310 per form depending on lateness\n• **Partnership/S-Corp Late Filing:** $220/month per partner/shareholder\n\nAlways file on time, even if you can't pay in full!",
      }
    }

    if (lowerQuery.includes('estimated') || lowerQuery.includes('quarterly')) {
      return {
        content: "**Estimated Tax Deadlines (Federal):**\n\n• Q1: April 15\n• Q2: June 15\n• Q3: September 15\n• Q4: January 15 (following year)\n\n**Safe Harbor Rules:**\n• Pay 100% of prior year tax (110% if AGI > $150K), OR\n• Pay 90% of current year tax\n\nMost states follow similar schedules.",
      }
    }

    // Help / fallback
    return {
      content: "I can help you with:\n\n📅 **Deadlines:** \"What's due this week?\" or \"Show overdue\"\n👤 **Clients:** \"Show my clients\" or \"Add new client\"\n📊 **Reports:** \"Show analytics\" or \"Generate report\"\n⚙️ **Settings:** \"Change notifications\" or \"Manage team\"\n📚 **Tax Info:** \"Extension rules\" or \"Penalty info\"\n\nWhat would you like to know?",
    }
  }

  async function handleDeadlineQuery(query: string): Promise<{ content: string; actions?: ChatAction[] }> {
    let dateFilter = ''
    let dateLabel = ''

    if (query.includes('today')) {
      dateFilter = format(new Date(), 'yyyy-MM-dd')
      dateLabel = 'today'
    } else if (query.includes('tomorrow')) {
      dateFilter = format(addDays(new Date(), 1), 'yyyy-MM-dd')
      dateLabel = 'tomorrow'
    } else if (query.includes('week')) {
      dateLabel = 'this week'
    } else if (query.includes('month')) {
      dateLabel = 'this month'
    }

    const { data: deadlines } = await supabase
      .from('client_deadlines')
      .select('*, clients(name)')
      .neq('status', 'completed')
      .order('due_date', { ascending: true })
      .limit(10)

    if (!deadlines || deadlines.length === 0) {
      return { content: "Great news! You don't have any pending deadlines. 🎉" }
    }

    // Filter based on query
    let filtered = deadlines
    if (query.includes('today')) {
      filtered = deadlines.filter(d => isToday(new Date(d.due_date)))
    } else if (query.includes('tomorrow')) {
      filtered = deadlines.filter(d => isTomorrow(new Date(d.due_date)))
    } else if (query.includes('week')) {
      filtered = deadlines.filter(d => isThisWeek(new Date(d.due_date)))
    }

    if (filtered.length === 0) {
      return { content: `No deadlines ${dateLabel || 'found'}. You're all caught up! ✅` }
    }

    const content = filtered.slice(0, 5).map(d => {
      const dueDate = new Date(d.due_date)
      const status = isPast(dueDate) && !isToday(dueDate) ? '🔴' : isToday(dueDate) ? '🟠' : '🟢'
      return `${status} **${d.name}** - ${(d.clients as any)?.name || 'Unknown'}\n   Due: ${format(dueDate, 'MMM d, yyyy')} • ${d.form_number || d.jurisdiction}`
    }).join('\n\n')

    return {
      content: `**Deadlines ${dateLabel ? dateLabel : ''}:**\n\n${content}${filtered.length > 5 ? `\n\n...and ${filtered.length - 5} more` : ''}`,
      actions: [{ type: 'link', label: 'View All Deadlines', href: '/dashboard' }]
    }
  }

  async function handleOverdueQuery(): Promise<{ content: string; actions?: ChatAction[] }> {
    const { data: deadlines } = await supabase
      .from('client_deadlines')
      .select('*, clients(name)')
      .neq('status', 'completed')
      .lt('due_date', format(new Date(), 'yyyy-MM-dd'))
      .order('due_date', { ascending: true })
      .limit(10)

    if (!deadlines || deadlines.length === 0) {
      return { content: "No overdue deadlines! You're on top of everything. 🌟" }
    }

    const content = deadlines.slice(0, 5).map(d => {
      const dueDate = new Date(d.due_date)
      return `🔴 **${d.name}** - ${(d.clients as any)?.name || 'Unknown'}\n   Was due: ${format(dueDate, 'MMM d, yyyy')} • ${d.form_number || d.jurisdiction}`
    }).join('\n\n')

    return {
      content: `**⚠️ Overdue Deadlines (${deadlines.length}):**\n\n${content}`,
      actions: [{ type: 'link', label: 'View Overdue', href: '/dashboard?filter=overdue' }]
    }
  }

  async function handleFormQuery(query: string): Promise<{ content: string; actions?: ChatAction[] }> {
    let formInfo = ''
    
    if (query.includes('1040')) {
      formInfo = "**Form 1040 - Individual Income Tax:**\n\n• **Due Date:** April 15\n• **Extended:** October 15\n• **Who Files:** Individuals, sole proprietors\n• **Extension Form:** 4868\n\n**Tip:** Extension is automatic if filed by April 15, but taxes owed must still be paid."
    } else if (query.includes('1120s') || query.includes('s-corp') || query.includes('s corp')) {
      formInfo = "**Form 1120S - S-Corporation:**\n\n• **Due Date:** March 15\n• **Extended:** September 15\n• **Who Files:** S-Corporations\n• **Extension Form:** 7004\n• **Penalty:** $220/month per shareholder (2024)\n\n**Tip:** K-1s must go to shareholders by the filing deadline."
    } else if (query.includes('1120')) {
      formInfo = "**Form 1120 - C-Corporation:**\n\n• **Due Date:** April 15 (calendar year)\n• **Extended:** October 15\n• **Who Files:** C-Corporations\n• **Extension Form:** 7004\n\n**Tip:** Fiscal year corps file by the 15th of the 4th month after year-end."
    } else if (query.includes('1065')) {
      formInfo = "**Form 1065 - Partnership:**\n\n• **Due Date:** March 15\n• **Extended:** September 15\n• **Who Files:** Partnerships, multi-member LLCs\n• **Extension Form:** 7004\n• **Penalty:** $220/month per partner (2024)\n\n**Tip:** K-1s must go to partners by the filing deadline."
    } else if (query.includes('941')) {
      formInfo = "**Form 941 - Quarterly Payroll:**\n\n• **Q1 Due:** April 30\n• **Q2 Due:** July 31\n• **Q3 Due:** October 31\n• **Q4 Due:** January 31\n\n**Tip:** Deposit requirements vary based on payroll size. Use EFTPS for deposits."
    }

    return { content: formInfo }
  }

  async function handleClientQuery(query: string): Promise<{ content: string; actions?: ChatAction[] }> {
    const { data: clients } = await supabase
      .from('clients')
      .select('id, name, entity_type, states')
      .eq('is_active', true)
      .order('name')
      .limit(10)

    if (!clients || clients.length === 0) {
      return {
        content: "You don't have any clients yet. Let's add your first one!",
        actions: [{ type: 'link', label: 'Add Client', href: '/clients/new' }]
      }
    }

    const content = clients.map(c => 
      `• **${c.name}** (${c.entity_type}) - ${c.states?.join(', ') || 'No states'}`
    ).join('\n')

    return {
      content: `**Your Clients (${clients.length}):**\n\n${content}`,
      actions: [
        { type: 'link', label: 'View All Clients', href: '/clients' },
        { type: 'link', label: 'Add New Client', href: '/clients/new' }
      ]
    }
  }

  async function handleAction(action: ChatAction) {
    if (action.type === 'complete' && action.deadlineId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('client_deadlines') as any)
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', action.deadlineId)
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: '✅ Deadline marked as complete!',
        timestamp: new Date()
      }])
    }
  }

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all z-50 ${open ? 'scale-0' : 'scale-100'}`}
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Chat Window */}
      <div className={`fixed bottom-6 right-6 w-96 h-[32rem] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden z-50 transition-all ${open ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}`}>
        {/* Header */}
        <div className="px-4 py-3 bg-blue-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-sm">DeadlineTracker AI</p>
              <p className="text-xs text-blue-100">Ask me anything</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/20 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(message => (
            <div key={message.id} className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'assistant' && (
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-blue-600" />
                </div>
              )}
              <div className={`max-w-[80%] ${message.role === 'user' ? 'order-first' : ''}`}>
                <div className={`px-3 py-2 rounded-2xl text-sm ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-md'
                }`}>
                  <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ 
                    __html: message.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\n/g, '<br>')
                  }} />
                </div>
                {message.actions && message.actions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {message.actions.map((action, idx) => (
                      action.type === 'link' ? (
                        <Link
                          key={idx}
                          href={action.href || '#'}
                          onClick={() => setOpen(false)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
                        >
                          {action.label}
                        </Link>
                      ) : (
                        <button
                          key={idx}
                          onClick={() => handleAction(action)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-xs font-medium hover:bg-green-200 dark:hover:bg-green-900/50 transition"
                        >
                          <CheckCircle className="h-3 w-3" />
                          {action.label}
                        </button>
                      )
                    ))}
                  </div>
                )}
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-2">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Bot className="h-4 w-4 text-blue-600" />
              </div>
              <div className="bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-2xl rounded-bl-md">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700 flex gap-2 overflow-x-auto">
          {['Due this week', 'Overdue', 'Add client'].map(quick => (
            <button
              key={quick}
              onClick={() => {
                setInput(quick)
                handleSubmit({ preventDefault: () => {} } as React.FormEvent)
              }}
              className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs whitespace-nowrap hover:bg-slate-200 dark:hover:bg-slate-600 transition"
            >
              {quick}
            </button>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-slate-200 dark:border-slate-700">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about deadlines, clients..."
              className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
