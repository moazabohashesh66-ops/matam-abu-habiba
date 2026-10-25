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
}

export interface Category {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  products: Product[];
}

export const menuData: Category[] = [
  {
    id: "grill",
    name: "المشويات",
    nameEn: "Grills",
    icon: "🔥",
    products: [
      {
        id: "grill-1",
        name: "نصف فرخة مشوية",
        nameEn: "Half Grilled Chicken",
        price: 250,
        description: "نصف فرخة مشوية على الفحم مع توابل خاصة",
        descriptionEn: "Half chicken grilled over charcoal with special spices",
        isAvailable: true,
        isPopular: true
      },
      {
        id: "grill-2",
        name: "شيش طاووق",
        nameEn: "Shish Tawook",
        price: 220,
        description: "مكعبات دجاج متبلة ومشوية على الأسياخ",
        descriptionEn: "Marinated chicken cubes grilled on skewers",
        isAvailable: true,
        isPopular: true
      },
      {
        id: "grill-3",
        name: "كباب",
        nameEn: "Kebab",
        price: 350,
        description: "لحم ضاني مفروم مع بهارات خاصة مشوي على الفحم",
        descriptionEn: "Minced lamb with special spices grilled over charcoal",
        isAvailable: true
      }
    ]
  },
  {
    id: "appetizers",
    name: "المقبلات",
    nameEn: "Appetizers",
    icon: "🥗",
    products: [
      {
        id: "app-1",
        name: "حمص",
        nameEn: "Hummus",
        price: 80,
        description: "حمص بالطحينة وزيت زيتون",
        descriptionEn: "Chickpeas with tahini and olive oil",
        isAvailable: true
      },
      {
        id: "app-2",
        name: "متبل",
        nameEn: "Mutabbal",
        price: 90,
        description: "باذنجان مشوي مع طحينة ولبن",
        descriptionEn: "Grilled eggplant with tahini and yogurt",
        isAvailable: true
      },
      {
        id: "app-3",
        name: "ورق عنب",
        nameEn: "Stuffed Grape Leaves",
        price: 120,
        description: "ورق عنب محشي بالأرز واللحم",
        descriptionEn: "Grape leaves stuffed with rice and meat",
        isAvailable: true
      }
    ]
  },
  {
    id: "fatteh",
    name: "الفتة",
    nameEn: "Fatteh",
    icon: "🍲",
    products: [
      {
        id: "fat-1",
        name: "فتة حمص",
        nameEn: "Hummus Fatteh",
        price: 150,
        description: "فتة بالحمص واللبن واللحم",
        descriptionEn: "Fatteh with hummus, yogurt and meat",
        isAvailable: true
      },
      {
        id: "fat-2",
        name: "فتة باذنجان",
        nameEn: "Eggplant Fatteh",
        price: 140,
        description: "فتة بالباذنجان المقلي واللبن",
        descriptionEn: "Fatteh with fried eggplant and yogurt",
        isAvailable: true
      }
    ]
  },
  {
    id: "sandwiches",
    name: "السندوتشات",
    nameEn: "Sandwiches",
    icon: "🥙",
    products: [
      {
        id: "sand-1",
        name: "سندوتش شاورما دجاج",
        nameEn: "Chicken Shawarma Sandwich",
        price: 60,
        description: "شاورما دجاج مع خضار وسلطة",
        descriptionEn: "Chicken shawarma with vegetables and salad",
        isAvailable: true,
        isPopular: true
      },
      {
        id: "sand-2",
        name: "سندوتش شاورما لحم",
        nameEn: "Meat Shawarma Sandwich",
        price: 70,
        description: "شاورما لحم مع خضار وسلطة",
        descriptionEn: "Meat shawarma with vegetables and salad",
        isAvailable: true
      },
      {
        id: "sand-3",
        name: "سندوتش فلافل",
        nameEn: "Falafel Sandwich",
        price: 40,
        description: "فلافل مع خضار وطحينة",
        descriptionEn: "Falafel with vegetables and tahini",
        isAvailable: true
      }
    ]
  },
  {
    id: "juices",
    name: "العصائر",
    nameEn: "Juices",
    icon: "🧃",
    products: [
      {
        id: "juice-1",
        name: "عصير برتقال طازج",
        nameEn: "Fresh Orange Juice",
        price: 50,
        description: "عصير برتقال طازج 100%",
        descriptionEn: "100% fresh orange juice",
        isAvailable: true
      },
      {
        id: "juice-2",
        name: "عصير رمان",
        nameEn: "Pomegranate Juice",
        price: 60,
        description: "عصير رمان طازج",
        descriptionEn: "Fresh pomegranate juice",
        isAvailable: true
      },
      {
        id: "juice-3",
        name: "كوكتيل فواكه",
        nameEn: "Fruit Cocktail",
        price: 70,
        description: "مكس من الفواكه الطازجة",
        descriptionEn: "Mix of fresh fruits",
        isAvailable: true
      }
    ]
  },
  {
    id: "desserts",
    name: "الحلويات",
    nameEn: "Desserts",
    icon: "🍰",
    products: [
      {
        id: "des-1",
        name: "كنافة",
        nameEn: "Kunafa",
        price: 100,
        description: "كنافة بالقشطة أو بالجبنة",
        descriptionEn: "Kunafa with cream or cheese",
        isAvailable: true,
        isPopular: true
      },
      {
        id: "des-2",
        name: "بقلاوة",
        nameEn: "Baklava",
        price: 120,
        description: "بقلاوة بالفستق الحلبي",
        descriptionEn: "Baklava with Aleppo pistachio",
        isAvailable: true
      },
      {
        id: "des-3",
        name: "ممبار",
        nameEn: "Mumbar",
        price: 90,
        description: "حلويات شرقية متنوعة",
        descriptionEn: "Variety of oriental sweets",
        isAvailable: true
      }
    ]
  }
];