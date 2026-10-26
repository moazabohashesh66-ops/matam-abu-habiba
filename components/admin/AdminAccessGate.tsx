"use client";

import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";

export default function AdminAccessGate({ children, mode = "admin" }: { children: ReactNode; mode?: "admin" | "orders" }) {
  const authEndpoint = mode === "orders" ? "/api/admin/orders-auth" : "/api/admin/session";
  const title = mode === "orders" ? "دخول متابعة الطلبات" : "دخول لوحة الأدمن";
  const description = mode === "orders"
    ? "اكتب كلمة المرور الخاصة بمتابعة الطلبات."
    : "اكتب كلمة السر لمتابعة إدارة المطعم.";
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(authEndpoint, { cache: "no-store" })
      .then(async (response) => ({ response, data: await response.json() }))
      .then(({ data }) => {
        if (active) {
          setAuthenticated(Boolean(data.authenticated));
          if (!data.configured) setError(mode === "orders"
            ? "أضف ORDERS_ADMIN_PASSWORD إلى إعدادات الخادم لتفعيل دخول متابعة الطلبات."
            : "أضف ADMIN_PASSWORD إلى إعدادات الخادم لتفعيل الدخول.");
        }
      })
      .catch(() => {
        if (active) setError("تعذر الاتصال بالخادم. أعد تحميل الصفحة وحاول مرة أخرى.");
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => { active = false; };
  }, [authEndpoint, mode]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(mode === "orders" ? "/api/admin/orders-auth" : "/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "تعذر تسجيل الدخول");
      setAuthenticated(true);
      setPassword("");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "تعذر تسجيل الدخول");
    } finally {
      setBusy(false);
    }
  };

  if (checking) {
    return <div className="flex min-h-screen items-center justify-center bg-[#1a0e0a] text-white/70">جارٍ التحقق من الدخول...</div>;
  }

  if (authenticated) return <>{children}</>;

  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1a0e0a] via-[#2e1a12] to-black p-4">
      <form onSubmit={handleLogin} className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-2xl backdrop-blur sm:p-8">
        <div className="mb-5 text-center text-5xl">🔐</div>
        <h1 className="text-center text-2xl font-bold">{title}</h1>
        <p className="mb-6 mt-2 text-center text-sm text-white/55">{description}</p>
        <label htmlFor="admin-password" className="mb-2 block text-sm font-semibold text-white/80">كلمة السر</label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          className="w-full rounded-xl border border-white/15 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-yellow-400"
          dir="ltr"
        />
        {error && <p role="alert" className="mt-3 text-sm font-semibold text-red-300">{error}</p>}
        <button disabled={busy} className="mt-5 w-full rounded-xl bg-yellow-400 px-4 py-3 font-bold text-[#23150e] transition hover:bg-yellow-300 disabled:opacity-60">
          {busy ? "جارٍ الدخول..." : "دخول"}
        </button>
      </form>
    </main>
  );
}
