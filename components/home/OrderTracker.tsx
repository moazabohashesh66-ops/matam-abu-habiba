"use client";

import { useState, type FormEvent } from "react";
import type { OrderStatus } from "@/types/orders";

interface TrackedOrder {
  orderCode: string;
  status: OrderStatus;
  createdAt: string;
}

const statusDetails: Record<OrderStatus, { label: string; style: string }> = {
  new: { label: "طلب جديد", style: "border-sky-300/20 bg-sky-300/10 text-sky-200" },
  preparing: { label: "قيد التجهيز", style: "border-amber-300/20 bg-amber-300/10 text-amber-200" },
  ready: { label: "جاهز", style: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200" },
  completed: { label: "اكتمل", style: "border-green-300/20 bg-green-300/10 text-green-200" },
  cancelled: { label: "ملغي", style: "border-red-300/20 bg-red-300/10 text-red-200" },
};

function normalizePhone(value: string) {
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
  const easternArabicDigits = "۰۱۲۳۴۵۶۷۸۹";
  return value
    .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(easternArabicDigits.indexOf(digit)))
    .replace(/\D/g, "");
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default function OrderTracker() {
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<TrackedOrder[]>([]);
  const [checkedPhone, setCheckedPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const lookupOrders = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedPhone = normalizePhone(phone);
    if (normalizedPhone.length < 8 || normalizedPhone.length > 15) {
      setOrders([]);
      setCheckedPhone("");
      setMessage("اكتب رقم الهاتف المستخدم في الطلب بشكل صحيح.");
      return;
    }

    setIsLoading(true);
    setMessage("");
    setCheckedPhone(normalizedPhone);
    try {
      const response = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({ phone: normalizedPhone }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "تعذر البحث عن الطلب الآن.");

      const foundOrders = Array.isArray(data.orders) ? data.orders as TrackedOrder[] : [];
      setOrders(foundOrders);
      setMessage(foundOrders.length ? "" : "لم نجد طلبات مسجلة بهذا الرقم.");
    } catch (error) {
      setOrders([]);
      setMessage(error instanceof Error ? error.message : "تعذر البحث عن الطلب الآن.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-3 z-40 sm:bottom-6 sm:left-6" dir="rtl">
      {isOpen && (
        <section
          id="order-tracker-panel"
          aria-label="متابعة الطلب"
          className="absolute bottom-[calc(100%+0.75rem)] left-0 flex max-h-[min(70vh,34rem)] w-[calc(100vw-1.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-yellow-300/20 bg-[#1a0e0a] shadow-2xl shadow-black/50"
        >
          <header className="flex items-start justify-between gap-3 border-b border-white/10 bg-white/[0.03] p-4">
            <div>
              <h2 className="font-bold text-white">متابعة طلبك</h2>
              <p className="mt-1 text-xs leading-5 text-white/60">اكتب رقم الهاتف الذي سجلت به الطلب.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="إغلاق متابعة الطلب"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/15"
            >
              ×
            </button>
          </header>

          <div className="overflow-y-auto p-4">
            <form onSubmit={(event) => void lookupOrders(event)} className="flex gap-2">
              <label className="sr-only" htmlFor="track-order-phone">رقم الهاتف</label>
              <input
                id="track-order-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="رقم الهاتف"
                maxLength={24}
                className="min-h-11 min-w-0 flex-1 rounded-xl border border-white/15 bg-white/10 px-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-yellow-400"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="min-h-11 shrink-0 rounded-xl bg-yellow-400 px-4 text-sm font-bold text-[#1a0e0a] transition hover:bg-yellow-300 disabled:cursor-wait disabled:opacity-60"
              >
                {isLoading ? "جارٍ البحث" : "استعلام"}
              </button>
            </form>

            {message && (
              <p role="status" className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm leading-6 text-white/75">
                {message}
              </p>
            )}

            {orders.length > 0 && checkedPhone === normalizePhone(phone) && (
              <div className="mt-3 space-y-2.5" aria-live="polite">
                {orders.map((order) => {
                  const status = statusDetails[order.status];
                  return (
                    <article key={`${order.orderCode}-${order.createdAt}`} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-bold text-white">طلب رقم <span dir="ltr">{order.orderCode}</span></p>
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${status.style}`}>{status.label}</span>
                      </div>
                      {formatDate(order.createdAt) && <p className="mt-2 text-xs text-white/50">{formatDate(order.createdAt)}</p>}
                    </article>
                  );
                })}
                <p className="text-center text-[11px] leading-5 text-white/45">تظهر أحدث 10 طلبات مسجلة بهذا الرقم.</p>
              </div>
            )}
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls="order-tracker-panel"
        className="flex min-h-12 items-center gap-2 rounded-full border border-yellow-200/20 bg-[#25160f] px-4 text-sm font-bold text-yellow-200 shadow-xl shadow-black/30 transition hover:bg-[#342015] sm:min-h-14 sm:px-5 sm:text-base"
      >
        <span aria-hidden="true">🧾</span>
        <span>متابعة الطلب</span>
      </button>
    </div>
  );
}
