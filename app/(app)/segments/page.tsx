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
import { useToast } from '@/components/ui/use-toast';
import {
  Loader2,
  Sparkles,
  Users,
  Target,
  ShoppingCart,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Building2,
  Lightbulb,
  Brain,
  Heart,
  Shield,
  MessageSquare,
  RefreshCw,
  Clock,
} from 'lucide-react';

interface Segment {
  id: string;
  code: string;
  name: string;
  employeeTier: string | null;
  revenueTier: string | null;
  industry: string | null;
  industryGroup: string | null;
  techMaturity: string | null;
  priceSensitivity: string | null;
  contractAversion: string | null;
  supportImportance: string | null;
  buyerProfile: {
    awarenessChannels: string[];
    considerationFactors: string[];
    decisionTriggers: string[];
    painPoints: { issue: string; severity: number }[];
    preferredTerms: string[];
    switchingBarriers: string[];
    loyaltyDrivers: string[];
    purchaseChannels: string[];
    supportExpectations: string;
  } | null;
  _count: { storedInsights: number };
}

interface SegmentAnalysis {
  overview: string;
  needsPriorities: string[];
  bestFitProviders: { provider: string; reason: string }[];
  pricingInsights: string;
  contractRecommendation: string;
  keyConsiderations: string[];
}

interface BuyerBehavior {
  purchaseJourneyNarrative: string;
  topPainPoints: { issue: string; impact: string; opportunity: string }[];
  contractStrategy: string;
  channelStrategy: string;
  retentionTactics: string[];
  competitiveVulnerabilities: string[];
  messagingRecommendations: string[];
}

export default function SegmentsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);

  // Filters
  const [filterTier, setFilterTier] = useState<string>('all');
  const [filterIndustry, setFilterIndustry] = useState<string>('all');

  // AI states
  const [segAnalysis, setSegAnalysis] = useState<SegmentAnalysis | null>(null);
  const [segAnalysisLoading, setSegAnalysisLoading] = useState(false);
  const [segAnalysisAt, setSegAnalysisAt] = useState<string | null>(null);
  const [buyerBehavior, setBuyerBehavior] = useState<BuyerBehavior | null>(null);
  const [buyerLoading, setBuyerLoading] = useState(false);
  const [buyerAnalysisAt, setBuyerAnalysisAt] = useState<string | null>(null);

  useEffect(() => { fetchSegments(); }, []);

  async function fetchSegments() {
    setLoading(true);
    try {
      const res = await fetch('/api/segments');
      const data = await res.json();
      setSegments(data.segments || []);
    } catch (error) {
      console.error('Failed to fetch segments:', error);
    } finally {
      setLoading(false);
    }
  }

  function selectSegment(seg: Segment) {
    setSelectedSegment(seg);
    setSegAnalysis(null);
    setSegAnalysisAt(null);
    setBuyerBehavior(null);
    setBuyerAnalysisAt(null);
    // Load cached analyses for this segment
    fetchCachedSegmentAnalysis(seg.id);
    fetchCachedBuyerAnalysis(seg.id);
  }

  async function fetchCachedSegmentAnalysis(segmentId: string) {
    try {
      const res = await fetch(`/api/insights/cached?insightType=SEGMENT_ANALYSIS&segmentId=${segmentId}`);
      const data = await res.json();
      if (data.insight?.content) {
        setSegAnalysis(data.insight.content as SegmentAnalysis);
        setSegAnalysisAt(data.insight.generatedAt);
      }
    } catch (error) { /* silent */ }
  }

  async function fetchCachedBuyerAnalysis(segmentId: string) {
    try {
      const res = await fetch(`/api/insights/cached?insightType=BUYER_BEHAVIOR&segmentId=${segmentId}`);
      const data = await res.json();
      if (data.insight?.content) {
        setBuyerBehavior(data.insight.content as BuyerBehavior);
        setBuyerAnalysisAt(data.insight.generatedAt);
      }
    } catch (error) { /* silent */ }
  }

  async function generateSegAnalysis() {
    if (!selectedSegment) return;
    setSegAnalysisLoading(true);
    try {
      const res = await fetch('/api/analysis/segment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segmentId: selectedSegment.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSegAnalysis(data.analysis);
      setSegAnalysisAt(new Date().toISOString());
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed', variant: 'destructive' });
    } finally {
      setSegAnalysisLoading(false);
    }
  }

  async function generateBuyerAnalysis() {
    if (!selectedSegment) return;
    setBuyerLoading(true);
    try {
      const res = await fetch('/api/analysis/buyer-behavior', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segmentId: selectedSegment.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBuyerBehavior(data.analysis);
      setBuyerAnalysisAt(new Date().toISOString());
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed', variant: 'destructive' });
    } finally {
      setBuyerLoading(false);
    }
  }

  const uniqueTiers = Array.from(new Set(segments.map(s => s.employeeTier).filter(Boolean)));
  const uniqueIndustries = Array.from(new Set(segments.map(s => s.industry).filter(Boolean)));

  const filteredSegments = segments.filter(s => {
    if (filterTier !== 'all' && s.employeeTier !== filterTier) return false;
    if (filterIndustry !== 'all' && s.industry !== filterIndustry) return false;
    return true;
  });

  const sensitivityColor = (val: string | null) => {
    if (val === 'high') return 'text-red-600';
    if (val === 'medium') return 'text-amber-600';
    return 'text-green-600';
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">SMB Segment Analysis</h1>
        <p className="text-muted-foreground mt-1">
          Understand how different small business segments evaluate and purchase telecom services
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Employee Tier</label>
              <Select value={filterTier} onValueChange={setFilterTier}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  {uniqueTiers.map(t => <SelectItem key={t!} value={t!}>{t} employees</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Industry</label>
              <Select value={filterIndustry} onValueChange={setFilterIndustry}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  {uniqueIndustries.map(i => <SelectItem key={i!} value={i!}>{i!.replace(/_/g, ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Segment Grid */}
        <div className="lg:col-span-1 space-y-2">
          <h3 className="font-semibold text-lg">{filteredSegments.length} Segments</h3>
          <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
            {filteredSegments.map(seg => (
              <Card
                key={seg.id}
                className={`cursor-pointer transition-all hover:border-primary ${selectedSegment?.id === seg.id ? 'border-primary bg-primary/5' : ''}`}
                onClick={() => selectSegment(seg)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{seg.industry?.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-muted-foreground">{seg.employeeTier} employees | {seg.revenueTier}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex gap-1 mt-2">
                    <Badge variant="outline" className="text-[10px]">{seg.techMaturity}</Badge>
                    <Badge variant="outline" className={`text-[10px] ${sensitivityColor(seg.priceSensitivity)}`}>$ {seg.priceSensitivity}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Segment Detail & Analysis */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedSegment ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Select a Segment</h3>
                <p className="text-muted-foreground">Click a segment to view its profile and generate AI analysis</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Segment Profile */}
              <Card>
                <CardHeader>
                  <CardTitle>{selectedSegment.name}</CardTitle>
                  <CardDescription>Segment profile and behavioral attributes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Employees</p>
                      <p className="font-semibold">{selectedSegment.employeeTier}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Revenue</p>
                      <p className="font-semibold">{selectedSegment.revenueTier}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Tech Maturity</p>
                      <p className="font-semibold capitalize">{selectedSegment.techMaturity}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Industry</p>
                      <p className="font-semibold capitalize">{selectedSegment.industry?.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="p-3 bg-slate-50 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">Price Sensitivity</p>
                      <p className={`font-bold text-lg capitalize ${sensitivityColor(selectedSegment.priceSensitivity)}`}>{selectedSegment.priceSensitivity}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">Contract Aversion</p>
                      <p className={`font-bold text-lg capitalize ${sensitivityColor(selectedSegment.contractAversion)}`}>{selectedSegment.contractAversion}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">Support Need</p>
                      <p className="font-bold text-lg capitalize">{selectedSegment.supportImportance}</p>
                    </div>
                  </div>

                  {/* Buyer Profile Quick View */}
                  {selectedSegment.buyerProfile && (
                    <div className="mt-4 space-y-3">
                      <h4 className="font-semibold text-sm">Buyer Profile</h4>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Top Pain Points</p>
                          {selectedSegment.buyerProfile.painPoints.slice(0, 3).map((p: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <div className="w-16 bg-red-100 rounded-full h-2">
                                <div className="bg-red-500 h-2 rounded-full" style={{ width: `${p.severity * 10}%` }} />
                              </div>
                              <span className="capitalize text-xs">{p.issue.replace(/_/g, ' ')}</span>
                            </div>
                          ))}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Preferred Terms</p>
                          <div className="flex flex-wrap gap-1">
                            {selectedSegment.buyerProfile.preferredTerms.map((t: string) => (
                              <Badge key={t} variant="outline" className="text-xs">{t.replace(/_/g, ' ')}</Badge>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 mb-1">Purchase Channels</p>
                          <div className="flex flex-wrap gap-1">
                            {selectedSegment.buyerProfile.purchaseChannels.map((c: string) => (
                              <Badge key={c} variant="secondary" className="text-xs">{c.replace(/_/g, ' ')}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* AI Actions */}
              <div className="flex gap-3 flex-wrap items-center">
                <Button onClick={generateSegAnalysis} disabled={segAnalysisLoading} variant={segAnalysis ? 'outline' : 'default'}>
                  {segAnalysisLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : segAnalysis ? <RefreshCw className="h-4 w-4 mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  {segAnalysis ? 'Refresh' : ''} Segment Analysis
                </Button>
                {segAnalysisAt && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(segAnalysisAt).toLocaleDateString()} {new Date(segAnalysisAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
                <Button variant="outline" onClick={generateBuyerAnalysis} disabled={buyerLoading}>
                  {buyerLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : buyerBehavior ? <RefreshCw className="h-4 w-4 mr-2" /> : <Brain className="h-4 w-4 mr-2" />}
                  {buyerBehavior ? 'Refresh' : ''} Buyer Behavior Deep Dive
                </Button>
                {buyerAnalysisAt && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(buyerAnalysisAt).toLocaleDateString()} {new Date(buyerAnalysisAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>

              {/* Segment Analysis Results */}
              {segAnalysis && (
                <Card className="border-blue-200">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg">Segment Analysis</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{segAnalysis.overview}</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Needs Priorities</h4>
                        <ol className="space-y-1">
                          {segAnalysis.needsPriorities.map((n, i) => (
                            <li key={i} className="text-sm flex items-start gap-2"><span className="font-bold text-primary">{i + 1}.</span>{n}</li>
                          ))}
                        </ol>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Best-Fit Providers</h4>
                        {segAnalysis.bestFitProviders.map((p, i) => (
                          <div key={i} className="p-2 bg-green-50 rounded mb-1">
                            <p className="font-medium text-sm text-green-800">{p.provider}</p>
                            <p className="text-xs text-green-600">{p.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-sm text-blue-800 mb-1">Contract Strategy</h4>
                      <p className="text-sm text-blue-700">{segAnalysis.contractRecommendation}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Buyer Behavior Results */}
              {buyerBehavior && (
                <Card className="border-green-200">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-green-600" />
                      <CardTitle className="text-lg">Buyer Behavior Deep Dive</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <h4 className="font-semibold text-sm mb-2">Purchase Journey</h4>
                      <p className="text-sm text-muted-foreground">{buyerBehavior.purchaseJourneyNarrative}</p>
                    </div>

                    {buyerBehavior.topPainPoints.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Pain Points & Opportunities</h4>
                        <div className="space-y-2">
                          {buyerBehavior.topPainPoints.map((p, i) => (
                            <div key={i} className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-lg text-sm">
                              <div><AlertTriangle className="h-3 w-3 inline mr-1 text-red-500" /><span className="font-medium">{p.issue}</span></div>
                              <div className="text-muted-foreground">{p.impact}</div>
                              <div className="text-green-700"><Lightbulb className="h-3 w-3 inline mr-1" />{p.opportunity}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-sm text-blue-800 mb-2 flex items-center gap-1">
                          <Shield className="h-4 w-4" /> Contract Strategy
                        </h4>
                        <p className="text-sm text-blue-700">{buyerBehavior.contractStrategy}</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <h4 className="font-semibold text-sm text-purple-800 mb-2 flex items-center gap-1">
                          <ShoppingCart className="h-4 w-4" /> Channel Strategy
                        </h4>
                        <p className="text-sm text-purple-700">{buyerBehavior.channelStrategy}</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <h4 className="font-semibold text-sm text-green-800 mb-2 flex items-center gap-1">
                          <Heart className="h-4 w-4" /> Retention Tactics
                        </h4>
                        <ul className="space-y-1">
                          {buyerBehavior.retentionTactics.map((t, i) => (
                            <li key={i} className="text-sm text-green-700 flex items-start gap-1">
                              <CheckCircle2 className="h-3 w-3 mt-1 flex-shrink-0" />{t}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <h4 className="font-semibold text-sm text-amber-800 mb-2 flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" /> Messaging That Resonates
                        </h4>
                        <ul className="space-y-1">
                          {buyerBehavior.messagingRecommendations.map((m, i) => (
                            <li key={i} className="text-sm text-amber-700 flex items-start gap-1">
                              <span className="font-bold">{i + 1}.</span>{m}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
