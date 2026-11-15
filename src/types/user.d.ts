import type { Prisma } from "@/generated/prisma/client.js"

export type UserWithProfile = Prisma.UserGetPayload<{
  include: { profile: true }
}>

export type ProviderWithUser = Prisma.ProviderGetPayload<{
  include: { user: { include: { profile: true } } }
}>

export type RefreshTokenWithUser = Prisma.RefreshTokenGetPayload<{
  include: { user: { include: { profile: true } } }
}>

export type AccessTokenData = {
  userId: string
  email: string
  fullName: string | null
  status: boolean
  emailVerified: boolean
}

export type JwtPayload = {
  payload: AccessTokenData
  iat: number
  exp: number
}

export type AccessPayload = Omit<JwtPayload, "iat" | "exp">

export type RefreshPayload = { userId: string }

export type VerifiedRefreshPayload = RefreshPayload & {
  iat: number
  exp: number
}
