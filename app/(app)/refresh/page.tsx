'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import {
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Wifi,
  Phone,
  Smartphone,
  Globe,
  Database,
  AlertTriangle,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Provider {
  id: string;
  slug: string;
  displayName: string;
  providerType: string;
}

interface RefreshJob {
  id: string;
  status: string;
  progress: number;
  message: string;
  providerIds: string[];
  categories: string[];
  result: Record<string, { success: boolean; offers: number; error?: string; scraped?: boolean }> | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

const CATEGORIES = [
  { id: 'BROADBAND', name: 'Broadband', icon: Wifi },
  { id: 'MOBILE', name: 'Mobile', icon: Smartphone },
  { id: 'VOICE', name: 'Voice', icon: Phone },
  { id: 'PACKAGE', name: 'Packages', icon: Building2 },
];


export default function RefreshPage() {
  const { toast } = useToast();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['BROADBAND']);
  const [loading, setLoading] = useState(false);
  const [activeJob, setActiveJob] = useState<RefreshJob | null>(null);
  const [recentJobs, setRecentJobs] = useState<RefreshJob[]>([]);

  useEffect(() => {
    fetchProviders();
    fetchRecentJobs();
  }, []);

  async function fetchProviders() {
    try {
      const res = await fetch('/api/providers');
      const data = await res.json();
      setProviders(data.providers || []);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    }
  }

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (activeJob && (activeJob.status === 'PENDING' || activeJob.status === 'RUNNING')) {
      interval = setInterval(() => {
        pollJobStatus(activeJob.id);
      }, 2000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeJob?.id, activeJob?.status]);

  async function fetchRecentJobs() {
    try {
      const res = await fetch('/api/refresh');
      const data = await res.json();
      setRecentJobs(data.jobs || []);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    }
  }

  async function pollJobStatus(jobId: string) {
    try {
      const res = await fetch(`/api/refresh/${jobId}`);
      const data = await res.json();
      
      if (data.job) {
        setActiveJob(data.job);
        
        if (data.job.status === 'COMPLETED' || data.job.status === 'FAILED') {
          fetchRecentJobs();
        }
      }
    } catch (error) {
      console.error('Failed to poll job status:', error);
    }
  }

  async function handleRefresh() {
    if (selectedProviders.length === 0) {
      toast({
        title: 'Select Providers',
        description: 'Please select at least one provider to refresh',
        variant: 'destructive',
      });
      return;
    }

    if (selectedCategories.length === 0) {
      toast({
        title: 'Select Categories',
        description: 'Please select at least one category to refresh',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerIds: selectedProviders,
          categories: selectedCategories,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to start refresh');
      }

      // Start polling
      setActiveJob({
        id: data.jobId,
        status: 'PENDING',
        progress: 0,
        message: 'Starting...',
        providerIds: selectedProviders,
        categories: selectedCategories,
        result: null,
        startedAt: null,
        completedAt: null,
        createdAt: new Date().toISOString(),
      });

      toast({
        title: 'Refresh Started',
        description: 'Data refresh is now in progress',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to start refresh',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function toggleProvider(providerId: string) {
    setSelectedProviders((prev) =>
      prev.includes(providerId)
        ? prev.filter((p) => p !== providerId)
        : [...prev, providerId]
    );
  }

  function toggleCategory(categoryId: string) {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((c) => c !== categoryId)
        : [...prev, categoryId]
    );
  }

  function selectAllProviders() {
    setSelectedProviders(providers.map((p) => p.id));
  }

  function clearProviders() {
    setSelectedProviders([]);
  }

  const isJobActive = !!(activeJob && (activeJob.status === 'PENDING' || activeJob.status === 'RUNNING'));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Refresh Data</h1>
        <p className="text-muted-foreground mt-1">
          Scrape the latest offers and pricing from selected provider websites
        </p>
      </div>

      {/* Live Scraping Info */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="flex items-start gap-3 py-4">
          <Globe className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-blue-900">Live Web Scraping</p>
            <p className="text-sm text-blue-700 mt-1">
              When you have an <strong>LLM API key configured</strong> in Settings, the refresh will scrape
              real data from provider websites and use AI to extract structured plan information.
              Without an API key, seed/reference data is used as a fallback.
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs text-blue-600">
              <span className="flex items-center gap-1">
                <Globe className="h-3 w-3" /> Live scrape = real provider data
              </span>
              <span className="flex items-center gap-1">
                <Database className="h-3 w-3" /> Seed data = reference/demo data
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Selection Card */}
        <Card>
          <CardHeader>
            <CardTitle>Select Providers</CardTitle>
            <CardDescription>
              Choose which providers to refresh data from
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAllProviders}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={clearProviders}>
                Clear
              </Button>
            </div>

            <div className="grid gap-3">
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-slate-50 cursor-pointer"
                  onClick={() => toggleProvider(provider.id)}
                >
                  <Checkbox
                    id={provider.id}
                    checked={selectedProviders.includes(provider.id)}
                    onCheckedChange={() => toggleProvider(provider.id)}
                  />
                  <Label htmlFor={provider.id} className="flex-1 cursor-pointer">
                    <span className="font-medium">{provider.displayName}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {provider.providerType}
                    </span>
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Categories Card */}
        <Card>
          <CardHeader>
            <CardTitle>Select Categories</CardTitle>
            <CardDescription>
              Choose which service categories to collect
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {CATEGORIES.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-slate-50 cursor-pointer"
                  onClick={() => toggleCategory(category.id)}
                >
                  <Checkbox
                    id={category.id}
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={() => toggleCategory(category.id)}
                  />
                  <category.icon className="h-5 w-5 text-muted-foreground" />
                  <Label htmlFor={category.id} className="flex-1 cursor-pointer font-medium">
                    {category.name}
                  </Label>
                </div>
              ))}
            </div>

            <Separator />

            <Button
              className="w-full"
              size="lg"
              onClick={handleRefresh}
              disabled={loading || isJobActive}
            >
              {loading || isJobActive ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isJobActive ? 'Refreshing...' : 'Starting...'}
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Start Refresh
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Active Job Progress */}
      {activeJob && (
        <Card className={activeJob.status === 'FAILED' ? 'border-red-200' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {activeJob.status === 'COMPLETED' && (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
                {activeJob.status === 'FAILED' && (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                {(activeJob.status === 'PENDING' || activeJob.status === 'RUNNING') && (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                )}
                Current Job
              </CardTitle>
              <Badge
                variant={
                  activeJob.status === 'COMPLETED'
                    ? 'success'
                    : activeJob.status === 'FAILED'
                    ? 'destructive'
                    : 'secondary'
                }
              >
                {activeJob.status}
              </Badge>
            </div>
            <CardDescription>{activeJob.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={activeJob.progress} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              {activeJob.progress}% complete
            </p>

            {activeJob.result && (
              <div className="mt-4 space-y-2">
                {Object.entries(activeJob.result).map(([slug, result]) => (
                  <div key={slug} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{slug}</span>
                      {result.success && (
                        <Badge variant="outline" className={`text-xs ${result.scraped ? 'border-green-300 text-green-700 bg-green-50' : 'border-amber-300 text-amber-700 bg-amber-50'}`}>
                          {result.scraped ? (
                            <><Globe className="h-3 w-3 mr-1" />Live</>
                          ) : (
                            <><Database className="h-3 w-3 mr-1" />Seed</>
                          )}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{result.offers} offers</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-red-600">{result.error}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Jobs */}
      {recentJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Refresh Jobs</CardTitle>
            <CardDescription>History of your data refresh operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentJobs.slice(0, 5).map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    {job.status === 'COMPLETED' && (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                    {job.status === 'FAILED' && (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    {(job.status === 'PENDING' || job.status === 'RUNNING') && (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    )}
                    <div>
                      <p className="font-medium">
                        {job.providerIds.length} provider(s), {job.categories.length} category(ies)
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(job.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      job.status === 'COMPLETED'
                        ? 'success'
                        : job.status === 'FAILED'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {job.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
