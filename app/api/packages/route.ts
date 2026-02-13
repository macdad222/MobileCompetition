import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const providerSlug = searchParams.get('provider');

    const where: any = { isActive: true };
    if (providerSlug) {
      const provider = await db.provider.findFirst({ where: { slug: providerSlug } });
      if (provider) {
        where.providerId = provider.id;
      }
    }

    const packages = await db.package.findMany({
      where,
      include: {
        provider: { select: { id: true, displayName: true, slug: true } },
        includedOffers: {
          include: {
            offer: {
              select: {
                id: true, displayName: true, category: true,
                priceMonthly: true, downloadMbps: true, uploadMbps: true,
              },
            },
          },
        },
        addOns: true,
      },
      orderBy: { basePrice: 'asc' },
    });

    return NextResponse.json({ packages });
  } catch (error) {
    console.error('Error fetching packages:', error);
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 });
  }
}
