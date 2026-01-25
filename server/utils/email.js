const nodemailer = require("nodemailer");

// Create a transporter using Gmail service
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async (email, firstName, verificationLink) => {
  try {
    const info = await transporter.sendMail({
      from: `"Nemesis Platform" <${process.env.EMAIL_USER}>`, // sender address
      to: email, // list of receivers
      subject: "Verify Your Email Address - Nemesis", // Subject line
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Nemesis, ${firstName}!</h2>
          <p style="color: #666; font-size: 16px;">Thank you for signing up. Please verify your email address to complete your registration and access your account.</p>
          
          <p style="margin: 30px 0;">
            <a href="${verificationLink}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Verify Email Address
            </a>
          </p>
          
          <p style="color: #999; font-size: 14px;">Or copy and paste this link in your browser:</p>
          <p style="color: #0066cc; word-break: break-all; font-size: 12px;">${verificationLink}</p>
          
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            This link will expire in 24 hours. If you didn't create this account, please ignore this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            © 2025 Nemesis. All rights reserved.
          </p>
        </div>
      `,
    });

    console.log(`Verification email sent to ${email}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("Nodemailer error:", error);
    // Don't throw error to prevent blocking execution if email fails, 
    // but in a real app you might want to handle this more gracefully
    throw error; 
  }
};

const sendWelcomeEmail = async (email, firstName) => {
  try {
    const info = await transporter.sendMail({
      from: `"Nemesis Platform" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Welcome to Nemesis!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome, ${firstName}!</h2>
          <p style="color: #666; font-size: 16px;">Your email has been verified. You can now start exploring amazing artworks and events.</p>
          
          <p style="margin: 30px 0;">
            <a href="${process.env.CLIENT_URL || "http://localhost:5173"}" 
               style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Go to Nemesis
            </a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            © 2025 Nemesis. All rights reserved.
          </p>
        </div>
      `,
    });

    console.log(`Welcome email sent to ${email}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("Nodemailer error:", error);
    throw error;
  }
};

const sendOrderConfirmationEmail = async (email, firstName, order) => {
  try {
    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.artwork?.title || 'Artwork'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">€${item.price.toFixed(2)}</td>
      </tr>
    `).join('');

    const shippingAddress = order.shippingAddress;
    const addressHtml = `
      ${shippingAddress.street} ${shippingAddress.streetNum}<br>
      ${shippingAddress.zipCode} ${shippingAddress.city}<br>
      ${shippingAddress.country}
    `;

    const info = await transporter.sendMail({
      from: `"Nemesis Platform" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Order Confirmation #${order._id.toString().slice(-6).toUpperCase()} - Nemesis`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Thank you for your order, ${firstName}!</h2>
          <p style="color: #666; font-size: 16px;">Your order has been confirmed and is being processed.</p>

          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Order ID:</strong> #${order._id.toString().slice(-6).toUpperCase()}</p>
            <p style="margin: 0;"><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
          </div>

          <h3 style="color: #333; margin-top: 30px;">Order Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f5f5f5;">
                <th style="padding: 10px; text-align: left;">Item</th>
                <th style="padding: 10px; text-align: center;">Qty</th>
                <th style="padding: 10px; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 15px 10px; text-align: right; font-weight: bold;">Total:</td>
                <td style="padding: 15px 10px; text-align: right; font-weight: bold; font-size: 18px;">€${order.totalAmount.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          <h3 style="color: #333; margin-top: 30px;">Shipping Address</h3>
          <p style="color: #666; line-height: 1.6;">
            ${addressHtml}
          </p>

          <p style="margin: 30px 0;">
            <a href="${process.env.CLIENT_URL || "http://localhost:5173"}/orders/${order._id}"
               style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              View Order
            </a>
          </p>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            © 2025 Nemesis. All rights reserved.
          </p>
        </div>
      `,
    });

    console.log(`Order confirmation email sent to ${email}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("Nodemailer error:", error);
    // Don't throw to prevent blocking checkout if email fails
  }
};

module.exports = { sendVerificationEmail, sendWelcomeEmail, sendOrderConfirmationEmail };
