import pino from "pino"
import { env } from "./utils-env.js"

const isTest = env.NODE_ENV === "test"
const isDev = env.NODE_ENV === "development"
const level = isTest ? "silent" : isDev ? "debug" : "info"

const targets: pino.TransportTargetOptions[] = [
  isDev
    ? { target: "pino-pretty", level, options: { colorize: true } }
    : { target: "pino/file", level, options: { destination: 1 } }, // 1 = stdout

  {
    target: "pino-roll",
    level,
    options: {
      file: "./logs/app",
      extension: ".log",
      frequency: "daily",
      dateFormat: "yyyy-MM-dd",
      mkdir: true,
      symlink: true,
      limit: { count: 1 },
    },
  },
]

/**
- Initializes the Pino logger instance with custom transport targets, ISO timestamps, and redaction rules.
- Disables transport execution automatically during test runs to keep output clean.
 */
const logger = pino(
  {
    level,
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: [
      "req.headers.authorization",
      "req.headers.cookie",
      'res.headers["set-cookie"]',
    ],
  },
  isTest ? undefined : pino.transport({ targets }),
)

export default logger
