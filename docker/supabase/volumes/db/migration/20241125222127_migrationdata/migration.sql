/*
  Warnings:

  - The primary key for the `Answer` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Answer` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Survey` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Survey` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Answer" DROP CONSTRAINT "Answer_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" BIGSERIAL NOT NULL,
ADD CONSTRAINT "Answer_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Survey" DROP CONSTRAINT "Survey_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" BIGSERIAL NOT NULL,
ADD CONSTRAINT "Survey_pkey" PRIMARY KEY ("id");
