'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
  Legend,
} from 'recharts';
import {
  Package,
  Loader2,
  Building2,
  DollarSign,
  Layers,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Trophy,
  AlertTriangle,
  Target,
  ArrowRight,
  BarChart3,
  Wifi,
  Smartphone,
  Phone,
  CheckCircle2,
  XCircle,
  Star,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { getProviderColor } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface Provider {
  id: string;
  displayName: string;
  slug: string;
}

interface PackageAddOn {
  displayName: string;
  price: number | null;
  description: string | null;
}

interface IncludedOffer {
  offer: {
    id: string;
    displayName: string;
    category: string;
    priceMonthly: number | null;
    downloadMbps: number | null;
    uploadMbps: number | null;
  };
}

interface PackageData {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  packageType: string;
  tier: string | null;
  basePrice: number | null;
  targetSegments: string[];
  provider: Provider;
  includedOffers: IncludedOffer[];
  addOns: PackageAddOn[];
}

interface PortfolioAnalysis {
  executiveSummary: string;
  portfolioStrategy: string;
  tierAnalysis: {
    tier: string;
    positioning: string;
    targetBuyer: string;
    valueScore: string;
    strengths: string[];
    gaps: string[];
  }[];
  pricingStrategy: {
    overview: string;
    competitivePosition: string;
    discountStructure: string;
    recommendations: string[];
  };
  bundlingEffectiveness: {
    assessment: string;
    bestPackage: string;
    bestPackageReason: string;
    missingCombinations: string[];
  };
  smbFit: {
    microBusiness: string;
    smallBusiness: string;
    mediumBusiness: string;
  };
  competitiveGaps: string[];
  strategicRecommendations: string[];
}

interface CrossProviderComparison {
  marketOverview: string;
  leaderboard: { category: string; leader: string; reason: string }[];
  pricingComparison: {
    cheapestEntry: { provider: string; package: string; price: string };
    bestMidTier: { provider: string; package: string; reason: string };
    premiumLeader: { provider: string; package: string; differentiator: string };
  };
  bundlingStrategies: { provider: string; approach: string; effectiveness: string }[];
  gaps: { provider: string; missingCapability: string }[];
  recommendations: string[];
}

// ============================================================================
// HELPERS
// ============================================================================

const categoryIcon = (cat: string) => {
  switch (cat) {
    case 'BROADBAND': return <Wifi className="h-3.5 w-3.5" />;
    case 'MOBILE': return <Smartphone className="h-3.5 w-3.5" />;
    case 'VOICE': return <Phone className="h-3.5 w-3.5" />;
    default: return <Package className="h-3.5 w-3.5" />;
  }
};

const tierColor = (tier: string | null) => {
  if (!tier) return 'secondary';
  const t = tier.toLowerCase();
  if (t.includes('premium') || t.includes('ultimate') || t.includes('enterprise')) return 'default';
  if (t.includes('standard') || t.includes('complete') || t.includes('essential') || t.includes('advanced')) return 'secondary';
  if (t.includes('starter') || t.includes('value') || t.includes('remote')) return 'outline';
  return 'secondary';
};

const valueColor = (score: string) => {
  switch (score?.toLowerCase()) {
    case 'excellent': return 'text-green-600';
    case 'good': return 'text-blue-600';
    case 'fair': return 'text-yellow-600';
    case 'poor': return 'text-red-600';
    default: return 'text-muted-foreground';
  }
};

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function ProductPortfolioPage() {
  const { toast } = useToast();
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<string>('all');

  // Analysis states
  const [analyzingProvider, setAnalyzingProvider] = useState<string | null>(null);
  const [providerAnalysis, setProviderAnalysis] = useState<Record<string, PortfolioAnalysis>>({});
  const [providerAnalysisAt, setProviderAnalysisAt] = useState<Record<string, string>>({});
  const [analyzingCrossProvider, setAnalyzingCrossProvider] = useState(false);
  const [crossProviderComparison, setCrossProviderComparison] = useState<CrossProviderComparison | null>(null);
  const [crossAnalysisAt, setCrossAnalysisAt] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    fetchCachedCrossPortfolio();
  }, []);

  async function fetchCachedCrossPortfolio() {
    try {
      const res = await fetch('/api/insights/cached?insightType=PORTFOLIO_ANALYSIS&category=cross-provider');
      const data = await res.json();
      if (data.insight?.content) {
        setCrossProviderComparison(data.insight.content as CrossProviderComparison);
        setCrossAnalysisAt(data.insight.generatedAt);
      }
    } catch (error) { /* silent */ }
  }

  async function fetchCachedProviderPortfolio(providerId: string) {
    try {
      const res = await fetch(`/api/insights/cached?insightType=PORTFOLIO_ANALYSIS&providerId=${providerId}`);
      const data = await res.json();
      if (data.insight?.content) {
        setProviderAnalysis((prev) => ({ ...prev, [providerId]: data.insight.content as PortfolioAnalysis }));
        setProviderAnalysisAt((prev) => ({ ...prev, [providerId]: data.insight.generatedAt }));
      }
    } catch (error) { /* silent */ }
  }

  async function fetchData() {
    setLoading(true);
    try {
      const [pkgRes, provRes] = await Promise.all([
        fetch('/api/packages'),
        fetch('/api/providers'),
      ]);
      const pkgData = await pkgRes.json();
      const provData = await provRes.json();
      setPackages(pkgData.packages || []);
      setProviders(provData.providers || []);
      // Load cached analyses for all providers
      const allProviders = provData.providers || [];
      allProviders.forEach((p: Provider) => fetchCachedProviderPortfolio(p.id));
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Group packages by provider
  const packagesByProvider: Record<string, PackageData[]> = {};
  for (const pkg of packages) {
    const key = pkg.provider.slug;
    if (!packagesByProvider[key]) packagesByProvider[key] = [];
    packagesByProvider[key].push(pkg);
  }

  const filteredProviders = selectedProvider === 'all'
    ? Object.keys(packagesByProvider)
    : [selectedProvider];

  const filteredPackages = selectedProvider === 'all'
    ? packages
    : packages.filter((p) => p.provider.slug === selectedProvider);

  // Stats
  const totalPackages = packages.length;
  const totalProviders = Object.keys(packagesByProvider).length;
  const avgPrice = packages.filter(p => p.basePrice).reduce((s, p) => s + (p.basePrice || 0), 0) /
    (packages.filter(p => p.basePrice).length || 1);
  const priceRange = {
    min: Math.min(...packages.filter(p => p.basePrice).map(p => p.basePrice!)),
    max: Math.max(...packages.filter(p => p.basePrice).map(p => p.basePrice!)),
  };

  async function handleProviderAnalysis(providerId: string, providerName: string) {
    setAnalyzingProvider(providerId);
    try {
      const res = await fetch('/api/analysis/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'provider', providerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProviderAnalysis((prev) => ({ ...prev, [providerId]: data.analysis }));
      setProviderAnalysisAt((prev) => ({ ...prev, [providerId]: new Date().toISOString() }));
      toast({ title: 'Analysis Complete', description: `Portfolio analysis for ${providerName} generated.` });
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Analysis failed', variant: 'destructive' });
    } finally {
      setAnalyzingProvider(null);
    }
  }

  async function handleCrossProviderAnalysis() {
    setAnalyzingCrossProvider(true);
    try {
      const res = await fetch('/api/analysis/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'cross-provider' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCrossProviderComparison(data.comparison);
      setCrossAnalysisAt(new Date().toISOString());
      toast({ title: 'Analysis Complete', description: 'Cross-provider package comparison generated.' });
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Analysis failed', variant: 'destructive' });
    } finally {
      setAnalyzingCrossProvider(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Product Portfolio</h1>
          <p className="text-muted-foreground mt-1">
            Deep analysis of service packages across all providers
          </p>
        </div>
        <div className="flex items-center gap-2">
          {crossAnalysisAt && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(crossAnalysisAt).toLocaleDateString()} {new Date(crossAnalysisAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <Button
            onClick={handleCrossProviderAnalysis}
            disabled={analyzingCrossProvider}
            className="gap-2"
            variant={crossProviderComparison ? 'outline' : 'default'}
          >
            {analyzingCrossProvider ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</>
            ) : crossProviderComparison ? (
              <><RefreshCw className="h-4 w-4" /> Refresh Cross-Provider</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Cross-Provider Analysis</>
            )}
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalPackages}</p>
                <p className="text-xs text-muted-foreground">Total Packages</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalProviders}</p>
                <p className="text-xs text-muted-foreground">Providers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">${avgPrice.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Avg Price/mo</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">${priceRange.min?.toFixed(0) || '?'} - ${priceRange.max?.toFixed(0) || '?'}</p>
                <p className="text-xs text-muted-foreground">Price Range</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cross-Provider Comparison Results */}
      {crossProviderComparison && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <CardTitle>Cross-Provider Package Comparison</CardTitle>
            </div>
            <CardDescription>{crossProviderComparison.marketOverview}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Leaderboard */}
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Market Leaders</h4>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {crossProviderComparison.leaderboard.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white border">
                    <Trophy className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">{item.category}</p>
                      <p className="text-sm text-primary font-semibold">{item.leader}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Pricing Comparison */}
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Pricing Tiers</h4>
              <div className="grid md:grid-cols-3 gap-3">
                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-xs font-semibold text-green-700 uppercase">Cheapest Entry</p>
                  <p className="font-bold mt-1">{crossProviderComparison.pricingComparison.cheapestEntry.provider}</p>
                  <p className="text-sm text-muted-foreground">{crossProviderComparison.pricingComparison.cheapestEntry.package}</p>
                  <p className="text-sm font-medium text-green-700 mt-1">{crossProviderComparison.pricingComparison.cheapestEntry.price}</p>
                </div>
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-xs font-semibold text-blue-700 uppercase">Best Mid-Tier</p>
                  <p className="font-bold mt-1">{crossProviderComparison.pricingComparison.bestMidTier.provider}</p>
                  <p className="text-sm text-muted-foreground">{crossProviderComparison.pricingComparison.bestMidTier.package}</p>
                  <p className="text-sm text-blue-700 mt-1">{crossProviderComparison.pricingComparison.bestMidTier.reason}</p>
                </div>
                <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                  <p className="text-xs font-semibold text-purple-700 uppercase">Premium Leader</p>
                  <p className="font-bold mt-1">{crossProviderComparison.pricingComparison.premiumLeader.provider}</p>
                  <p className="text-sm text-muted-foreground">{crossProviderComparison.pricingComparison.premiumLeader.package}</p>
                  <p className="text-sm text-purple-700 mt-1">{crossProviderComparison.pricingComparison.premiumLeader.differentiator}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Bundling Strategies */}
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Bundling Strategies</h4>
              <div className="space-y-2">
                {crossProviderComparison.bundlingStrategies.map((bs, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white border">
                    <Layers className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{bs.provider}</p>
                      <p className="text-sm text-muted-foreground">{bs.approach}</p>
                      <p className="text-xs text-primary mt-1">{bs.effectiveness}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Market Gaps */}
            {crossProviderComparison.gaps.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Market Gaps</h4>
                  <div className="grid md:grid-cols-2 gap-2">
                    {crossProviderComparison.gaps.map((gap, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 rounded bg-yellow-50 border border-yellow-200">
                        <AlertTriangle className="h-3.5 w-3.5 text-yellow-600 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-sm font-medium">{gap.provider}:</span>
                          <span className="text-sm text-muted-foreground ml-1">{gap.missingCapability}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Recommendations */}
            {crossProviderComparison.recommendations.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Strategic Recommendations</h4>
                  <div className="space-y-2">
                    {crossProviderComparison.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <ArrowRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <p className="text-sm">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select value={selectedProvider} onValueChange={setSelectedProvider}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Filter by provider..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Providers</SelectItem>
            {Object.entries(packagesByProvider).map(([slug, pkgs]) => (
              <SelectItem key={slug} value={slug}>
                {pkgs[0].provider.displayName} ({pkgs.length} packages)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Showing {filteredPackages.length} packages across {filteredProviders.length} provider(s)
        </p>
      </div>

      {/* Main Content: Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full max-w-xl grid-cols-3">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="comparison" className="gap-2">
            <Layers className="h-4 w-4" /> Comparison Matrix
          </TabsTrigger>
          <TabsTrigger value="deep-dive" className="gap-2">
            <Sparkles className="h-4 w-4" /> Deep Analysis
          </TabsTrigger>
        </TabsList>

        {/* === OVERVIEW TAB === */}
        <TabsContent value="overview" className="space-y-6">
          {filteredProviders.map((slug) => {
            const provPkgs = packagesByProvider[slug] || [];
            if (provPkgs.length === 0) return null;
            const provider = provPkgs[0].provider;

            return (
              <Card key={slug}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>{provider.displayName}</CardTitle>
                        <CardDescription>{provPkgs.length} packages available</CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => handleProviderAnalysis(provider.id, provider.displayName)}
                      disabled={analyzingProvider === provider.id}
                    >
                      {analyzingProvider === provider.id ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</>
                      ) : (
                        <><Sparkles className="h-4 w-4" /> AI Portfolio Analysis</>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {provPkgs.map((pkg) => (
                      <div
                        key={pkg.id}
                        className="rounded-lg border p-4 hover:border-primary/50 transition-colors space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-sm">{pkg.displayName}</h4>
                            {pkg.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{pkg.description}</p>
                            )}
                          </div>
                          {pkg.tier && (
                            <Badge variant={tierColor(pkg.tier) as any}>{pkg.tier}</Badge>
                          )}
                        </div>

                        {pkg.basePrice && (
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-primary">${Number(pkg.basePrice).toFixed(0)}</span>
                            <span className="text-xs text-muted-foreground">/mo</span>
                          </div>
                        )}

                        {/* Included Services */}
                        <div className="space-y-1.5">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Included</p>
                          {pkg.includedOffers.map((io, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              {categoryIcon(io.offer.category)}
                              <span>{io.offer.displayName}</span>
                              {io.offer.downloadMbps && (
                                <span className="text-muted-foreground">({io.offer.downloadMbps}Mbps)</span>
                              )}
                            </div>
                          ))}
                          {pkg.includedOffers.length === 0 && (
                            <p className="text-xs text-muted-foreground italic">Bundled services</p>
                          )}
                        </div>

                        {/* Add-ons */}
                        {pkg.addOns.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Add-ons</p>
                            {pkg.addOns.map((ao, i) => (
                              <div key={i} className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">{ao.displayName}</span>
                                {ao.price && <span className="font-medium">${Number(ao.price).toFixed(2)}</span>}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Segments */}
                        {pkg.targetSegments.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {pkg.targetSegments.slice(0, 3).map((seg, i) => (
                              <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0">
                                {seg.replace(/_/g, ' ').toLowerCase()}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Provider Analysis Results */}
                  {providerAnalysis[provider.id] && (
                    <ProviderAnalysisDisplay analysis={providerAnalysis[provider.id]} providerName={provider.displayName} />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* === COMPARISON MATRIX TAB === */}
        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Package Comparison Matrix</CardTitle>
              <CardDescription>
                Side-by-side comparison of all packages across providers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="text-left p-3 font-semibold min-w-[200px]">Package</th>
                      <th className="text-left p-3 font-semibold">Provider</th>
                      <th className="text-left p-3 font-semibold">Tier</th>
                      <th className="text-right p-3 font-semibold">Price/mo</th>
                      <th className="text-center p-3 font-semibold">
                        <Wifi className="h-4 w-4 mx-auto" />
                      </th>
                      <th className="text-center p-3 font-semibold">
                        <Smartphone className="h-4 w-4 mx-auto" />
                      </th>
                      <th className="text-center p-3 font-semibold">
                        <Phone className="h-4 w-4 mx-auto" />
                      </th>
                      <th className="text-left p-3 font-semibold">Speed</th>
                      <th className="text-center p-3 font-semibold">Add-ons</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPackages
                      .sort((a, b) => (a.basePrice || 0) - (b.basePrice || 0))
                      .map((pkg) => {
                        const hasBroadband = pkg.includedOffers.some((o) => o.offer.category === 'BROADBAND');
                        const hasMobile = pkg.includedOffers.some((o) => o.offer.category === 'MOBILE');
                        const hasVoice = pkg.includedOffers.some((o) => o.offer.category === 'VOICE');
                        const maxSpeed = Math.max(
                          ...pkg.includedOffers
                            .filter((o) => o.offer.downloadMbps)
                            .map((o) => o.offer.downloadMbps || 0),
                          0
                        );

                        return (
                          <tr key={pkg.id} className="border-b hover:bg-slate-50/50 transition-colors">
                            <td className="p-3">
                              <p className="font-medium text-sm">{pkg.displayName}</p>
                              {pkg.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">{pkg.description}</p>
                              )}
                            </td>
                            <td className="p-3">
                              <Badge variant="outline" className="text-xs">
                                {pkg.provider.displayName}
                              </Badge>
                            </td>
                            <td className="p-3">
                              {pkg.tier && <Badge variant={tierColor(pkg.tier) as any} className="text-xs">{pkg.tier}</Badge>}
                            </td>
                            <td className="p-3 text-right">
                              {pkg.basePrice ? (
                                <span className="font-bold">${Number(pkg.basePrice).toFixed(0)}</span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {hasBroadband ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                              ) : (
                                <XCircle className="h-4 w-4 text-slate-300 mx-auto" />
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {hasMobile ? (
                                <a href="/mobile" className="inline-flex items-center gap-0.5 text-green-600 hover:text-green-800" title="View Mobile Intelligence">
                                  <CheckCircle2 className="h-4 w-4" />
                                </a>
                              ) : (
                                <XCircle className="h-4 w-4 text-slate-300 mx-auto" />
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {hasVoice ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                              ) : (
                                <XCircle className="h-4 w-4 text-slate-300 mx-auto" />
                              )}
                            </td>
                            <td className="p-3">
                              {maxSpeed > 0 ? (
                                <span className="text-sm">{maxSpeed} Mbps</span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <Badge variant="outline" className="text-xs">
                                {pkg.addOns.length}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Price Distribution Charts */}
          <PriceDistributionSection
            packages={filteredPackages}
            packagesByProvider={packagesByProvider}
            filteredProviders={filteredProviders}
          />
        </TabsContent>

        {/* === DEEP ANALYSIS TAB === */}
        <TabsContent value="deep-dive" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Portfolio Deep Dive</CardTitle>
              <CardDescription>
                Select a provider to generate an in-depth product portfolio analysis using your configured LLM.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(packagesByProvider).map(([slug, pkgs]) => {
                  const provider = pkgs[0].provider;
                  const hasAnalysis = !!providerAnalysis[provider.id];

                  return (
                    <div
                      key={slug}
                      className={`rounded-lg border p-4 space-y-3 ${hasAnalysis ? 'border-green-300 bg-green-50/50' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-semibold">{provider.displayName}</p>
                          <p className="text-xs text-muted-foreground">{pkgs.length} packages</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {pkgs.slice(0, 3).map((p) => (
                          <Badge key={p.id} variant="outline" className="text-xs">
                            {p.tier || p.displayName.split(' ').slice(-1)}
                          </Badge>
                        ))}
                        {pkgs.length > 3 && (
                          <Badge variant="outline" className="text-xs">+{pkgs.length - 3}</Badge>
                        )}
                      </div>
                      <Button
                        className="w-full gap-2"
                        size="sm"
                        variant={hasAnalysis ? 'outline' : 'default'}
                        onClick={() => handleProviderAnalysis(provider.id, provider.displayName)}
                        disabled={analyzingProvider === provider.id}
                      >
                        {analyzingProvider === provider.id ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</>
                        ) : hasAnalysis ? (
                          <><Sparkles className="h-4 w-4" /> Re-Analyze</>
                        ) : (
                          <><Sparkles className="h-4 w-4" /> Analyze Portfolio</>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>

              {/* Analysis Results */}
              {Object.entries(providerAnalysis).map(([providerId, analysis]) => {
                const provider = providers.find(p => p.id === providerId);
                if (!provider) return null;
                return (
                  <ProviderAnalysisDisplay
                    key={providerId}
                    analysis={analysis}
                    providerName={provider.displayName}
                  />
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// Price Distribution Section — Recharts-powered visualizations
// ============================================================================

const PRICE_BRACKETS = [
  { label: '$0–50', min: 0, max: 50 },
  { label: '$50–100', min: 50, max: 100 },
  { label: '$100–150', min: 100, max: 150 },
  { label: '$150–200', min: 150, max: 200 },
  { label: '$200–300', min: 200, max: 300 },
  { label: '$300+', min: 300, max: Infinity },
];

function PriceDistributionSection({
  packages,
  packagesByProvider,
  filteredProviders,
}: {
  packages: PackageData[];
  packagesByProvider: Record<string, PackageData[]>;
  filteredProviders: string[];
}) {
  // ── Per-provider bar chart data ──
  const providerBarData = useMemo(() => {
    return filteredProviders
      .filter((slug) => packagesByProvider[slug])
      .map((slug) => {
        const pkgs = packagesByProvider[slug];
        const provider = pkgs[0].provider;
        const sorted = [...pkgs]
          .filter((p) => p.basePrice)
          .sort((a, b) => (a.basePrice || 0) - (b.basePrice || 0));
        return {
          slug,
          provider,
          packages: sorted.map((p) => ({
            name: p.displayName,
            price: Number(p.basePrice || 0),
            tier: p.tier || '',
            id: p.id,
            services: p.includedOffers.length,
            addOns: p.addOns.length,
            speed: Math.max(
              ...p.includedOffers
                .filter((o) => o.offer.downloadMbps)
                .map((o) => o.offer.downloadMbps || 0),
              0
            ),
          })),
        };
      });
  }, [filteredProviders, packagesByProvider]);

  // ── Price vs Speed scatter data ──
  const scatterData = useMemo(() => {
    const result: Record<string, { name: string; price: number; speed: number; provider: string; slug: string; tier: string }[]> = {};
    for (const slug of filteredProviders) {
      const pkgs = packagesByProvider[slug];
      if (!pkgs) continue;
      const provName = pkgs[0].provider.displayName;
      result[slug] = pkgs
        .filter((p) => p.basePrice)
        .map((p) => {
          const speed = Math.max(
            ...p.includedOffers
              .filter((o) => o.offer.downloadMbps)
              .map((o) => o.offer.downloadMbps || 0),
            0
          );
          return {
            name: p.displayName,
            price: Number(p.basePrice || 0),
            speed,
            provider: provName,
            slug,
            tier: p.tier || 'N/A',
          };
        })
        .filter((p) => p.speed > 0);
    }
    return result;
  }, [filteredProviders, packagesByProvider]);

  const hasScatterData = Object.values(scatterData).some((d) => d.length > 0);

  // ── Histogram data (by price bracket) ──
  const histogramData = useMemo(() => {
    return PRICE_BRACKETS.map((bracket) => {
      const row: any = { bracket: bracket.label };
      for (const slug of filteredProviders) {
        const pkgs = packagesByProvider[slug];
        if (!pkgs) continue;
        const provName = pkgs[0].provider.displayName;
        row[provName] = pkgs.filter(
          (p) =>
            p.basePrice &&
            Number(p.basePrice) >= bracket.min &&
            Number(p.basePrice) < bracket.max
        ).length;
      }
      return row;
    });
  }, [filteredProviders, packagesByProvider]);

  const allProviderNames = filteredProviders
    .filter((s) => packagesByProvider[s])
    .map((s) => ({ name: packagesByProvider[s][0].provider.displayName, slug: s }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ── Price Landscape: Grouped Bar ── */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-gradient-to-br from-violet-500/20 to-indigo-500/20">
              <BarChart3 className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <CardTitle className="text-base">Price Landscape</CardTitle>
              <CardDescription>Every package plotted by monthly price, grouped by provider</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {providerBarData.map(({ slug, provider, packages: pkgs }) => {
              if (pkgs.length === 0) return null;
              const color = getProviderColor(slug);
              return (
                <div key={slug}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                    <p className="text-sm font-semibold">{provider.displayName}</p>
                    <span className="text-xs text-muted-foreground">({pkgs.length} packages)</span>
                  </div>
                  <ResponsiveContainer width="100%" height={pkgs.length > 6 ? 220 : 180}>
                    <BarChart
                      data={pkgs}
                      layout="vertical"
                      margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
                      barCategoryGap="20%"
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis
                        type="number"
                        tickFormatter={(v) => `$${v}`}
                        fontSize={11}
                        stroke="#94a3b8"
                        axisLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={160}
                        tick={{ fontSize: 11, fill: '#475569' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <RechartsTooltip
                        cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                        content={({ active, payload }) => {
                          if (!active || !payload?.[0]) return null;
                          const d = payload[0].payload;
                          return (
                            <div className="rounded-lg border bg-white shadow-lg p-3 text-sm min-w-[180px]">
                              <p className="font-semibold">{d.name}</p>
                              {d.tier && <p className="text-xs text-muted-foreground">{d.tier}</p>}
                              <Separator className="my-1.5" />
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                <span className="text-muted-foreground">Price</span>
                                <span className="font-semibold text-right">${d.price}/mo</span>
                                {d.speed > 0 && (
                                  <>
                                    <span className="text-muted-foreground">Speed</span>
                                    <span className="font-medium text-right">{d.speed} Mbps</span>
                                  </>
                                )}
                                <span className="text-muted-foreground">Services</span>
                                <span className="font-medium text-right">{d.services}</span>
                                <span className="text-muted-foreground">Add-ons</span>
                                <span className="font-medium text-right">{d.addOns}</span>
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="price" radius={[0, 6, 6, 0]} maxBarSize={28}>
                        {pkgs.map((p, i) => (
                          <Cell
                            key={p.id}
                            fill={color}
                            fillOpacity={0.2 + (0.8 * (i + 1)) / pkgs.length}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Price Bracket Histogram ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-base">Price Bracket Distribution</CardTitle>
              <CardDescription>Number of packages in each price range</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={histogramData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="bracket" fontSize={11} stroke="#94a3b8" tickLine={false} />
              <YAxis fontSize={11} stroke="#94a3b8" allowDecimals={false} tickLine={false} axisLine={false} />
              <RechartsTooltip
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  fontSize: '12px',
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
              />
              {allProviderNames.map(({ name, slug }) => (
                <Bar
                  key={slug}
                  dataKey={name}
                  stackId="a"
                  fill={getProviderColor(slug)}
                  radius={[0, 0, 0, 0]}
                  maxBarSize={40}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── Price vs Speed Scatter ── */}
      {hasScatterData && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                <TrendingUp className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-base">Value Positioning Map</CardTitle>
                <CardDescription>Price vs download speed — lower-right = best value</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  dataKey="price"
                  name="Price"
                  tickFormatter={(v) => `$${v}`}
                  fontSize={11}
                  stroke="#94a3b8"
                  label={{ value: 'Monthly Price ($)', position: 'insideBottom', offset: -5, fontSize: 11, fill: '#94a3b8' }}
                />
                <YAxis
                  type="number"
                  dataKey="speed"
                  name="Speed"
                  tickFormatter={(v) => `${v}`}
                  fontSize={11}
                  stroke="#94a3b8"
                  label={{ value: 'Download (Mbps)', angle: -90, position: 'insideLeft', offset: 15, fontSize: 11, fill: '#94a3b8' }}
                />
                <ZAxis range={[60, 200]} />
                <RechartsTooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-white shadow-lg p-3 text-sm min-w-[180px]">
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: getProviderColor(d.slug) }}
                          />
                          <span className="font-semibold">{d.provider}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">{d.name}</p>
                        <Separator className="my-1.5" />
                        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
                          <span className="text-muted-foreground">Price</span>
                          <span className="font-semibold text-right">${d.price}/mo</span>
                          <span className="text-muted-foreground">Speed</span>
                          <span className="font-medium text-right">{d.speed} Mbps</span>
                          <span className="text-muted-foreground">Tier</span>
                          <span className="font-medium text-right">{d.tier}</span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
                />
                {Object.entries(scatterData).map(([slug, data]) => {
                  if (data.length === 0) return null;
                  return (
                    <Scatter
                      key={slug}
                      name={data[0].provider}
                      data={data}
                      fill={getProviderColor(slug)}
                      fillOpacity={0.8}
                      strokeWidth={1.5}
                      stroke={getProviderColor(slug)}
                    />
                  );
                })}
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ── Price Ladder (clean ranked view) ── */}
      <Card className={hasScatterData ? '' : 'lg:col-span-1'}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-gradient-to-br from-sky-500/20 to-blue-500/20">
              <Layers className="h-4 w-4 text-sky-600" />
            </div>
            <div>
              <CardTitle className="text-base">Price Ladder</CardTitle>
              <CardDescription>All packages ranked cheapest → most expensive</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
            {[...packages]
              .filter((p) => p.basePrice)
              .sort((a, b) => Number(a.basePrice || 0) - Number(b.basePrice || 0))
              .map((pkg, idx) => {
                const price = Number(pkg.basePrice || 0);
                const maxP = Math.max(
                  ...packages.filter((p) => p.basePrice).map((p) => Number(p.basePrice!)),
                  1
                );
                const pct = (price / maxP) * 100;
                const color = getProviderColor(pkg.provider.slug);
                return (
                  <div
                    key={pkg.id}
                    className="group flex items-center gap-3 py-1.5 px-2 rounded-md hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-xs text-muted-foreground w-5 text-right tabular-nums">{idx + 1}</span>
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{pkg.displayName}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">{pkg.provider.displayName}</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(pct, 3)}%`, backgroundColor: color, opacity: 0.6 }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-bold tabular-nums shrink-0">${price}</span>
                    <span className="text-[10px] text-muted-foreground">/mo</span>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Provider Analysis Display Sub-Component
// ============================================================================

function ProviderAnalysisDisplay({ analysis, providerName }: { analysis: PortfolioAnalysis; providerName: string }) {
  return (
    <div className="mt-6 space-y-6 p-6 rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold">Portfolio Analysis: {providerName}</h3>
      </div>

      {/* Executive Summary */}
      <div className="p-4 rounded-lg bg-white border">
        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-2">Executive Summary</h4>
        <p className="text-sm leading-relaxed">{analysis.executiveSummary}</p>
      </div>

      {/* Portfolio Strategy */}
      {analysis.portfolioStrategy && (
        <div className="p-4 rounded-lg bg-white border">
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-2">Portfolio Strategy</h4>
          <p className="text-sm leading-relaxed">{analysis.portfolioStrategy}</p>
        </div>
      )}

      {/* Tier Analysis */}
      {analysis.tierAnalysis.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Tier Analysis</h4>
          <div className="grid md:grid-cols-2 gap-4">
            {analysis.tierAnalysis.map((tier, i) => (
              <div key={i} className="rounded-lg border bg-white p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="font-semibold">{tier.tier}</h5>
                  <span className={`text-sm font-medium ${valueColor(tier.valueScore)}`}>
                    {tier.valueScore}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{tier.positioning}</p>
                <p className="text-xs"><Target className="h-3 w-3 inline mr-1" /><span className="font-medium">Target:</span> {tier.targetBuyer}</p>
                <div className="flex flex-wrap gap-4 mt-2">
                  <div className="space-y-1">
                    {tier.strengths.map((s, j) => (
                      <div key={j} className="flex items-start gap-1.5 text-xs text-green-700">
                        <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0" />
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1">
                    {tier.gaps.map((g, j) => (
                      <div key={j} className="flex items-start gap-1.5 text-xs text-yellow-700">
                        <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                        <span>{g}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pricing Strategy */}
      {analysis.pricingStrategy.overview && (
        <div className="p-4 rounded-lg bg-white border space-y-3">
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Pricing Strategy</h4>
          <div className="grid md:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="font-medium text-xs text-muted-foreground uppercase">Overview</p>
              <p className="mt-1">{analysis.pricingStrategy.overview}</p>
            </div>
            <div>
              <p className="font-medium text-xs text-muted-foreground uppercase">Market Position</p>
              <p className="mt-1">{analysis.pricingStrategy.competitivePosition}</p>
            </div>
            <div>
              <p className="font-medium text-xs text-muted-foreground uppercase">Discount Structure</p>
              <p className="mt-1">{analysis.pricingStrategy.discountStructure}</p>
            </div>
          </div>
          {analysis.pricingStrategy.recommendations.length > 0 && (
            <div className="space-y-1 pt-2 border-t">
              <p className="font-medium text-xs text-muted-foreground uppercase">Recommendations</p>
              {analysis.pricingStrategy.recommendations.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  <span>{r}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bundling Effectiveness */}
      {analysis.bundlingEffectiveness.assessment && (
        <div className="p-4 rounded-lg bg-white border space-y-3">
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Bundling Effectiveness</h4>
          <p className="text-sm">{analysis.bundlingEffectiveness.assessment}</p>
          <div className="flex items-start gap-2 p-2 rounded bg-green-50 border border-green-200">
            <Star className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">Best Package: {analysis.bundlingEffectiveness.bestPackage}</p>
              <p className="text-xs text-green-700">{analysis.bundlingEffectiveness.bestPackageReason}</p>
            </div>
          </div>
          {analysis.bundlingEffectiveness.missingCombinations.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Missing Combinations</p>
              {analysis.bundlingEffectiveness.missingCombinations.map((m, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-yellow-700">
                  <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                  <span>{m}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SMB Fit */}
      {(analysis.smbFit.microBusiness || analysis.smbFit.smallBusiness || analysis.smbFit.mediumBusiness) && (
        <div className="p-4 rounded-lg bg-white border space-y-3">
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">SMB Segment Fit</h4>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="p-3 rounded bg-slate-50 border">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Micro (1-4 employees)</p>
              <p className="text-sm mt-1">{analysis.smbFit.microBusiness}</p>
            </div>
            <div className="p-3 rounded bg-slate-50 border">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Small (5-19 employees)</p>
              <p className="text-sm mt-1">{analysis.smbFit.smallBusiness}</p>
            </div>
            <div className="p-3 rounded bg-slate-50 border">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Medium (20-99 employees)</p>
              <p className="text-sm mt-1">{analysis.smbFit.mediumBusiness}</p>
            </div>
          </div>
        </div>
      )}

      {/* Competitive Gaps & Recommendations */}
      <div className="grid md:grid-cols-2 gap-4">
        {analysis.competitiveGaps.length > 0 && (
          <div className="p-4 rounded-lg bg-white border space-y-2">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Competitive Gaps</h4>
            {analysis.competitiveGaps.map((gap, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 mt-0.5 shrink-0" />
                <span>{gap}</span>
              </div>
            ))}
          </div>
        )}
        {analysis.strategicRecommendations.length > 0 && (
          <div className="p-4 rounded-lg bg-white border space-y-2">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Strategic Recommendations</h4>
            {analysis.strategicRecommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
