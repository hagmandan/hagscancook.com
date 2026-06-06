# Toast Notification System — Design Spec

**Date:** 2026-06-06
**Status:** Approved

## Problem

Server Action errors currently surface inconsistently across the app:
- `FavoriteButton` silently reverts optimistic state with no user feedback
- `AdminRecipeActions` is fire-and-forget — results are never checked or displayed
- `RecipeRowActions` calls `deleteRecipe` but never handles failure

Users have no way to know when an action fails. A lightweight app-level toast service closes this gap without requiring a UI library dependency.

---

## Decisions

| Question       | Decision                                                        |
| -------------- | --------------------------------------------------------------- |
| Position       | Bottom-right, stacks upward                                     |
| Types          | `error` + `success` (no info/warning for now)                   |
| Visual style   | Card with left accent border, white background                  |
| Animation      | Slide up from bottom on enter (0.25s ease), slide down on exit  |
| Reduced motion | Fade only (no translate)                                        |
| Implementation | Custom context — no new dependencies                            |
| Inline errors  | `ProfileForm` and `PantryManager` keep existing inline feedback |

---

## Architecture

### New files

**`src/lib/toast.tsx`** — context, provider, hook

```ts
interface ToastItem {
  id: string           // crypto.randomUUID()
  type: 'error' | 'success'
  title: string        // e.g. "Error" | "Done"
  message: string      // body text shown below title
}
```

Exports:
- `ToastProvider` — wraps the app, holds queue state
- `useToast()` — returns `{ error(title, message), success(title, message) }`
- `ToastContainer` — the positioned viewport overlay that renders the queue

Internal behaviour:
- `addToast()` appends to the queue and schedules `removeToast()` via `setTimeout`
  - Success: 4 000 ms
  - Error: 6 000 ms
- If the queue reaches 4 items, the oldest is ejected before the new one is added
- `removeToast(id)` removes by id (called by timer or dismiss button)

**`src/components/ui/Toast.tsx`** — single toast card

Props: `ToastItem & { onDismiss: () => void }`

Renders a white card with:
- Left accent border (`--color-error` or `--color-success`)
- Title row: bold label + ✕ dismiss button
- Body row: message text
- Exit animation triggered when `onDismiss` is called (play exit keyframe, then remove from DOM after 250 ms)

**`src/components/ui/Toast.module.css`** — styles

Uses existing CSS tokens exclusively:
- `--color-error`, `--color-error-bg`, `--color-error-border`
- `--color-success`, `--color-success-bg`, `--color-success-border`
- `--color-surface`, `--color-text`, `--color-text-2`

Keyframes (slide by default, fade override for reduced-motion users):
```css
@keyframes toastIn  { from { transform: translateY(1.5rem); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes toastOut { from { transform: translateY(0); opacity: 1; } to { transform: translateY(1.5rem); opacity: 0; } }

@media (prefers-reduced-motion: reduce) {
  @keyframes toastIn  { from { opacity: 0; } to { opacity: 1; } }
  @keyframes toastOut { from { opacity: 1; } to { opacity: 0; } }
}
```

`ToastContainer` is fixed-positioned, bottom-right, `z-index: 9999`, pointer-events none on the wrapper (so it doesn't block page interaction), pointer-events auto on each card.

### Modified files

**`src/app/layout.tsx`**
Add `<ToastContainer>` inside `<Providers>`, after `<Footer>`:
```tsx
<Providers>
  <Header />
  <main className="flex-1">{children}</main>
  <Footer />
  <ToastContainer />   {/* ← new */}
</Providers>
```

**`src/components/recipe/FavoriteButton.tsx`**
Add `useToast()`. On `'error' in result`: call `toast.error('Error', 'Could not update favorite')`.

**`src/app/admin/AdminRecipeActions.tsx`**
Add `useToast()`. Check action results:
- `unpublishRecipe` failure → `toast.error('Error', 'Could not unpublish recipe')`
- `unpublishRecipe` success → `toast.success('Done', 'Recipe unpublished')`
- `adminDeleteRecipe` failure → `toast.error('Error', 'Could not delete recipe')`
- `adminDeleteRecipe` success → `toast.success('Done', 'Recipe deleted')`

**`src/app/my-recipes/RecipeRowActions.tsx`**
Add `useToast()`. Check `deleteRecipe` result; on failure: `toast.error('Error', 'Could not delete recipe')`.

### Unchanged

- `ProfileForm.tsx` — inline form feedback stays; contextually appropriate next to the submit button
- `PantryManager.tsx` — inline errors stay; row-level feedback is spatially more informative than a corner toast

---

## Accessibility

### ARIA live regions

`ToastContainer` renders two visually hidden live region nodes that never unmount:

```tsx
<div aria-live="assertive" aria-atomic="true" className={styles.srOnly} />  {/* errors */}
<div aria-live="polite"    aria-atomic="true" className={styles.srOnly} />  {/* success */}
```

When a toast is added, its message text is written into the matching live region. Screen readers announce it automatically — `assertive` interrupts immediately (errors), `polite` waits for the current utterance (success).

The visible toast cards render in a separate positioned container. They are not `aria-hidden` — the dismiss button inside each card must remain keyboard-reachable. The live region handles verbal announcement; the card handles interaction.

### Dismiss button

```tsx
<button
  type="button"
  aria-label="Dismiss notification"
  onClick={onDismiss}
>
  ✕
</button>
```

### Other

- Toasts never steal focus
- Dismiss button is keyboard-reachable (Tab order)
- `prefers-reduced-motion` replaces slide animation with fade

---

## API

```ts
const { error, success } = useToast()

error('Error', 'Could not update favorite')
// → error toast, auto-dismisses after 6 s

success('Done', 'Recipe deleted')
// → success toast, auto-dismisses after 4 s
```

`useToast()` throws if called outside `<ToastProvider>` (fail-fast in development).

---

## Out of scope

- `info` / `warning` toast types — not needed yet; type union can be extended later
- Toast actions / undo buttons — not needed for MVP
- Persistence across page navigations — toasts are in-memory, intentionally ephemeral
- Per-toast custom duration — all errors get 6 s, all success get 4 s; no override API
