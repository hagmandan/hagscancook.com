# Image Upload Moderation Design

**Date:** 2026-06-09
**Status:** Approved

## Overview

Re-enable user-uploaded cover images on recipes behind a pre-moderation gate. Images are hidden from the public until an admin explicitly approves them. Users see in-app status on their recipe edit page. Legal terms are updated to cover image-specific acceptable use.

## Data Model

Add a `CoverImageStatus` enum and field to the `Recipe` table.

```prisma
enum CoverImageStatus {
  pending_approval
  approved
  rejected
}

// on Recipe model:
coverImageStatus CoverImageStatus? @map("cover_image_status")
```

| Value | Meaning |
|---|---|
| `null` | No image uploaded |
| `pending_approval` | Uploaded, awaiting admin review |
| `approved` | Visible publicly |
| `rejected` | Hidden; user sees in-app rejection notice |

**Invariant:** Any time `coverImageUrl` changes in a save/update action, `coverImageStatus` is reset to `pending_approval` — even if the recipe previously had an approved image. Re-uploads always go back through the queue.

## Terms of Service Update

Add a new **"Image Uploads"** section to `src/app/(legal)/terms/page.tsx`, inserted after the existing "User-Generated Content" section (§3) and before "Acceptable Use" (§4).

Content:
- Images must be original content the user owns or has rights to use
- Images must be food/cooking-related and appropriate for all audiences
- Prohibited: adult content, hate imagery, violence, copyrighted material the user doesn't own
- All images go through moderation review before appearing publicly
- We reserve the right to reject or remove any image at our discretion

## Upload Flow Changes

### Consent checkbox (`src/components/recipe-form/`)

Before the file input is enabled, users must check: *"I confirm this image is my own and complies with our [content guidelines](/terms)."*

- File input is `disabled` until the checkbox is checked
- Checkbox state is local React state — users don't re-confirm on every upload attempt within a session
- Checking the box once enables the input for the remainder of the edit session

### Status indicator

After a recipe is saved with an image, the edit page shows a status badge near the image preview. Status is server-rendered from saved recipe data (not client state), so it's visible only after a save.

| Status | Message shown |
|---|---|
| `pending_approval` | "Image under review — it will appear publicly once approved" |
| `approved` | No badge (image renders normally) |
| `rejected` | "Image rejected — please upload a different image" + upload UI re-enabled |

## Admin Image Queue

New page: `/admin/images`

- Added to the existing admin navigation
- Lists all recipes where `coverImageStatus = pending_approval`
- No pagination (queue expected to remain small)

Each row shows:
- Cover image (rendered with `next/image`)
- Recipe title (linked to live recipe page)
- Author display name
- Upload date (using `Recipe.updatedAt` as proxy — no separate `imageUploadedAt` field)
- **Approve** and **Reject** buttons

Actions live in `src/lib/actions/admin.ts`:
- `approveRecipeImage(recipeId)` — sets `coverImageStatus = approved`, revalidates recipe page and `/admin/images`
- `rejectRecipeImage(recipeId)` — sets `coverImageStatus = rejected`, revalidates `/admin/images`

Rejected images are **not deleted** from Firebase Storage — admin removes manually if needed.

## Public Display

In `src/app/recipes/[slug]/page.tsx`, render `coverImageUrl` only when `coverImageStatus === 'approved'`. The field is already selected in the existing query; only a conditional render guard needs to be added.

## Files to Create / Modify

| File | Change |
|---|---|
| `prisma/schema.prisma` | Add `CoverImageStatus` enum + `coverImageStatus` field on `Recipe` |
| `prisma/migrations/` | New migration for the enum + column |
| `src/app/(legal)/terms/page.tsx` | Add "Image Uploads" section |
| `src/components/recipe-form/RecipeForm.tsx` | Add consent checkbox + status badge |
| `src/components/recipe-form/useCoverUpload.ts` | Disable input until consent checked |
| `src/lib/actions/recipes.ts` | Reset `coverImageStatus = pending_approval` on image URL change |
| `src/lib/actions/admin.ts` | Add `approveRecipeImage` and `rejectRecipeImage` actions |
| `src/app/admin/images/page.tsx` | New admin image queue page |
| `src/app/admin/images/AdminImageActions.tsx` | Approve/reject button component |
| `src/app/admin/layout.tsx` | Add "Images" link to admin nav |
| `src/app/recipes/[slug]/page.tsx` | Guard image render on `approved` status |

## Out of Scope

- Email notifications for approval/rejection
- Automated AI pre-screening (revisit when upload volume warrants)
- Firebase Storage security rules changes
- Deleting rejected images (manual admin responsibility)
