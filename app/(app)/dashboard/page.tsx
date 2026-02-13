import { auth } from '@/auth';
import { db } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Building2,
  RefreshCw,
  BarChart3,
  GitCompare,
  ArrowRight,
  Clock,
  Layers,
  Smartphone,
  Zap,
  TrendingUp,
  BookOpen,
} from 'lucide-react';
import { AISummary } from '@/components/dashboard/ai-summary';
import { DataFreshness } from '@/components/dashboard/data-freshness';
import { formatDate } from '@/lib/utils';

const providerColors: Record<string, string> = {
  'comcast-business': 'bg-[#0070d1]',
  'att-business': 'bg-[#00a8e0]',
  'verizon-business': 'bg-[#cd040b]',
  'tmobile-business': 'bg-[#e20074]',
  'spectrum-business': 'bg-[#0077c8]',
  'cox-business': 'bg-[#f26522]',
  'optimum-business': 'bg-[#003d79]',
};

export default async function DashboardPage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(' ')[0] || 'there';
  
  // Fetch real data from the database
  const [providerCount, offerCount, providers, hasLLMConfig] = await Promise.all([
    db.provider.count({ where: { isActive: true } }),
    db.offer.count({ where: { isActive: true } }),
    db.provider.findMany({
      where: { isActive: true },
      select: {
        id: true,
        slug: true,
        displayName: true,
        _count: { select: { offers: { where: { isActive: true } } } },
      },
      orderBy: { priorityRank: 'asc' },
    }),
    db.appSettings.findUnique({
      where: { id: 'global' },
      select: { encryptedApiKey: true },
    }).then(result => !!result?.encryptedApiKey),
  ]);
  
  const quickStats = [
    { label: 'Providers Tracked', value: String(providerCount), icon: Building2, trend: 'Active in database' },
    { label: 'Plans in Database', value: String(offerCount), icon: BarChart3, trend: 'Currently tracked' },
    { label: 'Price Changes', value: '—', icon: TrendingUp, trend: 'Tracking enabled' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome back, {firstName}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening with SMB services across providers.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {quickStats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/docs">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <BookOpen className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Documentation</CardTitle>
              <CardDescription>
                Learn how the platform works
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/portfolio">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full border-purple-200 bg-gradient-to-br from-purple-50 to-transparent">
            <CardHeader>
              <Layers className="h-8 w-8 text-purple-600 mb-2" />
              <CardTitle className="text-lg">Product Portfolio</CardTitle>
              <CardDescription>
                Deep analysis of packages across all providers
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/mobile">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full border-emerald-200 bg-gradient-to-br from-emerald-50 to-transparent">
            <CardHeader>
              <Smartphone className="h-8 w-8 text-emerald-600 mb-2" />
              <CardTitle className="text-lg">Mobile Intelligence</CardTitle>
              <CardDescription>
                Device deals, switching incentives, and mobile plan comparison
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/refresh">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader>
              <RefreshCw className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Refresh Data</CardTitle>
              <CardDescription>
                Fetch latest offers and pricing from providers
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        
        <Link href="/compare/matrix">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Matrix Compare</CardTitle>
              <CardDescription>
                Compare multiple providers side-by-side
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        
        <Link href="/compare/head-to-head">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader>
              <GitCompare className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Head-to-Head</CardTitle>
              <CardDescription>
                Deep dive comparison between two providers
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        
        <Link href="/providers/comcast-business">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader>
              <Zap className="h-8 w-8 text-[#0070d1] mb-2" />
              <CardTitle className="text-lg">Comcast Deep Dive</CardTitle>
              <CardDescription>
                Detailed analysis of Comcast Business offerings
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* AI Summary */}
      <AISummary hasLLMConfig={hasLLMConfig} />

      {/* Data Freshness */}
      <DataFreshness />

      {/* Provider Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Provider Overview</CardTitle>
            <CardDescription>Quick status of tracked providers</CardDescription>
          </div>
          <Link href="/providers">
            <Button variant="outline" size="sm">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {providers.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No providers found. Refresh data to load providers.
              </p>
            ) : (
              providers.map((provider) => (
                <div
                  key={provider.slug}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${providerColors[provider.slug] || 'bg-gray-500'}`} />
                    <div>
                      <p className="font-medium">{provider.displayName}</p>
                      <p className="text-sm text-muted-foreground">
                        {provider._count.offers} plans tracked
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Link href={`/providers/${provider.slug}`}>
                      <Button variant="ghost" size="sm">
                        View
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* LLM Setup Reminder - only show if not configured */}
      {!hasLLMConfig && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800">Configure Your LLM Provider</CardTitle>
            <CardDescription className="text-amber-700">
              Add your API key to enable intelligent analysis, plan summarization, and comparison narratives.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/settings">
              <Button className="bg-amber-600 hover:bg-amber-700">
                Go to Settings
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
