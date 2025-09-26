import { EngagementState, GroupEngagementData } from "./engagement";

export type WSMessageType = "GROUP_ENGAGEMENT_DATA" | "RECOMMENDATION";

export type WSEngagementPayload = {
  groupData: GroupEngagementData[];
  participantData: {
    username: string;
    engagementScore: number;
  }[][];
};

export type WSMessage =
  | { messageType: "GROUP_ENGAGEMENT_DATA"; content: WSEngagementPayload }
  | { messageType: "RECOMMENDATION"; content: string[] };
