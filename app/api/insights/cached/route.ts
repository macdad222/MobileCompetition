import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

/**
 * GET /api/insights/cached — retrieve the latest stored insight for a given context.
 * Shared across all users so everyone sees the same analysis.
 *
 * Query params (all optional, used as filters):
 *   insightType  — required (e.g. PROVIDER, COMPARISON, MARKET)
 *   providerId   — for provider-specific analyses
 *   provider2Id  — for comparison analyses
 *   segmentId    — for segment analyses
 *   category     — for category-scoped analyses
 */
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const insightType = searchParams.get('insightType');

    if (!insightType) {
      return NextResponse.json({ error: 'insightType is required' }, { status: 400 });
    }

    const where: any = { insightType };

    const providerId = searchParams.get('providerId');
    const provider2Id = searchParams.get('provider2Id');
    const segmentId = searchParams.get('segmentId');
    const category = searchParams.get('category');

    if (providerId) where.providerId = providerId;
    if (provider2Id) where.provider2Id = provider2Id;
    if (segmentId) where.segmentId = segmentId;
    if (category) where.category = category;

    const insight = await db.storedInsight.findFirst({
      where,
      orderBy: { generatedAt: 'desc' },
      select: {
        id: true,
        insightType: true,
        title: true,
        summary: true,
        content: true,
        modelUsed: true,
        generatedAt: true,
        tokensUsed: true,
        category: true,
        provider: { select: { id: true, displayName: true, slug: true } },
        segment: { select: { id: true, name: true, code: true } },
      },
    });

    return NextResponse.json({ insight: insight || null });
  } catch (error) {
    console.error('Error fetching cached insight:', error);
    return NextResponse.json({ error: 'Failed to fetch cached insight' }, { status: 500 });
  }
}

