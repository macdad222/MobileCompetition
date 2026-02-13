import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getLLMConfig, storeInsight } from '@/src/llm/helpers';
import { generateMobileDeepAnalysis, generateMobileComparisonAnalysis } from '@/src/llm/analysis';

// POST - Generate mobile deep analysis
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const llmConfig = await getLLMConfig(session.user.id);
    if (!llmConfig) {
      return NextResponse.json({ error: 'LLM not configured. Add your API key in Settings.' }, { status: 400 });
    }

    const body = await req.json();
    const { type, providerId } = body;

    if (type === 'provider') {
      if (!providerId) {
        return NextResponse.json({ error: 'providerId required' }, { status: 400 });
      }

      const provider = await db.provider.findUnique({ where: { id: providerId } });
      if (!provider) {
        return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
      }

      // Fetch mobile offers
      const offers = await db.offer.findMany({
        where: { providerId, category: 'MOBILE', isActive: true },
        include: {
          provider: { select: { displayName: true, slug: true } },
          features: true,
        },
      });

      // Fetch device incentives
      const deviceIncentives = await db.deviceIncentive.findMany({
        where: { providerId, isActive: true },
      });

      // Fetch contract buyout
      const buyout = await db.contractBuyout.findFirst({
        where: { providerId, isActive: true },
      });

      const offersForAnalysis = offers.map(o => ({
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
        provider: o.provider,
        features: o.features.map(f => ({ featureKey: f.featureKey, featureValue: f.featureValue })),
      }));

      const incentivesForAnalysis = deviceIncentives.map(d => ({
        deviceName: d.deviceName,
        deviceBrand: d.deviceBrand,
        deviceModel: d.deviceModel,
        incentiveType: d.incentiveType,
        incentiveValue: d.incentiveValue ? Number(d.incentiveValue) : null,
        deviceRetailPrice: d.deviceRetailPrice ? Number(d.deviceRetailPrice) : null,
        monthlyCredit: d.monthlyCredit ? Number(d.monthlyCredit) : null,
        creditMonths: d.creditMonths,
        conditions: d.conditions,
        requiresTradeIn: d.requiresTradeIn,
        requiresNewLine: d.requiresNewLine,
        requiresPortIn: d.requiresPortIn,
        minPlanTier: d.minPlanTier,
      }));

      const buyoutForAnalysis = buyout ? {
        maxBuyoutAmount: buyout.maxBuyoutAmount ? Number(buyout.maxBuyoutAmount) : null,
        perLineMax: buyout.perLineMax ? Number(buyout.perLineMax) : null,
        buyoutMethod: buyout.buyoutMethod,
        conditions: buyout.conditions,
        requiresPortIn: buyout.requiresPortIn,
        requiresTradeIn: buyout.requiresTradeIn,
      } : null;

      const result = await generateMobileDeepAnalysis(
        llmConfig,
        provider.displayName,
        offersForAnalysis,
        incentivesForAnalysis,
        buyoutForAnalysis
      );

      // Store insight
      await storeInsight({
        userId: session.user.id,
        insightType: 'MOBILE_DEEP_ANALYSIS',
        title: `Mobile Deep Analysis: ${provider.displayName}`,
        content: result,
        summary: result.executiveSummary,
        modelUsed: llmConfig.model,
        providerId: provider.id,
      });

      return NextResponse.json({ analysis: result });
    }

    if (type === 'cross-provider') {
      // Get all providers with mobile offers
      const providers = await db.provider.findMany({
        where: { isActive: true },
        include: {
          offers: {
            where: { category: 'MOBILE', isActive: true },
            include: { features: true },
          },
          deviceIncentives: { where: { isActive: true } },
          contractBuyouts: { where: { isActive: true }, take: 1 },
        },
      });

      const providerData = providers
        .filter(p => p.offers.length > 0)
        .map(p => ({
          providerName: p.displayName,
          offers: p.offers.map(o => ({
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
            provider: { displayName: p.displayName, slug: p.slug },
            features: o.features.map(f => ({ featureKey: f.featureKey, featureValue: f.featureValue })),
          })),
          deviceIncentives: p.deviceIncentives.map(d => ({
            deviceName: d.deviceName,
            deviceBrand: d.deviceBrand,
            deviceModel: d.deviceModel,
            incentiveType: d.incentiveType,
            incentiveValue: d.incentiveValue ? Number(d.incentiveValue) : null,
            deviceRetailPrice: d.deviceRetailPrice ? Number(d.deviceRetailPrice) : null,
            monthlyCredit: d.monthlyCredit ? Number(d.monthlyCredit) : null,
            creditMonths: d.creditMonths,
            conditions: d.conditions,
            requiresTradeIn: d.requiresTradeIn,
            requiresNewLine: d.requiresNewLine,
            requiresPortIn: d.requiresPortIn,
            minPlanTier: d.minPlanTier,
          })),
          buyout: p.contractBuyouts[0] ? {
            maxBuyoutAmount: p.contractBuyouts[0].maxBuyoutAmount ? Number(p.contractBuyouts[0].maxBuyoutAmount) : null,
            perLineMax: p.contractBuyouts[0].perLineMax ? Number(p.contractBuyouts[0].perLineMax) : null,
            buyoutMethod: p.contractBuyouts[0].buyoutMethod,
            conditions: p.contractBuyouts[0].conditions,
            requiresPortIn: p.contractBuyouts[0].requiresPortIn,
            requiresTradeIn: p.contractBuyouts[0].requiresTradeIn,
          } : null,
        }));

      const result = await generateMobileComparisonAnalysis(llmConfig, providerData);

      await storeInsight({
        userId: session.user.id,
        insightType: 'MOBILE_DEEP_ANALYSIS',
        title: 'Cross-Provider Mobile Comparison',
        content: result,
        summary: result.marketOverview,
        modelUsed: llmConfig.model,
      });

      return NextResponse.json({ analysis: result });
    }

    return NextResponse.json({ error: 'Invalid type. Use "provider" or "cross-provider".' }, { status: 400 });
  } catch (error) {
    console.error('Error generating mobile analysis:', error);
    return NextResponse.json({ error: 'Failed to generate analysis' }, { status: 500 });
  }
}
