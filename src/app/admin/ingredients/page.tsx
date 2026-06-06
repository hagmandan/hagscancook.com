/**
 * Admin — Ingredient management — /admin/ingredients
 *
 * Two sections:
 * 1. Ingredient types — add new categories; shows ingredient count per type
 * 2. Ingredients — add new canonical ingredients; allows re-categorisation
 *
 * Ingredients are auto-created when authors add them to recipes, so this
 * page is primarily for re-categorising and auditing.
 */

import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { AdminAddForm } from '../tags/AdminAddForm'
import { AdminAddIngredientForm } from './AdminAddIngredientForm'
import { AdminIngredientTypeSelect } from './AdminIngredientTypeSelect'
import styles from '../admin.module.css'

async function getData() {
  const [types, ingredients] = await Promise.all([
    db.ingredientType.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { ingredients: true } } },
    }),
    db.ingredient.findMany({
      orderBy: { name: 'asc' },
      include: { type: { select: { name: true } } },
    }),
  ])
  return { types, ingredients }
}

export const metadata = { title: 'Admin — Ingredients' }

export default async function AdminIngredientsPage() {
  await requireAdmin()
  const { types, ingredients } = await getData()

  return (
    <>
      {/* Ingredient types */}
      <h1 className={styles.pageTitle}>Ingredient Types ({types.length})</h1>
      <AdminAddForm placeholder="Type name (e.g. Exotic Fruits)" actionName="createIngredientType" />
      <table className={styles.table} style={{ marginBottom: '3rem' }}>
        <thead>
          <tr>
            <th>Type</th>
            <th>Slug</th>
            <th>Ingredients</th>
          </tr>
        </thead>
        <tbody>
          {types.map((t) => (
            <tr key={t.id}>
              <td style={{ fontWeight: 600 }}>{t.name}</td>
              <td style={{ color: '#6b7280', fontFamily: 'monospace', fontSize: '0.8125rem' }}>{t.slug}</td>
              <td>{t._count.ingredients}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Ingredients */}
      <h2 className={styles.pageTitle} style={{ fontSize: '1.125rem' }}>
        Ingredients ({ingredients.length})
      </h2>
      <AdminAddIngredientForm types={types.map((t) => ({ id: t.id, name: t.name }))} />
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          {ingredients.map((ing) => (
            <tr key={ing.id}>
              <td style={{ fontWeight: 500 }}>{ing.name}</td>
              <td>
                <AdminIngredientTypeSelect
                  ingredientId={ing.id}
                  currentTypeId={ing.typeId}
                  types={types.map((t) => ({ id: t.id, name: t.name }))}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
