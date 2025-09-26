export interface Session {
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