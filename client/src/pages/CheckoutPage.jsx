import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import api, { paymentsAPI } from "../services/api";
import { toast } from "sonner";
import Loading from "../components/common/Loading";
import PaymentForm from "../components/payment/PaymentForm";
import {
  MapPin,
  CreditCard,
  ArrowLeft,
} from "lucide-react";
import { 
  FaCcVisa, 
  FaCcMastercard, 
  FaCcAmex, 
  FaPaypal, 
  FaApplePay,
  FaLock 
} from "react-icons/fa";

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

  if (loading) return <Loading message="Processing order..." />;

  // Stripe Elements appearance options
  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#0f172a',
      colorBackground: '#ffffff',
      colorText: '#1e293b',
    },
  };

  const elementsOptions = {
    clientSecret,
    appearance,
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen max-w-6xl">
       <div className="flex items-center mb-8">
            <Button variant="ghost" className="pl-0 gap-2" onClick={() => step === "payment" ? setStep("shipping") : navigate("/cart")}>
                <ArrowLeft className="h-4 w-4" /> 
                {step === "payment" ? "Back to Shipping" : "Back to Cart"}
            </Button>
            <h1 className="text-3xl font-bold tracking-tight ml-4">Checkout</h1>
       </div>

       {/* Steps Indicator - Centered at top */}
        <div className="flex justify-center items-center space-x-4 mb-10">
            <div className={`flex items-center gap-2 ${step === "shipping" ? "text-primary font-bold" : "text-muted-foreground"}`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${step === "shipping" ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"}`}>
                    1
                </div>
                <span>Shipping</span>
            </div>
            <div className="w-24 h-[1px] bg-border"></div>
            <div className={`flex items-center gap-2 ${step === "payment" ? "text-primary font-bold" : "text-muted-foreground"}`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${step === "payment" ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"}`}>
                    2
                </div>
                <span>Payment</span>
            </div>
        </div>

       <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* MAIN FORM AREA */}
            <div className="flex-1 space-y-6">
                {step === "shipping" ? (
                   <Card>
                       <CardHeader>
                           <CardTitle className="flex items-center gap-2">
                               <MapPin className="h-5 w-5" /> Shipping Address
                           </CardTitle>
                           <CardDescription>
                               Where should we send your artwork?
                           </CardDescription>
                       </CardHeader>
                       <CardContent>
                           <form id="shipping-form" onSubmit={handleShippingSubmit} className="space-y-4">
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                   <div className="md:col-span-1">
                                       <Label htmlFor="streetNum">Street Number</Label>
                                       <Input 
                                            id="streetNum" 
                                            name="streetNum" 
                                            value={shippingAddress.streetNum} 
                                            onChange={handleChange} 
                                            placeholder="123"
                                            required
                                        />
                                   </div>
                                   <div className="md:col-span-2">
                                       <Label htmlFor="street">Street Name</Label>
                                       <Input 
                                            id="street" 
                                            name="street" 
                                            value={shippingAddress.street} 
                                            onChange={handleChange} 
                                            required 
                                            placeholder="Fuer Street"
                                        />
                                   </div>
                               </div>
                               
                               <div className="grid grid-cols-2 gap-4">
                                   <div className="grid gap-2">
                                       <Label htmlFor="city">City</Label>
                                       <Input 
                                            id="city" 
                                            name="city" 
                                            value={shippingAddress.city} 
                                            onChange={handleChange} 
                                            required 
                                            placeholder="Marseille"
                                        />
                                   </div>
                                    <div className="grid gap-2">
                                       <Label htmlFor="zipCode">Zip Code</Label>
                                       <Input 
                                            id="zipCode" 
                                            name="zipCode" 
                                            value={shippingAddress.zipCode} 
                                            onChange={handleChange} 
                                            required 
                                            placeholder="13000"
                                        />
                                   </div>
                               </div>
                               
                               <div className="grid gap-2">
                                   <Label htmlFor="country">Country</Label>
                                   <Input 
                                        id="country" 
                                        name="country" 
                                        value={shippingAddress.country} 
                                        onChange={handleChange} 
                                        required 
                                        placeholder="France"
                                    />
                               </div>
                           </form>
                       </CardContent>
                       <CardFooter>
                           <Button type="submit" form="shipping-form" className="w-full" size="lg">
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
                      {cart.map((item) => (
                           <div key={item._id} className="flex justify-between items-start text-sm">
                                <div>
                                    <p className="font-medium">{item.artwork?.title} <span className="text-muted-foreground">x{item.quantity}</span></p>
                                    <p className="text-xs text-muted-foreground truncate max-w-[150px]">{item.artwork?.artist?.artistInfo?.companyName || item.artwork?.artist?.lastName}</p>
                                </div>
                                <p className="font-medium">
                                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" }).format((item.artwork?.price || 0) * item.quantity)}
                                </p>
                           </div>
                      ))}
                      
                      <Separator />
                      
                      <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>{new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" }).format(totalPrice)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Shipping</span>
                          <span className="text-green-600 font-medium">Free</span>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex justify-between font-bold text-lg">
                          <span>Total</span>
                          <span>{new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" }).format(totalPrice)}</span>
                      </div>
                  </CardContent>
                  <CardFooter className="bg-muted/30 p-4 flex flex-col gap-4">
                       <div className="flex items-center gap-2 text-xs text-muted-foreground w-full justify-center">
                           <FaLock className="h-3 w-3" /> Secure 256-bit SSL Encrypted Payment
                       </div>
                       <div className="flex justify-center gap-3 opacity-60 grayscale hover:grayscale-0 transition-all">
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
