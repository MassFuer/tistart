import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Lock, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const PaymentForm = ({ orderId, totalAmount, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/orders/${orderId}`,
        },
        redirect: "if_required",
      });

      if (error) {
        // Show error to customer
        setErrorMessage(error.message);
        if (onError) onError(error);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // Payment succeeded
        if (onSuccess) onSuccess(paymentIntent);
      } else if (paymentIntent && paymentIntent.status === "processing") {
        // Payment is processing
        setErrorMessage("Payment is processing. You will be notified when complete.");
      } else {
        // Handle other statuses
        setErrorMessage("Something went wrong. Please try again.");
      }
    } catch (err) {
      console.error("Payment error:", err);
      setErrorMessage("An unexpected error occurred. Please try again.");
      if (onError) onError(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-background border rounded-lg p-4">
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>

      {errorMessage && (
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="pt-2">
          <Button 
            type="submit" 
            disabled={!stripe || isProcessing} 
            className="w-full" 
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing Payment...
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" /> Pay {new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" }).format(totalAmount)}
              </>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1">
            <Lock className="h-3 w-3" /> Your payment is secured by Stripe
          </p>
      </div>
    </form>
  );
};

export default PaymentForm;