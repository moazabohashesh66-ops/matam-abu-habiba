import type { Metadata } from "next";
import { SITE_LOGO_OPEN_GRAPH } from "@/data/brand";
import {
  MENU_CATEGORY_NAMES,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const categoryName = MENU_CATEGORY_NAMES[category];

  if (!categoryName) return { robots: { index: false, follow: false } };

  const title = `منيو ${categoryName}`;
  const description = `${title} من ${SITE_NAME}. ${SITE_DESCRIPTION}`;
  const url = `${SITE_URL}/menu/${category}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "ar_EG",
      url,
      siteName: SITE_NAME,
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [SITE_LOGO_OPEN_GRAPH],
    },
  };
}

export default function CategoryLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
