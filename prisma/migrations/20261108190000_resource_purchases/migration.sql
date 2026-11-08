ALTER TABLE "content" ADD COLUMN "is_paid" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "price" DECIMAL(10,2), ADD COLUMN "payment_qr_code_url" TEXT;
CREATE TYPE "resource_payment_method" AS ENUM ('bkash', 'nagad');
CREATE TYPE "resource_purchase_status" AS ENUM ('pending', 'approved', 'rejected');
CREATE TABLE "resource_purchases" (
  "id" TEXT NOT NULL, "content_id" TEXT NOT NULL, "user_id" TEXT NOT NULL, "amount" DECIMAL(10,2) NOT NULL,
  "method" "resource_payment_method" NOT NULL, "sender_number" TEXT NOT NULL, "transaction_id" TEXT NOT NULL,
  "status" "resource_purchase_status" NOT NULL DEFAULT 'pending', "reviewed_by" TEXT, "reviewed_at" TIMESTAMP(3),
  "rejection_reason" TEXT, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "resource_purchases_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "resource_purchases_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "resource_purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "resource_purchases_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "resource_purchases_user_id_status_idx" ON "resource_purchases"("user_id", "status");
CREATE INDEX "resource_purchases_content_id_status_idx" ON "resource_purchases"("content_id", "status");
CREATE UNIQUE INDEX "resource_purchases_transaction_id_key" ON "resource_purchases"("transaction_id");
