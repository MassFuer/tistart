import { useState } from "react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "./AddToCartButton.css";

const AddToCartButton = ({ artwork, className = "", compact = false }) => {
  const { cart, addToCart, updateQuantity, removeFromCart, loading: cartLoading } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Find if this artwork is already in cart
  const cartItem = cart.find(
    (item) => item.artwork?._id === artwork._id || item.artwork === artwork._id
  );
  const quantityInCart = cartItem?.quantity || 0;

  // Don't show button if artwork is not for sale or out of stock
  if (!artwork.isForSale || artwork.totalInStock <= 0) {
    return (
      <button
        disabled
        className={`add-to-cart-btn sold-out ${compact ? "compact" : ""} ${className}`}
      >
        Sold Out
      </button>
    );
  }

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error("Please login to buy artworks");
      navigate("/login");
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

  // If item is in cart, show quantity controls
  if (quantityInCart > 0) {
    return (
      <div className={`quantity-controls-wrapper ${compact ? "compact" : ""} ${className}`}>
        <div className="quantity-controls">
          <button
            onClick={handleDecrement}
            disabled={loading || cartLoading}
            className="quantity-btn minus"
            aria-label="Decrease quantity"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <span className="quantity-display">{quantityInCart}</span>
          <button
            onClick={handleIncrement}
            disabled={loading || cartLoading || quantityInCart >= artwork.totalInStock}
            className="quantity-btn plus"
            aria-label="Increase quantity"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>
        <button
          onClick={handleRemove}
          disabled={loading || cartLoading}
          className="quantity-trash-btn"
          aria-label="Remove from cart"
        >
          {loading ? (
            <span className="spinner-small"></span>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          )}
        </button>
      </div>
    );
  }

  // Default: Add to Cart button
  return (
    <button
      onClick={handleAddToCart}
      disabled={loading || cartLoading}
      className={`add-to-cart-btn ${compact ? "compact" : ""} ${className}`}
    >
      {loading ? (
        <span className="spinner"></span>
      ) : (
        <>
          <svg
            className="cart-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          Add to Cart
        </>
      )}
    </button>
  );
};

export default AddToCartButton;
