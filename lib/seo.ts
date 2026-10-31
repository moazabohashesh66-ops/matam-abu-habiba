import { DEFAULT_FACEBOOK_URL } from "@/data/settings";
import { SITE_LOGO_URL } from "@/data/brand";

export const SITE_URL = "https://mateamkian.vercel.app";
export const SITE_NAME = "كيان";
export const SITE_DESCRIPTION =
  "تصفح منيو الشاورما والكريب والبرجر والساج من كيان واطلب أونلاين.";
export const RESTAURANT_PHONE = "+201010062463";

export const MENU_CATEGORY_NAMES: Record<string, string> = {
  shawarma: "الشاورما",
  "shawarma-weights": "أوزان الشاورما",
  crepes: "الكريب",
  burgers: "البرجر",
  saj: "قسم الغربي (عيش الصاج)",
  additions: "الإضافات",
};

export const siteStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: SITE_NAME,
      alternateName: ["كيان", "Kayan"],
      inLanguage: "ar-EG",
    },
    {
      "@type": "Restaurant",
      "@id": `${SITE_URL}/#restaurant`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      image: `${SITE_URL}${SITE_LOGO_URL}`,
      logo: `${SITE_URL}${SITE_LOGO_URL}`,
      telephone: RESTAURANT_PHONE,
      sameAs: [DEFAULT_FACEBOOK_URL],
      servesCuisine: ["شاورما", "كريب", "برجر", "وجبات سريعة"],
      menu: `${SITE_URL}/#menu`,
    },
  ],
} as const;
