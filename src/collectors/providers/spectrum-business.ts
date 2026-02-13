import { BaseCollector, CollectorConfig, CollectionResult, CollectedOffer, CollectedDeviceIncentive, CollectedContractBuyout, ContentSelectors } from '../base';
import { OfferCategory } from '@prisma/client';
import { generateProviderDeviceIncentives, generateProviderBuyout } from '../device-seed-data';

// Spectrum Business source URLs
// NOTE: business.spectrum.com redirects to www.spectrum.com/business/* (updated Feb 2026).
// Using canonical www.spectrum.com URLs directly avoids redirect hops.
// These pages serve server-rendered HTML with pricing data — simple fetch works.
const SPECTRUM_URLS: Record<string, string> = {
  broadband: 'https://www.spectrum.com/business/internet',
  voice: 'https://www.spectrum.com/business/phone',
  mobile: 'https://www.spectrum.com/business/mobile',
  packages: 'https://www.spectrum.com/business/bundles',
  devices: 'https://www.spectrum.com/business/mobile',
};

const CATEGORY_URL_MAP: Record<string, string> = {
  BROADBAND: SPECTRUM_URLS.broadband,
  VOICE: SPECTRUM_URLS.voice,
  MOBILE: SPECTRUM_URLS.mobile,
  PACKAGE: SPECTRUM_URLS.packages,
};

// ─── Seed/fallback data ───────────────────────────────────────────────────

const SEED_BROADBAND: CollectedOffer[] = [
  {
    name: 'spectrum-business-internet-300', displayName: 'Spectrum Business Internet 300',
    description: 'Fast download speeds for small businesses', category: 'BROADBAND',
    priceMonthly: 64.99, pricePromo: 49.99, promoTermMonths: 12, downloadMbps: 300, uploadMbps: 20,
    features: { contract: 'none', modem_included: 'true', unlimited_data: 'true', static_ip: 'optional' },
    sourceUrl: SPECTRUM_URLS.broadband,
  },
  {
    name: 'spectrum-business-internet-600', displayName: 'Spectrum Business Internet 600',
    description: 'High-speed internet for growing businesses', category: 'BROADBAND',
    priceMonthly: 84.99, pricePromo: 69.99, promoTermMonths: 12, downloadMbps: 600, uploadMbps: 35,
    features: { contract: 'none', modem_included: 'true', unlimited_data: 'true', static_ip: 'optional' },
    sourceUrl: SPECTRUM_URLS.broadband,
  },
  {
    name: 'spectrum-business-internet-gig', displayName: 'Spectrum Business Internet Gig',
    description: 'Gigabit speeds for demanding businesses', category: 'BROADBAND',
    priceMonthly: 164.99, pricePromo: 129.99, promoTermMonths: 12, downloadMbps: 1000, uploadMbps: 50,
    features: { contract: 'none', modem_included: 'true', unlimited_data: 'true', static_ip: 'included' },
    sourceUrl: SPECTRUM_URLS.broadband,
  },
];

const SEED_VOICE: CollectedOffer[] = [
  {
    name: 'spectrum-business-voice', displayName: 'Spectrum Business Voice',
    description: 'Unlimited local and long distance calling', category: 'VOICE',
    priceMonthly: 29.99,
    features: { unlimited_local: 'true', unlimited_long_distance: 'true', voicemail: 'included', caller_id: 'included' },
    sourceUrl: SPECTRUM_URLS.voice,
  },
  {
    name: 'spectrum-business-voice-plus', displayName: 'Spectrum Business Voice Plus',
    description: 'Enhanced business phone with advanced call management', category: 'VOICE',
    priceMonthly: 39.99,
    features: { unlimited_local: 'true', unlimited_long_distance: 'true', voicemail: 'included', caller_id: 'included', call_recording: 'included', hunt_groups: 'included', auto_attendant: 'basic' },
    sourceUrl: SPECTRUM_URLS.voice,
  },
];

const SEED_MOBILE: CollectedOffer[] = [
  {
    name: 'spectrum-business-mobile-unlimited', displayName: 'Spectrum Business Mobile Unlimited',
    description: 'Unlimited data on the Spectrum mobile network', category: 'MOBILE',
    priceMonthly: 29.99, unlimitedData: true,
    features: { network: '5G', hotspot: '10GB', talk_text: 'unlimited', requires_internet: 'true' },
    sourceUrl: SPECTRUM_URLS.mobile,
  },
  {
    name: 'spectrum-business-mobile-by-the-gig', displayName: 'Spectrum Business Mobile By the Gig',
    description: 'Pay only for the data you use', category: 'MOBILE',
    priceMonthly: 14.00, dataAllowanceGb: 1, unlimitedData: false,
    features: { network: '5G', hotspot: 'shared_data', talk_text: 'unlimited', requires_internet: 'true' },
    sourceUrl: SPECTRUM_URLS.mobile,
  },
];

const SEED_PACKAGES: CollectedOffer[] = [
  {
    name: 'spectrum-business-internet-voice-bundle', displayName: 'Spectrum Internet + Voice Bundle',
    description: 'Save when you combine business internet and phone service', category: 'PACKAGE',
    priceMonthly: 84.98, pricePromo: 64.98, promoTermMonths: 12, downloadMbps: 300, uploadMbps: 20,
    bundleOptions: ['Spectrum Business Internet 300', 'Spectrum Business Voice'],
    features: { bundle_discount: '15%', tier: 'Starter', package_type: 'TIERED', contract: 'none' },
    sourceUrl: SPECTRUM_URLS.packages,
  },
  {
    name: 'spectrum-business-double-play', displayName: 'Spectrum Business Double Play',
    description: 'High-speed internet + voice with enhanced features', category: 'PACKAGE',
    priceMonthly: 114.98, pricePromo: 89.98, promoTermMonths: 12, downloadMbps: 600, uploadMbps: 35,
    bundleOptions: ['Spectrum Business Internet 600', 'Spectrum Business Voice Plus'],
    features: { bundle_discount: '20%', tier: 'Standard', package_type: 'TIERED', contract: 'none', static_ip: 'optional' },
    sourceUrl: SPECTRUM_URLS.packages,
  },
  {
    name: 'spectrum-business-triple-play', displayName: 'Spectrum Business Triple Play',
    description: 'Gig internet + voice + mobile for complete business connectivity', category: 'PACKAGE',
    priceMonthly: 209.97, pricePromo: 164.97, promoTermMonths: 12, downloadMbps: 1000, uploadMbps: 50,
    bundleOptions: ['Spectrum Business Internet Gig', 'Spectrum Business Voice Plus', 'Spectrum Business Mobile Unlimited'],
    features: { bundle_discount: '25%', tier: 'Premium', package_type: 'TIERED', contract: 'none', static_ip: 'included', mobile_lines: '1' },
    sourceUrl: SPECTRUM_URLS.packages,
  },
  {
    name: 'spectrum-internet-mobile-saver', displayName: 'Spectrum Internet + Mobile Saver',
    description: 'No-contract internet paired with affordable mobile', category: 'PACKAGE',
    priceMonthly: 79.98, pricePromo: 64.98, promoTermMonths: 12, downloadMbps: 300, uploadMbps: 20,
    bundleOptions: ['Spectrum Business Internet 300', 'Spectrum Business Mobile Unlimited'],
    features: { bundle_discount: '12%', tier: 'Value', package_type: 'FIXED', contract: 'none', mobile_lines: '1' },
    sourceUrl: SPECTRUM_URLS.packages,
  },
];

const SEED_DEVICE_INCENTIVES: CollectedDeviceIncentive[] = generateProviderDeviceIncentives(
  'Spectrum Business',
  { starter: 'Mobile By the Gig', mid: 'Mobile Unlimited', premium: 'Mobile Unlimited Premium' },
  SPECTRUM_URLS.devices
);

const SEED_CONTRACT_BUYOUT: CollectedContractBuyout = generateProviderBuyout(
  750, 750, 'ACCOUNT_CREDIT', SPECTRUM_URLS.devices, {
    requiresTradeIn: false,
    conditions: 'Switch to Spectrum Business Mobile and receive up to $750/line as account credit. Must be existing Spectrum Business Internet customer.',
    coverageScope: 'ETFs and remaining device installment balances from previous wireless carrier',
    submissionDeadline: '60 days from mobile line activation',
    paymentTimeline: 'Account credit applied within 1-2 billing cycles; typically faster than competitors',
    proofRequired: 'Final bill from previous carrier; submit via Spectrum Business portal or in-store',
    maxLinesEligible: 10,
    excludedPlans: 'No plan exclusions, but must have active Spectrum Business Internet to qualify',
    finePrint: 'Spectrum Business Internet required (mobile is add-on only); credit forfeited if internet or mobile cancelled within 12 months; no contract required',
    stackableWithDeals: true,
  }
);

const SEED_MAP: Record<string, CollectedOffer[]> = {
  BROADBAND: SEED_BROADBAND, VOICE: SEED_VOICE, MOBILE: SEED_MOBILE, PACKAGE: SEED_PACKAGES,
};

// ─── Collector ────────────────────────────────────────────────────────────

export class SpectrumBusinessCollector extends BaseCollector {
  providerSlug = 'spectrum-business';
  supportedCategories: OfferCategory[] = ['BROADBAND', 'VOICE', 'MOBILE', 'PACKAGE'];

  protected contentZone = 'main, #content, [role="main"]';
  protected contentSelectors: ContentSelectors = {
    BROADBAND: '.plan-card, [class*="pricing"], [class*="plan"]',
    MOBILE: '.plan-card, [class*="plan"]',
    VOICE: '.plan-card',
    PACKAGE: '[class*="bundle"]',
  };

  async collect(config: CollectorConfig): Promise<CollectionResult[]> {
    const results: CollectionResult[] = [];

    for (const category of config.categories) {
      if (!this.supportedCategories.includes(category)) continue;

      const url = CATEGORY_URL_MAP[category] || SPECTRUM_URLS.broadband;

      const scraped = await this.scrapeAndExtract(url, 'Spectrum Business', category, config.llmConfig);
      if (scraped) {
        const result: CollectionResult = { success: true, offers: scraped.offers, rawContent: scraped.rawContent, scrapeConfidence: scraped.confidence, sourceUrl: url, scraped: true };
        if (category === 'MOBILE') {
          const deviceData = await this.scrapeDeviceIncentives(SPECTRUM_URLS.devices, 'Spectrum Business', config.llmConfig);
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
