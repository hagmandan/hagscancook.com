-- CreateEnum
CREATE TYPE "CoverImageStatus" AS ENUM ('pending_approval', 'approved', 'rejected');

-- AlterTable
ALTER TABLE "recipes" ADD COLUMN     "cover_image_status" "CoverImageStatus";
