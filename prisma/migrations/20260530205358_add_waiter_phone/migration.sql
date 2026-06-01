-- DropIndex
DROP INDEX "orders_client_id_idx";

-- AlterTable
ALTER TABLE "waiters" ADD COLUMN     "phone_number" VARCHAR(20);
