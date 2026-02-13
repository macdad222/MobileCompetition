import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { encrypt, decrypt, maskApiKey } from '@/src/security/encryption';
import { LLMProviderType } from '@/src/llm/providers';

const updateSchema = z.object({
  providerType: z.enum(['OPENAI', 'ANTHROPIC', 'GEMINI', 'OPENAI_COMPATIBLE']),
  apiKey: z.string().min(1, 'API key is required'),
  modelDefault: z.string().min(1, 'Model is required'),
  baseUrl: z.string().url().optional().nullable(),
});

// GET - Retrieve shared LLM settings (app-wide)
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Read from shared AppSettings
    const appSettings = await db.appSettings.findUnique({
      where: { id: 'global' },
    });

    if (!appSettings || !appSettings.encryptedApiKey) {
      // Fallback: try legacy per-user settings so we don't lose existing key
      const legacySettings = await db.userLLMSettings.findFirst({
        where: { encryptedApiKey: { not: null } },
        orderBy: { updatedAt: 'desc' },
      });

      if (legacySettings?.encryptedApiKey) {
        let maskedKey = '****';
        try { maskedKey = maskApiKey(decrypt(legacySettings.encryptedApiKey)); } catch {}

        return NextResponse.json({
          settings: {
            providerType: legacySettings.providerType,
            modelDefault: legacySettings.modelDefault,
            baseUrl: legacySettings.baseUrl,
            validationStatus: legacySettings.validationStatus,
            lastValidatedAt: legacySettings.lastValidatedAt,
            maskedApiKey: maskedKey,
          },
          hasApiKey: true,
          isLegacy: true, // hint to client that migration is needed
        });
      }

      return NextResponse.json({ settings: null, hasApiKey: false });
    }

    // Decrypt and mask the API key for display
    let maskedKey = '';
    if (appSettings.encryptedApiKey) {
      try {
        const decrypted = decrypt(appSettings.encryptedApiKey);
        maskedKey = maskApiKey(decrypted);
      } catch {
        maskedKey = '****';
      }
    }

    return NextResponse.json({
      settings: {
        providerType: appSettings.providerType,
        modelDefault: appSettings.modelDefault,
        baseUrl: appSettings.baseUrl,
        validationStatus: appSettings.validationStatus,
        lastValidatedAt: appSettings.lastValidatedAt,
        maskedApiKey: maskedKey,
      },
      hasApiKey: !!appSettings.encryptedApiKey,
    });
  } catch (error) {
    console.error('Error fetching LLM settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// POST - Update shared LLM settings (writes to AppSettings singleton)
export async function POST(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = updateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { providerType, apiKey, modelDefault, baseUrl } = validated.data;

    // Encrypt the API key
    const encryptedApiKey = encrypt(apiKey);

    // Upsert the shared AppSettings singleton
    const settings = await db.appSettings.upsert({
      where: { id: 'global' },
      update: {
        providerType: providerType as LLMProviderType,
        encryptedApiKey,
        modelDefault,
        baseUrl: baseUrl || null,
        validationStatus: 'pending',
        updatedAt: new Date(),
      },
      create: {
        id: 'global',
        providerType: providerType as LLMProviderType,
        encryptedApiKey,
        modelDefault,
        baseUrl: baseUrl || null,
        validationStatus: 'pending',
      },
    });

    return NextResponse.json({
      message: 'Settings saved successfully — visible to all users',
      settings: {
        providerType: settings.providerType,
        modelDefault: settings.modelDefault,
        baseUrl: settings.baseUrl,
        validationStatus: settings.validationStatus,
        maskedApiKey: maskApiKey(apiKey),
      },
    });
  } catch (error) {
    console.error('Error saving LLM settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}

// DELETE - Remove shared LLM settings
export async function DELETE() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await db.appSettings.update({
      where: { id: 'global' },
      data: {
        encryptedApiKey: null,
        validationStatus: 'pending',
        lastValidatedAt: null,
      },
    }).catch(() => {
      // Ignore if doesn't exist
    });

    return NextResponse.json({ message: 'Settings deleted' });
  } catch (error) {
    console.error('Error deleting LLM settings:', error);
    return NextResponse.json({ error: 'Failed to delete settings' }, { status: 500 });
  }
}
