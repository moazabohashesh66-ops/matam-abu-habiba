"use client";

import { useCallback, useEffect, useState } from "react";
import {
  defaultSettings,
  SETTINGS_CHANGED_EVENT,
  SETTINGS_KEY,
  normalizeSiteSettings,
  type SiteSettings,
} from "@/data/settings";
import { loadSharedSiteData, saveSharedDataField } from "@/lib/siteDataClient";

function readSettings(): SiteSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      if (parsed && typeof parsed === "object") {
        return normalizeSiteSettings(parsed as Partial<SiteSettings>);
      }
    }
  } catch {}
  return defaultSettings;
}

function broadcastSettings(settings: SiteSettings) {
  window.dispatchEvent(new CustomEvent<SiteSettings>(SETTINGS_CHANGED_EVENT, { detail: settings }));
}

export function useSiteSettings() {
  const [settings, setCurrentSettings] = useState<SiteSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadSettings = () => setCurrentSettings(readSettings());
    const handleStorage = (event: StorageEvent) => {
      if (event.key === SETTINGS_KEY || event.key === null) loadSettings();
    };
    const handleLocalUpdate = (event: Event) => {
      const nextSettings = (event as CustomEvent<SiteSettings>).detail;
      setCurrentSettings(nextSettings ? { ...defaultSettings, ...nextSettings } : readSettings());
    };

    loadSettings();
    loadSharedSiteData()
      .then(({ data }) => {
        if (data?.settings && typeof data.settings === "object") {
          const sharedSettings = normalizeSiteSettings(data.settings as Partial<SiteSettings>);
          setCurrentSettings(sharedSettings);
          try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(sharedSettings)); } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setIsLoaded(true));
    window.addEventListener("storage", handleStorage);
    window.addEventListener(SETTINGS_CHANGED_EVENT, handleLocalUpdate);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(SETTINGS_CHANGED_EVENT, handleLocalUpdate);
    };
  }, []);

  const setSettings = useCallback((nextSettings: SiteSettings) => {
    setCurrentSettings(nextSettings);
    broadcastSettings(nextSettings);
  }, []);

  const saveSettings = useCallback(async (nextSettings: SiteSettings = settings): Promise<boolean> => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(nextSettings));
      setCurrentSettings(nextSettings);
      broadcastSettings(nextSettings);
      await saveSharedDataField("settings", nextSettings);
      return true;
    } catch {
      return false;
    }
  }, [settings]);

  return { settings, setSettings, saveSettings, isLoaded };
}
