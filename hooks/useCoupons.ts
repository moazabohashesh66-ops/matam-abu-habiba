"use client";

import { useCallback, useEffect, useState } from "react";
import {
  COUPONS_CHANGED_EVENT,
  COUPONS_STORAGE_KEY,
  type DiscountCoupon,
} from "@/data/coupons";
import { loadSharedSiteData, saveSharedDataField } from "@/lib/siteDataClient";

function readCoupons(): DiscountCoupon[] {
  try {
    const stored = localStorage.getItem(COUPONS_STORAGE_KEY);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed as DiscountCoupon[];
    }
  } catch {}
  return [];
}

export function useCoupons() {
  const [coupons, setCurrentCoupons] = useState<DiscountCoupon[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadCoupons = () => {
      setCurrentCoupons(readCoupons());
      setIsLoaded(true);
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === COUPONS_STORAGE_KEY || event.key === null) loadCoupons();
    };
    const handleLocalUpdate = (event: Event) => {
      const nextCoupons = (event as CustomEvent<DiscountCoupon[]>).detail;
      setCurrentCoupons(Array.isArray(nextCoupons) ? nextCoupons : readCoupons());
      setIsLoaded(true);
    };

    loadCoupons();
    loadSharedSiteData()
      .then(({ data }) => {
        if (Array.isArray(data?.coupons)) {
          const sharedCoupons = data.coupons as DiscountCoupon[];
          setCurrentCoupons(sharedCoupons);
          try { localStorage.setItem(COUPONS_STORAGE_KEY, JSON.stringify(sharedCoupons)); } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setIsLoaded(true));
    window.addEventListener("storage", handleStorage);
    window.addEventListener(COUPONS_CHANGED_EVENT, handleLocalUpdate);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(COUPONS_CHANGED_EVENT, handleLocalUpdate);
    };
  }, []);

  const saveCoupons = useCallback(async (nextCoupons: DiscountCoupon[]): Promise<boolean> => {
    try {
      localStorage.setItem(COUPONS_STORAGE_KEY, JSON.stringify(nextCoupons));
      setCurrentCoupons(nextCoupons);
      setIsLoaded(true);
      window.dispatchEvent(new CustomEvent<DiscountCoupon[]>(COUPONS_CHANGED_EVENT, { detail: nextCoupons }));
      await saveSharedDataField("coupons", nextCoupons);
      return true;
    } catch {
      return false;
    }
  }, []);

  return { coupons, isLoaded, saveCoupons };
}
