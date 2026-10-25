export interface Product {
  id: string;
  name: string;
  nameEn: string;
  description?: string;
  descriptionEn?: string;
  price: number;
  image?: string;
  isAvailable: boolean;
  isNew?: boolean;
  isPopular?: boolean;
  size?: string;
  weight?: string;
}

export interface Category {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  products: Product[];
}

export const menuData: Category[] = [
  // ====== 1. المشويات ======
  {
    id: "grill",
    name: "المشويات",
    nameEn: "Grills",
    icon: "🔥",
    products: [
      { id: "g1", name: "نصف فرخة شواية", nameEn: "Half Grilled Chicken", price: 250, description: "مع أرز - بطاطس - ثومية - مخلل - عيش", isAvailable: true, isPopular: true },
      { id: "g2", name: "ربع فرخة شواية صدر", nameEn: "Quarter Breast", price: 140, description: "مع أرز - بطاطس - ثومية - مخلل - عيش", isAvailable: true },
      { id: "g3", name: "ربع فرخة شواية ورك", nameEn: "Quarter Thigh", price: 130, description: "مع أرز - بطاطس - ثومية - مخلل - عيش", isAvailable: true },
      { id: "g4", name: "نصف فرخة بروستد", nameEn: "Half Fried Chicken", price: 260, description: "مقرمشة مع أرز - بطاطس - ثومية - مخلل - عيش", isAvailable: true },
      { id: "g5", name: "وجبة دبوس بروستد", nameEn: "Drumstick Meal", price: 180, description: "3 قطع دبوس مع أرز - بطاطس - ثومية - مخلل - عيش", isAvailable: true },
      { id: "g6", name: "وجبة جوانح", nameEn: "Wings Meal", price: 175, description: "5 قطع جوانح مع بطاطس - ثومية - مخلل - كول سلو", isAvailable: true }
    ]
  },
  
  // ====== 2. شاورما فراخ ======
  {
    id: "shawarma",
    name: "شاورما فراخ",
    nameEn: "Chicken Shawarma",
    icon: "🌯",
    products: [
      { id: "s1", name: "شاورما فراخ", nameEn: "Chicken Shawarma", price: 110, isAvailable: true, isPopular: true },
      { id: "s2", name: "شاورما فراخ دبل", nameEn: "Double Shawarma", price: 125, isAvailable: true },
      { id: "s3", name: "شاورما فراخ فرنساوي", nameEn: "French Shawarma", price: 125, isAvailable: true },
      { id: "s4", name: "شاورما فراخ كايزر", nameEn: "Kaiser Shawarma", price: 85, isAvailable: true },
      { id: "s5", name: "شاورما فراخ إكسترا", nameEn: "Extra Shawarma", price: 135, description: "مع موتزاريلا + مشروم", isAvailable: true },
      { id: "s6", name: "شاورما عيش شامي", nameEn: "Syrian Bread", price: 110, isAvailable: true },
      { id: "s7", name: "وجبة ماريا", nameEn: "Maria Meal", price: 225, description: "مع بطاطس + كول سلو + ثومية + مخلل", isAvailable: true },
      { id: "s8", name: "شاورما عربي (شخص)", nameEn: "Arabic (1 Person)", price: 190, isAvailable: true },
      { id: "s9", name: "شاورما عربي (شخصين)", nameEn: "Arabic (2 Persons)", price: 375, isAvailable: true },
      { id: "s10", name: "شاورما عربي (3 أشخاص)", nameEn: "Arabic (3 Persons)", price: 550, isAvailable: true },
      { id: "s11", name: "شاورما عربي (عائلي)", nameEn: "Family Arabic", price: 710, isAvailable: true },
      { id: "s12", name: "شاورما عربي إكسترا", nameEn: "Extra Arabic", price: 225, description: "مع موتزاريلا + مشروم", isAvailable: true },
      { id: "s13", name: "فتة شاورما (كبير)", nameEn: "Large Fatteh", price: 200, description: "مع مخلل + ثومية + بطاطس", isAvailable: true },
      { id: "s14", name: "فتة شاورما إكسترا", nameEn: "Extra Fatteh", price: 225, description: "مع موتزاريلا + مشروم + مخلل + ثومية + بطاطس", isAvailable: true },
      { id: "s15", name: "كيلو شاورما", nameEn: "1kg Shawarma", price: 1000, isAvailable: true },
      { id: "s16", name: "نصف كيلو شاورما", nameEn: "½kg Shawarma", price: 500, isAvailable: true },
      { id: "s17", name: "ربع كيلو شاورما", nameEn: "¼kg Shawarma", price: 250, isAvailable: true }
    ]
  },
  
  // ====== 3. البيتزا والصفيحة ======
  {
    id: "pizza",
    name: "البيتزا والصفيحة",
    nameEn: "Pizza & Sfeeha",
    icon: "🍕",
    products: [
      { id: "p1", name: "بيتزا فصول أربعة", nameEn: "Four Seasons", price: 125, size: "وسط", isAvailable: true },
      { id: "p2", name: "بيتزا فصول أربعة", nameEn: "Four Seasons", price: 150, size: "كبير", isAvailable: true },
      { id: "p3", name: "بيتزا مارجريتا", nameEn: "Margherita", price: 115, size: "وسط", isAvailable: true },
      { id: "p4", name: "بيتزا مارجريتا", nameEn: "Margherita", price: 135, size: "كبير", isAvailable: true },
      { id: "p5", name: "بيتزا مشروم", nameEn: "Mushroom", price: 130, size: "وسط", isAvailable: true },
      { id: "p6", name: "بيتزا مشروم", nameEn: "Mushroom", price: 150, size: "كبير", isAvailable: true },
      { id: "p7", name: "بيتزا تركي مدخن", nameEn: "Smoked Turkey", price: 160, size: "وسط", isAvailable: true },
      { id: "p8", name: "بيتزا تركي مدخن", nameEn: "Smoked Turkey", price: 190, size: "كبير", isAvailable: true },
      { id: "p9", name: "بيتزا شاورما فراخ", nameEn: "Chicken Shawarma", price: 170, size: "وسط", isAvailable: true },
      { id: "p10", name: "بيتزا شاورما فراخ", nameEn: "Chicken Shawarma", price: 190, size: "كبير", isAvailable: true },
      { id: "p11", name: "بيتزا سجق", nameEn: "Sausage", price: 175, size: "وسط", isAvailable: true },
      { id: "p12", name: "بيتزا سجق", nameEn: "Sausage", price: 195, size: "كبير", isAvailable: true },
      { id: "p13", name: "بيتزا لحمة مفرومة", nameEn: "Minced Meat", price: 175, size: "وسط", isAvailable: true },
      { id: "p14", name: "بيتزا لحمة مفرومة", nameEn: "Minced Meat", price: 195, size: "كبير", isAvailable: true },
      { id: "p15", name: "بيتزا فراخ", nameEn: "Chicken", price: 160, size: "وسط", isAvailable: true },
      { id: "p16", name: "بيتزا فراخ", nameEn: "Chicken", price: 185, size: "كبير", isAvailable: true },
      { id: "p17", name: "بيتزا بيبيروني", nameEn: "Pepperoni", price: 160, size: "وسط", isAvailable: true },
      { id: "p18", name: "بيتزا بيبيروني", nameEn: "Pepperoni", price: 180, size: "كبير", isAvailable: true },
      { id: "p19", name: "بيتزا مشكل جبن", nameEn: "Mixed Cheese", price: 150, size: "وسط", isAvailable: true },
      { id: "p20", name: "بيتزا مشكل جبن", nameEn: "Mixed Cheese", price: 170, size: "كبير", isAvailable: true },
      { id: "p21", name: "بيتزا سوسيس", nameEn: "Sausage", price: 140, size: "وسط", isAvailable: true },
      { id: "p22", name: "بيتزا سوسيس", nameEn: "Sausage", price: 175, size: "كبير", isAvailable: true },
      { id: "p23", name: "بيتزا فراخ باربيكيو", nameEn: "BBQ Chicken", price: 170, size: "وسط", isAvailable: true },
      { id: "p24", name: "بيتزا فراخ باربيكيو", nameEn: "BBQ Chicken", price: 195, size: "كبير", isAvailable: true },
      { id: "p25", name: "بيتزا وردة شامية", nameEn: "Warda Shamya", price: 200, size: "وسط", isAvailable: true, isPopular: true },
      { id: "p26", name: "بيتزا وردة شامية", nameEn: "Warda Shamya", price: 230, size: "كبير", isAvailable: true },
      { id: "p27", name: "بيتزا رانش", nameEn: "Ranch", price: 170, size: "وسط", isAvailable: true },
      { id: "p28", name: "بيتزا رانش", nameEn: "Ranch", price: 195, size: "كبير", isAvailable: true },
      { id: "sf1", name: "صفيحة خضار", nameEn: "Vegetable Sfeeha", price: 900, weight: "كيلو", isAvailable: true },
      { id: "sf2", name: "صفيحة خضار", nameEn: "Vegetable Sfeeha", price: 450, weight: "نصف كيلو", isAvailable: true },
      { id: "sf3", name: "صفيحة خضار", nameEn: "Vegetable Sfeeha", price: 225, weight: "ربع كيلو", isAvailable: true },
      { id: "sf4", name: "صفيحة لحم", nameEn: "Meat Sfeeha", price: 900, weight: "كيلو", isAvailable: true },
      { id: "sf5", name: "صفيحة لحم", nameEn: "Meat Sfeeha", price: 450, weight: "نصف كيلو", isAvailable: true },
      { id: "sf6", name: "صفيحة لحم", nameEn: "Meat Sfeeha", price: 225, weight: "ربع كيلو", isAvailable: true }
    ]
  }
];