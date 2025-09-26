import { EngagementState, GroupEngagementData } from "../types/engagement";

export function computeGroupEngagementAggregation(
  participantData: EngagementState[]
) {
  const engagementClass: number[] = participantData.map(
    (p) => p.engagementScore
  );
  
  const n = participantData.length;
  const mean = computeMean(engagementClass, n);
  const sd = computeSD(engagementClass,mean,n);
  
  return { mean, sd };
}

export function computeOverallGroupEngagementAggregation(
  engagementsData: GroupEngagementData[]
) {
  const n = engagementsData.length;
  const engagementScoreMeanArr: number[] = engagementsData.map(
    (p) => p.engagement_score_mean
  );
  const engagementScoreSDArr: number[] = engagementsData.map(
    (p) => p.engagement_score_sd
  );
  
  const overallMean = computeMean(engagementScoreMeanArr,n)
  const overallSD = computeMean(engagementScoreSDArr,n)

  return { overallMean,overallSD };
}

function computeMean(arr: number[], n: number) {
  return arr.reduce((a, b) => a + b, 0) / n;
}

function computeSD(arr: number[], mean: number, n: number) {
  return Math.sqrt(
    arr.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n
  );
}
