import { BaseCollector, CollectorConfig, CollectionResult, CollectedOffer, CollectedDeviceIncentive, CollectedContractBuyout } from '../base';
import { OfferCategory } from '@prisma/client';
import { generateProviderDeviceIncentives, generateProviderBuyout } from '../device-seed-data';

// Optimum Business source URLs
const OPTIMUM_URLS: Record<string, string> = {
  broadband: 'https://www.optimum.com/business/internet',
  voice: 'https://www.optimum.com/business/phone',
  mobile: 'https://www.optimum.com/business/mobile',
  packages: 'https://www.optimum.com/business/bundles',
  devices: 'https://www.optimum.com/business/mobile',
};

const CATEGORY_URL_MAP: Record<string, string> = {
  BROADBAND: OPTIMUM_URLS.broadband,
  VOICE: OPTIMUM_URLS.voice,
  MOBILE: OPTIMUM_URLS.mobile,
  PACKAGE: OPTIMUM_URLS.packages,
};

// ─── Seed/fallback data ───────────────────────────────────────────────────

const SEED_BROADBAND: CollectedOffer[] = [
  {
    name: 'optimum-business-200', displayName: 'Optimum Business 200',
    description: 'Fast internet for small businesses', category: 'BROADBAND',
    priceMonthly: 54.99, pricePromo: 44.99, promoTermMonths: 12, downloadMbps: 200, uploadMbps: 35,
    features: { contract: 'none', wifi_router: 'included', static_ip: 'optional' },
    sourceUrl: OPTIMUM_URLS.broadband,
  },
  {
    name: 'optimum-business-500', displayName: 'Optimum Business 500',
    description: 'Enhanced speeds for growing teams', category: 'BROADBAND',
    priceMonthly: 74.99, pricePromo: 59.99, promoTermMonths: 12, downloadMbps: 500, uploadMbps: 50,
    features: { contract: 'none', wifi_router: 'included', static_ip: 'optional' },
    sourceUrl: OPTIMUM_URLS.broadband,
  },
  {
    name: 'optimum-business-1gig', displayName: 'Optimum Business 1 Gig',
    description: 'Gigabit fiber for demanding businesses', category: 'BROADBAND',
    priceMonthly: 109.99, pricePromo: 89.99, promoTermMonths: 12, downloadMbps: 1000, uploadMbps: 1000,
    features: { symmetric: 'true', contract: 'none', wifi_router: 'included', static_ip: 'included' },
    sourceUrl: OPTIMUM_URLS.broadband,
  },
];

const SEED_VOICE: CollectedOffer[] = [
  {
    name: 'optimum-business-voice', displayName: 'Optimum Business Voice',
    description: 'Crystal clear business phone service', category: 'VOICE',
    priceMonthly: 24.99,
    features: { unlimited_calling: 'true', voicemail: 'included', caller_id: 'included', call_forwarding: 'included' },
    sourceUrl: OPTIMUM_URLS.voice,
  },
  {
    name: 'optimum-business-voice-plus', displayName: 'Optimum Business Voice Plus',
    description: 'Advanced phone with hunt groups and auto attendant', category: 'VOICE',
    priceMonthly: 34.99,
    features: { unlimited_calling: 'true', voicemail: 'included', caller_id: 'included', call_forwarding: 'included', auto_attendant: 'included', hunt_groups: 'included', conference_calling: 'included' },
    sourceUrl: OPTIMUM_URLS.voice,
  },
];

const SEED_MOBILE: CollectedOffer[] = [
  {
    name: 'optimum-business-mobile-unlimited', displayName: 'Optimum Business Mobile Unlimited',
    description: 'Unlimited talk, text and data for business lines', category: 'MOBILE',
    priceMonthly: 30.00, unlimitedData: true,
    features: { network: '5G', hotspot: '10GB', talk_text: 'unlimited', requires_internet: 'true' },
    sourceUrl: OPTIMUM_URLS.mobile,
  },
  {
    name: 'optimum-business-mobile-by-the-gig', displayName: 'Optimum Business Mobile By the Gig',
    description: 'Pay per gigabyte for light data users', category: 'MOBILE',
    priceMonthly: 12.00, dataAllowanceGb: 1, unlimitedData: false,
    features: { network: '5G', hotspot: 'shared_data', talk_text: 'unlimited', requires_internet: 'true' },
    sourceUrl: OPTIMUM_URLS.mobile,
  },
];

const SEED_PACKAGES: CollectedOffer[] = [
  {
    name: 'optimum-business-internet-voice-starter', displayName: 'Optimum Internet + Voice Starter',
    description: 'Internet and phone bundle with no contract required', category: 'PACKAGE',
    priceMonthly: 69.98, pricePromo: 54.98, promoTermMonths: 12, downloadMbps: 200, uploadMbps: 35,
    bundleOptions: ['Optimum Business 200', 'Optimum Business Voice'],
    features: { bundle_discount: '15%', tier: 'Starter', package_type: 'TIERED', contract: 'none' },
    sourceUrl: OPTIMUM_URLS.packages,
  },
  {
    name: 'optimum-business-double-play', displayName: 'Optimum Business Double Play',
    description: 'Fast internet with enhanced voice for growing offices', category: 'PACKAGE',
    priceMonthly: 99.98, pricePromo: 79.98, promoTermMonths: 12, downloadMbps: 500, uploadMbps: 50,
    bundleOptions: ['Optimum Business 500', 'Optimum Business Voice Plus'],
    features: { bundle_discount: '20%', tier: 'Standard', package_type: 'TIERED', contract: 'none' },
    sourceUrl: OPTIMUM_URLS.packages,
  },
  {
    name: 'optimum-business-total-package', displayName: 'Optimum Business Total Package',
    description: 'Gig internet + advanced voice + mobile for complete connectivity', category: 'PACKAGE',
    priceMonthly: 164.98, pricePromo: 129.98, promoTermMonths: 12, downloadMbps: 1000, uploadMbps: 1000,
    bundleOptions: ['Optimum Business 1 Gig', 'Optimum Business Voice Plus', 'Optimum Business Mobile Unlimited'],
    features: { bundle_discount: '25%', tier: 'Premium', package_type: 'TIERED', contract: 'none', symmetric: 'true', mobile_lines: '1' },
    sourceUrl: OPTIMUM_URLS.packages,
  },
  {
    name: 'optimum-internet-mobile-value', displayName: 'Optimum Internet + Mobile Value',
    description: 'No-contract internet and mobile at an affordable price', category: 'PACKAGE',
    priceMonthly: 74.99, pricePromo: 59.99, promoTermMonths: 12, downloadMbps: 200, uploadMbps: 35,
    bundleOptions: ['Optimum Business 200', 'Optimum Business Mobile Unlimited'],
    features: { bundle_discount: '12%', tier: 'Value', package_type: 'FIXED', contract: 'none', mobile_lines: '1' },
    sourceUrl: OPTIMUM_URLS.packages,
  },
];

const SEED_DEVICE_INCENTIVES: CollectedDeviceIncentive[] = generateProviderDeviceIncentives(
  'Optimum Business',
  { starter: 'Mobile By the Gig', mid: 'Mobile Unlimited', premium: 'Mobile Unlimited Plus' },
  OPTIMUM_URLS.devices
);

const SEED_CONTRACT_BUYOUT: CollectedContractBuyout = generateProviderBuyout(
  500, 500, 'ACCOUNT_CREDIT', OPTIMUM_URLS.devices, {
    requiresTradeIn: false,
    conditions: 'Switch to Optimum Business Mobile and receive up to $500/line as account credit toward switching costs.',
    coverageScope: 'ETFs and remaining device installment balances',
    submissionDeadline: '45 days from activation date',
    paymentTimeline: 'Account credit applied within 4-6 weeks of claim approval',
    proofRequired: 'Final bill from previous carrier showing ETF or remaining device balance',
    maxLinesEligible: 5,
    excludedPlans: 'By the Gig base plan not eligible; must be on Unlimited or higher',
    finePrint: 'Optimum internet required for mobile eligibility; credit forfeited if cancelled within 12 months; lowest max buyout among major providers; limited regional availability',
    stackableWithDeals: true,
  }
);

const SEED_MAP: Record<string, CollectedOffer[]> = {
  BROADBAND: SEED_BROADBAND, VOICE: SEED_VOICE, MOBILE: SEED_MOBILE, PACKAGE: SEED_PACKAGES,
};

// ─── Collector ────────────────────────────────────────────────────────────

export class OptimumBusinessCollector extends BaseCollector {
  providerSlug = 'optimum-business';
  supportedCategories: OfferCategory[] = ['BROADBAND', 'VOICE', 'MOBILE', 'PACKAGE'];

  async collect(config: CollectorConfig): Promise<CollectionResult[]> {
    const results: CollectionResult[] = [];

    for (const category of config.categories) {
      if (!this.supportedCategories.includes(category)) continue;

      const url = CATEGORY_URL_MAP[category] || OPTIMUM_URLS.broadband;

      const scraped = await this.scrapeAndExtract(url, 'Optimum Business', category, config.llmConfig);
      if (scraped) {
        const result: CollectionResult = { success: true, offers: scraped.offers, rawContent: scraped.rawContent, sourceUrl: url, scraped: true };
        if (category === 'MOBILE') {
          const deviceData = await this.scrapeDeviceIncentives(OPTIMUM_URLS.devices, 'Optimum Business', config.llmConfig);
          result.deviceIncentives = deviceData?.devices || SEED_DEVICE_INCENTIVES;
          result.contractBuyout = deviceData?.buyout || SEED_CONTRACT_BUYOUT;
        }
        results.push(result);
        continue;
      }

      const seedOffers = SEED_MAP[category] || [];
      const result: CollectionResult = {
        success: true, offers: seedOffers,
        rawContent: JSON.stringify({ provider: this.providerSlug, category, fetchedAt: new Date().toISOString(), source: 'seed_data', plans: seedOffers }, null, 2),
        sourceUrl: url, scraped: false,
      };
      if (category === 'MOBILE') {
        result.deviceIncentives = SEED_DEVICE_INCENTIVES;
        result.contractBuyout = SEED_CONTRACT_BUYOUT;
      }
      results.push(result);
    }

    return results;
  }
}
