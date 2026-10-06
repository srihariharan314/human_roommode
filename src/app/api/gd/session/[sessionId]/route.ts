import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSessionById, getParticipants, getTranscripts } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const user = await getCurrentUser();

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session ID.' }, { status: 400 });
    }

    const session = await getSessionById(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }

    const [participants, transcripts] = await Promise.all([
      getParticipants(sessionId),
      getTranscripts(sessionId),
    ]);

    const isHost = user ? session.host_id === user.id : false;

    return NextResponse.json({
      success: true,
      session,
      participants,
      transcripts,
      isHost,
      currentUserId: user?.id || null,
    });
  } catch (error: any) {
    console.error('Error fetching session details:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch session' }, { status: 500 });
  }
}
