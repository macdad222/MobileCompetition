import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { generateProviderAnalysis, OfferForAnalysis } from '@/src/llm/analysis';
import { getLLMConfig, storeInsight } from '@/src/llm/helpers';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { providerSlug } = await req.json();
    if (!providerSlug) {
      return NextResponse.json({ error: 'Provider slug is required' }, { status: 400 });
    }

    const config = await getLLMConfig(session.user.id);
    if (!config) {
      return NextResponse.json({ error: 'No LLM configuration found. Please configure your API key in Settings.' }, { status: 400 });
    }

    const provider = await db.provider.findFirst({ where: { slug: providerSlug } });
    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const offers = await db.offer.findMany({
      where: { providerId: provider.id, isActive: true },
      include: { provider: { select: { displayName: true, slug: true } }, features: true },
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

    const analysis = await generateProviderAnalysis(config, provider.displayName, transformedOffers);

    await storeInsight({
      userId: session.user.id,
      insightType: 'PROVIDER',
      title: `${provider.displayName} Analysis`,
      content: analysis,
      summary: analysis.overview,
      modelUsed: config.model,
      providerId: provider.id,
    });

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Error generating provider analysis:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate analysis';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
