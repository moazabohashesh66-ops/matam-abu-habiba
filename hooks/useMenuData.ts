"use client";

import { useState, useEffect } from "react";
import { hydrateMenuData, menuData as defaultMenuData } from "@/data/menuData";
import type { Category } from "@/data/menuData";
import { loadSharedSiteData, saveSharedDataField } from "@/lib/siteDataClient";

// Bump the key so browsers do not keep showing the previous menu after this update.
export const MENU_STORAGE_KEY = "kayan-menu-v1";

export function useMenuData() {
  const [menuData, setMenuData] = useState<Category[]>(defaultMenuData);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadMenu = () => {
      try {
        const stored = localStorage.getItem(MENU_STORAGE_KEY);
        if (stored) {
          const parsed: unknown = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMenuData(hydrateMenuData(parsed as Category[]));
          } else {
            setMenuData(defaultMenuData);
          }
        } else {
          setMenuData(defaultMenuData);
        }
      } catch (e) {
        console.error("فشل تحميل البيانات من localStorage:", e);
        setMenuData(defaultMenuData);
      }
      setIsLoaded(true);
    };

    loadMenu();
    loadSharedSiteData()
      .then(({ data }) => {
        if (Array.isArray(data?.menuData) && data.menuData.length > 0) {
          const sharedMenu = hydrateMenuData(data.menuData as Category[]);
          setMenuData(sharedMenu);
          try { localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(sharedMenu)); } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setIsLoaded(true));
    const handleStorage = (event: StorageEvent) => {
      if (event.key === MENU_STORAGE_KEY) loadMenu();
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const saveMenuData = async (data: Category[]): Promise<boolean> => {
    try {
      localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(data));
      setMenuData(data);
      await saveSharedDataField("menuData", data);
      return true;
    } catch (e) {
      console.error("فشل حفظ البيانات:", e);
      return false;
    }
  };

  const resetMenuData = async () => {
    try {
      localStorage.removeItem(MENU_STORAGE_KEY);
      setMenuData(defaultMenuData);
      await saveSharedDataField("menuData", defaultMenuData);
    } catch (e) {
      console.error("فشل إعادة الضبط:", e);
    }
  };

  return { menuData, saveMenuData, resetMenuData, isLoaded };
}
