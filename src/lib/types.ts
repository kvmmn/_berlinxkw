export type DecisionOwner = "advisor" | "brain";
export type DecisionStatus = "proposed" | "accepted" | "deferred";

export type IdeaMediaKind = "image" | "video" | "none";
export type IdeaStatus = "inbox" | "queued" | "used" | "archived";

export interface IdeaMedia {
  kind: IdeaMediaKind;
  url?: string;
  pathname?: string;
  mime?: string;
  size?: number;
}

export interface IdeaInput {
  id: string;
  createdAt: string;
  title: string;
  description: string;
  media: IdeaMedia[];
  tags?: string[];
  status: IdeaStatus;
  notes?: string;
}

export interface WeekMetrics {
  followers: number;
  reach: number;
  posts: number;
  engagementRate: number;
  saves: number;
  profileVisits: number;
}

/** Where the current week's Instagram metrics came from. */
export type MetricsSource = "demo" | "manual" | "import" | "meta";

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
  /** Omit or `demo` = seeded placeholder metrics — not real @berlinxkw numbers. */
  metricsSource?: MetricsSource;
  metricsUpdatedAt?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  /** LangGraph specialist that produced this assistant turn (if known). */
  agent?: string;
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

export type TabloStatus = "draft" | "listed" | "sold";

export interface TabloImage {
  url?: string;
  pathname?: string;
  mime?: string;
  size?: number;
}

export interface Tablo {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  slug: string;
  description: string;
  priceEur: number;
  status: TabloStatus;
  image: TabloImage | null;
  marketplaceUrl?: string;
  /** Instagram caption template; use {shopLink} for the public listing URL. */
  captionDraft?: string;
}

export interface AppState {
  brainMemory: string;
  weeks: Week[];
  sessions: Session[];
  decisions: Decision[];
  ideas: IdeaInput[];
  tablos: Tablo[];
}

export type StorageMode = "filesystem" | "blob" | "blob-error" | "readonly";
