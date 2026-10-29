import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSessionByRoomCode, getSessionById, addOrGetParticipant, getParticipants, getOrCreateUserProfile } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomCode, sessionId, participantName, userName, avatarUrl } = body || {};

    let user = await getCurrentUser();

    // If user is not yet logged in, but provided a participant display name
    const requestedName = (participantName || userName || '').trim();
    let isNewGuest = false;

    if (!user && requestedName) {
      const guestId = crypto.randomUUID();
      user = await getOrCreateUserProfile({
        id: guestId,
        name: requestedName,
        email: `${requestedName.toLowerCase().replace(/[^a-z0-9]/g, '')}@participant.gd`,
        avatar_url: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(guestId)}`,
      });
      isNewGuest = true;
    }

    if (!user) {
      return NextResponse.json({ error: 'Please enter your participant name to join the GD.' }, { status: 401 });
    }

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

    const response = NextResponse.json({
      success: true,
      session,
      participant,
      participants,
      joinUrl,
      isHost,
      user,
    });

    if (isNewGuest && user) {
      response.cookies.set('intelligd_user', encodeURIComponent(JSON.stringify(user)), {
        path: '/',
        maxAge: 2592000,
        sameSite: 'lax',
      });
    }

    return response;
  } catch (error: any) {
    console.error('Error joining GD session:', error);
    return NextResponse.json({ error: error.message || 'Failed to join GD session' }, { status: 500 });
  }
}

