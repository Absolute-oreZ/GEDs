import 'dotenv/config'
import { StreamClient } from "@stream-io/node-sdk";

const STREAM_API_KEY = process.env.STREAM_API_KEY!;
const STREAM_SECRET = process.env.STREAM_SECRET!;

export const stream = new StreamClient(STREAM_API_KEY,STREAM_SECRET);