import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { FaLock, FaSpinner } from "react-icons/fa";
import "./PaymentForm.css";

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
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="payment-element-container">
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>

      {errorMessage && (
        <div className="payment-error">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="btn btn-primary pay-button"
      >
        {isProcessing ? (
          <>
            <FaSpinner className="spinner" /> Processing...
          </>
        ) : (
          <>
            <FaLock /> Pay ${totalAmount?.toFixed(2)}
          </>
        )}
      </button>

      <p className="payment-secure-notice">
        <FaLock /> Your payment is secured by Stripe
      </p>
    </form>
  );
};

export default PaymentForm;