export type OrderStatus = "new" | "preparing" | "ready" | "completed" | "cancelled";

export interface StoredOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface StoredOrder {
  id: number;
  order_code: string;
  customer_phone: string;
  fulfillment_method: "delivery" | "pickup";
  delivery_address: string | null;
  items: StoredOrderItem[];
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  coupon_code: string | null;
  status: OrderStatus;
  created_at: string;
}
