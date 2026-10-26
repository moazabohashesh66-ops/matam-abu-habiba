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
  shawarma: "/images/kayan/shawarma.png",
  shawarmaWeights: "/images/kayan/shawarma-weights.png",
  crepes: "/images/kayan/crepes.png",
  burgers: "/images/kayan/burgers.png",
  saj: "/images/kayan/saj.png",
  additions: "/images/kayan/additions.png",
};

function product(id: string, name: string, nameEn: string, price: number, isPopular = false): Product {
  return { id, name, nameEn, price, isAvailable: true, ...(isPopular ? { isPopular: true } : {}) };
}

export const menuData: Category[] = [
  {
    id: "shawarma",
    name: "الشاورما",
    nameEn: "Shawarma",
    icon: "🌯",
    image: categoryImages.shawarma,
    products: [
      product("shawarma-medium", "شاورما وسط", "Medium Shawarma", 60),
      product("shawarma-large", "شاورما كبير", "Large Shawarma", 80),
      product("shawarma-kayan", "شاورما كيان", "Kayan Shawarma", 100, true),
      product("shawarma-kayzer-quarter", "كيزر ربع دستة", "Quarter Dozen Kayzer", 110),
      product("shawarma-kayzer-half", "كيزر نص دستة", "Half Dozen Kayzer", 200),
      product("shawarma-arabic", "وجبة شاورما عربي", "Arabic Shawarma Meal", 110),
      product("shawarma-arabic-combo", "وجبة عربي كومبو", "Arabic Shawarma Combo", 180),
      product("shawarma-maria", "ماريا شاورما", "Maria Shawarma", 130),
      product("shawarma-fatteh-medium", "فتة شاورما وسط", "Medium Shawarma Fatteh", 80),
      product("shawarma-fatteh-large", "فتة شاورما كبير", "Large Shawarma Fatteh", 120),
      product("shawarma-mix-fatteh-medium", "فتة مكس وسط", "Medium Mixed Fatteh", 90),
      product("shawarma-mix-fatteh-large", "فتة مكس كبير", "Large Mixed Fatteh", 135),
    ],
  },
  {
    id: "shawarma-weights",
    name: "أوزان الشاورما",
    nameEn: "Shawarma by Weight",
    icon: "⚖️",
    image: categoryImages.shawarmaWeights,
    products: [
      product("shawarma-quarter-kilo", "ربع كيلو شاورما", "Quarter Kilo Shawarma", 170),
      product("shawarma-half-kilo", "نصف كيلو شاورما", "Half Kilo Shawarma", 320),
      product("shawarma-kilo", "كيلو شاورما", "One Kilo Shawarma", 600),
    ],
  },
  {
    id: "crepes",
    name: "الكريب",
    nameEn: "Crepes",
    icon: "🌯",
    image: categoryImages.crepes,
    products: [
      product("crepe-potato", "كريب بطاطس", "Potato Crepe", 50),
      product("crepe-shawarma", "كريب شاورما", "Shawarma Crepe", 75),
      product("crepe-fajita", "كريب فاهيتا", "Fajita Crepe", 80),
      product("crepe-pane", "كريب بانيه", "Breaded Chicken Crepe", 60),
      product("crepe-strips", "كريب استربس", "Chicken Strips Crepe", 75),
      product("crepe-kofta", "كريب كفتة", "Kofta Crepe", 75),
      product("crepe-liver", "كريب كبدة", "Liver Crepe", 70),
      product("crepe-burger", "كريب برجر", "Burger Crepe", 75),
      product("crepe-sausage", "كريب سجق", "Sausage Crepe", 70),
      product("crepe-cheese-mix", "مشكل جبن", "Mixed Cheese Crepe", 70),
      product("crepe-meat-mix", "مشكل لحمة", "Mixed Meat Crepe", 90),
      product("crepe-chicken-mix", "مشكل فراخ", "Mixed Chicken Crepe", 90),
      product("crepe-super-crunchy", "سوبر كرانشي", "Super Crunchy Crepe", 100),
      product("crepe-kayan", "كريب كيان", "Kayan Crepe", 120, true),
    ],
  },
  {
    id: "burgers",
    name: "البرجر",
    nameEn: "Burgers",
    icon: "🍔",
    image: categoryImages.burgers,
    products: [
      product("burger-classic", "كلاسيك برجر", "Classic Burger", 80),
      product("burger-cheese", "برجر تشيز", "Cheese Burger", 95, true),
      product("burger-classic-chicken", "كلاسيك تشكن", "Classic Chicken Burger", 75),
      product("burger-smoked-chicken", "تشيكن مدخن", "Smoked Chicken Burger", 95),
      product("burger-chicken-cheese", "تشيكن تشيز", "Chicken Cheese Burger", 95),
    ],
  },
  {
    id: "saj",
    name: "قسم الغربي (عيش الصاج)",
    nameEn: "Western Saj Bread",
    icon: "🥙",
    image: categoryImages.saj,
    products: [
      product("saj-syrian-potato", "بطاطس سوري", "Syrian Potato Saj", 25),
      product("saj-potato-mozzarella", "بطاطس موزاريلا", "Potato Mozzarella Saj", 40),
      product("saj-liver", "كبدة سوري", "Syrian Liver Saj", 35),
      product("saj-kofta", "كفتة سوري", "Syrian Kofta Saj", 40),
      product("saj-pane", "بانيه سوري", "Syrian Breaded Chicken Saj", 40),
      product("saj-strips", "استربس سوري", "Syrian Chicken Strips Saj", 60),
      product("saj-meat-burger", "برجر لحمة سوري", "Syrian Beef Burger Saj", 45),
      product("saj-sausage", "سجق سوري", "Syrian Sausage Saj", 40),
    ],
  },
  {
    id: "additions",
    name: "الإضافات",
    nameEn: "Additions",
    icon: "🍟",
    image: categoryImages.additions,
    products: [
      product("addition-turkey", "إضافة رومي", "Turkey Addition", 20),
      product("addition-potato", "إضافة بطاطس", "Potato Addition", 15),
      product("addition-garlic", "تومية بارد وحار", "Garlic Sauce, Mild or Hot", 10),
      product("addition-cheddar", "صوص شيدر", "Cheddar Sauce", 30),
      product("addition-ketchup", "كاتشب", "Ketchup", 10),
      product("addition-pickles", "مخلل", "Pickles", 10),
      product("addition-fries", "بطاطس", "Fries", 25),
      product("addition-pane", "قطعة بانيه", "Breaded Chicken Piece", 20),
      product("addition-strips", "قطعة استربس", "Chicken Strips Piece", 30),
      product("addition-shawarma", "إضافة شاورما", "Extra Shawarma", 30),
      product("addition-cheese-top", "وش جبنة (كونو)", "Cheese Topping (Kono)", 20),
    ],
  },
];

/** Identifies the former Abu Habiba catalog so it can be replaced by the Kayan menu. */
export function isLegacyMenuData(value: unknown): boolean {
  return Array.isArray(value) && value.some((category) =>
    Boolean(category && typeof category === "object" && ("id" in category) &&
      ((category as { id?: unknown }).id === "pizza" || (category as { id?: unknown }).id === "meals")),
  );
}

export function hydrateMenuData(categories: Category[]): Category[] {
  return categories.map((category) => ({
    ...category,
    products: category.products.map((product) => ({ ...product })),
  }));
}
