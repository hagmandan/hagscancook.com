import type { PantrySection } from '../types'

export const BAKING_SECTION: PantrySection = {
  id: 'baking',
  label: 'Baking',
  typeSlugs: ['baking', 'sweeteners'],
  items: [
    { name: 'sugar', typeSlug: 'sweeteners' },
    { name: 'brown sugar', typeSlug: 'sweeteners' },
    { name: 'baking powder', typeSlug: 'baking' },
    { name: 'baking soda', typeSlug: 'baking' },
    { name: 'vanilla extract', typeSlug: 'baking' },
    { name: 'cocoa powder', typeSlug: 'baking' },
    { name: 'cornstarch', typeSlug: 'baking' },
    { name: 'chocolate chips', typeSlug: 'baking' },
  ],
  moreItems: [
    // sweeteners
    { name: 'powdered sugar', typeSlug: 'sweeteners' },
    { name: 'raw sugar', typeSlug: 'sweeteners' },
    { name: 'maple syrup', typeSlug: 'sweeteners' },
    { name: 'molasses', typeSlug: 'sweeteners' },
    { name: 'agave nectar', typeSlug: 'sweeteners' },
    { name: 'corn syrup', typeSlug: 'sweeteners' },
    { name: 'golden syrup', typeSlug: 'sweeteners' },
    { name: 'date syrup', typeSlug: 'sweeteners' },
    { name: 'coconut sugar', typeSlug: 'sweeteners' },
    // leavening & setting agents
    { name: 'active dry yeast', typeSlug: 'baking' },
    { name: 'instant yeast', typeSlug: 'baking' },
    { name: 'cream of tartar', typeSlug: 'baking' },
    { name: 'gelatin', typeSlug: 'baking' },
    { name: 'agar agar', typeSlug: 'baking' },
    { name: 'tapioca starch', typeSlug: 'baking' },
    { name: 'arrowroot powder', typeSlug: 'baking' },
    // extracts & flavourings
    { name: 'almond extract', typeSlug: 'baking' },
    { name: 'peppermint extract', typeSlug: 'baking' },
    { name: 'lemon extract', typeSlug: 'baking' },
    { name: 'orange extract', typeSlug: 'baking' },
    { name: 'rose water', typeSlug: 'baking' },
    { name: 'orange blossom water', typeSlug: 'baking' },
    { name: 'instant espresso powder', typeSlug: 'baking' },
    // chocolate & cacao
    { name: 'dark chocolate', typeSlug: 'baking' },
    { name: 'white chocolate chips', typeSlug: 'baking' },
    { name: 'milk chocolate chips', typeSlug: 'baking' },
    { name: 'cocoa nibs', typeSlug: 'baking' },
    { name: 'raw cacao powder', typeSlug: 'baking' },
    { name: 'carob powder', typeSlug: 'baking' },
    // dairy-adjacent baking
    { name: 'evaporated milk', typeSlug: 'baking' },
    { name: 'sweetened condensed milk', typeSlug: 'baking' },
    { name: 'powdered milk', typeSlug: 'baking' },
    { name: 'buttermilk powder', typeSlug: 'baking' },
    { name: 'almond paste', typeSlug: 'baking' },
    { name: 'marzipan', typeSlug: 'baking' },
    // coconut & nut
    { name: 'coconut flakes', typeSlug: 'baking' },
    { name: 'shredded coconut', typeSlug: 'baking' },
    { name: 'coconut cream', typeSlug: 'baking' },
    // dried fruit for baking
    { name: 'currants', typeSlug: 'baking' },
    { name: 'sultanas', typeSlug: 'baking' },
    { name: 'candied ginger', typeSlug: 'baking' },
    { name: 'candied peel', typeSlug: 'baking' },
    { name: 'freeze-dried strawberries', typeSlug: 'baking' },
    { name: 'freeze-dried raspberries', typeSlug: 'baking' },
    // seeds for baking
    { name: 'flax seeds', typeSlug: 'baking' },
    { name: 'chia seeds', typeSlug: 'baking' },
    // decoration
    { name: 'sprinkles', typeSlug: 'baking' },
    { name: 'meringue powder', typeSlug: 'baking' },
  ],
}
