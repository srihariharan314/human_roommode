import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { addTranscript, getSessionById } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, text, startTimeOffsetMs, endTimeOffsetMs } = body;

    if (!sessionId || !text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Missing required transcript payload.' }, { status: 400 });
    }

    const session = await getSessionById(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }

    if (session.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Session is not active for transcript submissions.' }, { status: 400 });
    }

    const transcriptItem = await addTranscript({
      sessionId,
      userId: user.id,
      participantName: user.name,
      text: text.trim(),
      startTimeOffsetMs,
      endTimeOffsetMs,
    });

    return NextResponse.json({
      success: true,
      transcript: transcriptItem,
    });
  } catch (error: any) {
    console.error('Error recording transcript:', error);
    return NextResponse.json({ error: error.message || 'Failed to record transcript' }, { status: 500 });
  }
}
