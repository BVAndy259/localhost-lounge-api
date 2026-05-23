/*
  Warnings:

  - You are about to drop the column `reminder_sent` on the `reservations` table. All the data in the column will be lost.
  - You are about to drop the column `support_required` on the `reservations` table. All the data in the column will be lost.
  - You are about to drop the `messages` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_reservation_id_fkey";

-- AlterTable
ALTER TABLE "reservations" DROP COLUMN "reminder_sent",
DROP COLUMN "support_required";

-- DropTable
DROP TABLE "messages";
