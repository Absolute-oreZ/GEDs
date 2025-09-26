import { Request, Response, NextFunction } from "express";
import http from "http";
import jwt, { JwtPayload } from "jsonwebtoken";

async function authenticate(req: Request, res: Response, next: NextFunction) {
  const supabaseJWTSecret = process.env.SUPABASE_JWT_SECRET!;
  const token = getTokenFromHeader(req);

  // console.log(token);

  if (!token) throw new Error("Missing token");

  try {
    const decoded = jwt.verify(token, supabaseJWTSecret);
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export default authenticate;

export function authenticateWebSocket(token : string) {
  const supabaseJWTSecret = process.env.SUPABASE_JWT_SECRET!;

  return jwt.verify(token,supabaseJWTSecret) as JwtPayload;
}

function getTokenFromHeader(request: http.IncomingMessage): string | null {
  const authHeader = request.headers['authorization'];
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1];
}