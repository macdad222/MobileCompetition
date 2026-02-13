import { BaseCollector, CollectorConfig, CollectionResult, CollectedOffer, CollectedDeviceIncentive, CollectedContractBuyout } from '../base';
import { generateProviderDeviceIncentives, generateProviderBuyout } from '../device-seed-data';
import { OfferCategory } from '@prisma/client';

// Verizon Business source URLs
const VERIZON_URLS: Record<string, string> = {
  broadband: 'https://www.verizon.com/business/products/internet/',
  mobile: 'https://www.verizon.com/business/products/plans/',
  voice: 'https://www.verizon.com/business/products/voice/',
  packages: 'https://www.verizon.com/business/products/bundles/',
  devices: 'https://www.verizon.com/business/smartphones/',
};

const CATEGORY_URL_MAP: Record<string, string> = {
  BROADBAND: VERIZON_URLS.broadband,
  MOBILE: VERIZON_URLS.mobile,
  VOICE: VERIZON_URLS.voice,
  PACKAGE: VERIZON_URLS.packages,
};

// ─── Seed/fallback data ───────────────────────────────────────────────────

const SEED_BROADBAND: CollectedOffer[] = [
  {
    name: 'verizon-fios-200', displayName: 'Verizon Business Internet 200/200',
    description: 'Symmetric Fios internet for small businesses', category: 'BROADBAND',
    priceMonthly: 89.00, downloadMbps: 200, uploadMbps: 200, contractMonths: 24,
    features: { symmetric: 'true', fiber: 'true', router_included: 'true', unlimited_data: 'true' },
    sourceUrl: VERIZON_URLS.broadband,
  },
  {
    name: 'verizon-fios-400', displayName: 'Verizon Business Internet 400/400',
    description: 'Fast symmetric fiber for medium businesses', category: 'BROADBAND',
    priceMonthly: 129.00, downloadMbps: 400, uploadMbps: 400, contractMonths: 24,
    features: { symmetric: 'true', fiber: 'true', router_included: 'true', unlimited_data: 'true', static_ip: 'included' },
    sourceUrl: VERIZON_URLS.broadband,
  },
  {
    name: 'verizon-fios-gigabit', displayName: 'Verizon Business Gigabit Connection',
    description: 'Gigabit symmetric fiber for demanding businesses', category: 'BROADBAND',
    priceMonthly: 214.99, downloadMbps: 940, uploadMbps: 880, contractMonths: 24,
    features: { symmetric: 'near', fiber: 'true', router_included: 'true', unlimited_data: 'true', static_ip: 'included', sla: 'basic' },
    sourceUrl: VERIZON_URLS.broadband,
  },
];

const SEED_MOBILE: CollectedOffer[] = [
  {
    name: 'verizon-business-unlimited-start', displayName: 'Business Unlimited Start',
    description: 'Entry-level unlimited for business', category: 'MOBILE',
    priceMonthly: 30.00, unlimitedData: true,
    features: { network: '5G Nationwide', hotspot: '5GB', talk_text: 'unlimited' },
    sourceUrl: VERIZON_URLS.mobile,
  },
  {
    name: 'verizon-business-unlimited-plus', displayName: 'Business Unlimited Plus',
    description: 'Premium unlimited with Ultra Wideband', category: 'MOBILE',
    priceMonthly: 40.00, unlimitedData: true,
    features: { network: '5G Ultra Wideband', hotspot: '30GB', talk_text: 'unlimited', international: 'included' },
    sourceUrl: VERIZON_URLS.mobile,
  },
  {
    name: 'verizon-business-unlimited-pro', displayName: 'Business Unlimited Pro',
    description: 'Top-tier unlimited with maximum features', category: 'MOBILE',
    priceMonthly: 50.00, unlimitedData: true,
    features: { network: '5G Ultra Wideband', hotspot: '100GB', talk_text: 'unlimited', international: 'premium', connected_device_plan: 'included' },
    sourceUrl: VERIZON_URLS.mobile,
  },
];

const SEED_VOICE: CollectedOffer[] = [
  {
    name: 'verizon-business-digital-voice', displayName: 'Verizon Business Digital Voice',
    description: 'Cloud-based business phone with 45+ calling features', category: 'VOICE',
    priceMonthly: 35.00, contractMonths: 24,
    features: { lines: '1-4', voicemail: 'included', auto_attendant: 'included', caller_id: 'included', call_forwarding: 'included', simultaneous_ring: 'included' },
    sourceUrl: VERIZON_URLS.voice,
  },
  {
    name: 'verizon-one-talk', displayName: 'Verizon One Talk',
    description: 'Integrated desk phone and mobile calling on one number', category: 'VOICE',
    priceMonthly: 25.00, contractMonths: 24,
    features: { type: 'unified', mobile_integration: 'true', desktop_app: 'included', auto_receptionist: 'included', hunt_groups: 'included', video_calling: 'basic' },
    sourceUrl: VERIZON_URLS.voice,
  },
];

const SEED_PACKAGES: CollectedOffer[] = [
  {
    name: 'verizon-small-business-essentials', displayName: 'Verizon Small Business Essentials',
    description: 'Internet + Digital Voice for small offices at a discounted rate', category: 'PACKAGE',
    priceMonthly: 109.99, pricePromo: 89.99, promoTermMonths: 12, contractMonths: 24,
    downloadMbps: 200, uploadMbps: 200,
    bundleOptions: ['Verizon Business Internet 200/200', 'Verizon Business Digital Voice'],
    features: { bundle_discount: '18%', tier: 'Essentials', package_type: 'TIERED', static_ip: 'optional' },
    sourceUrl: VERIZON_URLS.packages,
  },
  {
    name: 'verizon-business-complete', displayName: 'Verizon Business Complete',
    description: 'Fiber + voice + mobile with One Talk integration', category: 'PACKAGE',
    priceMonthly: 179.99, pricePromo: 149.99, promoTermMonths: 12, contractMonths: 24,
    downloadMbps: 400, uploadMbps: 400,
    bundleOptions: ['Verizon Business Internet 400/400', 'Verizon One Talk', 'Business Unlimited Start'],
    features: { bundle_discount: '22%', tier: 'Complete', package_type: 'TIERED', static_ip: 'included', mobile_lines: '1' },
    sourceUrl: VERIZON_URLS.packages,
  },
  {
    name: 'verizon-business-premium-bundle', displayName: 'Verizon Business Premium Bundle',
    description: 'Gigabit fiber + premium voice + unlimited mobile for power users', category: 'PACKAGE',
    priceMonthly: 289.99, pricePromo: 239.99, promoTermMonths: 12, contractMonths: 24,
    downloadMbps: 940, uploadMbps: 880,
    bundleOptions: ['Verizon Business Gigabit Connection', 'Verizon Business Digital Voice', 'Business Unlimited Pro'],
    features: { bundle_discount: '25%', tier: 'Premium', package_type: 'TIERED', static_ip: 'included', mobile_lines: '3', sla: 'enhanced', dedicated_support: 'true' },
    sourceUrl: VERIZON_URLS.packages,
  },
  {
    name: 'verizon-fios-mobile-value', displayName: 'Verizon Fios + Mobile Saver',
    description: 'Pair Fios internet with a business wireless line and save', category: 'PACKAGE',
    priceMonthly: 99.99, pricePromo: 84.99, promoTermMonths: 12, contractMonths: 24,
    downloadMbps: 200, uploadMbps: 200,
    bundleOptions: ['Verizon Business Internet 200/200', 'Business Unlimited Start'],
    features: { bundle_discount: '15%', tier: 'Value', package_type: 'FIXED', mobile_lines: '1' },
    sourceUrl: VERIZON_URLS.packages,
  },
];

const SEED_DEVICE_INCENTIVES: CollectedDeviceIncentive[] = generateProviderDeviceIncentives(
  'Verizon Business',
  { starter: 'Business Unlimited Start', mid: 'Business Unlimited Plus', premium: 'Business Unlimited Pro' },
  VERIZON_URLS.devices
);

const SEED_CONTRACT_BUYOUT: CollectedContractBuyout = generateProviderBuyout(
  1000, 1000, 'VISA_CARD', VERIZON_URLS.devices, {
    requiresTradeIn: false,
    conditions: 'Switch to Verizon Business and receive up to $1,000 per line via prepaid Visa card to cover your switching costs.',
    coverageScope: 'Early termination fees, remaining device installments, and final month service charges. Broadest coverage of all major carriers.',
    submissionDeadline: '60 days from activation date',
    paymentTimeline: 'Prepaid Visa card mailed within 8 weeks of claim approval; can be used anywhere Visa is accepted',
    proofRequired: 'Final bill from previous carrier; no device trade-in required (trade-in is optional for additional savings)',
    maxLinesEligible: 25,
    excludedPlans: 'None — all Verizon Business plans qualify',
    finePrint: 'Must remain on Verizon for 12 months or prepaid card value will be charged back; Visa card expires 6 months after issuance; one claim per line ported in',
    stackableWithDeals: true,
  }
);

const SEED_MAP: Record<string, CollectedOffer[]> = {
  BROADBAND: SEED_BROADBAND, MOBILE: SEED_MOBILE, VOICE: SEED_VOICE, PACKAGE: SEED_PACKAGES,
};

// ─── Collector ────────────────────────────────────────────────────────────

export class VerizonBusinessCollector extends BaseCollector {
  providerSlug = 'verizon-business';
  supportedCategories: OfferCategory[] = ['BROADBAND', 'MOBILE', 'VOICE', 'PACKAGE'];

  async collect(config: CollectorConfig): Promise<CollectionResult[]> {
    const results: CollectionResult[] = [];

    for (const category of config.categories) {
      if (!this.supportedCategories.includes(category)) continue;

      const url = CATEGORY_URL_MAP[category] || VERIZON_URLS.broadband;

      const scraped = await this.scrapeAndExtract(url, 'Verizon Business', category, config.llmConfig);
      if (scraped) {
        const result: CollectionResult = { success: true, offers: scraped.offers, rawContent: scraped.rawContent, sourceUrl: url, scraped: true };
        // For MOBILE, also try to scrape device incentives
        if (category === 'MOBILE') {
          const deviceData = await this.scrapeDeviceIncentives(VERIZON_URLS.devices, 'Verizon Business', config.llmConfig);
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
