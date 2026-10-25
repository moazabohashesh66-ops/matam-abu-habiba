export interface Product {
  id: string;
  name: string;
  nameEn: string;
  description?: string;
  price: number;
  image?: string;
  isAvailable: boolean;
  isPopular?: boolean;
  isNew?: boolean;
  size?: string;
  weight?: string;
  optionGroups?: ProductOptionGroup[];
}

export interface ProductOption {
  id: string;
  name: string;
  priceAdjustment: number;
  defaultSelected?: boolean;
}

export interface ProductOptionGroup {
  id: string;
  name: string;
  required: boolean;
  multiple: boolean;
  options: ProductOption[];
}

export interface Category {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  image?: string;
  products: Product[];
}

const categoryImages = {
  pizza: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&h=700&fit=crop",
  sandwiches: "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=1200&h=700&fit=crop",
  crepes: "https://images.unsplash.com/photo-1647563186842-64d898764d5e?auto=format&fit=crop&w=1200&q=80",
  meals: "https://images.unsplash.com/photo-1781332147287-191fcfbd52be?auto=format&fit=crop&w=1200&q=80",
};

const available = true;

const mealIngredients = (productId: string, names: string[]): ProductOptionGroup[] => [{
  id: `${productId}-ingredients`,
  name: "مكونات الوجبة",
  required: false,
  multiple: true,
  options: names.map((name, index) => ({
    id: `${productId}-ingredient-${index + 1}`,
    name,
    priceAdjustment: 0,
    defaultSelected: true,
  })),
}];

export const menuData: Category[] = [
  {
    id: "pizza",
    name: "البيتزا",
    nameEn: "Pizza",
    icon: "🍕",
    image: categoryImages.pizza,
    products: [
      { id: "pizza-margherita-small", name: "بيتزا مارجريتا", nameEn: "Margherita Pizza", price: 80, size: "صغير", isAvailable: available },
      { id: "pizza-margherita-large", name: "بيتزا مارجريتا", nameEn: "Margherita Pizza", price: 100, size: "كبير", isAvailable: available },
      { id: "pizza-tuna-small", name: "بيتزا تونة", nameEn: "Tuna Pizza", price: 100, size: "صغير", isAvailable: available },
      { id: "pizza-tuna-large", name: "بيتزا تونة", nameEn: "Tuna Pizza", price: 120, size: "كبير", isAvailable: available },
      { id: "pizza-sausage-small", name: "بيتزا سجق", nameEn: "Sausage Pizza", price: 100, size: "صغير", isAvailable: available },
      { id: "pizza-sausage-large", name: "بيتزا سجق", nameEn: "Sausage Pizza", price: 120, size: "كبير", isAvailable: available },
      { id: "pizza-chicken-small", name: "بيتزا فراخ", nameEn: "Chicken Pizza", price: 100, size: "صغير", isAvailable: available },
      { id: "pizza-chicken-large", name: "بيتزا فراخ", nameEn: "Chicken Pizza", price: 120, size: "كبير", isAvailable: available },
      { id: "pizza-meat-mix-small", name: "بيتزا مكس لحوم", nameEn: "Mixed Meat Pizza", price: 120, size: "صغير", isAvailable: available },
      { id: "pizza-meat-mix-large", name: "بيتزا مكس لحوم", nameEn: "Mixed Meat Pizza", price: 150, size: "كبير", isAvailable: available },
      { id: "pizza-chicken-mix-small", name: "بيتزا مكس فراخ", nameEn: "Mixed Chicken Pizza", price: 120, size: "صغير", isAvailable: available },
      { id: "pizza-chicken-mix-large", name: "بيتزا مكس فراخ", nameEn: "Mixed Chicken Pizza", price: 150, size: "كبير", isAvailable: available },
      { id: "pizza-cheese-mix-small", name: "بيتزا مكس جبن", nameEn: "Mixed Cheese Pizza", price: 100, size: "صغير", isAvailable: available },
      { id: "pizza-cheese-mix-large", name: "بيتزا مكس جبن", nameEn: "Mixed Cheese Pizza", price: 120, size: "كبير", isAvailable: available },
      { id: "pizza-abu-habiba", name: "بيتزا أبو حبيبه", nameEn: "Abu Habiba Pizza", price: 160, isAvailable: available, isPopular: true },
    ],
  },
  {
    id: "sandwiches",
    name: "السندوتشات",
    nameEn: "Sandwiches",
    icon: "🥪",
    image: categoryImages.sandwiches,
    products: [
      { id: "sandwich-chicken-shawarma", name: "سندوتش شاورما دجاج", nameEn: "Chicken Shawarma Sandwich", price: 80, isAvailable: available },
      { id: "sandwich-crispy", name: "سندوتش كرسبي", nameEn: "Crispy Sandwich", price: 90, isAvailable: available },
      { id: "sandwich-zinger", name: "سندوتش زنجر", nameEn: "Zinger Sandwich", price: 90, isAvailable: available },
      { id: "sandwich-fajita", name: "سندوتش فاهيتا", nameEn: "Fajita Sandwich", price: 90, isAvailable: available },
      { id: "sandwich-meat-mix", name: "سندوتش مكس لحوم", nameEn: "Mixed Meat Sandwich", price: 100, isAvailable: available, isPopular: true },
      { id: "sandwich-potato-mozzarella", name: "سندوتش بطاطس موزريلا", nameEn: "Potato Mozzarella Sandwich", price: 40, isAvailable: available },
      { id: "sandwich-syrian-potato", name: "سندوتش بطاطس سوري", nameEn: "Syrian Potato Sandwich", price: 25, isAvailable: available },
      { id: "sandwich-kofta", name: "سندوتش كفتة", nameEn: "Kofta Sandwich", price: 80, isAvailable: available },
    ],
  },
  {
    id: "crepes",
    name: "الكريب",
    nameEn: "Crepes",
    icon: "🌯",
    image: categoryImages.crepes,
    products: [
      { id: "crepe-chicken-shawarma", name: "كريب شاورما دجاج", nameEn: "Chicken Shawarma Crepe", price: 90, isAvailable: available },
      { id: "crepe-crispy", name: "كريب كرسبي", nameEn: "Crispy Crepe", price: 90, isAvailable: available },
      { id: "crepe-pane", name: "كريب بانيه", nameEn: "Breaded Chicken Crepe", price: 90, isAvailable: available },
      { id: "crepe-zinger", name: "كريب زنجر", nameEn: "Zinger Crepe", price: 90, isAvailable: available },
      { id: "crepe-kofta", name: "كريب كفتة", nameEn: "Kofta Crepe", price: 90, isAvailable: available },
      { id: "crepe-fajita", name: "كريب فاهيتا", nameEn: "Fajita Crepe", price: 90, isAvailable: available },
      { id: "crepe-chicken-mix", name: "كريب مكس فراخ", nameEn: "Mixed Chicken Crepe", price: 100, isAvailable: available },
      { id: "crepe-meat-mix", name: "كريب مكس لحوم", nameEn: "Mixed Meat Crepe", price: 100, isAvailable: available },
      { id: "crepe-potato", name: "كريب بطاطس", nameEn: "Potato Crepe", price: 50, isAvailable: available },
      { id: "crepe-cheese-mix", name: "كريب مكس جبن", nameEn: "Mixed Cheese Crepe", price: 60, isAvailable: available },
      { id: "crepe-abu-habiba", name: "كريب أبو حبيبه", nameEn: "Abu Habiba Crepe", price: 120, isAvailable: available, isPopular: true },
    ],
  },
  {
    id: "meals",
    name: "الوجبات",
    nameEn: "Meals",
    icon: "🍗",
    image: categoryImages.meals,
    products: [
      { id: "meal-arabic-shawarma", name: "وجبة شاورما عربي", nameEn: "Arabic Shawarma Meal", price: 110, optionGroups: mealIngredients("meal-arabic-shawarma", ["ثومية", "بطاطس", "مخلل"]), isAvailable: available },
      { id: "meal-crispy-4", name: "وجبة كرسبي 4 قطع", nameEn: "4-Piece Crispy Meal", price: 80, optionGroups: mealIngredients("meal-crispy-4", ["رز بسمتي", "بطاطس", "مخلل"]), isAvailable: available },
      { id: "meal-crispy-6", name: "وجبة كرسبي 6 قطع", nameEn: "6-Piece Crispy Meal", price: 120, optionGroups: mealIngredients("meal-crispy-6", ["رز بسمتي", "بطاطس", "مخلل"]), isAvailable: available },
      { id: "meal-kofta-4", name: "وجبة كفتة 4 قطع", nameEn: "4-Piece Kofta Meal", price: 100, optionGroups: mealIngredients("meal-kofta-4", ["رز بسمتي", "بطاطس", "مخلل", "طحينة"]), isAvailable: available },
      { id: "meal-kofta-6", name: "وجبة كفتة 6 قطع", nameEn: "6-Piece Kofta Meal", price: 130, optionGroups: mealIngredients("meal-kofta-6", ["رز بسمتي", "بطاطس", "مخلل", "طحينة"]), isAvailable: available },
      { id: "meal-quarter-chicken", name: "ربع فرخة", nameEn: "Quarter Chicken", price: 120, optionGroups: mealIngredients("meal-quarter-chicken", ["رز بسمتي", "بطاطس", "مخلل"]), isAvailable: available },
      { id: "meal-abu-habiba", name: "وجبة أبو حبيبه", nameEn: "Abu Habiba Meal", price: 200, description: "3 قطع كفتة وربع فرخة", optionGroups: mealIngredients("meal-abu-habiba", ["رز بسمتي", "ثومية", "مخلل", "طحينة"]), isAvailable: available, isPopular: true },
      { id: "meal-family", name: "وجبة العائلة", nameEn: "Family Meal", price: 250, description: "6 قطع كفتة ونصف فرخة", optionGroups: mealIngredients("meal-family", ["رز بسمتي", "ثومية", "مخلل", "طحينة"]), isAvailable: available },
      { id: "meal-shawarma-1kg", name: "كيلو شاورما دجاج", nameEn: "1kg Chicken Shawarma", price: 500, weight: "كيلو", isAvailable: available },
      { id: "meal-shawarma-half-kg", name: "نصف كيلو شاورما دجاج", nameEn: "½kg Chicken Shawarma", price: 300, weight: "نصف كيلو", isAvailable: available },
      { id: "meal-shawarma-quarter-kg", name: "ربع كيلو شاورما دجاج", nameEn: "¼kg Chicken Shawarma", price: 170, weight: "ربع كيلو", isAvailable: available },
    ],
  },
];

const legacyMealDescriptions: Record<string, string> = {
  "meal-arabic-shawarma": "ثومية - بطاطس - مخلل",
  "meal-crispy-4": "رز بسمتي - بطاطس - مخلل",
  "meal-crispy-6": "رز بسمتي - بطاطس - مخلل",
  "meal-kofta-4": "رز بسمتي - بطاطس - مخلل - طحينة",
  "meal-kofta-6": "رز بسمتي - بطاطس - مخلل - طحينة",
  "meal-quarter-chicken": "رز بسمتي - بطاطس - مخلل",
  "meal-abu-habiba": "3 قطع كفتة وربع فرخة - رز بسمتي - تومية - مخلل - طحينة",
  "meal-family": "6 قطع كفتة ونصف فرخة - رز بسمتي - تومية - مخلل - طحينة",
};

const defaultProductsById = new Map(menuData.flatMap((category) => category.products.map((product) => [product.id, product] as const)));

/** Adds newly introduced defaults to older saved menus without replacing admin-edited options. */
export function hydrateMenuData(categories: Category[]): Category[] {
  return categories.map((category) => ({
    ...category,
    products: category.products.map((product) => {
      const defaults = defaultProductsById.get(product.id);
      if (!defaults) return product;

      const needsDefaultOptions = product.optionGroups === undefined && defaults.optionGroups;
      const hadLegacyDescription = legacyMealDescriptions[product.id] === product.description;
      if (!needsDefaultOptions && !hadLegacyDescription) return product;

      return {
        ...product,
        ...(needsDefaultOptions && defaults.optionGroups ? {
          optionGroups: defaults.optionGroups.map((group) => ({
            ...group,
            options: group.options.map((option) => ({ ...option })),
          })),
        } : {}),
        ...(hadLegacyDescription ? { description: defaults.description } : {}),
      };
    }),
  }));
}
