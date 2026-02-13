'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatSpeed, formatDate, getProviderColor } from '@/lib/utils';
import {
  ArrowUpDown,
  Filter,
  Download,
  ExternalLink,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  TrendingUp,
  Award,
  Zap,
  Lightbulb,
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
  lastSeenAt: string;
  provider: Provider;
  features: { featureKey: string; featureValue: string }[];
}

const CATEGORIES = [
  { id: 'BROADBAND', name: 'Broadband' },
  { id: 'MOBILE', name: 'Mobile' },
  { id: 'VOICE', name: 'Voice' },
  { id: 'PACKAGE', name: 'Packages' },
];

const PROVIDERS_LIST = [
  { id: 'comcast-business', name: 'Comcast Business' },
  { id: 'att-business', name: 'AT&T Business' },
  { id: 'verizon-business', name: 'Verizon Business' },
  { id: 'tmobile-business', name: 'T-Mobile for Business' },
  { id: 'spectrum-business', name: 'Spectrum Business' },
  { id: 'cox-business', name: 'Cox Business' },
  { id: 'optimum-business', name: 'Optimum Business' },
];

interface MarketInsights {
  overview: string;
  trends: string[];
  bestValue: { provider: string; plan: string; reason: string } | null;
  bestPerformance: { provider: string; plan: string; reason: string } | null;
  recommendations: string[];
}

export default function MatrixComparePage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  
  // Filters
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['BROADBAND']);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minSpeed, setMinSpeed] = useState('');
  const [sortBy, setSortBy] = useState('priceMonthly');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(true);
  
  // AI Insights
  const [aiInsights, setAiInsights] = useState<MarketInsights | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetchOffers();
    setAiInsights(null); // Clear insights when filters change
  }, [selectedProviders, selectedCategories, minPrice, maxPrice, minSpeed, sortBy, sortOrder]);

  async function generateMarketInsights() {
    setAiLoading(true);
    try {
      const res = await fetch('/api/analysis/market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCategories[0] || 'BROADBAND',
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate insights');
      }
      
      setAiInsights(data.analysis);
      toast({
        title: 'Market Insights Generated',
        description: 'AI has analyzed the current market offerings.',
      });
    } catch (error) {
      console.error('Failed to generate market insights:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Failed to generate market insights',
        variant: 'destructive',
      });
    } finally {
      setAiLoading(false);
    }
  }

  async function fetchOffers() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedProviders.length > 0) {
        params.set('providerIds', selectedProviders.join(','));
      }
      if (selectedCategories.length > 0) {
        params.set('categories', selectedCategories.join(','));
      }
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      if (minSpeed) params.set('minSpeed', minSpeed);
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);

      const res = await fetch(`/api/offers?${params.toString()}`);
      const data = await res.json();
      setOffers(data.offers || []);
      
      // Extract unique providers
      const uniqueProviders = new Map<string, Provider>();
      data.offers?.forEach((offer: Offer) => {
        if (!uniqueProviders.has(offer.provider.id)) {
          uniqueProviders.set(offer.provider.id, offer.provider);
        }
      });
      setProviders(Array.from(uniqueProviders.values()));
    } catch (error) {
      console.error('Failed to fetch offers:', error);
    } finally {
      setLoading(false);
    }
  }

  function toggleCategory(categoryId: string) {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((c) => c !== categoryId)
        : [...prev, categoryId]
    );
  }

  function toggleProvider(providerId: string) {
    setSelectedProviders((prev) =>
      prev.includes(providerId)
        ? prev.filter((p) => p !== providerId)
        : [...prev, providerId]
    );
  }

  function toggleSort(column: string) {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  }

  function exportCSV() {
    const headers = ['Provider', 'Plan Name', 'Category', 'Monthly Price', 'Promo Price', 'Download', 'Upload', 'Contract', 'Source URL'];
    const rows = offers.map((offer) => [
      offer.provider.displayName,
      offer.displayName,
      offer.category,
      offer.priceMonthly || '',
      offer.pricePromo || '',
      offer.downloadMbps || '',
      offer.uploadMbps || '',
      offer.contractMonths || '',
      offer.sourceUrl || '',
    ]);
    
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smb-offers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  const SortHeader = ({ column, label }: { column: string; label: string }) => (
    <th
      className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-muted/50"
      onClick={() => toggleSort(column)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortBy === column && (
          sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
        )}
      </div>
    </th>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Matrix Comparison</h1>
          <p className="text-muted-foreground mt-1">
            Compare offers across multiple providers side-by-side
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="mr-2 h-4 w-4" />
            {showFilters ? 'Hide' : 'Show'} Filters
          </Button>
          <Button variant="outline" onClick={exportCSV} disabled={offers.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Categories */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Categories</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <Badge
                    key={cat.id}
                    variant={selectedCategories.includes(cat.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleCategory(cat.id)}
                  >
                    {cat.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Providers */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Providers</Label>
              <div className="flex flex-wrap gap-2">
                {PROVIDERS_LIST.map((prov) => (
                  <Badge
                    key={prov.id}
                    variant={selectedProviders.includes(prov.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleProvider(prov.id)}
                  >
                    {prov.name}
                    {selectedProviders.includes(prov.id) && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                ))}
              </div>
              {selectedProviders.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => setSelectedProviders([])}
                >
                  Clear all
                </Button>
              )}
            </div>

            <Separator />

            {/* Price & Speed Filters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="minPrice" className="text-sm">Min Price ($)</Label>
                <Input
                  id="minPrice"
                  type="number"
                  placeholder="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="maxPrice" className="text-sm">Max Price ($)</Label>
                <Input
                  id="maxPrice"
                  type="number"
                  placeholder="500"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="minSpeed" className="text-sm">Min Speed (Mbps)</Label>
                <Input
                  id="minSpeed"
                  type="number"
                  placeholder="0"
                  value={minSpeed}
                  onChange={(e) => setMinSpeed(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm">Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="priceMonthly">Price (Monthly)</SelectItem>
                    <SelectItem value="downloadMbps">Download Speed</SelectItem>
                    <SelectItem value="displayName">Plan Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Market Insights */}
      <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>AI Market Insights</CardTitle>
            </div>
            <Button 
              onClick={generateMarketInsights} 
              disabled={aiLoading || offers.length === 0}
            >
              {aiLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing Market...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Insights
                </>
              )}
            </Button>
          </div>
          <CardDescription>
            Get AI-powered analysis of the current market offerings
          </CardDescription>
        </CardHeader>
        {aiInsights && (
          <CardContent className="space-y-4">
            {/* Overview */}
            <div className="p-4 rounded-lg bg-slate-50">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Market Overview
              </h4>
              <p className="text-muted-foreground">{aiInsights.overview}</p>
            </div>

            {/* Best Value & Best Performance */}
            <div className="grid md:grid-cols-2 gap-4">
              {aiInsights.bestValue && (
                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <h4 className="font-semibold text-green-800 flex items-center gap-2 mb-2">
                    <Award className="h-4 w-4" />
                    Best Value
                  </h4>
                  <p className="font-medium">{aiInsights.bestValue.provider}</p>
                  <p className="text-sm text-green-700">{aiInsights.bestValue.plan}</p>
                  <p className="text-xs text-green-600 mt-1">{aiInsights.bestValue.reason}</p>
                </div>
              )}
              {aiInsights.bestPerformance && (
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <h4 className="font-semibold text-blue-800 flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4" />
                    Best Performance
                  </h4>
                  <p className="font-medium">{aiInsights.bestPerformance.provider}</p>
                  <p className="text-sm text-blue-700">{aiInsights.bestPerformance.plan}</p>
                  <p className="text-xs text-blue-600 mt-1">{aiInsights.bestPerformance.reason}</p>
                </div>
              )}
            </div>

            {/* Trends */}
            {aiInsights.trends.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Market Trends
                </h4>
                <ul className="space-y-1">
                  {aiInsights.trends.map((trend, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary">•</span>
                      {trend}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {aiInsights.recommendations.length > 0 && (
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                <h4 className="font-semibold text-amber-800 flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4" />
                  Recommendations for Buyers
                </h4>
                <ul className="space-y-1">
                  {aiInsights.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
                      <span>{i + 1}.</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Results */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {loading ? 'Loading...' : `${offers.length} offers found`}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : offers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No offers found matching your criteria.</p>
              <p className="text-sm mt-2">Try adjusting your filters or refresh provider data.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <SortHeader column="provider.displayName" label="Provider" />
                    <SortHeader column="displayName" label="Plan" />
                    <th className="px-4 py-3 text-left text-sm font-semibold">Category</th>
                    <SortHeader column="priceMonthly" label="Monthly" />
                    <th className="px-4 py-3 text-left text-sm font-semibold">Promo</th>
                    <SortHeader column="downloadMbps" label="Download" />
                    <th className="px-4 py-3 text-left text-sm font-semibold">Upload</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Contract</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {offers.map((offer) => (
                    <tr key={offer.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: getProviderColor(offer.provider.slug) }}
                          />
                          <span className="font-medium">{offer.provider.displayName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{offer.displayName}</p>
                          {offer.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {offer.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{offer.category}</Badge>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {formatCurrency(offer.priceMonthly)}
                      </td>
                      <td className="px-4 py-3">
                        {offer.pricePromo ? (
                          <div>
                            <span className="text-green-600 font-medium">
                              {formatCurrency(offer.pricePromo)}
                            </span>
                            {offer.promoTermMonths && (
                              <span className="text-xs text-muted-foreground ml-1">
                                ({offer.promoTermMonths}mo)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{formatSpeed(offer.downloadMbps)}</td>
                      <td className="px-4 py-3">{formatSpeed(offer.uploadMbps)}</td>
                      <td className="px-4 py-3">
                        {offer.contractMonths ? (
                          <span>{offer.contractMonths} mo</span>
                        ) : (
                          <span className="text-green-600">No contract</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {offer.sourceUrl && (
                          <a
                            href={offer.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span className="text-xs">Source</span>
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
