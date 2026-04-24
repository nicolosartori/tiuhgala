CREATE TABLE "AppConfig" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "homepageAuctionRotationSeconds" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppConfig_pkey" PRIMARY KEY ("id")
);

INSERT INTO "AppConfig" ("id", "homepageAuctionRotationSeconds", "createdAt", "updatedAt")
VALUES (1, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
