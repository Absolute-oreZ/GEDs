import { Request, Response } from "express";
import {
  CallCreatedEvent,
  CallEndedEvent,
  CallSessionEndedEvent,
  CallSessionStartedEvent,
  WebhookEvent,
} from "@stream-io/node-sdk";

import {
  handleCallCreatedEvent,
  handleCallEndedEvent,
  handleCallSessionEndedEvent,
  handleCallSessionStartedEvent,
  handleCloseCaptionEvent,
} from "../services/stream.service";

export const handleStreamWebhookEvent = (req: Request, res: Response) => {
  const event: WebhookEvent = req.body;

  switch (event.type) {
    case "call.created":
      handleCallCreatedEvent(event as CallCreatedEvent);
      break;
    case "call.session_started":
      handleCallSessionStartedEvent(event as CallSessionStartedEvent);
      break;
    case "call.session_ended":
      handleCallSessionEndedEvent(event as CallSessionEndedEvent);
      break;
    case "call.ended":
      handleCallEndedEvent(event as CallEndedEvent);
      break;
    case "call.closed_caption":
      handleCloseCaptionEvent(event);
      break;
    default:
      console.warn("Unhandled event type: ", event.type);
  }

  res.status(200).end();
};
