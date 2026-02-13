import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LayoutGrid,
  Shield,
  Users,
  Building2,
  BarChart3,
  GitCompare,
  Sparkles,
  RefreshCw,
  Settings,
  Target,
  Brain,
  Download,
  Layers,
  Key,
  BookOpen,
  ArrowRight,
  Database,
  Globe,
  AlertTriangle,
  Smartphone,
} from 'lucide-react';
import Link from 'next/link';

const sections = [
  {
    icon: LayoutGrid,
    title: 'Dashboard',
    href: '/dashboard',
    color: 'bg-slate-100 text-slate-700',
    description: 'Your home base. See an at-a-glance view of all tracked providers, total plans in the database, quick actions, and an AI-generated market summary (requires LLM key).',
    details: [
      'Quick stats: provider count, plan count, and price-change tracking',
      'One-click navigation to every major feature',
      'AI Market Summary generates a short narrative about the current competitive landscape',
      'Provider overview cards with plan counts and direct links',
    ],
  },
  {
    icon: Shield,
    title: 'Strategic Intelligence',
    href: '/strategy',
    color: 'bg-purple-100 text-purple-700',
    description: 'The C-Suite command center. Generate executive briefings, competitive intelligence reports, and browse your full library of stored AI insights.',
    details: [
      'Executive Briefing: board-ready strategic summary with key findings, segment opportunities, recommendations, and risk factors',
      'Competitive Intel: positioning analysis vs. every competitor, threat assessment, and win/loss drivers',
      'Insights Library: every AI analysis you have ever generated is stored persistently and searchable',
      'Export: select any insights and download as PDF or PowerPoint for executive presentations',
      'Requires "My Company" to be set in Settings for provider-centric framing',
    ],
  },
  {
    icon: Users,
    title: 'Segment Analysis',
    href: '/segments',
    color: 'bg-blue-100 text-blue-700',
    description: 'Understand how different small-business segments evaluate and purchase telecom services. Includes 32 pre-built segments across 4 employee tiers and 8 industries.',
    details: [
      'Filter by employee tier (Micro 1-4, Small 5-19, Medium 20-99, Mid-Market 100-499) and industry',
      'Each segment shows tech maturity, price sensitivity, contract aversion, and support importance',
      'Built-in Buyer Profile with pain points (severity-ranked), preferred terms, purchase channels, and switching barriers',
      'AI Segment Analysis: how this segment views available offerings, best-fit providers, pricing insights',
      'AI Buyer Behavior Deep Dive: purchase journey narrative, retention tactics, messaging recommendations, competitive vulnerabilities',
    ],
  },
  {
    icon: Layers,
    title: 'Product Portfolio',
    href: '/portfolio',
    color: 'bg-purple-100 text-purple-700',
    description: 'Deep analysis of service packages across all providers. Compare bundling strategies, pricing tiers, and package compositions with AI-powered strategic insights.',
    details: [
      'Overview tab: browse every package grouped by provider, see tier badges, included services, add-ons, pricing, and target segments',
      'Comparison Matrix tab: side-by-side table of all packages with broadband/mobile/voice inclusion indicators, speeds, and pricing',
      'Price Distribution chart visualizes how each provider prices their packages from entry to premium tier',
      'Deep Analysis tab: select any provider and generate an AI Portfolio Analysis covering tier strategy, pricing architecture, bundling effectiveness, SMB fit, and competitive gaps',
      'Cross-Provider Analysis: one-click AI comparison across all providers, showing market leaders, pricing tiers, bundling strategies, and market gaps',
      'All AI analyses are stored as persistent insights for export in Strategic Intel',
    ],
  },
  {
    icon: Building2,
    title: 'Providers',
    href: '/providers',
    color: 'bg-green-100 text-green-700',
    description: 'Browse all tracked telecom providers. Each provider page shows every plan, package, and service they offer to small businesses.',
    details: [
      'Provider list with plan counts, provider type (MSO, Telco, Wireless), and last-refreshed timestamps',
      'Provider detail pages include stats (total plans, price range, top speed), all offers by category, and recent scrape snapshots',
      'Service Packages section shows bundled offerings with included services and add-ons',
      'AI Provider Analysis generates competitive positioning, strengths, weaknesses, and target-customer profiles',
      'Special emphasis on Comcast Business with dedicated sidebar link',
    ],
  },
  {
    icon: Layers,
    title: 'Packages',
    href: '/providers',
    color: 'bg-teal-100 text-teal-700',
    description: 'Packages are bundled solutions where a provider combines multiple services (internet, voice, mobile, security) into a single offering, often at a discount.',
    details: [
      'Packages appear on each provider\'s detail page under the "Service Packages" section',
      'Each package shows its tier (Good / Better / Best), base price, included services, and available add-ons',
      'Target segments indicate which SMB segments the package is designed for',
      'Package types: TIERED (Good/Better/Best tiers), CONFIGURABLE (pick components), FIXED (set bundle)',
      'Helps C-Suite understand how competitors structure and price their bundled offerings',
    ],
  },
  {
    icon: BarChart3,
    title: 'Matrix Compare',
    href: '/compare/matrix',
    color: 'bg-amber-100 text-amber-700',
    description: 'Compare multiple providers side-by-side in a spreadsheet-style matrix. Filter by category, sort by price or speed, and export to CSV.',
    details: [
      'Select categories (Broadband, Mobile, Voice, Package) to filter the matrix',
      'Sortable columns: provider, plan name, price, promo price, download/upload speed, contract term',
      'Export the current view to CSV for offline analysis',
      'AI Market Insights: generate a market overview, best-value and best-performance picks, and buyer recommendations',
    ],
  },
  {
    icon: GitCompare,
    title: 'Head-to-Head',
    href: '/compare/head-to-head',
    color: 'bg-red-100 text-red-700',
    description: 'Pick any two providers and get a detailed side-by-side comparison with AI-powered analysis.',
    details: [
      'Select two providers and optionally filter by category',
      'Side-by-side plan listing with price, speed, and feature comparison',
      'AI-Powered Analysis generates a narrative comparison: winner, provider strengths, and specific recommendations',
      'Great for quick competitive snapshots when evaluating two specific competitors',
    ],
  },
  {
    icon: RefreshCw,
    title: 'Refresh Data',
    href: '/refresh',
    color: 'bg-cyan-100 text-cyan-700',
    description: 'Trigger on-demand data collection from provider websites. Select which providers and categories to refresh.',
    details: [
      'Select providers individually or refresh all at once',
      'Choose which categories to scrape (Broadband, Mobile, Voice, Package)',
      'Progress tracking shows real-time status of each collection job',
      'Data is stored with timestamps so you can track changes over time',
      'With an LLM API key configured, the system attempts LIVE web scraping of each provider\'s website and uses AI to extract structured data',
      'Without an LLM key (or if scraping fails), realistic SEED DATA is used as a fallback — seed data is fabricated/estimated, not sourced from providers',
      'Each provider result is tagged "Live" or "Seed" so you always know the data source',
      'See the Data Freshness section on the Dashboard for a real-time view of which providers have live vs seed data',
    ],
  },
  {
    icon: Smartphone,
    title: 'Mobile Intelligence',
    href: '/mobile',
    color: 'bg-emerald-100 text-emerald-700',
    description: 'Deep analysis of mobile plans, device deals, contract buyouts, and switching incentives across all providers.',
    details: [
      'Plans Overview: mobile plans grouped by provider with pricing, features, and top device deals',
      'Device Deals: filterable grid of device incentives by brand (Apple/Samsung/Google) and provider, showing effective cost and conditions',
      'Switching Analysis: contract buyout comparison with detailed T&Cs — coverage scope, submission deadlines, payment timelines, fine print, and plan restrictions',
      'Switching Value Calculator: shows combined value of buyout + best device deal per provider',
      'Deep Comparison: AI-powered cross-provider mobile analysis with plan tiers, device deal rankings, iPhone 17 vs 16 value, and TCO matrices',
      'Per-provider AI analysis available for individual mobile portfolio deep dives',
    ],
  },
  {
    icon: Settings,
    title: 'Settings',
    href: '/settings',
    color: 'bg-slate-100 text-slate-700',
    description: 'Configure your LLM provider and set your company for competitive framing.',
    details: [
      'LLM Provider: choose OpenAI, Anthropic, Google Gemini, or any OpenAI-compatible endpoint',
      'Model selection: GPT-5.2, GPT-4o, Claude 4.6 Opus, Claude 3.5 Sonnet, Gemini Pro, and more',
      'API Key: encrypted at rest and never logged',
      'Test Connection: validate your key works before using AI features',
      'My Company: select which provider you represent — all competitive analysis and executive summaries will be framed from that perspective',
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-slate-900">Documentation</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Everything you need to know about the SMB Services Intelligence platform.
        </p>
      </div>

      {/* What Is This Platform */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="text-xl">What is SMB Services Intelligence?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            SMB Services Intelligence is a <strong className="text-slate-900">C-Suite strategic analysis platform</strong> that
            tracks broadband, mobile, voice, security, and bundled service packages offered to small and mid-sized businesses
            (SMBs) across North America by major providers including Comcast Business, AT&T, Verizon, T-Mobile, Spectrum, Cox, and more.
          </p>
          <p>
            The platform combines <strong className="text-slate-900">structured market data</strong> with
            <strong className="text-slate-900"> AI-powered analysis</strong> (bring-your-own LLM key) to produce
            executive-ready competitive intelligence, buyer-behavior insights, and segment-specific strategic recommendations.
          </p>
          <p>Key capabilities:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Track and compare plans, pricing, and packages from 9+ providers</li>
            <li>32 pre-built SMB segments with buyer profiles and behavioral attributes</li>
            <li>AI-generated executive briefings, competitive intel, and segment analyses</li>
            <li>Head-to-head and matrix comparisons with CSV export</li>
            <li>Persistent insight storage — every AI analysis is saved for later review</li>
            <li>Export reports as PDF or PowerPoint for board presentations</li>
          </ul>
        </CardContent>
      </Card>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Key className="h-5 w-5" />
            Getting Started
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <ol className="list-decimal list-inside space-y-3 pl-2">
            <li>
              <strong className="text-slate-900">Add your LLM API key</strong> — Go to{' '}
              <Link href="/settings" className="text-primary underline">Settings</Link> and configure your
              OpenAI or Anthropic API key. This unlocks all AI analysis features.
            </li>
            <li>
              <strong className="text-slate-900">Set &quot;My Company&quot;</strong> — In Settings, select which provider you
              represent. This frames competitive intelligence from your perspective.
            </li>
            <li>
              <strong className="text-slate-900">Refresh Data</strong> — Go to{' '}
              <Link href="/refresh" className="text-primary underline">Refresh Data</Link> and run a collection
              to populate the database with the latest plans and packages.
            </li>
            <li>
              <strong className="text-slate-900">Explore</strong> — Browse providers, run comparisons, analyze segments, and
              generate strategic reports.
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Data Sources & Seed Data */}
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50/80 to-transparent">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Database className="h-5 w-5 text-amber-600" />
            Data Sources & Seed Data
          </CardTitle>
          <CardDescription>
            Understanding where the data in this platform comes from
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <div className="bg-white rounded-lg border p-4 space-y-2">
            <p className="font-semibold text-slate-900 flex items-center gap-2">
              <Database className="h-4 w-4 text-amber-500" />
              Seed Data (Default)
            </p>
            <p>
              When the platform is first loaded — or when no LLM API key is configured — the system populates the
              database with <strong className="text-slate-900">seed data</strong>. This seed data is{' '}
              <strong className="text-amber-700">fabricated / estimated</strong> and is{' '}
              <strong className="text-amber-700">NOT sourced from actual provider websites</strong>.
            </p>
            <p>
              Seed data provides realistic-looking plans, pricing, device deals, and contract buyout terms
              to demonstrate platform capabilities, but the numbers, terms, and conditions are approximations
              — not verified provider information.
            </p>
            <p className="font-medium text-slate-700">Seed data includes:</p>
            <ul className="list-disc list-inside space-y-0.5 pl-2 text-xs">
              <li>Broadband, mobile, voice, and package plans for all 7 providers</li>
              <li>Device incentives (iPhone 17/16 series, Galaxy S25 series, Pixel 9 deals)</li>
              <li>Contract buyout terms and conditions per provider</li>
              <li>SMB segments and buyer profiles</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg border p-4 space-y-2">
            <p className="font-semibold text-slate-900 flex items-center gap-2">
              <Globe className="h-4 w-4 text-green-500" />
              Live Data (User-Initiated)
            </p>
            <p>
              When you configure an <strong className="text-slate-900">LLM API key</strong> in{' '}
              <Link href="/settings" className="text-primary underline">Settings</Link> and then click{' '}
              <strong className="text-slate-900">Refresh Data</strong>, the platform attempts to{' '}
              <strong className="text-green-700">scrape real data from provider websites</strong>.
              It fetches the actual web page, cleans the HTML, and uses your LLM to extract structured plan data.
            </p>
            <p>
              Live scraping may fail for some providers (JavaScript-rendered pages, bot protection, etc.),
              in which case the system falls back to seed data for that provider. Each result is clearly
              tagged so you always know the source.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-blue-200 p-4 space-y-2">
            <p className="font-semibold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-blue-500" />
              How to Tell What&apos;s Real vs Seed
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>
                <strong className="text-slate-700">Refresh Data page</strong>: After each refresh, every provider is tagged with a
                <Badge variant="outline" className="text-xs ml-1 mr-1 border-green-300 text-green-700 bg-green-50 align-middle">Live</Badge>
                or
                <Badge variant="outline" className="text-xs ml-1 mr-1 border-amber-300 text-amber-700 bg-amber-50 align-middle">Seed</Badge>
                badge
              </li>
              <li>
                <strong className="text-slate-700">Dashboard</strong>: The Data Freshness panel shows the current status for every
                provider — whether their data is from a live scrape or seed, and when it was last refreshed
              </li>
              <li>
                <strong className="text-slate-700">Before first refresh</strong>: All data is seed data
              </li>
              <li>
                <strong className="text-slate-700">AI analysis</strong>: All AI-generated insights (comparisons, executive briefings, etc.) are
                produced by your LLM based on whatever data is currently in the database — so the quality of AI output
                depends on whether the underlying data is live or seed
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-2">
            <p className="font-semibold text-slate-900">All Public Data</p>
            <p>
              All data — whether scraped live or provided as seed — is based on{' '}
              <strong className="text-slate-900">publicly available information</strong> from provider websites,
              marketing materials, and published rate cards. No proprietary, confidential, or non-public data
              is used or stored.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Section-by-Section Guide */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Platform Sections</h2>
        <div className="space-y-4">
          {sections.map((section) => (
            <Card key={section.title}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${section.color}`}>
                      <section.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                    </div>
                  </div>
                  <Link href={section.href} className="text-primary hover:underline text-sm flex items-center gap-1">
                    Go to {section.title} <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <CardDescription className="mt-2">{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {section.details.map((detail, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary font-bold mt-0.5">•</span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Glossary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Key Terms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-slate-900">Provider</p>
                <p className="text-muted-foreground">A telecom company (e.g., Comcast Business, AT&T). Types: MSO (cable), Telco, Wireless.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Offer / Plan</p>
                <p className="text-muted-foreground">A single service offering with a price, speed, and features (e.g., &quot;Business Internet 200 Mbps&quot;).</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Package</p>
                <p className="text-muted-foreground">A bundled offering combining multiple services (internet + voice + mobile) at a combined price, often with a discount.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">SMB Segment</p>
                <p className="text-muted-foreground">A group of similar small businesses defined by employee count, revenue, and industry (e.g., &quot;Small Healthcare, 5-19 employees&quot;).</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-slate-900">Buyer Profile</p>
                <p className="text-muted-foreground">Behavioral data for a segment: how they find providers, what they care about, their pain points, and contract attitudes.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Stored Insight</p>
                <p className="text-muted-foreground">An AI-generated analysis that is automatically saved to the database for future reference and export.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Focus Provider / &quot;My Company&quot;</p>
                <p className="text-muted-foreground">The provider you represent. When set, competitive analyses are framed from your perspective.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">LLM</p>
                <p className="text-muted-foreground">Large Language Model (e.g., GPT-5, Claude). Powers all AI analysis features. You supply your own API key.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
