import { callLLM, LLMClientConfig, LLMMessage } from './client';

export interface PlanSummary {
  headline: string;
  keyPoints: string[];
  bestFor: string;
  considerations: string[];
}

export interface ComparisonNarrative {
  summary: string;
  winner: string | null;
  winnerReason: string;
  provider1Strengths: string[];
  provider2Strengths: string[];
  recommendation: string;
}

export interface MarketInsight {
  overview: string;
  trends: string[];
  bestValue: { provider: string; plan: string; reason: string } | null;
  bestPerformance: { provider: string; plan: string; reason: string } | null;
  recommendations: string[];
}

export interface ProviderAnalysis {
  overview: string;
  strengths: string[];
  weaknesses: string[];
  competitivePosition: string;
  targetCustomer: string;
}

export interface OfferForAnalysis {
  name: string;
  displayName: string;
  description: string | null;
  category: string;
  priceMonthly: number | null;
  pricePromo: number | null;
  promoTermMonths: number | null;
  contractMonths: number | null;
  downloadMbps: number | null;
  uploadMbps: number | null;
  provider: { displayName: string; slug: string };
  features: { featureKey: string; featureValue: string }[];
}

function formatOffer(offer: OfferForAnalysis): string {
  const parts: string[] = [];
  parts.push('Plan: ' + offer.displayName);
  parts.push('Provider: ' + offer.provider.displayName);
  if (offer.priceMonthly) parts.push('Price: $' + offer.priceMonthly + '/mo');
  if (offer.downloadMbps) parts.push('Download: ' + offer.downloadMbps + ' Mbps');
  if (offer.uploadMbps) parts.push('Upload: ' + offer.uploadMbps + ' Mbps');
  if (offer.description) parts.push('Description: ' + offer.description);
  return parts.join(', ');
}

function safeParseJSON<T>(content: string, fallback: T): T {
  // Try to extract JSON from the response (LLMs sometimes wrap in markdown code blocks)
  let cleaned = content.trim();

  // Strip markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  // Try direct parse first
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Fall through to regex extraction
  }

  // Try to extract the outermost JSON object
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) {
    console.warn('[safeParseJSON] No JSON object found in LLM response. Response starts with:', cleaned.substring(0, 200));
    return fallback;
  }

  try {
    return JSON.parse(match[0]) as T;
  } catch (e) {
    console.warn('[safeParseJSON] Failed to parse extracted JSON:', e instanceof Error ? e.message : e);
    console.warn('[safeParseJSON] Extracted text starts with:', match[0].substring(0, 300));

    // Last resort: try to fix common JSON issues (trailing commas, single quotes)
    try {
      const fixed = match[0]
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .replace(/'/g, '"');
      return JSON.parse(fixed) as T;
    } catch {
      console.error('[safeParseJSON] All parse attempts failed. Returning fallback.');
      return fallback;
    }
  }
}

export async function generatePlanSummary(config: LLMClientConfig, offer: OfferForAnalysis): Promise<PlanSummary> {
  const defaultResult: PlanSummary = { headline: offer.displayName, keyPoints: [], bestFor: 'SMB', considerations: [] };
  const messages: LLMMessage[] = [
    { role: 'system', content: 'You are a telecommunications industry analyst. Analyze business internet plans and provide actionable summaries for SMB decision-makers.' },
    { role: 'user', content: `Analyze this business plan:\n\n${formatOffer(offer)}\n\nRespond with JSON only:\n{"headline":"compelling one-line value proposition","keyPoints":["3-4 key benefits"],"bestFor":"ideal customer description","considerations":["2-3 things to consider"]}` }
  ];
  const response = await callLLM(config, messages);
  return safeParseJSON(response.content, defaultResult);
}

export async function generateComparisonNarrative(
  config: LLMClientConfig, 
  name1: string, 
  offers1: OfferForAnalysis[], 
  name2: string, 
  offers2: OfferForAnalysis[]
): Promise<ComparisonNarrative> {
  const defaultResult: ComparisonNarrative = { 
    summary: 'Both providers offer competitive options for SMB customers.', 
    winner: null, 
    winnerReason: '', 
    provider1Strengths: [], 
    provider2Strengths: [], 
    recommendation: 'Consider your specific needs.' 
  };
  
  const prompt = `Compare these two providers for SMB broadband:

=== ${name1} ===
${offers1.map(formatOffer).join('\n')}

=== ${name2} ===
${offers2.map(formatOffer).join('\n')}

Respond with JSON only:
{"summary":"2-3 sentence executive summary","winner":"${name1}" or "${name2}" or null,"winnerReason":"why they win","provider1Strengths":["3-4 strengths"],"provider2Strengths":["3-4 strengths"],"recommendation":"specific advice for different scenarios"}`;

  const messages: LLMMessage[] = [
    { role: 'system', content: 'You are a telecommunications analyst helping businesses compare providers. Be objective and consider pricing, performance, and value.' },
    { role: 'user', content: prompt }
  ];
  const response = await callLLM(config, messages);
  return safeParseJSON(response.content, defaultResult);
}

export async function generateMarketInsights(config: LLMClientConfig, offers: OfferForAnalysis[], category: string): Promise<MarketInsight> {
  const defaultResult: MarketInsight = { 
    overview: 'The market offers various options for SMB customers.', 
    trends: [], 
    bestValue: null, 
    bestPerformance: null, 
    recommendations: [] 
  };
  
  const prompt = `Analyze the ${category} market for SMB customers based on these offerings:

${offers.slice(0, 15).map(formatOffer).join('\n\n')}

Respond with JSON only:
{"overview":"2-3 sentence market overview","trends":["3-4 observed trends"],"bestValue":{"provider":"name","plan":"plan name","reason":"why"},"bestPerformance":{"provider":"name","plan":"plan name","reason":"why"},"recommendations":["3-4 actionable tips for buyers"]}`;

  const messages: LLMMessage[] = [
    { role: 'system', content: 'You are a market research analyst for SMB telecommunications. Identify trends and value opportunities.' },
    { role: 'user', content: prompt }
  ];
  const response = await callLLM(config, messages);
  return safeParseJSON(response.content, defaultResult);
}

export async function generateProviderAnalysis(config: LLMClientConfig, providerName: string, offers: OfferForAnalysis[]): Promise<ProviderAnalysis> {
  const defaultResult: ProviderAnalysis = { 
    overview: providerName + ' offers telecommunications services for businesses.', 
    strengths: [], 
    weaknesses: [], 
    competitivePosition: 'Competitive in the SMB market.', 
    targetCustomer: 'Small to medium businesses.' 
  };
  
  const prompt = `Analyze ${providerName} as an SMB service provider:

${offers.map(formatOffer).join('\n\n')}

Respond with JSON only:
{"overview":"2-3 sentence market position","strengths":["4-5 key strengths"],"weaknesses":["2-3 areas for improvement"],"competitivePosition":"how they compare to competitors","targetCustomer":"ideal customer profile"}`;

  const messages: LLMMessage[] = [
    { role: 'system', content: 'You are a competitive intelligence analyst for telecommunications. Be objective and data-driven.' },
    { role: 'user', content: prompt }
  ];
  const response = await callLLM(config, messages);
  return safeParseJSON(response.content, defaultResult);
}

export async function generateQuickSummary(config: LLMClientConfig, offerCount: number, providerCount: number, categories: string[]): Promise<string> {
  const messages: LLMMessage[] = [
    { role: 'system', content: 'Provide brief, professional market summaries.' },
    { role: 'user', content: `Generate a 2-3 sentence dashboard summary for an SMB telecom intelligence platform tracking ${offerCount} plans across ${providerCount} providers in categories: ${categories.join(', ')}.` }
  ];
  const response = await callLLM(config, messages);
  return response.content.trim();
}

// ============================================================================
// SEGMENT & BUYER BEHAVIOR ANALYSIS
// ============================================================================

export interface SegmentData {
  code: string;
  name: string;
  employeeTier: string | null;
  revenueTier: string | null;
  industry: string | null;
  industryGroup: string | null;
  techMaturity: string | null;
  priceSensitivity: string | null;
  contractAversion: string | null;
  supportImportance: string | null;
}

export interface BuyerProfileData {
  awarenessChannels: string[];
  considerationFactors: string[];
  decisionTriggers: string[];
  painPoints: { issue: string; severity: number }[];
  preferredTerms: string[];
  switchingBarriers: string[];
  loyaltyDrivers: string[];
  purchaseChannels: string[];
  supportExpectations: string;
}

export interface SegmentAnalysisResult {
  overview: string;
  needsPriorities: string[];
  bestFitProviders: { provider: string; reason: string }[];
  pricingInsights: string;
  contractRecommendation: string;
  keyConsiderations: string[];
}

export interface BuyerBehaviorInsight {
  purchaseJourneyNarrative: string;
  topPainPoints: { issue: string; impact: string; opportunity: string }[];
  contractStrategy: string;
  channelStrategy: string;
  retentionTactics: string[];
  competitiveVulnerabilities: string[];
  messagingRecommendations: string[];
}

export interface CompetitiveIntel {
  executiveSummary: string;
  marketPosition: string;
  strengthsVsCompetitors: { competitor: string; advantage: string; vulnerability: string }[];
  segmentOpportunities: string[];
  threatAssessment: string[];
  strategicRecommendations: string[];
  winLossDrivers: { driver: string; impact: string }[];
}

export interface ExecutiveSummaryResult {
  headline: string;
  marketOverview: string;
  competitivePosition: string;
  keyFindings: string[];
  segmentOpportunities: { segment: string; opportunity: string; priority: string }[];
  strategicRecommendations: string[];
  riskFactors: string[];
}

function formatSegmentContext(segment: SegmentData): string {
  return `SMB Segment: ${segment.name}
- Business size: ${segment.employeeTier || 'N/A'} employees
- Revenue tier: ${segment.revenueTier || 'N/A'}
- Industry: ${segment.industry || 'General'}
- Tech maturity: ${segment.techMaturity || 'moderate'}
- Price sensitivity: ${segment.priceSensitivity || 'medium'}
- Contract aversion: ${segment.contractAversion || 'medium'}
- Support importance: ${segment.supportImportance || 'important'}`;
}

export async function generateSegmentAnalysis(
  config: LLMClientConfig,
  segment: SegmentData,
  offers: OfferForAnalysis[]
): Promise<SegmentAnalysisResult> {
  const defaultResult: SegmentAnalysisResult = {
    overview: `Analysis for ${segment.name}`,
    needsPriorities: [],
    bestFitProviders: [],
    pricingInsights: '',
    contractRecommendation: '',
    keyConsiderations: [],
  };

  const prompt = `You are a C-Suite telecom strategy advisor. Analyze how this SMB segment views the available service offerings.

${formatSegmentContext(segment)}

Available offerings:
${offers.slice(0, 15).map(formatOffer).join('\n\n')}

Consider: What does this segment prioritize? Which providers and plans best fit their needs? How does their price sensitivity and contract aversion affect decisions?

Respond with JSON only:
{"overview":"3-4 sentence strategic overview for this segment","needsPriorities":["top 5 needs in priority order"],"bestFitProviders":[{"provider":"name","reason":"why this fits"}],"pricingInsights":"analysis of how this segment views pricing","contractRecommendation":"advice on contract strategy for this segment","keyConsiderations":["4-5 key strategic considerations"]}`;

  const messages: LLMMessage[] = [
    { role: 'system', content: 'You are a senior telecommunications strategy consultant advising C-Suite executives. Provide data-driven, actionable insights for strategic planning.' },
    { role: 'user', content: prompt }
  ];
  const response = await callLLM(config, messages);
  return safeParseJSON(response.content, defaultResult);
}

export async function generateBuyerBehaviorInsight(
  config: LLMClientConfig,
  segment: SegmentData,
  buyerProfile: BuyerProfileData
): Promise<BuyerBehaviorInsight> {
  const defaultResult: BuyerBehaviorInsight = {
    purchaseJourneyNarrative: '',
    topPainPoints: [],
    contractStrategy: '',
    channelStrategy: '',
    retentionTactics: [],
    competitiveVulnerabilities: [],
    messagingRecommendations: [],
  };

  const prompt = `You are a C-Suite strategy advisor. Provide deep buyer behavior analysis for this SMB segment.

${formatSegmentContext(segment)}

Known buyer behaviors:
- Awareness channels: ${buyerProfile.awarenessChannels.join(', ')}
- Key consideration factors: ${buyerProfile.considerationFactors.join(', ')}
- Decision triggers: ${buyerProfile.decisionTriggers.join(', ')}
- Pain points: ${buyerProfile.painPoints.map(p => `${p.issue} (severity: ${p.severity}/10)`).join(', ')}
- Preferred terms: ${buyerProfile.preferredTerms.join(', ')}
- Switching barriers: ${buyerProfile.switchingBarriers.join(', ')}
- Loyalty drivers: ${buyerProfile.loyaltyDrivers.join(', ')}
- Purchase channels: ${buyerProfile.purchaseChannels.join(', ')}
- Support expectations: ${buyerProfile.supportExpectations}

Analyze how these SMB buyers think, what they fear, how they make decisions, and what providers should do to win and retain them.

Respond with JSON only:
{"purchaseJourneyNarrative":"detailed 4-5 sentence narrative of how these buyers discover, evaluate, and choose telecom services","topPainPoints":[{"issue":"pain point","impact":"business impact","opportunity":"strategic opportunity for providers"}],"contractStrategy":"detailed analysis of how this segment views contracts and commitment","channelStrategy":"which sales and marketing channels work best and why","retentionTactics":["5-6 specific retention strategies"],"competitiveVulnerabilities":["4-5 areas where incumbents are vulnerable to competitors"],"messagingRecommendations":["5-6 specific messaging approaches that resonate"]}`;

  const messages: LLMMessage[] = [
    { role: 'system', content: 'You are a senior market research analyst specializing in SMB buyer behavior for telecommunications. Your insights guide C-Suite strategy for major providers.' },
    { role: 'user', content: prompt }
  ];
  const response = await callLLM(config, messages);
  return safeParseJSON(response.content, defaultResult);
}

export async function generateCompetitiveIntel(
  config: LLMClientConfig,
  myProviderName: string,
  myOffers: OfferForAnalysis[],
  competitors: { name: string; offers: OfferForAnalysis[] }[],
  segment?: SegmentData
): Promise<CompetitiveIntel> {
  const defaultResult: CompetitiveIntel = {
    executiveSummary: '',
    marketPosition: '',
    strengthsVsCompetitors: [],
    segmentOpportunities: [],
    threatAssessment: [],
    strategicRecommendations: [],
    winLossDrivers: [],
  };

  const segmentContext = segment ? `\nTarget segment:\n${formatSegmentContext(segment)}\n` : '';

  const competitorDetail = competitors.map(c =>
    `=== ${c.name} ===\n${c.offers.slice(0, 5).map(formatOffer).join('\n')}`
  ).join('\n\n');

  const prompt = `You are the chief competitive intelligence strategist for ${myProviderName}. Provide a C-Suite competitive analysis.
${segmentContext}
=== ${myProviderName} (Our Company) ===
${myOffers.slice(0, 8).map(formatOffer).join('\n')}

=== COMPETITORS ===
${competitorDetail}

Provide a strategic competitive intelligence briefing for ${myProviderName}'s executive team.

Respond with JSON only:
{"executiveSummary":"3-4 sentence C-Suite executive summary","marketPosition":"how ${myProviderName} is positioned vs competitors","strengthsVsCompetitors":[{"competitor":"name","advantage":"our advantage","vulnerability":"our vulnerability"}],"segmentOpportunities":["4-5 segment opportunities to pursue"],"threatAssessment":["4-5 competitive threats to monitor"],"strategicRecommendations":["5-6 strategic recommendations for the C-Suite"],"winLossDrivers":[{"driver":"key factor","impact":"how it affects win/loss"}]}`;

  const messages: LLMMessage[] = [
    { role: 'system', content: 'You are the chief strategy officer for a major telecommunications provider. Provide executive-level competitive intelligence that drives strategic decisions. Frame everything from the perspective of the specified company.' },
    { role: 'user', content: prompt }
  ];
  const response = await callLLM(config, messages, 8192);
  return safeParseJSON(response.content, defaultResult);
}

// ============================================================================
// PRODUCT PORTFOLIO & PACKAGE ANALYSIS
// ============================================================================

export interface PackageForAnalysis {
  name: string;
  displayName: string;
  description: string | null;
  packageType: string;
  tier: string | null;
  basePrice: number | null;
  targetSegments: string[];
  provider: { displayName: string; slug: string };
  includedOffers: {
    offer: {
      displayName: string;
      category: string;
      priceMonthly: number | null;
      downloadMbps: number | null;
      uploadMbps: number | null;
    };
  }[];
  addOns: { displayName: string; price: number | null; description: string | null }[];
}

export interface PortfolioAnalysisResult {
  executiveSummary: string;
  portfolioStrategy: string;
  tierAnalysis: {
    tier: string;
    positioning: string;
    targetBuyer: string;
    valueScore: string;
    strengths: string[];
    gaps: string[];
  }[];
  pricingStrategy: {
    overview: string;
    competitivePosition: string;
    discountStructure: string;
    recommendations: string[];
  };
  bundlingEffectiveness: {
    assessment: string;
    bestPackage: string;
    bestPackageReason: string;
    missingCombinations: string[];
  };
  smbFit: {
    microBusiness: string;
    smallBusiness: string;
    mediumBusiness: string;
  };
  competitiveGaps: string[];
  strategicRecommendations: string[];
}

export interface CrossProviderPackageComparison {
  marketOverview: string;
  leaderboard: {
    category: string;
    leader: string;
    reason: string;
  }[];
  pricingComparison: {
    cheapestEntry: { provider: string; package: string; price: string };
    bestMidTier: { provider: string; package: string; reason: string };
    premiumLeader: { provider: string; package: string; differentiator: string };
  };
  bundlingStrategies: {
    provider: string;
    approach: string;
    effectiveness: string;
  }[];
  gaps: { provider: string; missingCapability: string }[];
  recommendations: string[];
}

function formatPackage(pkg: PackageForAnalysis): string {
  const parts: string[] = [];
  parts.push(`Package: ${pkg.displayName}`);
  parts.push(`Provider: ${pkg.provider.displayName}`);
  if (pkg.tier) parts.push(`Tier: ${pkg.tier}`);
  if (pkg.basePrice) parts.push(`Price: $${pkg.basePrice}/mo`);
  if (pkg.packageType) parts.push(`Type: ${pkg.packageType}`);
  if (pkg.includedOffers.length > 0) {
    parts.push(`Includes: ${pkg.includedOffers.map(o => `${o.offer.displayName} (${o.offer.category}${o.offer.priceMonthly ? ', $' + o.offer.priceMonthly + '/mo standalone' : ''}${o.offer.downloadMbps ? ', ' + o.offer.downloadMbps + 'Mbps' : ''})`).join('; ')}`);
  }
  if (pkg.addOns.length > 0) {
    parts.push(`Add-ons: ${pkg.addOns.map(a => `${a.displayName}${a.price ? ' ($' + a.price + ')' : ''}`).join('; ')}`);
  }
  if (pkg.targetSegments.length > 0) {
    parts.push(`Target segments: ${pkg.targetSegments.join(', ')}`);
  }
  if (pkg.description) parts.push(`Description: ${pkg.description}`);
  return parts.join('\n  ');
}

export async function generatePortfolioAnalysis(
  config: LLMClientConfig,
  providerName: string,
  packages: PackageForAnalysis[],
  standaloneOffers: OfferForAnalysis[]
): Promise<PortfolioAnalysisResult> {
  const defaultResult: PortfolioAnalysisResult = {
    executiveSummary: `Portfolio analysis for ${providerName}`,
    portfolioStrategy: '',
    tierAnalysis: [],
    pricingStrategy: { overview: '', competitivePosition: '', discountStructure: '', recommendations: [] },
    bundlingEffectiveness: { assessment: '', bestPackage: '', bestPackageReason: '', missingCombinations: [] },
    smbFit: { microBusiness: '', smallBusiness: '', mediumBusiness: '' },
    competitiveGaps: [],
    strategicRecommendations: [],
  };

  const prompt = `You are a senior product strategy consultant. Perform a deep product portfolio analysis for ${providerName}'s SMB service packages.

=== PACKAGES ===
${packages.map(formatPackage).join('\n\n')}

=== STANDALONE OFFERS (for context) ===
${standaloneOffers.slice(0, 12).map(formatOffer).join('\n')}

Analyze their complete product portfolio: tiering strategy, pricing architecture, bundling effectiveness, how well packages serve different SMB sizes, and strategic gaps.

Respond with JSON only:
{"executiveSummary":"4-5 sentence C-Suite executive summary of the portfolio","portfolioStrategy":"3-4 sentence analysis of their overall product strategy and go-to-market approach","tierAnalysis":[{"tier":"tier name","positioning":"how this tier is positioned","targetBuyer":"ideal buyer profile","valueScore":"excellent/good/fair/poor","strengths":["2-3 strengths"],"gaps":["1-2 gaps"]}],"pricingStrategy":{"overview":"how the pricing architecture works","competitivePosition":"how prices compare to market","discountStructure":"analysis of bundling discounts","recommendations":["3-4 pricing recommendations"]},"bundlingEffectiveness":{"assessment":"overall effectiveness of bundling strategy","bestPackage":"name of best package","bestPackageReason":"why it is the best","missingCombinations":["2-3 service combos that should exist but don't"]},"smbFit":{"microBusiness":"how well portfolio serves 1-4 employee businesses","smallBusiness":"how well portfolio serves 5-19 employee businesses","mediumBusiness":"how well portfolio serves 20-99 employee businesses"},"competitiveGaps":["4-5 gaps vs competitors"],"strategicRecommendations":["5-7 actionable strategic recommendations"]}`;

  const messages: LLMMessage[] = [
    { role: 'system', content: 'You are a McKinsey-level product strategy consultant specializing in telecommunications and SMB market strategy. Provide deep, actionable product portfolio analysis with specific recommendations. Be data-driven and strategic.' },
    { role: 'user', content: prompt }
  ];
  const response = await callLLM(config, messages, 8192);
  return safeParseJSON(response.content, defaultResult);
}

export async function generateCrossProviderPackageComparison(
  config: LLMClientConfig,
  providerPackages: { providerName: string; packages: PackageForAnalysis[] }[]
): Promise<CrossProviderPackageComparison> {
  const defaultResult: CrossProviderPackageComparison = {
    marketOverview: '',
    leaderboard: [],
    pricingComparison: {
      cheapestEntry: { provider: '', package: '', price: '' },
      bestMidTier: { provider: '', package: '', reason: '' },
      premiumLeader: { provider: '', package: '', differentiator: '' },
    },
    bundlingStrategies: [],
    gaps: [],
    recommendations: [],
  };

  const allPackagesText = providerPackages.map(pp =>
    `=== ${pp.providerName} (${pp.packages.length} packages) ===\n${pp.packages.map(formatPackage).join('\n\n')}`
  ).join('\n\n');

  const prompt = `You are a competitive market analyst. Compare the SMB service package portfolios across these providers:

${allPackagesText}

Provide a cross-provider comparison of their packaging strategies, pricing, and market positioning.

Respond with JSON only:
{"marketOverview":"3-4 sentence overview of the SMB package market","leaderboard":[{"category":"best value/best bundling/best premium/most flexible/best for micro-business","leader":"provider name","reason":"why they lead"}],"pricingComparison":{"cheapestEntry":{"provider":"name","package":"package name","price":"price"},"bestMidTier":{"provider":"name","package":"package name","reason":"why best mid-tier"},"premiumLeader":{"provider":"name","package":"package name","differentiator":"what makes it premium"}},"bundlingStrategies":[{"provider":"name","approach":"their bundling strategy","effectiveness":"how effective it is"}],"gaps":[{"provider":"name","missingCapability":"what they are missing"}],"recommendations":["5-6 market-wide strategic recommendations"]}`;

  const messages: LLMMessage[] = [
    { role: 'system', content: 'You are a market research director at a top consulting firm. Compare telecommunications package portfolios with strategic depth. Identify leaders, laggards, and market opportunities.' },
    { role: 'user', content: prompt }
  ];
  // Cross-provider package comparison is data-heavy — needs higher budget
  const response = await callLLM(config, messages, 12288);
  return safeParseJSON(response.content, defaultResult);
}

export async function generateExecutiveSummary(
  config: LLMClientConfig,
  providerName: string,
  providerOffers: OfferForAnalysis[],
  competitorOffers: OfferForAnalysis[],
  segmentCount: number,
  totalOffers: number
): Promise<ExecutiveSummaryResult> {
  const defaultResult: ExecutiveSummaryResult = {
    headline: '',
    marketOverview: '',
    competitivePosition: '',
    keyFindings: [],
    segmentOpportunities: [],
    strategicRecommendations: [],
    riskFactors: [],
  };

  const prompt = `You are preparing an executive briefing for the C-Suite of ${providerName}.

Market data:
- Total plans tracked: ${totalOffers}
- SMB segments analyzed: ${segmentCount}

${providerName}'s current offerings:
${providerOffers.slice(0, 10).map(formatOffer).join('\n')}

Competitor landscape (sample):
${competitorOffers.slice(0, 15).map(formatOffer).join('\n')}

Generate a comprehensive executive summary that a CEO or CSO would present to the board.

Respond with JSON only:
{"headline":"compelling one-line headline for the briefing","marketOverview":"3-4 sentence market overview","competitivePosition":"3-4 sentence assessment of ${providerName}'s position","keyFindings":["5-6 key strategic findings"],"segmentOpportunities":[{"segment":"segment name","opportunity":"specific opportunity","priority":"high/medium/low"}],"strategicRecommendations":["5-7 actionable strategic recommendations"],"riskFactors":["4-5 risk factors to monitor"]}`;

  const messages: LLMMessage[] = [
    { role: 'system', content: 'You are a McKinsey-level strategy consultant preparing an executive briefing for the C-Suite of a major telecommunications provider. Be specific, data-driven, and strategic.' },
    { role: 'user', content: prompt }
  ];
  const response = await callLLM(config, messages, 8192);
  return safeParseJSON(response.content, defaultResult);
}

// ============================================================================
// MOBILE DEEP ANALYSIS
// ============================================================================

export interface DeviceIncentiveForAnalysis {
  deviceName: string;
  deviceBrand: string;
  deviceModel: string;
  incentiveType: string;
  incentiveValue: number | null;
  deviceRetailPrice: number | null;
  monthlyCredit: number | null;
  creditMonths: number | null;
  conditions: string | null;
  requiresTradeIn: boolean;
  requiresNewLine: boolean;
  requiresPortIn: boolean;
  minPlanTier: string | null;
}

export interface ContractBuyoutForAnalysis {
  maxBuyoutAmount: number | null;
  perLineMax: number | null;
  buyoutMethod: string;
  conditions: string | null;
  requiresPortIn: boolean;
  requiresTradeIn: boolean;
}

export interface MobileDeepAnalysisResult {
  executiveSummary: string;
  planTierAnalysis: {
    tier: string;
    pricePerLine: number | null;
    keyFeatures: string[];
    bestDeviceDeal: string;
    totalCostOfOwnership24Mo: number | null;
    totalCostOfOwnership36Mo: number | null;
    valueRating: string;
  }[];
  deviceDealAnalysis: {
    deviceName: string;
    deviceBrand: string;
    retailPrice: number | null;
    effectiveCost: number | null;
    bestPlanForDeal: string;
    incentiveType: string;
    conditions: string;
    valueScore: string;
  }[];
  contractBuyoutAnalysis: {
    maxAmount: number | null;
    method: string;
    conditions: string;
    competitiveness: string;
  } | null;
  iphone17vs16: {
    comparison: string;
    recommendation: string;
    costDifference: string;
  };
  bestValueScenarios: {
    scenario: string;
    plan: string;
    device: string;
    monthlyCost: string;
    totalCost24Mo: string;
    recommendation: string;
  }[];
  strategicRecommendations: string[];
}

export interface MobileComparisonResult {
  marketOverview: string;
  planComparison: {
    tier: string;
    providers: {
      provider: string;
      planName: string;
      pricePerLine: number | null;
      keyDifferentiator: string;
    }[];
    bestValue: string;
  }[];
  deviceComparison: {
    deviceName: string;
    deviceBrand: string;
    retailPrice: number | null;
    providerDeals: {
      provider: string;
      incentiveType: string;
      effectiveCost: number | null;
      conditions: string;
      requiredPlan: string;
    }[];
    bestDeal: string;
    bestDealReason: string;
  }[];
  buyoutComparison: {
    provider: string;
    maxAmount: number | null;
    method: string;
    conditions: string;
  }[];
  buyoutWinner: string;
  switchingCostAnalysis: {
    scenario: string;
    fromProvider: string;
    toProvider: string;
    estimatedSavings: string;
    deviceDealValue: string;
    netSwitchingBenefit: string;
  }[];
  packageVsStandalone: {
    provider: string;
    standaloneMobileCost: string;
    packageMobileCost: string;
    savings: string;
    recommendation: string;
  }[];
  overallRecommendation: string;
  strategicInsights: string[];
}

function formatDeviceIncentive(d: DeviceIncentiveForAnalysis): string {
  const parts = [`  ${d.deviceBrand} ${d.deviceName} (${d.deviceModel})`];
  parts.push(`    Retail: $${d.deviceRetailPrice || '?'} | Incentive: ${d.incentiveType} worth $${d.incentiveValue || '?'}`);
  if (d.monthlyCredit) parts.push(`    Monthly credit: $${d.monthlyCredit}/mo x ${d.creditMonths || '?'} months`);
  if (d.minPlanTier) parts.push(`    Requires: ${d.minPlanTier} plan`);
  if (d.conditions) parts.push(`    Conditions: ${d.conditions}`);
  const flags = [];
  if (d.requiresTradeIn) flags.push('trade-in');
  if (d.requiresNewLine) flags.push('new line');
  if (d.requiresPortIn) flags.push('port-in');
  if (flags.length) parts.push(`    Requirements: ${flags.join(', ')}`);
  return parts.join('\n');
}

export async function generateMobileDeepAnalysis(
  config: LLMClientConfig,
  providerName: string,
  mobileOffers: OfferForAnalysis[],
  deviceIncentives: DeviceIncentiveForAnalysis[],
  contractBuyout: ContractBuyoutForAnalysis | null
): Promise<MobileDeepAnalysisResult> {
  const defaultResult: MobileDeepAnalysisResult = {
    executiveSummary: 'Analysis pending.',
    planTierAnalysis: [],
    deviceDealAnalysis: [],
    contractBuyoutAnalysis: null,
    iphone17vs16: { comparison: '', recommendation: '', costDifference: '' },
    bestValueScenarios: [],
    strategicRecommendations: [],
  };

  const buyoutText = contractBuyout
    ? `Contract Buyout Offer:\n  Max: $${contractBuyout.maxBuyoutAmount || '?'}/line | Method: ${contractBuyout.buyoutMethod}\n  Conditions: ${contractBuyout.conditions || 'N/A'}\n  Requires port-in: ${contractBuyout.requiresPortIn ? 'Yes' : 'No'} | Requires trade-in: ${contractBuyout.requiresTradeIn ? 'Yes' : 'No'}`
    : 'No contract buyout offer available.';

  const prompt = `You are a mobile telecom analyst. Perform a deep analysis of ${providerName}'s business mobile offerings including plans, device deals, and switching incentives.

=== MOBILE PLANS ===
${mobileOffers.map(formatOffer).join('\n\n')}

=== DEVICE INCENTIVES (${deviceIncentives.length} deals) ===
${deviceIncentives.map(formatDeviceIncentive).join('\n\n')}

=== CONTRACT BUYOUT ===
${buyoutText}

Provide a comprehensive analysis. Consider total cost of ownership over 24 and 36 months (plan + device payments). Compare iPhone 17 vs iPhone 16 deal value.

Respond with JSON only matching this structure:
{"executiveSummary":"2-3 sentence overview","planTierAnalysis":[{"tier":"plan name","pricePerLine":99,"keyFeatures":["feature1"],"bestDeviceDeal":"best device available","totalCostOfOwnership24Mo":999,"totalCostOfOwnership36Mo":1499,"valueRating":"excellent/good/fair/poor"}],"deviceDealAnalysis":[{"deviceName":"iPhone 17 Pro","deviceBrand":"Apple","retailPrice":1099,"effectiveCost":0,"bestPlanForDeal":"plan name","incentiveType":"FREE_WITH_PLAN","conditions":"summary","valueScore":"excellent/good/fair"}],"contractBuyoutAnalysis":{"maxAmount":1000,"method":"BILL_CREDIT","conditions":"summary","competitiveness":"leading/competitive/below-average"},"iphone17vs16":{"comparison":"detailed comparison","recommendation":"which to choose","costDifference":"cost delta explanation"},"bestValueScenarios":[{"scenario":"scenario name","plan":"plan","device":"device","monthlyCost":"$XX/mo","totalCost24Mo":"$XXXX","recommendation":"recommendation"}],"strategicRecommendations":["rec1","rec2"]}`;

  const messages: LLMMessage[] = [
    { role: 'system', content: 'You are a mobile telecom industry analyst specializing in SMB business wireless. Provide data-driven analysis with specific cost calculations. Return only valid JSON.' },
    { role: 'user', content: prompt }
  ];
  // Deep single-provider analysis needs more room than default 4096
  const response = await callLLM(config, messages, 8192);
  return safeParseJSON(response.content, defaultResult);
}

export async function generateMobileComparisonAnalysis(
  config: LLMClientConfig,
  providerData: {
    providerName: string;
    offers: OfferForAnalysis[];
    deviceIncentives: DeviceIncentiveForAnalysis[];
    buyout: ContractBuyoutForAnalysis | null;
  }[]
): Promise<MobileComparisonResult> {
  const defaultResult: MobileComparisonResult = {
    marketOverview: 'Analysis pending.',
    planComparison: [],
    deviceComparison: [],
    buyoutComparison: [],
    buyoutWinner: '',
    switchingCostAnalysis: [],
    packageVsStandalone: [],
    overallRecommendation: '',
    strategicInsights: [],
  };

  const sections = providerData.map(p => {
    const buyoutText = p.buyout
      ? `Buyout: up to $${p.buyout.maxBuyoutAmount || '?'}/line via ${p.buyout.buyoutMethod}`
      : 'No buyout offer';
    return `--- ${p.providerName} ---
Plans:
${p.offers.map(formatOffer).join('\n')}

Device Deals (${p.deviceIncentives.length}):
${p.deviceIncentives.slice(0, 6).map(formatDeviceIncentive).join('\n')}

${buyoutText}`;
  }).join('\n\n');

  const prompt = `You are a mobile telecom analyst. Compare business mobile offerings across ${providerData.length} providers. Include plan pricing, device incentive comparison (same device across providers), contract buyout/switching offers, and total cost analysis.

Focus especially on:
1. iPhone 17 Pro / Pro Max deals across providers
2. iPhone 16 Pro deals across providers  
3. Samsung Galaxy S25 Ultra deals across providers
4. Which provider offers the best switching deal
5. Package vs standalone mobile value

=== PROVIDER DATA ===
${sections}

Respond with JSON only:
{"marketOverview":"2-3 sentence market summary","planComparison":[{"tier":"entry/mid/premium","providers":[{"provider":"name","planName":"plan","pricePerLine":99,"keyDifferentiator":"what stands out"}],"bestValue":"provider name"}],"deviceComparison":[{"deviceName":"iPhone 17 Pro","deviceBrand":"Apple","retailPrice":1099,"providerDeals":[{"provider":"name","incentiveType":"FREE_WITH_PLAN","effectiveCost":0,"conditions":"summary","requiredPlan":"plan name"}],"bestDeal":"provider","bestDealReason":"why"}],"buyoutComparison":[{"provider":"name","maxAmount":1000,"method":"BILL_CREDIT","conditions":"summary"}],"buyoutWinner":"provider with best buyout","switchingCostAnalysis":[{"scenario":"description","fromProvider":"current","toProvider":"new","estimatedSavings":"$X/mo","deviceDealValue":"$X","netSwitchingBenefit":"total value"}],"packageVsStandalone":[{"provider":"name","standaloneMobileCost":"$X/mo","packageMobileCost":"$X/mo","savings":"$X/mo","recommendation":"standalone or package"}],"overallRecommendation":"clear recommendation","strategicInsights":["insight1","insight2"]}`;

  const messages: LLMMessage[] = [
    { role: 'system', content: 'You are a mobile telecom industry analyst specializing in SMB business wireless market comparison. Be specific with numbers and provide actionable insights. Return only valid JSON.' },
    { role: 'user', content: prompt }
  ];
  // Cross-provider comparison produces large JSON — use a higher token budget
  const response = await callLLM(config, messages, 12288);
  return safeParseJSON(response.content, defaultResult);
}
