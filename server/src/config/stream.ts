import "dotenv/config";
import { StreamClient } from "@stream-io/node-sdk";
import { StreamChat } from "stream-chat";

const STREAM_API_KEY = process.env.STREAM_API_KEY!;
const STREAM_SECRET = process.env.STREAM_SECRET!;

export const stream = new StreamClient(STREAM_API_KEY, STREAM_SECRET);
export const chatClient = StreamChat.getInstance(
  STREAM_API_KEY,
  STREAM_SECRET
);
