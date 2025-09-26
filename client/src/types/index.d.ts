export type LearningPreference = {
  id: number;
  country: string | null;
  personality: string | null;
  learningStyles: string[] | null;
};

export type User = {
  id: string;
  username: string;
  email: string;
  profilePicturePath: string | null;
  learningPreference: LearningPreference | null;
};

export type EngagementState = {
  timestamp: string;
  features: float[][];
  engagementClass: number;
};

export type Session = {
  id: string;
  channel_id: string;
  starts_at: string;
  initiated_by: string;
  ends_at?: string;
  engagement_summary?: string;
  recommendations?: string[];
  overall_engagement_score_mean?: number;
  overall_engagement_score_sd?: number;
}
