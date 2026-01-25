const router = require("express").Router();
const express = require("express");
const Order = require("../models/Order.model");

// Initialize Stripe (handle missing key gracefully)
const stripe = process.env.STRIPE_SECRET_KEY
  ? require("stripe")(process.env.STRIPE_SECRET_KEY)
  : null;

// Stripe Webhook handler
// POST /api/payments/webhook
// Uses raw body for signature verification
router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    if (!stripe) {
      console.error("Stripe not configured - missing STRIPE_SECRET_KEY");
      return res.status(500).json({ error: "Stripe not configured" });
    }

    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("Missing STRIPE_WEBHOOK_SECRET");
      return res.status(500).json({ error: "Webhook secret not configured" });
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        console.log("PaymentIntent succeeded:", paymentIntent.id);

        // Update order status
        const orderId = paymentIntent.metadata.orderId;
        if (orderId) {
          try {
            const order = await Order.findById(orderId);
            if (order && order.status === "pending") {
              order.status = "paid";
              await order.save();
              console.log(`Order ${orderId} marked as paid`);
            }
          } catch (dbError) {
            console.error("Error updating order:", dbError);
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        console.log("PaymentIntent failed:", paymentIntent.id);
        const orderId = paymentIntent.metadata.orderId;
        if (orderId) {
          console.log(`Payment failed for order ${orderId}`);
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        console.log("Charge refunded:", charge.id);

        // Find order by payment intent ID
        const paymentIntentId = charge.payment_intent;
        if (paymentIntentId) {
          try {
            const order = await Order.findOne({ paymentId: paymentIntentId });
            if (order) {
              order.status = "cancelled";
              order.refundedAt = new Date();
              order.refundReason = "Refunded via Stripe";
              await order.save();
              console.log(`Order ${order._id} marked as cancelled (refunded)`);
            }
          } catch (dbError) {
            console.error("Error updating order for refund:", dbError);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true });
  }
);

module.exports = router;