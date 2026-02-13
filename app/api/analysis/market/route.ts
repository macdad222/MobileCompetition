import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { generateMarketInsights, OfferForAnalysis } from '@/src/llm/analysis';
import { getLLMConfig, storeInsight } from '@/src/llm/helpers';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { category } = await req.json();
    const config = await getLLMConfig(session.user.id);
    if (!config) {
      return NextResponse.json({ error: 'No LLM configuration found. Please configure your API key in Settings.' }, { status: 400 });
    }

    const offers = await db.offer.findMany({
      where: { isActive: true, ...(category ? { category } : {}) },
      include: { provider: { select: { displayName: true, slug: true } }, features: true },
      orderBy: { priceMonthly: 'asc' },
    });

    const transformedOffers: OfferForAnalysis[] = offers.map(offer => ({
      name: offer.name, displayName: offer.displayName, description: offer.description,
      category: offer.category, priceMonthly: offer.priceMonthly ? Number(offer.priceMonthly) : null,
      pricePromo: offer.pricePromo ? Number(offer.pricePromo) : null,
      promoTermMonths: offer.promoTermMonths, contractMonths: offer.contractMonths,
      downloadMbps: offer.downloadMbps, uploadMbps: offer.uploadMbps,
      provider: offer.provider,
      features: offer.features.map(f => ({ featureKey: f.featureKey, featureValue: f.featureValue })),
    }));

    const analysis = await generateMarketInsights(config, transformedOffers, category || 'BROADBAND');

    await storeInsight({
      userId: session.user.id,
      insightType: 'MARKET',
      title: `Market Insights: ${category || 'All Categories'}`,
      content: analysis,
      summary: analysis.overview,
      modelUsed: config.model,
      category,
    });

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Error generating market insights:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate analysis';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
