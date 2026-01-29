const User = require("../models/User.model");
const Conversation = require("../models/Conversation.model");
const Message = require("../models/Message.model");

/**
 * Logs a system message to a user's conversation list.
 * Effectively creates a "System" conversation if one doesn't exist,
 * allowing users to see email notifications in their inbox.
 * 
 * @param {string} recipientUserId - The ID of the user receiving the message
 * @param {string} subject - The subject line (used as preamble)
 * @param {string} htmlContent - The HTML content of the email/message
 * @param {string} type - Message type (default: 'system')
 */
const logSystemMessage = async (recipientUserId, subject, htmlContent, type = "system") => {
    try {
        if (!recipientUserId) {
            console.warn("[MESSAGING] No recipient ID provided for system log");
            return;
        }

        // 1. Find a "System" sender
        // We need a stable sender ID for system messages to group them.
        // Option A: Specific "System" user in DB.
        // Option B: Use the first SuperAdmin found.
        // We'll use Option B for now, or create a virtual one if no SuperAdmin.
        const systemSender = await User.findOne({ role: "superAdmin" }).sort({ createdAt: 1 });
        
        if (!systemSender) {
            console.warn("[MESSAGING] No SuperAdmin found to act as system sender. Skipping log.");
            return;
        }

        const senderId = systemSender._id;

        // Prevent self-messaging if the recipient IS the superadmin (e.g. testing)
        // If recipient == sender, we might need a different logic, but for now allow it 
        // or simple check:
        // if (senderId.toString() === recipientUserId.toString()) return; 

        // 2. Find or Create Conversation
        const conversation = await Conversation.findOrCreateConversation([senderId, recipientUserId]);

        // 3. Create Message
        // Strip HTML tags for the preview/text content if needed, or store as is.
        // For 'content', we'll make a text summary.
        // Simple strip tags:
        const textContent = htmlContent.replace(/<[^>]*>?/gm, " ").trim().substring(0, 1900); // Truncate to fit
        const fullContent = `Subject: ${subject}\n\n${textContent}`;

        const message = await Message.create({
            conversation: conversation._id,
            sender: senderId,
            content: fullContent,
            type: type,
            isDeleted: false
        });

        // 4. Update Conversation
        await conversation.updateLastMessage(message);
        await conversation.incrementUnread(recipientUserId);

        console.log(`[MESSAGING] Logged system message to user ${recipientUserId}`);
        return message;
    } catch (error) {
        console.error("[MESSAGING] Failed to log system message:", error);
        // Don't throw, as this is a side-effect
    }
};

module.exports = {
    logSystemMessage
};
