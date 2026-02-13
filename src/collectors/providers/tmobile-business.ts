import { BaseCollector, CollectorConfig, CollectionResult, CollectedOffer, CollectedDeviceIncentive, CollectedContractBuyout, ContentSelectors } from '../base';
import { generateProviderDeviceIncentives, generateProviderBuyout } from '../device-seed-data';
import { OfferCategory } from '@prisma/client';

// T-Mobile Business source URLs
const TMOBILE_URLS: Record<string, string> = {
  mobile: 'https://www.t-mobile.com/business/solutions/plans',
  broadband: 'https://www.t-mobile.com/business/internet',
  voice: 'https://www.t-mobile.com/business/solutions/voice',
  packages: 'https://www.t-mobile.com/business/solutions/bundles',
  devices: 'https://www.t-mobile.com/business/devices',
};

const CATEGORY_URL_MAP: Record<string, string> = {
  MOBILE: TMOBILE_URLS.mobile,
  BROADBAND: TMOBILE_URLS.broadband,
  VOICE: TMOBILE_URLS.voice,
  PACKAGE: TMOBILE_URLS.packages,
};

// ─── Seed/fallback data ───────────────────────────────────────────────────

const SEED_MOBILE: CollectedOffer[] = [
  {
    name: 'tmobile-business-unlimited-starter', displayName: 'Business Unlimited Starter',
    description: 'Essential unlimited for small businesses', category: 'MOBILE',
    priceMonthly: 25.00, unlimitedData: true,
    features: { network: '5G', hotspot: '5GB', scam_shield: 'premium', mexico_canada: 'included' },
    sourceUrl: TMOBILE_URLS.mobile,
  },
  {
    name: 'tmobile-business-unlimited-advanced', displayName: 'Business Unlimited Advanced',
    description: 'Enhanced unlimited with more features', category: 'MOBILE',
    priceMonthly: 30.00, unlimitedData: true,
    features: { network: '5G', hotspot: '50GB', scam_shield: 'premium', mexico_canada: 'included', in_flight_wifi: 'included' },
    sourceUrl: TMOBILE_URLS.mobile,
  },
  {
    name: 'tmobile-business-unlimited-ultimate', displayName: 'Business Unlimited Ultimate',
    description: 'Premium unlimited with maximum benefits', category: 'MOBILE',
    priceMonthly: 40.00, unlimitedData: true,
    features: { network: '5G', hotspot: 'unlimited', scam_shield: 'premium', mexico_canada: 'included', in_flight_wifi: 'included', international_data: '15GB' },
    sourceUrl: TMOBILE_URLS.mobile,
  },
];

const SEED_BROADBAND: CollectedOffer[] = [
  {
    name: 'tmobile-business-internet', displayName: 'T-Mobile 5G Business Internet',
    description: 'Fixed wireless internet powered by 5G', category: 'BROADBAND',
    priceMonthly: 50.00, downloadMbps: 245, uploadMbps: 31,
    features: { technology: '5G fixed wireless', contract: 'none', equipment: 'included', unlimited_data: 'true' },
    sourceUrl: TMOBILE_URLS.broadband,
  },
  {
    name: 'tmobile-business-internet-plus', displayName: 'T-Mobile 5G Business Internet Plus',
    description: 'Enhanced fixed wireless with priority data', category: 'BROADBAND',
    priceMonthly: 70.00, downloadMbps: 350, uploadMbps: 50,
    features: { technology: '5G fixed wireless', contract: 'none', equipment: 'included', unlimited_data: 'true', priority_data: 'true' },
    sourceUrl: TMOBILE_URLS.broadband,
  },
];

const SEED_VOICE: CollectedOffer[] = [
  {
    name: 'tmobile-business-voice-digits', displayName: 'T-Mobile DIGITS for Business',
    description: 'Use your business number on any device with cloud calling', category: 'VOICE',
    priceMonthly: 15.00,
    features: { type: 'cloud', multi_device: 'true', mobile_app: 'included', virtual_numbers: 'true', call_forwarding: 'included' },
    sourceUrl: TMOBILE_URLS.voice,
  },
  {
    name: 'tmobile-business-primary-voice', displayName: 'T-Mobile Business Primary Voice',
    description: 'Dedicated business voice line with VoLTE quality', category: 'VOICE',
    priceMonthly: 20.00,
    features: { type: 'VoLTE', hd_voice: 'true', wifi_calling: 'included', voicemail_to_text: 'included', scam_protection: 'included' },
    sourceUrl: TMOBILE_URLS.voice,
  },
];

const SEED_PACKAGES: CollectedOffer[] = [
  {
    name: 'tmobile-business-internet-mobile-starter', displayName: 'T-Mobile Internet + Mobile Starter',
    description: '5G internet plus a wireless line at a bundled discount', category: 'PACKAGE',
    priceMonthly: 65.00, pricePromo: 55.00, promoTermMonths: 12,
    downloadMbps: 245, uploadMbps: 31,
    bundleOptions: ['T-Mobile 5G Business Internet', 'Business Unlimited Starter'],
    features: { bundle_discount: '15%', tier: 'Starter', package_type: 'TIERED', contract: 'none', mobile_lines: '1' },
    sourceUrl: TMOBILE_URLS.packages,
  },
  {
    name: 'tmobile-business-internet-mobile-advanced', displayName: 'T-Mobile Internet + Mobile Advanced',
    description: 'Priority 5G internet with advanced wireless features', category: 'PACKAGE',
    priceMonthly: 89.99, pricePromo: 74.99, promoTermMonths: 12,
    downloadMbps: 350, uploadMbps: 50,
    bundleOptions: ['T-Mobile 5G Business Internet Plus', 'Business Unlimited Advanced'],
    features: { bundle_discount: '20%', tier: 'Advanced', package_type: 'TIERED', contract: 'none', mobile_lines: '1', in_flight_wifi: 'included' },
    sourceUrl: TMOBILE_URLS.packages,
  },
  {
    name: 'tmobile-business-ultimate-bundle', displayName: 'T-Mobile Business Ultimate Bundle',
    description: 'Premium internet + unlimited ultimate + DIGITS for complete connectivity', category: 'PACKAGE',
    priceMonthly: 119.99, pricePromo: 99.99, promoTermMonths: 12,
    downloadMbps: 350, uploadMbps: 50,
    bundleOptions: ['T-Mobile 5G Business Internet Plus', 'Business Unlimited Ultimate', 'T-Mobile DIGITS for Business'],
    features: { bundle_discount: '25%', tier: 'Ultimate', package_type: 'TIERED', contract: 'none', mobile_lines: '2', international_data: '15GB' },
    sourceUrl: TMOBILE_URLS.packages,
  },
  {
    name: 'tmobile-work-from-anywhere', displayName: 'T-Mobile Work From Anywhere',
    description: 'No-contract internet + mobile bundle for remote teams', category: 'PACKAGE',
    priceMonthly: 75.00, downloadMbps: 245, uploadMbps: 31,
    bundleOptions: ['T-Mobile 5G Business Internet', 'Business Unlimited Advanced'],
    features: { bundle_discount: '10%', tier: 'Remote', package_type: 'FIXED', contract: 'none', mobile_lines: '1', hotspot: '50GB' },
    sourceUrl: TMOBILE_URLS.packages,
  },
];

const SEED_DEVICE_INCENTIVES: CollectedDeviceIncentive[] = generateProviderDeviceIncentives(
  'T-Mobile Business',
  { starter: 'Business Unlimited Starter', mid: 'Business Unlimited Advanced', premium: 'Business Unlimited Ultimate' },
  TMOBILE_URLS.devices
);

const SEED_CONTRACT_BUYOUT: CollectedContractBuyout = generateProviderBuyout(
  800, 800, 'BILL_CREDIT', TMOBILE_URLS.devices, {
    requiresTradeIn: false,
    conditions: 'Keep & Switch: up to $800/line via bill credits. No trade-in required.',
    coverageScope: 'ETFs and remaining device installments from previous carrier',
    submissionDeadline: '30 days from activation',
    paymentTimeline: 'Bill credits over 24 monthly installments starting within 1-2 billing cycles',
    proofRequired: 'Final bill showing ETF or device balance; upload via T-Mobile app',
    maxLinesEligible: 12,
    excludedPlans: 'Essentials plan not eligible; requires Advanced or Ultimate',
    finePrint: 'Credits spread over 24 months; leaving early forfeits remaining; must port within 30 days; one buyout per line',
    stackableWithDeals: true,
  }
);

const SEED_MAP: Record<string, CollectedOffer[]> = {
  MOBILE: SEED_MOBILE, BROADBAND: SEED_BROADBAND, VOICE: SEED_VOICE, PACKAGE: SEED_PACKAGES,
};

// ─── Collector ────────────────────────────────────────────────────────────

export class TMobileBusinessCollector extends BaseCollector {
  providerSlug = 'tmobile-business';
  supportedCategories: OfferCategory[] = ['MOBILE', 'BROADBAND', 'VOICE', 'PACKAGE'];

  protected contentZone = 'main, #main-content, [role="main"]';
  protected contentSelectors: ContentSelectors = {
    MOBILE: '.plan-card, [class*="plan"], [class*="Plan"]',
    BROADBAND: '.plan-card, [class*="plan"]',
    VOICE: '.plan-card',
    PACKAGE: '[class*="bundle"], .plan-card',
  };

  async collect(config: CollectorConfig): Promise<CollectionResult[]> {
    const results: CollectionResult[] = [];

    for (const category of config.categories) {
      if (!this.supportedCategories.includes(category)) continue;

      const url = CATEGORY_URL_MAP[category] || TMOBILE_URLS.mobile;

      const scraped = await this.scrapeAndExtract(url, 'T-Mobile Business', category, config.llmConfig);
      if (scraped) {
        const result: CollectionResult = { success: true, offers: scraped.offers, rawContent: scraped.rawContent, scrapeConfidence: scraped.confidence, sourceUrl: url, scraped: true };
        // For MOBILE, also try to scrape device incentives
        if (category === 'MOBILE') {
          const deviceData = await this.scrapeDeviceIncentives(TMOBILE_URLS.devices, 'T-Mobile Business', config.llmConfig);
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
