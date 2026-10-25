export const SITE_URL = "https://matam-abu-habiba.vercel.app";
export const SITE_NAME = "مطعم أبو حبيبه";
export const SITE_DESCRIPTION =
  "مطعم أبو حبيبه يقدم البيتزا والشاورما والكريب والسندوتشات والوجبات. تصفح المنيو واطلب أونلاين.";
export const RESTAURANT_PHONE = "+201099176750";
export const RESTAURANT_FACEBOOK =
  "https://www.facebook.com/profile.php?id=61590812648091&locale=ar_AR";

export const MENU_CATEGORY_NAMES: Record<string, string> = {
  pizza: "البيتزا",
  sandwiches: "السندوتشات",
  crepes: "الكريب",
  meals: "الوجبات",
};

export const siteStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: SITE_NAME,
      alternateName: ["أبو حبيبه", "ابو حبيبه", "مطعم ابو حبيبه"],
      inLanguage: "ar-EG",
    },
    {
      "@type": "Restaurant",
      "@id": `${SITE_URL}/#restaurant`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      image: `${SITE_URL}/logo.jpg`,
      telephone: RESTAURANT_PHONE,
      servesCuisine: ["مصري", "شامي", "وجبات سريعة"],
      menu: `${SITE_URL}/#menu`,
      sameAs: [RESTAURANT_FACEBOOK],
    },
  ],
} as const;
