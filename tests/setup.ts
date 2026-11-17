process.env.NODE_ENV = "test"
process.env.PORT = "0"

// Google OAuth
process.env.GOOGLE_CLIENT_ID ??= "test-google-client-id"
process.env.GOOGLE_CLIENT_SECRET ??= "test-google-client-secret"
process.env.GOOGLE_CALLBACK_URL ??= "http://localhost:3000/auth/google/callback"
process.env.GOOGLE_REDIRECT_PATH ??= "/auth/google/redirect"
process.env.APP_URL ??= "http://localhost:3000"

// Resend
process.env.RESEND_API_KEY ??= "test-resend-api-key"
process.env.EMAIL_FROM ??= "onboarding@example.com"

// Database
process.env.POSTGRES_USER ??= "postgres"
process.env.POSTGRES_PASSWORD ??= "postgres"
process.env.POSTGRES_DB ??= "dev_db"

// Locally, always use the dev_db container. In CI, use the workflow's DATABASE_URL.
process.env.DATABASE_URL = process.env.CI
  ? process.env.DATABASE_URL
  : "postgresql://postgres:postgres@127.0.0.1:5432/dev_db?schema=public"

// JWT
process.env.JWT_ACCESS_SECRET_KEY ??= "test-access-secret"
process.env.JWT_ACCESS_SECRET_KEY_EXPIRES_IN ??= "900"

process.env.JWT_REFRESH_SECRET_KEY ??= "test-refresh-secret"
process.env.JWT_REFRESH_SECRET_KEY_EXPIRES_IN ??= "604800"

// Cookies
process.env.COOKIE_SECRET ??= "test-cookie-secret"

// Seed (only read by prisma/seed.ts, listed so env validation never trips)
process.env.SEED_ADMIN_EMAIL ??= "admin@example.com"
process.env.SEED_ADMIN_NAME ??= "Test Admin"

// Stripe: dummy values, tests must never call Stripe
// process.env.STRIPE_SECRET_KEY ??= "sk_test_dummy"
// process.env.STRIPE_WEBHOOK_SECRET ??= "whsec_dummy"
