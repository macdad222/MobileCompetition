import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { createRefreshJob, runRefreshJob } from '@/src/collectors/job-runner';
import { OfferCategory } from '@prisma/client';

const refreshSchema = z.object({
  providerIds: z.array(z.string()).min(1, 'At least one provider is required'),
  categories: z.array(z.nativeEnum(OfferCategory)).min(1, 'At least one category is required'),
});

// POST - Create and start a refresh job
export async function POST(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = refreshSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { providerIds, categories } = validated.data;

    // Create the job
    const jobId = await createRefreshJob({
      userId: session.user.id,
      providerIds,
      categories,
    });

    // Start the job asynchronously (fire and forget for MVP)
    // In production, this would be handled by a proper job queue
    runRefreshJob(jobId).catch((error) => {
      console.error(`Job ${jobId} failed:`, error);
    });

    return NextResponse.json({
      jobId,
      message: 'Refresh job started',
    });
  } catch (error) {
    console.error('Error creating refresh job:', error);
    return NextResponse.json({ error: 'Failed to start refresh' }, { status: 500 });
  }
}

// GET - List recent refresh jobs
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Show all refresh jobs to all users (shared data)
    const jobs = await db.refreshJob.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        status: true,
        progress: true,
        message: true,
        providerIds: true,
        categories: true,
        result: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Error fetching refresh jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}
