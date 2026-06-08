-- CreateIndex
CREATE INDEX "recipes_author_id_status_deleted_at_idx" ON "recipes"("author_id", "status", "deleted_at");
