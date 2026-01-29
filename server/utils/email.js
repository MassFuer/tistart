const { Resend } = require("resend");
const { renderTemplate } = require("./emailRenderer");
const { logSystemMessage } = require("./messaging");

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);
// ... (keep constants)
const FROM_EMAIL = process.env.EMAIL_FROM || "onboarding@resend.dev";
const FROM_NAME = "Nemesis";

// ... (keep sendEmail function)
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

const sendVerificationEmail = async (email, firstName, verificationLink, userId = null) => {
  const html = renderTemplate("verification", {
    firstName,
    verificationLink,
  });

  const result = await sendEmail({
    to: email,
    subject: "Verify Your Email Address - Nemesis",
    html,
  });

  if (userId) {
      await logSystemMessage(userId, "Verify Your Email Address", `Welcome ${firstName}! Please verify your email using this link: ${verificationLink}`);
  }
  return result;
};

const sendWelcomeEmail = async (email, firstName, userId = null) => {
  const html = renderTemplate("welcome", {
    firstName,
  });

  const result = await sendEmail({
    to: email,
    subject: "Welcome to Nemesis!",
    html,
  });

  if (userId) {
      await logSystemMessage(userId, "Welcome to Nemesis", "Welcome to the platform! We're excited to have you.");
  }
  return result;
};

const sendOrderConfirmationEmail = async (email, firstName, order, userId = null) => {
  try {
    const html = renderTemplate("order-confirmation", {
      firstName,
      order,
    });

    const result = await sendEmail({
      to: email,
      subject: `Order Confirmation #${order._id.toString().slice(-6).toUpperCase()} - Nemesis`,
      html,
    });

    if (userId) {
        await logSystemMessage(userId, `Order Confirmation #${order._id.toString().slice(-6).toUpperCase()}`, "Your order has been confirmed.");
    }
    return result;
  } catch (error) {
    console.error("Order confirmation email error:", error);
  }
};

const sendArtistApplicationEmail = async (email, firstName, userId = null) => {
  try {
    const html = renderTemplate("artist-application", {
      firstName,
    });

    // 1. Send to Applicant
    const result = await sendEmail({
      to: email,
      subject: "Application Received - Nemesis",
      html,
    });
    
    // 2. Log System Message
    if (userId) {
        await logSystemMessage(
            userId, 
            "Application Received", 
            "We have received your artist application. Our team will review your profile and get back to you shortly."
        );
    }

    // 3. Notify Admin
    const adminEmail = process.env.EMAIL_FROM || "mass@fuer.fr"; // Use configured sender or fallback
    // In a real app, you might loop through all SuperAdmins. For now, sending to the main service email is often configured to forward to admins.
    await sendEmail({
        to: adminEmail,
        subject: `[ADMIN] New Artist Application: ${firstName}`,
        html: `<p>User <strong>${firstName}</strong> (${email}) has applied for artist status.</p>`
    });

    return result;
  } catch (error) {
    console.error("Artist application email error:", error);
  }
};

const sendPasswordResetEmail = async (email, firstName, resetLink) => {
    // Note: Logging password resets to DB might be sensitive or unnecessary noise, limiting valid use cases. 
    // Usually we don't log "I forgot my password" details to the dashboard unless for security audit.
    // Skipping logSystemMessage for now.
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

const sendArtistStatusEmail = async (email, firstName, status, reason = null, userId = null) => {
  try {
    const html = renderTemplate("artist-status", {
      firstName,
      status,
      reason,
    });

    const subjects = {
      verified: "Congratulations! You're an Official Artist - Nemesis",
      suspended: "Account Status Update - Nemesis",
      pending: "Application Under Review - Nemesis",
      incomplete: "Action Required: Artist Application Update - Nemesis",
    };
    
    const subject = subjects[status] || "Artist Status Update - Nemesis";

    const result = await sendEmail({
      to: email,
      subject,
      html,
    });

    if (userId) {
        let systemMessage = `Your artist status has been updated to: ${status}.`;
        
        if (status === 'verified') {
            systemMessage = `Congratulations! You have been approved as an artist on Nemesis.
            
You can now:
- Create and Manage Artworks
- Host Events
- Customize your Artist Profile
- Upload your Videos / Movies

Welcome to the community!`;
        } else if (status === 'incomplete') {
            systemMessage = `Your artist application requires attention. Status set to: Incomplete.
            
Reason/Feedback: ${reason || 'Please review your profile details and ensure all information is accurate.'}
            
Please update your profile and re-apply or contact support.`;
        } else if (reason) {
            systemMessage += ` Reason: ${reason}`;
        }

        await logSystemMessage(userId, subject, systemMessage);
    }
    return result;
  } catch (error) {
    console.error("Artist status email error:", error);
  }
};

const sendEventAttendanceEmail = async (email, firstName, { eventTitle, eventDate, eventLocation, confirmationLink }, userId = null) => {
  try {
    const html = renderTemplate("event-attendance", {
      firstName,
      eventTitle,
      eventDate,
      eventLocation,
      confirmationLink,
    });

    const result = await sendEmail({
      to: email,
      subject: `Confirm Your Attendance - ${eventTitle} - Nemesis`,
      html,
    });

    if (userId) {
        await logSystemMessage(userId, `Attendance: ${eventTitle}`, `Please confirm your attendance. Event Date: ${new Date(eventDate).toLocaleDateString()}`);
    }
    return result;
  } catch (error) {
    console.error("Event attendance email error:", error);
  }
};

const sendLowStorageAlert = async (email, firstName, usagePercent, totalUsed, limit, userId = null) => {
  try {
     const html = `
       <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
         <h1 style="color: #ef4444;">Low Storage Alert</h1>
         <p>Hello ${firstName},</p>
         <p>The platform storage is reaching its capacity.</p>
         <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
           <p style="margin: 5px 0;"><strong>Current Usage:</strong> ${usagePercent.toFixed(1)}%</p>
           <p style="margin: 5px 0;"><strong>Used:</strong> ${(totalUsed / (1024*1024*1024)).toFixed(2)} GB</p>
           <p style="margin: 5px 0;"><strong>Limit:</strong> ${(limit / (1024*1024*1024)).toFixed(2)} GB</p>
         </div>
         <p>Please audit files or increase the platform limit in settings.</p>
       </div>
     `;
     
     const result = await sendEmail({
       to: email,
       subject: `URGENT: Platform Storage at ${usagePercent.toFixed(0)}% Capacity - Nemesis`,
       html
     });

     if (userId) {
         await logSystemMessage(userId, "Low Storage Alert", `Platform storage usage is at ${usagePercent.toFixed(0)}%.`);
     }
     return result;
  } catch (error) {
     console.error("Storage alert email error:", error);
  }
};

module.exports = {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendArtistApplicationEmail,
  sendPasswordResetEmail,
  sendArtistStatusEmail,
  sendEventAttendanceEmail,
  sendLowStorageAlert,
};