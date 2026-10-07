export type SessionStatus = 'WAITING' | 'ACTIVE' | 'COMPLETED';

export type ParticipantStatus = 'JOINED' | 'ACTIVE' | 'LEFT';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  created_at?: string;
}

export interface TopicPrepMaterial {
  overview: string;
  keyPoints: string[];
  argumentsFor: string[];
  argumentsAgainst: string[];
  realWorldExamples: string[];
  importantFacts: string[];
  counterarguments: string[];
  keywords: string[];
  conclusion: string;
}

export interface GDSession {
  id: string;
  host_id: string;
  room_code: string;
  topic: string;
  topic_overview?: string | null;
  topic_materials?: TopicPrepMaterial | null;
  status: SessionStatus;
  max_participants: number;
  duration_seconds: number;
  started_at?: string | null;
  ended_at?: string | null;
  gd_deadline?: string | null;
  current_speaker_id?: string | null;
  current_turn_number?: number;
  turn_status?: 'waiting' | 'active' | 'speaking' | 'completed' | 'ended';
  created_at: string;
  host?: UserProfile;
}

export interface Participant {
  id: string;
  session_id: string;
  user_id: string;
  participant_name: string;
  participant_avatar?: string | null;
  is_host: boolean;
  joined_at: string;
  left_at?: string | null;
  status: ParticipantStatus;
  is_speaking?: boolean;
  is_muted?: boolean;
}

export interface TranscriptItem {
  id: string;
  session_id: string;
  user_id: string;
  participant_name: string;
  text: string;
  transcript?: string;
  timestamp: string;
  turn_number?: number;
  mode?: 'speech' | 'text';
  created_at?: string;
  start_time_offset_ms?: number;
  end_time_offset_ms?: number;
}

export interface FillerWordStats {
  word: string;
  count: number;
}

export interface EvidenceItem {
  claimOrArea: string;
  quote: string;
  aiObservation: string;
  suggestion: string;
}

export interface StructuredStrength {
  title: string;
  evidence: string;
  impact: string;
}

export interface StructuredWeakness {
  title: string;
  evidence: string;
  impact: string;
  improvement: string;
}

export interface ArgumentAnalysisItem {
  claim: string;
  reasoning: string;
  examples?: string;
  relevance: 'Highly Relevant' | 'Relevant' | 'Partially Relevant' | 'Off-topic' | string;
  structureQuality: 'Strong' | 'Moderate' | 'Unsupported' | string;
}

export interface ContextualResponseItem {
  respondingTo: string;
  nature: 'Agreement' | 'Counterargument' | 'Extension' | 'Synthesis' | string;
  quote: string;
  assessment: string;
}

export interface RepetitionDetail {
  repeatedIdea: string;
  occurrences: number;
  recommendation: string;
}

export interface ActionPlanItem {
  area: string;
  technique: string;
  example: string;
}

export interface GDResult {
  id: string;
  session_id: string;
  user_id: string;
  participant_name?: string;
  overall_score: number;
  communication_score: number;
  confidence_score: number;
  clarity_score: number;
  fluency_score: number;
  relevance_score: number;
  reasoning_score: number;
  topic_knowledge_score: number;
  participation_score: number;
  teamwork_score: number;
  leadership_score: number;
  speaking_time_seconds: number;
  speaking_time_formatted: string;
  speaking_turns?: number;
  average_turn_seconds?: number;
  is_speaking_time_estimated?: boolean;
  participation_level?: 'High' | 'Medium' | 'Low' | 'Minimal' | string;
  filler_word_count: number;
  filler_words_detected: FillerWordStats[];
  repetition_count: number;
  confidence_in_evaluation?: 'High' | 'Medium' | 'Low' | 'Insufficient evidence' | string;
  created_at: string;
}

export interface GDFeedback {
  id: string;
  session_id: string;
  user_id: string;
  discussion_summary?: string;
  key_arguments?: string[];
  strengths: Array<string | StructuredStrength>;
  weaknesses: Array<string | StructuredWeakness>;
  detailed_feedback: string;
  what_did_well: string;
  what_could_improve: string;
  actionable_recommendations: string[];
  evidence_examples: EvidenceItem[];
  argument_analysis?: ArgumentAnalysisItem[];
  contextual_responses?: ContextualResponseItem[];
  repetition_details?: RepetitionDetail[];
  action_plan?: ActionPlanItem[];
  confidence_in_evaluation?: 'High' | 'Medium' | 'Low' | 'Insufficient evidence' | string;
  created_at: string;
}

export interface ParticipantScoreOverview {
  participant: Participant;
  result: GDResult | null;
  feedback: GDFeedback | null;
}

export interface ParticipantAnalysisResponse {
  result: GDResult;
  feedback: GDFeedback;
}

export interface UserDashboardStats {
  totalGDs: number;
  gdsHosted: number;
  averageScore: number;
  bestScore: number;
  metrics: {
    communication: number;
    confidence: number;
    clarity: number;
    fluency: number;
    relevance: number;
    reasoning: number;
    topic_knowledge: number;
    participation: number;
    teamwork: number;
    leadership: number;
  };
  recentSessions: {
    sessionId: string;
    topic: string;
    date: string;
    overallScore: number;
    role: 'Host' | 'Participant';
    communication: number;
    confidence: number;
    fluency: number;
  }[];
}
