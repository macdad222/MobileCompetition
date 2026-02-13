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
    const insightType = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Show all insights to all users (shared intelligence)
    const where: any = {};
    if (insightType) {
      where.insightType = insightType;
    }

    const includeContent = searchParams.get('includeContent') === 'true';

    const insights = await db.storedInsight.findMany({
      where,
      orderBy: { generatedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        insightType: true,
        title: true,
        summary: true,
        content: includeContent,
        modelUsed: true,
        generatedAt: true,
        tokensUsed: true,
        category: true,
        provider: { select: { id: true, displayName: true, slug: true } },
        segment: { select: { id: true, name: true, code: true } },
      },
    });

    return NextResponse.json({ insights });
  } catch (error) {
    console.error('Error fetching insights:', error);
    return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Insight ID is required' }, { status: 400 });
    }

    await db.storedInsight.deleteMany({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting insight:', error);
    return NextResponse.json({ error: 'Failed to delete insight' }, { status: 500 });
  }
}
