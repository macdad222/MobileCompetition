'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Database,
  Globe,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
} from 'lucide-react';

interface ProviderStatus {
  id: string;
  slug: string;
  displayName: string;
  dataSource: 'live' | 'seed' | 'never_refreshed';
  lastRefreshed: string | null;
  offersInDb: number;
  deviceIncentives: number;
  contractBuyouts: number;
}

interface DataStatusSummary {
  totalProviders: number;
  liveData: number;
  seedData: number;
  neverRefreshed: number;
  totalOffers: number;
  allSeed: boolean;
  allLive: boolean;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function DataFreshness() {
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [summary, setSummary] = useState<DataStatusSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      const res = await fetch('/api/data-status');
      if (!res.ok) return;
      const data = await res.json();
      setProviders(data.providers || []);
      setSummary(data.summary || null);
    } catch (e) {
      console.error('Failed to fetch data status:', e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!summary) return null;

  const sourceIcon = (source: string) => {
    switch (source) {
      case 'live': return <Globe className="h-3.5 w-3.5 text-green-600" />;
      case 'seed': return <Database className="h-3.5 w-3.5 text-amber-500" />;
      default: return <AlertTriangle className="h-3.5 w-3.5 text-slate-400" />;
    }
  };

  const sourceBadge = (source: string) => {
    switch (source) {
      case 'live':
        return <Badge variant="outline" className="text-xs border-green-300 text-green-700 bg-green-50">Live</Badge>;
      case 'seed':
        return <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 bg-amber-50">Seed</Badge>;
      default:
        return <Badge variant="outline" className="text-xs border-slate-300 text-slate-500">No Data</Badge>;
    }
  };

  return (
    <Card className={summary.allSeed || summary.neverRefreshed > 0 ? 'border-amber-200' : 'border-green-200'}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data Freshness
          </CardTitle>
          <CardDescription>
            {summary.allLive
              ? 'All providers have live data from web scraping'
              : summary.allSeed
                ? 'All data is currently seed/demo data — refresh with an LLM key to pull live data'
                : `${summary.liveData} live, ${summary.seedData} seed, ${summary.neverRefreshed} not refreshed`}
          </CardDescription>
        </div>
        <Link href="/refresh">
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Refresh
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {/* Summary bar */}
        {summary.totalProviders > 0 && (
          <div className="flex gap-1 h-2 rounded-full overflow-hidden mb-4">
            {summary.liveData > 0 && (
              <div
                className="bg-green-500 rounded-full"
                style={{ width: `${(summary.liveData / summary.totalProviders) * 100}%` }}
                title={`${summary.liveData} providers with live data`}
              />
            )}
            {summary.seedData > 0 && (
              <div
                className="bg-amber-400 rounded-full"
                style={{ width: `${(summary.seedData / summary.totalProviders) * 100}%` }}
                title={`${summary.seedData} providers with seed data`}
              />
            )}
            {summary.neverRefreshed > 0 && (
              <div
                className="bg-slate-200 rounded-full"
                style={{ width: `${(summary.neverRefreshed / summary.totalProviders) * 100}%` }}
                title={`${summary.neverRefreshed} providers never refreshed`}
              />
            )}
          </div>
        )}

        {/* Legend */}
        <div className="flex gap-4 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> Live ({summary.liveData})
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Seed ({summary.seedData})
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-200 inline-block" /> No Data ({summary.neverRefreshed})
          </span>
        </div>

        {/* Per-provider list */}
        <div className="space-y-1.5">
          {providers.map(p => (
            <div key={p.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-50 text-sm">
              <div className="flex items-center gap-2">
                {sourceIcon(p.dataSource)}
                <span className="font-medium">{p.displayName}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {p.offersInDb} plans
                  {p.deviceIncentives > 0 && ` · ${p.deviceIncentives} devices`}
                </span>
                {p.lastRefreshed && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatRelativeTime(p.lastRefreshed)}
                  </span>
                )}
                {sourceBadge(p.dataSource)}
              </div>
            </div>
          ))}
        </div>

        {/* Seed data warning */}
        {(summary.allSeed || summary.seedData > 0) && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
            <p className="font-medium flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              Seed Data Notice
            </p>
            <p className="mt-1">
              Providers marked &quot;Seed&quot; are using fabricated/estimated data, not real provider information.
              To pull live data, configure an LLM API key in{' '}
              <Link href="/settings" className="underline font-medium">Settings</Link>{' '}
              and run a{' '}
              <Link href="/refresh" className="underline font-medium">Data Refresh</Link>.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
