import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { generateBuyerBehaviorInsight } from '@/src/llm/analysis';
import { getLLMConfig, storeInsight } from '@/src/llm/helpers';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { segmentId } = await req.json();
    if (!segmentId) {
      return NextResponse.json({ error: 'Segment ID is required' }, { status: 400 });
    }

    const config = await getLLMConfig(session.user.id);
    if (!config) {
      return NextResponse.json({ error: 'No LLM configuration found. Please configure your API key in Settings.' }, { status: 400 });
    }

    const segment = await db.sMBSegment.findUnique({
      where: { id: segmentId },
      include: { buyerProfile: true },
    });

    if (!segment) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 });
    }
    if (!segment.buyerProfile) {
      return NextResponse.json({ error: 'No buyer profile found for this segment' }, { status: 404 });
    }

    const analysis = await generateBuyerBehaviorInsight(config, segment, {
      awarenessChannels: segment.buyerProfile.awarenessChannels,
      considerationFactors: segment.buyerProfile.considerationFactors,
      decisionTriggers: segment.buyerProfile.decisionTriggers,
      painPoints: segment.buyerProfile.painPoints as { issue: string; severity: number }[],
      preferredTerms: segment.buyerProfile.preferredTerms,
      switchingBarriers: segment.buyerProfile.switchingBarriers,
      loyaltyDrivers: segment.buyerProfile.loyaltyDrivers,
      purchaseChannels: segment.buyerProfile.purchaseChannels,
      supportExpectations: segment.buyerProfile.supportExpectations,
    });

    await storeInsight({
      userId: session.user.id,
      insightType: 'BUYER_BEHAVIOR',
      title: `Buyer Behavior: ${segment.name}`,
      content: analysis,
      summary: analysis.purchaseJourneyNarrative,
      modelUsed: config.model,
      segmentId: segment.id,
    });

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Error generating buyer behavior insight:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate analysis';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
