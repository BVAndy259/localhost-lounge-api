-- AlterTable: Make client_id unique in chat_sessions
-- PostgreSQL treats NULLs as distinct in unique constraints, so multiple NULLs are allowed.
-- If there are existing duplicates with the same non-null client_id, this migration will fail.
-- Run the following query first to find duplicates:
-- SELECT client_id, COUNT(*) FROM chat_sessions WHERE client_id IS NOT NULL GROUP BY client_id HAVING COUNT(*) > 1;

CREATE UNIQUE INDEX "chat_sessions_client_id_key" ON "chat_sessions"("client_id");

ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_client_id_key" UNIQUE USING INDEX "chat_sessions_client_id_key";
