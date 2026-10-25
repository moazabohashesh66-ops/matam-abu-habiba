import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { CartProvider } from "@/contexts/CartContext";
import Cart from "@/components/shared/Cart";

const cairo = localFont({
  src: "../public/fonts/cairo-arabic.woff2",
  variable: "--font-cairo",
  weight: "300 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "مطعم أبو حبيبه | قائمة الطعام",
  description: "قائمة مطعم أبو حبيبه: بيتزا، سندوتشات، كريب ووجبات دجاج وشاورما",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <CartProvider>
          {children}
          <Cart />
        </CartProvider>
      </body>
    </html>
  );
}
