"use client";

import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import AdminAccessGate from "@/components/admin/AdminAccessGate";
import { SITE_URL } from "@/lib/seo";

function QRContent() {
  const [url, setUrl] = useState(SITE_URL);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-md rounded-2xl bg-white p-5 text-center shadow-xl sm:p-8">
        <h1 className="mb-6 text-xl font-bold text-[#2E1A12] sm:text-2xl">
          🍽️ QR Code لمنيو كيان
        </h1>

        <div className="mb-6">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-center"
            placeholder="رابط المنيو"
          />
        </div>

        <div className="inline-block max-w-full rounded-lg border border-gray-200 bg-white p-3 sm:p-4">
          <QRCodeCanvas value={url} size={200} level="H" style={{ maxWidth: "100%", height: "auto" }} />
        </div>

        <p className="text-sm text-gray-500 mt-4">
          امسح الكود لفتح منيو كيان
        </p>

        <button
          onClick={() => {
            const canvas = document.querySelector("canvas");
            if (canvas) {
              const link = document.createElement("a");
              link.download = "qr-kayan-menu.png";
              link.href = canvas.toDataURL();
              link.click();
            }
          }}
          className="mt-4 min-h-10 rounded-full bg-yellow-500 px-6 py-2.5 font-bold text-black transition hover:bg-yellow-400"
        >
          ⬇️ تحميل QR Code
        </button>
      </div>
    </div>
  );
}

export default function QRPage() {
  return (
    <AdminAccessGate>
      <QRContent />
    </AdminAccessGate>
  );
}
