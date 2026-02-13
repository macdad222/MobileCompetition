'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate, getProviderColor } from '@/lib/utils';
import {
  Building2,
  ExternalLink,
  RefreshCw,
  ArrowRight,
  Loader2,
  Clock,
  Package,
} from 'lucide-react';

interface Provider {
  id: string;
  slug: string;
  name: string;
  displayName: string;
  parentMsoGroup: string | null;
  providerType: string;
  country: string;
  regions: string[];
  logoUrl: string | null;
  websiteUrl: string | null;
  businessUrl: string | null;
  priorityRank: number;
  offersCount: number;
  snapshotsCount: number;
  lastRefreshed: string | null;
}

export default function ProvidersPage() {
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<Provider[]>([]);

  useEffect(() => {
    fetchProviders();
  }, []);

  async function fetchProviders() {
    try {
      const res = await fetch('/api/providers');
      const data = await res.json();
      setProviders(data.providers || []);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getProviderTypeLabel = (type: string) => {
    switch (type) {
      case 'MSO':
        return 'Cable/MSO';
      case 'TELCO':
        return 'Telco';
      case 'WIRELESS':
        return 'Wireless';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Providers</h1>
          <p className="text-muted-foreground mt-1">
            All tracked SMB service providers
          </p>
        </div>
        <Link href="/refresh">
          <Button>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
        </Link>
      </div>

      {providers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No providers found</h3>
            <p className="text-muted-foreground mb-4">
              The database needs to be seeded with provider data.
            </p>
            <p className="text-sm text-muted-foreground">
              Run <code className="bg-muted px-2 py-1 rounded">npm run db:seed</code> to populate providers.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider) => (
            <Card key={provider.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: getProviderColor(provider.slug) }}
                    >
                      {provider.displayName[0]}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{provider.displayName}</CardTitle>
                      {provider.parentMsoGroup && (
                        <CardDescription>{provider.parentMsoGroup}</CardDescription>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline">{getProviderTypeLabel(provider.providerType)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span>{provider.offersCount} offers</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {provider.lastRefreshed
                        ? `Updated ${formatDate(provider.lastRefreshed)}`
                        : 'Never refreshed'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {provider.regions.slice(0, 3).map((region) => (
                    <Badge key={region} variant="secondary" className="text-xs">
                      {region}
                    </Badge>
                  ))}
                  {provider.regions.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{provider.regions.length - 3} more
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex gap-2">
                    {provider.businessUrl && (
                      <a
                        href={provider.businessUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm inline-flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Website
                      </a>
                    )}
                  </div>
                  <Link href={`/providers/${provider.slug}`}>
                    <Button variant="ghost" size="sm">
                      View Details
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
