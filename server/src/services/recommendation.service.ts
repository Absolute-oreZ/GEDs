import { gemini } from "../config/gemini";
import { WSMessage } from "../types/wsMessage";
import { broadcastToSession } from "../websocket/broadcastService";
import {
  sessionCaptionSummaryCache,
  sessionClosedCaption,
  sessionRecommendations,
} from "../websocket/connectionManager";
import { getLastMinuteEngagemetnDataBySessionId } from "./supabase.service";

interface GetRecommendationProps {
  groupData: {
    numberOfParticipants: number;
    averageEngagementScore: number;
    averageEngagementSD: number;
    groupEngagementTrend: number[];
  };
  participantData: { [username: string]: number[] };
  discussionContext: string;
}

export const generateRecommendation = async (sessionId: string) => {
  const recommendations = sessionRecommendations[sessionId];
  const closedCaptionsSoFar = sessionClosedCaption[sessionId];

  const engagementDataInPastMinute =
    await getLastMinuteEngagemetnDataBySessionId(sessionId);

  const n = engagementDataInPastMinute.length;
  let numberOfParticipants: number = 0;
  let engagementScoreMeanSum: number = 0;
  let engagementScoreSDSum: number = 0;
  const groupEngagementTrend: number[] = [];
  const participantData: { [username: string]: number[] } = {};

  engagementDataInPastMinute.forEach((e) => {
    groupEngagementTrend.push(e.engagement_score_mean);
    engagementScoreMeanSum += e.engagement_score_mean;
    engagementScoreSDSum += e.engagement_score_sd;
    numberOfParticipants = Math.max(
      numberOfParticipants,
      e.participant_engagement_data.length
    );
    e.participant_engagement_data.forEach((p) => {
      if (!participantData[p.username]) {
        participantData[p.username] = [];
      }

      participantData[p.username].push(p.engagement_score);
    });
  });

  const averageEngagementScore = engagementScoreMeanSum / n;
  const averageEngagementSD = engagementScoreSDSum / n;

  let summary = "No recent discussion context available.";

  const captionLines = closedCaptionsSoFar || [];
  const currentLength = captionLines.length;

  if (!sessionCaptionSummaryCache[sessionId]) {
    sessionCaptionSummaryCache[sessionId] = { passLength: 0, passSummary: "" };
  }

  const cached = sessionCaptionSummaryCache[sessionId];

  if (cached.passLength === currentLength) {
    summary = cached.passSummary;
  } else {
    summary = await summarizeCaptionsWithGemini(captionLines);
    sessionCaptionSummaryCache[sessionId] = {
      passLength: currentLength,
      passSummary: summary,
    };
  }

  const pastMinuteEngagementata: GetRecommendationProps = {
    groupData: {
      numberOfParticipants,
      averageEngagementScore,
      averageEngagementSD,
      groupEngagementTrend,
    },
    participantData: participantData,
    discussionContext: summary,
  };

  const currentRecommendation = await getRecommendationFromGemini(
    pastMinuteEngagementata
  );

  recommendations.push(currentRecommendation);

  const payload: WSMessage = {
    messageType: "RECOMMENDATION",
    content: recommendations,
  };

  broadcastToSession(sessionId, payload);
};

const getRecommendationFromGemini = async (
  props: GetRecommendationProps
): Promise<string> => {
  const SYSTEM_INSTRUCTION = `
You are a Group Engagement Analyst AI that analyzes real-time video call engagement data.

Your job is to:
- Use group-level statistics like average engagement score and standard deviation to assess engagement trends.
- Use the recent discussion context to help guide the tone and relevance of your recommendation.
- Identify whether engagement is high, moderate, low, or fluctuating.
- Suggest concise, professional group-level strategies for improving or maintaining engagement.
- Do not mention or analyze individual participants, even if their data is available.
- Use the engagement score scale:
  - 0.00 - 0.50 = Low
  - 0.51 - 0.80 = Medium
  - 0.81 - 1.00 = High
- Respond in a single human-readable sentence.
- Do not make assumptions or generate additional data.
`;

  const CONTENTS = [
    {
      role: "user",
      parts: [
        {
          text: `
Analyze the following group engagement data from the past minute, along with the recent group discussion context. Use only the group-level statistics to assess engagement and provide a concise, group-level recommendation. Use the discussion context to make the recommendation more relevant.

Schema:
- numberOfParticipants: total participants in the call
- averageEngagementScore: mean score across participants
- averageEngagementSD: standard deviation of engagement scores
- groupEngagementTrend: engagement score trend over time (array of mean scores)
- discussionContext: recent lines from the live closed caption feed (for topic/context only)

Data:
{
  "groupData": ${JSON.stringify(props.groupData, null, 2)},
  "discussionContext": ${JSON.stringify(props.discussionContext)}
}
          `,
        },
      ],
    },
  ];

  try {
    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
      contents: CONTENTS,
    });

    if (!response.text) {
      return "Text missing in Gemini's response";
    }

    return response.text.trim();
  } catch (error) {
    console.error(error);
    return "Unable to generate recommendation, please try again later.";
  }
};

const summarizeCaptionsWithGemini = async (
  captions: string[]
): Promise<string> => {
  const SYSTEM_INSTRUCTION = `
You are a helpful assistant that summarizes live conversation transcripts.

Rules:
- Summarize the group conversation in 1-2 complete, concise, human-readable sentences.
- Focus only on what the group is discussing overall.
- Do not mention usernames or individuals.
- Do not invent content. Use only what is provided.
`;

  const transcriptText = captions
    .slice(-20)
    .join(" ")
    .replace(/[\n\r]/g, " ")
    .replace(/"/g, '\\"')
    .trim();

  if (!transcriptText || transcriptText.length === 0) {
    return "";
  }

  const CONTENTS = [
    {
      role: "user",
      parts: [
        {
          text: `Summarize this group conversation:\n\n"${transcriptText}"`,
        },
      ],
    },
  ];

  try {
    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
      contents: CONTENTS,
    });

    if (!response.text) {
      return "No summary available.";
    }

    return response.text.trim();
  } catch (error) {
    console.error("Caption summarization failed:", error);
    return "Unable to summarize discussion at this time.";
  }
};
