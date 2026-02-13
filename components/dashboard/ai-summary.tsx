'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface AISummaryProps {
  hasLLMConfig: boolean;
}

export function AISummary({ hasLLMConfig }: AISummaryProps) {
  const { toast } = useToast();
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generateSummary() {
    if (!hasLLMConfig) {
      toast({
        title: 'LLM Not Configured',
        description: 'Please configure your API key in Settings to enable AI features.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/analysis/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate summary');
      }
      
      setSummary(data.summary);
    } catch (error) {
      console.error('Failed to generate summary:', error);
      toast({
        title: 'Summary Failed',
        description: error instanceof Error ? error.message : 'Failed to generate summary',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>AI Market Summary</CardTitle>
          </div>
          <Button 
            onClick={generateSummary} 
            disabled={loading || !hasLLMConfig}
            variant={hasLLMConfig ? 'default' : 'secondary'}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Summary
              </>
            )}
          </Button>
        </div>
        <CardDescription>
          {hasLLMConfig 
            ? 'Get an AI-powered summary of the current market landscape'
            : 'Configure your LLM API key in Settings to enable this feature'
          }
        </CardDescription>
      </CardHeader>
      {summary && (
        <CardContent>
          <p className="text-muted-foreground">{summary}</p>
        </CardContent>
      )}
    </Card>
  );
}
