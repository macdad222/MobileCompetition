import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { generateComparisonNarrative, OfferForAnalysis } from '@/src/llm/analysis';
import { getLLMConfig, storeInsight } from '@/src/llm/helpers';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { provider1Slug, provider2Slug, category } = await req.json();
    if (!provider1Slug || !provider2Slug) {
      return NextResponse.json({ error: 'Both provider slugs are required' }, { status: 400 });
    }

    const config = await getLLMConfig(session.user.id);
    if (!config) {
      return NextResponse.json({ error: 'No LLM configuration found. Please configure your API key in Settings.' }, { status: 400 });
    }

    const [provider1, provider2] = await Promise.all([
      db.provider.findFirst({ where: { slug: provider1Slug } }),
      db.provider.findFirst({ where: { slug: provider2Slug } }),
    ]);
    if (!provider1 || !provider2) {
      return NextResponse.json({ error: 'One or both providers not found' }, { status: 404 });
    }

    const offerWhere = { isActive: true, ...(category ? { category } : {}) };
    const [offers1, offers2] = await Promise.all([
      db.offer.findMany({
        where: { ...offerWhere, providerId: provider1.id },
        include: { provider: { select: { displayName: true, slug: true } }, features: true },
      }),
      db.offer.findMany({
        where: { ...offerWhere, providerId: provider2.id },
        include: { provider: { select: { displayName: true, slug: true } }, features: true },
      }),
    ]);

    const transformOffer = (offer: typeof offers1[0]): OfferForAnalysis => ({
      name: offer.name, displayName: offer.displayName, description: offer.description,
      category: offer.category, priceMonthly: offer.priceMonthly ? Number(offer.priceMonthly) : null,
      pricePromo: offer.pricePromo ? Number(offer.pricePromo) : null,
      promoTermMonths: offer.promoTermMonths, contractMonths: offer.contractMonths,
      downloadMbps: offer.downloadMbps, uploadMbps: offer.uploadMbps,
      provider: offer.provider,
      features: offer.features.map(f => ({ featureKey: f.featureKey, featureValue: f.featureValue })),
    });

    const analysis = await generateComparisonNarrative(
      config, provider1.displayName, offers1.map(transformOffer),
      provider2.displayName, offers2.map(transformOffer)
    );

    // Persist the insight
    await storeInsight({
      userId: session.user.id,
      insightType: 'COMPARISON',
      title: `${provider1.displayName} vs ${provider2.displayName}`,
      content: analysis,
      summary: analysis.summary,
      modelUsed: config.model,
      providerId: provider1.id,
      provider2Id: provider2.id,
      category,
    });

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Error generating comparison:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate analysis';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
