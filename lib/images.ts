// ============================================
// 📸 الملف المركزي للصور - عدل هنا فقط
// ============================================

// الصور الافتراضية
const defaultCategoryImages: Record<string, string> = {
  "grill": "/images/categories/grill.jpg",
  "shawarma": "/images/categories/shawarma.jpg",
  "pizza": "/images/categories/pizza.jpg",
  "western": "/images/categories/western.jpg",
  "manakeesh": "/images/categories/manakeesh.jpg",
  "appetizers": "/images/categories/appetizers.jpg",
  "drinks": "/images/categories/drinks.jpg",
};

const defaultFoodImages: Record<string, string> = {
  "g1": "/images/foods/grilled-chicken.jpg",
  "g2": "/images/foods/grilled-chicken.jpg",
  "g3": "/images/foods/grilled-chicken.jpg",
  "g4": "/images/foods/fried-chicken.jpg",
  "g5": "/images/foods/fried-chicken.jpg",
  "g6": "/images/foods/chicken-wings.jpg",
  "s1": "/images/foods/shawarma.jpg",
  "s2": "/images/foods/shawarma.jpg",
  "s3": "/images/foods/shawarma.jpg",
  "s4": "/images/foods/shawarma.jpg",
  "s5": "/images/foods/shawarma.jpg",
  "s6": "/images/foods/shawarma.jpg",
  "s7": "/images/foods/shawarma-meal.jpg",
  "s8": "/images/foods/shawarma-meal.jpg",
  "s9": "/images/foods/shawarma-meal.jpg",
  "s10": "/images/foods/shawarma-meal.jpg",
  "s11": "/images/foods/shawarma-meal.jpg",
  "s12": "/images/foods/shawarma-meal.jpg",
  "s13": "/images/foods/shawarma-fatteh.jpg",
  "s14": "/images/foods/shawarma-fatteh.jpg",
  "s15": "/images/foods/shawarma-kilo.jpg",
  "s16": "/images/foods/shawarma-kilo.jpg",
  "s17": "/images/foods/shawarma-kilo.jpg",
  "p1": "/images/foods/pizza.jpg",
  "p2": "/images/foods/pizza.jpg",
  "p3": "/images/foods/pizza-margherita.jpg",
  "p4": "/images/foods/pizza-margherita.jpg",
  "p5": "/images/foods/pizza-mushroom.jpg",
  "p6": "/images/foods/pizza-mushroom.jpg",
  "p7": "/images/foods/pizza-turkey.jpg",
  "p8": "/images/foods/pizza-turkey.jpg",
  "p9": "/images/foods/pizza-shawarma.jpg",
  "p10": "/images/foods/pizza-shawarma.jpg",
  "p11": "/images/foods/pizza-sausage.jpg",
  "p12": "/images/foods/pizza-sausage.jpg",
  "p13": "/images/foods/pizza-meat.jpg",
  "p14": "/images/foods/pizza-meat.jpg",
  "p15": "/images/foods/pizza-chicken.jpg",
  "p16": "/images/foods/pizza-chicken.jpg",
  "p17": "/images/foods/pizza-pepperoni.jpg",
  "p18": "/images/foods/pizza-pepperoni.jpg",
  "p19": "/images/foods/pizza-cheese.jpg",
  "p20": "/images/foods/pizza-cheese.jpg",
  "p21": "/images/foods/pizza-sausage.jpg",
  "p22": "/images/foods/pizza-sausage.jpg",
  "p23": "/images/foods/pizza-bbq.jpg",
  "p24": "/images/foods/pizza-bbq.jpg",
  "p25": "/images/foods/pizza-special.jpg",
  "p26": "/images/foods/pizza-special.jpg",
  "p27": "/images/foods/pizza-ranch.jpg",
  "p28": "/images/foods/pizza-ranch.jpg",
  "w1": "/images/foods/cordon-bleu.jpg",
  "w2": "/images/foods/chicken-roll.jpg",
  "w3": "/images/foods/shish-tawook.jpg",
  "w4": "/images/foods/crispy.jpg",
  "w5": "/images/foods/zinger.jpg",
  "w6": "/images/foods/mexicano.jpg",
  "w7": "/images/foods/warda-special.jpg",
  "w8": "/images/foods/chicken-sub.jpg",
  "w9": "/images/foods/francisco.jpg",
  "w10": "/images/foods/escalope.jpg",
  "w11": "/images/foods/fajita.jpg",
  "w12": "/images/foods/philadelphia.jpg",
  "w13": "/images/foods/nagito.jpg",
  "w14": "/images/foods/mix.jpg",
  "w15": "/images/foods/chicken-burger.jpg",
  "w16": "/images/foods/meat-burger.jpg",
  "m1": "/images/foods/manakeesh.jpg",
  "m2": "/images/foods/manakeesh.jpg",
  "m3": "/images/foods/manakeesh.jpg",
  "m4": "/images/foods/manakeesh.jpg",
  "m5": "/images/foods/manakeesh.jpg",
  "m9": "/images/foods/zaatar.jpg",
  "m10": "/images/foods/muhammara.jpg",
  "m11": "/images/foods/spanach.jpg",
  "m32": "/images/foods/meat-pie.jpg",
  "m30": "/images/foods/sausage-pie.jpg",
  "m31": "/images/foods/sausage-pie.jpg",
  "a1": "/images/foods/muhammara.jpg",
  "a2": "/images/foods/mutabbal.jpg",
  "a3": "/images/foods/mutabbal.jpg",
  "a4": "/images/foods/kibbeh.jpg",
  "a5": "/images/foods/sambousek.jpg",
  "a6": "/images/foods/pickles.jpg",
  "a7": "/images/foods/fries.jpg",
  "a8": "/images/foods/garlic.jpg",
  "a9": "/images/foods/mozzarella-sticks.jpg",
  "a10": "/images/foods/hummus.jpg",
  "a11": "/images/foods/baba-ghanouj.jpg",
  "a15": "/images/foods/tabbouleh.jpg",
  "a16": "/images/foods/fattoush.jpg",
  "a20": "/images/foods/lentil-soup.jpg",
  "a21": "/images/foods/cream-soup.jpg",
  "a32": "/images/foods/pasta.jpg",
  "a33": "/images/foods/fettuccine.jpg",
  "d1": "/images/foods/espresso.jpg",
  "d2": "/images/foods/espresso.jpg",
  "d3": "/images/foods/turkish-coffee.jpg",
  "d4": "/images/foods/turkish-coffee.jpg",
  "d7": "/images/foods/hot-chocolate.jpg",
  "d8": "/images/foods/mocha.jpg",
  "d9": "/images/foods/cappuccino.jpg",
  "d13": "/images/foods/orange-juice.jpg",
  "d14": "/images/foods/lemon-juice.jpg",
  "d16": "/images/foods/mango-juice.jpg",
  "d17": "/images/foods/strawberry.jpg",
  "d21": "/images/foods/fruit-cocktail.jpg",
  "d22": "/images/foods/fruit-cocktail.jpg",
  "d24": "/images/foods/nutella.jpg",
  "d25": "/images/foods/nutella.jpg",
  "d28": "/images/foods/waffle.jpg",
  "d29": "/images/foods/waffle.jpg",
  "d30": "/images/foods/waffle.jpg",
};

// دالة لجلب الصور من localStorage أو الافتراضية
export const getCategoryImages = (): Record<string, string> => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("categoryImages");
    if (saved) return JSON.parse(saved);
  }
  return defaultCategoryImages;
};

export const getFoodImages = (): Record<string, string> => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("foodImages");
    if (saved) return JSON.parse(saved);
  }
  return defaultFoodImages;
};

// للاستخدام المباشر (مع localStorage)
export const categoryImages = getCategoryImages();
export const foodImages = getFoodImages();