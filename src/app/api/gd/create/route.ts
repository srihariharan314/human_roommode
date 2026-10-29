import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createGDSession, addOrGetParticipant, getOrCreateUserProfile } from '@/lib/db';
import { generateTopicPreparation } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { topic, maxParticipants = 10, durationSeconds = 900, generatePrep = true, hostName, userName } = body || {};

    let user = await getCurrentUser();
    let isNewGuest = false;

    if (!user) {
      const requestedName = (hostName || userName || 'Discussion Host').trim();
      const guestId = crypto.randomUUID();
      user = await getOrCreateUserProfile({
        id: guestId,
        name: requestedName,
        email: `${requestedName.toLowerCase().replace(/[^a-z0-9]/g, '')}@participant.gd`,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(guestId)}`,
      });
      isNewGuest = true;
    }

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return NextResponse.json({ error: 'Please provide a valid discussion topic.' }, { status: 400 });
    }

    // Generate topic preparation materials if requested
    let topicMaterials = null;
    if (generatePrep) {
      try {
        topicMaterials = await generateTopicPreparation(topic.trim());
      } catch (err) {
        console.warn('Prep generation note:', err);
      }
    }

    // Create persistent ONE session in database
    const session = await createGDSession({
      hostId: user.id,
      topic: topic.trim(),
      topicMaterials,
      maxParticipants: Number(maxParticipants) || 10,
      durationSeconds: Number(durationSeconds) || 900,
    });

    // Add host as the first participant
    await addOrGetParticipant({
      sessionId: session.id,
      userId: user.id,
      name: user.name,
      avatarUrl: user.avatar_url,
      isHost: true,
    });

    // Build production join URL from environment or request origin
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const cleanAppUrl = appUrl.replace(/\/$/, '');
    const joinUrl = `${cleanAppUrl}/human-gd/join/${session.room_code}`;

    const response = NextResponse.json({
      success: true,
      session,
      joinUrl,
      roomCode: session.room_code,
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
    console.error('Error creating GD session:', error);

    return NextResponse.json({ error: error.message || 'Failed to create GD session' }, { status: 500 });
  }
}
