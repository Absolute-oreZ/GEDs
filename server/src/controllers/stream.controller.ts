import { Request, Response } from "express";
import {exportToken,upsertUser} from "../services/stream.service";

export const exportStreamToken = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.sub;
    const streamToken = exportToken(userId);

    res.send(streamToken);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to query all users" });
  }
};

export const upsertStreamUser = async (req:Request, res: Response) => {
  try {
    const userId = req.body.userId;
    const username = req.body.username;
    
    await upsertUser(userId,username);
  } catch (err) {
    console.error(err);
    res.status(500).json({error: "Failed to upsert user at Stream"})
  }
}