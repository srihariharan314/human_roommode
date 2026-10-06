import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { 
  getSessionById, 
  getTranscripts, 
  getParticipants, 
  getUserResultAndFeedback, 
  saveResultsAndFeedback 
} from '@/lib/db';
import { analyzeIndividualParticipant } from '@/lib/gemini';

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

    const requestedUserId = targetUserId || user.id;

    // Security: non-hosts can only view their own score/feedback
    if (requestedUserId !== user.id && session.host_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: You can only access your own individual scorecard.' }, { status: 403 });
    }

    // 1. Check if analysis is already computed and stored
    const cached = await getUserResultAndFeedback(sessionId, requestedUserId);
    if (cached.result && cached.feedback) {
      return NextResponse.json({
        success: true,
        result: cached.result,
        feedback: cached.feedback,
        cached: true,
      });
    }

    // 2. If not computed yet, compute with Gemini AI now
    const [transcripts, participants] = await Promise.all([
      getTranscripts(sessionId),
      getParticipants(sessionId),
    ]);

    const targetParticipant = participants.find(p => p.user_id === requestedUserId) || {
      id: crypto.randomUUID(),
      session_id: sessionId,
      user_id: requestedUserId,
      participant_name: user.name,
      is_host: session.host_id === requestedUserId,
      joined_at: new Date().toISOString(),
      status: 'JOINED' as const,
    };

    const { result, feedback } = await analyzeIndividualParticipant(
      sessionId,
      session.topic,
      targetParticipant,
      transcripts,
      participants
    );

    const saved = await saveResultsAndFeedback(result, feedback);

    return NextResponse.json({
      success: true,
      result: saved.result,
      feedback: saved.feedback,
      cached: false,
    });
  } catch (error: any) {
    console.error('Error in AI analysis endpoint:', error);
    return NextResponse.json({ error: error.message || 'Analysis generation failed' }, { status: 500 });
  }
}
