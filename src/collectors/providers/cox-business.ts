import { BaseCollector, CollectorConfig, CollectionResult, CollectedOffer, CollectedDeviceIncentive, CollectedContractBuyout, ContentSelectors } from '../base';
import { OfferCategory } from '@prisma/client';
import { generateProviderDeviceIncentives, generateProviderBuyout } from '../device-seed-data';

// Cox Business source URLs
const COX_URLS: Record<string, string> = {
  broadband: 'https://www.cox.com/business/internet.html',
  voice: 'https://www.cox.com/business/phone.html',
  mobile: 'https://www.cox.com/business/mobile.html',
  packages: 'https://www.cox.com/business/bundles.html',
  devices: 'https://www.cox.com/business/mobile.html',
};

const CATEGORY_URL_MAP: Record<string, string> = {
  BROADBAND: COX_URLS.broadband,
  VOICE: COX_URLS.voice,
  MOBILE: COX_URLS.mobile,
  PACKAGE: COX_URLS.packages,
};

// ─── Seed/fallback data ───────────────────────────────────────────────────

const SEED_BROADBAND: CollectedOffer[] = [
  {
    name: 'cox-business-internet-starter', displayName: 'Cox Business Internet Starter',
    description: 'Reliable internet for small businesses', category: 'BROADBAND',
    priceMonthly: 79.99, pricePromo: 59.99, promoTermMonths: 12, downloadMbps: 25, uploadMbps: 5, contractMonths: 24,
    features: { modem_included: 'true', security_suite: 'included', static_ip: 'optional' },
    sourceUrl: COX_URLS.broadband,
  },
  {
    name: 'cox-business-internet-preferred', displayName: 'Cox Business Internet Preferred',
    description: 'Enhanced speeds for growing businesses', category: 'BROADBAND',
    priceMonthly: 99.99, pricePromo: 79.99, promoTermMonths: 12, downloadMbps: 100, uploadMbps: 20, contractMonths: 24,
    features: { modem_included: 'true', security_suite: 'included', static_ip: 'optional' },
    sourceUrl: COX_URLS.broadband,
  },
  {
    name: 'cox-business-internet-150', displayName: 'Cox Business Internet 150',
    description: 'Fast internet for productive teams', category: 'BROADBAND',
    priceMonthly: 119.99, pricePromo: 99.99, promoTermMonths: 12, downloadMbps: 150, uploadMbps: 30, contractMonths: 24,
    features: { modem_included: 'true', security_suite: 'included', static_ip: 'included' },
    sourceUrl: COX_URLS.broadband,
  },
  {
    name: 'cox-business-internet-500', displayName: 'Cox Business Internet 500',
    description: 'High-speed for demanding applications', category: 'BROADBAND',
    priceMonthly: 199.99, pricePromo: 169.99, promoTermMonths: 12, downloadMbps: 500, uploadMbps: 50, contractMonths: 24,
    features: { modem_included: 'true', security_suite: 'included', static_ip: 'included', priority_support: 'true' },
    sourceUrl: COX_URLS.broadband,
  },
];

const SEED_VOICE: CollectedOffer[] = [
  {
    name: 'cox-business-voice-line', displayName: 'Cox Business Voice Line',
    description: 'Single business phone line', category: 'VOICE',
    priceMonthly: 34.99,
    features: { unlimited_local: 'true', long_distance: 'metered', voicemail: 'included' },
    sourceUrl: COX_URLS.voice,
  },
  {
    name: 'cox-business-voice-unlimited', displayName: 'Cox Business Voice Unlimited',
    description: 'Unlimited calling with advanced business features', category: 'VOICE',
    priceMonthly: 44.99, contractMonths: 24,
    features: { unlimited_local: 'true', unlimited_long_distance: 'true', voicemail: 'included', auto_attendant: 'included', hunt_groups: 'included', call_forwarding: 'included' },
    sourceUrl: COX_URLS.voice,
  },
];

const SEED_MOBILE: CollectedOffer[] = [
  {
    name: 'cox-business-mobile-unlimited', displayName: 'Cox Business Mobile Unlimited',
    description: 'Unlimited talk, text and data for business', category: 'MOBILE',
    priceMonthly: 35.00, unlimitedData: true,
    features: { network: '5G', hotspot: '10GB', talk_text: 'unlimited', requires_internet: 'true' },
    sourceUrl: COX_URLS.mobile,
  },
  {
    name: 'cox-business-mobile-by-the-gig', displayName: 'Cox Business Mobile By the Gig',
    description: 'Flexible data plan billed per gigabyte', category: 'MOBILE',
    priceMonthly: 15.00, dataAllowanceGb: 1, unlimitedData: false,
    features: { network: '5G', hotspot: 'shared_data', talk_text: 'unlimited', requires_internet: 'true' },
    sourceUrl: COX_URLS.mobile,
  },
];

const SEED_PACKAGES: CollectedOffer[] = [
  {
    name: 'cox-business-internet-voice-starter', displayName: 'Cox Business Internet + Voice Starter',
    description: 'Internet and phone bundle for small offices', category: 'PACKAGE',
    priceMonthly: 104.98, pricePromo: 84.98, promoTermMonths: 12, contractMonths: 24,
    downloadMbps: 25, uploadMbps: 5,
    bundleOptions: ['Cox Business Internet Starter', 'Cox Business Voice Line'],
    features: { bundle_discount: '15%', tier: 'Starter', package_type: 'TIERED', security_suite: 'included' },
    sourceUrl: COX_URLS.packages,
  },
  {
    name: 'cox-business-complete-package', displayName: 'Cox Business Complete Package',
    description: 'Fast internet + unlimited voice for productive businesses', category: 'PACKAGE',
    priceMonthly: 144.98, pricePromo: 119.98, promoTermMonths: 12, contractMonths: 24,
    downloadMbps: 100, uploadMbps: 20,
    bundleOptions: ['Cox Business Internet Preferred', 'Cox Business Voice Unlimited'],
    features: { bundle_discount: '20%', tier: 'Standard', package_type: 'TIERED', security_suite: 'included', static_ip: 'optional' },
    sourceUrl: COX_URLS.packages,
  },
  {
    name: 'cox-business-premium-bundle', displayName: 'Cox Business Premium Bundle',
    description: 'High-speed internet + voice + mobile for complete connectivity', category: 'PACKAGE',
    priceMonthly: 269.97, pricePromo: 219.97, promoTermMonths: 12, contractMonths: 24,
    downloadMbps: 500, uploadMbps: 50,
    bundleOptions: ['Cox Business Internet 500', 'Cox Business Voice Unlimited', 'Cox Business Mobile Unlimited'],
    features: { bundle_discount: '25%', tier: 'Premium', package_type: 'TIERED', security_suite: 'included', static_ip: 'included', mobile_lines: '1', priority_support: 'true' },
    sourceUrl: COX_URLS.packages,
  },
  {
    name: 'cox-business-internet-mobile-saver', displayName: 'Cox Internet + Mobile Saver',
    description: 'Internet and mobile pairing at a reduced rate', category: 'PACKAGE',
    priceMonthly: 94.99, pricePromo: 79.99, promoTermMonths: 12, contractMonths: 24,
    downloadMbps: 100, uploadMbps: 20,
    bundleOptions: ['Cox Business Internet Preferred', 'Cox Business Mobile Unlimited'],
    features: { bundle_discount: '12%', tier: 'Value', package_type: 'FIXED', mobile_lines: '1' },
    sourceUrl: COX_URLS.packages,
  },
];

const SEED_DEVICE_INCENTIVES: CollectedDeviceIncentive[] = generateProviderDeviceIncentives(
  'Cox Business',
  { starter: 'Mobile By the Gig', mid: 'Mobile Unlimited', premium: 'Mobile Unlimited Premium' },
  COX_URLS.devices
);

const SEED_CONTRACT_BUYOUT: CollectedContractBuyout = generateProviderBuyout(
  650, 650, 'BILL_CREDIT', COX_URLS.devices, {
    requiresTradeIn: false,
    conditions: 'Switch to Cox Business Mobile and receive up to $650/line in bill credits to cover switching costs.',
    coverageScope: 'ETFs and remaining device installments; does not cover past-due balances',
    submissionDeadline: '60 days from activation date',
    paymentTimeline: 'Bill credits applied over 12 monthly installments starting 2-3 billing cycles after approval',
    proofRequired: 'Final bill from previous carrier showing ETF or remaining device balance',
    maxLinesEligible: 5,
    excludedPlans: 'By the Gig plans are not eligible for contract buyout',
    finePrint: 'Cox Business Internet required for mobile eligibility; credits forfeited if cancelled within 12 months; limited to Cox service areas; credits applied monthly over 12 months',
    stackableWithDeals: true,
  }
);

const SEED_MAP: Record<string, CollectedOffer[]> = {
  BROADBAND: SEED_BROADBAND, VOICE: SEED_VOICE, MOBILE: SEED_MOBILE, PACKAGE: SEED_PACKAGES,
};

// ─── Collector ────────────────────────────────────────────────────────────

export class CoxBusinessCollector extends BaseCollector {
  providerSlug = 'cox-business';
  supportedCategories: OfferCategory[] = ['BROADBAND', 'VOICE', 'MOBILE', 'PACKAGE'];

  // Cox Business is a JS-rendered SPA — requires Playwright
  protected usePlaywright = true;
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

      const url = CATEGORY_URL_MAP[category] || COX_URLS.broadband;

      const scraped = await this.scrapeAndExtract(url, 'Cox Business', category, config.llmConfig);
      if (scraped) {
        const result: CollectionResult = { success: true, offers: scraped.offers, rawContent: scraped.rawContent, scrapeConfidence: scraped.confidence, sourceUrl: url, scraped: true };
        if (category === 'MOBILE') {
          const deviceData = await this.scrapeDeviceIncentives(COX_URLS.devices, 'Cox Business', config.llmConfig);
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
