export interface PantryCommonItem {
  name: string
  typeSlug: string
}

export interface PantrySection {
  id: string
  label: string
  typeSlugs: readonly string[]
  items: readonly PantryCommonItem[]
  moreItems: readonly PantryCommonItem[]
}
