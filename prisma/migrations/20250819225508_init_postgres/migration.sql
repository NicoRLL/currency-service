-- CreateTable
CREATE TABLE "public"."FxLog" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fromCurrency" TEXT NOT NULL,
    "toCurrency" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "received" DOUBLE PRECISION NOT NULL,
    "provider" TEXT NOT NULL,
    "providerTimestamp" TEXT NOT NULL,
    "clientIp" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "FxLog_pkey" PRIMARY KEY ("id")
);
