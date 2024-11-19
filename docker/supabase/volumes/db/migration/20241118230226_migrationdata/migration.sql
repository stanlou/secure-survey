-- CreateTable
CREATE TABLE "Survey" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "data" JSONB NOT NULL,

    CONSTRAINT "Survey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "data" JSONB NOT NULL,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);
