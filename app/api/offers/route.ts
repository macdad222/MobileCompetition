import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { OfferCategory } from '@prisma/client';

// GET - List offers with filters
export async function GET(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const providerIds = searchParams.get('providerIds')?.split(',').filter(Boolean) || [];
    const categories = searchParams.get('categories')?.split(',').filter(Boolean) as OfferCategory[] || [];
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const minSpeed = searchParams.get('minSpeed') ? parseInt(searchParams.get('minSpeed')!) : undefined;
    const sortBy = searchParams.get('sortBy') || 'priceMonthly';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    const where: any = { isActive: true };
    
    if (providerIds.length > 0) {
      // Check if these are slugs or UUIDs by looking for UUID format
      const isUUID = providerIds[0]?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      
      if (isUUID) {
        where.providerId = { in: providerIds };
      } else {
        // Treat as slugs - need to look up provider IDs
        const providers = await db.provider.findMany({
          where: { slug: { in: providerIds } },
          select: { id: true },
        });
        where.providerId = { in: providers.map(p => p.id) };
      }
    }
    
    if (categories.length > 0) {
      where.category = { in: categories };
    }
    
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.priceMonthly = {};
      if (minPrice !== undefined) where.priceMonthly.gte = minPrice;
      if (maxPrice !== undefined) where.priceMonthly.lte = maxPrice;
    }
    
    if (minSpeed !== undefined) {
      where.downloadMbps = { gte: minSpeed };
    }

    const offers = await db.offer.findMany({
      where,
      include: {
        provider: {
          select: {
            id: true,
            slug: true,
            displayName: true,
            providerType: true,
          },
        },
        features: true,
        observations: {
          orderBy: { observedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { [sortBy]: sortOrder },
    });

    return NextResponse.json({ offers });
  } catch (error) {
    console.error('Error fetching offers:', error);
    return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 });
  }
}
