import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import Loading from "../components/common/Loading";
import "./CartPage.css";

const CartPage = () => {
  const { cart, loading, removeFromCart, clearCart, updateQuantity, cartCount } = useCart();
  const navigate = useNavigate();

  const handleRemove = (id) => {
    removeFromCart(id);
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.artwork?.price || 0) * item.quantity, 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  if (loading) return <Loading />;

  return (
    <div className="cart-page">
      <div className="cart-header">
        <h1>Shopping Cart</h1>
        {cart.length > 0 && (
          <span className="cart-count">{cartCount} {cartCount === 1 ? "item" : "items"}</span>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="empty-cart">
          <div className="empty-cart-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
          </div>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added any artworks yet.</p>
          <Link to="/gallery" className="btn btn-primary">
            Browse Gallery
          </Link>
        </div>
      ) : (
        <div className="cart-content">
          <div className="cart-items-section">
            <div className="cart-items">
              {cart.map((item) => (
                <div key={item._id} className="cart-item">
                  <Link to={`/artworks/${item.artwork?._id}`} className="item-image">
                    {item.artwork?.images?.[0] ? (
                      <img src={item.artwork.images[0]} alt={item.artwork.title} />
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                  </Link>

                  <div className="item-info">
                    <div className="item-details">
                      <Link to={`/artworks/${item.artwork?._id}`} className="item-title">
                        {item.artwork?.title}
                      </Link>
                      <p className="item-artist">
                        by{" "}
                        <Link to={`/artists/${item.artwork?.artist?._id}`} className="artist-link">
                          {item.artwork?.artist?.artistInfo?.companyName ||
                            `${item.artwork?.artist?.firstName} ${item.artwork?.artist?.lastName}`}
                        </Link>
                      </p>
                    </div>

                    <div className="item-controls">
                      <div className="quantity-control">
                        <button
                          onClick={() => updateQuantity(item.artwork._id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="quantity-btn"
                          aria-label="Decrease quantity"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                          </svg>
                        </button>
                        <span className="quantity-value">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.artwork._id, item.quantity + 1)}
                          disabled={item.quantity >= item.artwork?.totalInStock}
                          className="quantity-btn"
                          aria-label="Increase quantity"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                          </svg>
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemove(item.artwork._id)}
                        className="remove-btn"
                        aria-label="Remove item"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>

                      <div className="item-pricing">
                        <span className="item-subtotal">
                          {formatCurrency((item.artwork?.price || 0) * item.quantity)}
                        </span>
                        {item.quantity > 1 && (
                          <span className="item-unit-price">
                            {formatCurrency(item.artwork?.price)} each
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={clearCart} className="clear-cart-btn">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              Clear Cart
            </button>
          </div>

          <div className="cart-sidebar">
            <div className="cart-summary">
              <h2>Order Summary</h2>

              <div className="summary-details">
                <div className="summary-row">
                  <span>Subtotal ({cartCount} {cartCount === 1 ? "item" : "items"})</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping</span>
                  <span className="free-shipping">Free</span>
                </div>
              </div>

              <div className="summary-total">
                <span>Total</span>
                <span>{formatCurrency(calculateTotal())}</span>
              </div>

              <button
                onClick={() => navigate("/checkout")}
                className="checkout-btn"
              >
                Proceed to Checkout
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>

            <div className="shipping-info">
              <div className="info-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13"></rect>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                  <circle cx="5.5" cy="18.5" r="2.5"></circle>
                  <circle cx="18.5" cy="18.5" r="2.5"></circle>
                </svg>
                <div>
                  <strong>Free Shipping</strong>
                  <span>On all orders</span>
                </div>
              </div>
              <div className="info-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                <div>
                  <strong>Secure Payment</strong>
                  <span>100% protected</span>
                </div>
              </div>
              <div className="info-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>
                <div>
                  <strong>Easy Returns</strong>
                  <span>30-day return policy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
