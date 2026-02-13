import { db } from '@/lib/db';
import { JobStatus, OfferCategory, PackageType } from '@prisma/client';
import { getCollectorForProvider } from './registry';
import { createContentHash, CollectedOffer, CollectedDeviceIncentive, CollectedContractBuyout } from './base';
import { getLLMConfig } from '@/src/llm/helpers';
import { closeBrowser } from './browser-manager';

export interface RefreshJobParams {
  userId: string;
  providerIds: string[];
  categories: OfferCategory[];
}

export async function createRefreshJob(params: RefreshJobParams): Promise<string> {
  const job = await db.refreshJob.create({
    data: {
      userId: params.userId,
      providerIds: params.providerIds,
      categories: params.categories,
      status: 'PENDING',
      progress: 0,
    },
  });
  
  return job.id;
}

/**
 * When a PACKAGE category offer is collected, also create/update the Package record
 * along with its PackageOffer links and PackageAddOn records.
 */
async function syncPackageRecord(providerId: string, offer: CollectedOffer, savedOfferId: string): Promise<void> {
  if (offer.category !== 'PACKAGE') return;

  // Determine PackageType and tier from features
  const packageTypeStr = offer.features?.package_type || 'FIXED';
  const packageType: PackageType = (['TIERED', 'CONFIGURABLE', 'FIXED'].includes(packageTypeStr)
    ? packageTypeStr as PackageType
    : 'FIXED');
  const tier = offer.features?.tier || null;

  // Determine target segments from tier
  const targetSegments: string[] = [];
  if (tier === 'Starter' || tier === 'Value') {
    targetSegments.push('MICRO_RETAIL', 'MICRO_SERVICES', 'SOHO_FREELANCE');
  } else if (tier === 'Standard' || tier === 'Remote') {
    targetSegments.push('SMALL_PROFESSIONAL', 'SMALL_RETAIL', 'SMALL_HEALTHCARE');
  } else if (tier === 'Premium' || tier === 'Complete' || tier === 'Ultimate' || tier === 'Advanced') {
    targetSegments.push('MID_PROFESSIONAL', 'MID_TECH', 'MID_HEALTHCARE');
  }

  // Upsert Package
  const existingPackage = await db.package.findFirst({
    where: { providerId, name: offer.name },
  });

  let packageRecord;
  const packageData = {
    providerId,
    name: offer.name,
    displayName: offer.displayName,
    description: offer.description || null,
    packageType,
    tier,
    basePrice: offer.priceMonthly ?? null,
    targetSegments,
    isActive: true,
    sourceUrl: offer.sourceUrl,
  };

  if (existingPackage) {
    packageRecord = await db.package.update({
      where: { id: existingPackage.id },
      data: packageData,
    });
    // Clear old PackageOffer links and addOns for re-creation
    await db.packageOffer.deleteMany({ where: { packageId: packageRecord.id } });
    await db.packageAddOn.deleteMany({ where: { packageId: packageRecord.id } });
  } else {
    packageRecord = await db.package.create({ data: packageData });
  }

  // Link bundled offers by matching displayName to existing Offer records
  if (offer.bundleOptions && offer.bundleOptions.length > 0) {
    for (const bundledOfferName of offer.bundleOptions) {
      const matchingOffer = await db.offer.findFirst({
        where: {
          providerId,
          displayName: bundledOfferName,
          isActive: true,
        },
      });
      if (matchingOffer) {
        await db.packageOffer.create({
          data: {
            packageId: packageRecord.id,
            offerId: matchingOffer.id,
            isBase: true,
          },
        });
      }
    }
  }

  // Also link the PACKAGE offer record itself
  await db.packageOffer.create({
    data: {
      packageId: packageRecord.id,
      offerId: savedOfferId,
      isBase: true,
    },
  }).catch(() => {
    // Ignore duplicate if it matches an already-linked offer
  });

  // Create addOns from features that look like add-ons
  const addOnFeatures: { name: string; displayName: string; description: string }[] = [];
  if (offer.features?.static_ip === 'optional') {
    addOnFeatures.push({
      name: 'static-ip',
      displayName: 'Static IP Address',
      description: 'Dedicated static IP for hosting and remote access',
    });
  }
  if (offer.features?.mobile_lines) {
    const lines = parseInt(offer.features.mobile_lines, 10);
    if (lines > 0) {
      addOnFeatures.push({
        name: 'additional-mobile-lines',
        displayName: 'Additional Mobile Lines',
        description: `Add more mobile lines (base includes ${lines})`,
      });
    }
  }
  if (offer.features?.sla) {
    addOnFeatures.push({
      name: 'sla-upgrade',
      displayName: 'SLA Upgrade',
      description: `Current SLA: ${offer.features.sla}. Upgrade available.`,
    });
  }

  for (const addOn of addOnFeatures) {
    await db.packageAddOn.create({
      data: {
        packageId: packageRecord.id,
        name: addOn.name,
        displayName: addOn.displayName,
        description: addOn.description,
      },
    });
  }
}

/**
 * Sync device incentives from a collection result to the database.
 * Deactivates old incentives for the provider, then creates new ones.
 */
async function syncDeviceIncentives(
  providerId: string,
  incentives: CollectedDeviceIncentive[]
): Promise<number> {
  // Deactivate existing incentives for this provider
  await db.deviceIncentive.updateMany({
    where: { providerId },
    data: { isActive: false },
  });

  let count = 0;
  for (const inc of incentives) {
    await db.deviceIncentive.create({
      data: {
        providerId,
        deviceName: inc.deviceName,
        deviceBrand: inc.deviceBrand,
        deviceModel: inc.deviceModel,
        incentiveType: inc.incentiveType,
        incentiveValue: inc.incentiveValue,
        deviceRetailPrice: inc.deviceRetailPrice,
        monthlyCredit: inc.monthlyCredit,
        creditMonths: inc.creditMonths,
        conditions: inc.conditions,
        requiresTradeIn: inc.requiresTradeIn || false,
        requiresNewLine: inc.requiresNewLine || false,
        requiresPortIn: inc.requiresPortIn || false,
        minPlanTier: inc.minPlanTier,
        isActive: true,
        sourceUrl: inc.sourceUrl,
      },
    });
    count++;
  }
  return count;
}

/**
 * Sync contract buyout from a collection result to the database.
 * Deactivates old buyouts for the provider, then creates a new one.
 */
async function syncContractBuyout(
  providerId: string,
  buyout: CollectedContractBuyout
): Promise<void> {
  // Deactivate existing buyouts for this provider
  await db.contractBuyout.updateMany({
    where: { providerId },
    data: { isActive: false },
  });

  await db.contractBuyout.create({
    data: {
      providerId,
      maxBuyoutAmount: buyout.maxAmount,
      perLineMax: buyout.perLineMax,
      buyoutMethod: buyout.method || 'BILL_CREDIT',
      conditions: buyout.conditions,
      requiresPortIn: buyout.requiresPortIn ?? true,
      requiresTradeIn: buyout.requiresTradeIn ?? false,
      minLinesRequired: buyout.minLinesRequired,
      eligibleFromProviders: buyout.eligibleFromProviders || ['any'],
      // T&C detail fields
      coverageScope: buyout.coverageScope,
      submissionDeadline: buyout.submissionDeadline,
      paymentTimeline: buyout.paymentTimeline,
      proofRequired: buyout.proofRequired,
      maxLinesEligible: buyout.maxLinesEligible,
      excludedPlans: buyout.excludedPlans,
      finePrint: buyout.finePrint,
      stackableWithDeals: buyout.stackableWithDeals ?? true,
      isActive: true,
      sourceUrl: buyout.sourceUrl,
    },
  });
}

export async function runRefreshJob(jobId: string): Promise<void> {
  const job = await db.refreshJob.findUnique({
    where: { id: jobId },
  });
  
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }
  
  // Mark as running
  await db.refreshJob.update({
    where: { id: jobId },
    data: {
      status: 'RUNNING',
      startedAt: new Date(),
      message: 'Starting refresh...',
    },
  });
  
  try {
    const providers = await db.provider.findMany({
      where: {
        id: { in: job.providerIds },
        isActive: true,
      },
    });

    // Get the user's LLM config so collectors can use it for live scraping
    const llmConfig = await getLLMConfig(job.userId);
    if (llmConfig) {
      console.log(`[refresh] LLM config available — collectors will attempt live scraping`);
    } else {
      console.log(`[refresh] No LLM config — collectors will use seed data only`);
    }
    
    const totalProviders = providers.length;
    let completedProviders = 0;
    const results: Record<string, { success: boolean; offers: number; error?: string; scraped?: boolean }> = {};
    
    for (const provider of providers) {
      await db.refreshJob.update({
        where: { id: jobId },
        data: {
          message: `${llmConfig ? 'Scraping' : 'Processing'} ${provider.displayName}...`,
          progress: Math.floor((completedProviders / totalProviders) * 100),
        },
      });
      
      const collector = getCollectorForProvider(provider.slug);
      
      if (!collector) {
        results[provider.slug] = {
          success: false,
          offers: 0,
          error: 'No collector available for this provider',
        };
        completedProviders++;
        continue;
      }
      
      try {
        const collectionResults = await collector.collect({
          providerId: provider.id,
          providerSlug: provider.slug,
          categories: job.categories,
          llmConfig,
        });
        
        let totalOffers = 0;
        
        for (const result of collectionResults) {
          if (!result.success) {
            continue;
          }
          
          // Create source snapshot
          const contentHash = createContentHash(result.rawContent);
          
          const snapshot = await db.sourceSnapshot.create({
            data: {
              providerId: provider.id,
              url: result.sourceUrl,
              rawContent: result.rawContent,
              contentHash,
              parserVersion: '1.0',
            },
          });
          
          // Process offers
          for (const offer of result.offers) {
            // Upsert offer
            const existingOffer = await db.offer.findFirst({
              where: {
                providerId: provider.id,
                name: offer.name,
                category: offer.category,
              },
            });
            
            const offerData = {
              providerId: provider.id,
              category: offer.category,
              name: offer.name,
              displayName: offer.displayName,
              description: offer.description,
              priceMonthly: offer.priceMonthly,
              priceSetup: offer.priceSetup,
              pricePromo: offer.pricePromo,
              promoTermMonths: offer.promoTermMonths,
              contractMonths: offer.contractMonths,
              downloadMbps: offer.downloadMbps,
              uploadMbps: offer.uploadMbps,
              dataAllowanceGb: offer.dataAllowanceGb,
              unlimitedData: offer.unlimitedData || false,
              slaDetails: offer.slaDetails,
              eligibilityNotes: offer.eligibilityNotes,
              bundleOptions: offer.bundleOptions || [],
              sourceUrl: offer.sourceUrl,
              lastSeenAt: new Date(),
              isActive: true,
            };
            
            let savedOffer;
            if (existingOffer) {
              savedOffer = await db.offer.update({
                where: { id: existingOffer.id },
                data: offerData,
              });
            } else {
              savedOffer = await db.offer.create({
                data: offerData,
              });
            }
            
            // Create observation
            await db.offerObservation.create({
              data: {
                offerId: savedOffer.id,
                snapshotId: snapshot.id,
                priceMonthly: offer.priceMonthly,
                pricePromo: offer.pricePromo,
              },
            });
            
            // Handle features
            if (offer.features) {
              for (const [key, value] of Object.entries(offer.features)) {
                await db.offerFeature.upsert({
                  where: {
                    offerId_featureKey: {
                      offerId: savedOffer.id,
                      featureKey: key,
                    },
                  },
                  update: { featureValue: String(value) },
                  create: {
                    offerId: savedOffer.id,
                    featureKey: key,
                    featureValue: String(value),
                  },
                });
              }
            }

            // If this is a PACKAGE offer, also sync the Package record
            if (offer.category === 'PACKAGE') {
              try {
                await syncPackageRecord(provider.id, offer, savedOffer.id);
              } catch (pkgError) {
                console.warn(`Warning: Failed to sync Package record for ${offer.name}:`, pkgError);
              }
            }
            
            totalOffers++;
          }

          // Sync device incentives and contract buyout if present
          if (result.deviceIncentives && result.deviceIncentives.length > 0) {
            try {
              const deviceCount = await syncDeviceIncentives(provider.id, result.deviceIncentives);
              console.log(`[refresh] Synced ${deviceCount} device incentives for ${provider.slug}`);
            } catch (devError) {
              console.warn(`Warning: Failed to sync device incentives for ${provider.slug}:`, devError);
            }
          }
          if (result.contractBuyout) {
            try {
              await syncContractBuyout(provider.id, result.contractBuyout);
              console.log(`[refresh] Synced contract buyout for ${provider.slug}`);
            } catch (buyError) {
              console.warn(`Warning: Failed to sync contract buyout for ${provider.slug}:`, buyError);
            }
          }
        }
        
        // Check if any results came from live scraping
        const anyScraped = collectionResults.some(r => r.scraped === true);
        results[provider.slug] = {
          success: true,
          offers: totalOffers,
          scraped: anyScraped,
        };
      } catch (error) {
        results[provider.slug] = {
          success: false,
          offers: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
      
      completedProviders++;
    }
    
    // Mark as completed
    await db.refreshJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        progress: 100,
        completedAt: new Date(),
        message: Object.values(results).some(r => r.scraped)
          ? 'Live scrape completed — real provider data collected'
          : llmConfig
            ? 'Refresh completed — some providers may have used seed data as fallback'
            : 'Refresh completed with seed data (configure LLM API key to enable live scraping)',
        result: results,
      },
    });
  } catch (error) {
    // Mark as failed
    await db.refreshJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  } finally {
    // Always close the shared browser instance after the job finishes
    await closeBrowser().catch(err => {
      console.warn('[refresh] Failed to close browser:', err);
    });
  }
}

export async function getJobStatus(jobId: string) {
  return db.refreshJob.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      status: true,
      progress: true,
      message: true,
      result: true,
      startedAt: true,
      completedAt: true,
      createdAt: true,
    },
  });
}
