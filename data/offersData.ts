export interface Offer {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;  // السعر قبل الخصم
  image?: string;
  badge?: string;          // نص الشارة مثل "خصم 20%" أو "عرض اليوم"
  isAvailable: boolean;
}

// العروض الافتراضية (فارغة — Admin يضيفها)
export const defaultOffers: Offer[] = [];

export const OFFERS_STORAGE_KEY = "abu-habiba-offers-v1";
