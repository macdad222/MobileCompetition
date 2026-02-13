'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import {
  Loader2,
  Sparkles,
  Target,
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Clock,
  Trash2,
  FileText,
  Users,
  Building2,
  Briefcase,
  RefreshCw,
} from 'lucide-react';
import { ReportGenerator } from '@/components/export/report-generator';

interface StoredInsight {
  id: string;
  insightType: string;
  title: string;
  summary: string;
  content?: any;
  modelUsed: string;
  generatedAt: string;
  provider?: { displayName: string; slug: string };
  segment?: { name: string; code: string };
}

interface ExecutiveSummary {
  headline: string;
  marketOverview: string;
  competitivePosition: string;
  keyFindings: string[];
  segmentOpportunities: { segment: string; opportunity: string; priority: string }[];
  strategicRecommendations: string[];
  riskFactors: string[];
}

interface CompetitiveIntel {
  executiveSummary: string;
  marketPosition: string;
  strengthsVsCompetitors: { competitor: string; advantage: string; vulnerability: string }[];
  segmentOpportunities: string[];
  threatAssessment: string[];
  strategicRecommendations: string[];
  winLossDrivers: { driver: string; impact: string }[];
}

export default function StrategyPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<StoredInsight[]>([]);
  const [focusProvider, setFocusProvider] = useState<{ displayName: string } | null>(null);

  // Executive Summary state
  const [execSummary, setExecSummary] = useState<ExecutiveSummary | null>(null);
  const [execLoading, setExecLoading] = useState(false);
  const [execGeneratedAt, setExecGeneratedAt] = useState<string | null>(null);

  // Competitive Intel state
  const [compIntel, setCompIntel] = useState<CompetitiveIntel | null>(null);
  const [compLoading, setCompLoading] = useState(false);
  const [compGeneratedAt, setCompGeneratedAt] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    fetchCachedExecSummary();
    fetchCachedCompIntel();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [insightsRes, focusRes] = await Promise.all([
        fetch('/api/insights?limit=30&includeContent=true'),
        fetch('/api/user/focus-provider'),
      ]);
      const insightsData = await insightsRes.json();
      const focusData = await focusRes.json();
      setInsights(insightsData.insights || []);
      setFocusProvider(focusData.focusProvider || null);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCachedExecSummary() {
    try {
      const res = await fetch('/api/insights/cached?insightType=EXECUTIVE_SUMMARY');
      const data = await res.json();
      if (data.insight?.content) {
        setExecSummary(data.insight.content as ExecutiveSummary);
        setExecGeneratedAt(data.insight.generatedAt);
      }
    } catch (error) { /* silent */ }
  }

  async function fetchCachedCompIntel() {
    try {
      const res = await fetch('/api/insights/cached?insightType=COMPETITIVE_INTEL');
      const data = await res.json();
      if (data.insight?.content) {
        setCompIntel(data.insight.content as CompetitiveIntel);
        setCompGeneratedAt(data.insight.generatedAt);
      }
    } catch (error) { /* silent */ }
  }

  async function generateExecSummary() {
    setExecLoading(true);
    try {
      const res = await fetch('/api/analysis/executive-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setExecSummary(data.analysis);
      setExecGeneratedAt(new Date().toISOString());
      fetchData(); // Refresh insights list
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to generate', variant: 'destructive' });
    } finally {
      setExecLoading(false);
    }
  }

  async function generateCompIntel() {
    setCompLoading(true);
    try {
      const res = await fetch('/api/analysis/competitive-intel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCompIntel(data.analysis);
      setCompGeneratedAt(new Date().toISOString());
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to generate', variant: 'destructive' });
    } finally {
      setCompLoading(false);
    }
  }

  async function deleteInsight(id: string) {
    try {
      await fetch(`/api/insights?id=${id}`, { method: 'DELETE' });
      setInsights(prev => prev.filter(i => i.id !== id));
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete insight', variant: 'destructive' });
    }
  }

  const insightTypeIcon = (type: string) => {
    switch (type) {
      case 'EXECUTIVE_SUMMARY': return <Briefcase className="h-4 w-4" />;
      case 'COMPETITIVE_INTEL': return <Shield className="h-4 w-4" />;
      case 'SEGMENT_ANALYSIS': return <Users className="h-4 w-4" />;
      case 'BUYER_BEHAVIOR': return <Target className="h-4 w-4" />;
      case 'COMPARISON': return <TrendingUp className="h-4 w-4" />;
      case 'PROVIDER': return <Building2 className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const insightTypeColor = (type: string) => {
    switch (type) {
      case 'EXECUTIVE_SUMMARY': return 'bg-purple-100 text-purple-800';
      case 'COMPETITIVE_INTEL': return 'bg-red-100 text-red-800';
      case 'SEGMENT_ANALYSIS': return 'bg-blue-100 text-blue-800';
      case 'BUYER_BEHAVIOR': return 'bg-green-100 text-green-800';
      case 'COMPARISON': return 'bg-amber-100 text-amber-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Strategic Intelligence</h1>
          <p className="text-muted-foreground mt-1">
            C-Suite competitive analysis and market strategy
            {focusProvider && (
              <span className="ml-2 font-medium text-primary">
                | Framed for {focusProvider.displayName}
              </span>
            )}
          </p>
        </div>
        {!focusProvider && (
          <Link href="/settings">
            <Button variant="outline">
              <Building2 className="h-4 w-4 mr-2" />
              Set My Company
            </Button>
          </Link>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-2 border-dashed border-purple-300 bg-gradient-to-br from-purple-50 to-transparent cursor-pointer hover:border-purple-400 transition-colors"
              onClick={!execLoading ? generateExecSummary : undefined}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              {execLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : execSummary ? <RefreshCw className="h-5 w-5 text-purple-600" /> : <Briefcase className="h-5 w-5 text-purple-600" />}
              <CardTitle className="text-lg">{execSummary ? 'Refresh' : ''} Executive Briefing</CardTitle>
            </div>
            <CardDescription>
              {execGeneratedAt ? (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last generated {new Date(execGeneratedAt).toLocaleDateString()} {new Date(execGeneratedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              ) : (
                'Generate a board-ready strategic summary'
              )}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-2 border-dashed border-red-300 bg-gradient-to-br from-red-50 to-transparent cursor-pointer hover:border-red-400 transition-colors"
              onClick={!compLoading ? generateCompIntel : undefined}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              {compLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : compIntel ? <RefreshCw className="h-5 w-5 text-red-600" /> : <Shield className="h-5 w-5 text-red-600" />}
              <CardTitle className="text-lg">{compIntel ? 'Refresh' : ''} Competitive Intel</CardTitle>
            </div>
            <CardDescription>
              {compGeneratedAt ? (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last generated {new Date(compGeneratedAt).toLocaleDateString()} {new Date(compGeneratedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              ) : (
                'Analyze competitive positioning'
              )}
            </CardDescription>
          </CardHeader>
        </Card>

        <Link href="/segments">
          <Card className="border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-transparent cursor-pointer hover:border-blue-400 transition-colors h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">Segment Analysis</CardTitle>
              </div>
              <CardDescription>Deep dive into SMB buyer segments</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Executive Summary Display */}
      {execSummary && (
        <Card className="border-purple-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-purple-600" />
              <CardTitle>{execSummary.headline}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Market Overview</h4>
              <p className="text-muted-foreground">{execSummary.marketOverview}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Competitive Position</h4>
              <p className="text-muted-foreground">{execSummary.competitivePosition}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Key Findings</h4>
              <ul className="space-y-1">
                {execSummary.keyFindings.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />{f}</li>
                ))}
              </ul>
            </div>
            {execSummary.segmentOpportunities.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Segment Opportunities</h4>
                <div className="grid md:grid-cols-2 gap-2">
                  {execSummary.segmentOpportunities.map((opp, i) => (
                    <div key={i} className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{opp.segment}</span>
                        <Badge variant={opp.priority === 'high' ? 'destructive' : opp.priority === 'medium' ? 'default' : 'secondary'} className="text-xs">
                          {opp.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{opp.opportunity}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" /> Strategic Recommendations
                </h4>
                <ul className="space-y-1">
                  {execSummary.strategicRecommendations.map((r, i) => (
                    <li key={i} className="text-sm text-green-700">{i + 1}. {r}</li>
                  ))}
                </ul>
              </div>
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Risk Factors
                </h4>
                <ul className="space-y-1">
                  {execSummary.riskFactors.map((r, i) => (
                    <li key={i} className="text-sm text-amber-700">{i + 1}. {r}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Competitive Intel Display */}
      {compIntel && (
        <Card className="border-red-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-600" />
              <CardTitle>Competitive Intelligence Briefing</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-muted-foreground">{compIntel.executiveSummary}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Market Position</h4>
              <p className="text-sm text-muted-foreground">{compIntel.marketPosition}</p>
            </div>
            {compIntel.strengthsVsCompetitors.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Competitive Landscape</h4>
                <div className="space-y-2">
                  {compIntel.strengthsVsCompetitors.map((c, i) => (
                    <div key={i} className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-lg text-sm">
                      <div><span className="font-medium">{c.competitor}</span></div>
                      <div className="text-green-700"><CheckCircle2 className="h-3 w-3 inline mr-1" />{c.advantage}</div>
                      <div className="text-red-700"><AlertTriangle className="h-3 w-3 inline mr-1" />{c.vulnerability}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Threat Assessment</h4>
                <ul className="space-y-1">
                  {compIntel.threatAssessment.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-red-700"><AlertTriangle className="h-3 w-3 mt-1 flex-shrink-0" />{t}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Strategic Recommendations</h4>
                <ul className="space-y-1">
                  {compIntel.strategicRecommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-green-700"><Lightbulb className="h-3 w-3 mt-1 flex-shrink-0" />{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export */}
      <ReportGenerator
        insights={insights}
        companyName={focusProvider?.displayName}
      />

      {/* Insights Library */}
      <Card>
        <CardHeader>
          <CardTitle>Insights Library</CardTitle>
          <CardDescription>All stored AI-generated analyses ({insights.length} insights)</CardDescription>
        </CardHeader>
        <CardContent>
          {insights.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No insights generated yet. Use the actions above or analysis features throughout the app.</p>
          ) : (
            <div className="space-y-2">
              {insights.map((insight) => (
                <div key={insight.id} className="flex items-start justify-between p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg ${insightTypeColor(insight.insightType)}`}>
                      {insightTypeIcon(insight.insightType)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{insight.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{insight.summary}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{insight.insightType.replace(/_/g, ' ')}</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(insight.generatedAt).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-muted-foreground">{insight.modelUsed}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteInsight(insight.id)} className="flex-shrink-0">
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
