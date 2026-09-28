-- CreateEnum
CREATE TYPE "olympiad_registration_type" AS ENUM ('free', 'paid');

-- CreateEnum
CREATE TYPE "olympiad_registration_status" AS ENUM ('pending_payment', 'pending_approval', 'confirmed', 'rejected');

-- CreateEnum
CREATE TYPE "payment_method" AS ENUM ('bkash');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('pending', 'approved', 'rejected');

-- AlterTable
ALTER TABLE "olympiad_registrations" ADD COLUMN     "confirmed_at" TIMESTAMP(3),
ADD COLUMN     "status" "olympiad_registration_status" NOT NULL DEFAULT 'confirmed';

-- AlterTable
ALTER TABLE "olympiads" ADD COLUMN     "registration_fee" DECIMAL(10,2),
ADD COLUMN     "registration_type" "olympiad_registration_type" NOT NULL DEFAULT 'free';

-- CreateTable
CREATE TABLE "olympiad_payments" (
    "id" TEXT NOT NULL,
    "olympiad_id" TEXT NOT NULL,
    "registration_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "method" "payment_method" NOT NULL DEFAULT 'bkash',
    "amount" DECIMAL(10,2) NOT NULL,
    "sender_number" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "status" "payment_status" NOT NULL DEFAULT 'pending',
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "olympiad_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "olympiad_payments_olympiad_id_status_idx" ON "olympiad_payments"("olympiad_id", "status");

-- CreateIndex
CREATE INDEX "olympiad_payments_registration_id_status_idx" ON "olympiad_payments"("registration_id", "status");

-- CreateIndex
CREATE INDEX "olympiad_payments_transaction_id_idx" ON "olympiad_payments"("transaction_id");

-- CreateIndex
CREATE INDEX "olympiad_payments_user_id_idx" ON "olympiad_payments"("user_id");

-- CreateIndex
CREATE INDEX "olympiad_registrations_olympiad_id_status_idx" ON "olympiad_registrations"("olympiad_id", "status");

-- AddForeignKey
ALTER TABLE "olympiad_payments" ADD CONSTRAINT "olympiad_payments_olympiad_id_fkey" FOREIGN KEY ("olympiad_id") REFERENCES "olympiads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "olympiad_payments" ADD CONSTRAINT "olympiad_payments_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "olympiad_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "olympiad_payments" ADD CONSTRAINT "olympiad_payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "olympiad_payments" ADD CONSTRAINT "olympiad_payments_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
