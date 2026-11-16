-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('VERIFY_EMAIL', 'PASSWORD_RESET');

-- DropIndex
DROP INDEX "email_otps_user_id_idx";

-- AlterTable
ALTER TABLE "email_otps" ADD COLUMN     "purpose" "OtpPurpose" NOT NULL DEFAULT 'VERIFY_EMAIL';

-- CreateIndex
CREATE INDEX "email_otps_user_id_purpose_idx" ON "email_otps"("user_id", "purpose");
