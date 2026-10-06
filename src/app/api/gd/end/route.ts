import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSessionById, updateSessionStatus, getTranscripts, getParticipants, saveResultsAndFeedback } from '@/lib/db';
import { analyzeIndividualParticipant } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, reason } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session ID.' }, { status: 400 });
    }

    const session = await getSessionById(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }

    // Host can end, or if timer expired anyone in the session can trigger finalization
    const isHost = session.host_id === user.id;
    const isExpired = session.gd_deadline && new Date(session.gd_deadline).getTime() <= Date.now();

    if (!isHost && !isExpired && reason !== 'timer_expired') {
      return NextResponse.json({ error: 'Forbidden: Only the host can end the discussion.' }, { status: 403 });
    }

    const updatedSession = await updateSessionStatus(sessionId, session.host_id, 'COMPLETED');

    // Asynchronously kick off analysis for all participants
    try {
      const [transcripts, participants] = await Promise.all([
        getTranscripts(sessionId),
        getParticipants(sessionId),
      ]);

      // Analyze each participant
      for (const participant of participants) {
        analyzeIndividualParticipant(
          sessionId,
          session.topic,
          participant,
          transcripts,
          participants
        ).then(async ({ result, feedback }) => {
          await saveResultsAndFeedback(result, feedback);
        }).catch(err => {
          console.error(`Error analyzing participant ${participant.user_id}:`, err);
        });
      }
    } catch (analysisErr) {
      console.warn('Post GD analysis initialization note:', analysisErr);
    }

    return NextResponse.json({
      success: true,
      session: updatedSession,
    });
  } catch (error: any) {
    console.error('Error ending GD session:', error);
    return NextResponse.json({ error: error.message || 'Failed to end GD' }, { status: 500 });
  }
}
