"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { useCart } from "@/contexts/CartContext";
import type { Product } from "@/data/menuData";
import { useMenuData } from "@/hooks/useMenuData";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/layout/Footer";

const fallbackCategoryImages: Record<string, string> = {
  meals: "https://images.unsplash.com/photo-1781332147287-191fcfbd52be?auto=format&fit=crop&w=1200&q=80",
  sandwiches: "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=1200&h=400&fit=crop",
  pizza: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&h=400&fit=crop",
  crepes: "https://images.unsplash.com/photo-1647563186842-64d898764d5e?auto=format&fit=crop&w=1200&q=80",
};

const getDefaultOptionSelections = (product: Product) => Object.fromEntries(
  (product.optionGroups ?? []).map((group) => [
    group.id,
    group.options.filter((option) => option.defaultSelected).map((option) => option.id),
  ]),
);

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.category as string;
  const { menuData, isLoaded } = useMenuData();
  const category = menuData.find((item) => item.id === categoryId);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [selectedOptions, setSelectedOptions] = useState<Record<string, Record<string, string[]>>>({});
  const [optionErrors, setOptionErrors] = useState<Record<string, string>>({});

  const { addItem } = useCart();

  const handleAddToCart = (product: Product) => {
    if (!category) return;
    const productSelections = selectedOptions[product.id] ?? getDefaultOptionSelections(product);
    const missingRequiredOption = product.optionGroups?.find((group) => group.required && !(productSelections[group.id]?.length));
    if (missingRequiredOption) {
      setOptionErrors((previous) => ({ ...previous, [product.id]: `اختار ${missingRequiredOption.name} أولاً` }));
      return;
    }

    const chosenOptions = (product.optionGroups ?? []).flatMap((group) =>
      group.options
        .filter((option) => productSelections[group.id]?.includes(option.id))
        .map((option) => ({ group, option })),
    );
    const optionLabel = chosenOptions.map(({ group, option }) => `${group.name}: ${option.name}`).join("، ");
    const optionPrice = chosenOptions.reduce((sum, { option }) => sum + option.priceAdjustment, 0);
    const selectedIds = chosenOptions.map(({ option }) => option.id).sort();
    addItem({
      id: selectedIds.length ? `${product.id}::${selectedIds.join("-")}` : product.id,
      name: optionLabel ? `${product.name} — ${optionLabel}` : product.name,
      price: product.price + optionPrice,
      productId: product.id,
      selectedOptionIds: selectedIds,
      image: product.image,
      categoryName: category.name,
      categoryIcon: category.icon,
    });
    setOptionErrors((previous) => ({ ...previous, [product.id]: "" }));
    // تأثير بصري مؤقت
    setAddedIds((prev) => new Set(prev).add(product.id));
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 1500);
  };

  if (!isLoaded) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-screen items-center justify-center bg-[#1a0e0a]">
          <div className="text-2xl text-white/60">⏳ جاري التحميل...</div>
        </div>
      </>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a0e0a]">
        <Navbar />
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400">القسم غير موجود</h2>
          <button onClick={() => router.push("/")} className="mt-4 rounded-full bg-yellow-500 px-6 py-2 font-bold text-black transition hover:bg-yellow-400">
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  const coverImage =
    category.image ||
    fallbackCategoryImages[category.id] ||
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=400&fit=crop";

  const availableProducts = category.products.filter((p) => p.isAvailable);
  const unavailableProducts = category.products.filter((p) => !p.isAvailable);

  return (
      <div className="min-h-screen bg-[#1a0e0a]">
      <Navbar />
      {/* صورة الغلاف */}
      <div className="relative h-72 md:h-96 w-full">
        <Image
          src={coverImage}
          alt={category.name}
          fill
          className="object-cover"
          unoptimized
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-[#1a0e0a]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="px-4 text-center text-white"
          >
            <div className="mb-3 text-6xl drop-shadow-2xl sm:text-7xl">{category.icon}</div>
            <h1 className="break-words text-3xl font-bold drop-shadow-2xl sm:text-4xl md:text-6xl">{category.name}</h1>
            <p className="mt-2 break-words text-sm uppercase tracking-[0.2em] text-white/70 sm:text-lg sm:tracking-widest">{category.nameEn}</p>
          </motion.div>
        </div>
        <button
          onClick={() => router.push("/")}
          className="absolute left-3 top-20 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs text-white backdrop-blur-sm transition hover:bg-white/20 sm:left-4 sm:top-24 sm:px-4 sm:text-sm"
        >
          ← رجوع
        </button>
      </div>

      {/* المنتجات */}
      <div className="mx-auto max-w-6xl px-4 py-7 sm:py-10">
        {availableProducts.length === 0 && unavailableProducts.length === 0 ? (
          <div className="text-center text-white/40 py-20 text-xl">لا توجد منتجات في هذا القسم حالياً</div>
        ) : (
          <>
            {/* المنتجات المتوفرة */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableProducts.map((product, index) => {
                const justAdded = addedIds.has(product.id);
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.07 }}
                    whileHover={{ y: -6, scale: 1.01 }}
                    className="bg-white/5 rounded-2xl overflow-hidden border border-white/10 group hover:border-yellow-400/20 transition-all duration-300 shadow-lg"
                  >
                    {/* صورة المنتج */}
                    <div className="relative h-52 w-full overflow-hidden">
                      {product.image ? (
                        <Image src={product.image} alt={product.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" unoptimized />
                      ) : category.image ? (
                        <Image src={category.image} alt={product.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500 opacity-50" unoptimized />
                      ) : (
                        <div className="h-full bg-gradient-to-br from-yellow-700/30 to-orange-900/30 flex items-center justify-center">
                          <span className="text-7xl">{category.icon}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

                      {/* شارات */}
                      <div className="absolute top-3 right-3 flex flex-col gap-1">
                        {product.isPopular && (
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">🔥 الأكثر طلباً</span>
                        )}
                        {product.isNew && (
                          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">✨ جديد</span>
                        )}
                      </div>
                    </div>

                    {/* التفاصيل */}
                    <div className="p-5">
                      <h3 className="mb-1 break-words text-lg font-bold text-white transition-colors group-hover:text-yellow-400 sm:text-xl">
                        {product.name}
                      </h3>
                      {(product.size || product.weight) && (
                        <p className="mb-2 text-sm font-semibold text-yellow-300/80">
                          {product.size || product.weight}
                        </p>
                      )}
                      {product.description && (
                        <p className="text-white/40 text-sm mb-3 line-clamp-2">{product.description}</p>
                      )}

                      {product.optionGroups?.map((group) => (
                        group.options.length > 0 && (
                          <fieldset key={group.id} className="mb-3 rounded-xl border border-white/10 bg-black/10 p-3">
                            <legend className="px-1 text-xs font-bold text-white/75">
                              {group.name}{group.required ? " *" : ""}{group.multiple ? " · اختيارات متعددة" : ""}
                            </legend>
                            <div className="grid grid-cols-1 gap-1.5">
                              {group.options.map((option) => {
                                const selectedIds = selectedOptions[product.id]?.[group.id]
                                  ?? group.options.filter((item) => item.defaultSelected).map((item) => item.id);
                                const checked = selectedIds.includes(option.id);
                                return (
                                  <label key={option.id} className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm text-white/75 transition hover:bg-white/5">
                                    <span className="flex min-w-0 items-center gap-2">
                                      <input
                                        type={group.multiple ? "checkbox" : "radio"}
                                        name={`${product.id}-${group.id}`}
                                        checked={checked}
                                        onChange={() => {
                                          setSelectedOptions((previous) => {
                                            const selections = previous[product.id] ?? {};
                                            const current = selections[group.id]
                                              ?? group.options.filter((item) => item.defaultSelected).map((item) => item.id);
                                            const next = group.multiple
                                              ? current.includes(option.id) ? current.filter((id) => id !== option.id) : [...current, option.id]
                                              : [option.id];
                                            return { ...previous, [product.id]: { ...selections, [group.id]: next } };
                                          });
                                          setOptionErrors((previous) => ({ ...previous, [product.id]: "" }));
                                        }}
                                        className="accent-yellow-400"
                                      />
                                      <span className="break-words">{option.name}</span>
                                    </span>
                                    {option.priceAdjustment > 0 && <span className="shrink-0 text-xs text-yellow-300">+{option.priceAdjustment} ج.م</span>}
                                  </label>
                                );
                              })}
                            </div>
                          </fieldset>
                        )
                      ))}
                      {optionErrors[product.id] && <p role="alert" className="mb-2 text-xs font-semibold text-red-300">{optionErrors[product.id]}</p>}

                      <div className="flex justify-between items-center pt-3 border-t border-white/10">
                        <span className="text-xl font-extrabold text-yellow-400 sm:text-2xl">
                          {product.price}{" "}
                          <span className="text-sm font-normal text-yellow-400/60">ج.م</span>
                        </span>

                        {/* زر الإضافة للسلة */}
                        <motion.button
                          onClick={() => handleAddToCart(product)}
                          whileTap={{ scale: 0.9 }}
                          className={`flex min-h-10 items-center gap-2 rounded-full px-3 py-2 text-xs font-bold transition-all duration-300 sm:px-4 sm:text-sm ${
                            justAdded
                              ? "bg-green-500 text-white scale-105 shadow-lg shadow-green-500/30"
                              : "bg-[#25D366] text-white hover:bg-[#20b858] shadow-md"
                          }`}
                        >
                          <span>{justAdded ? "✅ تمت الإضافة" : "🛒 أضف للسلة"}</span>
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* غير متوفر */}
            {unavailableProducts.length > 0 && (
              <div className="mt-12">
                <h3 className="text-white/30 text-lg font-semibold mb-4 text-center">غير متوفر حالياً</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 opacity-40">
                  {unavailableProducts.map((product) => (
                    <div key={product.id} className="bg-white/5 rounded-xl p-3 border border-white/5 text-center">
                      <p className="text-white/60 font-semibold line-through text-sm">{product.name}</p>
                      <p className="text-white/30 text-xs mt-1">{product.price} ج.م</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* التنقل بين الأقسام */}
        {menuData.length > 1 && (
          <div className="mt-16 border-t border-white/10 pt-10">
            <p className="text-center text-white/30 text-sm mb-6 tracking-widest">استكشف أقسامنا الأخرى</p>
            <div className="flex flex-wrap justify-center gap-3">
              {menuData
                .filter((cat) => cat.id !== categoryId)
                .map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => router.push(`/menu/${cat.id}`)}
                    className="flex items-center gap-2 bg-white/5 border border-white/10 text-white/70 px-4 py-2 rounded-full text-sm hover:bg-white/10 hover:text-white transition"
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
