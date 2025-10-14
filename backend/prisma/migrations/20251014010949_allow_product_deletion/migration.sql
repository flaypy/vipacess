-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_priceId_fkey";

-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "priceId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_priceId_fkey" FOREIGN KEY ("priceId") REFERENCES "prices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
