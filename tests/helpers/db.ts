import { prisma } from "@/database/system/db.js"
import { Utils } from "@/core/utils/index.js"
import { ROLES } from "@/core/utils/utils-constants.js"
import type { OtpPurpose } from "@/generated/prisma/client.js"

const PREFIX = "test+"
export const TEST_PASSWORD = "secret123"
const ACCESS_COOKIE = "access_token"
const REFRESH_COOKIE = "refresh_token"

type RoleName = (typeof ROLES)[keyof typeof ROLES]

export const createUser = async (
  opts: {
    roles?: RoleName[]
    status?: boolean
    emailVerified?: boolean
    password?: string | null // null = Google-only account
    fullName?: string
  } = {},
) => {
  const {
    roles = [ROLES.USER],
    status = true,
    emailVerified = true,
    password = TEST_PASSWORD,
    fullName = "Test User",
  } = opts

  return prisma.user.create({
    data: {
      email: `${PREFIX}${crypto.randomUUID()}@example.com`,
      password: password === null ? null : await Utils.Password.hash(password),
      emailVerified,
      status,
      profile: { create: { fullName } },
      userRoles: {
        create: roles.map((name) => ({ role: { connect: { name } } })),
      },
    },
    include: { profile: true },
  })
}

type TokenUser = Awaited<ReturnType<typeof createUser>>

export const tokenFor = (user: TokenUser) =>
  Utils.Token.signAccess({
    payload: {
      userId: user.userId,
      email: user.email,
      fullName: user.profile?.fullName ?? null,
      status: user.status,
      emailVerified: user.emailVerified,
    },
  })

/** api().get(url).set(authCookie(user)) */
export const authCookie = (user: TokenUser) => ({
  Cookie: `${ACCESS_COOKIE}=${tokenFor(user)}`,
})

// ---- refresh tokens -------------------------------------------------------

export const createRefreshToken = async (userId: string) => {
  const token = Utils.Token.signRefresh({ userId })
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: Utils.Token.hashRefresh(token),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })
  return token
}

export const refreshCookie = (token: string) => ({
  Cookie: `${REFRESH_COOKIE}=${token}`,
})

export const hasRefreshToken = async (token: string) =>
  (await prisma.refreshToken.count({
    where: { tokenHash: Utils.Token.hashRefresh(token) },
  })) > 0

export const refreshCount = (userId: string) =>
  prisma.refreshToken.count({ where: { userId } })

// ---- otps -----------------------------------------------------------------

export const createOtp = (
  userId: string,
  opts: {
    code?: string
    purpose?: OtpPurpose
    expiresAt?: Date
    createdAt?: Date
    attempts?: number
  } = {},
) => {
  const {
    code = "123456",
    purpose = "VERIFY_EMAIL",
    expiresAt = new Date(Date.now() + 10 * 60 * 1000),
    createdAt = new Date(),
    attempts = 0,
  } = opts

  return prisma.emailOtp.create({
    data: {
      userId,
      purpose,
      codeHash: Utils.OtpHasher.hash(code),
      expiresAt,
      createdAt,
      attempts,
    },
  })
}

// ---- misc -----------------------------------------------------------------

export const findUser = (email: string) =>
  prisma.user.findUnique({ where: { email }, include: { profile: true } })

export const rolesOf = async (userId: string) =>
  (
    await prisma.userRole.findMany({
      where: { userId },
      select: { role: { select: { name: true } } },
    })
  ).map((r) => r.role.name)

export const createPost = (authorId: string, title = "Seed post") =>
  prisma.post.create({ data: { authorId, title, content: "Seed content" } })

export const cleanupTestUsers = async () => {
  await prisma.user.deleteMany({ where: { email: { startsWith: PREFIX } } })
}
