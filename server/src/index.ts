import express from "express";
import http from "http";
import  { WebSocketServer } from "ws";
import cors, { CorsOptions } from "cors";
import "dotenv/config";

import streamRoutes from "./routes/stream.routes";
import userRoutes from "./routes/users.routes";
import groupRoutes from "./routes/channels.routes";
import webhookRoutes from "./routes/webhook.route";
import authenticate, {
  authenticateWebSocket,
} from "./middleware/auth.middleware";
import {
  handleConnect,
  handleDisconnect,
} from "./websocket/connectionManager";
import { handleMessage } from "./websocket/handleMessage";

const PORT = process.env.PORT!;
const ORIGIN: string = process.env.CLIENT_URL!;
const app = express();
const server = http.createServer(app);
const ws = new WebSocketServer({ server });

const corsOptions: CorsOptions = {
  origin: [ORIGIN],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

app.use("/api", authenticate);
app.use("/api/users", userRoutes);
app.use("/api/stream", streamRoutes);
app.use("/api/channels", groupRoutes);
app.use("/webhook",webhookRoutes);

ws.on("connection", (connection, request) => {
  try {
    const url = new URL(request.url!, `http://${request.headers.host}`);
    const token = url.searchParams.get("token");
    const sessionId = url.searchParams.get("sessionId");

    if (!token || !sessionId) throw new Error("Missing token or session ID");

    const user = authenticateWebSocket(token);
    const userId = user.sub as string;
    const username = user.email.split("@")[0];

    handleConnect(userId, sessionId, connection);

    connection.on("message", (message) =>
      handleMessage({ message, userId, username, sessionId })
    );
    connection.on("close", () => handleDisconnect(userId));
  } catch (err) {
    console.error(err);
    throw err;
  }
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
