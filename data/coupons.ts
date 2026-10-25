export type CouponDiscountType = "percentage" | "fixed";

export interface DiscountCoupon {
  id: string;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  isActive: boolean;
}

export const COUPONS_STORAGE_KEY = "abu-habiba-coupons-v1";
export const COUPONS_CHANGED_EVENT = "abu-habiba:coupons-changed";
