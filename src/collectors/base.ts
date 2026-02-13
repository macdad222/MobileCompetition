import { OfferCategory } from '@prisma/client';
import { LLMClientConfig, callLLM, LLMMessage } from '@/src/llm/client';
import { openPage, extractPageText } from './browser-manager';

export interface CollectorConfig {
  providerId: string;
  providerSlug: string;
  categories: OfferCategory[];
  llmConfig?: LLMClientConfig | null;
}

export interface CollectedDeviceIncentive {
  deviceName: string;
  deviceBrand: string;     // Apple, Samsung, Google
  deviceModel: string;     // "iPhone 17 Pro 128GB"
  incentiveType: string;   // FREE_WITH_PLAN, BOGO, TRADE_IN_CREDIT, MONTHLY_CREDIT, DISCOUNT
  incentiveValue?: number; // dollar value
  deviceRetailPrice?: number;
  monthlyCredit?: number;
  creditMonths?: number;
  conditions?: string;
  requiresTradeIn?: boolean;
  requiresNewLine?: boolean;
  requiresPortIn?: boolean;
  minPlanTier?: string;
  sourceUrl?: string;
}

export interface CollectedContractBuyout {
  maxAmount?: number;
  perLineMax?: number;
  method?: string;       // VISA_CARD, BILL_CREDIT, ACCOUNT_CREDIT
  conditions?: string;
  requiresPortIn?: boolean;
  requiresTradeIn?: boolean;
  minLinesRequired?: number;
  eligibleFromProviders?: string[];
  // T&C detail fields
  coverageScope?: string;
  submissionDeadline?: string;
  paymentTimeline?: string;
  proofRequired?: string;
  maxLinesEligible?: number;
  excludedPlans?: string;
  finePrint?: string;
  stackableWithDeals?: boolean;
  sourceUrl?: string;
}

export interface CollectedOffer {
  name: string;
  displayName: string;
  description?: string;
  category: OfferCategory;
  priceMonthly?: number;
  priceSetup?: number;
  pricePromo?: number;
  promoTermMonths?: number;
  contractMonths?: number;
  downloadMbps?: number;
  uploadMbps?: number;
  dataAllowanceGb?: number;
  unlimitedData?: boolean;
  slaDetails?: string;
  eligibilityNotes?: string;
  bundleOptions?: string[];
  features?: Record<string, string>;
  sourceUrl: string;
  // Mobile-specific extensions
  deviceIncentives?: CollectedDeviceIncentive[];
  contractBuyout?: CollectedContractBuyout;
}

export type ScrapeConfidence = 'high' | 'medium' | 'low';
export type ScrapeFailureReason =
  | 'no_llm_config'
  | 'page_load_failed'
  | 'content_too_short'
  | 'no_pricing_signals'
  | 'llm_extraction_empty'
  | 'llm_extraction_invalid'
  | 'extraction_error';

export interface CollectionResult {
  success: boolean;
  offers: CollectedOffer[];
  rawContent: string;
  sourceUrl: string;
  error?: string;
  scraped?: boolean;
  scrapeConfidence?: ScrapeConfidence;
  failureReason?: ScrapeFailureReason;
  // Separate device/buyout data (provider-level, not per-offer)
  deviceIncentives?: CollectedDeviceIncentive[];
  contractBuyout?: CollectedContractBuyout;
}

export interface ProviderCollector {
  providerSlug: string;
  supportedCategories: OfferCategory[];
  collect(config: CollectorConfig): Promise<CollectionResult[]>;
}

/**
 * Content selectors per category — Playwright waits for these to appear
 * before extracting text. Providers can override with more specific selectors.
 */
export interface ContentSelectors {
  [category: string]: string; // CSS selectors to wait for
}

/**
 * Price ranges by category for sanity checking LLM extraction.
 */
const PRICE_RANGES: Record<string, { min: number; max: number }> = {
  BROADBAND: { min: 20, max: 500 },
  MOBILE: { min: 10, max: 200 },
  VOICE: { min: 10, max: 150 },
  PACKAGE: { min: 50, max: 800 },
};

export abstract class BaseCollector implements ProviderCollector {
  abstract providerSlug: string;
  abstract supportedCategories: OfferCategory[];

  /**
   * Whether this collector requires Playwright (headless browser) for JS-rendered pages.
   * Default: false (use simple HTTP fetch). Set to true for providers like AT&T, Cox
   * whose pages are SPAs that don't serve pricing content without JS execution.
   */
  protected usePlaywright: boolean = false;

  /**
   * Optional content selectors per category for Playwright smart-waiting.
   * Only used when usePlaywright = true.
   */
  protected contentSelectors: ContentSelectors = {};

  /**
   * Optional CSS selector for the main content zone to focus text extraction.
   * Only used when usePlaywright = true.
   */
  protected contentZone?: string;

  // ============================================================================
  // PAGE FETCHING — two strategies: simple fetch (default) or Playwright
  // ============================================================================

  /**
   * Simple HTTP fetch — fast, works for most provider sites that serve
   * server-rendered HTML. This is the default method.
   */
  protected async fetchPage(url: string): Promise<string> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Cache-Control': 'no-cache',
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Timeout fetching ${url}`);
      }
      throw new Error(`Failed to fetch ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean raw HTML to readable text using regex (for simple fetch mode).
   */
  protected cleanHtmlToText(html: string): string {
    let text = html;
    text = text.replace(/<script[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style[\s\S]*?<\/style>/gi, '');
    text = text.replace(/<noscript[\s\S]*?<\/noscript>/gi, '');
    text = text.replace(/<svg[\s\S]*?<\/svg>/gi, '');
    text = text.replace(/<!--[\s\S]*?-->/g, '');
    text = text.replace(/<nav[\s\S]*?<\/nav>/gi, '');
    text = text.replace(/<footer[\s\S]*?<\/footer>/gi, '');
    text = text.replace(/<header[\s\S]*?<\/header>/gi, '');
    text = text.replace(/<\/?(div|p|br|hr|h[1-6]|li|tr|td|th|section|article)[^>]*>/gi, '\n');
    text = text.replace(/<[^>]+>/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&#x27;/g, "'");
    text = text.replace(/&mdash;/g, '—');
    text = text.replace(/&ndash;/g, '–');
    text = text.replace(/&#\d+;/g, '');
    text = text.replace(/&\w+;/g, ' ');
    text = text.replace(/[ \t]+/g, ' ');
    text = text.replace(/\n\s*\n/g, '\n');
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.trim();
    if (text.length > 20000) {
      text = text.substring(0, 20000) + '\n\n[Content truncated for analysis]';
    }
    return text;
  }

  /**
   * Fetch a page using Playwright, waiting for JS rendering and content signals.
   * Used only when usePlaywright = true (for JS-heavy SPAs like AT&T, Cox).
   */
  protected async fetchRenderedText(url: string, category?: string): Promise<string> {
    const waitSelector = category ? this.contentSelectors[category] : undefined;

    const page = await openPage(url, {
      waitForSelector: waitSelector,
      waitTimeoutMs: 45000,
    });

    try {
      const text = await extractPageText(page, this.contentZone);
      return text;
    } finally {
      await page.close().catch(() => {});
    }
  }

  /**
   * Get page text using the appropriate method for this collector.
   */
  protected async getPageText(url: string, category?: string): Promise<string> {
    if (this.usePlaywright) {
      return this.fetchRenderedText(url, category);
    }
    // Simple fetch + HTML cleaning
    const html = await this.fetchPage(url);
    return this.cleanHtmlToText(html);
  }

  // ============================================================================
  // CONTENT VALIDATION — verify scraped text has real pricing data
  // ============================================================================

  /**
   * Check that scraped text contains pricing signals before sending to LLM.
   * Returns a confidence level and specific issues found.
   */
  protected validateScrapedContent(
    text: string,
    category: OfferCategory
  ): { valid: boolean; confidence: ScrapeConfidence; issues: string[] } {
    const issues: string[] = [];

    if (text.length < 200) {
      return { valid: false, confidence: 'low', issues: ['Content too short — page likely did not render'] };
    }

    // Check for dollar signs / price patterns
    const pricePattern = /\$\d+(\.\d{2})?/g;
    const priceMatches = text.match(pricePattern) || [];
    if (priceMatches.length < 2) {
      issues.push(`Only ${priceMatches.length} price mentions found (expected 2+)`);
    }

    // Check for per-month patterns
    const monthlyPattern = /\/mo|per\s+month|monthly|\/month/gi;
    const monthlyMatches = text.match(monthlyPattern) || [];
    if (monthlyMatches.length === 0) {
      issues.push('No monthly pricing language found');
    }

    // Category-specific checks
    if (category === 'BROADBAND') {
      const speedPattern = /mbps|gbps|megabit|gigabit/gi;
      if (!speedPattern.test(text)) {
        issues.push('No speed references found for broadband page');
      }
    }

    if (category === 'MOBILE') {
      const mobilePattern = /unlimited|5g|per\s+line|data|hotspot|wireless/gi;
      const mobileMatches = text.match(mobilePattern) || [];
      if (mobileMatches.length < 2) {
        issues.push('Few mobile-specific terms found');
      }
    }

    // Determine confidence
    let confidence: ScrapeConfidence = 'high';
    if (issues.length >= 3) {
      confidence = 'low';
    } else if (issues.length >= 1) {
      confidence = 'medium';
    }

    const valid = priceMatches.length >= 1 || text.length >= 1000;

    return { valid, confidence, issues };
  }

  /**
   * Validate LLM-extracted offers for sanity.
   */
  protected validateExtractedOffers(
    offers: CollectedOffer[],
    category: OfferCategory,
    providerName: string
  ): { valid: boolean; confidence: ScrapeConfidence; issues: string[] } {
    const issues: string[] = [];
    const priceRange = PRICE_RANGES[category] || { min: 10, max: 500 };

    if (offers.length === 0) {
      return { valid: false, confidence: 'low', issues: ['No offers extracted'] };
    }

    if (offers.length > 25) {
      issues.push(`Unusually high offer count (${offers.length}) — may include duplicates`);
    }

    // Check that at least some offers have prices
    const withPrices = offers.filter(o => o.priceMonthly != null || o.pricePromo != null);
    if (withPrices.length === 0) {
      issues.push('No offers have pricing data');
    }

    // Price sanity check
    for (const offer of offers) {
      if (offer.priceMonthly != null) {
        if (offer.priceMonthly < priceRange.min || offer.priceMonthly > priceRange.max) {
          issues.push(`${offer.displayName}: price $${offer.priceMonthly}/mo outside expected range $${priceRange.min}-$${priceRange.max}`);
        }
      }
    }

    // Check for broadband speeds
    if (category === 'BROADBAND') {
      const withSpeeds = offers.filter(o => o.downloadMbps != null);
      if (withSpeeds.length === 0) {
        issues.push('No broadband offers have download speed data');
      }
    }

    // Check for identical prices (potential hallucination)
    const prices = offers.map(o => o.priceMonthly).filter(p => p != null);
    const uniquePrices = new Set(prices);
    if (prices.length >= 3 && uniquePrices.size === 1) {
      issues.push('All offers have identical prices — possible LLM hallucination');
    }

    let confidence: ScrapeConfidence = 'high';
    if (issues.length >= 3 || withPrices.length === 0) {
      confidence = 'low';
    } else if (issues.length >= 1) {
      confidence = 'medium';
    }

    const valid = offers.length > 0 && withPrices.length > 0;
    return { valid, confidence, issues };
  }

  // ============================================================================
  // LLM EXTRACTION — send page text to LLM for structured data extraction
  // ============================================================================

  /**
   * Use the user's LLM to extract structured plan data from scraped page text.
   */
  protected async extractOffersWithLLM(
    llmConfig: LLMClientConfig,
    pageText: string,
    providerName: string,
    category: OfferCategory,
    sourceUrl: string
  ): Promise<CollectedOffer[]> {
    const categoryDescriptions: Record<string, string> = {
      BROADBAND: 'internet/broadband plans (look for speeds in Mbps/Gbps, monthly prices, data caps, contract terms)',
      MOBILE: 'mobile/wireless plans (look for data allowances, unlimited plans, per-line pricing, 5G/5G+, hotspot data, device promotions, contract buyout offers, and switching incentives)',
      VOICE: 'voice/phone plans (look for business phone lines, VoIP, UCaaS, calling features, per-line pricing)',
      PACKAGE: 'bundled packages that combine multiple services (internet + voice, internet + mobile, triple-play bundles) at a combined price',
    };

    const mobileExtra = category === 'MOBILE' ? `
  "deviceIncentives": [
    {
      "deviceName": "iPhone 17 Pro",
      "deviceBrand": "Apple",
      "deviceModel": "iPhone 17 Pro 128GB",
      "incentiveType": "FREE_WITH_PLAN",
      "incentiveValue": 1099,
      "deviceRetailPrice": 1099,
      "monthlyCredit": 30.53,
      "creditMonths": 36,
      "conditions": "with trade-in and new line",
      "requiresTradeIn": true,
      "requiresNewLine": true,
      "requiresPortIn": false,
      "minPlanTier": "Unlimited Elite"
    }
  ],
  "contractBuyout": {
    "maxAmount": 1000,
    "perLineMax": 1000,
    "method": "BILL_CREDIT",
    "conditions": "port-in and trade-in required",
    "requiresPortIn": true,
    "requiresTradeIn": true
  },` : '';

    const mobileRules = category === 'MOBILE' ? `
- For MOBILE plans, also extract device incentives if mentioned (free phones, BOGO deals, trade-in credits, monthly device credits)
- Look for contract buyout/switching offers (e.g., "we'll pay up to $X to switch")
- deviceIncentives should list each device deal with brand, model, incentive type, value, and conditions
- contractBuyout captures the provider's switching/buyout offer details
- incentiveType values: FREE_WITH_PLAN, BOGO, TRADE_IN_CREDIT, MONTHLY_CREDIT, DISCOUNT
- buyout method values: VISA_CARD, BILL_CREDIT, ACCOUNT_CREDIT` : '';

    const prompt = `You are a data extraction specialist. Extract structured business ${categoryDescriptions[category] || category} offerings from the following web page content scraped from ${providerName}'s website (${sourceUrl}).

=== PAGE CONTENT ===
${pageText}
=== END CONTENT ===

Extract EVERY distinct plan/offer you can find for the ${category} category. For each offer, extract as much detail as possible.

Respond with a JSON array ONLY (no markdown, no explanation). Each object must have these fields:
{
  "name": "slug-style-unique-name",
  "displayName": "Marketing Name of the Plan",
  "description": "Brief description",
  "priceMonthly": 99.99,
  "pricePromo": null,
  "promoTermMonths": null,
  "contractMonths": null,
  "downloadMbps": null,
  "uploadMbps": null,
  "dataAllowanceGb": null,
  "unlimitedData": false,
  "bundleOptions": [],
  "features": {"key": "value"}${mobileExtra ? ',\n' + mobileExtra : ''}
}

Rules:
- Use null for any field where data is not found
- priceMonthly should be the regular/standard monthly price as a number
- pricePromo should be the promotional/introductory price if mentioned
- downloadMbps/uploadMbps should be numbers (convert Gbps to Mbps: 1 Gbps = 1000 Mbps)
- For mobile plans, set unlimitedData: true if the plan is unlimited
- features should capture any additional details as key-value pairs
- bundleOptions should list names of included services for PACKAGE category
- If you cannot find ANY plans in the content, return an empty array []
- Extract REAL data only — do not invent or assume plans that are not in the content${mobileRules}`;

    const messages: LLMMessage[] = [
      { role: 'system', content: 'You are a precise data extraction tool. Extract structured data from web content. Return only valid JSON arrays. Never fabricate data.' },
      { role: 'user', content: prompt },
    ];

    try {
      const response = await callLLM(llmConfig, messages, 8192);
      const content = response.content.trim();
      
      const match = content.match(/\[[\s\S]*\]/);
      if (!match) {
        console.warn(`LLM did not return a JSON array for ${providerName} ${category}`);
        return [];
      }
      
      const parsed = JSON.parse(match[0]);
      if (!Array.isArray(parsed)) return [];

      return parsed.map((item: any) => ({
        name: item.name || `${this.providerSlug}-${category.toLowerCase()}-${Math.random().toString(36).slice(2, 8)}`,
        displayName: item.displayName || item.name || 'Unknown Plan',
        description: item.description || undefined,
        category,
        priceMonthly: typeof item.priceMonthly === 'number' ? item.priceMonthly : undefined,
        priceSetup: typeof item.priceSetup === 'number' ? item.priceSetup : undefined,
        pricePromo: typeof item.pricePromo === 'number' ? item.pricePromo : undefined,
        promoTermMonths: typeof item.promoTermMonths === 'number' ? item.promoTermMonths : undefined,
        contractMonths: typeof item.contractMonths === 'number' ? item.contractMonths : undefined,
        downloadMbps: typeof item.downloadMbps === 'number' ? item.downloadMbps : undefined,
        uploadMbps: typeof item.uploadMbps === 'number' ? item.uploadMbps : undefined,
        dataAllowanceGb: typeof item.dataAllowanceGb === 'number' ? item.dataAllowanceGb : undefined,
        unlimitedData: item.unlimitedData === true,
        slaDetails: item.slaDetails || undefined,
        eligibilityNotes: item.eligibilityNotes || undefined,
        bundleOptions: Array.isArray(item.bundleOptions) ? item.bundleOptions : undefined,
        features: item.features && typeof item.features === 'object' ? item.features : undefined,
        sourceUrl,
        deviceIncentives: Array.isArray(item.deviceIncentives) ? item.deviceIncentives.map((d: any) => ({
          deviceName: d.deviceName || '',
          deviceBrand: d.deviceBrand || '',
          deviceModel: d.deviceModel || d.deviceName || '',
          incentiveType: d.incentiveType || 'DISCOUNT',
          incentiveValue: typeof d.incentiveValue === 'number' ? d.incentiveValue : undefined,
          deviceRetailPrice: typeof d.deviceRetailPrice === 'number' ? d.deviceRetailPrice : undefined,
          monthlyCredit: typeof d.monthlyCredit === 'number' ? d.monthlyCredit : undefined,
          creditMonths: typeof d.creditMonths === 'number' ? d.creditMonths : undefined,
          conditions: d.conditions || undefined,
          requiresTradeIn: d.requiresTradeIn === true,
          requiresNewLine: d.requiresNewLine === true,
          requiresPortIn: d.requiresPortIn === true,
          minPlanTier: d.minPlanTier || undefined,
          sourceUrl,
        })) : undefined,
        contractBuyout: item.contractBuyout ? {
          maxAmount: typeof item.contractBuyout.maxAmount === 'number' ? item.contractBuyout.maxAmount : undefined,
          perLineMax: typeof item.contractBuyout.perLineMax === 'number' ? item.contractBuyout.perLineMax : undefined,
          method: item.contractBuyout.method || undefined,
          conditions: item.contractBuyout.conditions || undefined,
          requiresPortIn: item.contractBuyout.requiresPortIn === true,
          requiresTradeIn: item.contractBuyout.requiresTradeIn === true,
          sourceUrl,
        } : undefined,
      }));
    } catch (error) {
      console.error(`LLM extraction failed for ${providerName} ${category}:`, error);
      return [];
    }
  }

  /**
   * Dedicated extraction for device incentives and contract buyout from a device/deals page.
   */
  protected async extractDeviceIncentivesWithLLM(
    llmConfig: LLMClientConfig,
    pageText: string,
    providerName: string,
    sourceUrl: string
  ): Promise<{ devices: CollectedDeviceIncentive[]; buyout: CollectedContractBuyout | null }> {
    const prompt = `You are a data extraction specialist. Extract device incentives (phone deals) and contract buyout/switching offers from the following web page content scraped from ${providerName}'s website (${sourceUrl}).

=== PAGE CONTENT ===
${pageText}
=== END CONTENT ===

Respond with a JSON object ONLY (no markdown, no explanation):
{
  "deviceIncentives": [
    {
      "deviceName": "iPhone 17 Pro",
      "deviceBrand": "Apple",
      "deviceModel": "iPhone 17 Pro 128GB",
      "incentiveType": "FREE_WITH_PLAN",
      "incentiveValue": 1099,
      "deviceRetailPrice": 1099,
      "monthlyCredit": 30.53,
      "creditMonths": 36,
      "conditions": "with eligible trade-in and new line on premium plan",
      "requiresTradeIn": true,
      "requiresNewLine": true,
      "requiresPortIn": false,
      "minPlanTier": "Business Unlimited Elite"
    }
  ],
  "contractBuyout": {
    "maxAmount": 1000,
    "perLineMax": 1000,
    "method": "BILL_CREDIT",
    "conditions": "port-in and trade-in required, up to $1000 per line",
    "requiresPortIn": true,
    "requiresTradeIn": true,
    "minLinesRequired": 1,
    "eligibleFromProviders": ["any"]
  }
}

Rules:
- Extract EVERY device deal/promotion mentioned
- incentiveType: FREE_WITH_PLAN, BOGO, TRADE_IN_CREDIT, MONTHLY_CREDIT, DISCOUNT
- deviceBrand: Apple, Samsung, Google, Motorola, etc.
- Include both current and upcoming device models (iPhone 16 series, iPhone 17 series, Galaxy S25 series, etc.)
- buyout method: VISA_CARD, BILL_CREDIT, ACCOUNT_CREDIT
- If no device deals found, return empty array for deviceIncentives
- If no buyout offer found, return null for contractBuyout
- Extract REAL data only — do not invent or assume`;

    const messages: LLMMessage[] = [
      { role: 'system', content: 'You are a precise data extraction tool. Extract structured data from web content. Return only valid JSON. Never fabricate data.' },
      { role: 'user', content: prompt },
    ];

    try {
      const response = await callLLM(llmConfig, messages, 8192);
      const content = response.content.trim();
      
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) return { devices: [], buyout: null };
      
      const parsed = JSON.parse(match[0]);
      
      const devices: CollectedDeviceIncentive[] = Array.isArray(parsed.deviceIncentives)
        ? parsed.deviceIncentives.map((d: any) => ({
            deviceName: d.deviceName || '',
            deviceBrand: d.deviceBrand || '',
            deviceModel: d.deviceModel || d.deviceName || '',
            incentiveType: d.incentiveType || 'DISCOUNT',
            incentiveValue: typeof d.incentiveValue === 'number' ? d.incentiveValue : undefined,
            deviceRetailPrice: typeof d.deviceRetailPrice === 'number' ? d.deviceRetailPrice : undefined,
            monthlyCredit: typeof d.monthlyCredit === 'number' ? d.monthlyCredit : undefined,
            creditMonths: typeof d.creditMonths === 'number' ? d.creditMonths : undefined,
            conditions: d.conditions || undefined,
            requiresTradeIn: d.requiresTradeIn === true,
            requiresNewLine: d.requiresNewLine === true,
            requiresPortIn: d.requiresPortIn === true,
            minPlanTier: d.minPlanTier || undefined,
            sourceUrl,
          }))
        : [];

      const buyout: CollectedContractBuyout | null = parsed.contractBuyout ? {
        maxAmount: typeof parsed.contractBuyout.maxAmount === 'number' ? parsed.contractBuyout.maxAmount : undefined,
        perLineMax: typeof parsed.contractBuyout.perLineMax === 'number' ? parsed.contractBuyout.perLineMax : undefined,
        method: parsed.contractBuyout.method || undefined,
        conditions: parsed.contractBuyout.conditions || undefined,
        requiresPortIn: parsed.contractBuyout.requiresPortIn === true,
        requiresTradeIn: parsed.contractBuyout.requiresTradeIn === true,
        minLinesRequired: typeof parsed.contractBuyout.minLinesRequired === 'number' ? parsed.contractBuyout.minLinesRequired : undefined,
        eligibleFromProviders: Array.isArray(parsed.contractBuyout.eligibleFromProviders) ? parsed.contractBuyout.eligibleFromProviders : undefined,
        sourceUrl,
      } : null;

      return { devices, buyout };
    } catch (error) {
      console.error(`Device incentive extraction failed for ${providerName}:`, error);
      return { devices: [], buyout: null };
    }
  }

  // ============================================================================
  // SCRAPE & EXTRACT — full pipeline with Playwright + validation
  // ============================================================================

  /**
   * Scrape a URL using Playwright, validate content, extract offers via LLM, and validate results.
   * Returns null (triggering seed data fallback) if any step fails.
   */
  protected async scrapeAndExtract(
    url: string,
    providerName: string,
    category: OfferCategory,
    llmConfig?: LLMClientConfig | null
  ): Promise<{ offers: CollectedOffer[]; rawContent: string; confidence: ScrapeConfidence } | null> {
    if (!llmConfig) return null;

    try {
      // Step 1: Fetch page content (Playwright for JS-heavy sites, simple fetch for others)
      const method = this.usePlaywright ? 'Playwright' : 'fetch';
      console.log(`[${this.providerSlug}] Fetching ${url} via ${method}...`);
      const text = await this.getPageText(url, category);

      if (text.length < 200) {
        console.warn(`[${this.providerSlug}] Page content too short (${text.length} chars) after rendering`);
        return null;
      }

      // Step 2: Validate scraped content for pricing signals
      const contentCheck = this.validateScrapedContent(text, category);
      console.log(`[${this.providerSlug}] Content validation: ${contentCheck.confidence} confidence (${contentCheck.issues.length} issues)`);
      if (contentCheck.issues.length > 0) {
        contentCheck.issues.forEach(i => console.log(`  - ${i}`));
      }

      if (!contentCheck.valid) {
        console.warn(`[${this.providerSlug}] Content validation failed for ${category} — no pricing signals found`);
        return null;
      }

      // Step 3: LLM extraction
      console.log(`[${this.providerSlug}] Sending ${text.length} chars to LLM for ${category} extraction...`);
      const offers = await this.extractOffersWithLLM(llmConfig, text, providerName, category, url);

      // Step 4: Validate extracted offers
      const offerCheck = this.validateExtractedOffers(offers, category, providerName);
      console.log(`[${this.providerSlug}] Extraction validation: ${offerCheck.confidence} confidence, ${offers.length} offers`);
      if (offerCheck.issues.length > 0) {
        offerCheck.issues.forEach(i => console.log(`  - ${i}`));
      }

      if (!offerCheck.valid) {
        console.warn(`[${this.providerSlug}] Extraction validation failed for ${category}`);
        return null;
      }

      // Combine confidence: take the lower of content and extraction confidence
      const confidenceOrder: ScrapeConfidence[] = ['low', 'medium', 'high'];
      const finalConfidence = confidenceOrder[Math.min(
        confidenceOrder.indexOf(contentCheck.confidence),
        confidenceOrder.indexOf(offerCheck.confidence)
      )];

      console.log(`[${this.providerSlug}] ✓ ${offers.length} ${category} offers extracted (${finalConfidence} confidence)`);

      return {
        offers,
        confidence: finalConfidence,
        rawContent: JSON.stringify({
          provider: this.providerSlug,
          category,
          fetchedAt: new Date().toISOString(),
          source: 'live_scrape',
          url,
          textLength: text.length,
          offersExtracted: offers.length,
          confidence: finalConfidence,
          plans: offers,
        }, null, 2),
      };
    } catch (error) {
      console.warn(`[${this.providerSlug}] Scrape failed for ${url}:`, error instanceof Error ? error.message : error);
      return null;
    }
  }

  /**
   * Scrape device deals/incentives from a provider's device page using Playwright.
   */
  protected async scrapeDeviceIncentives(
    url: string,
    providerName: string,
    llmConfig?: LLMClientConfig | null
  ): Promise<{ devices: CollectedDeviceIncentive[]; buyout: CollectedContractBuyout | null } | null> {
    if (!llmConfig) return null;

    try {
      const method = this.usePlaywright ? 'Playwright' : 'fetch';
      console.log(`[${this.providerSlug}] Fetching device page ${url} via ${method}...`);
      const text = await this.getPageText(url, 'MOBILE');

      if (text.length < 200) {
        console.log(`[${this.providerSlug}] Device page content too short (${text.length} chars)`);
        return null;
      }

      console.log(`[${this.providerSlug}] Extracting device incentives from ${text.length} chars...`);
      const result = await this.extractDeviceIncentivesWithLLM(llmConfig, text, providerName, url);

      if (result.devices.length === 0 && !result.buyout) return null;

      console.log(`[${this.providerSlug}] ✓ ${result.devices.length} device incentives${result.buyout ? ' + buyout offer' : ''}`);
      return result;
    } catch (error) {
      console.warn(`[${this.providerSlug}] Device scrape failed for ${url}:`, error instanceof Error ? error.message : error);
      return null;
    }
  }

  abstract collect(config: CollectorConfig): Promise<CollectionResult[]>;
}

export function createContentHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}
