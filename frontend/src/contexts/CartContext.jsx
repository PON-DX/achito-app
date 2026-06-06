import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const { user } = useAuth();

  const fetchCart = async () => {
    if (!user) { setItems([]); return; }
    try {
      const res = await axios.get('/api/cart');
      setItems(res.data);
    } catch {
      setItems([]);
    }
  };

  useEffect(() => { fetchCart(); }, [user]);

  const addToCart = async (amuletId, quantity = 1) => {
    const res = await axios.post('/api/cart', { amulet_id: amuletId, quantity });
    setItems(res.data);
  };

  const removeFromCart = async (cartItemId) => {
    await axios.delete(`/api/cart/${cartItemId}`);
    setItems(prev => prev.filter(i => i.id !== cartItemId));
  };

  const updateQuantity = async (cartItemId, quantity) => {
    await axios.put(`/api/cart/${cartItemId}`, { quantity });
    setItems(prev => prev.map(i => i.id === cartItemId ? { ...i, quantity } : i));
  };

  const clearCart = () => setItems([]);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, count, total, addToCart, removeFromCart, updateQuantity, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
