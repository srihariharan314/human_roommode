import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSessionByRoomCode, getSessionById, addOrGetParticipant, getParticipants } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in to join a GD.' }, { status: 401 });
    }

    const body = await request.json();
    const { roomCode, sessionId } = body;

    let session = null;
    if (roomCode) {
      session = await getSessionByRoomCode(roomCode);
    } else if (sessionId) {
      session = await getSessionById(sessionId);
    }

    if (!session) {
      return NextResponse.json({ error: 'This GD room does not exist. Please verify the room code or join link.' }, { status: 404 });
    }

    const isHost = session.host_id === user.id;

    // Add user as participant to this session (prevents duplicates via unique constraint)
    const participant = await addOrGetParticipant({
      sessionId: session.id,
      userId: user.id,
      name: user.name,
      avatarUrl: user.avatar_url,
      isHost,
    });

    const participants = await getParticipants(session.id);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const cleanAppUrl = appUrl.replace(/\/$/, '');
    const joinUrl = `${cleanAppUrl}/human-gd/join/${session.room_code}`;

    return NextResponse.json({
      success: true,
      session,
      participant,
      participants,
      joinUrl,
      isHost,
    });
  } catch (error: any) {
    console.error('Error joining GD session:', error);
    return NextResponse.json({ error: error.message || 'Failed to join GD session' }, { status: 500 });
  }
}
