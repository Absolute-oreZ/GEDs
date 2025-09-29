import { Request, Response } from "express";
import { createNewChannel } from "../services/supabase.service";
import { createStreamChannel } from "../services/stream.service";
import { uploadFile } from "../services/storage.service";

export const createChannel = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.sub;
    const file = (req as Request & { file?: Express.Multer.File }).file;
    const channelName = req.body.channelName;

    if (!channelName || typeof channelName !== "string") {
      throw new Error("Channel name missing");
    }

    const channelData = await createNewChannel({
      name: channelName,
      userId,
      imageFile: file
        ? {
            buffer: file.buffer,
            originalname: file.originalname,
          }
        : undefined,
    });

    await createStreamChannel(
      channelData.id,
      channelName,
      channelData.image,
      userId
    );

    res.status(200).json({
      channelId: channelData.id,
      imageUrl: channelData.image,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: (err as Error).message });
  }
};

