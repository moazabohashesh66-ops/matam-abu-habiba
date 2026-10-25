import type { MetadataRoute } from "next";
import { MENU_CATEGORY_NAMES, SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...Object.keys(MENU_CATEGORY_NAMES).map((category) => ({
      url: `${SITE_URL}/menu/${category}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
