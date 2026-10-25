"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

// ===== أنواع البيانات =====
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  categoryName?: string;
  categoryIcon?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  total: number;
  count: number;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}

// ===== Context =====
const CartContext = createContext<CartContextType | null>(null);
const CART_KEY = "abu-habiba-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // تحميل السلة من localStorage
  useEffect(() => {
    const loadCart = () => {
      try {
        const stored = localStorage.getItem(CART_KEY);
        if (stored) setItems(JSON.parse(stored));
      } catch {}
    };

    loadCart();
  }, []);

  const persist = (newItems: CartItem[]) => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(newItems));
    } catch {}
    setItems(newItems);
  };

  const addItem = useCallback((item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      const updated = exists
        ? prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))
        : [...prev, { ...item, quantity: 1 }];
      try { localStorage.setItem(CART_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      try { localStorage.setItem(CART_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const updateQuantity = useCallback((id: string, qty: number) => {
    if (qty <= 0) { removeItem(id); return; }
    setItems((prev) => {
      const updated = prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i));
      try { localStorage.setItem(CART_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, [removeItem]);

  const clearCart = useCallback(() => {
    persist([]);
  }, []);

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, total, count, isOpen, setIsOpen }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
