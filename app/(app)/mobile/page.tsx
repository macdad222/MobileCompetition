'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import {
  Smartphone, Apple, Loader2, Sparkles, ArrowRightLeft, DollarSign,
  Shield, Zap, Star, TrendingUp, Gift, ChevronRight, AlertTriangle,
  CheckCircle2, XCircle, Phone, Wifi, Globe, RefreshCw, Clock,
} from 'lucide-react';

interface Provider {
  id: string;
  slug: string;
  displayName: string;
}

interface DeviceIncentive {
  id: string;
  providerId: string;
  deviceName: string;
  deviceBrand: string;
  deviceModel: string;
  incentiveType: string;
  incentiveValue: number | null;
  deviceRetailPrice: number | null;
  monthlyCredit: number | null;
  creditMonths: number | null;
  conditions: string | null;
  requiresTradeIn: boolean;
  requiresNewLine: boolean;
  requiresPortIn: boolean;
  minPlanTier: string | null;
  provider: { id: string; slug: string; displayName: string };
}

interface ContractBuyout {
  id: string;
  providerId: string;
  maxBuyoutAmount: number | null;
  perLineMax: number | null;
  buyoutMethod: string;
  conditions: string | null;
  requiresPortIn: boolean;
  requiresTradeIn: boolean;
  coverageScope: string | null;
  submissionDeadline: string | null;
  paymentTimeline: string | null;
  proofRequired: string | null;
  maxLinesEligible: number | null;
  excludedPlans: string | null;
  finePrint: string | null;
  stackableWithDeals: boolean;
  provider: { id: string; slug: string; displayName: string };
}

interface MobileOffer {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  priceMonthly: number | null;
  unlimitedData: boolean;
  provider: { id: string; displayName: string; slug: string };
  features: { featureKey: string; featureValue: string }[];
}

const INCENTIVE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  FREE_WITH_PLAN: { label: 'Free with Plan', color: 'bg-green-100 text-green-800' },
  BOGO: { label: 'Buy One Get One', color: 'bg-purple-100 text-purple-800' },
  TRADE_IN_CREDIT: { label: 'Trade-In Credit', color: 'bg-blue-100 text-blue-800' },
  MONTHLY_CREDIT: { label: 'Monthly Credit', color: 'bg-amber-100 text-amber-800' },
  DISCOUNT: { label: 'Discount', color: 'bg-slate-100 text-slate-800' },
};

const BRAND_COLORS: Record<string, string> = {
  Apple: 'border-l-slate-500',
  Samsung: 'border-l-blue-500',
  Google: 'border-l-green-500',
};

export default function MobileIntelligencePage() {
  const { toast } = useToast();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [offers, setOffers] = useState<MobileOffer[]>([]);
  const [incentives, setIncentives] = useState<DeviceIncentive[]>([]);
  const [buyouts, setBuyouts] = useState<ContractBuyout[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [providerAnalysis, setProviderAnalysis] = useState<any>(null);
  const [providerAnalysisAt, setProviderAnalysisAt] = useState<string | null>(null);
  const [crossAnalysis, setCrossAnalysis] = useState<any>(null);
  const [crossAnalysisAt, setCrossAnalysisAt] = useState<string | null>(null);
  const [analysisProvider, setAnalysisProvider] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('plans');

  useEffect(() => {
    Promise.all([fetchProviders(), fetchOffers(), fetchDeviceData()])
      .finally(() => setLoading(false));
  }, []);

  // Load cached analyses once providers are loaded
  useEffect(() => {
    if (providers.length > 0) {
      fetchCachedCrossAnalysis();
      providers.forEach(p => fetchCachedProviderMobileAnalysis(p.id));
    }
  }, [providers]);

  async function fetchCachedCrossAnalysis() {
    try {
      const res = await fetch('/api/insights/cached?insightType=MOBILE_DEEP_ANALYSIS&category=cross-provider');
      const data = await res.json();
      if (data.insight?.content) {
        setCrossAnalysis(data.insight.content);
        setCrossAnalysisAt(data.insight.generatedAt);
      }
    } catch (error) { /* silent */ }
  }

  async function fetchCachedProviderMobileAnalysis(providerId: string) {
    try {
      const res = await fetch(`/api/insights/cached?insightType=MOBILE_DEEP_ANALYSIS&providerId=${providerId}`);
      const data = await res.json();
      if (data.insight?.content) {
        setProviderAnalysis(data.insight.content);
        setProviderAnalysisAt(data.insight.generatedAt);
      }
    } catch (error) { /* silent */ }
  }

  async function fetchProviders() {
    try {
      const res = await fetch('/api/providers');
      const data = await res.json();
      setProviders(data.providers || []);
    } catch (e) { console.error('Failed to fetch providers:', e); }
  }

  async function fetchOffers() {
    try {
      const res = await fetch('/api/offers?categories=MOBILE');
      const data = await res.json();
      setOffers(data.offers || []);
    } catch (e) { console.error('Failed to fetch offers:', e); }
  }

  async function fetchDeviceData() {
    try {
      const res = await fetch('/api/device-incentives');
      const data = await res.json();
      setIncentives(data.deviceIncentives || []);
      setBuyouts(data.contractBuyouts || []);
      setBrands(data.brands || []);
    } catch (e) { console.error('Failed to fetch device data:', e); }
  }

  async function runProviderAnalysis(providerId: string) {
    setAnalysisLoading(true);
    setAnalysisProvider(providerId);
    try {
      const res = await fetch('/api/analysis/mobile-deep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'provider', providerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProviderAnalysis(data.analysis);
      setProviderAnalysisAt(new Date().toISOString());
      setActiveTab('analysis');
      toast({ title: 'Analysis Complete', description: 'Mobile deep analysis generated — see results below.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to generate analysis', variant: 'destructive' });
    } finally {
      setAnalysisLoading(false);
    }
  }

  async function runCrossProviderAnalysis() {
    setAnalysisLoading(true);
    setAnalysisProvider('cross');
    try {
      const res = await fetch('/api/analysis/mobile-deep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'cross-provider' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCrossAnalysis(data.analysis);
      setCrossAnalysisAt(new Date().toISOString());
      setActiveTab('analysis');
      toast({ title: 'Analysis Complete', description: 'Cross-provider comparison ready — viewing results now.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to generate analysis', variant: 'destructive' });
    } finally {
      setAnalysisLoading(false);
    }
  }

  const filteredIncentives = incentives.filter(d => {
    if (selectedBrand !== 'all' && d.deviceBrand !== selectedBrand) return false;
    if (selectedProvider !== 'all' && d.provider.id !== selectedProvider) return false;
    return true;
  });

  const uniqueDevices = Array.from(new Set(incentives.map(d => d.deviceName)));
  const totalValue = incentives.reduce((sum, d) => sum + (d.incentiveValue || 0), 0);
  const avgRetail = incentives.length > 0
    ? incentives.reduce((sum, d) => sum + (d.deviceRetailPrice || 0), 0) / incentives.length
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Smartphone className="h-8 w-8" />
            Mobile Intelligence
          </h1>
          <p className="text-muted-foreground mt-1">
            Deep analysis of mobile plans, device deals, and switching incentives across providers
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
            onClick={runCrossProviderAnalysis}
            disabled={analysisLoading}
            className={crossAnalysis ? '' : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700'}
            variant={crossAnalysis ? 'outline' : 'default'}
          >
            {analysisLoading && analysisProvider === 'cross' ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</>
            ) : crossAnalysis ? (
              <><RefreshCw className="mr-2 h-4 w-4" />Refresh Cross-Provider</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" />Cross-Provider Comparison</>
            )}
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{offers.length}</div>
            <p className="text-sm text-muted-foreground">Mobile Plans</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{incentives.length}</div>
            <p className="text-sm text-muted-foreground">Device Deals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{buyouts.length}</div>
            <p className="text-sm text-muted-foreground">Buyout Offers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{uniqueDevices.length}</div>
            <p className="text-sm text-muted-foreground">Unique Devices</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="plans">Plans Overview</TabsTrigger>
          <TabsTrigger value="devices">Device Deals</TabsTrigger>
          <TabsTrigger value="switching">Switching Analysis</TabsTrigger>
          <TabsTrigger value="analysis" className="relative">
            Deep Comparison
            {(crossAnalysis || providerAnalysis) && activeTab !== 'analysis' && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-violet-500 rounded-full animate-pulse" />
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Plans Overview ─────────────────────────── */}
        <TabsContent value="plans" className="space-y-4">
          {providers.filter(p => offers.some(o => o.provider.id === p.id)).map(provider => {
            const providerOffers = offers.filter(o => o.provider.id === provider.id);
            const providerDevices = incentives.filter(d => d.provider.id === provider.id);
            return (
              <Card key={provider.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{provider.displayName}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{providerOffers.length} plans</Badge>
                      <Badge variant="outline" className="bg-violet-50 text-violet-700">{providerDevices.length} device deals</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {providerOffers.map(offer => {
                      const network = offer.features.find(f => f.featureKey === 'network')?.featureValue;
                      const hotspot = offer.features.find(f => f.featureKey === 'hotspot')?.featureValue;
                      return (
                        <div key={offer.id} className="border rounded-lg p-4 space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="font-semibold text-sm">{offer.displayName}</div>
                            <div className="text-lg font-bold text-green-700">
                              ${offer.priceMonthly || '?'}<span className="text-xs font-normal text-muted-foreground">/line</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">{offer.description}</p>
                          <div className="flex flex-wrap gap-1">
                            {network && <Badge variant="secondary" className="text-xs"><Wifi className="h-3 w-3 mr-1" />{network}</Badge>}
                            {hotspot && <Badge variant="secondary" className="text-xs">Hotspot: {hotspot}</Badge>}
                            {offer.unlimitedData && <Badge className="text-xs bg-blue-100 text-blue-800">Unlimited</Badge>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {providerDevices.length > 0 && (
                    <>
                      <Separator className="my-4" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1"><Gift className="h-4 w-4" /> Top Device Deals</p>
                        <div className="grid gap-2 md:grid-cols-2">
                          {providerDevices.slice(0, 4).map((d, i) => (
                            <div key={i} className="flex items-center justify-between text-sm border rounded p-2">
                              <div>
                                <span className="font-medium">{d.deviceName}</span>
                                <Badge className={`ml-2 text-xs ${INCENTIVE_TYPE_LABELS[d.incentiveType]?.color || ''}`}>
                                  {INCENTIVE_TYPE_LABELS[d.incentiveType]?.label || d.incentiveType}
                                </Badge>
                              </div>
                              <div className="text-right">
                                {d.incentiveType === 'FREE_WITH_PLAN' ? (
                                  <span className="font-bold text-green-600">FREE</span>
                                ) : (
                                  <span className="font-bold text-amber-600">${d.incentiveValue} off</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* ── Tab 2: Device Deals ───────────────────────────── */}
        <TabsContent value="devices" className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium">Filter by brand:</span>
            <Button size="sm" variant={selectedBrand === 'all' ? 'default' : 'outline'} onClick={() => setSelectedBrand('all')}>All</Button>
            {brands.map(b => (
              <Button key={b} size="sm" variant={selectedBrand === b ? 'default' : 'outline'} onClick={() => setSelectedBrand(b)}>{b}</Button>
            ))}
            <Separator orientation="vertical" className="h-6 mx-2" />
            <span className="text-sm font-medium">Provider:</span>
            <Button size="sm" variant={selectedProvider === 'all' ? 'default' : 'outline'} onClick={() => setSelectedProvider('all')}>All</Button>
            {providers.map(p => (
              <Button key={p.id} size="sm" variant={selectedProvider === p.id ? 'default' : 'outline'} onClick={() => setSelectedProvider(p.id)}>{p.displayName}</Button>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredIncentives.map((d) => {
              const effectiveCost = d.incentiveType === 'FREE_WITH_PLAN'
                ? 0
                : (d.deviceRetailPrice || 0) - (d.incentiveValue || 0);
              const isNew = d.deviceName.includes('17') || d.deviceName.includes('S25') || d.deviceName.includes('Fold 6');
              return (
                <Card key={d.id} className={`border-l-4 ${BRAND_COLORS[d.deviceBrand] || 'border-l-gray-300'}`}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{d.deviceName}</span>
                          {isNew && <Badge className="text-xs bg-emerald-100 text-emerald-800">New</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{d.deviceModel}</p>
                        <p className="text-xs text-muted-foreground">{d.provider.displayName}</p>
                      </div>
                      <Badge className={INCENTIVE_TYPE_LABELS[d.incentiveType]?.color || ''}>
                        {INCENTIVE_TYPE_LABELS[d.incentiveType]?.label || d.incentiveType}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Retail:</span>
                        <span className="ml-1 font-medium">${d.deviceRetailPrice || '?'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">You Pay:</span>
                        <span className={`ml-1 font-bold ${effectiveCost === 0 ? 'text-green-600' : 'text-amber-600'}`}>
                          {effectiveCost === 0 ? 'FREE' : `$${effectiveCost}`}
                        </span>
                      </div>
                      {d.monthlyCredit && (
                        <>
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Credit:</span>
                            <span className="ml-1">${d.monthlyCredit}/mo x {d.creditMonths} months</span>
                          </div>
                        </>
                      )}
                    </div>
                    {d.minPlanTier && (
                      <p className="text-xs text-slate-500">Requires: <span className="font-medium">{d.minPlanTier}</span></p>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {d.requiresTradeIn && <Badge variant="outline" className="text-xs">Trade-In Required</Badge>}
                      {d.requiresNewLine && <Badge variant="outline" className="text-xs">New Line</Badge>}
                      {d.requiresPortIn && <Badge variant="outline" className="text-xs">Port-In</Badge>}
                    </div>
                    {d.conditions && (
                      <p className="text-xs text-muted-foreground border-t pt-2">{d.conditions}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredIncentives.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Gift className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No device deals found. Try refreshing data with the MOBILE category selected.</p>
            </div>
          )}
        </TabsContent>

        {/* ── Tab 3: Switching Analysis ─────────────────────── */}
        <TabsContent value="switching" className="space-y-6">
          {/* Overview comparison table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5" />
                Contract Buyout Comparison
              </CardTitle>
              <CardDescription>Side-by-side comparison of what each provider will pay when you switch</CardDescription>
            </CardHeader>
            <CardContent>
              {buyouts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="text-left py-3 px-3 font-semibold w-48">Provider</th>
                        <th className="text-right py-3 px-3 font-semibold">Max Buyout</th>
                        <th className="text-right py-3 px-3 font-semibold">Per Line</th>
                        <th className="text-left py-3 px-3 font-semibold">Payment Method</th>
                        <th className="text-left py-3 px-3 font-semibold">Submission Window</th>
                        <th className="text-left py-3 px-3 font-semibold">Payment Timeline</th>
                        <th className="text-center py-3 px-3 font-semibold">Max Lines</th>
                        <th className="text-center py-3 px-3 font-semibold">Stackable</th>
                      </tr>
                    </thead>
                    <tbody>
                      {buyouts.sort((a, b) => (b.maxBuyoutAmount || 0) - (a.maxBuyoutAmount || 0)).map((b, idx) => (
                        <tr key={b.id} className={`border-b hover:bg-slate-50 ${idx === 0 ? 'bg-green-50/50' : ''}`}>
                          <td className="py-3 px-3">
                            <div className="font-medium">{b.provider.displayName}</div>
                            {idx === 0 && <Badge className="text-xs bg-green-100 text-green-800 mt-1">Highest Buyout</Badge>}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-green-700 text-lg">${b.maxBuyoutAmount || '?'}</td>
                          <td className="py-3 px-3 text-right">${b.perLineMax || '?'}/line</td>
                          <td className="py-3 px-3">
                            <Badge variant="outline" className="text-xs">{b.buyoutMethod.replace(/_/g, ' ')}</Badge>
                          </td>
                          <td className="py-3 px-3 text-xs">{b.submissionDeadline || 'N/A'}</td>
                          <td className="py-3 px-3 text-xs">{b.paymentTimeline || 'N/A'}</td>
                          <td className="py-3 px-3 text-center">{b.maxLinesEligible || '?'}</td>
                          <td className="py-3 px-3 text-center">
                            {b.stackableWithDeals ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-400 mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No buyout data available. Refresh data to populate.</p>
              )}
            </CardContent>
          </Card>

          {/* Detailed T&C comparison cards */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Terms & Conditions Highlights
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {buyouts.sort((a, b) => (b.maxBuyoutAmount || 0) - (a.maxBuyoutAmount || 0)).map(b => (
                <Card key={b.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{b.provider.displayName}</CardTitle>
                      <span className="text-xl font-bold text-green-700">up to ${b.maxBuyoutAmount}/line</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-slate-700">What&apos;s Covered</span>
                      <p className="text-muted-foreground mt-0.5">{b.coverageScope || 'ETFs and remaining device payments'}</p>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="font-medium text-slate-700">Payment Method</span>
                        <p className="text-muted-foreground mt-0.5">{b.buyoutMethod.replace(/_/g, ' ')}</p>
                      </div>
                      <div>
                        <span className="font-medium text-slate-700">Payment Timeline</span>
                        <p className="text-muted-foreground mt-0.5">{b.paymentTimeline || 'Varies'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-slate-700">Submission Deadline</span>
                        <p className="text-muted-foreground mt-0.5">{b.submissionDeadline || 'Contact provider'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-slate-700">Max Lines Eligible</span>
                        <p className="text-muted-foreground mt-0.5">{b.maxLinesEligible ? `${b.maxLinesEligible} lines` : 'Varies'}</p>
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <span className="font-medium text-slate-700">Proof Required</span>
                      <p className="text-muted-foreground mt-0.5">{b.proofRequired || 'Final bill from previous carrier'}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {b.requiresPortIn && <Badge variant="outline" className="text-xs">Port-In Required</Badge>}
                      {b.requiresTradeIn && <Badge variant="outline" className="text-xs bg-amber-50">Trade-In Required</Badge>}
                      {b.stackableWithDeals && <Badge className="text-xs bg-green-100 text-green-800">Stackable with Device Deals</Badge>}
                    </div>
                    {b.excludedPlans && (
                      <div className="bg-amber-50 rounded p-2 border border-amber-200">
                        <span className="font-medium text-amber-800 text-xs flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Plan Restrictions
                        </span>
                        <p className="text-amber-700 text-xs mt-0.5">{b.excludedPlans}</p>
                      </div>
                    )}
                    {b.finePrint && (
                      <div className="bg-slate-50 rounded p-2 border">
                        <span className="font-medium text-slate-600 text-xs">Fine Print</span>
                        <p className="text-slate-500 text-xs mt-0.5">{b.finePrint}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Switching Cost Calculator - FIXED */}
          <Card>
            <CardHeader>
              <CardTitle>Switching Value Calculator</CardTitle>
              <CardDescription>
                Total switching value = Contract buyout (covers your old carrier costs) + Best device deal (saves you on new phone).
                These are separate incentives that stack together.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {buyouts.sort((a, b) => (b.maxBuyoutAmount || 0) - (a.maxBuyoutAmount || 0)).map(b => {
                  const providerIncentives = incentives.filter(d => d.provider.id === b.providerId);
                  // Best device deal = the one with the highest incentive value (what provider pays toward device)
                  const bestDeviceDeal = providerIncentives
                    .sort((a, c) => (c.incentiveValue || 0) - (a.incentiveValue || 0))[0];
                  const bestDeviceValue = Number(bestDeviceDeal?.incentiveValue || 0);
                  const buyoutValue = Number(b.perLineMax || 0);
                  // Total switching value per line = buyout credit + device deal value
                  const totalPerLine = buyoutValue + bestDeviceValue;
                  const canStack = b.stackableWithDeals;

                  return (
                    <Card key={b.id} className="border-2">
                      <CardContent className="pt-4 space-y-3">
                        <div className="font-semibold text-lg">{b.provider.displayName}</div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Contract Buyout (per line):</span>
                            <span className="font-medium text-green-700">up to ${buyoutValue}</span>
                          </div>
                          <p className="text-xs text-muted-foreground pl-2 -mt-1">
                            Covers your ETF / device balance at old carrier
                          </p>
                          {bestDeviceDeal && (
                            <>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Best Device Deal:</span>
                                <span className="font-medium text-blue-700">
                                  {bestDeviceDeal.incentiveType === 'FREE_WITH_PLAN'
                                    ? `${bestDeviceDeal.deviceName} FREE`
                                    : `$${bestDeviceValue} off ${bestDeviceDeal.deviceName}`}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground pl-2 -mt-1">
                                {bestDeviceDeal.incentiveType === 'FREE_WITH_PLAN'
                                  ? `Retail $${bestDeviceDeal.deviceRetailPrice} — provider covers full cost`
                                  : `Retail $${bestDeviceDeal.deviceRetailPrice} — you pay $${(bestDeviceDeal.deviceRetailPrice || 0) - bestDeviceValue}`}
                              </p>
                            </>
                          )}
                          <Separator />
                          {canStack ? (
                            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                              <div className="flex justify-between font-bold text-lg">
                                <span>Total Value / Line:</span>
                                <span className="text-green-700">up to ${totalPerLine}</span>
                              </div>
                              <p className="text-xs text-green-600 mt-1">Buyout + device deal stack together</p>
                            </div>
                          ) : (
                            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                              <div className="flex justify-between font-bold text-lg">
                                <span>Buyout Value / Line:</span>
                                <span className="text-amber-700">up to ${buyoutValue}</span>
                              </div>
                              <p className="text-xs text-amber-600 mt-1">Cannot combine with device deals</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 4: Deep Comparison ────────────────────────── */}
        <TabsContent value="analysis" className="space-y-4">
          {/* Cross-provider analysis */}
          {crossAnalysis && (
            <Card className="border-violet-200 bg-violet-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-violet-600" />
                  Cross-Provider Mobile Comparison
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {crossAnalysis.marketOverview === 'Analysis pending.' ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                    <p className="font-medium flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" /> Analysis could not be fully generated
                    </p>
                    <p className="mt-1">
                      The LLM response could not be parsed into structured results. This can happen with certain models
                      or when the data set is too large. Try again or check your LLM configuration in Settings.
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-700">{crossAnalysis.marketOverview}</p>
                )}

                {crossAnalysis.planComparison?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Plan Tier Comparison</h4>
                    <div className="space-y-3">
                      {crossAnalysis.planComparison.map((tier: any, i: number) => (
                        <div key={i} className="border rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <Badge>{tier.tier}</Badge>
                            <span className="text-sm text-green-700 font-medium">Best: {tier.bestValue}</span>
                          </div>
                          <div className="grid gap-2 md:grid-cols-3">
                            {tier.providers?.map((p: any, j: number) => (
                              <div key={j} className="text-sm bg-white rounded p-2">
                                <div className="font-medium">{p.provider}</div>
                                <div className="text-muted-foreground">{p.planName} - ${p.pricePerLine}/line</div>
                                <div className="text-xs text-slate-500">{p.keyDifferentiator}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {crossAnalysis.deviceComparison?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Device Deal Comparison</h4>
                    <div className="space-y-3">
                      {crossAnalysis.deviceComparison.map((device: any, i: number) => (
                        <div key={i} className="border rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <span className="font-medium">{device.deviceName}</span>
                              <span className="text-sm text-muted-foreground ml-2">MSRP ${device.retailPrice}</span>
                            </div>
                            <Badge className="bg-green-100 text-green-800">Best: {device.bestDeal}</Badge>
                          </div>
                          <div className="grid gap-2 md:grid-cols-3">
                            {device.providerDeals?.map((deal: any, j: number) => (
                              <div key={j} className="text-sm bg-white rounded p-2">
                                <div className="font-medium">{deal.provider}</div>
                                <div className={`font-bold ${deal.effectiveCost === 0 ? 'text-green-600' : 'text-amber-600'}`}>
                                  {deal.effectiveCost === 0 ? 'FREE' : `$${deal.effectiveCost}`}
                                </div>
                                <div className="text-xs text-muted-foreground">{deal.conditions}</div>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{device.bestDealReason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {crossAnalysis.buyoutWinner && (
                  <div className="bg-white rounded-lg p-4 border">
                    <h4 className="font-semibold mb-1">Best Switching Deal</h4>
                    <p className="text-green-700 font-medium">{crossAnalysis.buyoutWinner}</p>
                  </div>
                )}

                {crossAnalysis.overallRecommendation && (
                  <div className="bg-white rounded-lg p-4 border">
                    <h4 className="font-semibold mb-1">Overall Recommendation</h4>
                    <p className="text-slate-700">{crossAnalysis.overallRecommendation}</p>
                  </div>
                )}

                {crossAnalysis.strategicInsights?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Strategic Insights</h4>
                    <ul className="space-y-1">
                      {crossAnalysis.strategicInsights.map((insight: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <TrendingUp className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Per-provider analysis triggers */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {providers.filter(p => offers.some(o => o.provider.id === p.id)).map(p => (
              <Card key={p.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold">{p.displayName}</div>
                    <Badge variant="outline">
                      {incentives.filter(d => d.provider.id === p.id).length} deals
                    </Badge>
                  </div>
                  <Button
                    onClick={() => runProviderAnalysis(p.id)}
                    disabled={analysisLoading}
                    className="w-full"
                    variant="outline"
                  >
                    {analysisLoading && analysisProvider === p.id ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</>
                    ) : (
                      <><Sparkles className="mr-2 h-4 w-4" />Analyze Mobile Portfolio</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Provider analysis results */}
          {providerAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  Provider Mobile Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {providerAnalysis.executiveSummary === 'Analysis pending.' ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                    <p className="font-medium flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" /> Analysis could not be fully generated
                    </p>
                    <p className="mt-1">
                      The LLM response could not be parsed into structured results. Try again or check your LLM settings.
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-700">{providerAnalysis.executiveSummary}</p>
                )}

                {providerAnalysis.planTierAnalysis?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Plan Tier Analysis</h4>
                    <div className="grid gap-3 md:grid-cols-2">
                      {providerAnalysis.planTierAnalysis.map((tier: any, i: number) => (
                        <div key={i} className="border rounded-lg p-3 space-y-2">
                          <div className="flex justify-between">
                            <span className="font-medium">{tier.tier}</span>
                            <Badge variant={tier.valueRating === 'excellent' ? 'default' : 'outline'}>
                              {tier.valueRating}
                            </Badge>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Price:</span> ${tier.pricePerLine}/line
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Best Device:</span> {tier.bestDeviceDeal}
                          </div>
                          {tier.totalCostOfOwnership24Mo && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">24mo TCO:</span> ${tier.totalCostOfOwnership24Mo}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {providerAnalysis.iphone17vs16?.comparison && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Phone className="h-4 w-4" /> iPhone 17 vs iPhone 16 Value
                    </h4>
                    <p className="text-sm text-slate-700">{providerAnalysis.iphone17vs16.comparison}</p>
                    <p className="text-sm font-medium text-blue-700 mt-1">{providerAnalysis.iphone17vs16.recommendation}</p>
                    <p className="text-xs text-muted-foreground mt-1">{providerAnalysis.iphone17vs16.costDifference}</p>
                  </div>
                )}

                {providerAnalysis.deviceDealAnalysis?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Device Deal Rankings</h4>
                    <div className="space-y-2">
                      {providerAnalysis.deviceDealAnalysis.map((d: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{d.deviceName}</span>
                            <Badge className={INCENTIVE_TYPE_LABELS[d.incentiveType]?.color || ''} >
                              {INCENTIVE_TYPE_LABELS[d.incentiveType]?.label || d.incentiveType}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-muted-foreground">Retail: ${d.retailPrice}</span>
                            <span className={`font-bold ${d.effectiveCost === 0 ? 'text-green-600' : 'text-amber-600'}`}>
                              {d.effectiveCost === 0 ? 'FREE' : `$${d.effectiveCost}`}
                            </span>
                            <Badge variant={d.valueScore === 'excellent' ? 'default' : 'outline'} className="text-xs">
                              {d.valueScore}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {providerAnalysis.bestValueScenarios?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Best Value Scenarios</h4>
                    <div className="grid gap-3 md:grid-cols-2">
                      {providerAnalysis.bestValueScenarios.map((s: any, i: number) => (
                        <div key={i} className="border rounded-lg p-3 space-y-1">
                          <div className="font-medium text-sm">{s.scenario}</div>
                          <div className="text-sm text-muted-foreground">{s.plan} + {s.device}</div>
                          <div className="flex justify-between text-sm">
                            <span>Monthly: <span className="font-medium">{s.monthlyCost}</span></span>
                            <span>24mo: <span className="font-medium">{s.totalCost24Mo}</span></span>
                          </div>
                          <p className="text-xs text-green-700">{s.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {providerAnalysis.strategicRecommendations?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Recommendations</h4>
                    <ul className="space-y-1">
                      {providerAnalysis.strategicRecommendations.map((r: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Star className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
