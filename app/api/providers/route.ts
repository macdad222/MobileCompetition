import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

// GET - List all providers with their stats
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const providers = await db.provider.findMany({
      where: { isActive: true },
      orderBy: { priorityRank: 'asc' },
      include: {
        _count: {
          select: { offers: true, sourceSnapshots: true },
        },
        sourceSnapshots: {
          orderBy: { fetchedAt: 'desc' },
          take: 1,
          select: { fetchedAt: true },
        },
      },
    });

    const formattedProviders = providers.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      displayName: p.displayName,
      parentMsoGroup: p.parentMsoGroup,
      providerType: p.providerType,
      country: p.country,
      regions: p.regions,
      logoUrl: p.logoUrl,
      websiteUrl: p.websiteUrl,
      businessUrl: p.businessUrl,
      priorityRank: p.priorityRank,
      offersCount: p._count.offers,
      snapshotsCount: p._count.sourceSnapshots,
      lastRefreshed: p.sourceSnapshots[0]?.fetchedAt || null,
    }));

    return NextResponse.json({ providers: formattedProviders });
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 });
  }
}
