import { WSMessage } from "../types/wsMessage";
import {
  userConnections,
  sessionUsers,
} from "./connectionManager";

export const broadcastToSession = (sessionId: string, payload: WSMessage) => {
  const userIds = sessionUsers[sessionId];
  if (!userIds) return;

  userIds.forEach((id) => {
    const connection = userConnections[id];
    if (connection?.readyState === WebSocket.OPEN) {
      connection.send(JSON.stringify(payload));
    }
  });
};
