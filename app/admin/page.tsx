"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import AdminAccessGate from "@/components/admin/AdminAccessGate";
import ProductOptionsEditor from "@/components/admin/ProductOptionsEditor";
import { hydrateMenuData, menuData as defaultMenuData } from "@/data/menuData";
import type { Category, Product } from "@/data/menuData";
import { MENU_STORAGE_KEY } from "@/hooks/useMenuData";
import { OFFERS_STORAGE_KEY } from "@/data/offersData";
import { defaultOffers } from "@/data/offersData";
import type { Offer } from "@/data/offersData";
import { useCoupons } from "@/hooks/useCoupons";
import { COUPONS_CHANGED_EVENT, COUPONS_STORAGE_KEY, type CouponDiscountType, type DiscountCoupon } from "@/data/coupons";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { defaultSettings, normalizeSiteSettings, SETTINGS_KEY, toWhatsAppNumber } from "@/data/settings";
import { loadSharedSiteData, saveSharedDataField } from "@/lib/siteDataClient";

// ضغط الصور
const MAX_SOURCE_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 24_000_000;
const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

const compressImage = (file: File, maxWidth = 800, quality = 0.75): Promise<string> =>
  new Promise((resolve, reject) => {
    if (!SUPPORTED_IMAGE_TYPES.has(file.type)) return reject(new Error("استخدم صورة JPG أو PNG أو WebP أو AVIF."));
    if (file.size > MAX_SOURCE_IMAGE_BYTES) return reject(new Error("حجم الصورة كبير. الحد الأقصى 12 ميجابايت."));
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new window.Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        if (img.width * img.height > MAX_IMAGE_PIXELS) return reject(new Error("أبعاد الصورة كبيرة جدًا. اختر صورة بأبعاد أقل."));
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, maxWidth / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas error"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });

function AdminDashboard() {
  // ===== بيانات المنيو =====
  const [menuData, setMenuData] = useState<Category[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState<"success" | "error" | "info">("success");

  // ===== بيانات العروض =====
  const [offers, setOffers] = useState<Offer[]>([]);
  const [showAddOffer, setShowAddOffer] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [newOffer, setNewOffer] = useState<Partial<Offer>>({
    name: "", description: "", price: 0, originalPrice: undefined,
    badge: "🔥 عرض اليوم", isAvailable: true, image: "",
  });
  const [deleteOfferConfirm, setDeleteOfferConfirm] = useState<string | null>(null);
  const { coupons, isLoaded: couponsLoaded, saveCoupons } = useCoupons();
  const [couponCode, setCouponCode] = useState("");
  const [couponType, setCouponType] = useState<CouponDiscountType>("percentage");
  const [couponValue, setCouponValue] = useState(0);
  const [deleteCouponConfirm, setDeleteCouponConfirm] = useState<DiscountCoupon | null>(null);

  // ===== بيانات إضافة منتج =====
  const [showAddProduct, setShowAddProduct] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: "", nameEn: "", price: 0, description: "", isAvailable: true,
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{
    categoryId: string; productId: string; productName: string;
  } | null>(null);
  const [expandedProductOptions, setExpandedProductOptions] = useState<Set<string>>(new Set());
  const [cloudStatus, setCloudStatus] = useState("جارٍ التحقق من إعداد الحفظ المشترك...");

  // ===== عرض/إخفاء الأقسام =====
  const [activeSection, setActiveSection] = useState<"offers" | "coupons" | "menu" | "settings">("offers");

  // ===== الإعدادات =====
  const { settings, setSettings, saveSettings } = useSiteSettings();

  // ========== تحميل البيانات ==========
  useEffect(() => {
    const loadInitialMenu = () => {
      try {
        const stored = localStorage.getItem(MENU_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMenuData(hydrateMenuData(parsed));
            setMenuLoading(false);
            return;
          }
        }
      } catch {}
      setMenuData(defaultMenuData as Category[]);
      setMenuLoading(false);
    };

    loadInitialMenu();

    const loadInitialOffers = () => {
      try {
        const storedOffers = localStorage.getItem(OFFERS_STORAGE_KEY);
        if (storedOffers) {
          const parsed = JSON.parse(storedOffers);
          if (Array.isArray(parsed)) setOffers(parsed);
        }
      } catch {}
    };
    loadInitialOffers();

    const readLocal = <T,>(key: string, fallback: T): T => {
      try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) as T : fallback;
      } catch {
        return fallback;
      }
    };

    void loadSharedSiteData()
      .then(async ({ data, configured, databaseReady }) => {
        if (data) {
          const sharedMenu = hydrateMenuData(Array.isArray(data.menuData) ? data.menuData as Category[] : defaultMenuData as Category[]);
          const sharedOffers = Array.isArray(data.offers) ? data.offers as Offer[] : defaultOffers;
          const sharedCoupons = Array.isArray(data.coupons) ? data.coupons as DiscountCoupon[] : [];
          const sharedSettings = normalizeSiteSettings(data.settings as Partial<typeof defaultSettings> | undefined);
          setMenuData(sharedMenu);
          setOffers(sharedOffers);
          setSettings(sharedSettings);
          setMenuLoading(false);
          localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(sharedMenu));
          localStorage.setItem(OFFERS_STORAGE_KEY, JSON.stringify(sharedOffers));
          localStorage.setItem(COUPONS_STORAGE_KEY, JSON.stringify(sharedCoupons));
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(sharedSettings));
          window.dispatchEvent(new CustomEvent(COUPONS_CHANGED_EVENT, { detail: sharedCoupons }));
          setCloudStatus("✅ التعديلات متاحة على الموقع كله.");
          return;
        }

        if (configured && databaseReady) {
          const firstSharedData = {
            menuData: hydrateMenuData(readLocal(MENU_STORAGE_KEY, defaultMenuData as Category[])),
            offers: readLocal(OFFERS_STORAGE_KEY, defaultOffers),
            coupons: readLocal(COUPONS_STORAGE_KEY, [] as DiscountCoupon[]),
            settings: normalizeSiteSettings(readLocal(SETTINGS_KEY, {})),
          };
          localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(firstSharedData.menuData));
          localStorage.setItem(OFFERS_STORAGE_KEY, JSON.stringify(firstSharedData.offers));
          localStorage.setItem(COUPONS_STORAGE_KEY, JSON.stringify(firstSharedData.coupons));
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(firstSharedData.settings));
          window.dispatchEvent(new CustomEvent(COUPONS_CHANGED_EVENT, { detail: firstSharedData.coupons }));
          await saveSharedDataField("all", firstSharedData);
          setCloudStatus("✅ تم نشر البيانات الحالية لتظهر للزوار من كل الأجهزة.");
          return;
        }

        setCloudStatus(configured
          ? "⚠️ قاعدة البيانات تحتاج تجهيز الجدول قبل المزامنة."
          : "");
      })
      .catch(() => setCloudStatus("⚠️ لم تكتمل مزامنة البيانات. راجع إعدادات قاعدة البيانات."));

  }, [setSettings]);

  const showMsg = (text: string, type: "success" | "error" | "info" = "success") => {
    setMessage(text);
    setMsgType(type);
    setTimeout(() => setMessage(""), 4000);
  };

  // ========== حفظ فوري للمنيو ==========
  const saveMenuImmediate = (updated: Category[]) => {
    try {
      localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(updated));
      setMenuData(updated);
      void saveSharedDataField("menuData", updated)
        .then(() => { setCloudStatus("✅ التعديلات متاحة على الموقع كله."); showMsg("✅ تم نشر المنيو على الموقع كله"); })
        .catch(() => { setCloudStatus("⚠️ تم الحفظ على هذا الجهاز فقط؛ قاعدة البيانات لم تُفعّل بعد."); showMsg("✅ تم الحفظ على هذا الجهاز. فعّل قاعدة البيانات لمشاركته مع العملاء.", "info"); });
    } catch {
      showMsg("❌ مساحة تخزين المتصفح ممتلئة. جرّب صورة أصغر.", "error");
    }
  };

  // ========== حفظ العروض ==========
  const saveOffersImmediate = async (updated: Offer[]) => {
    try {
      localStorage.setItem(OFFERS_STORAGE_KEY, JSON.stringify(updated));
      setOffers(updated);
      await saveSharedDataField("offers", updated);
      setCloudStatus("✅ التعديلات متاحة على الموقع كله.");
      return true;
    } catch {
      showMsg("تم حفظ العروض على هذا الجهاز فقط؛ قاعدة البيانات لم تُفعّل بعد.", "info");
      setCloudStatus("⚠️ العروض محفوظة محلياً فقط حتى تفعيل قاعدة البيانات.");
      return false;
    }
  };

  const addCoupon = async () => {
    if (!couponsLoaded) return;
    const code = couponCode.trim().replace(/\s+/g, "").toUpperCase();
    if (!code || !Number.isFinite(couponValue) || couponValue <= 0) {
      showMsg("⚠️ أدخل كود الخصم وقيمته أولاً", "info");
      return;
    }
    if (couponType === "percentage" && couponValue > 100) {
      showMsg("⚠️ نسبة الخصم لا يمكن أن تتجاوز 100٪", "info");
      return;
    }
    if (coupons.some((coupon) => coupon.code.toUpperCase() === code)) {
      showMsg("⚠️ هذا الكود موجود بالفعل", "info");
      return;
    }

    const coupon: DiscountCoupon = {
      id: `coupon-${Date.now()}`,
      code,
      discountType: couponType,
      discountValue: couponValue,
      isActive: true,
    };
    if (await saveCoupons([...coupons, coupon])) {
      setCouponCode("");
      setCouponValue(0);
      showMsg("✅ تم إضافة كود الخصم وتفعيله");
    } else {
      showMsg("تمت إضافة الكود على هذا الجهاز فقط؛ قاعدة البيانات لم تُفعّل بعد.", "info");
    }
  };

  const toggleCoupon = async (id: string) => {
    const updated = coupons.map((coupon) =>
      coupon.id === id ? { ...coupon, isActive: !coupon.isActive } : coupon
    );
    if (!await saveCoupons(updated)) showMsg("تم تعديل الكود محلياً فقط؛ قاعدة البيانات لم تُفعّل بعد.", "info");
  };

  const deleteCoupon = async (id: string) => {
    const updated = coupons.filter((coupon) => coupon.id !== id);
    if (await saveCoupons(updated)) {
      setDeleteCouponConfirm(null);
      showMsg("🗑️ تم حذف كود الخصم نهائياً");
    } else {
      showMsg("حُذف الكود من هذا الجهاز فقط؛ قاعدة البيانات لم تُفعّل بعد.", "info");
    }
  };

  // ========== إضافة / تعديل عرض ==========
  const handleSaveOffer = async () => {
    if (!newOffer.name || !newOffer.price) {
      showMsg("⚠️ أدخل اسم العرض والسعر", "info");
      return;
    }
    let updated: Offer[];
    if (editingOffer) {
      updated = offers.map(o =>
        o.id === editingOffer.id ? { ...editingOffer, ...newOffer, id: editingOffer.id } as Offer : o
      );
      showMsg("✅ تم تعديل العرض وحفظه!");
    } else {
      const offer: Offer = {
        id: `offer-${Date.now()}`,
        name: newOffer.name!,
        description: newOffer.description || "",
        price: newOffer.price!,
        originalPrice: newOffer.originalPrice,
        badge: newOffer.badge || "🔥 عرض اليوم",
        isAvailable: newOffer.isAvailable !== undefined ? newOffer.isAvailable : true,
        image: newOffer.image || "",
      };
      updated = [...offers, offer];
      showMsg("✅ تم إضافة العرض بنجاح!");
    }
    if (await saveOffersImmediate(updated)) {
      setShowAddOffer(false);
      setEditingOffer(null);
      setNewOffer({ name: "", description: "", price: 0, badge: "🔥 عرض اليوم", isAvailable: true, image: "" });
    }
  };

  const handleEditOffer = (offer: Offer) => {
    setEditingOffer(offer);
    setNewOffer({ ...offer });
    setShowAddOffer(true);
  };

  const handleDeleteOffer = async (id: string) => {
    const updated = offers.filter(o => o.id !== id);
    if (await saveOffersImmediate(updated)) {
      setDeleteOfferConfirm(null);
      showMsg("🗑️ تم حذف العرض");
    }
  };

  const handleToggleOfferAvailability = async (id: string) => {
    const updated = offers.map(o => o.id === id ? { ...o, isAvailable: !o.isAvailable } : o);
    await saveOffersImmediate(updated);
  };

  // ========== رفع صورة العرض ==========
  const handleOfferImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    showMsg("⏳ جاري رفع الصورة...", "info");
    compressImage(file)
      .then(base64 => {
        setNewOffer(prev => ({ ...prev, image: base64 }));
        showMsg("✅ تم رفع الصورة - اضغط حفظ العرض");
      })
      .catch((error: unknown) => showMsg(`❌ ${error instanceof Error ? error.message : "فشل رفع الصورة"}`, "error"));
  };

  // ========== رفع صورة القسم ==========
  const handleCategoryImageUpload = (categoryId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    showMsg("⏳ جاري رفع الصورة...", "info");
    compressImage(file)
      .then(base64 => {
        const updated = menuData.map(cat =>
          cat.id === categoryId ? { ...cat, image: base64 } : cat
        );
        saveMenuImmediate(updated);
      })
      .catch((error: unknown) => showMsg(`❌ ${error instanceof Error ? error.message : "فشل رفع الصورة"}`, "error"));
  };

  // ========== رفع صورة المنتج ==========
  const handleProductImageUpload = (categoryId: string, productId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    showMsg("⏳ جاري رفع الصورة...", "info");
    compressImage(file)
      .then(base64 => {
        const updated = menuData.map(cat => {
          if (cat.id !== categoryId) return cat;
          return { ...cat, products: cat.products.map(p => p.id === productId ? { ...p, image: base64 } : p) };
        });
        saveMenuImmediate(updated);
      })
      .catch((error: unknown) => showMsg(`❌ ${error instanceof Error ? error.message : "فشل رفع الصورة"}`, "error"));
  };

  // ========== تعديل المنيو ==========
  const updateProductPrice = (categoryId: string, productId: string, newPrice: number) => {
    if (newPrice < 0) return;
    setMenuData(prev => prev.map(cat => {
      if (cat.id !== categoryId) return cat;
      return { ...cat, products: cat.products.map(p => p.id === productId ? { ...p, price: newPrice } : p) };
    }));
  };

  const updateProductName = (categoryId: string, productId: string, name: string) => {
    setMenuData(prev => prev.map(cat => {
      if (cat.id !== categoryId) return cat;
      return { ...cat, products: cat.products.map(p => p.id === productId ? { ...p, name } : p) };
    }));
  };

  const toggleProductAvailability = (categoryId: string, productId: string) => {
    setMenuData(prev => prev.map(cat => {
      if (cat.id !== categoryId) return cat;
      return { ...cat, products: cat.products.map(p => p.id === productId ? { ...p, isAvailable: !p.isAvailable } : p) };
    }));
  };

  const togglePopular = (categoryId: string, productId: string) => {
    setMenuData(prev => prev.map(cat => {
      if (cat.id !== categoryId) return cat;
      return { ...cat, products: cat.products.map(p => p.id === productId ? { ...p, isPopular: !p.isPopular } : p) };
    }));
  };

  const updateProductOptions = (categoryId: string, productId: string, optionGroups: Product["optionGroups"]) => {
    setMenuData((previous) => previous.map((category) => category.id !== categoryId ? category : {
      ...category,
      products: category.products.map((product) => product.id === productId ? { ...product, optionGroups } : product),
    }));
  };

  const confirmDelete = (categoryId: string, productId: string, productName: string) => {
    setDeleteConfirm({ categoryId, productId, productName });
  };

  const executeDelete = () => {
    if (!deleteConfirm) return;
    setMenuData(prev => prev.map(cat => {
      if (cat.id !== deleteConfirm.categoryId) return cat;
      return { ...cat, products: cat.products.filter(p => p.id !== deleteConfirm.productId) };
    }));
    setDeleteConfirm(null);
    showMsg("🗑️ تم حذف المنتج - اضغط حفظ لتأكيد التغيير", "info");
  };

  // حذف قسم كامل
  const [deleteCategoryConfirm, setDeleteCategoryConfirm] = useState<{ id: string; name: string } | null>(null);

  const executeDeleteCategory = () => {
    if (!deleteCategoryConfirm) return;
    const updated = menuData.filter(cat => cat.id !== deleteCategoryConfirm.id);
    saveMenuImmediate(updated);
    setDeleteCategoryConfirm(null);
    showMsg(`🗑️ تم حذف قسم "${deleteCategoryConfirm.name}" بنجاح`, "info");
  };

  const addProduct = (categoryId: string) => {
    if (!newProduct.name || !newProduct.price) {
      showMsg("⚠️ أدخل اسم وسعر المنتج", "info");
      return;
    }
    const product: Product = {
      id: `p${Date.now()}`,
      name: newProduct.name!,
      nameEn: newProduct.nameEn || newProduct.name!,
      price: newProduct.price!,
      description: newProduct.description || "",
      isAvailable: true,
      image: "",
    };
    setMenuData(prev => prev.map(cat =>
      cat.id === categoryId ? { ...cat, products: [...cat.products, product] } : cat
    ));
    setNewProduct({ name: "", nameEn: "", price: 0, description: "", isAvailable: true });
    setShowAddProduct(null);
    showMsg("✅ تم إضافة المنتج - اضغط حفظ المنيو لتأكيد");
  };

  const saveMenu = () => {
    saveMenuImmediate(menuData);
  };

  const resetMenu = () => {
    if (confirm("⚠️ هل أنت متأكد من إعادة ضبط المنيو للقيم الافتراضية؟")) {
      saveMenuImmediate(defaultMenuData as Category[]);
      showMsg("🔄 تم إعادة الضبط");
    }
  };

  // الـ discount percentage
  const discountPct = (orig?: number, curr?: number) => {
    if (!orig || !curr || orig <= curr) return null;
    return Math.round(((orig - curr) / orig) * 100);
  };

  // ========== RENDER ==========
  if (menuLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-2xl text-gray-600">⏳ جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-yellow-50 pb-32">
      {/* ===== HEADER ===== */}
      <div className="bg-[#2E1A12] px-3 py-6 text-center text-white shadow-2xl sm:px-4 sm:py-8">
        <h1 className="text-2xl font-bold sm:text-3xl md:text-4xl">🛠️ لوحة تحكم كيان</h1>
        <p className="text-white/60 mt-1 text-sm">إدارة العروض والمنيو والصور والأسعار</p>
        <div className="mx-auto mt-4 flex max-w-3xl flex-wrap justify-center gap-2">
          <Link href="/admin/orders" className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20">📦 متابعة الطلبات</Link>
          <button
            type="button"
            onClick={async () => { await fetch("/api/admin/logout", { method: "POST" }); window.location.reload(); }}
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/75 transition hover:bg-white/10"
          >
            تسجيل الخروج
          </button>
        </div>
        <div className="mx-auto mt-5 grid max-w-3xl grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-center sm:gap-3">
          <button
            onClick={() => setActiveSection("offers")}
            className={`min-w-0 whitespace-nowrap rounded-full px-2 py-2.5 text-[11px] font-bold transition-all min-[360px]:text-xs sm:px-5 sm:text-sm ${
              activeSection === "offers"
                ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            🔥 إدارة العروض {offers.length > 0 && `(${offers.length})`}
          </button>
          <button
            onClick={() => setActiveSection("coupons")}
            className={`min-w-0 whitespace-nowrap rounded-full px-2 py-2.5 text-[11px] font-bold transition-all min-[360px]:text-xs sm:px-5 sm:text-sm ${
              activeSection === "coupons"
                ? "bg-green-500 text-white shadow-lg shadow-green-500/30"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            🎟️ أكواد الخصم {coupons.length > 0 && `(${coupons.length})`}
          </button>
          <button
            onClick={() => setActiveSection("menu")}
            className={`min-w-0 whitespace-nowrap rounded-full px-2 py-2.5 text-[11px] font-bold transition-all min-[360px]:text-xs sm:px-5 sm:text-sm ${
              activeSection === "menu"
                ? "bg-yellow-500 text-black shadow-lg shadow-yellow-500/30"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            🍽️ إدارة المنيو
          </button>
          <button
            onClick={() => setActiveSection("settings")}
            className={`min-w-0 whitespace-nowrap rounded-full px-2 py-2.5 text-[11px] font-bold transition-all min-[360px]:text-xs sm:px-5 sm:text-sm ${
              activeSection === "settings"
                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            ⚙️ الإعدادات
          </button>
        </div>
      </div>

      {cloudStatus && (
        <p className={`px-4 py-3 text-center text-sm ${cloudStatus.startsWith("✅") ? "bg-green-50 text-green-900" : "bg-yellow-50 text-yellow-900"}`}>
          {cloudStatus}
        </p>
      )}

      <div className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8">
        {/* رسالة التنبيه */}
        {message && (
          <div className={`p-4 rounded-xl mb-6 text-center font-semibold shadow-md border ${
            msgType === "success" ? "bg-green-50 text-green-700 border-green-200" :
            msgType === "error"   ? "bg-red-50 text-red-700 border-red-200" :
                                    "bg-yellow-50 text-yellow-700 border-yellow-200"
          }`}>
            {message}
          </div>
        )}

        {/* ===================================================== */}
        {/* قسم العروض */}
        {/* ===================================================== */}
        {activeSection === "offers" && (
          <div>
            {/* رأس القسم */}
            <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
              <div>
                <h2 className="text-2xl font-bold text-[#2E1A12] flex items-center gap-2">
                  🔥 العروض الخاصة
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  تظهر هذه العروض في قسم &quot;عروض اليوم&quot; في الصفحة الرئيسية
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingOffer(null);
                  setNewOffer({ name: "", description: "", price: 0, badge: "🔥 عرض اليوم", isAvailable: true, image: "" });
                  setShowAddOffer(true);
                }}
                className="bg-red-500 text-white px-5 py-2.5 rounded-full font-bold hover:bg-red-600 transition shadow-lg flex items-center gap-2"
              >
                ➕ إضافة عرض جديد
              </button>
            </div>

            {/* نموذج إضافة / تعديل عرض */}
            {showAddOffer && (
              <div className="mb-8 rounded-2xl border-2 border-red-100 bg-white p-4 shadow-xl sm:p-6">
                <h3 className="text-xl font-bold text-[#2E1A12] mb-5">
                  {editingOffer ? "✏️ تعديل العرض" : "➕ إضافة عرض جديد"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* اسم العرض */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">اسم العرض *</label>
                    <input
                      type="text"
                      placeholder="مثال: وجبة كاملة مشاوي"
                      value={newOffer.name || ""}
                      onChange={e => setNewOffer(p => ({ ...p, name: e.target.value }))}
                      className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-red-400 focus:outline-none"
                    />
                  </div>
                  {/* نص الشارة */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">نص الشارة</label>
                    <select
                      value={newOffer.badge || "🔥 عرض اليوم"}
                      onChange={e => setNewOffer(p => ({ ...p, badge: e.target.value }))}
                      className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-gray-900 focus:border-red-400 focus:outline-none"
                    >
                      <option>🔥 عرض اليوم</option>
                      <option>⚡ عرض محدود</option>
                      <option>🎉 عرض خاص</option>
                      <option>💥 أقل سعر</option>
                      <option>🌟 الأكثر طلباً</option>
                      <option>🆕 جديد</option>
                    </select>
                  </div>
                  {/* السعر */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">السعر بعد الخصم (ج.م) *</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={newOffer.price || ""}
                      onChange={e => setNewOffer(p => ({ ...p, price: Number(e.target.value) }))}
                      className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-red-400 focus:outline-none"
                      min="0"
                    />
                  </div>
                  {/* السعر الأصلي */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">السعر الأصلي (اختياري - للخط المشطوب)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={newOffer.originalPrice || ""}
                      onChange={e => setNewOffer(p => ({ ...p, originalPrice: e.target.value ? Number(e.target.value) : undefined }))}
                      className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-red-400 focus:outline-none"
                      min="0"
                    />
                    {discountPct(newOffer.originalPrice, newOffer.price) && (
                      <p className="text-green-600 text-xs mt-1 font-semibold">
                        🎯 خصم {discountPct(newOffer.originalPrice, newOffer.price)}%
                      </p>
                    )}
                  </div>
                  {/* الوصف */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-600 mb-1">الوصف (اختياري)</label>
                    <textarea
                      rows={3}
                      placeholder="وصف مختصر للعرض..."
                      value={newOffer.description || ""}
                      onChange={e => setNewOffer(p => ({ ...p, description: e.target.value }))}
                      className="w-full resize-y rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-red-400 focus:outline-none"
                    />
                  </div>
                  {/* رفع الصورة */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-600 mb-2">صورة العرض</label>
                    <div className="flex items-center gap-4">
                      <label className="cursor-pointer bg-blue-50 border-2 border-blue-200 border-dashed rounded-xl px-6 py-3 hover:bg-blue-100 transition text-blue-600 font-semibold text-sm flex items-center gap-2">
                        📸 اختر صورة
                        <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={handleOfferImageUpload} />
                      </label>
                      {newOffer.image && (
                        <div className="relative h-28 w-28 overflow-hidden rounded-xl border-2 border-gray-200 bg-gray-50">
                          <Image src={newOffer.image} alt="معاينة صورة العرض" fill className="object-cover" unoptimized />
                          <button
                            onClick={() => setNewOffer(p => ({ ...p, image: "" }))}
                            className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center"
                          >✕</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* أزرار الحفظ */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleSaveOffer}
                    className="bg-red-500 text-white px-8 py-3 rounded-full font-bold hover:bg-red-600 transition shadow-lg"
                  >
                    {editingOffer ? "💾 حفظ التعديل" : "✅ إضافة العرض"}
                  </button>
                  <button
                    onClick={() => { setShowAddOffer(false); setEditingOffer(null); }}
                    className="bg-gray-200 text-gray-700 px-6 py-3 rounded-full font-semibold hover:bg-gray-300 transition"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}

            {/* قائمة العروض */}
            {offers.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <div className="text-6xl mb-4">🏷️</div>
                <p className="text-xl font-semibold">لا توجد عروض بعد</p>
                <p className="text-sm mt-2">اضغط &quot;إضافة عرض جديد&quot; لإضافة أول عرض</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {offers.map((offer) => (
                  <div
                    key={offer.id}
                    className={`bg-white rounded-2xl shadow-lg border-2 overflow-hidden transition-all ${
                      offer.isAvailable ? "border-gray-100" : "border-gray-200 opacity-60"
                    }`}
                  >
                    {/* صورة العرض */}
                    <div className="relative h-44 w-full bg-gray-50">
                      {offer.image ? (
                        <Image
                          src={offer.image}
                          alt={offer.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center text-6xl">🍽️</div>
                      )}
                      {/* الشارة */}
                      <div className="absolute top-2 right-2">
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                          {offer.badge || "🔥 عرض اليوم"}
                        </span>
                      </div>
                      {/* نسبة الخصم */}
                      {discountPct(offer.originalPrice, offer.price) && (
                        <div className="absolute top-2 left-2">
                          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                            -{discountPct(offer.originalPrice, offer.price)}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* تفاصيل العرض */}
                    <div className="p-4">
                      <h3 className="font-bold text-lg text-[#2E1A12] line-clamp-1">{offer.name}</h3>
                      {offer.description && (
                        <p className="text-gray-500 text-sm mt-1 line-clamp-2">{offer.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-2xl font-extrabold text-red-500">{offer.price} ج.م</span>
                        {offer.originalPrice && (
                          <span className="text-gray-400 line-through text-sm">{offer.originalPrice} ج.م</span>
                        )}
                      </div>

                      {/* الأزرار */}
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleToggleOfferAvailability(offer.id)}
                          className={`flex-1 text-xs px-3 py-2 rounded-full font-semibold transition ${
                            offer.isAvailable
                              ? "bg-green-100 text-green-700 border border-green-200"
                              : "bg-red-100 text-red-700 border border-red-200"
                          }`}
                        >
                          {offer.isAvailable ? "✅ ظاهر" : "❌ مخفي"}
                        </button>
                        <button
                          onClick={() => handleEditOffer(offer)}
                          className="flex-1 text-xs px-3 py-2 rounded-full font-semibold bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200 transition"
                        >
                          ✏️ تعديل
                        </button>
                        <button
                          onClick={() => setDeleteOfferConfirm(offer.id)}
                          className="text-xs px-3 py-2 rounded-full font-semibold bg-red-100 text-red-700 border border-red-200 hover:bg-red-200 transition"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================================================== */}
        {/* أكواد الخصم */}
        {/* ===================================================== */}
        {activeSection === "coupons" && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#2E1A12]">🎟️ أكواد الخصم</h2>
              <p className="mt-1 text-sm text-gray-500">أنشئ الأكواد وأوقفها أو احذفها نهائياً من هنا.</p>
            </div>

            <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl sm:p-6">
              <h3 className="mb-4 text-lg font-bold text-[#2E1A12]">إضافة كود جديد</h3>
              <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-4">
                <div className="md:col-span-2">
                  <label htmlFor="coupon-code" className="mb-1 block text-sm font-semibold text-gray-600">الكود</label>
                  <input
                    id="coupon-code"
                    value={couponCode}
                    onChange={(event) => setCouponCode(event.target.value)}
                    placeholder="مثال: WELCOME10"
                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 font-mono text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none"
                    dir="ltr"
                    maxLength={24}
                  />
                </div>
                <div>
                  <label htmlFor="coupon-type" className="mb-1 block text-sm font-semibold text-gray-600">نوع الخصم</label>
                  <select
                    id="coupon-type"
                    value={couponType}
                    onChange={(event) => setCouponType(event.target.value as CouponDiscountType)}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-3 py-3 text-gray-900 focus:border-green-500 focus:outline-none"
                  >
                    <option value="percentage">نسبة مئوية</option>
                    <option value="fixed">قيمة ثابتة</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="coupon-value" className="mb-1 block text-sm font-semibold text-gray-600">
                    {couponType === "percentage" ? "نسبة الخصم ٪" : "قيمة الخصم ج.م"}
                  </label>
                  <input
                    id="coupon-value"
                    type="number"
                    min="1"
                    max={couponType === "percentage" ? 100 : undefined}
                    value={couponValue || ""}
                    onChange={(event) => setCouponValue(Number(event.target.value))}
                    placeholder="0"
                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={addCoupon}
                disabled={!couponsLoaded}
                className="mt-4 rounded-full bg-green-600 px-7 py-3 font-bold text-white transition hover:bg-green-700 disabled:cursor-wait disabled:opacity-60"
              >
                {couponsLoaded ? "➕ إضافة وتفعيل الكود" : "جارٍ تحميل الأكواد..."}
              </button>
            </div>

            {!couponsLoaded ? (
              <div className="rounded-2xl border border-dashed border-gray-300 py-14 text-center text-gray-400">جارٍ تحميل الأكواد...</div>
            ) : coupons.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 py-14 text-center text-gray-400">
                <div className="mb-3 text-5xl">🏷️</div>
                <p className="font-semibold">لا توجد أكواد خصم حالياً</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {coupons.map((coupon) => (
                  <div key={coupon.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-xl font-extrabold tracking-wider text-[#2E1A12]" dir="ltr">{coupon.code}</p>
                        <p className="mt-2 text-sm font-bold text-green-700">
                          خصم {coupon.discountType === "percentage" ? `${coupon.discountValue}٪` : `${coupon.discountValue} ج.م`}
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${coupon.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {coupon.isActive ? "مفعّل" : "متوقف"}
                      </span>
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => toggleCoupon(coupon.id)}
                        disabled={!couponsLoaded}
                        className={`rounded-full border px-3 py-2 text-sm font-semibold transition disabled:opacity-60 ${coupon.isActive ? "border-yellow-200 bg-yellow-50 text-yellow-800 hover:bg-yellow-100" : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"}`}
                      >
                        {coupon.isActive ? "إيقاف" : "تفعيل"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteCouponConfirm(coupon)}
                        className="rounded-full border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                      >
                        حذف نهائي
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================================================== */}
        {/* قسم المنيو */}
        {/* ===================================================== */}
        {activeSection === "menu" && (
          <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
              <div>
                <h2 className="text-2xl font-bold text-[#2E1A12]">🍽️ أقسام المنيو</h2>
                <p className="text-gray-500 text-sm mt-1">
                  💡 الصور تُحفظ تلقائياً — الأسعار والأسماء تحتاج ضغط &quot;حفظ المنيو&quot;
                </p>
              </div>
              <button
                onClick={saveMenu}
                className="bg-yellow-500 text-black px-6 py-2.5 rounded-full font-bold hover:bg-yellow-400 transition shadow-lg flex items-center gap-2"
              >
                💾 حفظ المنيو
              </button>
            </div>

            {menuData.map((category) => (
              <div key={category.id} className="mb-8 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl sm:p-6">
                {/* رأس القسم */}
                <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-200 flex items-center justify-center flex-shrink-0">
                      {category.image ? (
                        <Image
                          src={category.image}
                          alt={category.name}
                          fill
                          className="object-cover"
                          unoptimized={category.image.startsWith("data:")}
                        />
                      ) : (
                        <span className="text-3xl">{category.icon}</span>
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[#2E1A12]">
                        {category.name}
                        <span className="text-sm font-normal text-gray-400 mr-2">
                          ({category.products.length} منتج)
                        </span>
                      </h2>
                      <p className="text-sm text-gray-400">{category.nameEn}</p>
                    </div>
                    <label className="cursor-pointer bg-blue-500 text-white px-3 py-1.5 rounded-full text-sm hover:bg-blue-600 transition font-semibold flex items-center gap-1">
                      📸 تغيير صورة القسم
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        className="hidden"
                        onChange={(e) => handleCategoryImageUpload(category.id, e)}
                      />
                    </label>
                  </div>
                  <button
                    onClick={() => setShowAddProduct(category.id)}
                    className="bg-green-600 text-white px-4 py-2 rounded-full text-sm hover:bg-green-700 transition font-semibold"
                  >
                    ➕ إضافة منتج
                  </button>
                  <button
                    onClick={() => setDeleteCategoryConfirm({ id: category.id, name: category.name })}
                    className="bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-full text-sm hover:bg-red-200 transition font-semibold"
                  >
                    🗑️ حذف القسم
                  </button>
                </div>

                {/* المنتجات */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.products.map((product) => (
                    <div
                      key={product.id}
                      className={`border-2 rounded-xl p-4 transition ${
                        !product.isAvailable ? "bg-gray-50 border-gray-200 opacity-60" : "bg-white border-gray-100"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <input
                          type="text"
                          value={product.name}
                          onChange={e => updateProductName(category.id, product.id, e.target.value)}
                          className={`min-w-0 flex-1 border-b border-transparent bg-transparent px-1 text-sm font-bold hover:border-gray-300 focus:border-yellow-500 focus:outline-none ${
                            !product.isAvailable ? "line-through text-gray-500" : "text-[#2E1A12]"
                          }`}
                        />
                        <div className="flex gap-1 mr-1">
                    <label className="flex min-h-9 min-w-9 cursor-pointer items-center justify-center rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-200" title="تغيير الصورة">
                            📸
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/avif"
                              className="hidden"
                              onChange={e => handleProductImageUpload(category.id, product.id, e)}
                            />
                          </label>
                          <button
                            onClick={() => confirmDelete(category.id, product.id, product.name)}
                            aria-label={`حذف ${product.name}`}
                            className="flex min-h-9 min-w-9 items-center justify-center rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-200"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      {product.image && (
                        <div className="relative w-full h-24 mb-2 rounded-lg overflow-hidden border border-gray-100">
                          <Image src={product.image} alt={product.name} fill className="object-cover" unoptimized={product.image.startsWith("data:")} />
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <input
                          type="number"
                          value={product.price}
                          onChange={e => updateProductPrice(category.id, product.id, Number(e.target.value))}
                          className="w-20 rounded-lg border-2 border-gray-200 bg-white px-2 py-1 text-sm font-semibold text-gray-900 focus:border-yellow-500 focus:outline-none"
                          min="0"
                        />
                        <span className="text-xs font-bold text-gray-500">ج.م</span>
                        <button
                          onClick={() => toggleProductAvailability(category.id, product.id)}
                          className={`min-h-9 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                            product.isAvailable
                              ? "bg-green-100 text-green-700 border border-green-200"
                              : "bg-red-100 text-red-700 border border-red-200"
                          }`}
                        >
                          {product.isAvailable ? "✅" : "❌"}
                        </button>
                        <button
                          onClick={() => togglePopular(category.id, product.id)}
                          className={`min-h-9 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                            product.isPopular
                              ? "bg-orange-100 text-orange-700 border border-orange-200"
                              : "bg-gray-100 text-gray-400 border border-gray-200"
                          }`}
                          title="يظهر في قسم الأكثر طلباً"
                        >
                          {product.isPopular ? "🔥" : "☆"}
                        </button>
                      </div>
                      {product.description && (
                        <p className="text-xs text-gray-400 mt-1.5 line-clamp-1">{product.description}</p>
                      )}
                      <button
                        type="button"
                        onClick={() => setExpandedProductOptions((previous) => {
                          const next = new Set(previous);
                          if (next.has(product.id)) next.delete(product.id);
                          else next.add(product.id);
                          return next;
                        })}
                        className="mt-3 text-xs font-bold text-blue-700 hover:text-blue-900"
                      >
                        {expandedProductOptions.has(product.id) ? "إخفاء الاختيارات" : `⚙️ اختيارات المنتج${product.optionGroups?.length ? ` (${product.optionGroups.length})` : ""}`}
                      </button>
                      {expandedProductOptions.has(product.id) && (
                        <ProductOptionsEditor
                          groups={product.optionGroups ?? []}
                          onChange={(groups) => updateProductOptions(category.id, product.id, groups)}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* نموذج إضافة منتج */}
                {showAddProduct === category.id && (
                  <div className="mt-5 border-t-2 border-dashed border-green-200 pt-5 bg-green-50 rounded-xl p-4">
                    <h4 className="font-bold mb-3 text-green-800">➕ إضافة منتج لـ {category.name}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      <input
                        type="text"
                        placeholder="الاسم بالعربي *"
                        value={newProduct.name}
                        onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))}
                        className="rounded-xl border-2 border-gray-200 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="الاسم بالإنجليزي"
                        value={newProduct.nameEn}
                        onChange={e => setNewProduct(p => ({ ...p, nameEn: e.target.value }))}
                        className="rounded-xl border-2 border-gray-200 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none"
                      />
                      <input
                        type="number"
                        placeholder="السعر *"
                        value={newProduct.price || ""}
                        onChange={e => setNewProduct(p => ({ ...p, price: Number(e.target.value) }))}
                        className="rounded-xl border-2 border-gray-200 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none"
                        min="0"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="الوصف (اختياري)"
                      value={newProduct.description || ""}
                      onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))}
                      className="mb-3 w-full rounded-xl border-2 border-gray-200 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none"
                    />
                    <div className="flex gap-3">
                      <button onClick={() => addProduct(category.id)} className="bg-green-600 text-white px-6 py-2 rounded-full font-bold hover:bg-green-700 transition">
                        ✅ إضافة
                      </button>
                      <button onClick={() => setShowAddProduct(null)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-full font-semibold hover:bg-gray-300 transition">
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div className="flex gap-4 justify-center mt-4 flex-wrap">
              <button onClick={saveMenu} className="bg-yellow-500 text-black px-10 py-4 rounded-full font-bold text-lg hover:bg-yellow-400 transition shadow-xl">
                💾 حفظ المنيو
              </button>
              <button onClick={resetMenu} className="bg-red-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-red-400 transition shadow-lg">
                🔄 إعادة ضبط
              </button>
            </div>
          </div>
        )}
      </div>


      {/* ===================================================== */}
      {/* قسم الإعدادات */}
      {/* ===================================================== */}
      {activeSection === "settings" && (
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#2E1A12]">⚙️ إعدادات الموقع</h2>
            <p className="text-gray-500 text-sm mt-1">تغيير بيانات التواصل والمطعم وروابط التواصل الاجتماعي</p>
          </div>

          <div className="space-y-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl sm:p-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                ☎️ رقم المطعم للمكالمات
              </label>
              <p className="text-xs text-gray-400 mb-2">
                يظهر في أزرار الاتصال أعلى الموقع وأسفله
              </p>
              <input
                type="tel"
                value={settings.phoneNumber}
                onChange={e => setSettings({ ...settings, phoneNumber: e.target.value })}
                placeholder="01099176750 أو 201099176750"
                className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 font-mono text-lg tracking-wider text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                💬 رقم واتساب لاستقبال الطلبات
              </label>
              <p className="text-xs text-gray-400 mb-2">
                مستقل عن رقم المطعم. اكتب الرقم المحلي مثل <span className="font-mono bg-gray-100 px-1 rounded">01099176750</span> أو الدولي مثل <span className="font-mono bg-gray-100 px-1 rounded">201099176750</span>
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                <input
                  type="tel"
                  value={settings.whatsappNumber}
                  onChange={e => setSettings({ ...settings, whatsappNumber: e.target.value })}
                  placeholder="01099176750 أو 201099176750"
                  className="min-w-0 flex-1 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 font-mono text-base tracking-wider text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none sm:text-lg"
                  dir="ltr"
                />
                <a
                  href={`https://wa.me/${toWhatsAppNumber(settings.whatsappNumber)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-[#25D366] px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-[#20b858] sm:text-nowrap"
                >
                  ✅ تحقق
                </a>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                🏪 اسم المطعم (يظهر في رسائل الواتساب)
              </label>
              <input
                type="text"
                value={settings.restaurantName}
                onChange={e => setSettings({ ...settings, restaurantName: e.target.value })}
                placeholder="كيان"
                className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="facebook-url" className="mb-1 block text-sm font-bold text-gray-700">
                📘 رابط صفحة المطعم على فيسبوك
              </label>
              <input
                id="facebook-url"
                type="url"
                value={settings.facebookUrl}
                onChange={(event) => setSettings({ ...settings, facebookUrl: event.target.value })}
                placeholder="https://www.facebook.com/profile.php?id=61586004040638"
                dir="ltr"
                className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-left text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="delivery-fee" className="mb-1 block text-sm font-bold text-gray-700">🚚 مصاريف التوصيل (ج.م)</label>
                <input id="delivery-fee" type="number" min="0" value={settings.deliveryFee} onChange={(event) => setSettings({ ...settings, deliveryFee: Math.max(0, Number(event.target.value)) })} className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-green-500 focus:outline-none" />
              </div>
              <div>
                <label htmlFor="minimum-order" className="mb-1 block text-sm font-bold text-gray-700">🧾 الحد الأدنى للطلب (ج.م)</label>
                <input id="minimum-order" type="number" min="0" value={settings.minimumOrderAmount} onChange={(event) => setSettings({ ...settings, minimumOrderAmount: Math.max(0, Number(event.target.value)) })} className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-green-500 focus:outline-none" />
              </div>
            </div>

            <div>
              <label htmlFor="delivery-areas" className="mb-1 block text-sm font-bold text-gray-700">📍 مناطق التوصيل</label>
              <textarea id="delivery-areas" value={settings.deliveryAreas} onChange={(event) => setSettings({ ...settings, deliveryAreas: event.target.value })} placeholder="اكتب المناطق المتاح التوصيل إليها" rows={2} className="w-full resize-y rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none" />
            </div>

            <div>
              <label htmlFor="business-hours" className="mb-1 block text-sm font-bold text-gray-700">🕒 مواعيد العمل</label>
              <input id="business-hours" type="text" value={settings.businessHours} onChange={(event) => setSettings({ ...settings, businessHours: event.target.value })} placeholder="مثال: يومياً من 12 ظهراً حتى 2 صباحاً" className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none" />
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 p-4 text-sm font-bold text-gray-700">
              <input type="checkbox" checked={settings.acceptingOrders} onChange={(event) => setSettings({ ...settings, acceptingOrders: event.target.checked })} className="h-5 w-5 accent-green-600" />
              استقبال الطلبات متاح الآن
            </label>

            <div className="bg-[#ECE5DD] rounded-2xl p-4 text-sm text-gray-800 leading-relaxed" dir="rtl">
              <p className="text-xs text-gray-500 mb-2">📋 معاينة رسالة الطلب:</p>
              <p>🍽️ <strong>طلب جديد من {settings.restaurantName}</strong></p>
              <p className="mt-1">المنتجات:</p>
              <p>• شاورما كيان × 2 = 200 ج.م</p>
              <p>• كباب × 1 = 350 ج.م</p>
              <p className="mt-1">💰 <strong>الإجمالي: 470 ج.م</strong></p>
              <p className="mt-1">شكراً لطلبكم! 🙏</p>
            </div>

            <button
              onClick={async () => {
                try {
                  if (await saveSettings()) {
                    showMsg("✅ تم حفظ الإعدادات.");
                  } else {
                    showMsg("حُفظت الإعدادات على هذا الجهاز فقط؛ قاعدة البيانات لم تُفعّل بعد.", "info");
                  }
                } catch {
                  showMsg("❌ حدث خطأ في الحفظ", "error");
                }
              }}
              className="w-full bg-blue-500 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-600 transition shadow-lg"
            >
              💾 حفظ الإعدادات
            </button>
          </div>
        </div>
      )}
      {deleteCouponConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-2xl border-2 border-red-200 bg-white p-4 text-center shadow-2xl sm:p-6">
            <div className="mb-3 text-5xl">🗑️</div>
            <h3 className="mb-2 text-xl font-bold text-red-600">حذف كود الخصم نهائياً؟</h3>
            <p className="mb-5 text-sm text-gray-600">
              سيتم حذف الكود <strong className="font-mono text-[#2E1A12]">{deleteCouponConfirm.code}</strong> ولن يُقبل بعد الآن.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => deleteCoupon(deleteCouponConfirm.id)}
                className="flex-1 rounded-full bg-red-600 py-3 font-bold text-white transition hover:bg-red-700"
              >
                نعم، احذف
              </button>
              <button
                type="button"
                onClick={() => setDeleteCouponConfirm(null)}
                className="flex-1 rounded-full bg-gray-200 py-3 font-bold text-gray-700 transition hover:bg-gray-300"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ===== تأكيد حذف العرض ===== */}
      {deleteOfferConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-4 text-center shadow-2xl sm:p-6">
            <div className="text-5xl mb-3">⚠️</div>
            <h3 className="text-xl font-bold text-red-600 mb-2">حذف العرض؟</h3>
            <p className="text-gray-500 mb-5 text-sm">هذا الإجراء لا يمكن التراجع عنه</p>
            <div className="flex gap-3">
              <button onClick={() => handleDeleteOffer(deleteOfferConfirm)} className="flex-1 bg-red-600 text-white py-3 rounded-full font-bold hover:bg-red-700 transition">نعم، احذف</button>
              <button onClick={() => setDeleteOfferConfirm(null)} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-full font-bold hover:bg-gray-300 transition">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== تأكيد حذف القسم ===== */}
      {deleteCategoryConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-2xl border-2 border-red-200 bg-white p-4 text-center shadow-2xl sm:p-6">
            <div className="text-6xl mb-4">🗑️</div>
            <h3 className="text-2xl font-bold text-red-600 mb-2">حذف القسم كاملاً؟</h3>
            <p className="text-gray-600 mb-1">سيتم حذف قسم</p>
            <p className="text-2xl font-extrabold text-[#2E1A12] mb-2">
              &quot;{deleteCategoryConfirm.name}&quot;
            </p>
            <p className="text-red-500 text-sm font-semibold mb-6">
              ⚠️ سيُحذف القسم وجميع منتجاته ({menuData.find(c => c.id === deleteCategoryConfirm.id)?.products.length || 0} منتج) ولا يمكن التراجع!
            </p>
            <div className="flex gap-3">
              <button
                onClick={executeDeleteCategory}
                className="flex-1 bg-red-600 text-white py-3 rounded-full font-bold hover:bg-red-700 transition text-lg"
              >
                نعم، احذف القسم
              </button>
              <button
                onClick={() => setDeleteCategoryConfirm(null)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-full font-bold hover:bg-gray-300 transition text-lg"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== تأكيد حذف المنتج ===== */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-4 text-center shadow-2xl sm:p-6">
            <div className="text-5xl mb-3">⚠️</div>
            <h3 className="text-xl font-bold text-red-600 mb-2">حذف المنتج؟</h3>
            <p className="text-[#2E1A12] font-bold mb-1">&quot;{deleteConfirm.productName}&quot;</p>
            <p className="text-gray-400 text-sm mb-5">اضغط حفظ المنيو بعد الحذف لتأكيد التغيير</p>
            <div className="flex gap-3">
              <button onClick={executeDelete} className="flex-1 bg-red-600 text-white py-3 rounded-full font-bold hover:bg-red-700 transition">نعم، احذف</button>
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-full font-bold hover:bg-gray-300 transition">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* زر معاينة الموقع */}
      <a
        href="/"
        target="_blank"
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-3 z-40 flex items-center gap-2 rounded-full bg-[#2E1A12] px-4 py-2.5 text-sm font-bold text-white shadow-2xl transition hover:bg-[#5A3825] sm:bottom-6 sm:left-6 sm:px-5 sm:py-3 sm:text-base"
      >
        👁️ معاينة الموقع
      </a>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminAccessGate>
      <AdminDashboard />
    </AdminAccessGate>
  );
}
