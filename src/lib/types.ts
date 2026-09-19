export type DecisionOwner = "advisor" | "brain";
export type DecisionStatus = "proposed" | "accepted" | "deferred";

export interface WeekMetrics {
  followers: number;
  reach: number;
  posts: number;
  engagementRate: number;
  saves: number;
  profileVisits: number;
}

export interface DailySnapshot {
  date: string;
  followers: number;
  reach: number;
  engagementRate: number;
}

export interface Week {
  id: string;
  startDate: string;
  label: string;
  metrics: WeekMetrics;
  dailySnapshots: DailySnapshot[];
  summary: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export interface DecisionEvaluation {
  score: number;
  notes: string;
  evaluatedAt: string;
}

export interface Decision {
  id: string;
  sessionId: string;
  weekId: string;
  text: string;
  owner: DecisionOwner;
  status: DecisionStatus;
  createdAt: string;
  evaluation?: DecisionEvaluation;
}

export interface Session {
  id: string;
  weekId: string;
  startedAt: string;
  messages: ChatMessage[];
  decisionIds: string[];
}

export interface AppState {
  brainMemory: string;
  weeks: Week[];
  sessions: Session[];
  decisions: Decision[];
}

export type StorageMode = "filesystem" | "blob" | "readonly";
