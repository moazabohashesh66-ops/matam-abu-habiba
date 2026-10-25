"use client";

import { useState, useEffect } from "react";
import { defaultOffers, OFFERS_STORAGE_KEY } from "@/data/offersData";
import type { Offer } from "@/data/offersData";
import { loadSharedSiteData, saveSharedDataField } from "@/lib/siteDataClient";

export function useOffers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadOffers = () => {
      try {
        const stored = localStorage.getItem(OFFERS_STORAGE_KEY);
        if (stored) {
          const parsed: unknown = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setOffers(parsed as Offer[]);
            setIsLoaded(true);
            return;
          }
        }
      } catch {}
      setOffers(defaultOffers);
      setIsLoaded(true);
    };

    loadOffers();
    loadSharedSiteData()
      .then(({ data }) => {
        if (Array.isArray(data?.offers)) {
          const sharedOffers = data.offers as Offer[];
          setOffers(sharedOffers);
          try { localStorage.setItem(OFFERS_STORAGE_KEY, JSON.stringify(sharedOffers)); } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setIsLoaded(true));
    const handleStorage = (event: StorageEvent) => {
      if (event.key === OFFERS_STORAGE_KEY) loadOffers();
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const saveOffers = async (data: Offer[]): Promise<boolean> => {
    try {
      localStorage.setItem(OFFERS_STORAGE_KEY, JSON.stringify(data));
      setOffers(data);
      await saveSharedDataField("offers", data);
      return true;
    } catch {
      return false;
    }
  };

  return { offers, saveOffers, isLoaded };
}
