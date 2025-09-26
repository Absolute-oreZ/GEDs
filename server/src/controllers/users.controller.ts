import { Request, Response } from "express";
import * as UserService from "../services/supabase.service";

export const getUserById = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.sub;
    const user = await UserService.getUserById(userId);
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user: ", err });
  }
};
