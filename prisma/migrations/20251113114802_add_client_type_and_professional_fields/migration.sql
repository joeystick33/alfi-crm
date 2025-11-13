-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('PARTICULIER', 'PROFESSIONNEL');

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "activitySector" TEXT,
ADD COLUMN     "annualRevenue" DECIMAL(15,2),
ADD COLUMN     "clientType" "ClientType" NOT NULL DEFAULT 'PARTICULIER',
ADD COLUMN     "companyCreationDate" TIMESTAMP(3),
ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "legalForm" TEXT,
ADD COLUMN     "numberOfEmployees" INTEGER,
ADD COLUMN     "siret" TEXT;

-- CreateIndex
CREATE INDEX "clients_clientType_idx" ON "clients"("clientType");

-- CreateIndex
CREATE INDEX "clients_cabinetId_clientType_status_idx" ON "clients"("cabinetId", "clientType", "status");
