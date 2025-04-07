-- CreateTable
CREATE TABLE "betatesters" (
    "id" TEXT NOT NULL,
    "email" TEXT,

    CONSTRAINT "betatesters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "betatesters_email_key" ON "betatesters"("email");
