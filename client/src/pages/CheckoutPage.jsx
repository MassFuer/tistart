import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import api, { paymentsAPI } from "../services/api";
import toast from "react-hot-toast";
import Loading from "../components/common/Loading";
import PaymentForm from "../components/payment/PaymentForm";
import {
  FaCcVisa,
  FaCcMastercard,
  FaCcAmex,
  FaPaypal,
  FaApplePay,
  FaLock,
} from "react-icons/fa";
import "./CheckoutPage.css";

// Load Stripe outside of component to avoid recreating on every render
const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

const CheckoutPage = () => {
  const { cart, fetchCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("shipping"); // "shipping" | "payment"
  const [orderId, setOrderId] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);

  const [shippingAddress, setShippingAddress] = useState({
    street: "",
    streetNum: "",
    city: "",
    zipCode: "",
    country: "",
  });

  useEffect(() => {
    // Pre-fill shipping address from user profile if available
    if (user) {
      // Check if user has address in artistInfo (for artists) or direct address field
      const address = user.artistInfo?.address || user.address;
      if (address && typeof address === "object") {
        setShippingAddress({
          street: address.street || "",
          streetNum: address.streetNum || "",
          city: address.city || "",
          zipCode: address.zipCode || "",
          country: address.country || "",
        });
      }
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({ ...prev, [name]: value }));
  };

  const totalPrice = cart.reduce(
    (total, item) => total + (item.artwork?.price || 0) * item.quantity,
    0,
  );

  // Debug logging
  console.log("Checkout debug:", {
    cartLength: cart.length,
    totalPrice,
    cartItems: cart.map((item) => ({
      title: item.artwork?.title,
      price: item.artwork?.price,
      quantity: item.quantity,
    })),
  });

  // Step 1: Create order and get PaymentIntent
  const handleShippingSubmit = async (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      toast.error("Cart is empty");
      navigate("/cart");
      return;
    }

    // Check if Stripe is configured
    if (!stripePromise) {
      // Fallback to mock payment if Stripe not configured
      await handleMockPayment();
      return;
    }

    setLoading(true);
    try {
      // Create order (pending status)
      const orderResponse = await api.orders.create({
        shippingAddress,
      });

      const newOrderId = orderResponse.data.data._id;
      setOrderId(newOrderId);

      // Don't refresh cart here - cart should remain until payment is successful
      // await fetchCart();

      // Create PaymentIntent
      const paymentResponse = await paymentsAPI.createIntent(newOrderId);
      setClientSecret(paymentResponse.data.data.clientSecret);

      setStep("payment");
    } catch (error) {
      console.error("Checkout error:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to create order";

      // If order was created but payment failed, still refresh cart
      if (error.response?.status === 402 || errorMessage.includes("payment")) {
        await fetchCart();
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fallback mock payment (when Stripe not configured)
  const handleMockPayment = async () => {
    setLoading(true);
    try {
      const orderResponse = await api.orders.create({
        shippingAddress,
        paymentId: "MOCK_PAYMENT_" + Date.now(),
      });

      const newOrderId = orderResponse.data.data._id;

      // Confirm payment and clear cart
      await api.orders.confirmPayment(newOrderId);

      toast.success("Order placed successfully! 🎉");
      await fetchCart();
      navigate("/my-orders");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  // Payment success handler
  const handlePaymentSuccess = async () => {
    try {
      // Confirm payment and clear cart on backend
      await api.orders.confirmPayment(orderId);

      toast.success("Payment successful! 🎉");
      await fetchCart(); // Refresh cart to show it's empty
      navigate(`/orders/${orderId}`);
    } catch (error) {
      console.error("Payment confirmation error:", error);
      toast.error(
        "Payment successful but failed to update order. Please contact support.",
      );
      // Still navigate to order page
      navigate(`/orders/${orderId}`);
    }
  };

  // Payment error handler
  const handlePaymentError = (error) => {
    toast.error(error.message || "Payment failed. Please try again.");
  };

  if (loading) return <Loading message="Processing..." />;

  // Stripe Elements appearance options
  const appearance = {
    theme:
      document.documentElement.getAttribute("data-theme") === "dark"
        ? "night"
        : "stripe",
    variables: {
      colorPrimary: "#3498db",
    },
  };

  const elementsOptions = {
    clientSecret,
    appearance,
  };

  return (
    <div className="checkout-page page-container">
      <h1>Checkout</h1>

      {/* Progress indicator */}
      <div className="checkout-progress">
        <div
          className={`progress-step ${step === "shipping" ? "active" : "completed"}`}
        >
          <span className="step-number">1</span>
          <span className="step-label">Shipping</span>
        </div>
        <div className="progress-line"></div>
        <div className={`progress-step ${step === "payment" ? "active" : ""}`}>
          <span className="step-number">2</span>
          <span className="step-label">Payment</span>
        </div>
      </div>

      <div className="checkout-container">
        {/* Shipping Step */}
        {step === "shipping" && (
          <form onSubmit={handleShippingSubmit} className="shipping-form">
            <h2>Shipping Address</h2>
            <div className="form-group">
              <label>Street</label>
              <input
                type="text"
                name="street"
                value={shippingAddress.street}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Number</label>
                <input
                  type="text"
                  name="streetNum"
                  value={shippingAddress.streetNum}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Zip Code</label>
                <input
                  type="text"
                  name="zipCode"
                  value={shippingAddress.zipCode}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  name="city"
                  value={shippingAddress.city}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Country</label>
                <input
                  type="text"
                  name="country"
                  value={shippingAddress.country}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block">
              Continue to Payment
            </button>
          </form>
        )}

        {/* Payment Step */}
        {step === "payment" && clientSecret && stripePromise && (
          <div className="payment-section">
            <h2>Payment Details</h2>
            <button
              className="btn-back"
              onClick={() => setStep("shipping")}
              type="button"
            >
              ← Back to Shipping
            </button>

            <Elements stripe={stripePromise} options={elementsOptions}>
              <PaymentForm
                orderId={orderId}
                totalAmount={totalPrice}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </Elements>
          </div>
        )}

        {/* Order Summary (always visible) */}
        <div className="order-summary">
          <h2>Order Summary</h2>
          <div className="summary-items">
            {cart.map((item) => (
              <div key={item._id} className="summary-item">
                <span>
                  {item.artwork?.title} (x{item.quantity})
                </span>
                <span>
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format((item.artwork?.price || 0) * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="summary-divider"></div>
          <div className="total-row">
            <span>Total</span>
            <span className="total-amount">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(totalPrice)}
            </span>
          </div>

          <div className="payment-methods">
            <p className="payment-methods-label">Accepted Payment Methods</p>
            <div className="card-logos">
              <FaCcVisa className="card-icon visa" title="Visa" />
              <FaCcMastercard
                className="card-icon mastercard"
                title="Mastercard"
              />
              <FaCcAmex className="card-icon amex" title="American Express" />
              <FaPaypal className="card-icon paypal" title="PayPal" />
              <FaApplePay className="card-icon applepay" title="Apple Pay" />
            </div>
            <p className="secure-payment">
              <FaLock className="lock-icon" />
              Secure payment powered by Stripe
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
