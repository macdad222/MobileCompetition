import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

// GET - Get provider details with offers and history
export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const provider = await db.provider.findUnique({
      where: { slug: params.slug },
      include: {
        offers: {
          where: { isActive: true },
          include: {
            features: true,
            observations: {
              orderBy: { observedAt: 'desc' },
              take: 10,
            },
          },
          orderBy: { priceMonthly: 'asc' },
        },
        packages: {
          where: { isActive: true },
          include: {
            includedOffers: {
              include: {
                offer: {
                  select: { id: true, displayName: true, category: true, priceMonthly: true, downloadMbps: true },
                },
              },
            },
            addOns: true,
          },
          orderBy: { basePrice: 'asc' },
        },
        sourceSnapshots: {
          orderBy: { fetchedAt: 'desc' },
          take: 5,
          select: {
            id: true,
            url: true,
            fetchedAt: true,
            parserVersion: true,
          },
        },
      },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Calculate some statistics
    const stats = {
      totalOffers: provider.offers.length,
      broadbandOffers: provider.offers.filter((o) => o.category === 'BROADBAND').length,
      mobileOffers: provider.offers.filter((o) => o.category === 'MOBILE').length,
      voiceOffers: provider.offers.filter((o) => o.category === 'VOICE').length,
      packageOffers: provider.offers.filter((o) => o.category === 'PACKAGE').length,
      lowestPrice: provider.offers.reduce((min, o) => 
        o.priceMonthly && (min === null || Number(o.priceMonthly) < min) 
          ? Number(o.priceMonthly) 
          : min, 
        null as number | null
      ),
      highestSpeed: provider.offers.reduce((max, o) => 
        o.downloadMbps && (max === null || o.downloadMbps > max) 
          ? o.downloadMbps 
          : max, 
        null as number | null
      ),
      lastRefreshed: provider.sourceSnapshots[0]?.fetchedAt || null,
    };

    // Group offers by category
    const offersByCategory = {
      BROADBAND: provider.offers.filter((o) => o.category === 'BROADBAND'),
      MOBILE: provider.offers.filter((o) => o.category === 'MOBILE'),
      VOICE: provider.offers.filter((o) => o.category === 'VOICE'),
      PACKAGE: provider.offers.filter((o) => o.category === 'PACKAGE'),
    };

    return NextResponse.json({
      provider: {
        id: provider.id,
        slug: provider.slug,
        name: provider.name,
        displayName: provider.displayName,
        parentMsoGroup: provider.parentMsoGroup,
        providerType: provider.providerType,
        country: provider.country,
        regions: provider.regions,
        websiteUrl: provider.websiteUrl,
        businessUrl: provider.businessUrl,
      },
      stats,
      offersByCategory,
      packages: provider.packages,
      recentSnapshots: provider.sourceSnapshots,
    });
  } catch (error) {
    console.error('Error fetching provider:', error);
    return NextResponse.json({ error: 'Failed to fetch provider' }, { status: 500 });
  }
}
