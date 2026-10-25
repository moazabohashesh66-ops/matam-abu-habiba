import { defaultSettings, type SiteSettings } from "@/data/settings";
import { defaultOffers, type Offer } from "@/data/offersData";
import { menuData, type Category } from "@/data/menuData";
import type { DiscountCoupon } from "@/data/coupons";

export interface SiteData {
  menuData: Category[];
  offers: Offer[];
  coupons: DiscountCoupon[];
  settings: SiteSettings;
}

export const defaultSiteData: SiteData = {
  menuData,
  offers: defaultOffers,
  coupons: [],
  settings: defaultSettings,
};
