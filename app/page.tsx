"use client";

import Navbar from "@/components/shared/Navbar";
import Hero from "@/components/home/Hero";
import CategoryGrid from "@/components/CategoryGrid";
import TodayOffers from "@/components/home/TodayOffers";
import { useMenuData } from "@/hooks/useMenuData";
import Footer from "@/components/layout/Footer";

export default function Home() {
  const { menuData, isLoaded } = useMenuData();

  if (!isLoaded) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-[#1a0e0a]">
          <div className="text-white/60 text-xl">⏳ جاري تحميل المنيو...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Hero />
      <TodayOffers menuData={menuData} />
      <CategoryGrid menuData={menuData} />
      <Footer />
    </>
  );
}
