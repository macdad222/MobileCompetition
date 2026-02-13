import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { generateCompetitiveIntel, OfferForAnalysis } from '@/src/llm/analysis';
import { getLLMConfig, storeInsight, getUserFocusProvider } from '@/src/llm/helpers';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { segmentId } = await req.json();

    const config = await getLLMConfig(session.user.id);
    if (!config) {
      return NextResponse.json({ error: 'No LLM configuration found. Please configure your API key in Settings.' }, { status: 400 });
    }

    const focusProvider = await getUserFocusProvider(session.user.id);
    if (!focusProvider) {
      return NextResponse.json({ error: 'Please set your "My Company" in Settings to use competitive intelligence.' }, { status: 400 });
    }

    // Get segment if provided
    let segment = null;
    if (segmentId) {
      segment = await db.sMBSegment.findUnique({ where: { id: segmentId } });
    }

    // Get focus provider's offers
    const myOffers = await db.offer.findMany({
      where: { providerId: focusProvider.id, isActive: true },
      include: { provider: { select: { displayName: true, slug: true } }, features: true },
    });

    // Get competitor offers grouped by provider
    const competitorOffers = await db.offer.findMany({
      where: { isActive: true, NOT: { providerId: focusProvider.id } },
      include: { provider: { select: { displayName: true, slug: true } }, features: true },
      orderBy: { provider: { priorityRank: 'asc' } },
    });

    const transform = (offer: typeof myOffers[0]): OfferForAnalysis => ({
      name: offer.name, displayName: offer.displayName, description: offer.description,
      category: offer.category, priceMonthly: offer.priceMonthly ? Number(offer.priceMonthly) : null,
      pricePromo: offer.pricePromo ? Number(offer.pricePromo) : null,
      promoTermMonths: offer.promoTermMonths, contractMonths: offer.contractMonths,
      downloadMbps: offer.downloadMbps, uploadMbps: offer.uploadMbps,
      provider: offer.provider,
      features: offer.features.map(f => ({ featureKey: f.featureKey, featureValue: f.featureValue })),
    });

    // Group competitors
    const competitorMap = new Map<string, { name: string; offers: OfferForAnalysis[] }>();
    for (const offer of competitorOffers) {
      const key = offer.provider.slug;
      if (!competitorMap.has(key)) {
        competitorMap.set(key, { name: offer.provider.displayName, offers: [] });
      }
      competitorMap.get(key)!.offers.push(transform(offer));
    }

    const analysis = await generateCompetitiveIntel(
      config,
      focusProvider.displayName,
      myOffers.map(transform),
      Array.from(competitorMap.values()),
      segment || undefined
    );

    await storeInsight({
      userId: session.user.id,
      insightType: 'COMPETITIVE_INTEL',
      title: `Competitive Intel: ${focusProvider.displayName}`,
      content: analysis,
      summary: analysis.executiveSummary,
      modelUsed: config.model,
      providerId: focusProvider.id,
      segmentId: segmentId || undefined,
      focusProviderId: focusProvider.id,
    });

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Error generating competitive intel:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate analysis';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
