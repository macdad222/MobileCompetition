import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { generateExecutiveSummary, OfferForAnalysis } from '@/src/llm/analysis';
import { getLLMConfig, storeInsight, getUserFocusProvider } from '@/src/llm/helpers';

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

    const focusProvider = await getUserFocusProvider(session.user.id);
    if (!focusProvider) {
      return NextResponse.json({ error: 'Please set your "My Company" in Settings to generate executive summaries.' }, { status: 400 });
    }

    const transform = (offer: any): OfferForAnalysis => ({
      name: offer.name, displayName: offer.displayName, description: offer.description,
      category: offer.category, priceMonthly: offer.priceMonthly ? Number(offer.priceMonthly) : null,
      pricePromo: offer.pricePromo ? Number(offer.pricePromo) : null,
      promoTermMonths: offer.promoTermMonths, contractMonths: offer.contractMonths,
      downloadMbps: offer.downloadMbps, uploadMbps: offer.uploadMbps,
      provider: offer.provider,
      features: offer.features?.map((f: any) => ({ featureKey: f.featureKey, featureValue: f.featureValue })) || [],
    });

    const [myOffers, competitorOffers, segmentCount, totalOffers] = await Promise.all([
      db.offer.findMany({
        where: { providerId: focusProvider.id, isActive: true },
        include: { provider: { select: { displayName: true, slug: true } }, features: true },
      }),
      db.offer.findMany({
        where: { isActive: true, NOT: { providerId: focusProvider.id } },
        include: { provider: { select: { displayName: true, slug: true } }, features: true },
        take: 30,
      }),
      db.sMBSegment.count({ where: { isActive: true } }),
      db.offer.count({ where: { isActive: true } }),
    ]);

    const analysis = await generateExecutiveSummary(
      config,
      focusProvider.displayName,
      myOffers.map(transform),
      competitorOffers.map(transform),
      segmentCount,
      totalOffers,
    );

    await storeInsight({
      userId: session.user.id,
      insightType: 'EXECUTIVE_SUMMARY',
      title: `Executive Briefing: ${focusProvider.displayName}`,
      content: analysis,
      summary: analysis.headline,
      modelUsed: config.model,
      providerId: focusProvider.id,
      focusProviderId: focusProvider.id,
    });

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Error generating executive summary:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate analysis';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
