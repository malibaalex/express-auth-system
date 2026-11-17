import { vi } from "vitest"
import { Utils } from "@/core/utils/index.js"

export const mockMailer = () => {
  const spy = vi
    .spyOn(Utils.Mailer, "sendOtpEmail")
    .mockResolvedValue(undefined)
  return {
    spy,
    /** The most recent code sent to this email */
    codeFor: (email: string) =>
      spy.mock.calls.filter((call) => call[0] === email).at(-1)?.[1],
  }
}
