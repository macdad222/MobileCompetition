import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/src/security/encryption';
import { testLLMConnection } from '@/src/llm/client';
import { LLMProviderType } from '@/src/llm/providers';

// POST - Test shared LLM connection
export async function POST() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Read from shared AppSettings
    const settings = await db.appSettings.findUnique({
      where: { id: 'global' },
    });

    if (!settings || !settings.encryptedApiKey) {
      return NextResponse.json(
        { error: 'No LLM settings configured. Go to Settings to add your API key.' },
        { status: 400 }
      );
    }

    // Decrypt the API key
    let apiKey: string;
    try {
      apiKey = decrypt(settings.encryptedApiKey);
    } catch {
      return NextResponse.json(
        { error: 'Failed to decrypt API key. Please re-enter your key.' },
        { status: 400 }
      );
    }

    // Test the connection
    const result = await testLLMConnection({
      providerType: settings.providerType as LLMProviderType,
      apiKey,
      model: settings.modelDefault,
      baseUrl: settings.baseUrl || undefined,
    });

    // Update validation status on AppSettings
    await db.appSettings.update({
      where: { id: 'global' },
      data: {
        validationStatus: result.success ? 'valid' : 'invalid',
        lastValidatedAt: new Date(),
      },
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Connection successful! The LLM is ready for all users.',
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Connection test failed',
      });
    }
  } catch (error) {
    console.error('Error testing LLM connection:', error);
    return NextResponse.json(
      { error: 'Failed to test connection' },
      { status: 500 }
    );
  }
}
