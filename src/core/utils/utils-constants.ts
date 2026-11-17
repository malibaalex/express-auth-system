/**
- Defines the default port number string used by the server application.
 */
export const PORT = "4001"

export const HTTP_STATUS = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  SERVER_ERROR: 500,
} as const

export const HTTP_MSG = {
  SUCCESS: "success",
  CREATED: "created successfully",
  BAD_REQUEST: "bad request",
  UNAUTHORIZED: "unauthorized",
  FORBIDDEN: "forbidden",
  NOT_FOUND: "not found",
  METHOD_NOT_ALLOWED: "method not allowed",
  CONFLICT: "conflict",
  TOO_MANY_REQUESTS: "too many requests",
  SERVER_ERROR: "server error",

  WELCOME: "welcome to the API",
  INVALID_ROUTE: "invalid route",
  INVALID_METHOD: "invalid method",
  ALREADY_EXISTS: "already exists",
} as const

export const OTP = {
  TTL_MS: 10 * 60 * 1000,
  RESEND_COOLDOWN_MS: 60 * 1000,
  MAX_ATTEMPTS: 5,
} as const

export const ROLES = { ADMIN: "ADMIN", USER: "USER" } as const

export const PERMISSIONS = {
  USERS_READ: "users:read",
  USERS_WRITE: "users:write",
  POSTS_READ: "posts:read",
  POSTS_CREATE: "posts:create",
  POSTS_UPDATE_OWN: "posts:update:own",
  POSTS_UPDATE_ANY: "posts:update:any",
  POSTS_DELETE_OWN: "posts:delete:own",
  POSTS_DELETE_ANY: "posts:delete:any",
} as const

export type ResponseKey = keyof typeof HTTP_STATUS & keyof typeof HTTP_MSG
