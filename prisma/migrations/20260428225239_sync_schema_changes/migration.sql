/*
  Warnings:

  - You are about to drop the column `installments` on the `Carne` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `carneId` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `dueDate` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `installment` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `VisitLog` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `VisitLog` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `VisitLog` table. All the data in the column will be lost.
  - You are about to drop the column `visitedAt` on the `VisitLog` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[installmentId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `installmentId` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Made the column `paidAmount` on table `Payment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `paidAt` on table `Payment` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `type` to the `VisitLog` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RouteMode" AS ENUM ('AUTO', 'MANUAL');

-- CreateEnum
CREATE TYPE "InstallmentStatus" AS ENUM ('PENDING', 'PAID', 'LATE', 'PARTIAL', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VisitType" AS ENUM ('CHECKIN', 'PAYMENT', 'NAO_ATENDEU', 'REMARCADO');

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_carneId_fkey";

-- AlterTable
ALTER TABLE "Carne" DROP COLUMN "installments";

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "routeMode" "RouteMode" NOT NULL DEFAULT 'AUTO',
ADD COLUMN     "routeOrder" INTEGER,
ADD COLUMN     "zone" TEXT;

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "amount",
DROP COLUMN "carneId",
DROP COLUMN "dueDate",
DROP COLUMN "installment",
DROP COLUMN "status",
ADD COLUMN     "installmentId" TEXT NOT NULL,
ALTER COLUMN "paidAmount" SET NOT NULL,
ALTER COLUMN "paidAt" SET NOT NULL,
ALTER COLUMN "paidAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "pin" TEXT,
ADD COLUMN     "zone" TEXT;

-- AlterTable
ALTER TABLE "VisitLog" DROP COLUMN "latitude",
DROP COLUMN "longitude",
DROP COLUMN "status",
DROP COLUMN "visitedAt",
ADD COLUMN     "lat" DOUBLE PRECISION,
ADD COLUMN     "lng" DOUBLE PRECISION,
ADD COLUMN     "nextVisitDate" TIMESTAMP(3),
ADD COLUMN     "type" "VisitType" NOT NULL;

-- DropEnum
DROP TYPE "VisitStatus";

-- CreateTable
CREATE TABLE "Installment" (
    "id" TEXT NOT NULL,
    "carneId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "InstallmentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Installment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Installment_carneId_numero_key" ON "Installment"("carneId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_installmentId_key" ON "Payment"("installmentId");

-- AddForeignKey
ALTER TABLE "Installment" ADD CONSTRAINT "Installment_carneId_fkey" FOREIGN KEY ("carneId") REFERENCES "Carne"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_installmentId_fkey" FOREIGN KEY ("installmentId") REFERENCES "Installment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
