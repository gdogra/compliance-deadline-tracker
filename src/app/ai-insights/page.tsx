'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ClientDeadline, Client } from '@/types/database'
import { format, parseISO, addDays } from 'date-fns'
import { 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  BarChart3, 
  MessageCircle, 
  Eye, 
  Brain,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Search
} from 'lucide-react'
import Link from 'next/link'

type DeadlineWithClient = ClientDeadline & {
  clients: Client
}

type RiskScore = {
  deadline_id: string
  client_name: string
  deadline_name: string
  due_date: string
  tax_type: string
  jurisdiction: string
  risk_score: number
  risk_level: 'high' | 'medium' | 'low'
  recommendations: string[]
}

type Anomaly = {
  id: string
  type: string
  client_id: string
  client_name: string
  description: string
  details: any
  priority: 'high' | 'medium' | 'low'
  category: string
  recommended_action: string
}

export default function AIInsightsPage() {
  const [loading, setLoading] = useState(true)
  const [predictiveRiskScores, setPredictiveRiskScores] = useState<RiskScore[]>([])
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [chatMessages, setChatMessages] = useState<{id: string, message: string, sender: 'user' | 'ai', timestamp: string}[]>([])
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [riskSummary, setRiskSummary] = useState({ high_risk_count: 0, medium_risk_count: 0, total_deadlines: 0 })
  const [anomalySummary, setAnomalySummary] = useState({ total_anomalies: 0, high_priority_count: 0, medium_priority_count: 0, low_priority_count: 0 })

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    
    try {
      // Fetch predictive risk scores
      const riskResponse = await fetch('/api/ai/predictive-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const riskData = await riskResponse.json()
      if (riskData.success) {
        setPredictiveRiskScores(riskData.risk_scores.slice(0, 5)) // Top 5 risks
        setRiskSummary(riskData.summary)
      }
      
      // Fetch anomalies
      const anomalyResponse = await fetch('/api/ai/anomaly-detection', {
        method: 'GET',
      })
      const anomalyData = await anomalyResponse.json()
      if (anomalyData.success) {
        setAnomalies(anomalyData.anomalies.slice(0, 5)) // Top 5 anomalies
        setAnomalySummary(anomalyData.summary)
      }
    } catch (error) {
      console.error('Error fetching AI insights:', error)
    }
    
    setLoading(false)
  }

  const handleSendMessage = async () => {
    if (!currentQuestion.trim()) return
    
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      message: currentQuestion,
      sender: 'user' as const,
      timestamp: new Date().toISOString()
    }
    
    setChatMessages(prev => [...prev, userMessage])
    setChatLoading(true)
    setCurrentQuestion('')
    
    try {
      // Send to AI assistant
      const response = await fetch('/api/ai/conversational-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentQuestion })
      })
      
      const data = await response.json()
      
      // Add AI response
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        message: data.response.content.join(' '),
        sender: 'ai' as const,
        timestamp: new Date().toISOString()
      }
      
      setChatMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Error getting AI response:', error)
      
      // Add error message
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        message: "Sorry, I couldn't process your request right now. Please try again.",
        sender: 'ai' as const,
        timestamp: new Date().toISOString()
      }
      
      setChatMessages(prev => [...prev, errorMessage])
    }
    
    setChatLoading(false)
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-slate-600 bg-slate-50 border-slate-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-slate-600 bg-slate-50 border-slate-200'
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <Brain className="h-8 w-8 text-purple-600" />
              <span className="text-xl font-bold text-slate-900">DeadlineTracker AI</span>
            </div>
            <nav className="flex items-center gap-6">
              <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">Dashboard</Link>
              <Link href="/analytics" className="text-slate-600 hover:text-slate-900">Analytics</Link>
              <Link href="/compliance-intelligence" className="text-slate-600 hover:text-slate-900">Compliance Intelligence</Link>
              <Link href="/ai-insights" className="text-blue-600 font-medium">AI Insights</Link>
              <Link href="/clients" className="text-slate-600 hover:text-slate-900">Clients</Link>
              <Link href="/settings" className="text-slate-600 hover:text-slate-900">Settings</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">AI-Powered Compliance Insights</h1>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Brain className="h-4 w-4" />
            Intelligent analysis for smarter compliance
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-slate-500">Analyzing your compliance data with AI...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* AI Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-500 text-sm">High-Risk Deadlines</span>
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <p className="text-2xl font-bold text-red-600">{riskSummary.high_risk_count}</p>
                <p className="text-xs text-slate-500 mt-1">Require immediate attention</p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-500 text-sm">Medium-Risk Deadlines</span>
                  <TrendingUp className="h-5 w-5 text-yellow-500" />
                </div>
                <p className="text-2xl font-bold text-yellow-600">{riskSummary.medium_risk_count}</p>
                <p className="text-xs text-slate-500 mt-1">Monitor closely</p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-500 text-sm">Detected Anomalies</span>
                  <Eye className="h-5 w-5 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{anomalySummary.total_anomalies}</p>
                <p className="text-xs text-slate-500 mt-1">Potential issues identified</p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-500 text-sm">AI Interactions</span>
                  <MessageCircle className="h-5 w-5 text-purple-500" />
                </div>
                <p className="text-2xl font-bold text-slate-900">Live</p>
                <p className="text-xs text-slate-500 mt-1">Ask compliance questions</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Predictive Risk Analysis */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <h3 className="font-semibold text-slate-900">Predictive Risk Scores</h3>
                </div>
                
                <div className="space-y-4">
                  {predictiveRiskScores.length > 0 ? (
                    predictiveRiskScores.map((risk) => (
                      <div key={risk.deadline_id} className="p-4 rounded-lg border-l-4 bg-slate-50 border-l-blue-500">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-slate-900">{risk.client_name} - {risk.deadline_name}</h4>
                            <p className="text-sm text-slate-600 mt-1">
                              Due: {format(parseISO(risk.due_date), 'MMM d, yyyy')} • {risk.jurisdiction} • {risk.tax_type}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(risk.risk_level)}`}>
                            {risk.risk_level} risk ({risk.risk_score})
                          </span>
                        </div>
                        
                        <div className="mt-3">
                          <p className="text-sm font-medium text-slate-700">Recommendations:</p>
                          <ul className="mt-1 space-y-1">
                            {risk.recommendations.slice(0, 2).map((rec, idx) => (
                              <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                                <span className="mt-0.5">•</span> {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <AlertTriangle className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                      <p>No high-risk deadlines detected</p>
                    </div>
                  )}
                </div>
                
                <Link href="#" className="mt-4 w-full py-2 text-center text-blue-600 font-medium text-sm hover:bg-slate-50 rounded-lg transition block">
                  View Full Risk Report
                </Link>
              </div>

              {/* Anomaly Detection */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold text-slate-900">Anomaly Detection</h3>
                </div>
                
                <div className="space-y-4">
                  {anomalies.length > 0 ? (
                    anomalies.map((anomaly) => (
                      <div key={anomaly.id} className="p-4 rounded-lg border-l-4 bg-slate-50 border-l-orange-500">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-slate-900">{anomaly.client_name}</h4>
                            <p className="text-sm text-slate-600 mt-1">{anomaly.description}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(anomaly.priority)}`}>
                            {anomaly.priority} priority
                          </span>
                        </div>
                        
                        <div className="mt-3">
                          <p className="text-sm font-medium text-slate-700">Recommended Action:</p>
                          <p className="text-sm text-slate-600 mt-1">{anomaly.recommended_action}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <Eye className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                      <p>No anomalies detected</p>
                    </div>
                  )}
                </div>
                
                <Link href="#" className="mt-4 w-full py-2 text-center text-blue-600 font-medium text-sm hover:bg-slate-50 rounded-lg transition block">
                  View All Anomalies
                </Link>
              </div>

              {/* Conversational Assistant */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 lg:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <MessageCircle className="h-5 w-5 text-purple-500" />
                  <h3 className="font-semibold text-slate-900">Conversational Compliance Assistant</h3>
                </div>
                
                <div className="border border-slate-200 rounded-lg h-80 flex flex-col">
                  <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {chatMessages.length > 0 ? (
                      chatMessages.map((msg) => (
                        <div 
                          key={msg.id} 
                          className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div 
                            className={`max-w-[80%] rounded-lg p-3 ${
                              msg.sender === 'user' 
                                ? 'bg-blue-500 text-white rounded-br-none' 
                                : 'bg-slate-100 text-slate-800 rounded-bl-none'
                            }`}
                          >
                            <p>{msg.message}</p>
                            <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-blue-100' : 'text-slate-500'}`}>
                              {format(parseISO(msg.timestamp), 'h:mm a')}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-500">
                        <MessageCircle className="h-10 w-10 mb-3 text-slate-300" />
                        <p className="text-center">Ask me about deadlines, penalties, extensions, or compliance requirements</p>
                        <p className="text-sm mt-1 text-center">Example: "What happens if I miss the March 15th deadline for my S-Corp?"</p>
                      </div>
                    )}
                    
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-slate-100 text-slate-800 rounded-lg rounded-bl-none p-3">
                          <div className="flex space-x-2">
                            <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"></div>
                            <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="border-t border-slate-200 p-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentQuestion}
                        onChange={(e) => setCurrentQuestion(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Ask a compliance question..."
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        disabled={chatLoading}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={chatLoading || !currentQuestion.trim()}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional AI Features */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Additional AI-Powered Features</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border border-slate-200 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                    <FileText className="h-5 w-5 text-green-600" />
                  </div>
                  <h4 className="font-medium text-slate-900 mb-1">Intelligent Document Processing</h4>
                  <p className="text-sm text-slate-600">Upload documents to automatically extract relevant compliance information</p>
                  <button className="mt-3 text-sm text-green-600 font-medium hover:underline">
                    Process Documents
                  </button>
                </div>
                
                <div className="p-4 border border-slate-200 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <h4 className="font-medium text-slate-900 mb-1">Smart Deadline Recommendations</h4>
                  <p className="text-sm text-slate-600">Get personalized recommendations based on client profile and circumstances</p>
                  <button className="mt-3 text-sm text-blue-600 font-medium hover:underline">
                    Get Recommendations
                  </button>
                </div>
                
                <div className="p-4 border border-slate-200 rounded-lg">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                  </div>
                  <h4 className="font-medium text-slate-900 mb-1">Predictive Analytics</h4>
                  <p className="text-sm text-slate-600">Forecast compliance needs and resource requirements</p>
                  <button className="mt-3 text-sm text-purple-600 font-medium hover:underline">
                    View Analytics
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}