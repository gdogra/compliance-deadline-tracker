'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ClientDeadline, User } from '@/types/database'
import { format, parseISO, subYears } from 'date-fns'
import { 
  TrendingUp, 
  BarChart3, 
  Users, 
  DollarSign, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Activity,
  Target,
  Award,
  Brain
} from 'lucide-react'
import Link from 'next/link'

export default function ComplianceIntelligencePage() {
  const [deadlines, setDeadlines] = useState<ClientDeadline[]>([])
  const [loading, setLoading] = useState(true)
  const [regulatoryChanges, setRegulatoryChanges] = useState<any[]>([])
  const [benchmarkData, setBenchmarkData] = useState<any>({})
  const [costData, setCostData] = useState<any>({})

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)

    // Fetch deadlines
    const { data: userData } = await supabase.auth.getUser()

    if (!userData?.user?.id) {
      console.error('No user ID found')
      setLoading(false)
      return
    }

    // Fetch client deadlines
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: deadlinesData } = await (supabase.from('client_deadlines') as any)
      .select('*')
      .eq('firm_id', userData.user.firm_id)
      .order('due_date', { ascending: true })

    setDeadlines(deadlinesData || [])

    // Mock regulatory changes data (in a real app, this would come from an API)
    const mockRegulatoryChanges = [
      {
        id: 1,
        title: 'New State Tax Filing Requirements',
        description: 'California has introduced new filing thresholds for S-Corp entities',
        date: '2024-11-15',
        impact: 'medium',
        affectedDeadlines: ['100', '101'],
        actionRequired: 'Review client filings for 2024 tax year'
      },
      {
        id: 2,
        title: 'Federal Tax Deadline Extension',
        description: 'IRS extends Q1 estimated tax payments to April 18, 2024',
        date: '2024-11-10',
        impact: 'high',
        affectedDeadlines: ['200', '201', '202'],
        actionRequired: 'Update calendar and notify clients'
      },
      {
        id: 3,
        title: 'Updated Penalties for Late Filing',
        description: 'New penalty rates effective for late corporate tax returns',
        date: '2024-10-20',
        impact: 'low',
        affectedDeadlines: ['300', '301'],
        actionRequired: 'Update penalty calculations in system'
      }
    ]

    // Mock benchmark data
    const mockBenchmarkData = {
      completionRate: 87,
      industryAvg: 78,
      percentile: 75,
      categories: {
        'Federal': { yourRate: 92, avgRate: 85 },
        'State': { yourRate: 83, avgRate: 76 },
        'Payroll': { yourRate: 95, avgRate: 88 }
      }
    }

    // Mock cost data
    const mockCostData = {
      totalComplianceCost: 45000,
      costPerClient: 1200,
      roi: 3.2,
      savingsOpportunities: 8500,
      breakdown: {
        'Manual Processing': 18000,
        'Penalties': 12000,
        'Software Tools': 5000,
        'Consulting': 10000
      }
    }

    setRegulatoryChanges(mockRegulatoryChanges)
    setBenchmarkData(mockBenchmarkData)
    setCostData(mockCostData)
    setLoading(false)
  }

  // Calculate basic stats
  const totalDeadlines = deadlines.length
  const completedDeadlines = deadlines.filter(d => d.status === 'completed').length
  const missedDeadlines = deadlines.filter(d => d.status === 'missed').length
  const pendingDeadlines = deadlines.filter(d => d.status === 'pending' || d.status === 'in_progress').length

  const completionRate = totalDeadlines > 0 ? Math.round((completedDeadlines / totalDeadlines) * 100) : 0

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <Activity className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-slate-900">DeadlineTracker</span>
            </div>
            <nav className="flex items-center gap-6">
              <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">Dashboard</Link>
              <Link href="/calendar" className="text-slate-600 hover:text-slate-900">Calendar</Link>
              <Link href="/analytics" className="text-slate-600 hover:text-slate-900">Analytics</Link>
              <Link href="/compliance-intelligence" className="text-blue-600 font-medium">Compliance Intelligence</Link>
              <Link href="/ai-insights" className="text-slate-600 hover:text-slate-900">AI Insights</Link>
              <Link href="/clients" className="text-slate-600 hover:text-slate-900">Clients</Link>
              <Link href="/settings" className="text-slate-600 hover:text-slate-900">Settings</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Compliance Intelligence</h1>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Activity className="h-4 w-4" />
            Real-time insights for smarter compliance management
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-500 text-sm">Current Completion</span>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{completionRate}%</p>
                <p className="text-xs text-slate-500 mt-1">vs industry avg 78%</p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-500 text-sm">Regulatory Changes</span>
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{regulatoryChanges.length}</p>
                <p className="text-xs text-slate-500 mt-1">this quarter</p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-500 text-sm">ROI Potential</span>
                  <DollarSign className="h-5 w-5 text-purple-500" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{costData.roi}x</p>
                <p className="text-xs text-slate-500 mt-1">current investment</p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-500 text-sm">Savings Opportunity</span>
                  <Award className="h-5 w-5 text-yellow-500" />
                </div>
                <p className="text-2xl font-bold text-slate-900">${(costData.savingsOpportunities / 1000).toFixed(1)}k</p>
                <p className="text-xs text-slate-500 mt-1">annually</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Regulatory Change Monitoring */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold text-slate-900">Regulatory Change Monitoring</h3>
                </div>
                
                <div className="space-y-4">
                  {regulatoryChanges.map(change => (
                    <div key={change.id} className={`p-4 rounded-lg border-l-4 ${
                      change.impact === 'high' ? 'border-red-500 bg-red-50' :
                      change.impact === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                      'border-blue-500 bg-blue-50'
                    }`}>
                      <div className="flex justify-between">
                        <h4 className="font-medium text-slate-900">{change.title}</h4>
                        <span className="text-xs text-slate-500">{format(parseISO(change.date), 'MMM dd, yyyy')}</span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{change.description}</p>
                      <div className="mt-2 flex items-center gap-4 text-xs">
                        <span className={`px-2 py-1 rounded ${
                          change.impact === 'high' ? 'bg-red-100 text-red-800' :
                          change.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {change.impact} impact
                        </span>
                        <span className="text-slate-500">{change.actionRequired}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button className="mt-4 w-full py-2 text-center text-blue-600 font-medium text-sm hover:bg-slate-50 rounded-lg transition">
                  View All Regulatory Updates
                </button>
              </div>

              {/* Benchmark Against Industry Peers */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="h-5 w-5 text-green-500" />
                  <h3 className="font-semibold text-slate-900">Industry Benchmarking</h3>
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">Your Performance</span>
                    <span className="text-sm font-bold text-slate-900">{benchmarkData.completionRate}%</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-slate-500">Industry Average</span>
                    <span className="text-sm text-slate-500">{benchmarkData.industryAvg}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${benchmarkData.completionRate}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="text-center mb-4">
                  <p className="text-sm text-slate-600">
                    You're performing better than <span className="font-semibold text-green-600">{benchmarkData.percentile}%</span> of firms
                  </p>
                </div>
                
                <div className="space-y-3">
                  {Object.entries(benchmarkData.categories).map(([category, data]: [any, any]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm text-slate-700">{category}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${data.yourRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-10">{data.yourRate}%</span>
                        <span className="text-sm text-slate-500">vs {data.avgRate}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cost Optimization Analytics */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 lg:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="h-5 w-5 text-purple-500" />
                  <h3 className="font-semibold text-slate-900">Cost Optimization Analytics</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-slate-900 mb-3">Compliance Cost Breakdown</h4>
                    <div className="space-y-3">
                      {Object.entries(costData.breakdown).map(([category, amount]: [any, any]) => (
                        <div key={category} className="flex items-center justify-between">
                          <span className="text-sm text-slate-700">{category}</span>
                          <div className="flex items-center gap-3">
                            <div className="w-32 bg-slate-200 rounded-full h-2">
                              <div 
                                className="bg-purple-500 h-2 rounded-full" 
                                style={{ width: `${(amount / costData.totalComplianceCost) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">${(amount / 1000).toFixed(1)}k</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        <span className="font-medium">Savings Opportunity:</span> ${costData.savingsOpportunities.toLocaleString()} annually
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        Through automation and process improvements
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-slate-900 mb-3">ROI Analysis</h4>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="flex justify-between items-end mb-4">
                        <div>
                          <p className="text-sm text-slate-600">Current Investment</p>
                          <p className="text-xl font-bold text-slate-900">${(costData.totalComplianceCost / 1000).toFixed(1)}k</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-600">Annual Savings</p>
                          <p className="text-xl font-bold text-green-600">+${(costData.savingsOpportunities / 1000).toFixed(1)}k</p>
                        </div>
                      </div>
                      
                      <div className="text-center py-4">
                        <div className="text-3xl font-bold text-purple-600 mb-1">{costData.roi}x</div>
                        <p className="text-sm text-slate-600">Return on investment</p>
                      </div>
                      
                      <div className="mt-4">
                        <p className="text-xs text-slate-500 mb-2">Cost per client: ${costData.costPerClient}</p>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-purple-500 h-2 rounded-full" 
                            style={{ width: '65%' }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Items */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Recommended Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">Review State Filings</h4>
                      <p className="text-sm text-slate-600 mt-1">New California requirements affect 3 clients</p>
                      <button className="mt-2 text-sm text-blue-600 font-medium hover:underline">
                        Review Details
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">Optimize Process</h4>
                      <p className="text-sm text-slate-600 mt-1">Automate manual processing to save $8k annually</p>
                      <button className="mt-2 text-sm text-yellow-600 font-medium hover:underline">
                        Explore Options
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">Update Calendars</h4>
                      <p className="text-sm text-slate-600 mt-1">Q1 extended deadline affects 5 upcoming filings</p>
                      <button className="mt-2 text-sm text-green-600 font-medium hover:underline">
                        Apply Updates
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}