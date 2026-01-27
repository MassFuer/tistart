const nodemailer = require("nodemailer");
const { renderTemplate } = require("./emailRenderer");

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
    const html = renderTemplate("verification", {
      firstName,
      verificationLink,
    });

    const info = await transporter.sendMail({
      from: `"Nemesis" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify Your Email Address - Nemesis",
      html,
    });

    console.log(`Verification email sent to ${email}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("Nodemailer error:", error);
    throw error;
  }
};

const sendWelcomeEmail = async (email, firstName) => {
  try {
    const html = renderTemplate("welcome", {
      firstName,
    });

    const info = await transporter.sendMail({
      from: `"Nemesis" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Welcome to Nemesis!",
      html,
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
    const html = renderTemplate("order-confirmation", {
      firstName,
      order,
    });

    const info = await transporter.sendMail({
      from: `"Nemesis" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Order Confirmation #${order._id.toString().slice(-6).toUpperCase()} - Nemesis`,
      html,
    });

    console.log(`Order confirmation email sent to ${email}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("Nodemailer error:", error);
    // Don't throw to prevent blocking checkout if email fails
  }
};

const sendArtistApplicationEmail = async (email, firstName) => {
  try {
    const html = renderTemplate("artist-application", {
        firstName,
    });

    const info = await transporter.sendMail({
      from: `"Nemesis" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Application Received - Nemesis",
      html,
    });

    console.log(`Artist application email sent to ${email}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("Nodemailer error:", error);
    // Don't throw for non-critical email
  }
};

const sendPasswordResetEmail = async (email, firstName, resetLink) => {
  try {
    const html = renderTemplate("password-reset", {
        firstName,
        resetLink,
    });

    const info = await transporter.sendMail({
      from: `"Nemesis" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Reset Your Password - Nemesis",
      html,
    });

    console.log(`Password reset email sent to ${email}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("Nodemailer error:", error);
    throw error;
  }
};

module.exports = { 
  sendVerificationEmail, 
  sendWelcomeEmail, 
  sendOrderConfirmationEmail, 
  sendArtistApplicationEmail,
  sendPasswordResetEmail
};