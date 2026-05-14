import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [cash, setCash] = useState('');

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('pos_cart');
    const savedPayment = localStorage.getItem('pos_payment');
    const savedCash = localStorage.getItem('pos_cash');

    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to load cart:', e);
      }
    }
    if (savedPayment) setPaymentMethod(savedPayment);
    if (savedCash) setCash(savedCash);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('pos_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('pos_payment', paymentMethod);
  }, [paymentMethod]);

  useEffect(() => {
    localStorage.setItem('pos_cash', cash);
  }, [cash]);

  const clearCart = () => {
    setCart([]);
    setPaymentMethod('Cash');
    setCash('');
    localStorage.removeItem('pos_cart');
    localStorage.removeItem('pos_payment');
    localStorage.removeItem('pos_cash');
  };

  const addToCart = (product) => {
    if (product.quantity <= 0) return;
    setCart(prev => {
      const exist = prev.find(i => i.id === product.id);
      if (exist) {
        if (exist.qty >= product.quantity) return prev;
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { id: product.id, name: product.name, price: product.sale_price, qty: 1, stock: product.quantity }];
    });
  };

  const updateQty = (id, delta, stock) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = i.qty + delta;
        return (newQty > 0 && newQty <= stock) ? { ...i, qty: newQty } : i;
      }
      return i;
    }));
  };

  /** Set absolute quantity (clamped 1..stock). */
  const setLineQty = (id, rawQty, stock) => {
    const max = Math.max(0, Number(stock) || 0);
    const n = Math.floor(Number(rawQty));
    if (!Number.isFinite(n) || n < 1) return;
    const clamped = Math.min(n, max);
    if (clamped < 1) return;
    setCart(prev => prev.map(i => (i.id === id ? { ...i, qty: clamped } : i)));
  };

  const removeItem = (id) => setCart(prev => prev.filter(i => i.id !== id));

  return (
    <CartContext.Provider value={{
      cart, setCart,
      addToCart, updateQty, setLineQty, removeItem, clearCart,
      paymentMethod, setPaymentMethod,
      cash, setCash
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);