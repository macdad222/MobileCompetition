import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const segments = await db.sMBSegment.findMany({
      where: { isActive: true },
      include: {
        buyerProfile: true,
        _count: { select: { storedInsights: true } },
      },
      orderBy: [{ employeeMin: 'asc' }, { industry: 'asc' }],
    });

    return NextResponse.json({ segments });
  } catch (error) {
    console.error('Error fetching segments:', error);
    return NextResponse.json({ error: 'Failed to fetch segments' }, { status: 500 });
  }
}
