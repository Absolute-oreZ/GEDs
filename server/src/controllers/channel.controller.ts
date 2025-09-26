import { Request, Response } from "express";
import { createNewChannel } from "../services/supabase.service";
import { createStreamChannel } from "../services/stream.service";
import { uploadFile } from "../services/storage.service";

export const createChannel = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.sub;
    const file = (req as Request & { file: File }).file;
    const channelName = req.body.channelName;

    if (!channelName || typeof channelName !== "string") {
      throw new Error("Channel name missing");
    }

    let imageUrl;

    if (file) {
      imageUrl = await uploadFile(file.originalname, file.buffer);
    } else {
      imageUrl = `https://placehold.co/600x400?text=${channelName.charAt(0)}`;
    }

    const channelId = await createStreamChannel(channelName, imageUrl, userId);
    await createNewChannel({ channelName, channelId, imageUrl, userId });

    res.status(200);
  } catch (err) {
    console.error(err);
    throw err;
  }
};
