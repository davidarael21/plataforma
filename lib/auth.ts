import { SignJWT, jwtVerify } from "jose"
import type { UserRole } from "@prisma/client"

export const AUTH_COOKIE_NAME = "auth_token"

type AuthTokenPayloadV1 = {
  sub: string
  email: string
  name: string
  role: UserRole
}

type AuthTokenPayloadV2 = {
  sub: string
  username: string
  name: string
  role: UserRole
}

export type AuthTokenPayload = AuthTokenPayloadV2

function getJwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error("Missing JWT_SECRET env var")
  return new TextEncoder().encode(secret)
}

export async function signAuthToken(payload: AuthTokenPayloadV2) {
  const secret = getJwtSecret()
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret)
}

export async function verifyAuthToken(token: string) {
  const secret = getJwtSecret()
  const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] })

  const raw = payload as unknown as (AuthTokenPayloadV1 | AuthTokenPayloadV2) & { exp: number; iat: number }
  const username = (raw as any).username ?? (raw as any).email

  return {
    sub: raw.sub,
    username,
    name: raw.name,
    role: raw.role,
    exp: raw.exp,
    iat: raw.iat
  }
}