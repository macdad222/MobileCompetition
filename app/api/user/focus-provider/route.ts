import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

// GET - Retrieve shared focus provider (from AppSettings)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Read from shared AppSettings
    const appSettings = await db.appSettings.findUnique({
      where: { id: 'global' },
      select: {
        focusProviderId: true,
        focusProvider: { select: { id: true, slug: true, displayName: true } },
      },
    });

    if (appSettings?.focusProvider) {
      return NextResponse.json({ focusProvider: appSettings.focusProvider });
    }

    // Fallback to per-user setting (backward compat)
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        focusProviderId: true,
        focusProvider: { select: { id: true, slug: true, displayName: true } },
      },
    });

    return NextResponse.json({ focusProvider: user?.focusProvider || null });
  } catch (error) {
    console.error('Error fetching focus provider:', error);
    return NextResponse.json({ error: 'Failed to fetch focus provider' }, { status: 500 });
  }
}

// POST - Update shared focus provider (writes to AppSettings)
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { providerId } = await req.json();

    const appSettings = await db.appSettings.upsert({
      where: { id: 'global' },
      update: { focusProviderId: providerId || null },
      create: { id: 'global', focusProviderId: providerId || null },
      select: {
        focusProviderId: true,
        focusProvider: { select: { id: true, slug: true, displayName: true } },
      },
    });

    return NextResponse.json({ focusProvider: appSettings.focusProvider });
  } catch (error) {
    console.error('Error updating focus provider:', error);
    return NextResponse.json({ error: 'Failed to update focus provider' }, { status: 500 });
  }
}
