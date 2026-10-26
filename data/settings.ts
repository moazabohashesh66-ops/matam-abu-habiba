export const SETTINGS_KEY = "abu-habiba-settings";
export const SETTINGS_CHANGED_EVENT = "abu-habiba:settings-changed";
export const DEFAULT_FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61586004040638";

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
  phoneNumber: "201010062463",
  whatsappNumber: "201020633202",
  restaurantName: "كيان",
  facebookUrl: DEFAULT_FACEBOOK_URL,
  deliveryFee: 0,
  minimumOrderAmount: 0,
  deliveryAreas: "",
  businessHours: "يومياً من 12 ظهراً حتى 2 صباحاً",
  acceptingOrders: true,
};

export function normalizeSiteSettings(value: Partial<SiteSettings> | Record<string, unknown> = {}): SiteSettings {
  const settings = { ...defaultSettings, ...value } as SiteSettings;
  if (/(?:أبو|ابو)\s*حبيبه/.test(settings.restaurantName)) {
    return {
      ...settings,
      phoneNumber: defaultSettings.phoneNumber,
      whatsappNumber: defaultSettings.whatsappNumber,
      restaurantName: defaultSettings.restaurantName,
      facebookUrl: defaultSettings.facebookUrl,
    };
  }
  if (/^كيان\s+شاورما\s+وكريب$|^Kayan\s+Shawarma\s*&\s*Crepe$/i.test(settings.restaurantName.trim())) {
    settings.restaurantName = defaultSettings.restaurantName;
  }
  const facebookUrl = settings.facebookUrl.includes("61590812648091")
    ? defaultSettings.facebookUrl
    : settings.facebookUrl || defaultSettings.facebookUrl;
  return { ...settings, facebookUrl };
}

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
