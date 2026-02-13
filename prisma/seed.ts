import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const providers = [
  {
    slug: 'comcast-business',
    name: 'Comcast Business',
    displayName: 'Comcast Business',
    providerType: 'MSO' as const,
    country: 'US',
    regions: ['Northeast', 'Mid-Atlantic', 'Midwest', 'West', 'South'],
    websiteUrl: 'https://business.comcast.com',
    businessUrl: 'https://business.comcast.com',
    priorityRank: 1,
  },
  {
    slug: 'att-business',
    name: 'AT&T Business',
    displayName: 'AT&T Business',
    providerType: 'TELCO' as const,
    country: 'US',
    regions: ['Nationwide'],
    websiteUrl: 'https://www.att.com/business',
    businessUrl: 'https://www.business.att.com',
    priorityRank: 2,
  },
  {
    slug: 'verizon-business',
    name: 'Verizon Business',
    displayName: 'Verizon Business',
    providerType: 'TELCO' as const,
    country: 'US',
    regions: ['Northeast', 'Mid-Atlantic', 'Nationwide (Wireless)'],
    websiteUrl: 'https://www.verizon.com/business',
    businessUrl: 'https://www.verizon.com/business',
    priorityRank: 3,
  },
  {
    slug: 'tmobile-business',
    name: 'T-Mobile for Business',
    displayName: 'T-Mobile for Business',
    providerType: 'WIRELESS' as const,
    country: 'US',
    regions: ['Nationwide'],
    websiteUrl: 'https://www.t-mobile.com/business',
    businessUrl: 'https://www.t-mobile.com/business',
    priorityRank: 4,
  },
  {
    slug: 'spectrum-business',
    name: 'Spectrum Business',
    displayName: 'Spectrum Business',
    parentMsoGroup: 'Charter Communications',
    providerType: 'MSO' as const,
    country: 'US',
    regions: ['Northeast', 'Midwest', 'South', 'West'],
    websiteUrl: 'https://business.spectrum.com',
    businessUrl: 'https://business.spectrum.com',
    priorityRank: 5,
  },
  {
    slug: 'cox-business',
    name: 'Cox Business',
    displayName: 'Cox Business',
    providerType: 'MSO' as const,
    country: 'US',
    regions: ['Southwest', 'Southeast', 'Midwest'],
    websiteUrl: 'https://www.cox.com/business',
    businessUrl: 'https://www.cox.com/business',
    priorityRank: 6,
  },
  {
    slug: 'optimum-business',
    name: 'Optimum Business',
    displayName: 'Optimum Business',
    parentMsoGroup: 'Altice USA',
    providerType: 'MSO' as const,
    country: 'US',
    regions: ['Northeast', 'Tri-State'],
    websiteUrl: 'https://www.optimum.com/business',
    businessUrl: 'https://www.optimum.com/business',
    priorityRank: 7,
  },
  {
    slug: 'mediacom-business',
    name: 'Mediacom Business',
    displayName: 'Mediacom Business',
    providerType: 'MSO' as const,
    country: 'US',
    regions: ['Midwest', 'Southeast'],
    websiteUrl: 'https://mediacomcable.com/business',
    businessUrl: 'https://mediacomcable.com/business',
    priorityRank: 8,
  },
  {
    slug: 'wow-business',
    name: 'WOW! Business',
    displayName: 'WOW! Business',
    providerType: 'MSO' as const,
    country: 'US',
    regions: ['Midwest', 'Southeast'],
    websiteUrl: 'https://www.wowway.com/business',
    businessUrl: 'https://www.wowway.com/business',
    priorityRank: 9,
  },
];

// ============================================================================
// SMB SEGMENTS
// ============================================================================

const industries = [
  { key: 'retail', group: 'services', label: 'Retail & Restaurants' },
  { key: 'healthcare', group: 'services', label: 'Healthcare & Medical' },
  { key: 'professional_services', group: 'knowledge_worker', label: 'Professional Services' },
  { key: 'construction', group: 'manufacturing', label: 'Construction & Trades' },
  { key: 'real_estate', group: 'services', label: 'Real Estate' },
  { key: 'technology', group: 'knowledge_worker', label: 'Technology & IT' },
  { key: 'manufacturing', group: 'manufacturing', label: 'Manufacturing' },
  { key: 'hospitality', group: 'services', label: 'Hospitality & Travel' },
];

const employeeTiers = [
  { tier: '1-4', label: 'Micro', min: 1, max: 4 },
  { tier: '5-19', label: 'Small', min: 5, max: 19 },
  { tier: '20-99', label: 'Medium', min: 20, max: 99 },
  { tier: '100-499', label: 'Mid-Market', min: 100, max: 499 },
];

const revenueTiers: Record<string, { tier: string; min: number; max: number }> = {
  '1-4': { tier: '<500K', min: 0, max: 500000 },
  '5-19': { tier: '500K-1M', min: 500000, max: 1000000 },
  '20-99': { tier: '1M-5M', min: 1000000, max: 5000000 },
  '100-499': { tier: '5M-25M', min: 5000000, max: 25000000 },
};

interface SegmentDefaults {
  techMaturity: string;
  priceSensitivity: string;
  contractAversion: string;
  supportImportance: string;
}

const segmentDefaults: Record<string, Record<string, SegmentDefaults>> = {
  '1-4': {
    retail: { techMaturity: 'basic', priceSensitivity: 'high', contractAversion: 'high', supportImportance: 'important' },
    healthcare: { techMaturity: 'moderate', priceSensitivity: 'medium', contractAversion: 'medium', supportImportance: 'critical' },
    professional_services: { techMaturity: 'moderate', priceSensitivity: 'medium', contractAversion: 'medium', supportImportance: 'important' },
    construction: { techMaturity: 'basic', priceSensitivity: 'high', contractAversion: 'high', supportImportance: 'low' },
    real_estate: { techMaturity: 'moderate', priceSensitivity: 'medium', contractAversion: 'medium', supportImportance: 'important' },
    technology: { techMaturity: 'advanced', priceSensitivity: 'low', contractAversion: 'high', supportImportance: 'low' },
    manufacturing: { techMaturity: 'basic', priceSensitivity: 'high', contractAversion: 'medium', supportImportance: 'important' },
    hospitality: { techMaturity: 'basic', priceSensitivity: 'high', contractAversion: 'high', supportImportance: 'important' },
  },
  '5-19': {
    retail: { techMaturity: 'basic', priceSensitivity: 'high', contractAversion: 'medium', supportImportance: 'important' },
    healthcare: { techMaturity: 'moderate', priceSensitivity: 'medium', contractAversion: 'low', supportImportance: 'critical' },
    professional_services: { techMaturity: 'moderate', priceSensitivity: 'medium', contractAversion: 'medium', supportImportance: 'important' },
    construction: { techMaturity: 'basic', priceSensitivity: 'high', contractAversion: 'medium', supportImportance: 'important' },
    real_estate: { techMaturity: 'moderate', priceSensitivity: 'medium', contractAversion: 'low', supportImportance: 'important' },
    technology: { techMaturity: 'advanced', priceSensitivity: 'medium', contractAversion: 'high', supportImportance: 'important' },
    manufacturing: { techMaturity: 'moderate', priceSensitivity: 'medium', contractAversion: 'medium', supportImportance: 'important' },
    hospitality: { techMaturity: 'moderate', priceSensitivity: 'high', contractAversion: 'medium', supportImportance: 'critical' },
  },
  '20-99': {
    retail: { techMaturity: 'moderate', priceSensitivity: 'medium', contractAversion: 'low', supportImportance: 'critical' },
    healthcare: { techMaturity: 'advanced', priceSensitivity: 'low', contractAversion: 'low', supportImportance: 'critical' },
    professional_services: { techMaturity: 'advanced', priceSensitivity: 'low', contractAversion: 'low', supportImportance: 'critical' },
    construction: { techMaturity: 'moderate', priceSensitivity: 'medium', contractAversion: 'medium', supportImportance: 'important' },
    real_estate: { techMaturity: 'moderate', priceSensitivity: 'medium', contractAversion: 'low', supportImportance: 'important' },
    technology: { techMaturity: 'advanced', priceSensitivity: 'low', contractAversion: 'medium', supportImportance: 'critical' },
    manufacturing: { techMaturity: 'moderate', priceSensitivity: 'medium', contractAversion: 'low', supportImportance: 'critical' },
    hospitality: { techMaturity: 'moderate', priceSensitivity: 'medium', contractAversion: 'low', supportImportance: 'critical' },
  },
  '100-499': {
    retail: { techMaturity: 'advanced', priceSensitivity: 'medium', contractAversion: 'low', supportImportance: 'critical' },
    healthcare: { techMaturity: 'advanced', priceSensitivity: 'low', contractAversion: 'low', supportImportance: 'critical' },
    professional_services: { techMaturity: 'advanced', priceSensitivity: 'low', contractAversion: 'low', supportImportance: 'critical' },
    construction: { techMaturity: 'moderate', priceSensitivity: 'medium', contractAversion: 'low', supportImportance: 'important' },
    real_estate: { techMaturity: 'advanced', priceSensitivity: 'low', contractAversion: 'low', supportImportance: 'critical' },
    technology: { techMaturity: 'advanced', priceSensitivity: 'low', contractAversion: 'low', supportImportance: 'critical' },
    manufacturing: { techMaturity: 'advanced', priceSensitivity: 'medium', contractAversion: 'low', supportImportance: 'critical' },
    hospitality: { techMaturity: 'advanced', priceSensitivity: 'medium', contractAversion: 'low', supportImportance: 'critical' },
  },
};

// Buyer profile defaults per employee tier
interface BuyerProfileData {
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

const buyerProfilesByTier: Record<string, BuyerProfileData> = {
  '1-4': {
    awarenessChannels: ['google_search', 'word_of_mouth', 'direct_mail', 'local_advertising'],
    considerationFactors: ['price', 'reliability', 'simplicity', 'no_contract'],
    decisionTriggers: ['new_business_setup', 'current_plan_too_expensive', 'poor_service', 'moving_location'],
    painPoints: [
      { issue: 'price_unpredictability', severity: 9 },
      { issue: 'contract_lock_in', severity: 8 },
      { issue: 'poor_customer_support', severity: 8 },
      { issue: 'slow_speeds', severity: 7 },
      { issue: 'hidden_fees', severity: 9 },
    ],
    preferredTerms: ['month_to_month', '1_year'],
    switchingBarriers: ['email_migration', 'downtime_fear', 'setup_hassle'],
    loyaltyDrivers: ['convenience', 'fear_of_change', 'bundled_services'],
    purchaseChannels: ['online', 'phone', 'retail_store'],
    supportExpectations: 'business_hours',
  },
  '5-19': {
    awarenessChannels: ['google_search', 'referral', 'vendor_outreach', 'industry_associations'],
    considerationFactors: ['reliability', 'price', 'speed', 'support_quality', 'scalability'],
    decisionTriggers: ['contract_end', 'business_growth', 'service_outage', 'competitor_offer'],
    painPoints: [
      { issue: 'service_reliability', severity: 9 },
      { issue: 'support_response_time', severity: 8 },
      { issue: 'price_increases', severity: 8 },
      { issue: 'bandwidth_limitations', severity: 7 },
      { issue: 'contract_rigidity', severity: 7 },
    ],
    preferredTerms: ['1_year', 'month_to_month', '2_year'],
    switchingBarriers: ['bundled_services', 'email_migration', 'phone_numbers', 'downtime_risk'],
    loyaltyDrivers: ['relationship_with_rep', 'bundled_discount', 'convenience'],
    purchaseChannels: ['direct_sales_rep', 'online', 'phone'],
    supportExpectations: 'business_hours',
  },
  '20-99': {
    awarenessChannels: ['vendor_outreach', 'industry_events', 'consultant_recommendation', 'peer_referral'],
    considerationFactors: ['reliability', 'sla_guarantees', 'scalability', 'support_quality', 'total_cost'],
    decisionTriggers: ['contract_renewal', 'office_expansion', 'digital_transformation', 'merger_acquisition'],
    painPoints: [
      { issue: 'sla_compliance', severity: 9 },
      { issue: 'scalability_limitations', severity: 8 },
      { issue: 'multi_location_management', severity: 8 },
      { issue: 'security_concerns', severity: 8 },
      { issue: 'vendor_responsiveness', severity: 7 },
    ],
    preferredTerms: ['2_year', '3_year', '1_year'],
    switchingBarriers: ['complex_infrastructure', 'multi_location_coordination', 'staff_retraining', 'vendor_integrations'],
    loyaltyDrivers: ['account_management', 'sla_performance', 'bundled_value', 'integration_depth'],
    purchaseChannels: ['direct_sales_rep', 'channel_partner', 'consultant'],
    supportExpectations: '24x7',
  },
  '100-499': {
    awarenessChannels: ['direct_sales', 'rfp_process', 'industry_analyst_reports', 'consultant_recommendation'],
    considerationFactors: ['sla_guarantees', 'enterprise_features', 'scalability', 'security', 'total_cost_of_ownership'],
    decisionTriggers: ['contract_expiry', 'digital_transformation', 'cost_optimization', 'compliance_requirements'],
    painPoints: [
      { issue: 'enterprise_grade_reliability', severity: 10 },
      { issue: 'security_and_compliance', severity: 9 },
      { issue: 'multi_site_management', severity: 9 },
      { issue: 'vendor_lock_in', severity: 8 },
      { issue: 'total_cost_opacity', severity: 8 },
    ],
    preferredTerms: ['3_year', '2_year'],
    switchingBarriers: ['infrastructure_complexity', 'business_continuity_risk', 'contract_penalties', 'vendor_dependencies'],
    loyaltyDrivers: ['dedicated_account_team', 'custom_solutions', 'proven_reliability', 'strategic_partnership'],
    purchaseChannels: ['direct_enterprise_sales', 'channel_partner', 'rfp_process'],
    supportExpectations: '24x7',
  },
};

async function main() {
  console.log('Seeding database...');
  
  for (const provider of providers) {
    await prisma.provider.upsert({
      where: { slug: provider.slug },
      update: provider,
      create: provider,
    });
    console.log(`  Created/updated provider: ${provider.displayName}`);
  }

  // Seed SMB segments and buyer profiles
  console.log('\nSeeding SMB segments and buyer profiles...');
  
  for (const empTier of employeeTiers) {
    for (const industry of industries) {
      const code = `${empTier.label.toUpperCase()}_${industry.key.toUpperCase()}`;
      const name = `${empTier.label} ${industry.label} (${empTier.tier} employees)`;
      const rev = revenueTiers[empTier.tier];
      const defaults = segmentDefaults[empTier.tier]?.[industry.key] || {
        techMaturity: 'moderate',
        priceSensitivity: 'medium',
        contractAversion: 'medium',
        supportImportance: 'important',
      };
      const buyerData = buyerProfilesByTier[empTier.tier];

      const segment = await prisma.sMBSegment.upsert({
        where: { code },
        update: {
          name,
          employeeMin: empTier.min,
          employeeMax: empTier.max,
          employeeTier: empTier.tier,
          revenueMin: rev.min,
          revenueMax: rev.max,
          revenueTier: rev.tier,
          industry: industry.key,
          industryGroup: industry.group,
          techMaturity: defaults.techMaturity,
          priceSensitivity: defaults.priceSensitivity,
          contractAversion: defaults.contractAversion,
          supportImportance: defaults.supportImportance,
        },
        create: {
          code,
          name,
          employeeMin: empTier.min,
          employeeMax: empTier.max,
          employeeTier: empTier.tier,
          revenueMin: rev.min,
          revenueMax: rev.max,
          revenueTier: rev.tier,
          industry: industry.key,
          industryGroup: industry.group,
          techMaturity: defaults.techMaturity,
          priceSensitivity: defaults.priceSensitivity,
          contractAversion: defaults.contractAversion,
          supportImportance: defaults.supportImportance,
        },
      });

      // Upsert buyer profile
      if (buyerData) {
        await prisma.buyerProfile.upsert({
          where: { segmentId: segment.id },
          update: {
            awarenessChannels: buyerData.awarenessChannels,
            considerationFactors: buyerData.considerationFactors,
            decisionTriggers: buyerData.decisionTriggers,
            painPoints: buyerData.painPoints as unknown as Prisma.InputJsonValue,
            preferredTerms: buyerData.preferredTerms,
            switchingBarriers: buyerData.switchingBarriers,
            loyaltyDrivers: buyerData.loyaltyDrivers,
            purchaseChannels: buyerData.purchaseChannels,
            supportExpectations: buyerData.supportExpectations,
          },
          create: {
            segmentId: segment.id,
            awarenessChannels: buyerData.awarenessChannels,
            considerationFactors: buyerData.considerationFactors,
            decisionTriggers: buyerData.decisionTriggers,
            painPoints: buyerData.painPoints as unknown as Prisma.InputJsonValue,
            preferredTerms: buyerData.preferredTerms,
            switchingBarriers: buyerData.switchingBarriers,
            loyaltyDrivers: buyerData.loyaltyDrivers,
            purchaseChannels: buyerData.purchaseChannels,
            supportExpectations: buyerData.supportExpectations,
          },
        });
      }
    }
    console.log(`  Created segments for ${empTier.label} (${empTier.tier}) tier`);
  }
  
  // =========================================================================
  // Seed Packages for providers
  // =========================================================================
  console.log('\nSeeding provider packages...');

  // Build a slug -> id map
  const allProviders = await prisma.provider.findMany({ select: { id: true, slug: true } });
  const providerMap = new Map(allProviders.map(p => [p.slug, p.id]));

  // Also build an offer lookup (provider slug + offer name -> offer id) for linking
  const allOffers = await prisma.offer.findMany({
    select: { id: true, name: true, providerId: true, displayName: true },
  });
  // key: providerId:offerName
  const offerMap = new Map(allOffers.map(o => [`${o.providerId}:${o.name}`, o.id]));

  interface PackageSeed {
    providerSlug: string;
    name: string;
    displayName: string;
    description: string;
    packageType: 'TIERED' | 'CONFIGURABLE' | 'FIXED';
    tier?: string;
    basePrice: number;
    targetSegments: string[];
    sourceUrl?: string;
    includedOfferNames: string[];   // names from the offer seed data
    addOns: { name: string; displayName: string; price?: number; description?: string }[];
  }

  const packages: PackageSeed[] = [
    // ===================== COMCAST BUSINESS =====================
    {
      providerSlug: 'comcast-business',
      name: 'comcast-internet-voice-starter',
      displayName: 'Internet + Voice Starter',
      description: 'Essential connectivity and phone service for new and micro businesses. Combines reliable internet with a cloud-based phone line.',
      packageType: 'TIERED',
      tier: 'Good',
      basePrice: 89.99,
      targetSegments: ['MICRO_RETAIL', 'MICRO_CONSTRUCTION', 'MICRO_HOSPITALITY'],
      sourceUrl: 'https://business.comcast.com/learn/bundles',
      includedOfferNames: ['business-internet-starter', 'business-voiceedge-starter'],
      addOns: [
        { name: 'static-ip', displayName: 'Static IP Address', price: 14.95, description: 'Dedicated static IP for remote access' },
        { name: 'wifi-pro', displayName: 'Business WiFi Pro', price: 9.95, description: 'Managed guest WiFi hotspot' },
      ],
    },
    {
      providerSlug: 'comcast-business',
      name: 'comcast-internet-voice-plus',
      displayName: 'Internet + Voice Plus',
      description: 'Faster speeds and an advanced phone system with multi-line support. Ideal for growing small businesses with 5-20 employees.',
      packageType: 'TIERED',
      tier: 'Better',
      basePrice: 139.99,
      targetSegments: ['SMALL_RETAIL', 'SMALL_PROFESSIONAL_SERVICES', 'SMALL_HEALTHCARE'],
      sourceUrl: 'https://business.comcast.com/learn/bundles',
      includedOfferNames: ['business-internet-essential', 'business-voiceedge-select'],
      addOns: [
        { name: 'security-edge', displayName: 'SecurityEdge', price: 19.95, description: 'Network-level threat protection' },
        { name: 'connection-pro', displayName: 'Connection Pro', price: 29.95, description: 'Automatic 4G LTE backup' },
        { name: 'wifi-pro', displayName: 'Business WiFi Pro', price: 9.95, description: 'Managed guest WiFi hotspot' },
      ],
    },
    {
      providerSlug: 'comcast-business',
      name: 'comcast-complete-business',
      displayName: 'Complete Business Package',
      description: 'High-speed internet, full-featured phone, and mobile lines bundled together. Best value for established small businesses needing everything.',
      packageType: 'TIERED',
      tier: 'Best',
      basePrice: 199.99,
      targetSegments: ['SMALL_TECHNOLOGY', 'MEDIUM_PROFESSIONAL_SERVICES', 'MEDIUM_HEALTHCARE'],
      sourceUrl: 'https://business.comcast.com/learn/bundles',
      includedOfferNames: ['business-internet-standard', 'business-voiceedge-select', 'comcast-business-mobile-unlimited'],
      addOns: [
        { name: 'security-edge', displayName: 'SecurityEdge', price: 19.95, description: 'Network-level threat protection' },
        { name: 'connection-pro', displayName: 'Connection Pro', price: 29.95, description: 'Automatic 4G LTE backup' },
        { name: 'sd-wan', displayName: 'SD-WAN', price: 49.95, description: 'Software-defined WAN for multi-site' },
        { name: 'additional-mobile', displayName: 'Additional Mobile Lines', price: 25.00, description: 'Per-line for additional mobile' },
      ],
    },
    {
      providerSlug: 'comcast-business',
      name: 'comcast-enterprise-connect',
      displayName: 'Enterprise Connect Package',
      description: 'Premium package with gigabit internet, advanced voice, mobile fleet, and priority SLA. Designed for mid-market businesses with 50+ employees.',
      packageType: 'TIERED',
      tier: 'Best',
      basePrice: 399.99,
      targetSegments: ['MEDIUM_TECHNOLOGY', 'MID-MARKET_PROFESSIONAL_SERVICES', 'MID-MARKET_HEALTHCARE'],
      sourceUrl: 'https://business.comcast.com/learn/bundles',
      includedOfferNames: ['business-internet-gigabit', 'business-voiceedge-select', 'comcast-business-mobile-unlimited'],
      addOns: [
        { name: 'managed-router', displayName: 'Managed Router', price: 39.95, description: 'Fully managed enterprise router' },
        { name: 'sd-wan-plus', displayName: 'SD-WAN Plus', price: 79.95, description: 'Advanced SD-WAN with analytics' },
        { name: 'dedicated-account-mgr', displayName: 'Dedicated Account Manager', price: 0, description: 'Included at this tier' },
      ],
    },

    // ===================== AT&T BUSINESS =====================
    {
      providerSlug: 'att-business',
      name: 'att-business-fiber-starter-bundle',
      displayName: 'AT&T Fiber + Phone Starter',
      description: 'AT&T Business Fiber internet paired with a single business phone line. Symmetric speeds for video conferencing and cloud apps.',
      packageType: 'TIERED',
      tier: 'Good',
      basePrice: 99.99,
      targetSegments: ['MICRO_PROFESSIONAL_SERVICES', 'MICRO_REAL_ESTATE', 'SMALL_RETAIL'],
      sourceUrl: 'https://www.business.att.com/products/bundles.html',
      includedOfferNames: [],
      addOns: [
        { name: 'att-cybersecurity', displayName: 'AT&T Cybersecurity', price: 24.99, description: 'Endpoint & network security' },
        { name: 'att-collaborate', displayName: 'AT&T Collaborate', price: 34.95, description: 'Unified communications platform' },
      ],
    },
    {
      providerSlug: 'att-business',
      name: 'att-business-complete-bundle',
      displayName: 'AT&T Business Complete',
      description: 'High-speed fiber, multi-line voice, and FirstNet mobile. Comprehensive connectivity for small-to-mid businesses.',
      packageType: 'TIERED',
      tier: 'Better',
      basePrice: 179.99,
      targetSegments: ['SMALL_HEALTHCARE', 'SMALL_CONSTRUCTION', 'MEDIUM_RETAIL'],
      sourceUrl: 'https://www.business.att.com/products/bundles.html',
      includedOfferNames: [],
      addOns: [
        { name: 'att-cybersecurity', displayName: 'AT&T Cybersecurity', price: 24.99, description: 'Endpoint & network security' },
        { name: 'att-sd-wan', displayName: 'AT&T SD-WAN', price: 59.95, description: 'Managed SD-WAN with analytics' },
        { name: 'att-dedicated-internet', displayName: 'Dedicated Internet', price: 199.99, description: 'Upgrade to dedicated fiber' },
      ],
    },
    {
      providerSlug: 'att-business',
      name: 'att-business-elite-bundle',
      displayName: 'AT&T Business Elite',
      description: 'Premium gigabit fiber, advanced unified communications, fleet mobile management, and enhanced security. For growing mid-market companies.',
      packageType: 'TIERED',
      tier: 'Best',
      basePrice: 349.99,
      targetSegments: ['MEDIUM_TECHNOLOGY', 'MEDIUM_PROFESSIONAL_SERVICES', 'MID-MARKET_HEALTHCARE'],
      sourceUrl: 'https://www.business.att.com/products/bundles.html',
      includedOfferNames: [],
      addOns: [
        { name: 'att-managed-security', displayName: 'AT&T Managed Security', price: 99.99, description: 'Full managed security service' },
        { name: 'att-multi-site', displayName: 'Multi-Site Networking', price: 149.99, description: 'MPLS/SD-WAN for multiple locations' },
      ],
    },

    // ===================== VERIZON BUSINESS =====================
    {
      providerSlug: 'verizon-business',
      name: 'verizon-business-internet-voice',
      displayName: 'Verizon One Talk + Fios',
      description: 'Verizon Fios Business Internet combined with One Talk cloud phone system. Symmetric fiber speeds and seamless mobile integration.',
      packageType: 'TIERED',
      tier: 'Good',
      basePrice: 109.99,
      targetSegments: ['MICRO_PROFESSIONAL_SERVICES', 'SMALL_REAL_ESTATE', 'SMALL_TECHNOLOGY'],
      sourceUrl: 'https://www.verizon.com/business/bundles/',
      includedOfferNames: [],
      addOns: [
        { name: 'vz-backup-internet', displayName: '4G LTE Backup', price: 19.99, description: 'Automatic failover to LTE' },
        { name: 'vz-wifi6', displayName: 'WiFi 6 Router', price: 10.00, description: 'Enterprise WiFi 6 access point' },
      ],
    },
    {
      providerSlug: 'verizon-business',
      name: 'verizon-business-complete',
      displayName: 'Verizon Business Complete',
      description: 'Fios gigabit, One Talk with 5+ lines, and Business Unlimited mobile plans. Full-stack communications for mid-size operations.',
      packageType: 'TIERED',
      tier: 'Better',
      basePrice: 199.99,
      targetSegments: ['SMALL_HEALTHCARE', 'MEDIUM_PROFESSIONAL_SERVICES', 'MEDIUM_RETAIL'],
      sourceUrl: 'https://www.verizon.com/business/bundles/',
      includedOfferNames: [],
      addOns: [
        { name: 'vz-sd-wan', displayName: 'Verizon SD-WAN', price: 69.95, description: 'Managed SD-WAN solution' },
        { name: 'vz-security', displayName: 'Verizon Business Security', price: 29.99, description: 'Endpoint protection & DNS filtering' },
        { name: 'vz-fleet-mobile', displayName: 'Fleet Mobile Management', price: 5.00, description: 'Per-device MDM' },
      ],
    },
    {
      providerSlug: 'verizon-business',
      name: 'verizon-business-premium',
      displayName: 'Verizon Business Premium',
      description: 'Premium gigabit fiber, enterprise voice with 20+ seats, unlimited mobile fleet, and dedicated account team.',
      packageType: 'TIERED',
      tier: 'Best',
      basePrice: 449.99,
      targetSegments: ['MEDIUM_TECHNOLOGY', 'MID-MARKET_PROFESSIONAL_SERVICES', 'MID-MARKET_MANUFACTURING'],
      sourceUrl: 'https://www.verizon.com/business/bundles/',
      includedOfferNames: [],
      addOns: [
        { name: 'vz-private-network', displayName: 'Private 5G Network', price: 299.99, description: 'On-premises private 5G' },
        { name: 'vz-managed-services', displayName: 'Fully Managed IT', price: 199.99, description: 'Managed network & security' },
      ],
    },

    // ===================== T-MOBILE BUSINESS =====================
    {
      providerSlug: 'tmobile-business',
      name: 'tmobile-internet-mobile-starter',
      displayName: 'T-Mobile Business Internet + Mobile',
      description: '5G business internet paired with unlimited mobile lines. No annual contracts, no hidden fees. Simple and transparent.',
      packageType: 'FIXED',
      tier: 'Good',
      basePrice: 79.99,
      targetSegments: ['MICRO_RETAIL', 'MICRO_CONSTRUCTION', 'MICRO_HOSPITALITY', 'SMALL_RETAIL'],
      sourceUrl: 'https://www.t-mobile.com/business/internet',
      includedOfferNames: [],
      addOns: [
        { name: 'tm-additional-lines', displayName: 'Additional Mobile Lines', price: 25.00, description: 'Per additional line' },
        { name: 'tm-scam-shield', displayName: 'Scam Shield Premium', price: 4.00, description: 'Advanced call screening per line' },
      ],
    },
    {
      providerSlug: 'tmobile-business',
      name: 'tmobile-business-ultimate',
      displayName: 'T-Mobile Business Ultimate',
      description: 'Premium 5G internet with backup, unlimited premium mobile lines with max speed data, and international features.',
      packageType: 'FIXED',
      tier: 'Best',
      basePrice: 149.99,
      targetSegments: ['SMALL_TECHNOLOGY', 'SMALL_PROFESSIONAL_SERVICES', 'MEDIUM_RETAIL'],
      sourceUrl: 'https://www.t-mobile.com/business/internet',
      includedOfferNames: [],
      addOns: [
        { name: 'tm-tablet-lines', displayName: 'Tablet/Hotspot Lines', price: 20.00, description: 'Per tablet or hotspot device' },
        { name: 'tm-global-plus', displayName: 'Global Plus', price: 15.00, description: 'High-speed international data' },
      ],
    },

    // ===================== SPECTRUM BUSINESS =====================
    {
      providerSlug: 'spectrum-business',
      name: 'spectrum-internet-voice-bundle',
      displayName: 'Spectrum Internet + Voice',
      description: 'No-contract internet and phone bundle with free modem and no data caps. Simple pricing for cost-conscious SMBs.',
      packageType: 'TIERED',
      tier: 'Good',
      basePrice: 84.98,
      targetSegments: ['MICRO_RETAIL', 'MICRO_CONSTRUCTION', 'SMALL_HOSPITALITY'],
      sourceUrl: 'https://business.spectrum.com/internet-and-phone',
      includedOfferNames: [],
      addOns: [
        { name: 'spec-wifi', displayName: 'Business WiFi', price: 4.99, description: 'Managed WiFi access point' },
        { name: 'spec-static-ip', displayName: 'Static IP', price: 14.99, description: 'Static IP address' },
      ],
    },
    {
      providerSlug: 'spectrum-business',
      name: 'spectrum-complete-bundle',
      displayName: 'Spectrum Business Complete',
      description: 'Gig internet, multi-line voice, and mobile service bundled together. No annual contracts, no hidden fees.',
      packageType: 'TIERED',
      tier: 'Best',
      basePrice: 164.97,
      targetSegments: ['SMALL_TECHNOLOGY', 'SMALL_PROFESSIONAL_SERVICES', 'MEDIUM_RETAIL'],
      sourceUrl: 'https://business.spectrum.com/internet-and-phone',
      includedOfferNames: [],
      addOns: [
        { name: 'spec-security-suite', displayName: 'Security Suite', price: 19.99, description: 'Firewall & endpoint protection' },
        { name: 'spec-managed-wifi', displayName: 'Managed WiFi Pro', price: 14.99, description: 'Enterprise-managed WiFi with analytics' },
      ],
    },

    // ===================== COX BUSINESS =====================
    {
      providerSlug: 'cox-business',
      name: 'cox-internet-voice-starter',
      displayName: 'Cox Business Starter Bundle',
      description: 'Reliable internet and a business phone line at an affordable price. Great for home offices and micro businesses.',
      packageType: 'TIERED',
      tier: 'Good',
      basePrice: 84.99,
      targetSegments: ['MICRO_RETAIL', 'MICRO_REAL_ESTATE', 'MICRO_PROFESSIONAL_SERVICES'],
      sourceUrl: 'https://www.cox.com/business/internet-phone-bundles.html',
      includedOfferNames: [],
      addOns: [
        { name: 'cox-security', displayName: 'Cox Business Security', price: 24.99, description: 'Surveillance & alarm system' },
      ],
    },
    {
      providerSlug: 'cox-business',
      name: 'cox-complete-solution',
      displayName: 'Cox Business Complete Solution',
      description: 'High-speed internet, advanced voice with multiple lines, and business security — all bundled with a dedicated rep.',
      packageType: 'TIERED',
      tier: 'Best',
      basePrice: 169.99,
      targetSegments: ['SMALL_HEALTHCARE', 'SMALL_RETAIL', 'MEDIUM_HOSPITALITY'],
      sourceUrl: 'https://www.cox.com/business/internet-phone-bundles.html',
      includedOfferNames: [],
      addOns: [
        { name: 'cox-cloud-backup', displayName: 'Cloud Backup', price: 14.99, description: 'Automatic offsite data backup' },
        { name: 'cox-sd-wan', displayName: 'Cox SD-WAN', price: 49.99, description: 'Software-defined WAN' },
        { name: 'cox-security-premium', displayName: 'Security Premium', price: 44.99, description: 'Video surveillance + alarm + access control' },
      ],
    },
  ];

  for (const pkg of packages) {
    const providerId = providerMap.get(pkg.providerSlug);
    if (!providerId) {
      console.log(`  Skipping package ${pkg.displayName} — provider ${pkg.providerSlug} not found`);
      continue;
    }

    // Upsert the package
    const existing = await prisma.package.findFirst({
      where: { providerId, name: pkg.name },
    });

    const packageData = {
      providerId,
      name: pkg.name,
      displayName: pkg.displayName,
      description: pkg.description,
      packageType: pkg.packageType,
      tier: pkg.tier,
      basePrice: pkg.basePrice,
      targetSegments: pkg.targetSegments,
      sourceUrl: pkg.sourceUrl,
    };

    let createdPkg;
    if (existing) {
      createdPkg = await prisma.package.update({
        where: { id: existing.id },
        data: packageData,
      });
    } else {
      createdPkg = await prisma.package.create({ data: packageData });
    }

    // Link included offers (if they exist)
    for (const offerName of pkg.includedOfferNames) {
      const offerId = offerMap.get(`${providerId}:${offerName}`);
      if (offerId) {
        await prisma.packageOffer.upsert({
          where: { packageId_offerId: { packageId: createdPkg.id, offerId } },
          update: { isBase: true },
          create: { packageId: createdPkg.id, offerId, isBase: true },
        });
      }
    }

    // Upsert add-ons
    for (const addOn of pkg.addOns) {
      const existingAddOn = await prisma.packageAddOn.findFirst({
        where: { packageId: createdPkg.id, name: addOn.name },
      });
      if (existingAddOn) {
        await prisma.packageAddOn.update({
          where: { id: existingAddOn.id },
          data: { displayName: addOn.displayName, price: addOn.price, description: addOn.description },
        });
      } else {
        await prisma.packageAddOn.create({
          data: {
            packageId: createdPkg.id,
            name: addOn.name,
            displayName: addOn.displayName,
            price: addOn.price,
            description: addOn.description,
          },
        });
      }
    }

    console.log(`  Created/updated package: ${pkg.displayName} (${pkg.providerSlug})`);
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
