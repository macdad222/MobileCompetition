import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { insightIds, format, companyName } = await req.json();

    if (!insightIds?.length) {
      return NextResponse.json({ error: 'No insights selected' }, { status: 400 });
    }

    const insights = await db.storedInsight.findMany({
      where: { id: { in: insightIds } },
      orderBy: { generatedAt: 'desc' },
    });

    if (insights.length === 0) {
      return NextResponse.json({ error: 'No insights found' }, { status: 404 });
    }

    const title = companyName
      ? `${companyName} - Strategic Intelligence Report`
      : 'SMB Strategic Intelligence Report';
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    if (format === 'pptx') {
      const PptxGenJS = (await import('pptxgenjs')).default;
      const pptx = new PptxGenJS();
      pptx.layout = 'LAYOUT_WIDE';
      pptx.author = 'SMB Market Intelligence by CMACLABS';

      // Title slide
      const titleSlide = pptx.addSlide();
      titleSlide.addText(title, {
        x: 0.5, y: 1.5, w: '90%', h: 1.5,
        fontSize: 32, bold: true, color: '1E293B',
      });
      titleSlide.addText(`${date} | ${insights.length} Insights`, {
        x: 0.5, y: 3.2, w: '90%', h: 0.5,
        fontSize: 14, color: '64748B',
      });

      for (const insight of insights) {
        const slide = pptx.addSlide();
        slide.addText(insight.title, {
          x: 0.5, y: 0.3, w: '90%', h: 0.7,
          fontSize: 22, bold: true, color: '1E293B',
        });
        slide.addText(insight.insightType.replace(/_/g, ' '), {
          x: 0.5, y: 1.0, w: 2, h: 0.3,
          fontSize: 10, color: '3B82F6', italic: true,
        });

        const content = insight.content as Record<string, any>;
        let bodyText = '';
        if (typeof content === 'string') {
          bodyText = content;
        } else if (content) {
          const main = content.summary || content.overview || content.executiveSummary ||
            content.marketOverview || content.purchaseJourneyNarrative || '';
          bodyText = main + '\n';

          const listFields = ['keyFindings', 'strategicRecommendations', 'riskFactors',
            'strengths', 'weaknesses', 'needsPriorities', 'threatAssessment',
            'retentionTactics', 'messagingRecommendations'];

          for (const field of listFields) {
            if (Array.isArray(content[field]) && content[field].length > 0) {
              bodyText += '\n' + field.replace(/([A-Z])/g, ' $1').trim() + ':\n';
              for (const item of content[field]) {
                bodyText += typeof item === 'string'
                  ? `  \u2022 ${item}\n`
                  : `  \u2022 ${Object.values(item).join(' | ')}\n`;
              }
            }
          }
        }

        slide.addText(bodyText.trim(), {
          x: 0.5, y: 1.4, w: '90%', h: 5.5,
          fontSize: 11, color: '334155',
          valign: 'top', wrap: true,
        });
      }

      const buffer = await pptx.write({ outputType: 'nodebuffer' }) as Buffer;
      return new NextResponse(buffer as unknown as BodyInit, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'Content-Disposition': `attachment; filename="strategic-report-${new Date().toISOString().split('T')[0]}.pptx"`,
        },
      });
    }

    // Default: return JSON data for client-side PDF generation (jsPDF works in browser)
    return NextResponse.json({
      title,
      date,
      insights: insights.map(i => ({
        title: i.title,
        insightType: i.insightType,
        content: i.content,
        modelUsed: i.modelUsed,
        generatedAt: i.generatedAt,
      })),
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
