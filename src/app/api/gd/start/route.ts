import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSessionById, updateSessionStatus } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session ID.' }, { status: 400 });
    }

    const session = await getSessionById(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }

    // Strict host authorization
    if (session.host_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: Only the host can start the discussion.' }, { status: 403 });
    }

    if (session.status !== 'WAITING') {
      return NextResponse.json({ success: true, session });
    }

    const updatedSession = await updateSessionStatus(sessionId, user.id, 'ACTIVE');

    return NextResponse.json({
      success: true,
      session: updatedSession,
    });
  } catch (error: any) {
    console.error('Error starting GD session:', error);
    return NextResponse.json({ error: error.message || 'Failed to start GD' }, { status: 500 });
  }
}
