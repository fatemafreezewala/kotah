import "dotenv/config";
import jwt from "jsonwebtoken";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export function signAccess(payload: object): string {
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: "15m" });
}

export function signRefresh(payload: object): {
  token: string;
  jti: string;
  exp: Date;
} {
  const jti = crypto.randomUUID();
  const expSeconds = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7; // 7 days
  const token = jwt.sign({ ...payload, jti }, JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });

  return {
    token,
    jti,
    exp: new Date(expSeconds * 1000),
  };
}

export function verifyAccess(token: string) {
  return jwt.verify(token, JWT_ACCESS_SECRET);
}

export function verifyRefresh(token: string) {
  return jwt.verify(token, JWT_REFRESH_SECRET);
}
