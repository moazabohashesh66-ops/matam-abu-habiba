"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Category } from "@/data/menuData";
import { useOffers } from "@/hooks/useOffers";
import { useCart } from "@/contexts/CartContext";

interface TodayOffersProps {
  menuData: Category[];
}

export default function TodayOffers({ menuData }: TodayOffersProps) {
  const router = useRouter();
  const { offers, isLoaded } = useOffers();
  const { addItem } = useCart();
  const [addedOfferIds, setAddedOfferIds] = useState<Set<string>>(new Set());
  const [addedPopularIds, setAddedPopularIds] = useState<Set<string>>(new Set());

  const addOfferToCart = (offer: (typeof offers)[number]) => {
    addItem({
      id: `offer-${offer.id}`,
      name: offer.name,
      price: offer.price,
      offerId: offer.id,
      image: offer.image,
      categoryName: "عروض اليوم",
      categoryIcon: "🔥",
    });
    setAddedOfferIds((previous) => new Set(previous).add(offer.id));
    window.setTimeout(() => {
      setAddedOfferIds((previous) => {
        const next = new Set(previous);
        next.delete(offer.id);
        return next;
      });
    }, 1500);
  };

  // العروض الخاصة المتاحة
  const specialOffers = offers.filter(o => o.isAvailable);

  // المنتجات الشائعة من المنيو (كاحتياط لو مفيش عروض خاصة)
  const popularItems = menuData
    .flatMap(category =>
      category.products
        .filter(p => p.isPopular && p.isAvailable)
        .slice(0, 2)
        .map(p => ({
          ...p,
          categoryId: category.id,
          categoryName: category.name,
          categoryIcon: category.icon,
          categoryImage: category.image,
        }))
    )
    .slice(0, 8);

  const addPopularItemToCart = (item: (typeof popularItems)[number]) => {
    if (item.optionGroups?.some((group) => group.options.length > 0)) {
      router.push(`/menu/${item.categoryId}`);
      return;
    }
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      productId: item.id,
      selectedOptionIds: [],
      image: item.image ?? item.categoryImage,
      categoryName: item.categoryName,
      categoryIcon: item.categoryIcon,
    });

    setAddedPopularIds((previous) => new Set(previous).add(item.id));
    window.setTimeout(() => {
      setAddedPopularIds((previous) => {
        const next = new Set(previous);
        next.delete(item.id);
        return next;
      });
    }, 1500);
  };

  const hasSpecialOffers = specialOffers.length > 0;
  const hasPopularItems = popularItems.length > 0;

  if (!isLoaded || (!hasSpecialOffers && !hasPopularItems)) return null;

  // حساب نسبة الخصم
  const discountPct = (orig?: number, curr?: number) => {
    if (!orig || !curr || orig <= curr) return null;
    return Math.round(((orig - curr) / orig) * 100);
  };

  return (
    <section className="relative overflow-hidden bg-[#150b08] px-4 py-14 sm:py-20">
      {/* خلفية زخرفية */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-yellow-600/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* العنوان */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-10 text-center sm:mb-14"
        >
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="mb-4 inline-block text-4xl sm:text-5xl"
          >
            🔥
          </motion.div>
          <span className="mb-2 block text-xs font-bold uppercase tracking-[4px] text-red-400/70 sm:text-sm sm:tracking-[6px]">
            لفترة محدودة
          </span>
          <h2 className="text-3xl font-bold text-white sm:text-4xl md:text-5xl">
            عروض <span className="text-yellow-400">اليوم</span>
          </h2>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent mx-auto mt-4" />
          <p className="mt-4 text-base font-light text-white/50 sm:text-lg">
            {hasSpecialOffers ? "عروض حصرية لا تفوّت — لفترة محدودة فقط" : "أشهى الأطباق الأكثر طلباً بأفضل الأسعار"}
          </p>
        </motion.div>

        {/* ===== العروض الخاصة ===== */}
        {hasSpecialOffers && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
              {specialOffers.map((offer, index) => (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="group"
                >
                  <div className="rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-red-400/40 transition-all duration-300 shadow-lg hover:shadow-red-500/10 h-full">
                    {/* الصورة */}
                    <div className="relative h-52 w-full overflow-hidden bg-black/10">
                      {offer.image ? (
                        <Image
                          src={offer.image}
                          alt={offer.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          unoptimized
                        />
                      ) : (
                        <div className="h-full bg-gradient-to-br from-red-900/40 to-orange-900/40 flex items-center justify-center">
                          <span className="text-7xl">🍽️</span>
                        </div>
                      )}

                      {/* شارة العرض */}
                      <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                        <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg">
                          {offer.badge || "🔥 عرض اليوم"}
                        </span>
                        {discountPct(offer.originalPrice, offer.price) && (
                          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
                            خصم {discountPct(offer.originalPrice, offer.price)}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* المعلومات */}
                    <div className="p-4">
                      <h3 className="text-white font-bold text-lg group-hover:text-yellow-400 transition-colors duration-300 mb-1">
                        {offer.name}
                      </h3>
                      {offer.description && (
                        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-white/80 mb-3">{offer.description}</p>
                      )}
                      <div className="flex items-center justify-between pt-3 border-t border-white/10">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-extrabold text-yellow-400">
                            {offer.price} <span className="text-sm font-normal text-yellow-400/60">ج.م</span>
                          </span>
                          {offer.originalPrice && (
                            <span className="text-white/30 line-through text-sm">{offer.originalPrice}</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => addOfferToCart(offer)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                            addedOfferIds.has(offer.id)
                              ? "border-green-500/30 bg-green-500/10 text-green-300"
                              : "border-yellow-500/20 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500 hover:text-black"
                          }`}
                        >
                          {addedOfferIds.has(offer.id) ? "✅ تمت الإضافة" : "🛒 أضف للسلة"}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* فاصل إذا كان في منتجات شائعة أيضاً */}
            {hasPopularItems && (
              <div className="flex items-center gap-4 my-12">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-white/30 text-sm font-semibold tracking-widest whitespace-nowrap">
                  الأكثر طلباً
                </span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
            )}
          </>
        )}

        {/* ===== المنتجات الشائعة من المنيو ===== */}
        {hasPopularItems && (
          <div className="grid grid-cols-2 gap-3 min-[360px]:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {popularItems.map((item, index) => (
              <motion.div
                key={`popular-${item.categoryId}-${item.id}`}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.07 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <button
                  type="button"
                  onClick={() => addPopularItemToCart(item)}
                  aria-label={`إضافة ${item.name} إلى السلة`}
                  className="block w-full text-right group"
                >
                  <div className="rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-yellow-400/30 transition-all duration-300 shadow-lg">
                    <div className="relative h-40 w-full overflow-hidden">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" unoptimized={item.image.startsWith("data:") || item.image.startsWith("http")} />
                      ) : item.categoryImage ? (
                        <Image src={item.categoryImage} alt={item.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" unoptimized={item.categoryImage.startsWith("data:") || item.categoryImage.startsWith("http")} />
                      ) : (
                        <div className="h-full bg-gradient-to-br from-yellow-700/30 to-orange-900/30 flex items-center justify-center">
                          <span className="text-5xl">{item.categoryIcon}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <div className="absolute top-2 right-2">
                        <span className="bg-orange-500/90 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                          🔥 الأكثر طلباً
                        </span>
                      </div>
                      <div className="absolute bottom-2 left-2">
                        <span className="bg-yellow-500 text-black text-xs px-2.5 py-1 rounded-full font-extrabold">
                          {item.price} ج.م
                        </span>
                      </div>
                    </div>
                    <div className="min-w-0 p-3">
                      <h3 className="text-white font-bold text-sm group-hover:text-yellow-400 transition-colors line-clamp-1">
                        {item.name}
                      </h3>
                      <p className="text-white/30 text-xs mt-0.5">
                        {item.categoryIcon} {item.categoryName}
                      </p>
                      <p className={`mt-2 text-xs font-semibold ${addedPopularIds.has(item.id) ? "text-green-300" : "text-yellow-400/80"}`}>
                        {addedPopularIds.has(item.id)
                          ? "✓ تمت الإضافة للسلة"
                          : item.optionGroups?.some((group) => group.options.length > 0)
                            ? "اختار المكونات لإضافته للسلة"
                            : "+ اضغط لإضافة المنتج للسلة"}
                      </p>
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* زر المنيو الكامل */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <a
            href="#menu"
            onClick={e => {
              e.preventDefault();
              document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="inline-flex items-center gap-2 border border-yellow-400/30 text-yellow-400 px-8 py-3 rounded-full hover:bg-yellow-400/10 transition-all duration-300 font-semibold"
          >
            📋 شاهد كامل القائمة
          </a>
        </motion.div>
      </div>
    </section>
  );
}
