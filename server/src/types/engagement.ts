export interface EngagementState {
  features: number[][];
  engagementScore: number;
};

export interface ParticipantEngagementData{
  id: number; //BIGSERIEL
  group_engagement_id: number;
  username: string;
  engagement_score: number;
  features: number[][]// stored as JSONB
}

export type NewParticipantEngagementData = Omit<ParticipantEngagementData, "id">;

export interface GroupEngagementData{
  id: number;
  session_id: string;
  ts: string;
  engagement_score_mean: number;
  engagement_score_sd: number;
}