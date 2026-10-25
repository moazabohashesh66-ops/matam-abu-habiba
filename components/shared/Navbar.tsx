"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/contexts/CartContext";
import { defaultSettings, formatDisplayPhone, toTelephoneLink } from "@/data/settings";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { count, setIsOpen: openCart } = useCart();
  const { settings } = useSiteSettings();
  const contactNumber = settings.phoneNumber || defaultSettings.phoneNumber;
  const displayPhone = formatDisplayPhone(contactNumber);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className={`fixed w-full top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#1a0e0a]/95 backdrop-blur-xl shadow-2xl border-b border-white/5"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">

          {/* الشعار */}
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ scale: 1.08 }}
              transition={{ duration: 0.3 }}
              className="relative w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-yellow-400/60 shadow-lg shadow-yellow-500/20 flex-shrink-0"
            >
              <Image
                src="/logo.jpg"
                alt="مطعم أبو حبيبه"
                fill
                sizes="(max-width: 768px) 48px, 56px"
                className="object-cover object-top"
                priority
              />
            </motion.div>
            <div>
              <span className="font-bold text-xl md:text-2xl tracking-wide text-white">
                أبو <span className="text-yellow-400">حبيبه</span>
              </span>
              <div className="text-[8px] md:text-[10px] tracking-[4px] text-white/50 font-light">
                للوجبات السريعة
              </div>
            </div>
          </Link>

          {/* الروابط — شاشات كبيرة */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-white/80 hover:text-yellow-400 transition-colors font-medium text-sm tracking-wide relative group">
              الرئيسية
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-yellow-400 transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link href="/#menu" className="text-white/80 hover:text-yellow-400 transition-colors font-medium text-sm tracking-wide relative group">
              المنيو
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-yellow-400 transition-all duration-300 group-hover:w-full" />
            </Link>
            <a
              href={toTelephoneLink(contactNumber)}
              className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-4 py-2 rounded-full text-sm font-semibold hover:bg-yellow-500/20 transition-all"
            >
              📞 {displayPhone}
            </a>
          </div>

          {/* أيقونة السلة + زر الجوال */}
          <div className="flex items-center gap-3">
            {/* زر السلة */}
            <motion.button
              onClick={() => openCart(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative flex items-center gap-2 bg-[#25D366]/10 border border-[#25D366]/30 text-white px-4 py-2 rounded-full hover:bg-[#25D366]/20 transition-all"
            >
              <span className="text-lg">🛒</span>
              <span className="text-sm font-semibold hidden sm:inline">السلة</span>
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key="badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-2 -left-2 bg-[#25D366] text-white text-xs font-extrabold w-5 h-5 rounded-full flex items-center justify-center shadow-lg"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* زر قائمة الجوال */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? "إغلاق القائمة" : "فتح القائمة"}
              aria-expanded={isOpen}
              className="md:hidden flex min-h-11 min-w-11 items-center justify-center text-white/80 transition-colors hover:text-yellow-400 text-2xl"
            >
              {isOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </div>

      {/* قائمة الجوال */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-[#1a0e0a]/98 backdrop-blur-xl border-t border-white/5 px-4 py-4"
          >
            <Link href="/" className="block py-3 text-white/80 hover:text-yellow-400 transition border-b border-white/5" onClick={() => setIsOpen(false)}>
              الرئيسية
            </Link>
            <Link href="/#menu" className="block py-3 text-white/80 hover:text-yellow-400 transition border-b border-white/5" onClick={() => setIsOpen(false)}>
              المنيو
            </Link>
            <a href={toTelephoneLink(contactNumber)} className="block py-3 text-yellow-400 font-semibold hover:text-yellow-300 transition border-b border-white/5">
              📞 {displayPhone}
            </a>
            <button
              onClick={() => { openCart(true); setIsOpen(false); }}
              className="flex items-center gap-2 mt-3 text-[#25D366] font-semibold"
            >
              🛒 السلة {count > 0 && `(${count})`}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
