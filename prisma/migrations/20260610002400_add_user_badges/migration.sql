-- CreateEnum
CREATE TYPE "BadgeType" AS ENUM ('PANTRY_PIONEER', 'RECIPE_AUTHOR', 'COMMUNITY_FAVORITE', 'HIT_MAKER');

-- CreateEnum
CREATE TYPE "BadgeTier" AS ENUM ('IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'IRIDIUM');

-- CreateTable
CREATE TABLE "user_badges" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "badge_type" "BadgeType" NOT NULL,
    "tier" "BadgeTier" NOT NULL,
    "earned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_user_id_badge_type_tier_key" ON "user_badges"("user_id", "badge_type", "tier");

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
