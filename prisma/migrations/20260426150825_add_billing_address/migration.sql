-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "billingAddress" TEXT,
ADD COLUMN     "billingAddressSame" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "billingCity" TEXT,
ADD COLUMN     "billingComplement" TEXT,
ADD COLUMN     "billingLatitude" DOUBLE PRECISION,
ADD COLUMN     "billingLongitude" DOUBLE PRECISION,
ADD COLUMN     "billingNeighborhood" TEXT,
ADD COLUMN     "billingNumber" TEXT,
ADD COLUMN     "billingReference" TEXT,
ADD COLUMN     "billingState" TEXT,
ADD COLUMN     "billingZipCode" TEXT;
