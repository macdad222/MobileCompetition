import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { generateQuickSummary } from '@/src/llm/analysis';
import { getLLMConfig, storeInsight } from '@/src/llm/helpers';

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = await getLLMConfig(session.user.id);
    if (!config) {
      return NextResponse.json({ error: 'No LLM configuration found. Please configure your API key in Settings.' }, { status: 400 });
    }

    const [offerCount, providerCount, categories] = await Promise.all([
      db.offer.count({ where: { isActive: true } }),
      db.provider.count({ where: { isActive: true } }),
      db.offer.groupBy({ by: ['category'], where: { isActive: true } }),
    ]);

    const categoryList = categories.map(c => c.category);
    const summary = await generateQuickSummary(config, offerCount, providerCount, categoryList);

    await storeInsight({
      userId: session.user.id,
      insightType: 'MARKET',
      title: 'Dashboard Summary',
      content: { summary },
      summary,
      modelUsed: config.model,
    });

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error generating summary:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate summary';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
