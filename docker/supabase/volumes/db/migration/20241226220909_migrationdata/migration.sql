/*
  Warnings:

  - The `status` column on the `Answer` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Nullifier` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Survey` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Status" AS ENUM ('PENDING', 'SUCCEEDED');

-- AlterTable
ALTER TABLE "Answer" DROP COLUMN "status",
ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Nullifier" DROP COLUMN "status",
ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Survey" DROP COLUMN "status",
ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'PENDING';
