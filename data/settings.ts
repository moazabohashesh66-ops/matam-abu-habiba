export const SETTINGS_KEY = "abu-habiba-settings";
export const SETTINGS_CHANGED_EVENT = "abu-habiba:settings-changed";

export interface SiteSettings {
  phoneNumber: string; // رقم المطعم للمكالمات
  whatsappNumber: string; // مثال: 201099176750
  restaurantName: string;
  facebookUrl: string;
  deliveryFee: number;
  minimumOrderAmount: number;
  deliveryAreas: string;
  businessHours: string;
  acceptingOrders: boolean;
}

export const defaultSettings: SiteSettings = {
  phoneNumber: "201099176750",
  whatsappNumber: "201099176750",
  restaurantName: "مطعم أبو حبيبه",
  facebookUrl: "https://www.facebook.com/profile.php?id=61590812648091&locale=ar_AR",
  deliveryFee: 0,
  minimumOrderAmount: 0,
  deliveryAreas: "",
  businessHours: "يومياً من 12 ظهراً حتى 2 صباحاً",
  acceptingOrders: true,
};

const phoneDigits = (phone: string) => phone.replace(/\D/g, "").replace(/^00/, "");

export function toWhatsAppNumber(phone: string): string {
  const digits = phoneDigits(phone);
  if (digits.startsWith("0")) return `20${digits.slice(1)}`;
  return digits;
}

export function formatDisplayPhone(phone: string): string {
  const digits = phoneDigits(phone);
  if (digits.startsWith("20") && digits.length >= 12) return `0${digits.slice(2)}`;
  return phone.trim();
}

export function toTelephoneLink(phone: string): string {
  const digits = toWhatsAppNumber(phone);
  return digits ? `tel:+${digits}` : "tel:";
}

export function toFacebookUrl(value: string): string {
  try {
    const url = new URL(value);
    if (
      url.protocol === "https:" &&
      (url.hostname === "facebook.com" || url.hostname.endsWith(".facebook.com"))
    ) {
      return url.toString();
    }
  } catch {}
  return defaultSettings.facebookUrl;
}
