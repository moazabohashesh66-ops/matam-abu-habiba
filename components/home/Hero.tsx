"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { defaultSettings, formatDisplayPhone, toTelephoneLink } from "@/data/settings";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export default function Hero() {
  const router = useRouter();
  const { settings } = useSiteSettings();
  const contactNumber = settings.phoneNumber || defaultSettings.phoneNumber;
  const displayPhone = formatDisplayPhone(contactNumber);

  return (
    <section className="relative flex min-h-screen min-h-[100svh] items-center justify-center overflow-hidden py-20 sm:py-24">

      {/* ===== الخلفية: صورة اللوجو بلور احترافي ===== */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/logo.jpg"
          alt="خلفية مطعم أبو حبيبه"
          fill
          sizes="100vw"
          className="object-cover object-center scale-110"
          priority
        />
        {/* طبقات التعتيم التدريجي */}
        <div className="absolute inset-0 bg-[#1a0e0a]/80" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0e0a]/60 via-transparent to-[#1a0e0a]" />
        {/* تأثير الضبابية */}
        <div className="absolute inset-0 backdrop-blur-sm" />
      </div>

      {/* ===== تأثيرات الضوء ===== */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* ===== المحتوى الرئيسي ===== */}
      <motion.div
        initial={{ opacity: 0, y: 80 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6"
      >
        {/* اللوجو الدائري الكبير */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, delay: 0.2, type: "spring", stiffness: 120 }}
          className="relative mx-auto mb-6 sm:mb-8"
        >
          {/* حلقة خارجية متوهجة */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 blur-xl opacity-40 scale-110 animate-pulse" />
          {/* حلقة ذهبية */}
          <div className="relative mx-auto h-36 w-36 rounded-full bg-gradient-to-tr from-yellow-400 via-orange-400 to-yellow-500 p-1 shadow-2xl shadow-yellow-500/30 sm:h-44 sm:w-44 md:h-56 md:w-56">
            <div className="w-full h-full rounded-full overflow-hidden border-4 border-[#1a0e0a]/50">
              <Image
                src="/logo.jpg"
                alt="مطعم أبو حبيبه"
                width={224}
                height={224}
                className="w-full h-full object-cover object-top"
                priority
              />
            </div>
          </div>
        </motion.div>

        {/* اسم المطعم */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="text-4xl font-extrabold leading-tight tracking-wide text-white drop-shadow-2xl sm:text-5xl sm:tracking-wider md:text-7xl"
        >
          مطعم{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">
            أبو حبيبه
          </span>
        </motion.h1>

        {/* التاج الإنجليزي */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-3 text-sm font-light uppercase tracking-[3px] text-yellow-300/60 sm:text-base sm:tracking-[6px] md:text-lg md:tracking-[10px]"
        >
          Abu Habiba Restaurant
        </motion.p>

        {/* خط فاصل */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-5 h-px w-32 bg-gradient-to-r from-transparent via-yellow-400 to-transparent mx-auto"
        />

        {/* الوصف */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-white/65 sm:text-base md:text-lg"
        >
          للوجبات السريعة والمأكولات الشهية بأفضل جودة وأطيب طعم
        </motion.p>

        {/* رقم التليفون */}
        <motion.a
          href={toTelephoneLink(contactNumber)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-4 inline-flex items-center gap-2 text-base font-semibold tracking-wide text-yellow-400/80 transition-colors hover:text-yellow-400 sm:text-lg sm:tracking-wider"
        >
          📞 {displayPhone}
        </motion.a>

        {/* زر استكشف المنيو */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="mx-auto mt-8 flex max-w-sm flex-col justify-center gap-3 sm:mt-10 sm:max-w-none sm:flex-row sm:gap-4"
        >
          <button
            onClick={() => {
              const menuSection = document.getElementById("menu");
              if (menuSection) {
                menuSection.scrollIntoView({ behavior: "smooth" });
              } else {
                router.push("/#menu");
              }
            }}
            className="rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-3 text-base font-bold text-black shadow-lg shadow-yellow-500/20 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/30 sm:px-10 sm:py-4 sm:text-lg"
          >
            🍽 استكشف المنيو
          </button>
          <a
            href={toTelephoneLink(contactNumber)}
            className="rounded-full border border-yellow-400/40 px-6 py-3 text-base font-bold text-yellow-400 transition-all hover:scale-105 hover:bg-yellow-400/10 sm:px-10 sm:py-4 sm:text-lg"
          >
            📞 اتصل بنا
          </a>
        </motion.div>

        {/* مؤشر التمرير */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="mt-8 sm:mt-16"
        >
          <div className="w-6 h-10 border border-white/20 rounded-full flex justify-center mx-auto">
            <div className="w-1 h-3 bg-yellow-400/60 rounded-full mt-2 animate-bounce" />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
