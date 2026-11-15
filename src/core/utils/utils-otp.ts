import { argon2Sync, randomBytes, timingSafeEqual } from "crypto"

class OtpHasherUtil {
  private readonly config = {
    parallelism: 4,
    tagLength: 32,
    memory: 19456,
    passes: 2,
  } as const

  /**
   * Generates a secure Argon2id hash for a given code using a random salt.
   * Returns a formatted string containing the salt, configuration parameters, and derived key.
   */
  hash(code: string): string {
    const salt = randomBytes(16)
    const derivedKey = argon2Sync("argon2id", {
      message: code,
      nonce: salt,
      ...this.config,
    })
    return [
      salt.toString("hex"),
      this.config.parallelism,
      this.config.memory,
      this.config.passes,
      derivedKey.toString("hex"),
    ].join("$")
  }

  /**
   * Verifies an input code against a stored Argon2id hash using timing-safe comparison.
   * Extracts embedded parameters and salt from the stored hash string to recompute the derived key.
   */
  verify(code: string, stored: string): boolean {
    const [saltHex, parallelism, memory, passes, hashHex] = stored.split("$")
    const salt = Buffer.from(saltHex, "hex")
    const hash = Buffer.from(hashHex, "hex")

    const derivedKey = argon2Sync("argon2id", {
      message: code,
      nonce: salt,
      parallelism: Number(parallelism),
      memory: Number(memory),
      passes: Number(passes),
      tagLength: this.config.tagLength,
    })

    return timingSafeEqual(derivedKey, hash)
  }
}

export default OtpHasherUtil