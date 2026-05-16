/*
  Warnings:

  - You are about to drop the `chat_message` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `chat_session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `client` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `plate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reservation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `table` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "chat_message" DROP CONSTRAINT "chat_message_session_id_fkey";

-- DropForeignKey
ALTER TABLE "chat_session" DROP CONSTRAINT "chat_session_client_id_fkey";

-- DropForeignKey
ALTER TABLE "reservation" DROP CONSTRAINT "reservation_client_id_fkey";

-- DropForeignKey
ALTER TABLE "reservation" DROP CONSTRAINT "reservation_table_id_fkey";

-- DropTable
DROP TABLE "chat_message";

-- DropTable
DROP TABLE "chat_session";

-- DropTable
DROP TABLE "client";

-- DropTable
DROP TABLE "plate";

-- DropTable
DROP TABLE "reservation";

-- DropTable
DROP TABLE "table";

-- DropTable
DROP TABLE "user";

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) NOT NULL DEFAULT 'RECEPCIONISTA',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "phone_number" VARCHAR(20) NOT NULL,
    "total_reservations" INTEGER NOT NULL DEFAULT 0,
    "category" VARCHAR(20) NOT NULL DEFAULT 'NUEVO',

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tables" (
    "id" SERIAL NOT NULL,
    "table_number" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "reservation_price" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "description" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "table_id" INTEGER NOT NULL,
    "reservation_date" DATE NOT NULL,
    "reservation_time" TIME NOT NULL,
    "number_people" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    "notes" TEXT NOT NULL,
    "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plates" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "plates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" SERIAL NOT NULL,
    "session_token" VARCHAR(255) NOT NULL,
    "client_id" INTEGER,
    "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "content" TEXT NOT NULL,
    "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clients_email_key" ON "clients"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clients_phone_number_key" ON "clients"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "tables_table_number_key" ON "tables"("table_number");

-- CreateIndex
CREATE UNIQUE INDEX "chat_sessions_session_token_key" ON "chat_sessions"("session_token");

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
