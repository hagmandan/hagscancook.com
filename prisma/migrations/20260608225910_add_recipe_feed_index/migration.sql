-- CreateIndex
CREATE INDEX "recipes_status_deleted_at_created_at_id_idx" ON "recipes"("status", "deleted_at", "created_at", "id");
