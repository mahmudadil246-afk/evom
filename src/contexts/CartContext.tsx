import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAbandonedCartTracking } from '@/hooks/useAbandonedCartTracking';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  comparePrice?: number;
  image: string;
  quantity: number;
  size?: string;
  color?: string;
  note?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (id: string, size?: string, color?: string) => void;
  updateQuantity: (id: string, quantity: number, size?: string, color?: string) => void;
  updateItemNote: (id: string, note: string, size?: string, color?: string) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  markCartRecovered: (orderId?: string) => Promise<void>;
  // Selective checkout
  selectedKeys: Set<string>;
  toggleSelected: (key: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  selectedItems: CartItem[];
  selectedSubtotal: number;
  selectedCount: number;
  removeSelectedItems: () => void;
  // Save for later
  savedItems: CartItem[];
  saveForLater: (id: string, size?: string, color?: string) => void;
  moveToCart: (id: string, size?: string, color?: string) => void;
  removeSavedItem: (id: string, size?: string, color?: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'store-cart';
const SAVED_STORAGE_KEY = 'store-saved';

const getItemKey = (item: { id: string; size?: string; color?: string }) => `${item.id}-${item.size || ''}-${item.color || ''}`;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [savedItems, setSavedItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);

  // Auto-select new items added to cart
  const selectedItems = items.filter(item => selectedKeys.has(getItemKey(item)));
  const selectedSubtotal = selectedItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const selectedCount = selectedItems.reduce((total, item) => total + item.quantity, 0);

  const toggleSelected = (key: string) => {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };
  const selectAll = () => setSelectedKeys(new Set(items.map(getItemKey)));
  const deselectAll = () => setSelectedKeys(new Set());
  const removeSelectedItems = () => {
    setItems(current => current.filter(item => !selectedKeys.has(getItemKey(item))));
    setSelectedKeys(new Set());
  };

  // Abandoned cart tracking
  const { markAsRecovered, clearCartSession } = useAbandonedCartTracking({
    items,
    subtotal,
    enabled: true,
  });

  // Load cart from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      try { setItems(JSON.parse(stored)); } catch (e) { console.error('Failed to parse cart'); }
    }
    const savedStored = localStorage.getItem(SAVED_STORAGE_KEY);
    if (savedStored) {
      try { setSavedItems(JSON.parse(savedStored)); } catch (e) { console.error('Failed to parse saved items'); }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items)); }, [items]);
  useEffect(() => { localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(savedItems)); }, [savedItems]);

  const addItem = (newItem: Omit<CartItem, 'quantity'>, quantity = 1) => {
    const key = getItemKey(newItem);
    setItems(current => {
      const existingIndex = current.findIndex(
        item => item.id === newItem.id && item.size === newItem.size && item.color === newItem.color
      );
      if (existingIndex >= 0) {
        const updated = [...current];
        updated[existingIndex] = { ...updated[existingIndex], quantity: updated[existingIndex].quantity + quantity };
        return updated;
      }
      return [...current, { ...newItem, quantity }];
    });
    // Auto-select newly added items
    setSelectedKeys(prev => new Set([...prev, key]));
    setIsOpen(true);
  };

  const removeItem = (id: string, size?: string, color?: string) => {
    setItems(current => current.filter(item => !(item.id === id && item.size === size && item.color === color)));
  };

  const updateQuantity = (id: string, quantity: number, size?: string, color?: string) => {
    if (quantity <= 0) { removeItem(id, size, color); return; }
    setItems(current =>
      current.map(item =>
        item.id === id && item.size === size && item.color === color ? { ...item, quantity } : item
      )
    );
  };

  const updateItemNote = (id: string, note: string, size?: string, color?: string) => {
    setItems(current =>
      current.map(item =>
        item.id === id && item.size === size && item.color === color ? { ...item, note } : item
      )
    );
  };

  const clearCart = () => { setItems([]); clearCartSession(); };

  const markCartRecovered = async (orderId?: string) => { await markAsRecovered(orderId); };

  // Save for later
  const saveForLater = (id: string, size?: string, color?: string) => {
    const item = items.find(i => i.id === id && i.size === size && i.color === color);
    if (item) {
      setSavedItems(current => [...current, item]);
      removeItem(id, size, color);
    }
  };

  const moveToCart = (id: string, size?: string, color?: string) => {
    const item = savedItems.find(i => i.id === id && i.size === size && i.color === color);
    if (item) {
      addItem({ id: item.id, name: item.name, price: item.price, comparePrice: item.comparePrice, image: item.image, size: item.size, color: item.color }, item.quantity);
      setSavedItems(current => current.filter(i => !(i.id === id && i.size === size && i.color === color)));
    }
  };

  const removeSavedItem = (id: string, size?: string, color?: string) => {
    setSavedItems(current => current.filter(i => !(i.id === id && i.size === size && i.color === color)));
  };

  // Auto-select all items on initial load
  useEffect(() => {
    if (items.length > 0 && selectedKeys.size === 0) {
      setSelectedKeys(new Set(items.map(getItemKey)));
    }
  }, [items.length]);

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQuantity, updateItemNote, clearCart,
      itemCount, subtotal, isOpen, setIsOpen, markCartRecovered,
      selectedKeys, toggleSelected, selectAll, deselectAll,
      selectedItems, selectedSubtotal, selectedCount, removeSelectedItems,
      savedItems, saveForLater, moveToCart, removeSavedItem,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
