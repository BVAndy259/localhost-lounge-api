-- AlterTable
ALTER TABLE "reservations" ADD COLUMN     "waiter_id" INTEGER;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_waiter_id_fkey" FOREIGN KEY ("waiter_id") REFERENCES "waiters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
