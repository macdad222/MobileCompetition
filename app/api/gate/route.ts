import { NextResponse } from 'next/server';

const SITE_PASSWORD = process.env.SITE_PASSWORD || 'INTELGTM';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();

    if (password !== SITE_PASSWORD) {
      return NextResponse.json({ error: 'Invalid access code' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });

    // Set a cookie that lasts 30 days
    response.cookies.set('site_access', 'granted', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
