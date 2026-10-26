"use client";

import Link from "next/link";
import { FaFacebookF } from "react-icons/fa";
import { defaultSettings, formatDisplayPhone, toFacebookUrl, toTelephoneLink } from "@/data/settings";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export default function Footer() {
  const { settings } = useSiteSettings();
  const contactNumber = settings.phoneNumber || defaultSettings.phoneNumber;
  const facebookUrl = toFacebookUrl(settings.facebookUrl || defaultSettings.facebookUrl);
  const displayPhone = formatDisplayPhone(contactNumber);

  return (
    <footer className="border-t border-white/10 bg-[#120906] px-4 py-10 text-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-right">
        <div>
          <Link href="/" className="inline-block text-xl font-extrabold text-white transition hover:text-yellow-400">
            <span className="text-yellow-400">كيان</span>
          </Link>
          <p className="mt-2 text-sm text-white/45">اطلب أكلتك المفضلة من المنيو</p>
        </div>

        <nav aria-label="روابط سريعة" className="flex flex-wrap items-center justify-center gap-5 text-sm text-white/60">
          <Link href="/" className="transition hover:text-yellow-400">الرئيسية</Link>
          <Link href="/#menu" className="transition hover:text-yellow-400">المنيو</Link>
          <a href={toTelephoneLink(contactNumber)} className="transition hover:text-yellow-400">اتصل بنا {displayPhone}</a>
          {facebookUrl && <a
            href={facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="تابع كيان على فيسبوك"
            className="inline-flex items-center gap-2 rounded-full border border-[#1877F2]/30 bg-[#1877F2]/10 px-3 py-2 text-[#8cbaff] transition hover:bg-[#1877F2]/20 hover:text-white"
          >
            <FaFacebookF aria-hidden="true" />
            تابعنا على فيسبوك
          </a>}
        </nav>

        <p className="text-xs text-white/30">© كيان — جميع الحقوق محفوظة</p>
      </div>
    </footer>
  );
}
