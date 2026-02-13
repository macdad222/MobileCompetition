/**
 * Shared device incentive and contract buyout seed data templates.
 * Each provider collector customizes these with provider-specific plan tiers and pricing.
 */
import { CollectedDeviceIncentive, CollectedContractBuyout } from './base';

// Current device retail prices (MSRP)
export const DEVICE_PRICES: Record<string, number> = {
  // Apple iPhone 17 series (2025)
  'iPhone 17': 799,
  'iPhone 17 Pro': 1099,
  'iPhone 17 Pro Max': 1199,
  // Apple iPhone 16 series
  'iPhone 16': 699,
  'iPhone 16 Plus': 799,
  'iPhone 16 Pro': 999,
  'iPhone 16 Pro Max': 1099,
  // Samsung Galaxy S25 series
  'Galaxy S25': 799,
  'Galaxy S25+': 999,
  'Galaxy S25 Ultra': 1299,
  'Galaxy Z Fold 6': 1799,
  'Galaxy Z Flip 6': 1099,
  // Google Pixel 9 series
  'Pixel 9': 699,
  'Pixel 9 Pro': 999,
  'Pixel 9 Pro XL': 1099,
};

/**
 * Generate device incentive seed data for a given provider.
 */
export function generateProviderDeviceIncentives(
  providerName: string,
  planTiers: { starter: string; mid: string; premium: string },
  sourceUrl: string
): CollectedDeviceIncentive[] {
  return [
    // ── iPhone 17 Series ──────────────────────────────────────
    {
      deviceName: 'iPhone 17 Pro Max',
      deviceBrand: 'Apple',
      deviceModel: 'iPhone 17 Pro Max 256GB',
      incentiveType: 'FREE_WITH_PLAN',
      incentiveValue: 1199,
      deviceRetailPrice: 1199,
      monthlyCredit: 33.31,
      creditMonths: 36,
      conditions: `Free with eligible trade-in on ${planTiers.premium} plan. Trade-in of iPhone 13 or newer required. New line or upgrade.`,
      requiresTradeIn: true,
      requiresNewLine: false,
      requiresPortIn: false,
      minPlanTier: planTiers.premium,
      sourceUrl,
    },
    {
      deviceName: 'iPhone 17 Pro',
      deviceBrand: 'Apple',
      deviceModel: 'iPhone 17 Pro 128GB',
      incentiveType: 'FREE_WITH_PLAN',
      incentiveValue: 1099,
      deviceRetailPrice: 1099,
      monthlyCredit: 30.53,
      creditMonths: 36,
      conditions: `Free with eligible trade-in on ${planTiers.premium} or ${planTiers.mid} plan. Trade-in of iPhone 12 or newer.`,
      requiresTradeIn: true,
      requiresNewLine: false,
      requiresPortIn: false,
      minPlanTier: planTiers.mid,
      sourceUrl,
    },
    {
      deviceName: 'iPhone 17',
      deviceBrand: 'Apple',
      deviceModel: 'iPhone 17 128GB',
      incentiveType: 'MONTHLY_CREDIT',
      incentiveValue: 400,
      deviceRetailPrice: 799,
      monthlyCredit: 11.11,
      creditMonths: 36,
      conditions: `$400 off with any eligible trade-in on any ${providerName} business plan. Pay $399.99 remaining ($11.11/mo for 36 months).`,
      requiresTradeIn: true,
      requiresNewLine: false,
      requiresPortIn: false,
      minPlanTier: planTiers.starter,
      sourceUrl,
    },
    // ── iPhone 16 Series ──────────────────────────────────────
    {
      deviceName: 'iPhone 16 Pro',
      deviceBrand: 'Apple',
      deviceModel: 'iPhone 16 Pro 128GB',
      incentiveType: 'FREE_WITH_PLAN',
      incentiveValue: 999,
      deviceRetailPrice: 999,
      monthlyCredit: 27.75,
      creditMonths: 36,
      conditions: `Free with eligible trade-in on ${planTiers.mid} plan or higher. Trade-in of iPhone 11 or newer.`,
      requiresTradeIn: true,
      requiresNewLine: false,
      requiresPortIn: false,
      minPlanTier: planTiers.mid,
      sourceUrl,
    },
    {
      deviceName: 'iPhone 16',
      deviceBrand: 'Apple',
      deviceModel: 'iPhone 16 128GB',
      incentiveType: 'MONTHLY_CREDIT',
      incentiveValue: 350,
      deviceRetailPrice: 699,
      monthlyCredit: 9.72,
      creditMonths: 36,
      conditions: `$350 off with any eligible trade-in on any business plan.`,
      requiresTradeIn: true,
      requiresNewLine: false,
      requiresPortIn: false,
      minPlanTier: planTiers.starter,
      sourceUrl,
    },
    // ── Samsung Galaxy S25 Series ─────────────────────────────
    {
      deviceName: 'Galaxy S25 Ultra',
      deviceBrand: 'Samsung',
      deviceModel: 'Samsung Galaxy S25 Ultra 256GB',
      incentiveType: 'FREE_WITH_PLAN',
      incentiveValue: 1299,
      deviceRetailPrice: 1299,
      monthlyCredit: 36.08,
      creditMonths: 36,
      conditions: `Free with eligible trade-in on ${planTiers.premium} plan. Galaxy S21 or newer trade-in required.`,
      requiresTradeIn: true,
      requiresNewLine: false,
      requiresPortIn: false,
      minPlanTier: planTiers.premium,
      sourceUrl,
    },
    {
      deviceName: 'Galaxy S25',
      deviceBrand: 'Samsung',
      deviceModel: 'Samsung Galaxy S25 128GB',
      incentiveType: 'MONTHLY_CREDIT',
      incentiveValue: 400,
      deviceRetailPrice: 799,
      monthlyCredit: 11.08,
      creditMonths: 36,
      conditions: `$400 off with any eligible trade-in on any business plan.`,
      requiresTradeIn: true,
      requiresNewLine: false,
      requiresPortIn: false,
      minPlanTier: planTiers.starter,
      sourceUrl,
    },
    // ── Google Pixel 9 ────────────────────────────────────────
    {
      deviceName: 'Pixel 9 Pro',
      deviceBrand: 'Google',
      deviceModel: 'Google Pixel 9 Pro 128GB',
      incentiveType: 'MONTHLY_CREDIT',
      incentiveValue: 500,
      deviceRetailPrice: 999,
      monthlyCredit: 13.89,
      creditMonths: 36,
      conditions: `$500 off with eligible trade-in on ${planTiers.mid} or higher.`,
      requiresTradeIn: true,
      requiresNewLine: false,
      requiresPortIn: false,
      minPlanTier: planTiers.mid,
      sourceUrl,
    },
    // ── BOGO Deal ─────────────────────────────────────────────
    {
      deviceName: 'iPhone 17',
      deviceBrand: 'Apple',
      deviceModel: 'iPhone 17 128GB',
      incentiveType: 'BOGO',
      incentiveValue: 799,
      deviceRetailPrice: 799,
      monthlyCredit: 22.19,
      creditMonths: 36,
      conditions: `Buy one iPhone 17 get one free. Both lines must be on ${planTiers.mid} or higher. Second device via monthly bill credits over 36 months.`,
      requiresTradeIn: false,
      requiresNewLine: true,
      requiresPortIn: false,
      minPlanTier: planTiers.mid,
      sourceUrl,
    },
  ];
}

/**
 * Generate contract buyout seed data for a given provider with detailed T&Cs.
 */
export function generateProviderBuyout(
  maxAmount: number,
  perLineMax: number,
  method: string,
  sourceUrl: string,
  extras?: Partial<CollectedContractBuyout>
): CollectedContractBuyout {
  return {
    maxAmount,
    perLineMax,
    method,
    conditions: extras?.conditions ||
      `Switch to us and we'll pay up to $${perLineMax} per line to cover your early termination fees and device payments. Port-in required.${extras?.requiresTradeIn ? ' Trade-in of current device required.' : ''}`,
    requiresPortIn: extras?.requiresPortIn ?? true,
    requiresTradeIn: extras?.requiresTradeIn ?? false,
    minLinesRequired: extras?.minLinesRequired ?? 1,
    eligibleFromProviders: extras?.eligibleFromProviders ?? ['any'],
    coverageScope: extras?.coverageScope ?? 'Early termination fees (ETFs) and remaining device installment balances',
    submissionDeadline: extras?.submissionDeadline ?? '60 days from activation',
    paymentTimeline: extras?.paymentTimeline ?? '8-12 weeks after submission approval',
    proofRequired: extras?.proofRequired ?? 'Final bill from previous carrier showing ETF or remaining device balance',
    maxLinesEligible: extras?.maxLinesEligible ?? 5,
    excludedPlans: extras?.excludedPlans ?? undefined,
    finePrint: extras?.finePrint ?? undefined,
    stackableWithDeals: extras?.stackableWithDeals ?? true,
    sourceUrl,
  };
}
