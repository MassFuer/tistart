import { createContext, useState, useEffect, useContext } from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const fetchCart = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const response = await api.cart.get();
      setCart(response.data.data);
      calculateCount(response.data.data);
    } catch (error) {
      console.error("Failed to fetch cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCount = (cartItems) => {
    if (!Array.isArray(cartItems)) return;
    const count = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    setCartCount(count);
  };

  const addToCart = async (artworkId, quantity = 1) => {
    if (!isAuthenticated) {
      toast.error("Please login to add items to cart");
      return;
    }
    try {
      const response = await api.cart.add(artworkId, quantity);
      setCart(response.data.data);
      calculateCount(response.data.data);
      toast.success("Added to cart!");
    } catch (error) {
        // Error is handled by api interceptor mostly, but we can show specific ones
        const msg = error.response?.data?.error || "Failed to add to cart";
        toast.error(msg);
    }
  };

  const updateQuantity = async (artworkId, quantity) => {
    try {
      const response = await api.cart.update(artworkId, quantity);
      setCart(response.data.data);
      calculateCount(response.data.data);
    } catch (error) {
       const msg = error.response?.data?.error || "Failed to update quantity";
       toast.error(msg);
    }
  };

  const removeFromCart = async (artworkId) => {
    try {
      const response = await api.cart.remove(artworkId);
      setCart(response.data.data);
      calculateCount(response.data.data);
      toast.success("Removed from cart");
    } catch (error) {
      console.error("Failed to remove item:", error);
      toast.error("Failed to remove item");
    }
  };

  const clearCart = async () => {
    try {
      await api.cart.clear();
      setCart([]);
      setCartCount(0);
    } catch (error) {
      console.error("Failed to clear cart:", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      setCart([]);
      setCartCount(0);
    }
  }, [isAuthenticated]);

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        cartCount,
        fetchCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
