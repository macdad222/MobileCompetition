'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Download, FileText, Loader2, Presentation } from 'lucide-react';

interface StoredInsight {
  id: string;
  insightType: string;
  title: string;
  summary: string;
  content?: any;
  modelUsed: string;
  generatedAt: string;
}

interface ReportGeneratorProps {
  insights: StoredInsight[];
  companyName?: string;
}

export function ReportGenerator({ insights, companyName }: ReportGeneratorProps) {
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);

  function toggleInsight(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (selectedIds.size === insights.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(insights.map(i => i.id)));
    }
  }

  async function generatePDF() {
    setGenerating(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      const selected = insights.filter(i => selectedIds.has(i.id));
      const title = companyName ? `${companyName} - Strategic Intelligence Report` : 'SMB Strategic Intelligence Report';
      const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

      // Title page
      doc.setFontSize(24);
      doc.setTextColor(30, 41, 59);
      doc.text(title, 20, 40);
      doc.setFontSize(12);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated: ${date}`, 20, 55);
      doc.text(`${selected.length} insights included`, 20, 65);
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(0.5);
      doc.line(20, 75, 190, 75);

      let y = 90;

      for (const insight of selected) {
        if (y > 250) { doc.addPage(); y = 20; }

        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59);
        doc.text(insight.title, 20, y);
        y += 8;

        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(`${insight.insightType.replace(/_/g, ' ')} | ${insight.modelUsed} | ${new Date(insight.generatedAt).toLocaleDateString()}`, 20, y);
        y += 10;

        doc.setFontSize(10);
        doc.setTextColor(51, 65, 85);

        const content = insight.content;
        const lines: string[] = [];

        if (typeof content === 'string') {
          lines.push(content);
        } else if (content) {
          const mainText = content.summary || content.overview || content.executiveSummary || content.marketOverview || '';
          if (mainText) lines.push(mainText);

          const listFields = ['keyFindings', 'strategicRecommendations', 'riskFactors', 'trends', 'recommendations',
            'strengths', 'weaknesses', 'needsPriorities', 'retentionTactics', 'threatAssessment'];

          for (const field of listFields) {
            if (Array.isArray(content[field]) && content[field].length > 0) {
              lines.push('');
              lines.push(field.replace(/([A-Z])/g, ' $1').trim() + ':');
              for (const item of content[field]) {
                lines.push(typeof item === 'string' ? '  - ' + item : '  - ' + Object.values(item).join(' | '));
              }
            }
          }
        } else {
          lines.push(insight.summary);
        }

        for (const line of lines) {
          const splitLines = doc.splitTextToSize(line, 170);
          for (const sl of splitLines) {
            if (y > 275) { doc.addPage(); y = 20; }
            doc.text(sl, 20, y);
            y += 5;
          }
        }

        y += 10;
        doc.setDrawColor(226, 232, 240);
        doc.line(20, y, 190, y);
        y += 10;
      }

      doc.save(`strategic-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast({ title: 'PDF Generated', description: `Report with ${selected.length} insights downloaded.` });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({ title: 'Error', description: 'Failed to generate PDF', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  }

  async function generatePPTX() {
    setGenerating(true);
    try {
      const res = await fetch('/api/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          insightIds: Array.from(selectedIds),
          format: 'pptx',
          companyName,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate PowerPoint');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `strategic-report-${new Date().toISOString().split('T')[0]}.pptx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: 'PowerPoint Generated', description: `Presentation downloaded.` });
    } catch (error) {
      console.error('PPTX generation error:', error);
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to generate PowerPoint', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  }

  if (insights.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Reports
            </CardTitle>
            <CardDescription>Select insights to include in your executive report</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              {selectedIds.size === insights.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-[200px] overflow-y-auto space-y-2">
          {insights.map(insight => (
            <div key={insight.id} className="flex items-center gap-3 p-2 rounded hover:bg-slate-50">
              <Checkbox
                checked={selectedIds.has(insight.id)}
                onCheckedChange={() => toggleInsight(insight.id)}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{insight.title}</p>
                <Badge variant="outline" className="text-[10px]">{insight.insightType.replace(/_/g, ' ')}</Badge>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-2">
          <Button onClick={generatePDF} disabled={selectedIds.size === 0 || generating}>
            {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
            Export PDF ({selectedIds.size})
          </Button>
          <Button variant="outline" onClick={generatePPTX} disabled={selectedIds.size === 0 || generating}>
            {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Presentation className="h-4 w-4 mr-2" />}
            Export PowerPoint ({selectedIds.size})
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
