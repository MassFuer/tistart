import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import api, { paymentsAPI } from "../services/api";
import { toast } from "sonner";
import Loading from "../components/common/Loading";
import PaymentForm from "../components/payment/PaymentForm";
import AddressForm from "../components/map/AddressForm";
import LocationMap from "../components/map/LocationMap";
import { MapPin, CreditCard, ArrowLeft } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import {
  FaCcVisa,
  FaCcMastercard,
  FaCcAmex,
  FaPaypal,
  FaApplePay,
  FaLock,
  FaStripe,
} from "react-icons/fa";

import { formatPrice } from "@/lib/formatters";

// Shadcn Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Load Stripe outside of component to avoid recreating on every render
const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

const CheckoutPage = () => {
  const { cart, fetchCart } = useCart();
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("shipping"); // "shipping" | "payment"
  const [orderId, setOrderId] = useState(searchParams.get("orderId"));
  const [existingOrder, setExistingOrder] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);

  const [shippingAddress, setShippingAddress] = useState({
    street: "",
    streetNum: "",
    city: "",
    zipCode: "",
    country: "",
  });

  // Fetch Existing Order if ID present
  useEffect(() => {
    const fetchOrder = async () => {
      if (orderId) {
        try {
          setLoading(true);
          const res = await api.orders.getOne(orderId);
          const order = res.data.data;
          setExistingOrder(order);
          // Pre-fill address if order has one and it's valid
          if (order.shippingAddress && order.shippingAddress.street) {
            setShippingAddress(order.shippingAddress);
          }
        } catch (err) {
          console.error("Failed to load order:", err);
          toast.error("Failed to load order details");
        } finally {
          setLoading(false);
        }
      }
    };

    // Only fetch if we haven't already loaded it (or if ID changed)
    if (orderId && !existingOrder) {
      fetchOrder();
    }
  }, [orderId]);

  useEffect(() => {
    // Pre-fill shipping address from user profile if available, AND if not already filled from existing order
    if (user && !existingOrder?.shippingAddress?.street) {
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
  }, [user, existingOrder]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({ ...prev, [name]: value }));
  };

  // Determine items and total to display
  // If existingOrder, use its items. If not, use cart.
  const displayItems = existingOrder ? existingOrder.items : cart;

  const totalPrice = existingOrder
    ? existingOrder.totalAmount
    : cart.reduce((total, item) => {
        const product = item.itemType === "ticket" ? item.event : item.artwork;
        return total + (product?.price || 0) * item.quantity;
      }, 0);

  // Step 1: Create order OR Update address, then get PaymentIntent
  const handleShippingSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!existingOrder && cart.length === 0) {
      toast.error("Cart is empty");
      navigate("/cart");
      return;
    }

    // Address validation
    if (
      !shippingAddress.street ||
      !shippingAddress.city ||
      !shippingAddress.zipCode ||
      !shippingAddress.country
    ) {
      toast.error("Please complete the shipping address.");
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
      let activeOrderId = orderId;

      if (existingOrder) {
        // UPDATE existing order address logic
        // Make sure we have the ID
        if (!activeOrderId) throw new Error("Order ID missing for update");
        await api.orders.updateAddress(activeOrderId, shippingAddress);
      } else {
        // CREATE new order
        const orderResponse = await api.orders.create({
          shippingAddress,
        });
        activeOrderId = orderResponse.data.data._id;
        setOrderId(activeOrderId);
      }

      // Create PaymentIntent
      const paymentResponse = await paymentsAPI.createIntent(activeOrderId);
      setClientSecret(paymentResponse.data.data.clientSecret);

      setStep("payment");
    } catch (error) {
      console.error("Checkout error:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to process checkout";

      // If order was created/updated but payment failed, still refresh
      if (error.response?.status === 402 || errorMessage.includes("payment")) {
        if (!existingOrder) await fetchCart();
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
      let activeOrderId = orderId;

      if (existingOrder) {
        // Update address first
        await api.orders.updateAddress(activeOrderId, shippingAddress);
      } else {
        const orderResponse = await api.orders.create({
          shippingAddress,
          paymentId: "MOCK_PAYMENT_" + Date.now(),
        });
        activeOrderId = orderResponse.data.data._id;
      }

      // Confirm payment and clear cart
      await api.orders.confirmPayment(activeOrderId);

      toast.success("Order placed successfully! 🎉");
      if (!existingOrder) await fetchCart();
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
      if (!existingOrder) await fetchCart(); // Refresh cart only if it was a cart order
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

  if (loading && !existingOrder && !cart.length)
    return <Loading message="Loading checkout..." />;

  // Stripe Elements appearance options
  const appearance = {
    theme: isDarkMode ? "night" : "stripe",
    variables: {
      colorPrimary: isDarkMode ? "#f8fafc" : "#0f172a",
      colorBackground: isDarkMode ? "#020817" : "#ffffff",
      colorText: isDarkMode ? "#f8fafc" : "#1e293b",
    },
  };

  const elementsOptions = {
    clientSecret,
    appearance,
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen max-w-6xl">
      <div className="flex items-center mb-8">
        <Button
          variant="ghost"
          className="pl-0 gap-2"
          onClick={() =>
            step === "payment" ? setStep("shipping") : navigate("/cart")
          }
        >
          <ArrowLeft className="h-4 w-4" />
          {step === "payment" ? "Back to Address" : "Back to Cart"}
        </Button>
        <h1 className="text-3xl font-bold tracking-tight ml-4">
          Checkout {existingOrder ? "(Pending Order)" : ""}
        </h1>
      </div>

      {/* Steps Indicator - Centered at top */}
      <div className="flex justify-center items-center space-x-4 mb-10">
        <div
          className={`flex items-center gap-2 ${step === "shipping" ? "text-primary font-bold" : "text-muted-foreground"}`}
        >
          <div
            className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${step === "shipping" ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"}`}
          >
            1
          </div>
          <span>Shipping</span>
        </div>
        <div className="w-24 h-[1px] bg-border"></div>
        <div
          className={`flex items-center gap-2 ${step === "payment" ? "text-primary font-bold" : "text-muted-foreground"}`}
        >
          <div
            className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${step === "payment" ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"}`}
          >
            2
          </div>
          <span>Payment</span>
        </div>
      </div>

      <div
        className={
          step === "shipping"
            ? "flex flex-col-reverse gap-8 w-full"
            : "flex flex-col-reverse lg:flex-row gap-8 w-full lg:items-start"
        }
      >
        {/* MAIN FORM AREA */}
        <div className="flex-1 space-y-6">
          {step === "shipping" ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" /> Shipping Address
                </CardTitle>
                <CardDescription>
                  Enter your delivery address for shipping and billing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Address Form Column */}
                  <div className="space-y-6">
                    <AddressForm
                      address={shippingAddress}
                      onChange={(newAddress) =>
                        setShippingAddress((prev) => ({
                          ...prev,
                          ...newAddress,
                        }))
                      }
                      onGeocode={(location) => {
                        setShippingAddress((prev) => ({
                          ...prev,
                          country: location.address
                            ? location.address.split(",").pop().trim()
                            : prev.country,
                          coordinates: [location.lng, location.lat],
                        }));
                      }}
                      showVenue={false}
                    />
                  </div>

                  {/* Map Column */}
                  <div className="h-[400px] w-full rounded-md overflow-hidden border">
                    <LocationMap
                      coordinates={
                        shippingAddress.coordinates &&
                        shippingAddress.coordinates.length === 2
                          ? {
                              lat: shippingAddress.coordinates[1],
                              lng: shippingAddress.coordinates[0],
                            }
                          : null
                      }
                      interactive={true}
                      editable={true}
                      showSearch={true}
                      onLocationChange={(location) => {
                        setShippingAddress((prev) => ({
                          ...prev,
                          coordinates: [location.lng, location.lat],
                        }));
                        if (location.address) {
                          // Optional: try to populate address fields from map search result
                          // This is a rough approximation as we get a full string
                          // For now, updating coordinates is the primary goal
                        }
                      }}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleShippingSubmit}
                  className="w-full dark:bg-white dark:text-black dark:hover:bg-white/90"
                  size="lg"
                >
                  Continue to Payment
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" /> Payment Method
                </CardTitle>
                <CardDescription>
                  Secure checkout powered by Stripe
                </CardDescription>
              </CardHeader>
              <CardContent>
                {clientSecret && stripePromise && (
                  <Elements stripe={stripePromise} options={elementsOptions}>
                    <PaymentForm
                      orderId={orderId}
                      totalAmount={totalPrice}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                    />
                  </Elements>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* SIDEBAR SUMMARY */}
        <div className="w-full lg:w-96 space-y-6">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {displayItems.map((item) => {
                // Logic to unify item structure between Order items and Cart items
                // Order Item: { title, price, quantity, artwork, ... }
                // Cart Item: { quantity, artwork: { title, price ... } }

                let title, price, quantity, subtitle;

                if (existingOrder) {
                  // It's an Order Item
                  title = item.title;
                  price = item.price;
                  quantity = item.quantity;
                  subtitle = "Pending Order Item";
                } else {
                  // It's a Cart Item
                  const product =
                    item.itemType === "ticket" ? item.event : item.artwork;
                  if (!product) return null;
                  title = product.title;
                  price = product.price;
                  quantity = item.quantity;
                  subtitle =
                    product.artist?.artistInfo?.companyName ||
                    product.artist?.lastName;
                }

                return (
                  <div
                    key={item._id || Math.random()}
                    className="flex justify-between items-start text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {title}{" "}
                        <span className="text-muted-foreground">
                          x{quantity}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                        {subtitle}
                      </p>
                    </div>
                    <p className="font-medium">
                      {formatPrice((price || 0) * quantity)}
                    </p>
                  </div>
                );
              })}

              <Separator />

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>

              <Separator />

              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 p-4 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground w-full justify-center">
                <FaLock className="h-3 w-3" /> Secure 256-bit SSL Encrypted
                Payment
              </div>
              <div className="flex justify-center gap-3 opacity-60 grayscale hover:grayscale-0 transition-all">
                <FaStripe className="h-8 w-8 text-[#635BFF]" title="Stripe" />
                <FaCcVisa className="h-6 w-6" title="Visa" />
                <FaCcMastercard className="h-6 w-6" title="Mastercard" />
                <FaCcAmex className="h-6 w-6" title="American Express" />
                <FaPaypal className="h-6 w-6" title="PayPal" />
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
