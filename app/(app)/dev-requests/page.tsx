'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import {
  Lightbulb,
  Loader2,
  Send,
  User,
  Calendar,
  MessageSquarePlus,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
} from 'lucide-react';

interface DevRequest {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'DECLINED';
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

const statusConfig: Record<
  string,
  { label: string; icon: React.ElementType; variant: 'default' | 'secondary' | 'outline' | 'destructive'; color: string }
> = {
  OPEN: { label: 'Open', icon: AlertCircle, variant: 'outline', color: 'text-blue-600' },
  IN_PROGRESS: { label: 'In Progress', icon: Clock, variant: 'default', color: 'text-amber-600' },
  COMPLETED: { label: 'Completed', icon: CheckCircle2, variant: 'secondary', color: 'text-green-600' },
  DECLINED: { label: 'Declined', icon: XCircle, variant: 'destructive', color: 'text-red-500' },
};

export default function DevRequestsPage() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<DevRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    try {
      const res = await fetch('/api/dev-requests');
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in both the title and description.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/dev-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit request');
      }

      // Prepend the new request to the list
      setRequests((prev) => [data.request, ...prev]);
      setTitle('');
      setDescription('');
      toast({
        title: 'Request Submitted',
        description: 'Your development request has been logged. Thank you!',
      });
    } catch (error) {
      toast({
        title: 'Submission Failed',
        description: error instanceof Error ? error.message : 'Something went wrong.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/20">
            <Lightbulb className="h-6 w-6 text-violet-600" />
          </div>
          Development Requests
        </h1>
        <p className="text-muted-foreground mt-2">
          Have an idea for a new feature or component? Submit your request below and the development
          team will review it for a future release.
        </p>
      </div>

      {/* Submit Form */}
      <Card className="border-2 border-dashed border-violet-300/50 bg-gradient-to-br from-violet-50/50 to-indigo-50/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5 text-violet-600" />
            <CardTitle className="text-lg">Submit a New Request</CardTitle>
          </div>
          <CardDescription>
            Describe the feature or component you&apos;d like to see in a future release.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Title
              </Label>
              <Input
                id="title"
                placeholder="e.g. Add export to PowerPoint on comparison pages"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground">{title.length}/120 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <textarea
                id="description"
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                placeholder="Describe the feature in a few sentences — what it should do, where it should appear, and why it would be useful..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground">{description.length}/2000 characters</p>
            </div>

            <Button
              type="submit"
              disabled={submitting || !title.trim() || !description.trim()}
              className="gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Request
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Prior Requests */}
      <div>
        <h2 className="text-xl font-semibold text-slate-800 mb-1">All Requests</h2>
        <p className="text-sm text-muted-foreground mb-4">
          {requests.length} request{requests.length !== 1 ? 's' : ''} submitted
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : requests.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="font-semibold text-lg text-muted-foreground mb-1">No requests yet</h3>
              <p className="text-sm text-muted-foreground">
                Be the first to submit a development request!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => {
              const status = statusConfig[req.status] || statusConfig.OPEN;
              const StatusIcon = status.icon;
              return (
                <Card
                  key={req.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h3 className="font-semibold text-base text-slate-900 truncate">
                            {req.title}
                          </h3>
                          <Badge variant={status.variant} className="shrink-0 gap-1 text-xs">
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                          {req.description}
                        </p>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        <span className="font-medium text-slate-700">
                          {req.user.name || req.user.email}
                        </span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(req.createdAt)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

