import WebSocket from "ws";
import {
  GroupEngagementData,
  NewParticipantEngagementData,
} from "../types/engagement";

export const userConnections: { [userId: string]: WebSocket } = {};
export const userEngagements: {
  [userId: string]: NewParticipantEngagementData;
} = {};
export const sessionUsers: { [sessionId: string]: Set<string> } = {};
export const sessionEngagements: {
  [sessionId: string]: GroupEngagementData[];
} = {};
export const sessionClosedCaption: { [sessionId: string]: string[] } = {};
export const sessionRecommendations: { [sessionId: string]: string[] } = {};
export const sessionInterval: { [sessionId: string]: NodeJS.Timeout } = {};
export const sessionParticipantEngagement: {
  [sessionId: string]: { username: string; engagementScore: number }[][];
} = {};
export const sessionCaptionSummaryCache: {
  [sessionId: string]: { passLength: number; passSummary: string };
} = {};

export const handleConnect = (
  userId: string,
  sessionId: string,
  connection: WebSocket
) => {
  userConnections[userId] = connection;
  sessionUsers[sessionId].add(userId);
};

export const handleDisconnect = async (userId: string) => {
  delete userConnections[userId];
  delete userEngagements[userId];
};
