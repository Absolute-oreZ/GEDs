import { RawData } from "ws";
import { EngagementState } from "../types/engagement";
import {
  createMultipleParticipantEngagementData,
  createNewGroupEngagementData,
  createNewParticipantEngagementData,
} from "../services/supabase.service";
import {
  sessionEngagements,
  sessionParticipantEngagement,
  sessionUsers,
  userEngagements,
} from "./connectionManager";
import { computeGroupEngagementAggregation } from "../utils/engagementCalculator";
import { broadcastToSession } from "./broadcastService";
import { WSEngagementPayload, WSMessage } from "../types/wsMessage";

interface HandleMessageProps {
  message: RawData;
  userId: string;
  username: string;
  sessionId: string;
}

export const handleMessage = async (props: HandleMessageProps) => {
  const { message, userId, username, sessionId } = props;
  const currEngagementState: EngagementState = JSON.parse(message.toString());
  const currParticipant : {username: string, engagementScore: number}[]= [];

  userEngagements[userId] = {
    username: username,
    group_engagement_id: 0,
    features: currEngagementState.features,
    engagement_score: currEngagementState.engagementScore,
  };

  const activeParticipants = Array.from(sessionUsers[sessionId] || [])
    .map((id) => userEngagements[id])
    .filter(Boolean);

  if (activeParticipants.length === 0) {
    return;
  }

  activeParticipants.forEach((p) => {
    currParticipant.push({
      username: p.username,
      engagementScore: p.engagement_score
    })
  })

  const { mean, sd } = computeGroupEngagementAggregation(
    activeParticipants.map((p) => ({
      engagementScore: p.engagement_score,
      features: p.features,
    }))
  );

  const groupRow = await createNewGroupEngagementData({
    session_id: sessionId,
    ts: new Date().toISOString(),
    engagement_score_mean: mean,
    engagement_score_sd: sd,
  });

  await createMultipleParticipantEngagementData(
    activeParticipants.map((p) => ({
      ...p,
      group_engagement_id: groupRow.id,
    }))
  );


  sessionEngagements[sessionId].push(groupRow);
  sessionParticipantEngagement[sessionId].push(currParticipant);

  const payload: WSMessage = {
    messageType: "GROUP_ENGAGEMENT_DATA",
    content: {
      groupData: sessionEngagements[sessionId],
      participantData: sessionParticipantEngagement[sessionId]
    },
  };

  broadcastToSession(sessionId,payload);
};
