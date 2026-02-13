import { BaseCollector, CollectorConfig, CollectionResult, CollectedOffer, CollectedDeviceIncentive, CollectedContractBuyout } from '../base';
import { generateProviderDeviceIncentives, generateProviderBuyout } from '../device-seed-data';
import { OfferCategory } from '@prisma/client';

// AT&T Business source URLs
const ATT_URLS: Record<string, string> = {
  broadband: 'https://www.business.att.com/products/fiber-internet.html',
  mobile: 'https://www.business.att.com/products/business-wireless.html',
  voice: 'https://www.business.att.com/products/voice-services.html',
  packages: 'https://www.business.att.com/products/bundles.html',
  devices: 'https://www.business.att.com/products/devices.html',
};

const CATEGORY_URL_MAP: Record<string, string> = {
  BROADBAND: ATT_URLS.broadband,
  MOBILE: ATT_URLS.mobile,
  VOICE: ATT_URLS.voice,
  PACKAGE: ATT_URLS.packages,
};

// ─── Seed/fallback data ───────────────────────────────────────────────────

const SEED_BROADBAND: CollectedOffer[] = [
  {
    name: 'att-fiber-100', displayName: 'AT&T Business Fiber 100',
    description: 'Reliable fiber internet for small businesses', category: 'BROADBAND',
    priceMonthly: 80.00, downloadMbps: 100, uploadMbps: 100, contractMonths: 12,
    features: { symmetric: 'true', fiber: 'true', static_ip: 'optional', unlimited_data: 'true' },
    sourceUrl: ATT_URLS.broadband,
  },
  {
    name: 'att-fiber-300', displayName: 'AT&T Business Fiber 300',
    description: 'Fast symmetric fiber for growing teams', category: 'BROADBAND',
    priceMonthly: 100.00, downloadMbps: 300, uploadMbps: 300, contractMonths: 12,
    features: { symmetric: 'true', fiber: 'true', static_ip: 'included', unlimited_data: 'true' },
    sourceUrl: ATT_URLS.broadband,
  },
  {
    name: 'att-fiber-500', displayName: 'AT&T Business Fiber 500',
    description: 'High-speed fiber for demanding workloads', category: 'BROADBAND',
    priceMonthly: 150.00, downloadMbps: 500, uploadMbps: 500, contractMonths: 12,
    features: { symmetric: 'true', fiber: 'true', static_ip: 'included', unlimited_data: 'true', sla: 'basic' },
    sourceUrl: ATT_URLS.broadband,
  },
  {
    name: 'att-fiber-1000', displayName: 'AT&T Business Fiber 1000',
    description: 'Gigabit symmetric fiber for enterprise needs', category: 'BROADBAND',
    priceMonthly: 250.00, downloadMbps: 1000, uploadMbps: 1000, contractMonths: 12,
    features: { symmetric: 'true', fiber: 'true', static_ip: 'included', unlimited_data: 'true', sla: 'enhanced', priority_support: 'true' },
    sourceUrl: ATT_URLS.broadband,
  },
];

const SEED_MOBILE: CollectedOffer[] = [
  {
    name: 'att-business-unlimited-starter', displayName: 'AT&T Business Unlimited Starter',
    description: 'Essential unlimited for business', category: 'MOBILE',
    priceMonthly: 35.00, unlimitedData: true,
    features: { network: '5G', hotspot: '5GB', mexico_canada: 'included' },
    sourceUrl: ATT_URLS.mobile,
  },
  {
    name: 'att-business-unlimited-performance', displayName: 'AT&T Business Unlimited Performance',
    description: 'Premium unlimited with more features', category: 'MOBILE',
    priceMonthly: 45.00, unlimitedData: true,
    features: { network: '5G+', hotspot: '30GB', mexico_canada: 'included', international_day_pass: 'included' },
    sourceUrl: ATT_URLS.mobile,
  },
  {
    name: 'att-business-unlimited-elite', displayName: 'AT&T Business Unlimited Elite',
    description: 'Top-tier unlimited with maximum benefits', category: 'MOBILE',
    priceMonthly: 55.00, unlimitedData: true,
    features: { network: '5G+', hotspot: '100GB', mexico_canada: 'included', international_day_pass: 'included', hbo_max: 'included' },
    sourceUrl: ATT_URLS.mobile,
  },
];

const SEED_VOICE: CollectedOffer[] = [
  {
    name: 'att-business-voice-basic', displayName: 'AT&T Business Voice Basic',
    description: 'Traditional business phone line with essential features', category: 'VOICE',
    priceMonthly: 35.00, contractMonths: 12,
    features: { lines: '1', voicemail: 'included', caller_id: 'included', call_forwarding: 'included', long_distance: 'metered' },
    sourceUrl: ATT_URLS.voice,
  },
  {
    name: 'att-business-voice-unlimited', displayName: 'AT&T Business Voice Unlimited',
    description: 'Unlimited local and long-distance calling', category: 'VOICE',
    priceMonthly: 55.00, contractMonths: 12,
    features: { lines: '1-8', voicemail: 'included', caller_id: 'included', call_forwarding: 'included', long_distance: 'unlimited', conference_calling: 'included' },
    sourceUrl: ATT_URLS.voice,
  },
  {
    name: 'att-office-at-hand', displayName: 'AT&T Office@Hand',
    description: 'Cloud-based unified communications with video, messaging and phone', category: 'VOICE',
    priceMonthly: 25.00, contractMonths: 12,
    features: { type: 'UCaaS', video_conferencing: 'included', team_messaging: 'included', mobile_app: 'included', auto_attendant: 'included', toll_free_minutes: '100' },
    sourceUrl: ATT_URLS.voice,
  },
];

const SEED_PACKAGES: CollectedOffer[] = [
  {
    name: 'att-business-in-a-box-starter', displayName: 'AT&T Business in a Box - Starter',
    description: 'Internet + phone bundle for small offices with essential connectivity', category: 'PACKAGE',
    priceMonthly: 99.99, pricePromo: 79.99, promoTermMonths: 12, contractMonths: 24,
    downloadMbps: 100, uploadMbps: 100,
    bundleOptions: ['AT&T Business Fiber 100', 'AT&T Business Voice Basic'],
    features: { bundle_discount: '15%', static_ip: 'optional', tier: 'Starter', package_type: 'TIERED' },
    sourceUrl: ATT_URLS.packages,
  },
  {
    name: 'att-business-in-a-box-standard', displayName: 'AT&T Business in a Box - Standard',
    description: 'Internet + phone + mobile bundle for productive teams', category: 'PACKAGE',
    priceMonthly: 159.99, pricePromo: 129.99, promoTermMonths: 12, contractMonths: 24,
    downloadMbps: 300, uploadMbps: 300,
    bundleOptions: ['AT&T Business Fiber 300', 'AT&T Business Voice Unlimited', 'AT&T Business Unlimited Starter'],
    features: { bundle_discount: '20%', static_ip: 'included', tier: 'Standard', package_type: 'TIERED', mobile_lines: '1' },
    sourceUrl: ATT_URLS.packages,
  },
  {
    name: 'att-business-in-a-box-premium', displayName: 'AT&T Business in a Box - Premium',
    description: 'All-in-one connectivity with gigabit fiber, UCaaS and premium mobile', category: 'PACKAGE',
    priceMonthly: 299.99, pricePromo: 249.99, promoTermMonths: 12, contractMonths: 24,
    downloadMbps: 1000, uploadMbps: 1000,
    bundleOptions: ['AT&T Business Fiber 1000', 'AT&T Office@Hand', 'AT&T Business Unlimited Elite'],
    features: { bundle_discount: '25%', static_ip: 'included', tier: 'Premium', package_type: 'TIERED', mobile_lines: '3', sla: 'enhanced', dedicated_support: 'true' },
    sourceUrl: ATT_URLS.packages,
  },
  {
    name: 'att-fiber-mobile-bundle', displayName: 'AT&T Fiber + Mobile Bundle',
    description: 'Save when you combine fiber internet with business wireless', category: 'PACKAGE',
    priceMonthly: 109.99, pricePromo: 89.99, promoTermMonths: 12, contractMonths: 12,
    downloadMbps: 300, uploadMbps: 300,
    bundleOptions: ['AT&T Business Fiber 300', 'AT&T Business Unlimited Starter'],
    features: { bundle_discount: '15%', tier: 'Value', package_type: 'FIXED', mobile_lines: '1' },
    sourceUrl: ATT_URLS.packages,
  },
];

const SEED_DEVICE_INCENTIVES: CollectedDeviceIncentive[] = generateProviderDeviceIncentives(
  'AT&T Business',
  { starter: 'Business Unlimited Starter', mid: 'Business Unlimited Performance', premium: 'Business Unlimited Elite' },
  ATT_URLS.devices
);

const SEED_CONTRACT_BUYOUT: CollectedContractBuyout = generateProviderBuyout(
  1000, 1000, 'BILL_CREDIT', ATT_URLS.devices, {
    requiresTradeIn: true,
    conditions: 'Switch to AT&T Business and receive up to $1,000 per line in bill credits to cover ETFs and device installment balances from your previous carrier.',
    coverageScope: 'Early termination fees (ETFs) and remaining device installment balances. Does NOT cover final bill balance, past-due amounts, or non-device charges.',
    submissionDeadline: '90 days from activation date',
    paymentTimeline: 'Bill credits applied within 2-3 billing cycles (6-10 weeks) after claim approval',
    proofRequired: 'Final bill from previous carrier clearly showing ETF charge or remaining device payment balance; trade-in of old device also required',
    maxLinesEligible: 10,
    excludedPlans: 'Prepaid plans and AT&T Business Starter (lowest tier) are not eligible',
    finePrint: 'Must port-in within 60 days of switching; credits applied as monthly bill credits over 12 months; service must remain active or credits stop; trade-in device must power on and be in good condition',
    stackableWithDeals: true,
  }
);

const SEED_MAP: Record<string, CollectedOffer[]> = {
  BROADBAND: SEED_BROADBAND, MOBILE: SEED_MOBILE, VOICE: SEED_VOICE, PACKAGE: SEED_PACKAGES,
};

// ─── Collector ────────────────────────────────────────────────────────────

export class ATTBusinessCollector extends BaseCollector {
  providerSlug = 'att-business';
  supportedCategories: OfferCategory[] = ['BROADBAND', 'MOBILE', 'VOICE', 'PACKAGE'];

  async collect(config: CollectorConfig): Promise<CollectionResult[]> {
    const results: CollectionResult[] = [];

    for (const category of config.categories) {
      if (!this.supportedCategories.includes(category)) continue;

      const url = CATEGORY_URL_MAP[category] || ATT_URLS.broadband;

      const scraped = await this.scrapeAndExtract(url, 'AT&T Business', category, config.llmConfig);
      if (scraped) {
        const result: CollectionResult = { success: true, offers: scraped.offers, rawContent: scraped.rawContent, sourceUrl: url, scraped: true };
        // For MOBILE, also try to scrape device incentives
        if (category === 'MOBILE') {
          const deviceData = await this.scrapeDeviceIncentives(ATT_URLS.devices, 'AT&T Business', config.llmConfig);
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
