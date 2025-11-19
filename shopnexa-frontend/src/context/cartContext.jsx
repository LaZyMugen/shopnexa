/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { estimateDays } from "../data/retailers";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem("cart");
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.warn('cart read error', err);
      return [];
    }
  });

  useEffect(() => {
    try { localStorage.setItem("cart", JSON.stringify(items)); } catch (err) { console.warn('cart write error', err); }
  }, [items]);

  const addItem = (product, qty = 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((it) => it.id === product.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: Math.min((copy[idx].qty || 0) + qty, 999) };
        return copy;
      }
      // Derive deliveryDays using retailer distance if available
      const distance = Number(product?.retailer?.distance_km);
      const deliveryDays = isFinite(distance) ? estimateDays(distance) : undefined;
      return [...prev, {
        id: product.id,
        name: product.name,
        price: product.price,
        stock: product.stock,
        image_url: product.image_url,
        region: product.region, // persist origin region for checkout display
        retailer: product.retailer, // may include {id,name,shipping,distance_km}
        selectedLocation: product.selectedLocation || undefined,
        deliveryDays,
        qty
      }];
    });
  };

  const updateQty = (id, qty) => setItems((prev) => prev.map((it) => it.id === id ? { ...it, qty: Math.max(1, qty) } : it));
  const removeItem = (id) => setItems((prev) => prev.filter((it) => it.id !== id));
  const clearCart = () => setItems([]);

  const totals = useMemo(() => {
    const count = items.reduce((s, it) => s + (it.qty || 0), 0);
    const itemsAmount = items.reduce((s, it) => s + (Number(it.price || 0) * (it.qty || 0)), 0);
    const shippingAmount = items.reduce((s, it) => s + (Number(it.retailer?.shipping || 0) * (it.qty || 0)), 0);
    const grandTotal = itemsAmount + shippingAmount;
    return { count, itemsAmount, shippingAmount, grandTotal };
  }, [items]);

  const groups = useMemo(() => {
    const map = new Map();
    items.forEach((it) => {
      const key = it.retailer?.id || 'unassigned';
      if (!map.has(key)) {
        map.set(key, {
          key,
          retailer: it.retailer || null,
          items: [],
          itemsSubtotal: 0,
          shippingSubtotal: 0,
          total: 0,
          maxDeliveryDays: 0,
        });
      }
      const g = map.get(key);
      g.items.push(it);
      const itemSubtotal = Number(it.price || 0) * (it.qty || 0);
      const itemShipping = Number(it.retailer?.shipping || 0) * (it.qty || 0);
      g.itemsSubtotal += itemSubtotal;
      g.shippingSubtotal += itemShipping;
      g.total += itemSubtotal + itemShipping;
      if (isFinite(it.deliveryDays) && it.deliveryDays > g.maxDeliveryDays) g.maxDeliveryDays = it.deliveryDays;
    });
    return Array.from(map.values()).sort((a, b) => {
      // put unassigned last
      if (a.key === 'unassigned') return 1;
      if (b.key === 'unassigned') return -1;
      return (a.retailer?.name || '').localeCompare(b.retailer?.name || '');
    });
  }, [items]);

  return (
    <CartContext.Provider value={{ items, addItem, updateQty, removeItem, clearCart, totals, groups }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
