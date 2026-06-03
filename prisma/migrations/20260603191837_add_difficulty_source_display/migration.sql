-- AlterTable
ALTER TABLE "recipe_ingredients" ADD COLUMN     "display" TEXT;

-- AlterTable
ALTER TABLE "recipes" ADD COLUMN     "difficulty" TEXT,
ADD COLUMN     "source_attribution" TEXT,
ADD COLUMN     "source_url" TEXT;
