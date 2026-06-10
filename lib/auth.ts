import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const AUTH_COOKIE = "job-agent-auth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE);
  return authCookie?.value === "authenticated";
}

export async function setAuthenticated(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
  });
}

export function verifyWebhookSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const expectedSecret = process.env.N8N_WEBHOOK_SECRET;

  if (!expectedSecret) return false;
  if (!authHeader) return false;

  const token = authHeader.replace("Bearer ", "");
  return token === expectedSecret;
}

export function verifyCallbackSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const expectedSecret = process.env.VERCEL_CALLBACK_SECRET;

  if (!expectedSecret) return false;
  if (!authHeader) return false;

  const token = authHeader.replace("Bearer ", "");
  return token === expectedSecret;
}
