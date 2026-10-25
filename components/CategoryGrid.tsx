"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import type { Category } from "@/data/menuData";

interface CategoryGridProps {
  menuData: Category[];
}

const colors = [
  "from-red-500 to-orange-500",
  "from-green-500 to-emerald-500",
  "from-yellow-500 to-amber-500",
  "from-blue-500 to-indigo-500",
  "from-purple-500 to-pink-500",
  "from-teal-500 to-cyan-500",
  "from-rose-500 to-red-500",
];

export default function CategoryGrid({ menuData }: CategoryGridProps) {
  if (!menuData || !Array.isArray(menuData) || menuData.length === 0) {
    return (
      <section className="scroll-mt-20 bg-[#1a0e0a] px-4 py-14 sm:py-20" id="menu">
        <div className="text-center text-white/50">
          <p className="text-xl">⚠️ لا توجد بيانات حالياً</p>
          <p className="mt-2 text-sm text-white/30">يرجى المحاولة مرة أخرى لاحقاً</p>
        </div>
      </section>
    );
  }

  return (
    <section className="scroll-mt-20 bg-[#1a0e0a] px-4 py-14 sm:py-20" id="menu">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-10 text-center sm:mb-14"
        >
          <span className="text-yellow-400/60 font-bold text-xs tracking-[4px] sm:text-sm sm:tracking-[6px]">قائمتنا</span>
          <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl md:text-5xl">
            اكتشف أشهى الأطباق 🍽️
          </h2>
          <div className="w-20 h-0.5 bg-yellow-400/50 mx-auto mt-4 rounded-full"></div>
          <p className="mt-4 text-base font-light text-white/50 sm:text-lg">
            بيتزا وسندوتشات وكريب ووجبات طازجة
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 min-[360px]:gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {menuData.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              viewport={{ once: true }}
              whileHover={{ y: -10 }}
            >
              <Link
                href={`/menu/${category.id}`}
                className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-yellow-400/30 hover:shadow-2xl"
              >
                <div className="relative h-28 w-full overflow-hidden bg-gray-800/50 min-[360px]:h-32 sm:h-44">
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      unoptimized
                    />
                  ) : (
                    <div className={`h-full w-full bg-gradient-to-br ${colors[index % colors.length]} flex items-center justify-center`}>
                      <span className="text-7xl">{category.icon}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <div className="absolute bottom-3 right-3 text-white">
                    <span className="text-3xl">{category.icon}</span>
                  </div>
                </div>
                <div className="p-3 text-center min-[360px]:p-4">
                  <h3 className="break-words text-base font-bold text-white/90 transition group-hover:text-yellow-400 sm:text-lg">
                    {category.name}
                  </h3>
                  <p className="mt-1 text-xs text-white/50 sm:text-sm">
                    {category.products.filter((product) => product.isAvailable).length} صنف متاح
                  </p>
                  <div className="mt-3 inline-flex rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-1.5 text-xs font-semibold text-yellow-300 transition group-hover:bg-yellow-400 group-hover:text-black sm:px-5 sm:text-sm">
                    استكشف
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
