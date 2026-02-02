import Link from 'next/link'
import { Calendar, Bell, Users, CheckCircle, ArrowRight, Shield, Activity } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <Calendar className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-slate-900">DeadlineTracker</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-slate-600 hover:text-slate-900 font-medium">
                Log in
              </Link>
              <Link 
                href="/signup" 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-slate-900 mb-6">
            Never Miss a Tax Deadline Again
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            The only deadline tracker built for CPAs and accountants.
            Auto-updated. Client-organized. Actually affordable.
          </p>
          <div className="flex justify-center gap-4 mb-8">
            <Link 
              href="/signup" 
              className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              Start Free Trial <ArrowRight className="h-5 w-5" />
            </Link>
            <Link 
              href="#features" 
              className="border border-slate-300 text-slate-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-slate-50 transition"
            >
              See How It Works
            </Link>
          </div>
          <p className="text-slate-500 text-sm">
            ✓ No credit card required &nbsp;&nbsp; ✓ 5 clients free forever
          </p>
        </div>
      </section>

      {/* Problem Section */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8 text-center">Tax Season Shouldn&apos;t Feel Like This</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl mb-4">😰</div>
              <p className="text-slate-300">Missed a state deadline? That&apos;s a penalty (and an angry client).</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <p className="text-slate-300">Still tracking deadlines in spreadsheets you&apos;re terrified of losing?</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">⏰</div>
              <p className="text-slate-300">Average CPA spends 6+ hours/week just tracking deadlines.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">Everything You Need. Nothing You Don&apos;t.</h2>
          <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">
            DeadlineTracker automatically knows every federal, state, and local tax deadline for every client type.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Dashboard</h3>
              <p className="text-slate-600">
                See what&apos;s due today, this week, this month. Filter by client, state, or tax type.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Bell className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Multi-Channel Alerts</h3>
              <p className="text-slate-600">
                Email, SMS, or both. Escalating alerts as dates approach. Never caught off guard.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Client Profiles</h3>
              <p className="text-slate-600">
                Add a client once. We auto-generate their entire compliance calendar based on entity and states.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Quick Actions</h3>
              <p className="text-slate-600">
                Mark complete, request extension, snooze alerts. One-click links to IRS and state portals.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Auto-Updates</h3>
              <p className="text-slate-600">
                IRS moves a deadline? We update it automatically. New state requirement? Already in your calendar.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Calendar Sync</h3>
              <p className="text-slate-600">
                Google Calendar, Outlook, iCal integration. See deadlines wherever you work.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <Activity className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Compliance Intelligence</h3>
              <p className="text-slate-600">
                Track regulatory changes, benchmark against peers, and optimize costs with AI-powered insights.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">Simple Pricing. No Surprises.</h2>
          <p className="text-slate-600 text-center mb-12">Start free, upgrade when you need to.</p>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Solo */}
            <div className="bg-white rounded-xl border border-slate-200 p-8">
              <h3 className="text-xl font-semibold mb-2">Solo</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold">$29</span>
                <span className="text-slate-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="h-5 w-5 text-green-500" /> 1 user
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="h-5 w-5 text-green-500" /> 25 clients
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="h-5 w-5 text-green-500" /> All deadlines
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="h-5 w-5 text-green-500" /> Email alerts
                </li>
              </ul>
              <Link 
                href="/signup?plan=solo" 
                className="block text-center bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Team */}
            <div className="bg-white rounded-xl border-2 border-blue-500 p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-sm font-medium px-3 py-1 rounded-full">
                Most Popular
              </div>
              <h3 className="text-xl font-semibold mb-2">Team</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold">$79</span>
                <span className="text-slate-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="h-5 w-5 text-green-500" /> Up to 5 users
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="h-5 w-5 text-green-500" /> 100 clients
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="h-5 w-5 text-green-500" /> All deadlines
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="h-5 w-5 text-green-500" /> Email + SMS alerts
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="h-5 w-5 text-green-500" /> Team assignments
                </li>
              </ul>
              <Link 
                href="/signup?plan=team" 
                className="block text-center bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Firm */}
            <div className="bg-white rounded-xl border border-slate-200 p-8">
              <h3 className="text-xl font-semibold mb-2">Firm</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold">$149</span>
                <span className="text-slate-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="h-5 w-5 text-green-500" /> Unlimited users
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="h-5 w-5 text-green-500" /> Unlimited clients
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="h-5 w-5 text-green-500" /> All deadlines
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="h-5 w-5 text-green-500" /> Email + SMS alerts
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="h-5 w-5 text-green-500" /> API access
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="h-5 w-5 text-green-500" /> White-label option
                </li>
              </ul>
              <Link 
                href="/signup?plan=firm" 
                className="block text-center bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition"
              >
                Contact Sales
              </Link>
            </div>
          </div>

          <p className="text-center text-slate-500 mt-8 text-sm">
            All plans include: 14-day free trial • No credit card required • Cancel anytime
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Stop Chasing Deadlines?</h2>
          <p className="text-slate-600 mb-8">Join 500+ firms who&apos;ve reclaimed their sanity.</p>
          <Link 
            href="/signup" 
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition"
          >
            Start Your Free Trial <ArrowRight className="h-5 w-5" />
          </Link>
          <p className="text-slate-500 mt-4 text-sm">
            ✓ 5 clients free forever &nbsp;&nbsp; ✓ No credit card required &nbsp;&nbsp; ✓ Setup in under 5 minutes
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-blue-400" />
              <span className="text-white font-semibold">DeadlineTracker</span>
            </div>
            <p className="text-sm">© 2026 DeadlineTracker, Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
