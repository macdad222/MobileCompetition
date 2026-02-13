import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getJobStatus } from '@/src/collectors/job-runner';
import { db } from '@/lib/db';

// GET - Get job status
export async function GET(
  req: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const job = await getJobStatus(params.jobId);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error('Error fetching job status:', error);
    return NextResponse.json({ error: 'Failed to fetch job status' }, { status: 500 });
  }
}
