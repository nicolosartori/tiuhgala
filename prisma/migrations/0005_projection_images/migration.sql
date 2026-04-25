CREATE TABLE "ProjectionImage" (
    "id" SERIAL NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectionImage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectionImage_storageKey_key" ON "ProjectionImage"("storageKey");
