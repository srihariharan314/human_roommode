-- ==============================================================================
-- IntelliGD Database Schema & Security Policies (Supabase PostgreSQL)
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- 3. GD Sessions Table
CREATE TABLE IF NOT EXISTS public.gd_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  room_code TEXT NOT NULL UNIQUE,
  topic TEXT NOT NULL,
  topic_overview TEXT,
  topic_materials JSONB,
  status TEXT NOT NULL DEFAULT 'WAITING' CHECK (status IN ('WAITING', 'ACTIVE', 'COMPLETED')),
  max_participants INTEGER DEFAULT 10,
  duration_seconds INTEGER DEFAULT 900,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  gd_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gd_sessions_room_code ON public.gd_sessions(room_code);
CREATE INDEX IF NOT EXISTS idx_gd_sessions_host_id ON public.gd_sessions(host_id);
CREATE INDEX IF NOT EXISTS idx_gd_sessions_status ON public.gd_sessions(status);

ALTER TABLE public.gd_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view GD sessions"
  ON public.gd_sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create GD sessions"
  ON public.gd_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Only host can update their GD session"
  ON public.gd_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = host_id);

-- 4. Participants Table
CREATE TABLE IF NOT EXISTS public.participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.gd_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  participant_name TEXT NOT NULL,
  participant_avatar TEXT,
  is_host BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  left_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'JOINED' CHECK (status IN ('JOINED', 'ACTIVE', 'LEFT')),
  CONSTRAINT unique_session_participant UNIQUE (session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_participants_session_id ON public.participants(session_id);
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON public.participants(user_id);

ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants in session are viewable by authenticated users"
  ON public.participants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join as participant"
  ON public.participants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participant record or host can manage"
  ON public.participants FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    auth.uid() IN (SELECT host_id FROM public.gd_sessions WHERE id = session_id)
  );

-- 5. Transcripts Table
CREATE TABLE IF NOT EXISTS public.transcripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.gd_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  participant_name TEXT NOT NULL,
  text TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  start_time_offset_ms BIGINT,
  end_time_offset_ms BIGINT
);

CREATE INDEX IF NOT EXISTS idx_transcripts_session_id ON public.transcripts(session_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_user_id ON public.transcripts(user_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_timestamp ON public.transcripts(timestamp);

ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Transcripts of session viewable by session members"
  ON public.transcripts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own transcripts only"
  ON public.transcripts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 6. GD Results Table
CREATE TABLE IF NOT EXISTS public.gd_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.gd_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  overall_score INTEGER NOT NULL,
  communication_score INTEGER NOT NULL,
  confidence_score INTEGER NOT NULL,
  clarity_score INTEGER NOT NULL,
  fluency_score INTEGER NOT NULL,
  relevance_score INTEGER NOT NULL,
  reasoning_score INTEGER NOT NULL,
  topic_knowledge_score INTEGER NOT NULL,
  participation_score INTEGER NOT NULL,
  teamwork_score INTEGER NOT NULL,
  leadership_score INTEGER NOT NULL,
  speaking_time_seconds INTEGER DEFAULT 0,
  speaking_time_formatted TEXT DEFAULT '0s',
  filler_word_count INTEGER DEFAULT 0,
  filler_words_detected JSONB DEFAULT '[]'::jsonb,
  repetition_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT unique_session_user_result UNIQUE (session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_gd_results_session_id ON public.gd_results(session_id);
CREATE INDEX IF NOT EXISTS idx_gd_results_user_id ON public.gd_results(user_id);

ALTER TABLE public.gd_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own GD results or host can view all in session"
  ON public.gd_results FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    auth.uid() IN (SELECT host_id FROM public.gd_sessions WHERE id = session_id)
  );

CREATE POLICY "System/Host can insert results"
  ON public.gd_results FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 7. Feedback Table
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.gd_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  strengths JSONB DEFAULT '[]'::jsonb,
  weaknesses JSONB DEFAULT '[]'::jsonb,
  detailed_feedback TEXT NOT NULL,
  what_did_well TEXT,
  what_could_improve TEXT,
  actionable_recommendations JSONB DEFAULT '[]'::jsonb,
  evidence_examples JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT unique_session_user_feedback UNIQUE (session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_feedback_session_id ON public.feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own feedback"
  ON public.feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert feedback"
  ON public.feedback FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 8. Realtime Enablement
ALTER PUBLICATION supabase_realtime ADD TABLE public.gd_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transcripts;
