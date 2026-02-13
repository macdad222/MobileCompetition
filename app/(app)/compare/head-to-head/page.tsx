'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatSpeed, getProviderColor } from '@/lib/utils';
import {
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Loader2,
  CheckCircle2,
  XCircle,
  Minus,
  Sparkles,
  Trophy,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Provider {
  id: string;
  slug: string;
  displayName: string;
  providerType: string;
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
  provider: Provider;
  features: { featureKey: string; featureValue: string }[];
}

const PROVIDERS_LIST = [
  { id: 'comcast-business', name: 'Comcast Business', color: '#0070d1' },
  { id: 'att-business', name: 'AT&T Business', color: '#00a8e0' },
  { id: 'verizon-business', name: 'Verizon Business', color: '#cd040b' },
  { id: 'tmobile-business', name: 'T-Mobile for Business', color: '#e20074' },
  { id: 'spectrum-business', name: 'Spectrum Business', color: '#0077c8' },
  { id: 'cox-business', name: 'Cox Business', color: '#f26522' },
  { id: 'optimum-business', name: 'Optimum Business', color: '#003d79' },
];

const CATEGORIES = [
  { id: 'BROADBAND', name: 'Broadband' },
  { id: 'MOBILE', name: 'Mobile' },
  { id: 'VOICE', name: 'Voice' },
];

interface ComparisonAnalysis {
  summary: string;
  winner: string | null;
  winnerReason: string;
  provider1Strengths: string[];
  provider2Strengths: string[];
  recommendation: string;
}

export default function HeadToHeadPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [provider1, setProvider1] = useState('comcast-business');
  const [provider2, setProvider2] = useState('att-business');
  const [category, setCategory] = useState('BROADBAND');
  const [offers1, setOffers1] = useState<Offer[]>([]);
  const [offers2, setOffers2] = useState<Offer[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<ComparisonAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (provider1 && provider2 && category) {
      fetchComparison();
      setAiAnalysis(null); // Clear AI analysis when providers change
    }
  }, [provider1, provider2, category]);

  async function generateAIAnalysis() {
    setAiLoading(true);
    try {
      const res = await fetch('/api/analysis/comparison', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider1Slug: provider1,
          provider2Slug: provider2,
          category,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate analysis');
      }
      
      setAiAnalysis(data.analysis);
      toast({
        title: 'AI Analysis Complete',
        description: 'The comparison has been analyzed by AI.',
      });
    } catch (error) {
      console.error('Failed to generate AI analysis:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Failed to generate AI analysis',
        variant: 'destructive',
      });
    } finally {
      setAiLoading(false);
    }
  }

  async function fetchComparison() {
    setLoading(true);
    try {
      const [res1, res2] = await Promise.all([
        fetch(`/api/offers?providerIds=${provider1}&categories=${category}`),
        fetch(`/api/offers?providerIds=${provider2}&categories=${category}`),
      ]);
      
      const [data1, data2] = await Promise.all([res1.json(), res2.json()]);
      
      setOffers1(data1.offers || []);
      setOffers2(data2.offers || []);
    } catch (error) {
      console.error('Failed to fetch comparison:', error);
    } finally {
      setLoading(false);
    }
  }

  function swapProviders() {
    const temp = provider1;
    setProvider1(provider2);
    setProvider2(temp);
  }

  const provider1Info = PROVIDERS_LIST.find((p) => p.id === provider1);
  const provider2Info = PROVIDERS_LIST.find((p) => p.id === provider2);

  // Find best price for each provider
  const bestPrice1 = offers1.length > 0
    ? Math.min(...offers1.filter((o) => o.priceMonthly).map((o) => o.priceMonthly!))
    : null;
  const bestPrice2 = offers2.length > 0
    ? Math.min(...offers2.filter((o) => o.priceMonthly).map((o) => o.priceMonthly!))
    : null;

  // Find top speed for each provider
  const topSpeed1 = offers1.length > 0
    ? Math.max(...offers1.filter((o) => o.downloadMbps).map((o) => o.downloadMbps!))
    : null;
  const topSpeed2 = offers2.length > 0
    ? Math.max(...offers2.filter((o) => o.downloadMbps).map((o) => o.downloadMbps!))
    : null;

  // Collect all unique features
  const allFeatures = new Set<string>();
  [...offers1, ...offers2].forEach((offer) => {
    offer.features.forEach((f) => allFeatures.add(f.featureKey));
  });

  function getFeatureForProvider(offers: Offer[], featureKey: string): string | null {
    for (const offer of offers) {
      const feature = offer.features.find((f) => f.featureKey === featureKey);
      if (feature && feature.featureValue !== 'false') {
        return feature.featureValue;
      }
    }
    return null;
  }

  const ComparisonIcon = ({ better, equal }: { better: boolean; equal?: boolean }) => {
    if (equal) return <Minus className="h-4 w-4 text-muted-foreground" />;
    return better ? (
      <CheckCircle2 className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Head-to-Head Comparison</h1>
        <p className="text-muted-foreground mt-1">
          Deep dive comparison between two providers
        </p>
      </div>

      {/* Provider Selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Provider 1</label>
              <Select value={provider1} onValueChange={setProvider1}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS_LIST.map((p) => (
                    <SelectItem key={p.id} value={p.id} disabled={p.id === provider2}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" size="icon" onClick={swapProviders} className="mt-6">
              <ArrowRight className="h-4 w-4" />
              <ArrowLeft className="h-4 w-4 -ml-2" />
            </Button>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Provider 2</label>
              <Select value={provider2} onValueChange={setProvider2}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS_LIST.map((p) => (
                    <SelectItem key={p.id} value={p.id} disabled={p.id === provider1}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[150px]">
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Provider 1 Summary */}
            <Card style={{ borderTopColor: provider1Info?.color, borderTopWidth: '4px' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: provider1Info?.color }}
                  />
                  {provider1Info?.name}
                </CardTitle>
                <CardDescription>
                  {offers1.length} {category.toLowerCase()} plans available
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Starting at</p>
                    <p className="text-2xl font-bold">
                      {bestPrice1 ? formatCurrency(bestPrice1) : 'N/A'}
                      <span className="text-sm font-normal text-muted-foreground">/mo</span>
                    </p>
                    {bestPrice1 && bestPrice2 && (
                      <ComparisonIcon better={bestPrice1 <= bestPrice2} equal={bestPrice1 === bestPrice2} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Top Speed</p>
                    <p className="text-2xl font-bold">{formatSpeed(topSpeed1)}</p>
                    {topSpeed1 && topSpeed2 && (
                      <ComparisonIcon better={topSpeed1 >= topSpeed2} equal={topSpeed1 === topSpeed2} />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Provider 2 Summary */}
            <Card style={{ borderTopColor: provider2Info?.color, borderTopWidth: '4px' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: provider2Info?.color }}
                  />
                  {provider2Info?.name}
                </CardTitle>
                <CardDescription>
                  {offers2.length} {category.toLowerCase()} plans available
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Starting at</p>
                    <p className="text-2xl font-bold">
                      {bestPrice2 ? formatCurrency(bestPrice2) : 'N/A'}
                      <span className="text-sm font-normal text-muted-foreground">/mo</span>
                    </p>
                    {bestPrice1 && bestPrice2 && (
                      <ComparisonIcon better={bestPrice2 <= bestPrice1} equal={bestPrice1 === bestPrice2} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Top Speed</p>
                    <p className="text-2xl font-bold">{formatSpeed(topSpeed2)}</p>
                    {topSpeed1 && topSpeed2 && (
                      <ComparisonIcon better={topSpeed2 >= topSpeed1} equal={topSpeed1 === topSpeed2} />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Analysis Section */}
          <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <CardTitle>AI-Powered Analysis</CardTitle>
                </div>
                <Button 
                  onClick={generateAIAnalysis} 
                  disabled={aiLoading || offers1.length === 0 || offers2.length === 0}
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
                Get intelligent insights comparing these providers using your configured LLM
              </CardDescription>
            </CardHeader>
            {aiAnalysis && (
              <CardContent className="space-y-4">
                {/* Winner Badge */}
                {aiAnalysis.winner && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                    <Trophy className="h-5 w-5 text-green-600" />
                    <div>
                      <span className="font-semibold text-green-800">{aiAnalysis.winner}</span>
                      <span className="text-green-700"> comes out ahead</span>
                      {aiAnalysis.winnerReason && (
                        <p className="text-sm text-green-600 mt-1">{aiAnalysis.winnerReason}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div>
                  <h4 className="font-semibold mb-2">Executive Summary</h4>
                  <p className="text-muted-foreground">{aiAnalysis.summary}</p>
                </div>

                {/* Strengths Comparison */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-slate-50">
                    <h4 className="font-semibold mb-2" style={{ color: provider1Info?.color }}>
                      {provider1Info?.name} Strengths
                    </h4>
                    <ul className="space-y-1">
                      {aiAnalysis.provider1Strengths.map((strength, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-50">
                    <h4 className="font-semibold mb-2" style={{ color: provider2Info?.color }}>
                      {provider2Info?.name} Strengths
                    </h4>
                    <ul className="space-y-1">
                      {aiAnalysis.provider2Strengths.map((strength, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Recommendation */}
                {aiAnalysis.recommendation && (
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-800">Recommendation</h4>
                        <p className="text-sm text-blue-700">{aiAnalysis.recommendation}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          {/* Plan-by-Plan Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Plan Comparison</CardTitle>
              <CardDescription>Side-by-side view of all available plans</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Provider 1 Plans */}
                <div>
                  <h3 className="font-semibold mb-4" style={{ color: provider1Info?.color }}>
                    {provider1Info?.name}
                  </h3>
                  {offers1.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No plans available. Refresh data to load.</p>
                  ) : (
                    <div className="space-y-3">
                      {offers1.map((offer) => (
                        <div key={offer.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium">{offer.displayName}</h4>
                            <span className="font-bold">{formatCurrency(offer.priceMonthly)}</span>
                          </div>
                          {offer.description && (
                            <p className="text-sm text-muted-foreground mb-2">{offer.description}</p>
                          )}
                          <div className="flex gap-4 text-sm">
                            {offer.downloadMbps && (
                              <span>Download: {formatSpeed(offer.downloadMbps)}</span>
                            )}
                            {offer.uploadMbps && (
                              <span>Upload: {formatSpeed(offer.uploadMbps)}</span>
                            )}
                          </div>
                          {offer.pricePromo && (
                            <Badge variant="secondary" className="mt-2">
                              Promo: {formatCurrency(offer.pricePromo)}/mo for {offer.promoTermMonths} mo
                            </Badge>
                          )}
                          {offer.sourceUrl && (
                            <a
                              href={offer.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-2"
                            >
                              <ExternalLink className="h-3 w-3" />
                              View source
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Provider 2 Plans */}
                <div>
                  <h3 className="font-semibold mb-4" style={{ color: provider2Info?.color }}>
                    {provider2Info?.name}
                  </h3>
                  {offers2.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No plans available. Refresh data to load.</p>
                  ) : (
                    <div className="space-y-3">
                      {offers2.map((offer) => (
                        <div key={offer.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium">{offer.displayName}</h4>
                            <span className="font-bold">{formatCurrency(offer.priceMonthly)}</span>
                          </div>
                          {offer.description && (
                            <p className="text-sm text-muted-foreground mb-2">{offer.description}</p>
                          )}
                          <div className="flex gap-4 text-sm">
                            {offer.downloadMbps && (
                              <span>Download: {formatSpeed(offer.downloadMbps)}</span>
                            )}
                            {offer.uploadMbps && (
                              <span>Upload: {formatSpeed(offer.uploadMbps)}</span>
                            )}
                          </div>
                          {offer.pricePromo && (
                            <Badge variant="secondary" className="mt-2">
                              Promo: {formatCurrency(offer.pricePromo)}/mo for {offer.promoTermMonths} mo
                            </Badge>
                          )}
                          {offer.sourceUrl && (
                            <a
                              href={offer.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-2"
                            >
                              <ExternalLink className="h-3 w-3" />
                              View source
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature Comparison Table */}
          {allFeatures.size > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Feature Comparison</CardTitle>
                <CardDescription>Features available across plans</CardDescription>
              </CardHeader>
              <CardContent>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Feature</th>
                      <th className="text-left py-2 font-medium" style={{ color: provider1Info?.color }}>
                        {provider1Info?.name}
                      </th>
                      <th className="text-left py-2 font-medium" style={{ color: provider2Info?.color }}>
                        {provider2Info?.name}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(allFeatures).sort().map((feature) => {
                      const value1 = getFeatureForProvider(offers1, feature);
                      const value2 = getFeatureForProvider(offers2, feature);
                      return (
                        <tr key={feature} className="border-b">
                          <td className="py-2 capitalize">
                            {feature.replace(/_/g, ' ')}
                          </td>
                          <td className="py-2">
                            {value1 === 'true' || value1 === 'included' ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : value1 ? (
                              <span className="text-sm">{value1}</span>
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                          </td>
                          <td className="py-2">
                            {value2 === 'true' || value2 === 'included' ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : value2 ? (
                              <span className="text-sm">{value2}</span>
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
