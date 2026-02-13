/**
 * One-time migration: copy the most recent UserLLMSettings and User.focusProviderId
 * into the new shared AppSettings table.
 *
 * Safe to run multiple times — it's a no-op if AppSettings already has an API key.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('[migrate] Checking if AppSettings needs to be populated...');

  const existing = await prisma.appSettings.findUnique({ where: { id: 'global' } });

  if (existing?.encryptedApiKey) {
    console.log('[migrate] AppSettings already has an API key — skipping migration.');
    return;
  }

  // Find the most recently updated UserLLMSettings with a key
  const latestLLM = await prisma.userLLMSettings.findFirst({
    where: { encryptedApiKey: { not: null } },
    orderBy: { updatedAt: 'desc' },
  });

  // Find any user with a focusProviderId set
  const userWithFocus = await prisma.user.findFirst({
    where: { focusProviderId: { not: null } },
    select: { focusProviderId: true },
    orderBy: { updatedAt: 'desc' },
  });

  if (!latestLLM && !userWithFocus) {
    console.log('[migrate] No existing LLM settings or focus provider found — nothing to migrate.');
    // Still create the singleton so it exists
    await prisma.appSettings.upsert({
      where: { id: 'global' },
      update: {},
      create: { id: 'global' },
    });
    return;
  }

  await prisma.appSettings.upsert({
    where: { id: 'global' },
    update: {
      ...(latestLLM
        ? {
            providerType: latestLLM.providerType,
            encryptedApiKey: latestLLM.encryptedApiKey,
            modelDefault: latestLLM.modelDefault,
            baseUrl: latestLLM.baseUrl,
            validationStatus: latestLLM.validationStatus,
            lastValidatedAt: latestLLM.lastValidatedAt,
          }
        : {}),
      ...(userWithFocus?.focusProviderId
        ? { focusProviderId: userWithFocus.focusProviderId }
        : {}),
    },
    create: {
      id: 'global',
      ...(latestLLM
        ? {
            providerType: latestLLM.providerType,
            encryptedApiKey: latestLLM.encryptedApiKey,
            modelDefault: latestLLM.modelDefault,
            baseUrl: latestLLM.baseUrl,
            validationStatus: latestLLM.validationStatus,
            lastValidatedAt: latestLLM.lastValidatedAt,
          }
        : {}),
      ...(userWithFocus?.focusProviderId
        ? { focusProviderId: userWithFocus.focusProviderId }
        : {}),
    },
  });

  console.log('[migrate] ✓ AppSettings populated successfully:');
  if (latestLLM) {
    console.log(`  LLM Provider: ${latestLLM.providerType}, Model: ${latestLLM.modelDefault}`);
  }
  if (userWithFocus?.focusProviderId) {
    console.log(`  Focus Provider ID: ${userWithFocus.focusProviderId}`);
  }
}

main()
  .catch((e) => {
    console.error('[migrate] Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
