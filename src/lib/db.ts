import { createAdminClient } from '@/lib/supabase/server';
import { 
  GDSession, 
  Participant, 
  TranscriptItem, 
  GDResult, 
  GDFeedback, 
  UserProfile,
  UserDashboardStats,
  TopicPrepMaterial 
} from '@/types';

// In-memory persistent cache to bridge seamless multi-device/local development
// when Supabase keys are being initialized or configured
declare global {
  var _intelligd_memory_store: {
    profiles: Map<string, UserProfile>;
    sessions: Map<string, GDSession>;
    participants: Map<string, Participant[]>;
    transcripts: Map<string, TranscriptItem[]>;
    results: Map<string, GDResult[]>;
    feedbacks: Map<string, GDFeedback[]>;
  } | undefined;
}

if (!global._intelligd_memory_store) {
  global._intelligd_memory_store = {
    profiles: new Map(),
    sessions: new Map(),
    participants: new Map(),
    transcripts: new Map(),
    results: new Map(),
    feedbacks: new Map(),
  };
}

const memoryStore = global._intelligd_memory_store;

// Helper: Generate Unique Room Code (e.g. IGD-7K42P)
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Clean charset without ambiguous chars
  let code = 'IGD-';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// -----------------------------------------------------------------------------
// 1. Profiles
// -----------------------------------------------------------------------------
export async function getOrCreateUserProfile(user: { id: string; name?: string; email: string; avatar_url?: string }): Promise<UserProfile> {
  const profile: UserProfile = {
    id: user.id,
    name: user.name || user.email.split('@')[0] || 'Anonymous User',
    email: user.email,
    avatar_url: user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email)}`,
    created_at: new Date().toISOString(),
  };

  memoryStore.profiles.set(user.id, profile);

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data && !error) {
      return data as UserProfile;
    }

    // Insert if doesn't exist
    const { data: inserted, error: insertError } = await supabase
      .from('profiles')
      .upsert(profile)
      .select()
      .single();

    if (inserted && !insertError) {
      return inserted as UserProfile;
    }
  } catch (err) {
    // Supabase optional fallback
  }

  return profile;
}

// -----------------------------------------------------------------------------
// 2. GD Sessions
// -----------------------------------------------------------------------------
export async function createGDSession(params: {
  hostId: string;
  topic: string;
  topicMaterials?: TopicPrepMaterial | null;
  maxParticipants?: number;
  durationSeconds?: number;
}): Promise<GDSession> {
  let roomCode = generateRoomCode();
  const id = crypto.randomUUID();

  const newSession: GDSession = {
    id,
    host_id: params.hostId,
    room_code: roomCode,
    topic: params.topic,
    topic_overview: params.topicMaterials?.overview || null,
    topic_materials: params.topicMaterials || null,
    status: 'WAITING',
    max_participants: params.maxParticipants || 10,
    duration_seconds: params.durationSeconds || 900,
    started_at: null,
    ended_at: null,
    gd_deadline: null,
    created_at: new Date().toISOString(),
  };

  memoryStore.sessions.set(id, newSession);
  memoryStore.participants.set(id, []);
  memoryStore.transcripts.set(id, []);

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('gd_sessions')
      .insert({
        id: newSession.id,
        host_id: newSession.host_id,
        room_code: newSession.room_code,
        topic: newSession.topic,
        topic_overview: newSession.topic_overview,
        topic_materials: newSession.topic_materials,
        status: newSession.status,
        max_participants: newSession.max_participants,
        duration_seconds: newSession.duration_seconds,
        created_at: newSession.created_at,
      })
      .select()
      .single();

    if (data && !error) {
      return data as GDSession;
    }
  } catch (err) {
    // Supabase fallback
  }

  return newSession;
}

export async function getSessionByRoomCode(roomCode: string): Promise<GDSession | null> {
  const cleanCode = roomCode.trim().toUpperCase();

  // Check Supabase first
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('gd_sessions')
      .select('*')
      .eq('room_code', cleanCode)
      .single();

    if (data && !error) {
      // Sync memory cache
      memoryStore.sessions.set(data.id, data as GDSession);
      return data as GDSession;
    }
  } catch (err) {
    // Fall through to memory store
  }

  // Memory store lookup
  for (const session of memoryStore.sessions.values()) {
    if (session.room_code.toUpperCase() === cleanCode) {
      return session;
    }
  }

  return null;
}

export async function getSessionById(sessionId: string): Promise<GDSession | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('gd_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (data && !error) {
      memoryStore.sessions.set(data.id, data as GDSession);
      return data as GDSession;
    }
  } catch (err) {
    // Fall through
  }

  return memoryStore.sessions.get(sessionId) || null;
}

export async function updateSessionStatus(
  sessionId: string,
  hostId: string,
  newStatus: 'ACTIVE' | 'COMPLETED'
): Promise<GDSession | null> {
  const session = await getSessionById(sessionId);
  if (!session) return null;

  if (session.host_id !== hostId) {
    throw new Error('Unauthorized: Only the host can change session state.');
  }

  const now = new Date().toISOString();
  let updates: Partial<GDSession> = { status: newStatus };

  if (newStatus === 'ACTIVE') {
    updates.started_at = now;
    if (session.duration_seconds && session.duration_seconds > 0) {
      const deadline = new Date(Date.now() + session.duration_seconds * 1000).toISOString();
      updates.gd_deadline = deadline;
    }
  } else if (newStatus === 'COMPLETED') {
    updates.ended_at = now;
  }

  // Update memory store
  const updatedSession = { ...session, ...updates };
  memoryStore.sessions.set(sessionId, updatedSession);

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('gd_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single();

    if (data && !error) {
      return data as GDSession;
    }
  } catch (err) {
    // Fallback
  }

  return updatedSession;
}

// -----------------------------------------------------------------------------
// 3. Participants
// -----------------------------------------------------------------------------
export async function addOrGetParticipant(params: {
  sessionId: string;
  userId: string;
  name: string;
  avatarUrl?: string;
  isHost: boolean;
}): Promise<Participant> {
  const existingList = memoryStore.participants.get(params.sessionId) || [];
  const existing = existingList.find(p => p.user_id === params.userId);

  if (existing) {
    return existing;
  }

  const newParticipant: Participant = {
    id: crypto.randomUUID(),
    session_id: params.sessionId,
    user_id: params.userId,
    participant_name: params.name,
    participant_avatar: params.avatarUrl || null,
    is_host: params.isHost,
    joined_at: new Date().toISOString(),
    status: 'JOINED',
  };

  existingList.push(newParticipant);
  memoryStore.participants.set(params.sessionId, existingList);

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('participants')
      .upsert({
        session_id: params.sessionId,
        user_id: params.userId,
        participant_name: params.name,
        participant_avatar: params.avatarUrl,
        is_host: params.isHost,
        joined_at: newParticipant.joined_at,
        status: 'JOINED'
      }, { onConflict: 'session_id,user_id' })
      .select()
      .single();

    if (data && !error) {
      return data as Participant;
    }
  } catch (err) {
    // Supabase fallback
  }

  return newParticipant;
}

export async function getParticipants(sessionId: string): Promise<Participant[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('session_id', sessionId)
      .order('joined_at', { ascending: true });

    if (data && !error && data.length > 0) {
      memoryStore.participants.set(sessionId, data as Participant[]);
      return data as Participant[];
    }
  } catch (err) {
    // Fallback
  }

  return memoryStore.participants.get(sessionId) || [];
}

// -----------------------------------------------------------------------------
// 4. Transcripts
// -----------------------------------------------------------------------------
export async function addTranscript(params: {
  sessionId: string;
  userId: string;
  participantName: string;
  text: string;
  startTimeOffsetMs?: number;
  endTimeOffsetMs?: number;
}): Promise<TranscriptItem> {
  const newTranscript: TranscriptItem = {
    id: crypto.randomUUID(),
    session_id: params.sessionId,
    user_id: params.userId,
    participant_name: params.participantName,
    text: params.text.trim(),
    timestamp: new Date().toISOString(),
    start_time_offset_ms: params.startTimeOffsetMs,
    end_time_offset_ms: params.endTimeOffsetMs,
  };

  const list = memoryStore.transcripts.get(params.sessionId) || [];
  list.push(newTranscript);
  memoryStore.transcripts.set(params.sessionId, list);

  try {
    const supabase = createAdminClient();
    await supabase.from('transcripts').insert(newTranscript);
  } catch (err) {
    // Fallback
  }

  return newTranscript;
}

export async function getTranscripts(sessionId: string): Promise<TranscriptItem[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('transcripts')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true });

    if (data && !error && data.length > 0) {
      memoryStore.transcripts.set(sessionId, data as TranscriptItem[]);
      return data as TranscriptItem[];
    }
  } catch (err) {
    // Fallback
  }

  return memoryStore.transcripts.get(sessionId) || [];
}

// -----------------------------------------------------------------------------
// 5. Results & Feedback
// -----------------------------------------------------------------------------
export async function saveResultsAndFeedback(
  resultData: Omit<GDResult, 'id' | 'created_at'>,
  feedbackData: Omit<GDFeedback, 'id' | 'created_at'>
): Promise<{ result: GDResult; feedback: GDFeedback }> {
  const now = new Date().toISOString();
  const fullResult: GDResult = {
    ...resultData,
    id: crypto.randomUUID(),
    created_at: now,
  };

  const fullFeedback: GDFeedback = {
    ...feedbackData,
    id: crypto.randomUUID(),
    created_at: now,
  };

  // Update memory
  const results = memoryStore.results.get(resultData.session_id) || [];
  const filteredResults = results.filter(r => r.user_id !== resultData.user_id);
  filteredResults.push(fullResult);
  memoryStore.results.set(resultData.session_id, filteredResults);

  const feedbacks = memoryStore.feedbacks.get(feedbackData.session_id) || [];
  const filteredFeedbacks = feedbacks.filter(f => f.user_id !== feedbackData.user_id);
  filteredFeedbacks.push(fullFeedback);
  memoryStore.feedbacks.set(feedbackData.session_id, filteredFeedbacks);

  try {
    const supabase = createAdminClient();
    await supabase
      .from('gd_results')
      .upsert(fullResult, { onConflict: 'session_id,user_id' });
    await supabase
      .from('feedback')
      .upsert(fullFeedback, { onConflict: 'session_id,user_id' });
  } catch (err) {
    // Fallback
  }

  return { result: fullResult, feedback: fullFeedback };
}

export async function getUserResultAndFeedback(sessionId: string, userId: string): Promise<{ result: GDResult | null; feedback: GDFeedback | null }> {
  try {
    const supabase = createAdminClient();
    const [resResult, fbResult] = await Promise.all([
      supabase.from('gd_results').select('*').eq('session_id', sessionId).eq('user_id', userId).single(),
      supabase.from('feedback').select('*').eq('session_id', sessionId).eq('user_id', userId).single(),
    ]);

    if (resResult.data && fbResult.data) {
      return { result: resResult.data as GDResult, feedback: fbResult.data as GDFeedback };
    }
  } catch (err) {
    // Fallback
  }

  const results = memoryStore.results.get(sessionId) || [];
  const feedbacks = memoryStore.feedbacks.get(sessionId) || [];

  const result = results.find(r => r.user_id === userId) || null;
  const feedback = feedbacks.find(f => f.user_id === userId) || null;

  return { result, feedback };
}

// -----------------------------------------------------------------------------
// 6. User Dashboard Aggregation
// -----------------------------------------------------------------------------
export async function getUserDashboardStats(userId: string): Promise<UserDashboardStats> {
  let userResults: GDResult[] = [];
  let userFeedbacks: GDFeedback[] = [];
  let hostedCount = 0;

  // Supabase fetch
  try {
    const supabase = createAdminClient();
    const { data: results } = await supabase
      .from('gd_results')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (results && results.length > 0) {
      userResults = results as GDResult[];
    }

    const { count } = await supabase
      .from('gd_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('host_id', userId);

    if (count !== null) {
      hostedCount = count;
    }
  } catch (err) {
    // Fallback to memory
  }

  if (userResults.length === 0) {
    // Check memory store
    for (const resList of memoryStore.results.values()) {
      const match = resList.find(r => r.user_id === userId);
      if (match) userResults.push(match);
    }
    for (const sess of memoryStore.sessions.values()) {
      if (sess.host_id === userId) hostedCount++;
    }
  }

  const totalGDs = userResults.length;
  const averageScore = totalGDs > 0 
    ? Math.round(userResults.reduce((acc, r) => acc + r.overall_score, 0) / totalGDs) 
    : 0;
  const bestScore = totalGDs > 0 
    ? Math.max(...userResults.map(r => r.overall_score)) 
    : 0;

  // Compute metrics averages
  const sumMetrics = userResults.reduce((acc, r) => {
    return {
      comm: acc.comm + (r.communication_score || 0),
      conf: acc.conf + (r.confidence_score || 0),
      clar: acc.clar + (r.clarity_score || 0),
      flue: acc.flue + (r.fluency_score || 0),
      rele: acc.rele + (r.relevance_score || 0),
      reas: acc.reas + (r.reasoning_score || 0),
      topi: acc.topi + (r.topic_knowledge_score || 0),
      part: acc.part + (r.participation_score || 0),
      team: acc.team + (r.teamwork_score || 0),
      lead: acc.lead + (r.leadership_score || 0),
    };
  }, { comm: 0, conf: 0, clar: 0, flue: 0, rele: 0, reas: 0, topi: 0, part: 0, team: 0, lead: 0 });

  const divisor = totalGDs || 1;
  const metrics = {
    communication: totalGDs ? Math.round(sumMetrics.comm / divisor) : 0,
    confidence: totalGDs ? Math.round(sumMetrics.conf / divisor) : 0,
    clarity: totalGDs ? Math.round(sumMetrics.clar / divisor) : 0,
    fluency: totalGDs ? Math.round(sumMetrics.flue / divisor) : 0,
    relevance: totalGDs ? Math.round(sumMetrics.rele / divisor) : 0,
    reasoning: totalGDs ? Math.round(sumMetrics.reas / divisor) : 0,
    topic_knowledge: totalGDs ? Math.round(sumMetrics.topi / divisor) : 0,
    participation: totalGDs ? Math.round(sumMetrics.part / divisor) : 0,
    teamwork: totalGDs ? Math.round(sumMetrics.team / divisor) : 0,
    leadership: totalGDs ? Math.round(sumMetrics.lead / divisor) : 0,
  };

  const recentSessions = await Promise.all(
    userResults.slice(0, 8).map(async (r) => {
      const sess = await getSessionById(r.session_id);
      return {
        sessionId: r.session_id,
        topic: sess?.topic || 'Group Discussion Session',
        date: new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        overallScore: r.overall_score,
        role: (sess?.host_id === userId ? 'Host' : 'Participant') as 'Host' | 'Participant',
        communication: r.communication_score,
        confidence: r.confidence_score,
        fluency: r.fluency_score,
      };
    })
  );

  return {
    totalGDs,
    gdsHosted: hostedCount,
    averageScore,
    bestScore,
    metrics,
    recentSessions,
  };
}
