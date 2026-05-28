/*
  Warnings:

  - The `method` column on the `Request` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."REST_METHOD" AS ENUM ('GET', 'POST', 'PUT', 'DELETE', 'PATCH');

-- AlterTable
ALTER TABLE "public"."Request" DROP COLUMN "method",
ADD COLUMN     "method" "public"."REST_METHOD" NOT NULL DEFAULT 'GET';

-- DropEnum
DROP TYPE "public"."HttpMethod";

-- CreateTable
CREATE TABLE "public"."RequestRun" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "status" INTEGER NOT NULL,
    "statusText" TEXT,
    "headers" JSONB,
    "body" JSONB,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RequestRun_requestId_key" ON "public"."RequestRun"("requestId");

-- AddForeignKey
ALTER TABLE "public"."RequestRun" ADD CONSTRAINT "RequestRun_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "public"."Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;
