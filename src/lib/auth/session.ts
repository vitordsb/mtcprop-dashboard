import type { UserRole } from "@prisma/client";
import { jwtVerify, SignJWT, type JWTPayload } from "jose";
import type { NextResponse } from "next/server";

export const SESSION_COOKIE_NAME = "mtcprop-session";
export const SESSION_TTL_SECONDS = 60 * 60 * 12;

const SESSION_AUDIENCE = "mtcprop-admin";
const SESSION_ISSUER = "mtcprop-dashboard";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

type SessionPayload = JWTPayload & {
  email: string;
  role: UserRole;
  name: string;
};

function getAuthSecret() {
  const authSecret = process.env.AUTH_SECRET;

  if (!authSecret) {
    throw new Error(
      "AUTH_SECRET nao foi configurado. Defina a variavel no ambiente local e na Vercel.",
    );
  }

  return new TextEncoder().encode(authSecret);
}

function shouldUseSecureCookie() {
  const appUrl = process.env.APP_URL?.trim();

  if (!appUrl) {
    return process.env.NODE_ENV === "production";
  }

  try {
    const parsedUrl = new URL(appUrl);
    const isLocalHostname =
      parsedUrl.hostname === "localhost" ||
      parsedUrl.hostname === "127.0.0.1" ||
      parsedUrl.hostname === "0.0.0.0";

    if (isLocalHostname && parsedUrl.protocol === "http:") {
      return false;
    }

    return parsedUrl.protocol === "https:";
  } catch {
    return process.env.NODE_ENV === "production";
  }
}

function getBaseCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: shouldUseSecureCookie(),
    path: "/",
    priority: "high" as const,
  };
}

export async function createSessionToken(user: SessionUser) {
  return new SignJWT({
    email: user.email,
    role: user.role,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(user.id)
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setIssuedAt()
    .setJti(crypto.randomUUID())
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getAuthSecret());
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret(), {
      issuer: SESSION_ISSUER,
      audience: SESSION_AUDIENCE,
    });

    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string" ||
      typeof payload.role !== "string"
    ) {
      return null;
    }

    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export function applySessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    ...getBaseCookieOptions(),
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...getBaseCookieOptions(),
    expires: new Date(0),
    maxAge: 0,
  });
}
