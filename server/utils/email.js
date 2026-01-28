const { Resend } = require("resend");
const { renderTemplate } = require("./emailRenderer");

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || "onboarding@resend.dev";
const FROM_NAME = "Nemesis";

/**
 * Core email sending function with error handling
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @returns {Promise<Object>} Resend response
 */
const sendEmail = async ({ to, subject, html }) => {
  // Always log for debugging
  console.log(`[EMAIL] Sending "${subject}" to ${to}`);

  if (!process.env.RESEND_API_KEY) {
    console.warn("[EMAIL] RESEND_API_KEY not set - email not sent");
    console.log(`[EMAIL-DEBUG] Subject: ${subject}`);
    console.log(`[EMAIL-DEBUG] To: ${to}`);
    return { id: "mock-id", skipped: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error("[EMAIL] Resend error:", error);
      throw new Error(error.message);
    }

    console.log(`[EMAIL] Sent successfully: ${data.id}`);
    return data;
  } catch (error) {
    console.error("[EMAIL] Failed:", error.message);
    throw error;
  }
};

// === Email Functions ===

const sendVerificationEmail = async (email, firstName, verificationLink) => {
  // Extra logging for verification emails (critical flow)
  console.log("\n========================================");
  console.log(`[EMAIL-DEBUG] Sending verification to: ${email}`);
  console.log(`[EMAIL-DEBUG] Link: ${verificationLink}`);
  console.log("========================================\n");

  const html = renderTemplate("verification", {
    firstName,
    verificationLink,
  });

  return sendEmail({
    to: email,
    subject: "Verify Your Email Address - Nemesis",
    html,
  });
};

const sendWelcomeEmail = async (email, firstName) => {
  const html = renderTemplate("welcome", {
    firstName,
  });

  return sendEmail({
    to: email,
    subject: "Welcome to Nemesis!",
    html,
  });
};

const sendOrderConfirmationEmail = async (email, firstName, order) => {
  try {
    const html = renderTemplate("order-confirmation", {
      firstName,
      order,
    });

    return await sendEmail({
      to: email,
      subject: `Order Confirmation #${order._id.toString().slice(-6).toUpperCase()} - Nemesis`,
      html,
    });
  } catch (error) {
    console.error("Order confirmation email error:", error);
    // Don't throw to prevent blocking checkout if email fails
  }
};

const sendArtistApplicationEmail = async (email, firstName) => {
  try {
    const html = renderTemplate("artist-application", {
      firstName,
    });

    return await sendEmail({
      to: email,
      subject: "Application Received - Nemesis",
      html,
    });
  } catch (error) {
    console.error("Artist application email error:", error);
    // Don't throw for non-critical email
  }
};

const sendPasswordResetEmail = async (email, firstName, resetLink) => {
  const html = renderTemplate("password-reset", {
    firstName,
    resetLink,
  });

  return sendEmail({
    to: email,
    subject: "Reset Your Password - Nemesis",
    html,
  });
};

// === NEW: Artist Status Notification ===

const sendArtistStatusEmail = async (email, firstName, status, reason = null) => {
  try {
    const html = renderTemplate("artist-status", {
      firstName,
      status,
      reason,
    });

    const subjects = {
      verified: "Congratulations! Your Artist Application is Approved - Nemesis",
      suspended: "Account Status Update - Nemesis",
      pending: "Application Under Review - Nemesis",
      incomplete: "Complete Your Artist Application - Nemesis",
    };

    return await sendEmail({
      to: email,
      subject: subjects[status] || "Artist Status Update - Nemesis",
      html,
    });
  } catch (error) {
    console.error("Artist status email error:", error);
    // Don't throw - status update should still succeed
  }
};

module.exports = {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendArtistApplicationEmail,
  sendPasswordResetEmail,
  sendArtistStatusEmail,
};