ALTER TABLE "orders"
ADD COLUMN IF NOT EXISTS "client_id" INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_client_id_fkey'
  ) THEN
    ALTER TABLE "orders"
    ADD CONSTRAINT "orders_client_id_fkey"
    FOREIGN KEY ("client_id") REFERENCES "clients"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "orders_client_id_idx" ON "orders"("client_id");
