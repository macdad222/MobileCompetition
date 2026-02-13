import { BaseCollector, CollectorConfig, CollectionResult, CollectedOffer, CollectedDeviceIncentive, CollectedContractBuyout, ContentSelectors } from '../base';
import { OfferCategory } from '@prisma/client';
import { generateProviderDeviceIncentives, generateProviderBuyout } from '../device-seed-data';

// Comcast Business source URLs
// NOTE: business.comcast.com is a JavaScript SPA — requires Playwright for rendering.
// The /learn/* pages serve speed info in HTML but pricing is loaded via JS.
// /learn/bundles was removed (404 as of Feb 2026); bundles shown on /shop/offers.
const COMCAST_URLS: Record<string, string> = {
  broadband: 'https://business.comcast.com/learn/internet',
  voice: 'https://business.comcast.com/learn/phone',
  bundles: 'https://business.comcast.com/shop/offers',
  mobile: 'https://business.comcast.com/learn/mobile',
  devices: 'https://business.comcast.com/learn/mobile',
};

const CATEGORY_URL_MAP: Record<string, string> = {
  BROADBAND: COMCAST_URLS.broadband,
  VOICE: COMCAST_URLS.voice,
  MOBILE: COMCAST_URLS.mobile,
  PACKAGE: COMCAST_URLS.bundles,
};

// ─── Seed/fallback data ───────────────────────────────────────────────────

const SEED_BROADBAND: CollectedOffer[] = [
  {
    name: 'business-internet-starter',
    displayName: 'Business Internet Starter',
    description: 'Entry-level business internet with reliable speeds for small teams',
    category: 'BROADBAND',
    priceMonthly: 69.99,
    pricePromo: 49.99,
    promoTermMonths: 12,
    downloadMbps: 75,
    uploadMbps: 15,
    contractMonths: 24,
    features: { static_ip: 'optional', symmetric: 'false', wifi_included: 'true', unlimited_data: 'true' },
    sourceUrl: COMCAST_URLS.broadband,
  },
  {
    name: 'business-internet-essential',
    displayName: 'Business Internet Essential',
    description: 'Balanced performance for growing businesses',
    category: 'BROADBAND',
    priceMonthly: 99.99,
    pricePromo: 79.99,
    promoTermMonths: 12,
    downloadMbps: 200,
    uploadMbps: 35,
    contractMonths: 24,
    features: { static_ip: 'included', symmetric: 'false', wifi_included: 'true', unlimited_data: 'true' },
    sourceUrl: COMCAST_URLS.broadband,
  },
  {
    name: 'business-internet-standard',
    displayName: 'Business Internet Standard',
    description: 'High-speed internet for bandwidth-intensive operations',
    category: 'BROADBAND',
    priceMonthly: 159.99,
    pricePromo: 119.99,
    promoTermMonths: 12,
    downloadMbps: 500,
    uploadMbps: 100,
    contractMonths: 24,
    features: { static_ip: 'included', symmetric: 'false', wifi_included: 'true', unlimited_data: 'true', priority_support: 'true' },
    sourceUrl: COMCAST_URLS.broadband,
  },
  {
    name: 'business-internet-performance',
    displayName: 'Business Internet Performance',
    description: 'Premium speeds for demanding business applications',
    category: 'BROADBAND',
    priceMonthly: 219.99,
    pricePromo: 169.99,
    promoTermMonths: 12,
    downloadMbps: 800,
    uploadMbps: 200,
    contractMonths: 24,
    features: { static_ip: 'included', symmetric: 'false', wifi_included: 'true', unlimited_data: 'true', priority_support: 'true', sla: 'basic' },
    sourceUrl: COMCAST_URLS.broadband,
  },
  {
    name: 'business-internet-gigabit',
    displayName: 'Business Internet Gigabit',
    description: 'Gigabit speeds for enterprise-grade connectivity',
    category: 'BROADBAND',
    priceMonthly: 299.99,
    pricePromo: 249.99,
    promoTermMonths: 12,
    downloadMbps: 1000,
    uploadMbps: 250,
    contractMonths: 24,
    features: { static_ip: 'included', symmetric: 'false', wifi_included: 'true', unlimited_data: 'true', priority_support: 'true', sla: 'enhanced', dedicated_account_manager: 'true' },
    sourceUrl: COMCAST_URLS.broadband,
  },
];

const SEED_VOICE: CollectedOffer[] = [
  {
    name: 'business-voiceedge-starter',
    displayName: 'Business VoiceEdge Starter',
    description: 'Cloud-based phone system for small businesses',
    category: 'VOICE',
    priceMonthly: 29.95,
    contractMonths: 24,
    features: { lines: '1', voicemail: 'true', auto_attendant: 'basic', mobile_app: 'true' },
    sourceUrl: COMCAST_URLS.voice,
  },
  {
    name: 'business-voiceedge-select',
    displayName: 'Business VoiceEdge Select',
    description: 'Full-featured phone system with advanced capabilities',
    category: 'VOICE',
    priceMonthly: 44.95,
    contractMonths: 24,
    features: { lines: '1-4', voicemail: 'true', auto_attendant: 'advanced', mobile_app: 'true', call_recording: 'true' },
    sourceUrl: COMCAST_URLS.voice,
  },
];

const SEED_MOBILE: CollectedOffer[] = [
  {
    name: 'comcast-business-mobile-unlimited',
    displayName: 'Comcast Business Mobile Unlimited',
    description: 'Unlimited data on the nations most reliable 5G network',
    category: 'MOBILE',
    priceMonthly: 30.00,
    unlimitedData: true,
    features: { network: '5G', hotspot: '15GB', international: 'basic' },
    sourceUrl: COMCAST_URLS.mobile,
  },
  {
    name: 'comcast-business-mobile-by-the-gig',
    displayName: 'Comcast Business Mobile By the Gig',
    description: 'Pay for data as you use it',
    category: 'MOBILE',
    priceMonthly: 15.00,
    dataAllowanceGb: 1,
    unlimitedData: false,
    features: { network: '5G', hotspot: 'included', overage: '$15/GB' },
    sourceUrl: COMCAST_URLS.mobile,
  },
];

const SEED_PACKAGES: CollectedOffer[] = [
  {
    name: 'comcast-business-starter-package',
    displayName: 'Comcast Business Starter Package',
    description: 'Internet + phone for small offices just getting started',
    category: 'PACKAGE',
    priceMonthly: 89.94,
    pricePromo: 69.94,
    promoTermMonths: 12,
    contractMonths: 24,
    downloadMbps: 75,
    uploadMbps: 15,
    bundleOptions: ['Business Internet Starter', 'Business VoiceEdge Starter'],
    features: { bundle_discount: '15%', tier: 'Starter', package_type: 'TIERED', static_ip: 'optional' },
    sourceUrl: COMCAST_URLS.bundles,
  },
  {
    name: 'business-internet-voice-package',
    displayName: 'Comcast Business Essential Package',
    description: 'Internet + voice bundle with solid speeds and calling features',
    category: 'PACKAGE',
    priceMonthly: 134.94,
    pricePromo: 104.94,
    promoTermMonths: 12,
    contractMonths: 24,
    downloadMbps: 200,
    uploadMbps: 35,
    bundleOptions: ['Business Internet Essential', 'Business VoiceEdge Select'],
    features: { bundle_discount: '20%', tier: 'Essential', package_type: 'TIERED', static_ip: 'included' },
    sourceUrl: COMCAST_URLS.bundles,
  },
  {
    name: 'comcast-business-complete-package',
    displayName: 'Comcast Business Complete Package',
    description: 'Internet + voice + mobile for productive teams',
    category: 'PACKAGE',
    priceMonthly: 189.94,
    pricePromo: 149.94,
    promoTermMonths: 12,
    contractMonths: 24,
    downloadMbps: 500,
    uploadMbps: 100,
    bundleOptions: ['Business Internet Standard', 'Business VoiceEdge Select', 'Comcast Business Mobile Unlimited'],
    features: { bundle_discount: '22%', tier: 'Standard', package_type: 'TIERED', static_ip: 'included', mobile_lines: '1', priority_support: 'true' },
    sourceUrl: COMCAST_URLS.bundles,
  },
  {
    name: 'comcast-business-premium-package',
    displayName: 'Comcast Business Premium Package',
    description: 'Gigabit internet + advanced voice + mobile for maximum performance',
    category: 'PACKAGE',
    priceMonthly: 359.94,
    pricePromo: 289.94,
    promoTermMonths: 12,
    contractMonths: 24,
    downloadMbps: 1000,
    uploadMbps: 250,
    bundleOptions: ['Business Internet Gigabit', 'Business VoiceEdge Select', 'Comcast Business Mobile Unlimited'],
    features: { bundle_discount: '25%', tier: 'Premium', package_type: 'TIERED', static_ip: 'included', mobile_lines: '2', priority_support: 'true', sla: 'enhanced', dedicated_account_manager: 'true' },
    sourceUrl: COMCAST_URLS.bundles,
  },
  {
    name: 'comcast-internet-mobile-saver',
    displayName: 'Comcast Internet + Mobile Saver',
    description: 'Pair business internet with mobile and save',
    category: 'PACKAGE',
    priceMonthly: 99.99,
    pricePromo: 79.99,
    promoTermMonths: 12,
    contractMonths: 24,
    downloadMbps: 200,
    uploadMbps: 35,
    bundleOptions: ['Business Internet Essential', 'Comcast Business Mobile Unlimited'],
    features: { bundle_discount: '15%', tier: 'Value', package_type: 'FIXED', mobile_lines: '1' },
    sourceUrl: COMCAST_URLS.bundles,
  },
];

const SEED_DEVICE_INCENTIVES: CollectedDeviceIncentive[] = generateProviderDeviceIncentives(
  'Comcast Business',
  { starter: 'By the Gig', mid: 'Unlimited', premium: 'Unlimited Premium' },
  COMCAST_URLS.devices
);

const SEED_CONTRACT_BUYOUT: CollectedContractBuyout = generateProviderBuyout(
  650, 650, 'ACCOUNT_CREDIT', COMCAST_URLS.devices, {
    requiresTradeIn: false,
    conditions: 'Switch to Comcast Business Mobile and receive up to $650/line as account credit to offset ETF or device payment costs.',
    coverageScope: 'ETFs and remaining device installment balances only; does not cover final bill charges',
    submissionDeadline: '45 days from service activation',
    paymentTimeline: 'Account credit applied within 2-3 billing cycles after claim approval',
    proofRequired: 'Final bill from previous carrier showing ETF or device balance; submit via Comcast Business portal',
    maxLinesEligible: 5,
    excludedPlans: 'By the Gig plans with fewer than 3 lines are not eligible',
    finePrint: 'Must maintain Comcast Business internet service to qualify; credit forfeited if mobile cancelled within 12 months; Comcast internet required',
    stackableWithDeals: true,
  }
);

const SEED_MAP: Record<string, CollectedOffer[]> = {
  BROADBAND: SEED_BROADBAND,
  VOICE: SEED_VOICE,
  MOBILE: SEED_MOBILE,
  PACKAGE: SEED_PACKAGES,
};

// ─── Collector ────────────────────────────────────────────────────────────

export class ComcastBusinessCollector extends BaseCollector {
  providerSlug = 'comcast-business';
  supportedCategories: OfferCategory[] = ['BROADBAND', 'VOICE', 'MOBILE', 'PACKAGE'];

  // Comcast Business is a JS-rendered SPA — requires Playwright
  protected usePlaywright = true;
  protected contentZone = 'main, .learn-page-content, [role="main"]';
  protected contentSelectors: ContentSelectors = {
    BROADBAND: '.plan-card, [class*="pricing"], [class*="plan"]',
    MOBILE: '.plan-card, [class*="plan"]',
    VOICE: '.plan-card, [class*="plan"]',
    PACKAGE: '[class*="bundle"], .plan-card',
  };

  async collect(config: CollectorConfig): Promise<CollectionResult[]> {
    const results: CollectionResult[] = [];

    for (const category of config.categories) {
      if (!this.supportedCategories.includes(category)) continue;

      const url = CATEGORY_URL_MAP[category] || COMCAST_URLS.broadband;

      const scraped = await this.scrapeAndExtract(url, 'Comcast Business', category, config.llmConfig);
      if (scraped) {
        const result: CollectionResult = { success: true, offers: scraped.offers, rawContent: scraped.rawContent, scrapeConfidence: scraped.confidence, sourceUrl: url, scraped: true };
        if (category === 'MOBILE') {
          const deviceData = await this.scrapeDeviceIncentives(COMCAST_URLS.devices, 'Comcast Business', config.llmConfig);
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
