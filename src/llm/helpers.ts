import { db } from '@/lib/db';
import { decrypt } from '@/src/security/encryption';
import { LLMClientConfig } from './client';
import { InsightType } from '@prisma/client';

/**
 * Get the shared (app-wide) LLM configuration.
 * Falls back to per-user settings for backwards compatibility if AppSettings
 * has not been populated yet.
 */
export async function getLLMConfig(userId?: string): Promise<LLMClientConfig | null> {
  // 1. Try shared AppSettings first
  const appSettings = await db.appSettings.findUnique({ where: { id: 'global' } });

  if (appSettings?.encryptedApiKey) {
    const apiKey = decrypt(appSettings.encryptedApiKey);
    return {
      providerType: appSettings.providerType as 'OPENAI' | 'ANTHROPIC' | 'GEMINI' | 'OPENAI_COMPATIBLE',
      apiKey,
      model: appSettings.modelDefault,
      baseUrl: appSettings.baseUrl || undefined,
    };
  }

  // 2. Fallback: check per-user settings (backward compat for migration)
  if (userId) {
    const llmSettings = await db.userLLMSettings.findFirst({ where: { userId } });
    if (llmSettings?.encryptedApiKey) {
      const apiKey = decrypt(llmSettings.encryptedApiKey);
      return {
        providerType: llmSettings.providerType as 'OPENAI' | 'ANTHROPIC' | 'GEMINI' | 'OPENAI_COMPATIBLE',
        apiKey,
        model: llmSettings.modelDefault,
        baseUrl: llmSettings.baseUrl || undefined,
      };
    }
  }

  return null;
}

/**
 * Store (or update) an AI-generated insight.
 * Uses an upsert pattern: finds the most recent insight matching the same
 * context keys (insightType + providerId + provider2Id + segmentId + category)
 * and updates it in-place. Creates a new row only if no match exists.
 * This keeps analyses persistent and shared — every user sees the same report.
 */
export async function storeInsight(params: {
  userId: string;
  insightType: InsightType;
  title: string;
  content: object;
  summary: string;
  modelUsed: string;
  tokensUsed?: number;
  providerId?: string;
  provider2Id?: string;
  segmentId?: string;
  category?: string;
  focusProviderId?: string;
}) {
  // Build context-key filter to find an existing insight for this exact context
  const where: any = { insightType: params.insightType };
  if (params.providerId) where.providerId = params.providerId; else where.providerId = null;
  if (params.provider2Id) where.provider2Id = params.provider2Id; else where.provider2Id = null;
  if (params.segmentId) where.segmentId = params.segmentId; else where.segmentId = null;
  if (params.category) where.category = params.category; else where.category = null;

  // Try to find an existing insight for this context
  const existing = await db.storedInsight.findFirst({
    where,
    orderBy: { generatedAt: 'desc' },
    select: { id: true },
  });

  if (existing) {
    // Update in-place so we keep one row per context
    return db.storedInsight.update({
      where: { id: existing.id },
      data: {
        userId: params.userId,
        title: params.title,
        content: params.content as any,
        summary: params.summary,
        modelUsed: params.modelUsed,
        tokensUsed: params.tokensUsed,
        focusProviderId: params.focusProviderId,
        generatedAt: new Date(),
      },
    });
  }

  // No existing insight — create a new one
  return db.storedInsight.create({
    data: {
      userId: params.userId,
      insightType: params.insightType,
      title: params.title,
      content: params.content as any,
      summary: params.summary,
      modelUsed: params.modelUsed,
      tokensUsed: params.tokensUsed,
      providerId: params.providerId,
      provider2Id: params.provider2Id,
      segmentId: params.segmentId,
      category: params.category,
      focusProviderId: params.focusProviderId,
    },
  });
}

/**
 * Get the shared focus provider (from AppSettings).
 * Falls back to per-user setting for backwards compatibility.
 */
export async function getUserFocusProvider(userId?: string) {
  // 1. Try shared AppSettings first
  const appSettings = await db.appSettings.findUnique({
    where: { id: 'global' },
    select: { focusProviderId: true, focusProvider: { select: { id: true, slug: true, displayName: true } } },
  });

  if (appSettings?.focusProvider) {
    return appSettings.focusProvider;
  }

  // 2. Fallback to per-user
  if (userId) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { focusProviderId: true, focusProvider: { select: { id: true, slug: true, displayName: true } } },
    });
    return user?.focusProvider || null;
  }

  return null;
}
