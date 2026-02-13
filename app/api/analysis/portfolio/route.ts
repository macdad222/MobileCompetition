import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getLLMConfig, storeInsight } from '@/src/llm/helpers';
import {
  generatePortfolioAnalysis,
  generateCrossProviderPackageComparison,
  PackageForAnalysis,
} from '@/src/llm/analysis';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = await getLLMConfig(session.user.id);
    if (!config) {
      return NextResponse.json({ error: 'LLM not configured. Please add an API key in Settings.' }, { status: 400 });
    }

    const body = await req.json();
    const { type, providerId } = body; // type = 'provider' | 'cross-provider'

    if (type === 'provider' && providerId) {
      // Single provider portfolio analysis
      const provider = await db.provider.findUnique({
        where: { id: providerId },
        select: { id: true, displayName: true, slug: true },
      });

      if (!provider) {
        return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
      }

      // Fetch packages with full relations
      const packages = await db.package.findMany({
        where: { providerId: provider.id, isActive: true },
        include: {
          provider: { select: { displayName: true, slug: true } },
          includedOffers: {
            include: {
              offer: {
                select: {
                  displayName: true,
                  category: true,
                  priceMonthly: true,
                  downloadMbps: true,
                  uploadMbps: true,
                },
              },
            },
          },
          addOns: {
            select: { displayName: true, price: true, description: true },
          },
        },
        orderBy: { basePrice: 'asc' },
      });

      // Fetch standalone offers for context
      const standaloneOffers = await db.offer.findMany({
        where: { providerId: provider.id, isActive: true },
        include: {
          provider: { select: { displayName: true, slug: true } },
          features: true,
        },
        take: 20,
      });

      const formattedPackages: PackageForAnalysis[] = packages.map((p) => ({
        name: p.name,
        displayName: p.displayName,
        description: p.description,
        packageType: p.packageType,
        tier: p.tier,
        basePrice: p.basePrice ? Number(p.basePrice) : null,
        targetSegments: p.targetSegments,
        provider: { displayName: p.provider.displayName, slug: p.provider.slug },
        includedOffers: p.includedOffers.map((io) => ({
          offer: {
            displayName: io.offer.displayName,
            category: io.offer.category,
            priceMonthly: io.offer.priceMonthly ? Number(io.offer.priceMonthly) : null,
            downloadMbps: io.offer.downloadMbps,
            uploadMbps: io.offer.uploadMbps,
          },
        })),
        addOns: p.addOns.map((a) => ({
          displayName: a.displayName,
          price: a.price ? Number(a.price) : null,
          description: a.description,
        })),
      }));

      const formattedOffers = standaloneOffers.map((o) => ({
        name: o.name,
        displayName: o.displayName,
        description: o.description,
        category: o.category,
        priceMonthly: o.priceMonthly ? Number(o.priceMonthly) : null,
        pricePromo: o.pricePromo ? Number(o.pricePromo) : null,
        promoTermMonths: o.promoTermMonths,
        contractMonths: o.contractMonths,
        downloadMbps: o.downloadMbps,
        uploadMbps: o.uploadMbps,
        provider: { displayName: o.provider.displayName, slug: o.provider.slug },
        features: o.features.map((f) => ({ featureKey: f.featureKey, featureValue: f.featureValue })),
      }));

      if (formattedPackages.length === 0) {
        return NextResponse.json({ error: 'No packages found for this provider. Try refreshing data with the PACKAGE category selected.' }, { status: 400 });
      }

      const analysis = await generatePortfolioAnalysis(config, provider.displayName, formattedPackages, formattedOffers);

      // Store the insight
      await storeInsight({
        userId: session.user.id,
        insightType: 'PORTFOLIO_ANALYSIS',
        title: `Product Portfolio: ${provider.displayName}`,
        content: analysis,
        summary: analysis.executiveSummary,
        modelUsed: config.model,
        providerId: provider.id,
      });

      return NextResponse.json({ analysis, provider: provider.displayName });
    } else if (type === 'cross-provider') {
      // Cross-provider package comparison
      const providers = await db.provider.findMany({
        where: { isActive: true },
        select: { id: true, displayName: true, slug: true },
      });

      const providerPackages: { providerName: string; packages: PackageForAnalysis[] }[] = [];

      for (const provider of providers) {
        const packages = await db.package.findMany({
          where: { providerId: provider.id, isActive: true },
          include: {
            provider: { select: { displayName: true, slug: true } },
            includedOffers: {
              include: {
                offer: {
                  select: {
                    displayName: true,
                    category: true,
                    priceMonthly: true,
                    downloadMbps: true,
                    uploadMbps: true,
                  },
                },
              },
            },
            addOns: {
              select: { displayName: true, price: true, description: true },
            },
          },
          orderBy: { basePrice: 'asc' },
        });

        if (packages.length > 0) {
          providerPackages.push({
            providerName: provider.displayName,
            packages: packages.map((p) => ({
              name: p.name,
              displayName: p.displayName,
              description: p.description,
              packageType: p.packageType,
              tier: p.tier,
              basePrice: p.basePrice ? Number(p.basePrice) : null,
              targetSegments: p.targetSegments,
              provider: { displayName: p.provider.displayName, slug: p.provider.slug },
              includedOffers: p.includedOffers.map((io) => ({
                offer: {
                  displayName: io.offer.displayName,
                  category: io.offer.category,
                  priceMonthly: io.offer.priceMonthly ? Number(io.offer.priceMonthly) : null,
                  downloadMbps: io.offer.downloadMbps,
                  uploadMbps: io.offer.uploadMbps,
                },
              })),
              addOns: p.addOns.map((a) => ({
                displayName: a.displayName,
                price: a.price ? Number(a.price) : null,
                description: a.description,
              })),
            })),
          });
        }
      }

      if (providerPackages.length < 2) {
        return NextResponse.json({ error: 'Need at least 2 providers with packages for cross-provider comparison.' }, { status: 400 });
      }

      const comparison = await generateCrossProviderPackageComparison(config, providerPackages);

      await storeInsight({
        userId: session.user.id,
        insightType: 'PORTFOLIO_ANALYSIS',
        title: 'Cross-Provider Package Comparison',
        content: comparison,
        summary: comparison.marketOverview,
        modelUsed: config.model,
        category: 'cross-provider',
      });

      return NextResponse.json({ comparison });
    }

    return NextResponse.json({ error: 'Invalid analysis type. Use "provider" or "cross-provider".' }, { status: 400 });
  } catch (error) {
    console.error('Error generating portfolio analysis:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate analysis' },
      { status: 500 }
    );
  }
}
