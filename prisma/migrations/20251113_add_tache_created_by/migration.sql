-- AlterTable
ALTER TABLE "taches" ADD COLUMN "createdById" TEXT;

-- Update existing records to set createdById to assignedToId
UPDATE "taches" SET "createdById" = "assignedToId" WHERE "createdById" IS NULL;

-- Make createdById NOT NULL
ALTER TABLE "taches" ALTER COLUMN "createdById" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "taches" ADD CONSTRAINT "taches_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
