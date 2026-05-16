-- AlterTable
ALTER TABLE "reservations" ADD COLUMN     "receptionist_id" INTEGER;

-- AlterTable
ALTER TABLE "tables" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'LIBRE',
ADD COLUMN     "waiter_id" INTEGER;

-- CreateTable
CREATE TABLE "waiters" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "waiters_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tables" ADD CONSTRAINT "tables_waiter_id_fkey" FOREIGN KEY ("waiter_id") REFERENCES "waiters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_receptionist_id_fkey" FOREIGN KEY ("receptionist_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
