import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSessionById, advanceSessionTurn, getParticipants } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, targetUserId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session ID.' }, { status: 400 });
    }

    const session = await getSessionById(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }

    if (session.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Session is not active.' }, { status: 400 });
    }

    const isHost = session.host_id === user.id;
    const isCurrentSpeaker = session.current_speaker_id === user.id;

    // Only the active speaker or the host can pass/advance the turn
    if (!isCurrentSpeaker && !isHost) {
      return NextResponse.json({ error: 'Forbidden: Only the active speaker or host can pass the turn.' }, { status: 403 });
    }

    const { session: updatedSession, nextSpeaker, turnNumber } = await advanceSessionTurn(sessionId, targetUserId || user.id);

    return NextResponse.json({
      success: true,
      session: updatedSession,
      nextSpeaker,
      turnNumber,
    });
  } catch (error: any) {
    console.error('Error advancing GD turn:', error);
    return NextResponse.json({ error: error.message || 'Failed to advance turn' }, { status: 500 });
  }
}
