import {
  CallCreatedEvent,
  CallEndedEvent,
  CallSessionEndedEvent,
  CallSessionStartedEvent,
  ClosedCaptionEvent,
  StreamChannel,
  UserRequest,
} from "@stream-io/node-sdk";

import { chatClient, stream } from "../config/stream";
import { extractCallIdFromCid } from "../utils/streamUtil";
import {
  sessionCaptionSummaryCache,
  sessionClosedCaption,
  sessionEngagements,
  sessionInterval,
  sessionParticipantEngagement,
  sessionRecommendations,
  sessionUsers,
} from "../websocket/connectionManager";
import { createNewSession, endCurrentSession } from "./supabase.service";
import { generateRecommendation } from "./recommendation.service";

export function exportToken(userId: string) {
  return stream.generateUserToken({ user_id: userId });
}

export async function upsertUser(userId: string, username: string) {
  const newUser: UserRequest = {
    id: userId,
    role: "user",
    name: username,
    image: `https://placehold.co/400?text=${username.charAt(0)}`,
  };
  await stream.upsertUsers([newUser]);
}

export async function createStreamChannel(
  channelId: string,
  channelName: string,
  imageUrl: string,
  userId: string
) {
  const streamChannel = chatClient.channel("messaging",channelId,{
    // @ts-ignore
    name: channelName,
    image: imageUrl,
    members: [userId],
    created_by_id: userId
  })

  await streamChannel.create();
}

export const handleCallCreatedEvent = async (event: CallCreatedEvent) => {
  const call = event.call;
  const sessionId = extractCallIdFromCid(event.call_cid);
  const userSet = new Set<string>();

  await stream.video
    .call("default", sessionId)
    .startClosedCaptions({ language: "en" });

  await createNewSession({
    id: sessionId,
    initiated_by: call.created_by.id,
    starts_at: new Date(event.created_at).toISOString(),
    channel_id: call.custom.channelId,
  });

  event.members.forEach((m) => {
    userSet.add(m.user_id);
  });

  sessionUsers[sessionId] = userSet;
  sessionParticipantEngagement[sessionId] = [];
};

export const handleCallSessionStartedEvent = (
  event: CallSessionStartedEvent
) => {
  const sessionId = extractCallIdFromCid(event.call_cid);
  const interval = setInterval(() => generateRecommendation(sessionId), 60000);

  sessionClosedCaption[sessionId] = [];
  sessionEngagements[sessionId] = [];
  sessionInterval[sessionId] = interval;
  sessionRecommendations[sessionId] = [];
};

export const handleCallSessionEndedEvent = async (
  event: CallSessionEndedEvent
) => {
  const sessionId = extractCallIdFromCid(event.call_cid);
  await stream.video.call("default", sessionId).end();
};

export const handleCallEndedEvent = async (event: CallEndedEvent) => {
  const sessionId = extractCallIdFromCid(event.call_cid);

  await endCurrentSession({
    id: sessionId,
    ends_at: new Date(event.created_at).toISOString(),
  });

  clearInterval(sessionInterval[sessionId]);

  delete sessionUsers[sessionId];
  delete sessionInterval[sessionId];
  delete sessionEngagements[sessionId];
  delete sessionClosedCaption[sessionId];
  delete sessionRecommendations[sessionId];
  delete sessionCaptionSummaryCache[sessionId];
};

export const handleCloseCaptionEvent = async (event: ClosedCaptionEvent) => {
  const sessionId = extractCallIdFromCid(event.call_cid);
  sessionClosedCaption[sessionId].push(
    event.closed_caption.user.name + ": " + event.closed_caption.text
  );
};
