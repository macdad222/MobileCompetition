'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatSpeed, formatDate, getProviderColor } from '@/lib/utils';
import {
  Building2,
  ExternalLink,
  RefreshCw,
  ArrowLeft,
  Loader2,
  Clock,
  Package,
  Wifi,
  Smartphone,
  Phone,
  Layers,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  XCircle,
  Target,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Provider {
  id: string;
  slug: string;
  name: string;
  displayName: string;
  parentMsoGroup: string | null;
  providerType: string;
  country: string;
  regions: string[];
  websiteUrl: string | null;
  businessUrl: string | null;
}

interface Feature {
  featureKey: string;
  featureValue: string;
}

interface Observation {
  id: string;
  priceMonthly: number | null;
  pricePromo: number | null;
  observedAt: string;
}

interface Offer {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  category: string;
  priceMonthly: number | null;
  pricePromo: number | null;
  promoTermMonths: number | null;
  contractMonths: number | null;
  downloadMbps: number | null;
  uploadMbps: number | null;
  sourceUrl: string | null;
  lastSeenAt: string;
  features: Feature[];
  observations: Observation[];
}

interface Stats {
  totalOffers: number;
  broadbandOffers: number;
  mobileOffers: number;
  voiceOffers: number;
  bundleOffers: number;
  lowestPrice: number | null;
  highestSpeed: number | null;
  lastRefreshed: string | null;
}

interface Snapshot {
  id: string;
  url: string;
  fetchedAt: string;
  parserVersion: string;
}

const CATEGORY_ICONS: Record<string, typeof Wifi> = {
  BROADBAND: Wifi,
  MOBILE: Smartphone,
  VOICE: Phone,
  PACKAGE: Layers,
};

interface ProviderAnalysis {
  overview: string;
  strengths: string[];
  weaknesses: string[];
  competitivePosition: string;
  targetCustomer: string;
}

export default function ProviderDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [offersByCategory, setOffersByCategory] = useState<Record<string, Offer[]>>({});
  const [packages, setPackages] = useState<any[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [activeTab, setActiveTab] = useState('BROADBAND');
  const [aiAnalysis, setAiAnalysis] = useState<ProviderAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchProvider();
      setAiAnalysis(null);
    }
  }, [slug]);

  async function generateProviderAnalysis() {
    setAiLoading(true);
    try {
      const res = await fetch('/api/analysis/provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerSlug: slug }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate analysis');
      }
      
      setAiAnalysis(data.analysis);
      toast({
        title: 'Provider Analysis Complete',
        description: 'AI has analyzed this provider.',
      });
    } catch (error) {
      console.error('Failed to generate provider analysis:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Failed to generate analysis',
        variant: 'destructive',
      });
    } finally {
      setAiLoading(false);
    }
  }

  async function fetchProvider() {
    setLoading(true);
    try {
      const res = await fetch(`/api/providers/${slug}`);
      const data = await res.json();
      
      if (data.provider) {
        setProvider(data.provider);
        setStats(data.stats);
        setOffersByCategory(data.offersByCategory);
        setPackages(data.packages || []);
        setSnapshots(data.recentSnapshots || []);
        
        // Set initial tab to category with most offers
        const categories = ['BROADBAND', 'MOBILE', 'VOICE', 'PACKAGE'];
        const firstWithOffers = categories.find((cat) => data.offersByCategory[cat]?.length > 0);
        if (firstWithOffers) setActiveTab(firstWithOffers);
      }
    } catch (error) {
      console.error('Failed to fetch provider:', error);
    } finally {
      setLoading(false);
    }
  }

  function getPriceChange(observations: Observation[]): { direction: 'up' | 'down' | 'same'; amount: number } | null {
    if (observations.length < 2) return null;
    
    const current = observations[0]?.priceMonthly;
    const previous = observations[1]?.priceMonthly;
    
    if (current === null || previous === null) return null;
    
    const diff = Number(current) - Number(previous);
    if (diff === 0) return { direction: 'same', amount: 0 };
    return { direction: diff > 0 ? 'up' : 'down', amount: Math.abs(diff) };
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Provider not found</h2>
        <Link href="/providers">
          <Button variant="link">Back to providers</Button>
        </Link>
      </div>
    );
  }

  const isComcast = slug === 'comcast-business';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/providers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold"
            style={{ backgroundColor: getProviderColor(provider.slug) }}
          >
            {provider.displayName[0]}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{provider.displayName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{provider.providerType}</Badge>
              {provider.parentMsoGroup && (
                <span className="text-muted-foreground">{provider.parentMsoGroup}</span>
              )}
              {isComcast && (
                <Badge className="bg-yellow-500">Deep Coverage</Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {provider.businessUrl && (
            <a href={provider.businessUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline">
                <ExternalLink className="mr-2 h-4 w-4" />
                Visit Website
              </Button>
            </a>
          )}
          <Link href="/refresh">
            <Button>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalOffers || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Starting Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats?.lowestPrice ? formatCurrency(stats.lowestPrice) : 'N/A'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top Speed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats?.highestSpeed ? formatSpeed(stats.highestSpeed) : 'N/A'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Last Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {stats?.lastRefreshed ? formatDate(stats.lastRefreshed) : 'Never'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comcast Special Insights */}
      {isComcast && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">Comcast Business Deep Dive</CardTitle>
            <CardDescription className="text-blue-700">
              Special analysis and insights for Comcast Business offerings
            </CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Key Strengths</h4>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>Largest cable MSO footprint in the US</li>
                <li>Comprehensive SMB product portfolio</li>
                <li>Business VoiceEdge cloud phone system</li>
                <li>Mobile service bundling options</li>
                <li>SecurityEdge cybersecurity included</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Notable Constraints</h4>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>Asymmetric speeds on cable (upload lower than download)</li>
                <li>2-year contract typically required for best pricing</li>
                <li>Promo pricing expires after 12 months</li>
                <li>Static IP may require additional fee on lower tiers</li>
                <li>Service availability varies by address</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Provider Analysis */}
      <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>AI Provider Analysis</CardTitle>
            </div>
            <Button 
              onClick={generateProviderAnalysis} 
              disabled={aiLoading || !stats?.totalOffers}
            >
              {aiLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Analysis
                </>
              )}
            </Button>
          </div>
          <CardDescription>
            Get AI-powered competitive analysis of {provider.displayName}
          </CardDescription>
        </CardHeader>
        {aiAnalysis && (
          <CardContent className="space-y-4">
            {/* Overview */}
            <div>
              <h4 className="font-semibold mb-2">Market Position</h4>
              <p className="text-muted-foreground">{aiAnalysis.overview}</p>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Key Strengths
                </h4>
                <ul className="space-y-1">
                  {aiAnalysis.strengths.map((strength, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-green-700">
                      <span>•</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Areas to Consider
                </h4>
                <ul className="space-y-1">
                  {aiAnalysis.weaknesses.map((weakness, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
                      <span>•</span>
                      {weakness}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Competitive Position */}
            {aiAnalysis.competitivePosition && (
              <div className="p-4 rounded-lg bg-slate-50">
                <h4 className="font-semibold mb-2">Competitive Position</h4>
                <p className="text-sm text-muted-foreground">{aiAnalysis.competitivePosition}</p>
              </div>
            )}

            {/* Target Customer */}
            {aiAnalysis.targetCustomer && (
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Ideal Customer
                </h4>
                <p className="text-sm text-blue-700">{aiAnalysis.targetCustomer}</p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Coverage Areas */}
      <Card>
        <CardHeader>
          <CardTitle>Coverage Areas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {provider.regions.map((region) => (
              <Badge key={region} variant="secondary">
                {region}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Packages */}
      {packages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Service Packages</CardTitle>
            <CardDescription>Bundled service offerings combining multiple solutions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {packages.map((pkg: any) => (
                <div key={pkg.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{pkg.displayName}</h4>
                      {pkg.tier && <Badge variant="secondary" className="text-xs mt-1">{pkg.tier}</Badge>}
                    </div>
                    {pkg.basePrice && (
                      <span className="text-xl font-bold">${Number(pkg.basePrice).toFixed(2)}<span className="text-sm font-normal text-muted-foreground">/mo</span></span>
                    )}
                  </div>
                  {pkg.description && <p className="text-sm text-muted-foreground mb-3">{pkg.description}</p>}
                  <Badge variant="outline" className="text-xs mb-3">{pkg.packageType}</Badge>
                  {pkg.includedOffers?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium mb-1">Included Services:</p>
                      <div className="space-y-1">
                        {pkg.includedOffers.map((po: any) => (
                          <div key={po.id} className="flex items-center gap-2 text-xs bg-green-50 p-1.5 rounded">
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            <span>{po.offer.displayName}</span>
                            <Badge variant="outline" className="text-[10px]">{po.offer.category}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {pkg.addOns?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium mb-1">Available Add-Ons:</p>
                      <div className="space-y-1">
                        {pkg.addOns.map((addon: any) => (
                          <div key={addon.id} className="flex items-center justify-between text-xs bg-blue-50 p-1.5 rounded">
                            <span>{addon.displayName}</span>
                            {addon.price && <span className="font-medium">+${Number(addon.price).toFixed(2)}/mo</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {pkg.targetSegments?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {pkg.targetSegments.map((s: string) => (
                        <Badge key={s} variant="outline" className="text-[10px]">{s.replace(/_/g, ' ')}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Plans & Pricing</CardTitle>
          <CardDescription>Current offerings with price history</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              {(['BROADBAND', 'MOBILE', 'VOICE', 'PACKAGE'] as const).map((cat) => {
                const Icon = CATEGORY_ICONS[cat];
                const count = offersByCategory[cat]?.length || 0;
                return (
                  <TabsTrigger key={cat} value={cat} disabled={count === 0}>
                    <Icon className="h-4 w-4 mr-2" />
                    {cat === 'PACKAGE' ? 'Packages' : cat.charAt(0) + cat.slice(1).toLowerCase()} ({count})
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {(['BROADBAND', 'MOBILE', 'VOICE', 'PACKAGE'] as const).map((cat) => (
              <TabsContent key={cat} value={cat} className="mt-4">
                {offersByCategory[cat]?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No {cat.toLowerCase()} offers available. Refresh data to load.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {offersByCategory[cat]?.map((offer) => {
                      const priceChange = getPriceChange(offer.observations);
                      return (
                        <div key={offer.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-lg">{offer.displayName}</h4>
                              {offer.description && (
                                <p className="text-sm text-muted-foreground">{offer.description}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold">
                                {formatCurrency(offer.priceMonthly)}
                                <span className="text-sm font-normal text-muted-foreground">/mo</span>
                              </div>
                              {priceChange && priceChange.direction !== 'same' && (
                                <div className={`flex items-center gap-1 text-sm ${
                                  priceChange.direction === 'up' ? 'text-red-600' : 'text-green-600'
                                }`}>
                                  {priceChange.direction === 'up' ? (
                                    <TrendingUp className="h-4 w-4" />
                                  ) : (
                                    <TrendingDown className="h-4 w-4" />
                                  )}
                                  {formatCurrency(priceChange.amount)}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            {offer.downloadMbps && (
                              <div>
                                <p className="text-xs text-muted-foreground">Download</p>
                                <p className="font-medium">{formatSpeed(offer.downloadMbps)}</p>
                              </div>
                            )}
                            {offer.uploadMbps && (
                              <div>
                                <p className="text-xs text-muted-foreground">Upload</p>
                                <p className="font-medium">{formatSpeed(offer.uploadMbps)}</p>
                              </div>
                            )}
                            {offer.pricePromo && (
                              <div>
                                <p className="text-xs text-muted-foreground">Promo Price</p>
                                <p className="font-medium text-green-600">
                                  {formatCurrency(offer.pricePromo)}/mo
                                  {offer.promoTermMonths && (
                                    <span className="text-xs text-muted-foreground ml-1">
                                      ({offer.promoTermMonths} mo)
                                    </span>
                                  )}
                                </p>
                              </div>
                            )}
                            <div>
                              <p className="text-xs text-muted-foreground">Contract</p>
                              <p className="font-medium">
                                {offer.contractMonths ? `${offer.contractMonths} months` : 'No contract'}
                              </p>
                            </div>
                          </div>

                          {offer.features.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {offer.features.map((f) => (
                                <Badge key={f.featureKey} variant="outline" className="text-xs">
                                  {f.featureKey.replace(/_/g, ' ')}: {f.featureValue}
                                </Badge>
                              ))}
                            </div>
                          )}

                          <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Last seen: {formatDate(offer.lastSeenAt)}
                            </span>
                            {offer.sourceUrl && (
                              <a
                                href={offer.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline inline-flex items-center gap-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                View source
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Recent Snapshots */}
      {snapshots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Data Collection History</CardTitle>
            <CardDescription>Recent data refresh snapshots</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {snapshots.map((snapshot) => (
                <div
                  key={snapshot.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-sm">{formatDate(snapshot.fetchedAt)}</p>
                    <p className="text-xs text-muted-foreground">
                      Parser v{snapshot.parserVersion}
                    </p>
                  </div>
                  <a
                    href={snapshot.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Source
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
