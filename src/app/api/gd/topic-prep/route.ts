import { NextResponse } from 'next/server';
import { generateTopicPreparation } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { topic } = body;

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return NextResponse.json({ error: 'Topic is required.' }, { status: 400 });
    }

    const prep = await generateTopicPreparation(topic.trim());

    return NextResponse.json({
      success: true,
      topic: topic.trim(),
      prep,
    });
  } catch (error: any) {
    console.error('Error generating topic prep:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate topic prep' }, { status: 500 });
  }
}
