"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useCart, type CartItem } from "@/contexts/CartContext";
import { defaultSettings, toWhatsAppNumber } from "@/data/settings";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCoupons } from "@/hooks/useCoupons";

interface InvoiceDetails {
  restaurantName: string;
  orderCode: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  fulfillmentMethod: "delivery" | "pickup";
  deliveryAddress?: string;
  location?: { latitude: number; longitude: number; accuracy: number };
  items: CartItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  couponCode?: string;
  amountDue: number;
}

function normalizePhoneNumber(value: string): string {
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
  const easternArabicDigits = "۰۱۲۳۴۵۶۷۸۹";
  return value
    .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(easternArabicDigits.indexOf(digit)))
    .replace(/\D/g, "");
}

function wrapCanvasText(context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function createOrderCode(): string {
  return Date.now().toString().slice(-8);
}

function createInvoiceFile(details: InvoiceDetails): File {
  const width = 960;
  const margin = 56;
  const invoiceFontFamily = getComputedStyle(document.body).fontFamily || "Arial, sans-serif";
  const measureCanvas = document.createElement("canvas");
  const measureContext = measureCanvas.getContext("2d");
  if (!measureContext) throw new Error("تعذر تجهيز صورة الفاتورة");
  measureContext.font = `500 27px ${invoiceFontFamily}`;

  const rows = details.items.map((item) => {
    const label = `${item.name} × ${item.quantity}`;
    const lines = wrapCanvasText(measureContext, label, 560);
    return { item, lines, height: Math.max(66, lines.length * 38 + 20) };
  });
  const infoLines = [
    `اسم العميل: ${details.customerName}`,
    `رقم التواصل: ${details.customerPhone}`,
    `طريقة الاستلام: ${details.fulfillmentMethod === "delivery" ? "توصيل للمنزل" : "استلام من المطعم"}`,
    ...(details.deliveryAddress
      ? wrapCanvasText(measureContext, `العنوان: ${details.deliveryAddress}`, 790)
      : []),
    ...(details.location
      ? [
          `الموقع: ${details.location.latitude.toFixed(6)}, ${details.location.longitude.toFixed(6)}`,
          `دقة الموقع التقريبية: ±${Math.round(details.location.accuracy)} متر`,
        ]
      : []),
  ];
  const infoTop = 310;
  const infoBoxHeight = infoLines.length * 36 + 20;
  const tableHeaderTop = infoTop + infoBoxHeight + 20;
  const tableTop = tableHeaderTop + 46;
  const rowsHeight = rows.reduce((sum, row) => sum + row.height, 0);
  const totalsTop = tableTop + rowsHeight + 28;
  const deliveryFeeTop = totalsTop + (details.couponCode && details.discount > 0 ? 122 : 76);
  const totalsBoxTop = deliveryFeeTop + (details.deliveryFee > 0 ? 48 : 0) + 29;
  const height = totalsBoxTop + 160;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("تعذر تجهيز صورة الفاتورة");

  context.fillStyle = "#f3f0ea";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#ffffff";
  context.fillRect(28, 28, width - 56, height - 56);
  context.fillStyle = "#2e1a12";
  context.fillRect(28, 28, width - 56, 198);
  context.fillStyle = "#e6b922";
  context.fillRect(28, 28, width - 56, 9);

  const drawText = (
    text: string,
    x: number,
    y: number,
    font: string,
    color: string,
    align: CanvasTextAlign = "right",
  ) => {
    context.direction = "rtl";
    context.textAlign = align;
    context.textBaseline = "middle";
    context.font = font;
    context.fillStyle = color;
    context.fillText(text, x, y);
  };

  drawText(details.restaurantName, width / 2, 92, `700 42px ${invoiceFontFamily}`, "#ffffff", "center");
  drawText("فاتورة طلب", width / 2, 148, `600 28px ${invoiceFontFamily}`, "#f5d76e", "center");

  drawText(`رقم الفاتورة: ${details.orderCode}`, width - margin, 274, `600 25px ${invoiceFontFamily}`, "#2e1a12");
  context.direction = "rtl";
  context.textAlign = "left";
  context.textBaseline = "middle";
  context.font = `500 23px ${invoiceFontFamily}`;
  context.fillStyle = "#6b625e";
  context.fillText(details.createdAt, margin, 274);

  context.fillStyle = "#f7f5f1";
  context.fillRect(margin, infoTop, width - margin * 2, infoBoxHeight);
  infoLines.forEach((line, index) => {
    drawText(line, width - margin - 16, infoTop + 20 + index * 36, `500 21px ${invoiceFontFamily}`, "#5a3825");
  });

  context.fillStyle = "#f7f5f1";
  context.fillRect(margin, tableHeaderTop, width - margin * 2, 44);
  drawText("الصنف والكمية", width - margin - 14, tableHeaderTop + 22, `700 20px ${invoiceFontFamily}`, "#5a3825");
  context.direction = "rtl";
  context.textAlign = "left";
  context.font = `700 20px ${invoiceFontFamily}`;
  context.fillStyle = "#5a3825";
  context.fillText("السعر", margin + 14, tableHeaderTop + 22);

  let rowTop = tableTop;
  for (const row of rows) {
    context.fillStyle = "#e8e2da";
    context.fillRect(margin, rowTop, width - margin * 2, 1);
    const firstLineY = rowTop + (row.height - row.lines.length * 34) / 2 + 17;
    row.lines.forEach((line, index) => {
      drawText(line, width - margin - 14, firstLineY + index * 34, `500 25px ${invoiceFontFamily}`, "#30251f");
    });
    context.direction = "rtl";
    context.textAlign = "left";
    context.textBaseline = "middle";
    context.font = `600 24px ${invoiceFontFamily}`;
    context.fillStyle = "#30251f";
    context.fillText(`${(row.item.price * row.item.quantity).toLocaleString("ar-EG")} ج.م`, margin + 14, rowTop + row.height / 2);
    rowTop += row.height;
  }
  context.fillStyle = "#e8e2da";
  context.fillRect(margin, rowTop, width - margin * 2, 1);

  const totalLine = (label: string, amount: number, y: number, emphasized = false) => {
    drawText(label, width - margin - 14, y, `${emphasized ? "700" : "500"} ${emphasized ? 30 : 23}px ${invoiceFontFamily}`, emphasized ? "#2e1a12" : "#6b625e");
    context.direction = "rtl";
    context.textAlign = "left";
    context.textBaseline = "middle";
    context.font = `${emphasized ? "700 32px" : "600 24px"} ${invoiceFontFamily}`;
    context.fillStyle = emphasized ? "#b38308" : "#30251f";
    context.fillText(`${amount.toLocaleString("ar-EG")} ج.م`, margin + 14, y);
  };

  totalLine("قيمة الطلب", details.subtotal, totalsTop + 30);
  if (details.couponCode && details.discount > 0) {
    totalLine(`خصم الكود ${details.couponCode}`, -details.discount, totalsTop + 76);
  }
  if (details.deliveryFee > 0) {
    totalLine("مصاريف التوصيل", details.deliveryFee, deliveryFeeTop);
  }
  context.fillStyle = "#f7f5f1";
  context.fillRect(margin, totalsBoxTop, width - margin * 2, 76);
  totalLine("الإجمالي المطلوب", details.amountDue, totalsBoxTop + 38, true);
  drawText("شكراً لثقتكم ونتمنى لكم وجبة شهية", width / 2, totalsBoxTop + 112, `500 21px ${invoiceFontFamily}`, "#796e67", "center");

  const dataUrl = canvas.toDataURL("image/png");
  const base64 = dataUrl.split(",")[1];
  if (!base64) throw new Error("تعذر إنشاء صورة الفاتورة");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new File([bytes], `invoice-${details.orderCode}.png`, { type: "image/png" });
}

export default function Cart() {
  const { items, removeItem, updateQuantity, clearCart, total, count, isOpen, setIsOpen } = useCart();
  const { settings } = useSiteSettings();
  const { coupons, isLoaded: couponsLoaded } = useCoupons();
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [couponFeedback, setCouponFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [orderNotice, setOrderNotice] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [fulfillmentMethod, setFulfillmentMethod] = useState<"delivery" | "pickup">("delivery");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [locationPoint, setLocationPoint] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<{ type: "loading" | "success" | "error"; text: string } | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<"review" | "details">("review");
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutErrorField, setCheckoutErrorField] = useState<"name" | "phone" | "address" | "order" | null>(null);
  const [visualViewportFrame, setVisualViewportFrame] = useState<{ height: number; top: number } | null>(null);
  const cartContentRef = useRef<HTMLDivElement>(null);

  const closeCart = useCallback(() => {
    setIsOpen(false);
    setCheckoutStep("review");
    setCheckoutError("");
    setCheckoutErrorField(null);
    setOrderNotice("");
  }, [setIsOpen]);

  const appliedCoupon = coupons.find(
    (coupon) => coupon.isActive && coupon.code.toUpperCase() === appliedCouponCode,
  );
  const couponDiscount = appliedCoupon
    ? Math.min(
        total,
        appliedCoupon.discountType === "percentage"
          ? Math.round((total * appliedCoupon.discountValue) / 100)
          : appliedCoupon.discountValue,
      )
    : 0;
  const deliveryFee = fulfillmentMethod === "delivery" ? Math.max(0, Number(settings.deliveryFee) || 0) : 0;
  const amountDue = Math.max(0, total - couponDiscount + deliveryFee);
  const visibleCouponFeedback = couponsLoaded && appliedCouponCode && !appliedCoupon
    ? { type: "error" as const, text: "الكود غير متاح حالياً، ولم يعد الخصم محسوباً" }
    : couponFeedback;

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen, closeCart]);

  useEffect(() => {
    if (!isOpen) {
      setVisualViewportFrame(null);
      return;
    }

    const viewport = window.visualViewport;
    if (!viewport) return;

    const updateViewportFrame = () => {
      setVisualViewportFrame({
        height: Math.round(viewport.height),
        top: Math.round(viewport.offsetTop),
      });
    };

    updateViewportFrame();
    viewport.addEventListener("resize", updateViewportFrame);
    viewport.addEventListener("scroll", updateViewportFrame);
    window.addEventListener("resize", updateViewportFrame);

    return () => {
      viewport.removeEventListener("resize", updateViewportFrame);
      viewport.removeEventListener("scroll", updateViewportFrame);
      window.removeEventListener("resize", updateViewportFrame);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && cartContentRef.current) {
      cartContentRef.current.scrollTop = 0;
    }
  }, [checkoutStep, isOpen]);

  const applyCoupon = () => {
    if (!couponsLoaded) {
      setCouponFeedback({ type: "error", text: "انتظر لحظة حتى يتم تحميل أكواد الخصم" });
      return;
    }
    const code = couponCodeInput.trim().replace(/\s+/g, "").toUpperCase();
    if (!code) {
      setAppliedCouponCode("");
      setCouponFeedback({ type: "error", text: "اكتب كود الخصم أولاً" });
      return;
    }

    const coupon = coupons.find((item) => item.isActive && item.code.toUpperCase() === code);
    if (!coupon) {
      setAppliedCouponCode("");
      setCouponFeedback({ type: "error", text: "الكود غير صحيح أو غير متاح حالياً" });
      return;
    }

    setAppliedCouponCode(coupon.code.toUpperCase());
    setCouponFeedback({ type: "success", text: "تم تطبيق كود الخصم" });
  };

  const removeCoupon = () => {
    setAppliedCouponCode("");
    setCouponCodeInput("");
    setCouponFeedback(null);
  };

  const locateCustomer = () => {
    if (!navigator.geolocation) {
      setLocationStatus({ type: "error", text: "تحديد الموقع غير متاح في هذا المتصفح. اكتب العنوان بالتفصيل." });
      return;
    }

    setLocationPoint(null);
    setLocationStatus({ type: "loading", text: "جارٍ تحديد موقعك الحالي…" });
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nextLocation = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        };
        setLocationPoint(nextLocation);
        const accuracy = Math.round(coords.accuracy);
        setLocationStatus({
          type: "success",
          text: accuracy <= 100
            ? `تم تحديد موقعك بدقة تقريبية ±${accuracy} متر.`
            : `الموقع تقريبي ±${accuracy} متر؛ جرّب مكاناً مفتوحاً للحصول على دقة أفضل.`,
        });
      },
      (error) => {
        setLocationStatus({
          type: "error",
          text: error.code === 1
            ? "اسمح للموقع بالوصول إلى موقعك من إعدادات المتصفح، أو اكتب العنوان بالتفصيل."
            : error.code === 3
              ? "استغرق تحديد الموقع وقتاً طويلاً. أعد المحاولة أو اكتب العنوان بالتفصيل."
              : "تعذر تحديد موقعك الآن. أعد المحاولة أو اكتب العنوان بالتفصيل.",
        });
      },
      { enableHighAccuracy: true, timeout: 25000, maximumAge: 0 },
    );
  };

  const buildWhatsAppMsg = (orderCode: string) => {
    const lines = items.map(
      (i) => `• ${i.name} × ${i.quantity} = ${i.price * i.quantity} ج.م`
    );
    const restaurantName = settings.restaurantName || defaultSettings.restaurantName;
    const discountLine = appliedCoupon && couponDiscount > 0
      ? `\nالخصم (${appliedCoupon.code}): -${couponDiscount} ج.م`
      : "";
    const normalizedCustomerPhone = normalizePhoneNumber(customerPhone);
    const mapsUrl = locationPoint
      ? `https://www.google.com/maps?q=${locationPoint.latitude.toFixed(6)},${locationPoint.longitude.toFixed(6)}`
      : "";
    const orderDetails = [
      `اسم العميل: ${customerName.trim()}`,
      `رقم التواصل: ${normalizedCustomerPhone}`,
      `طريقة الاستلام: ${fulfillmentMethod === "delivery" ? "توصيل للمنزل" : "استلام من المطعم"}`,
      ...(fulfillmentMethod === "delivery" && deliveryAddress.trim()
        ? [`العنوان: ${deliveryAddress.trim()}`]
        : []),
      ...(fulfillmentMethod === "delivery" && locationPoint && mapsUrl
        ? [`الموقع على الخريطة: ${mapsUrl}`, `دقة تحديد الموقع التقريبية: ±${Math.round(locationPoint.accuracy)} متر`]
        : []),
    ];
    return [
      `طلب جديد من ${restaurantName}`,
      `رقم الطلب: ${orderCode}`,
      ...orderDetails,
      "--------------------",
      "المنتجات:",
      ...lines,
      "--------------------",
      `قيمة الطلب: ${total} ج.م${discountLine}`,
      ...(deliveryFee > 0 ? [`مصاريف التوصيل: ${deliveryFee} ج.م`] : []),
      `الإجمالي المطلوب: ${amountDue} ج.م`,
      "شكراً لثقتكم.",
    ].join("\n");
  };

  const handleOrder = () => {
    if (items.length === 0) return;
    if (!settings.acceptingOrders) {
      setCheckoutError("المطعم لا يستقبل طلبات في الوقت الحالي.");
      setCheckoutErrorField("order");
      return;
    }
    if (total < Math.max(0, Number(settings.minimumOrderAmount) || 0)) {
      setCheckoutError(`الحد الأدنى للطلب ${settings.minimumOrderAmount} ج.م.`);
      setCheckoutErrorField("order");
      return;
    }
    const normalizedCustomerPhone = normalizePhoneNumber(customerPhone);
    if (customerName.trim().length < 2) {
      setCheckoutError("اكتب اسم العميل للتواصل معك عند الحاجة.");
      setCheckoutErrorField("name");
      document.getElementById("customer-name")?.focus();
      return;
    }
    if (normalizedCustomerPhone.length < 8 || normalizedCustomerPhone.length > 15) {
      setCheckoutError("اكتب رقم تواصل صحيحاً من 8 إلى 15 رقماً.");
      setCheckoutErrorField("phone");
      document.getElementById("customer-phone")?.focus();
      return;
    }
    if (fulfillmentMethod === "delivery" && !deliveryAddress.trim()) {
      setCheckoutError("اكتب عنوان التوصيل بالتفصيل.");
      setCheckoutErrorField("address");
      document.getElementById("delivery-address")?.focus();
      return;
    }
    setCheckoutError("");
    setCheckoutErrorField(null);

    const phone = toWhatsAppNumber(settings.whatsappNumber || defaultSettings.whatsappNumber);
    const orderCode = createOrderCode();
    const googleMapsUrl = locationPoint
      ? `https://www.google.com/maps?q=${locationPoint.latitude.toFixed(6)},${locationPoint.longitude.toFixed(6)}`
      : "";
    const addressForOrder = fulfillmentMethod === "delivery"
      ? [
          deliveryAddress.trim(),
          ...(locationPoint && googleMapsUrl ? [`موقع الخريطة: ${googleMapsUrl}`, `دقة الموقع التقريبية: ±${Math.round(locationPoint.accuracy)} متر`] : []),
        ].join("\n")
      : "";
    const message = buildWhatsAppMsg(orderCode);
    const whatsAppUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    const orderRegistration = fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        orderCode,
        customerName: customerName.trim(),
        customerPhone: normalizedCustomerPhone,
        fulfillmentMethod,
        deliveryAddress: addressForOrder,
        items: items.map(({ id, name, price, quantity, productId, selectedOptionIds, offerId }) => ({
          id,
          name,
          price,
          quantity,
          productId,
          selectedOptionIds,
          offerId,
        })),
        subtotal: total,
        discount: couponDiscount,
        deliveryFee,
        total: amountDue,
        couponCode: appliedCoupon?.code,
      }),
    }).then((response) => response.ok);

    const openWhatsAppAndClearCart = () => {
      window.open(whatsAppUrl, "_blank", "noopener,noreferrer");
      clearCart();
      setCheckoutStep("review");
      setCheckoutError("");
      setCheckoutErrorField(null);
      setAppliedCouponCode("");
      setCouponCodeInput("");
      setCouponFeedback(null);
      setOrderNotice("تم فتح واتساب بالطلب وأُفرغت السلة. أكمل إرسال الرسالة في محادثة المطعم.");
    };

    const restaurantName = settings.restaurantName || defaultSettings.restaurantName;
    let invoice: File;

    try {
      invoice = createInvoiceFile({
        restaurantName,
        orderCode,
        createdAt: new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(new Date()),
        customerName: customerName.trim(),
        customerPhone: normalizedCustomerPhone,
        fulfillmentMethod,
        deliveryAddress: fulfillmentMethod === "delivery" ? deliveryAddress.trim() : undefined,
        location: fulfillmentMethod === "delivery" ? locationPoint ?? undefined : undefined,
        items,
        subtotal: total,
        discount: couponDiscount,
        deliveryFee,
        couponCode: appliedCoupon?.code,
        amountDue,
      });
    } catch {
      openWhatsAppAndClearCart();
      setOrderNotice("تفاصيل الطلب جاهزة في واتساب؛ تعذر تجهيز صورة الفاتورة.");
      void orderRegistration.then((saved) => {
        if (!saved) setOrderNotice("واتساب مفتوح والسلة أُفرغت، لكن تعذر تسجيل الطلب في لوحة المتابعة.");
      }).catch(() => setOrderNotice("واتساب مفتوح والسلة أُفرغت، لكن تعذر تسجيل الطلب في لوحة المتابعة."));
      return;
    }

    let clipboardWrite: Promise<void> | null = null;
    if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
      try {
        clipboardWrite = navigator.clipboard.write([
          new ClipboardItem({ [invoice.type]: invoice }),
        ]);
      } catch {
        clipboardWrite = null;
      }
    }

    setOrderNotice("جارٍ تسجيل الطلب وفتح واتساب...");
    openWhatsAppAndClearCart();
    void orderRegistration.then((saved) => {
      if (!saved) setOrderNotice("واتساب مفتوح والسلة أُفرغت، لكن تعذر تسجيل الطلب في لوحة المتابعة.");
    }).catch(() => setOrderNotice("واتساب مفتوح والسلة أُفرغت، لكن تعذر تسجيل الطلب في لوحة المتابعة."));
    if (clipboardWrite) {
      clipboardWrite.then(() => {
        setOrderNotice("الصق صورة الفاتورة في محادثة واتساب؛ السلة أصبحت فارغة.");
      }).catch(() => {
        setOrderNotice("تعذر نسخ الصورة؛ تفاصيل الطلب جاهزة في واتساب والسلة أصبحت فارغة.");
      });
    } else {
      setOrderNotice("تفاصيل الطلب جاهزة في واتساب؛ السلة أصبحت فارغة.");
    }
  };

  return (
    <>
      {/* ===== خلفية شفافة ===== */}
      <AnimatePresence>
        {isOpen && (
          <motion.button
            type="button"
            aria-label="إغلاق السلة"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 z-40 cursor-default bg-black/50"
          />
        )}
      </AnimatePresence>

      {/* ===== درج السلة ===== */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
            style={{
              height: visualViewportFrame ? `${visualViewportFrame.height}px` : "100dvh",
              top: visualViewportFrame ? `${visualViewportFrame.top}px` : "0px",
            }}
            className="fixed right-0 z-50 flex min-h-0 w-full max-w-sm flex-col border-l border-white/10 bg-[#1a0e0a] shadow-2xl"
            dir="rtl"
          >
            {/* رأس السلة */}
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] sm:p-5">
              <div>
                <h2 id="cart-title" className="text-xl font-bold text-white">
                  {checkoutStep === "review" ? "🛒 مراجعة الأوردر" : "بيانات الاستلام"}
                </h2>
                <p className="text-white/40 text-sm">
                  {checkoutStep === "review" ? `${count} صنف` : "الخطوة 2 من 2"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {items.length > 0 && checkoutStep === "review" && (
                  <button
                    onClick={clearCart}
                    className="text-xs text-red-400 hover:text-red-300 transition border border-red-400/30 px-3 py-1 rounded-full"
                  >
                    مسح الكل
                  </button>
                )}
                {checkoutStep === "details" && (
                  <button
                    onClick={() => { setCheckoutStep("review"); setCheckoutError(""); setCheckoutErrorField(null); }}
                    className="min-h-9 rounded-full border border-white/15 px-3 text-xs font-semibold text-white/75 transition hover:bg-white/10"
                  >
                    رجوع للأصناف
                  </button>
                )}
                <button
                  onClick={closeCart}
                  aria-label="إغلاق السلة"
                  className="flex min-h-10 min-w-10 items-center justify-center text-2xl leading-none text-white/60 transition hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* المحتوى */}
            <div ref={cartContentRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {(items.length === 0 || checkoutStep === "review") && (
            <div className="min-h-full space-y-2.5 p-3 sm:p-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                  <div className="text-6xl opacity-60">{orderNotice ? "✅" : "🛒"}</div>
                  <p className="text-white/75 text-lg font-semibold">{orderNotice ? "طلبك جاهز في واتساب" : "السلة فارغة"}</p>
                  {orderNotice ? (
                    <p role="status" aria-live="polite" className="max-w-xs text-sm leading-relaxed text-white/60">{orderNotice}</p>
                  ) : (
                    <p className="text-white/20 text-sm">أضف منتجات من المنيو</p>
                  )}
                  <button
                    onClick={closeCart}
                    className="mt-4 border border-yellow-400/30 text-yellow-400 px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-yellow-400/10 transition"
                  >
                    {orderNotice ? "العودة للمنيو" : "تصفح المنيو"}
                  </button>
                </div>
              ) : (
                <>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex gap-2.5 rounded-2xl border border-white/5 bg-white/5 p-2.5"
                  >
                    {/* صورة المنتج */}
                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-white/10 sm:h-14 sm:w-14">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          unoptimized={item.image.startsWith("data:")}
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center text-2xl">
                          {item.categoryIcon || "🍽️"}
                        </div>
                      )}
                    </div>

                    {/* التفاصيل */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm line-clamp-1">{item.name}</p>
                      <p className="mt-1 text-xs font-bold text-yellow-400">
                        {item.price} × {item.quantity} = {item.price * item.quantity} ج.م
                      </p>
                    </div>

                    {/* التحكم في الكمية */}
                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="flex min-h-9 min-w-9 items-center justify-center rounded-full bg-yellow-500/20 text-sm font-bold text-yellow-400 transition hover:bg-yellow-500/40"
                      >
                        +
                      </button>
                      <span className="flex min-h-7 min-w-9 items-center justify-center text-sm font-bold text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="flex min-h-9 min-w-9 items-center justify-center rounded-full bg-red-500/20 text-sm font-bold text-red-400 transition hover:bg-red-500/40"
                      >
                        −
                      </button>
                    </div>

                    {/* حذف */}
                    <button
                      onClick={() => removeItem(item.id)}
                      aria-label={`حذف ${item.name} من السلة`}
                      className="flex min-h-9 min-w-9 items-center justify-center self-start text-lg text-white/45 transition hover:text-red-400"
                    >
                      ✕
                    </button>
                  </motion.div>
                ))}

                <div className="space-y-2 pt-2">
                  <label htmlFor="cart-coupon" className="text-sm font-semibold text-white/75">كود الخصم</label>
                  <div className="flex gap-2">
                    <input
                      id="cart-coupon"
                      value={couponCodeInput}
                      onChange={(event) => setCouponCodeInput(event.target.value)}
                      onKeyDown={(event) => { if (event.key === "Enter") applyCoupon(); }}
                      disabled={!couponsLoaded}
                      placeholder="اكتب الكود هنا"
                      dir="ltr"
                      autoCapitalize="characters"
                      className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left text-sm text-white placeholder:text-white/30 focus:border-yellow-400/60 focus:outline-none disabled:opacity-50"
                    />
                    {appliedCoupon ? (
                      <button type="button" onClick={removeCoupon} className="rounded-xl border border-white/15 px-4 text-sm font-semibold text-white/70 hover:bg-white/10">
                        إزالة
                      </button>
                    ) : (
                      <button type="button" onClick={applyCoupon} disabled={!couponsLoaded} className="rounded-xl bg-yellow-500 px-4 text-sm font-bold text-[#24150e] hover:bg-yellow-400 disabled:opacity-50">
                        تطبيق
                      </button>
                    )}
                  </div>
                  {visibleCouponFeedback && (
                    <p className={`text-xs ${visibleCouponFeedback.type === "success" ? "text-green-400" : "text-red-300"}`}>
                      {visibleCouponFeedback.text}
                    </p>
                  )}
                </div>

                <div className="space-y-2 rounded-xl bg-white/5 p-3">
                  <div className="flex justify-between text-sm text-white/55">
                    <span>عدد الأصناف</span><span>{count}</span>
                  </div>
                  <div className="flex justify-between text-sm text-white/55">
                    <span>قيمة الأصناف</span><span>{total} ج.م</span>
                  </div>
                  {appliedCoupon && couponDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-400">
                      <span>خصم {appliedCoupon.code}</span><span>−{couponDiscount} ج.م</span>
                    </div>
                  )}
                  {deliveryFee > 0 && (
                    <div className="flex justify-between text-sm text-white/55">
                      <span>مصاريف التوصيل</span><span>+{deliveryFee} ج.م</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-white/10 pt-2">
                    <span className="font-semibold text-white/75">الإجمالي</span>
                    <span className="text-xl font-extrabold text-yellow-400">{amountDue} ج.م</span>
                  </div>
                </div>

                </>
              )}
            </div>
            )}

            {/* بيانات الاستلام وإرسال الطلب */}
            {items.length > 0 && checkoutStep === "details" && (
              <div className="min-h-full space-y-3 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:p-4 sm:pb-4">
                <div className="space-y-2.5 rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div>
                    <label htmlFor="customer-name" className="mb-1.5 block text-sm font-semibold text-white/80">
                      اسم العميل
                    </label>
                    <input
                      id="customer-name"
                      type="text"
                      autoComplete="name"
                      value={customerName}
                      onChange={(event) => { setCustomerName(event.target.value); setCheckoutError(""); setCheckoutErrorField(null); }}
                      placeholder="اكتب اسمك"
                      maxLength={80}
                      aria-invalid={checkoutErrorField === "name"}
                      aria-describedby={checkoutErrorField === "name" ? "customer-name-error" : undefined}
                      className="min-h-11 w-full rounded-xl border border-white/10 bg-[#120a07] px-3 py-2.5 text-base text-white placeholder:text-white/30 focus:border-yellow-400/60 focus:outline-none sm:text-sm"
                    />
                    {checkoutErrorField === "name" && (
                      <p id="customer-name-error" role="alert" className="mt-1 text-xs font-semibold text-red-300">{checkoutError}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="customer-phone" className="mb-1.5 block text-sm font-semibold text-white/80">
                      رقم للتواصل
                    </label>
                    <input
                      id="customer-phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={customerPhone}
                      onChange={(event) => { setCustomerPhone(event.target.value); setCheckoutError(""); setCheckoutErrorField(null); }}
                      placeholder="مثال: 01012345678"
                      dir="ltr"
                      aria-invalid={checkoutErrorField === "phone"}
                      aria-describedby={checkoutErrorField === "phone" ? "customer-phone-error" : undefined}
                      className="min-h-11 w-full rounded-xl border border-white/10 bg-[#120a07] px-3 py-2.5 text-left text-base text-white placeholder:text-white/30 focus:border-yellow-400/60 focus:outline-none sm:text-sm"
                    />
                    {checkoutErrorField === "phone" && (
                      <p id="customer-phone-error" role="alert" className="mt-1 text-xs font-semibold text-red-300">{checkoutError}</p>
                    )}
                  </div>

                  <div>
                    <p className="mb-1.5 text-sm font-semibold text-white/80">طريقة استلام الطلب</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        aria-pressed={fulfillmentMethod === "delivery"}
                        onClick={() => { setFulfillmentMethod("delivery"); setCheckoutError(""); setCheckoutErrorField(null); }}
                        className={`min-h-11 rounded-xl border px-2 py-2.5 text-sm font-semibold transition ${fulfillmentMethod === "delivery" ? "border-yellow-400 bg-yellow-400/15 text-yellow-300" : "border-white/10 text-white/60 hover:bg-white/5"}`}
                      >
                        🚚 توصيل للمنزل
                      </button>
                      <button
                        type="button"
                        aria-pressed={fulfillmentMethod === "pickup"}
                        onClick={() => { setFulfillmentMethod("pickup"); setCheckoutError(""); setCheckoutErrorField(null); }}
                        className={`min-h-11 rounded-xl border px-2 py-2.5 text-sm font-semibold transition ${fulfillmentMethod === "pickup" ? "border-yellow-400 bg-yellow-400/15 text-yellow-300" : "border-white/10 text-white/60 hover:bg-white/5"}`}
                      >
                        🏠 استلام من المطعم
                      </button>
                    </div>
                  </div>

                  {fulfillmentMethod === "delivery" && (
                    <div className="space-y-2">
                      <div>
                        <label htmlFor="delivery-address" className="mb-1.5 block text-sm font-semibold text-white/80">
                          عنوان التوصيل بالتفصيل
                        </label>
                        <textarea
                          id="delivery-address"
                          value={deliveryAddress}
                          onChange={(event) => { setDeliveryAddress(event.target.value); setCheckoutError(""); setCheckoutErrorField(null); }}
                          placeholder="المحافظة، المنطقة، الشارع، رقم العقار، الدور والشقة، وأقرب علامة مميزة"
                          rows={3}
                          maxLength={300}
                          aria-invalid={checkoutErrorField === "address"}
                          aria-describedby={checkoutErrorField === "address" ? "delivery-address-error" : undefined}
                          className="min-h-28 w-full resize-y rounded-xl border border-white/10 bg-[#120a07] px-3 py-2.5 text-base text-white placeholder:text-white/30 focus:border-yellow-400/60 focus:outline-none sm:text-sm"
                        />
                        {checkoutErrorField === "address" && (
                          <p id="delivery-address-error" role="alert" className="mt-1 text-xs font-semibold text-red-300">{checkoutError}</p>
                        )}
                      </div>
                      <div className="rounded-xl border border-white/10 bg-[#120a07] p-3">
                        <p className="mb-2 text-xs leading-relaxed text-white/55">
                          اكتب العنوان بالتفصيل، وحدد موقعك لإرسال دبوس مباشر للمندوب.
                        </p>
                        <button
                          type="button"
                          onClick={locateCustomer}
                          disabled={locationStatus?.type === "loading"}
                          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-yellow-400/40 px-3 py-2 text-sm font-semibold text-yellow-300 transition hover:bg-yellow-400/10 disabled:cursor-wait disabled:opacity-60"
                        >
                          <span aria-hidden="true">📍</span>
                          {locationStatus?.type === "loading"
                            ? "جارٍ تحديد الموقع…"
                            : locationPoint ? "تحديث موقعي الحالي" : "تحديد موقعي الحالي"}
                        </button>
                        {locationStatus && (
                          <p
                            role="status"
                            aria-live="polite"
                            className={`mt-2 text-xs leading-relaxed ${locationStatus.type === "error" ? "text-red-300" : locationStatus.type === "success" ? "text-green-300" : "text-white/60"}`}
                          >
                            {locationStatus.text}
                          </p>
                        )}
                        {locationPoint && (
                          <a
                            href={`https://www.google.com/maps?q=${locationPoint.latitude.toFixed(6)},${locationPoint.longitude.toFixed(6)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex min-h-9 items-center text-xs font-semibold text-yellow-200 underline underline-offset-4"
                          >
                            معاينة الموقع على Google Maps
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                  {settings.businessHours && (
                    <p className="text-xs text-white/45">🕒 {settings.businessHours}</p>
                  )}
                  {fulfillmentMethod === "delivery" && settings.deliveryAreas && (
                    <p className="text-xs leading-relaxed text-white/45">📍 التوصيل للمناطق: {settings.deliveryAreas}</p>
                  )}
                </div>

                <div className="space-y-2 rounded-xl bg-white/5 p-3">
                  <div className="flex justify-between text-sm text-white/55">
                    <span>الأصناف في الطلب</span><span>{count}</span>
                  </div>
                  <div className="flex justify-between text-sm text-white/55">
                    <span>قيمة الأصناف</span><span>{total} ج.م</span>
                  </div>
                  {appliedCoupon && couponDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-400">
                      <span>خصم {appliedCoupon.code}</span><span>−{couponDiscount} ج.م</span>
                    </div>
                  )}
                  {deliveryFee > 0 && (
                    <div className="flex justify-between text-sm text-white/55">
                      <span>مصاريف التوصيل</span><span>+{deliveryFee} ج.م</span>
                    </div>
                  )}
                  {settings.minimumOrderAmount > 0 && (
                    <p className="text-xs text-white/45">الحد الأدنى للطلب: {settings.minimumOrderAmount} ج.م</p>
                  )}
                  <div className="flex justify-between items-center border-t border-white/10 pt-2">
                    <span className="font-semibold text-white/75">الإجمالي</span>
                    <span className="text-xl font-extrabold text-yellow-400">{amountDue} ج.م</span>
                  </div>
                </div>


              </div>
            )}
            </div>
            {items.length > 0 && (
              <div className="shrink-0 border-t border-white/10 bg-[#1a0e0a] p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-12px_30px_rgba(0,0,0,0.2)] sm:p-4 sm:pb-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-white/60">الإجمالي</span>
                  <span className="font-extrabold text-yellow-400">{amountDue} ج.م</span>
                </div>
                {checkoutErrorField === "order" && (
                  <p role="alert" className="mb-2 text-center text-xs font-semibold text-red-300">{checkoutError}</p>
                )}
                {checkoutStep === "review" ? (
                  <button
                    type="button"
                    onClick={() => { setCheckoutStep("details"); setCheckoutError(""); setCheckoutErrorField(null); setOrderNotice(""); }}
                    className="flex min-h-12 w-full items-center justify-center rounded-xl bg-yellow-500 px-4 py-2.5 text-center text-sm font-bold leading-snug text-[#24150e] shadow-lg transition hover:bg-yellow-400"
                  >
                    تأكيد الأوردر
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleOrder}
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-center text-sm font-bold leading-snug text-white shadow-lg transition hover:bg-[#20bd5a]"
                  >
                    <span aria-hidden="true">💬</span>
                    إرسال الأوردر للتجهيز
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== زر السلة العائم ===== */}
      <AnimatePresence>
        {!isOpen && count > 0 && (
          <motion.button
            initial={{ scale: 0, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: 20 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-3 z-40 flex max-w-[calc(100vw-1.5rem)] items-center gap-2 rounded-full bg-[#25D366] px-3 py-3 text-sm font-bold text-white shadow-2xl shadow-green-500/40 sm:bottom-6 sm:right-6 sm:gap-3 sm:px-5 sm:py-3.5 sm:text-base"
          >
            <span className="text-lg sm:text-xl">🛒</span>
            <span>{count} صنف</span>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-extrabold text-green-600 sm:px-2.5 sm:text-sm">
              {total} ج.م
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
