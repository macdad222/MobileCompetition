import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

// GET - Fetch all active device incentives and contract buyouts
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const providerId = searchParams.get('providerId');
    const brand = searchParams.get('brand');

    const where: any = { isActive: true };
    if (providerId) where.providerId = providerId;
    if (brand) where.deviceBrand = brand;

    const deviceIncentives = await db.deviceIncentive.findMany({
      where,
      include: {
        provider: { select: { id: true, slug: true, displayName: true } },
      },
      orderBy: [{ deviceBrand: 'asc' }, { deviceRetailPrice: 'desc' }],
    });

    const contractBuyouts = await db.contractBuyout.findMany({
      where: { 
        isActive: true,
        ...(providerId ? { providerId } : {}),
      },
      include: {
        provider: { select: { id: true, slug: true, displayName: true } },
      },
    });

    // Get unique brands for filtering
    const brands = Array.from(new Set(deviceIncentives.map(d => d.deviceBrand))).sort();

    return NextResponse.json({
      deviceIncentives,
      contractBuyouts,
      brands,
      totalIncentives: deviceIncentives.length,
      totalBuyouts: contractBuyouts.length,
    });
  } catch (error) {
    console.error('Error fetching device incentives:', error);
    return NextResponse.json({ error: 'Failed to fetch device incentives' }, { status: 500 });
  }
}
