import { useState } from "react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Plus, Minus, Trash2, Loader2 } from "lucide-react";

const AddToCartButton = ({ artwork, className = "", compact = false }) => {
  const { cart, addToCart, updateQuantity, removeFromCart, loading: cartLoading } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  // Find if this artwork is already in cart
  const cartItem = cart.find(
    (item) => item.artwork?._id === artwork._id || item.artwork === artwork._id
  );
  const quantityInCart = cartItem?.quantity || 0;

  // Don't show button if artwork is not for sale or out of stock
  if (!artwork.isForSale || artwork.totalInStock <= 0) {
    return (
      <Button
        disabled
        variant="secondary"
        className={`w-full opacity-50 cursor-not-allowed ${className}`}
      >
        Sold Out
      </Button>
    );
  }

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast("Interested by this artwork?", {
        action: {
          label: "Log in here",
          onClick: () => navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`),
        },
      });
      return;
    }

    setLoading(true);
    try {
      await addToCart(artwork._id);
    } finally {
      setLoading(false);
    }
  };

  const handleIncrement = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (quantityInCart >= artwork.totalInStock) {
      toast.error("Maximum stock reached");
      return;
    }

    setLoading(true);
    try {
      await updateQuantity(artwork._id, quantityInCart + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleDecrement = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    setLoading(true);
    try {
      if (quantityInCart <= 1) {
        await removeFromCart(artwork._id);
      } else {
        await updateQuantity(artwork._id, quantityInCart - 1);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    setLoading(true);
    try {
      await removeFromCart(artwork._id);
    } finally {
      setLoading(false);
    }
  };

  const isLoading = loading || cartLoading;

  // If item is in cart, show quantity controls
  if (quantityInCart > 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center border rounded-md">
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-none rounded-l-md" 
                onClick={handleDecrement}
                disabled={isLoading}
            >
                <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center font-medium text-xs">
                {isLoading ? <Loader2 className="h-3 w-3 animate-spin mx-auto"/> : quantityInCart}
            </span>
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-none rounded-r-md" 
                onClick={handleIncrement}
                disabled={isLoading || quantityInCart >= artwork.totalInStock}
            >
                <Plus className="h-3 w-3" />
            </Button>
        </div>
        
        {!compact && (
            <Button 
                variant="destructive" 
                size="icon" 
                className="h-8 w-8"
                onClick={handleRemove}
                disabled={isLoading}
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        )}
      </div>
    );
  }

  // Default: Add to Cart button
  return (
    <Button
      onClick={handleAddToCart}
      disabled={isLoading}
      className={`w-full dark:bg-gray-200 dark:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-gray-200 ${className}`}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <ShoppingCart className="mr-1 h-4 w-4" />
      )}
      {isLoading ? "Adding..." : (
        <>
            <span className="md:hidden">Buy</span>
            <span className="hidden md:inline">Add to Cart</span>
        </>
      )}
    </Button>
  );
};

export default AddToCartButton;
