import { supabase } from "../config/supabase";
import { uploadFile } from "./storage.service";
import {
  GroupEngagementData,
  NewParticipantEngagementData,
  ParticipantEngagementData,
} from "../types/engagement";
import { computeOverallGroupEngagementAggregation } from "../utils/engagementCalculator";
import { User } from "../types/user";

interface CreateNewChannelProps {
  channelName: string;
  channelId: string;
  imageUrl: string;
  userId: string;
}

interface CreateSessionProps {
  id: string;
  channel_id: string;
  starts_at: string;
  initiated_by: string;
}

interface EndCurrentSessionProps {
  id: string;
  ends_at: string;
}
interface CreateNewGroupEngagementDataProps {
  session_id: string;
  ts: string;
  engagement_score_mean: number;
  engagement_score_sd: number;
}

interface CreateNewParticipantEngagementDataProps {
  group_engagement_id: number;
  username: string;
  engagement_class: number;
  features: number[][];
}

export async function createNewChannel(props: CreateNewChannelProps) {
  const { data: createdChannel, error: createChannelError } = await supabase
    .from("channel")
    .insert(props)
    .select("*")
    .single();

  if (createChannelError || !createdChannel) {
    throw createChannelError ?? new Error("No channel created");
  }

  const { error: joinChannelError } = await supabase
    .from("channel_members")
    .insert([
      { user_id: props.userId, channel_id: createdChannel.id, is_moderator: true },
    ]);

  if (joinChannelError) {
    // rollback
    await supabase.from("channel").delete().eq("id", createdChannel.id);
    throw joinChannelError;
  }
}

export async function createNewSession(props: CreateSessionProps) {
  const { error } = await supabase.from("session").insert([props]);

  if (error) {
    console.error("ERROR creating new session: ", error);
    throw error;
  }
}

export async function endCurrentSession(props: EndCurrentSessionProps) {
  const engagementsData = await getEngagmentsDataBySessionId(props.id);
  const { overallMean, overallSD } =
    computeOverallGroupEngagementAggregation(engagementsData);

  const toUpdate = {
    ends_at: props.ends_at,
    engagement_summary: "to be implemented", // TODO IMPLEMENT ENGAGEMENT SUMMARY
    overall_engagement_score_mean: overallMean,
    overall_engagement_score_sd: overallSD,
  };

  const { error } = await supabase
    .from("session")
    .update(toUpdate)
    .eq("id", props.id);

  if (error) {
    console.error("ERROR updating session: ", error);
    throw error;
  }

  return;
}

export const createNewGroupEngagementData = async (
  props: CreateNewGroupEngagementDataProps
): Promise<GroupEngagementData> => {
  const { data, error } = await supabase
    .from("group_engagement_data")
    .insert([props])
    .select()
    .single();

  if (error) {
    console.error("ERROR creatign group row: ", error);
    throw error;
  }

  return data;
};

export const createNewParticipantEngagementData = async (
  props: CreateNewParticipantEngagementDataProps
): Promise<ParticipantEngagementData> => {
  const { data, error } = await supabase
    .from("participant_engagement_data")
    .insert([props])
    .select()
    .single();

  if (error) {
    console.error("ERROR creatign participant row: ", error);
    throw error;
  }

  return data;
};

export const createMultipleParticipantEngagementData = async (
  rows: NewParticipantEngagementData[]
) => {
  const { data, error } = await supabase
    .from("participant_engagement_data")
    .insert(rows)
    .select();

  if (error) {
    console.error("ERROR creatign multiple particpant row: ", error);
    throw error;
  }

  return data;
};

const getEngagmentsDataBySessionId = async (
  sessionId: string
): Promise<GroupEngagementData[]> => {
  const { data, error } = await supabase
    .from("group_engagement_data")
    .select()
    .eq("session_id", sessionId);

  if (error) {
    console.error("ERROR getting engagement data based on sessionId: ", error);
    throw error;
  }

  return data;
};

export const getLastMinuteEngagemetnDataBySessionId = async (
  sessionId: string
) => {
  const { data, error } = await supabase
    .from("group_engagement_data")
    .select(
      `
        engagement_score_mean,
        engagement_score_sd,
        participant_engagement_data (
          username,
          engagement_score
        )
      `
    )
    .gte("ts", new Date(new Date().getTime() - 60000).toISOString()) // in last minute
    .eq("session_id", sessionId);

  if (error) {
    console.error(
      "ERROR getting last minute's  engagement data based on sessionId: ",
      error
    );
    throw error;
  }

  return data;
};

export async function getUserById(userId: string): Promise<User> {
  const { data, error } = await supabase
    .from("_user")
    .select(
      `
      id,
      email,
      username,
      profile_picture_path,
      learning_preference (
        country,
        personality,
        learning_styles
      )
      `
    )
    .eq("id", userId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}
