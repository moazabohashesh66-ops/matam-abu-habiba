"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { OrderStatus, StoredOrder } from "@/types/orders";

const statusLabels: Record<OrderStatus, string> = {
  new: "طلب جديد",
  preparing: "قيد التجهيز",
  ready: "جاهز",
  completed: "مكتمل",
  cancelled: "ملغي",
};

const statuses: OrderStatus[] = ["new", "preparing", "ready", "completed", "cancelled"];

function getOrderLocation(address: string | null): string | null {
  if (!address) return null;
  const match = address.match(/https:\/\/www\.google\.com\/maps\?q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (!match) return null;

  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return null;
  }

  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

function getOrderAddressText(address: string): string {
  return address
    .replace(/\nموقع الخريطة:.*$/m, "")
    .replace(/\nدقة الموقع التقريبية:.*$/m, "")
    .trim();
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async (): Promise<StoredOrder[]> => {
    const response = await fetch("/api/orders", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "تعذر تحميل الطلبات");
    return Array.isArray(data.orders) ? data.orders : [];
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      setOrders(await fetchOrders());
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "تعذر تحميل الطلبات");
    } finally {
      setLoading(false);
    }
  }, [fetchOrders]);

  useEffect(() => {
    let active = true;
    fetchOrders()
      .then((nextOrders) => { if (active) setOrders(nextOrders); })
      .catch((loadError: unknown) => { if (active) setError(loadError instanceof Error ? loadError.message : "تعذر تحميل الطلبات"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [fetchOrders]);

  const updateStatus = async (orderCode: string, status: OrderStatus) => {
    setOrders((previous) => previous.map((order) => order.order_code === orderCode ? { ...order, status } : order));
    const response = await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderCode, status }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || "تعذر حفظ حالة الطلب");
      void loadOrders();
    }
  };

  return (
    <main dir="rtl" className="min-h-screen bg-gradient-to-br from-gray-50 to-yellow-50 pb-16">
      <header className="bg-[#2E1A12] px-4 py-6 text-white shadow-xl sm:py-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">📦 متابعة الطلبات</h1>
            <p className="mt-1 text-sm text-white/60">الطلبات الجديدة وحالة تجهيزها</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => { setLoading(true); void loadOrders(); }} className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/10">تحديث</button>
            <Link href="/admin" className="rounded-full bg-yellow-400 px-4 py-2 text-sm font-bold text-[#2E1A12] hover:bg-yellow-300">لوحة الأدمن</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-4 px-3 py-6 sm:px-4 sm:py-8">
        {error && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">{error}</p>}
        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow">جارٍ تحميل الطلبات...</div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500 shadow-sm">
            <p className="text-4xl">🧾</p>
            <p className="mt-3 font-bold">لا توجد طلبات مسجلة حتى الآن</p>
            <p className="mt-1 text-sm">تحتاج المتابعة إلى تفعيل قاعدة البيانات وتشغيل إعدادها مرة واحدة.</p>
          </div>
        ) : orders.map((order) => (
          <article key={order.order_code} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-3">
              <div>
                <h2 className="font-bold text-[#2E1A12]">طلب #{order.order_code}</h2>
                <p className="mt-1 text-xs text-gray-500">{new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.created_at))}</p>
              </div>
              <select value={order.status} onChange={(event) => void updateStatus(order.order_code, event.target.value as OrderStatus)} aria-label={`حالة الطلب ${order.order_code}`} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800">
                {statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
              </select>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div className="space-y-1 text-gray-700">
                <p>📞 <a href={`tel:${order.customer_phone}`} dir="ltr" className="font-semibold text-blue-700">{order.customer_phone}</a></p>
                <p>🚚 {order.fulfillment_method === "delivery" ? "توصيل للمنزل" : "استلام من المطعم"}</p>
                {order.delivery_address && (
                  <div className="space-y-1">
                    <p className="whitespace-pre-line leading-relaxed">📍 {getOrderAddressText(order.delivery_address)}</p>
                    {getOrderLocation(order.delivery_address) && (
                      <a
                        href={getOrderLocation(order.delivery_address)!}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-9 items-center font-semibold text-blue-700 underline underline-offset-4"
                      >
                        فتح موقع العميل على الخريطة
                      </a>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                {order.items.map((item, index) => <p key={`${item.id}-${index}`} className="text-gray-700">{item.name} × {item.quantity} <span className="text-gray-400">= {item.price * item.quantity} ج.م</span></p>)}
                <p className="border-t border-gray-100 pt-2 font-extrabold text-[#2E1A12]">الإجمالي: {order.total} ج.م</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
