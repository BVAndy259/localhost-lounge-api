/*
  Warnings:

  - You are about to drop the `Chat_Message` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Chat_Session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Client` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Plate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Reservation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Table` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Chat_Message" DROP CONSTRAINT "Chat_Message_session_id_fkey";

-- DropForeignKey
ALTER TABLE "Chat_Session" DROP CONSTRAINT "Chat_Session_client_id_fkey";

-- DropForeignKey
ALTER TABLE "Reservation" DROP CONSTRAINT "Reservation_client_id_fkey";

-- DropForeignKey
ALTER TABLE "Reservation" DROP CONSTRAINT "Reservation_table_id_fkey";

-- DropTable
DROP TABLE "Chat_Message";

-- DropTable
DROP TABLE "Chat_Session";

-- DropTable
DROP TABLE "Client";

-- DropTable
DROP TABLE "Plate";

-- DropTable
DROP TABLE "Reservation";

-- DropTable
DROP TABLE "Table";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) NOT NULL DEFAULT 'RECEPCIONISTA',

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "phone_number" VARCHAR(20) NOT NULL,
    "total_reservations" INTEGER NOT NULL DEFAULT 0,
    "category" VARCHAR(20) NOT NULL DEFAULT 'NUEVO',

    CONSTRAINT "client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "table" (
    "id" SERIAL NOT NULL,
    "table_number" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "reservation_price" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "description" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "table_id" INTEGER NOT NULL,
    "reservation_date" DATE NOT NULL,
    "reservation_time" TIME NOT NULL,
    "number_people" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    "notes" TEXT NOT NULL,
    "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plate" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "plate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_session" (
    "id" SERIAL NOT NULL,
    "session_token" VARCHAR(255) NOT NULL,
    "client_id" INTEGER,
    "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_message" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "content" TEXT NOT NULL,
    "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "client_email_key" ON "client"("email");

-- CreateIndex
CREATE UNIQUE INDEX "client_phone_number_key" ON "client"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "table_table_number_key" ON "table"("table_number");

-- CreateIndex
CREATE UNIQUE INDEX "chat_session_session_token_key" ON "chat_session"("session_token");

-- AddForeignKey
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "table"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_session" ADD CONSTRAINT "chat_session_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "chat_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
