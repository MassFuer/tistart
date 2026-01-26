const { Schema, model } = require("mongoose");

const messageSchema = new Schema(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: function () {
        return this.type === "text";
      },
      maxlength: 2000,
      trim: true,
    },
    // Message type for different content types
    type: {
      type: String,
      enum: ["text", "offer", "system"],
      default: "text",
    },
    // For offer messages
    offer: {
      amount: {
        type: Number,
      },
      status: {
        type: String,
        enum: ["pending", "accepted", "rejected", "countered"],
        default: "pending",
      },
    },
    // Read receipts
    readBy: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Soft delete for moderation
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fetching messages in a conversation chronologically
messageSchema.index({ conversation: 1, createdAt: 1 });

// Index for unread messages
messageSchema.index({ conversation: 1, "readBy.user": 1 });

// Virtual to check if message is read by a specific user
messageSchema.methods.isReadBy = function (userId) {
  return this.readBy.some(
    (receipt) => receipt.user.toString() === userId.toString()
  );
};

// Mark message as read by a user
messageSchema.methods.markAsRead = async function (userId) {
  if (!this.isReadBy(userId)) {
    this.readBy.push({
      user: userId,
      readAt: new Date(),
    });
    return this.save();
  }
  return this;
};

// Static method to get messages for a conversation with pagination
messageSchema.statics.getConversationMessages = async function (
  conversationId,
  options = {}
) {
  const { limit = 50, before = null, after = null } = options;

  const query = {
    conversation: conversationId,
    isDeleted: false,
  };

  if (before) {
    query.createdAt = { $lt: new Date(before) };
  } else if (after) {
    query.createdAt = { $gt: new Date(after) };
  }

  const messages = await this.find(query)
    .sort({ createdAt: before ? -1 : 1 })
    .limit(limit)
    .populate("sender", "firstName lastName userName profilePicture role artistStatus")
    .lean();

  // If fetching before, reverse to get chronological order
  if (before) {
    messages.reverse();
  }

  return messages;
};

// Static method to mark all messages as read for a user in a conversation
messageSchema.statics.markAllAsRead = async function (conversationId, userId) {
  const messages = await this.find({
    conversation: conversationId,
    "readBy.user": { $ne: userId },
    isDeleted: false,
  });

  const updatePromises = messages.map((message) => message.markAsRead(userId));
  return Promise.all(updatePromises);
};

const Message = model("Message", messageSchema);

module.exports = Message;