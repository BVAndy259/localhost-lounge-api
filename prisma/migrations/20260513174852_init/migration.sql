-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) NOT NULL DEFAULT 'RECEPCIONISTA',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "phone_number" VARCHAR(20) NOT NULL,
    "total_reservations" INTEGER NOT NULL DEFAULT 0,
    "category" VARCHAR(20) NOT NULL DEFAULT 'NUEVO',

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Table" (
    "id" SERIAL NOT NULL,
    "table_number" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "reservation_price" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "description" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "table_id" INTEGER NOT NULL,
    "reservation_date" DATE NOT NULL,
    "reservation_time" TIME NOT NULL,
    "number_people" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    "notes" TEXT NOT NULL,
    "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plate" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Plate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chat_Session" (
    "id" SERIAL NOT NULL,
    "session_token" VARCHAR(255) NOT NULL,
    "client_id" INTEGER,
    "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Chat_Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chat_Message" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "content" TEXT NOT NULL,
    "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Chat_Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Client_email_key" ON "Client"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Client_phone_number_key" ON "Client"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "Table_table_number_key" ON "Table"("table_number");

-- CreateIndex
CREATE UNIQUE INDEX "Chat_Session_session_token_key" ON "Chat_Session"("session_token");

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "Table"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat_Session" ADD CONSTRAINT "Chat_Session_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat_Message" ADD CONSTRAINT "Chat_Message_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "Chat_Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
