import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

/**
 * GET /api/data-status
 * Returns per-provider data provenance: is the current data from live scraping or seed data?
 * Looks at the most recent COMPLETED refresh job to determine status.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all providers
    const providers = await db.provider.findMany({
      where: { isActive: true },
      select: {
        id: true,
        slug: true,
        displayName: true,
        _count: {
          select: {
            offers: { where: { isActive: true } },
            deviceIncentives: { where: { isActive: true } },
            contractBuyouts: { where: { isActive: true } },
          },
        },
      },
      orderBy: { priorityRank: 'asc' },
    });

    // Get the most recent completed refresh jobs to determine data source per provider
    const recentJobs = await db.refreshJob.findMany({
      where: {
        status: 'COMPLETED',
        result: { not: undefined },
      },
      orderBy: { completedAt: 'desc' },
      take: 20, // enough to cover all providers
      select: {
        id: true,
        result: true,
        completedAt: true,
        createdAt: true,
      },
    });

    // Build a map of provider slug -> most recent data source info
    const providerStatusMap: Record<string, {
      source: 'live' | 'seed' | 'never_refreshed';
      lastRefreshed: string | null;
      offerCount: number;
      jobId: string | null;
    }> = {};

    // Initialize all providers as never refreshed
    for (const provider of providers) {
      providerStatusMap[provider.slug] = {
        source: 'never_refreshed',
        lastRefreshed: null,
        offerCount: 0,
        jobId: null,
      };
    }

    // Walk through jobs newest-first to find the most recent result per provider
    for (const job of recentJobs) {
      if (!job.result || typeof job.result !== 'object') continue;
      const result = job.result as Record<string, { success: boolean; offers: number; scraped?: boolean }>;

      for (const [slug, providerResult] of Object.entries(result)) {
        // Only set if we haven't already found a more recent result for this provider
        if (providerStatusMap[slug] && providerStatusMap[slug].source === 'never_refreshed') {
          if (providerResult.success) {
            providerStatusMap[slug] = {
              source: providerResult.scraped ? 'live' : 'seed',
              lastRefreshed: job.completedAt?.toISOString() || job.createdAt.toISOString(),
              offerCount: providerResult.offers || 0,
              jobId: job.id,
            };
          }
        }
      }
    }

    // Build the response
    const providerStatuses = providers.map(p => ({
      id: p.id,
      slug: p.slug,
      displayName: p.displayName,
      dataSource: providerStatusMap[p.slug]?.source || 'never_refreshed',
      lastRefreshed: providerStatusMap[p.slug]?.lastRefreshed || null,
      offersInDb: p._count.offers,
      deviceIncentives: p._count.deviceIncentives,
      contractBuyouts: p._count.contractBuyouts,
    }));

    // Summary stats
    const liveCount = providerStatuses.filter(p => p.dataSource === 'live').length;
    const seedCount = providerStatuses.filter(p => p.dataSource === 'seed').length;
    const neverCount = providerStatuses.filter(p => p.dataSource === 'never_refreshed').length;
    const totalOffers = providerStatuses.reduce((sum, p) => sum + p.offersInDb, 0);

    return NextResponse.json({
      providers: providerStatuses,
      summary: {
        totalProviders: providerStatuses.length,
        liveData: liveCount,
        seedData: seedCount,
        neverRefreshed: neverCount,
        totalOffers,
        allSeed: liveCount === 0,
        allLive: seedCount === 0 && neverCount === 0,
      },
    });
  } catch (error) {
    console.error('Error fetching data status:', error);
    return NextResponse.json({ error: 'Failed to fetch data status' }, { status: 500 });
  }
}
