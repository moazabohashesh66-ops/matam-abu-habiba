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
  const [notice, setNotice] = useState("");
  const [deletingOrderCode, setDeletingOrderCode] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);

  const sortNewestFirst = (ordersToSort: StoredOrder[]) =>
    [...ordersToSort].sort((first, second) => {
      const newOrderPriority = Number(first.status !== "new") - Number(second.status !== "new");
      return newOrderPriority || Date.parse(second.created_at) - Date.parse(first.created_at);
    });

  const fetchOrders = useCallback(async (): Promise<StoredOrder[]> => {
    const response = await fetch("/api/orders", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "تعذر تحميل الطلبات");
    return Array.isArray(data.orders) ? sortNewestFirst(data.orders) : [];
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
    setError("");
    setNotice("");
    setOrders((previous) => sortNewestFirst(previous.map((order) => order.order_code === orderCode ? { ...order, status } : order)));
    try {
      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderCode, status }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        await loadOrders();
        setError(data.error || "تعذر حفظ حالة الطلب");
        return;
      }
      setNotice("تم تحديث حالة الطلب.");
    } catch {
      await loadOrders();
      setError("تعذر حفظ حالة الطلب. تحقق من الاتصال ثم حاول مرة أخرى.");
    }
  };

  const deleteOrder = async (orderCode: string) => {
    const order = orders.find((entry) => entry.order_code === orderCode);
    if (!order || (order.status !== "completed" && order.status !== "cancelled")) return;
    if (!window.confirm(`هل تريد حذف سجل الطلب رقم ${orderCode} نهائيًا؟`)) return;

    setDeletingOrderCode(orderCode);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderCode }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "تعذر حذف سجل الطلب");
      setOrders((previous) => previous.filter((entry) => entry.order_code !== orderCode));
      setNotice(`تم حذف سجل الطلب رقم ${orderCode}.`);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "تعذر حذف سجل الطلب");
    } finally {
      setDeletingOrderCode(null);
    }
  };

  const deleteAllOrders = async () => {
    if (orders.length === 0 || deletingAll || deletingOrderCode) return;
    const confirmed = window.confirm(
      "سيتم حذف جميع الطلبات المسجلة نهائيًا، بما فيها الطلبات الجديدة وقيد التجهيز. لا يمكن التراجع. هل تريد المتابعة؟",
    );
    if (!confirmed) return;

    setDeletingAll(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteAll: true }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "تعذر حذف الطلبات");
      setOrders([]);
      setNotice(`تم حذف ${data.deleted ?? orders.length} سجل طلب.`);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "تعذر حذف الطلبات");
    } finally {
      setDeletingAll(false);
    }
  };

  const logout = async () => {
    setError("");
    try {
      const response = await fetch("/api/admin/orders-auth", { method: "DELETE" });
      if (!response.ok) throw new Error("تعذر تسجيل الخروج");
      window.location.reload();
    } catch {
      setError("تعذر تسجيل الخروج. حاول مرة أخرى.");
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
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => { setLoading(true); void loadOrders(); }} className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/10">تحديث</button>
            {orders.length > 0 && (
              <button
                type="button"
                onClick={() => void deleteAllOrders()}
                disabled={deletingAll || deletingOrderCode !== null || loading}
                className="rounded-full border border-red-300/40 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/20 disabled:cursor-wait disabled:opacity-50"
              >
                {deletingAll ? "جارٍ حذف الطلبات…" : "حذف كل الطلبات"}
              </button>
            )}
            <button type="button" onClick={() => void logout()} className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/10">خروج</button>
            <Link href="/admin" className="rounded-full bg-yellow-400 px-4 py-2 text-sm font-bold text-[#2E1A12] hover:bg-yellow-300">لوحة الأدمن</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-4 px-3 py-6 sm:px-4 sm:py-8">
        {error && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">{error}</p>}
        {notice && <p role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800">{notice}</p>}
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
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${order.status === "completed" ? "bg-green-100 text-green-800" : order.status === "cancelled" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-900"}`}>
                  {statusLabels[order.status]}
                </span>
                <label className="sr-only" htmlFor={`order-status-${order.id}`}>تغيير حالة الطلب {order.order_code}</label>
                <select id={`order-status-${order.id}`} value={order.status} disabled={deletingAll} onChange={(event) => void updateStatus(order.order_code, event.target.value as OrderStatus)} className="min-h-10 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 disabled:opacity-50">
                  {statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div className="space-y-1 text-gray-700">
                <p className="font-semibold">👤 صاحب الطلب: {order.customer_name?.trim() || "الاسم غير مسجل"}</p>
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
            {(order.status === "completed" || order.status === "cancelled") && (
              <div className="mt-4 flex justify-end border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={() => void deleteOrder(order.order_code)}
                  disabled={deletingAll || deletingOrderCode === order.order_code}
                  className="min-h-10 rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-50"
                >
                  {deletingOrderCode === order.order_code ? "جارٍ حذف السجل…" : "حذف السجل"}
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
