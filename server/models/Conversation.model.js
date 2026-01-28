const { Schema, model } = require("mongoose");

const conversationSchema = new Schema(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    // Optional reference to artwork - conversation context
    artwork: {
      type: Schema.Types.ObjectId,
      ref: "Artwork",
      default: null,
    },
    // Denormalized last message for efficient listing
    lastMessage: {
      content: {
        type: String,
        default: "",
      },
      sender: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
    // Unread count per participant (userId string -> count)
    unreadCount: {
      type: Map,
      of: Number,
      default: new Map(),
    },
    // Conversation status
    status: {
      type: String,
      enum: ["active", "archived", "blocked"],
      default: "active",
    },
    // Price negotiation tracking
    negotiation: {
      currentOffer: {
        type: Number,
        default: null,
      },
      offerHistory: [
        {
          amount: {
            type: Number,
            required: true,
          },
          offeredBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          status: {
            type: String,
            enum: ["pending", "accepted", "rejected", "countered"],
            default: "pending",
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      status: {
        type: String,
        enum: ["none", "pending", "accepted", "rejected"],
        default: "none",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding conversations by participants
conversationSchema.index({ participants: 1 });

// Index for fetching user's conversations sorted by most recent
conversationSchema.index({ "lastMessage.createdAt": -1 });

// Index for status filtering
conversationSchema.index({ status: 1 });

// Index for finding conversations about specific artwork
conversationSchema.index({ artwork: 1 });

// Static method to find or create a conversation between two users
conversationSchema.statics.findOrCreateConversation = async function (
  participantIds,
  artworkId = null
) {
  // Sort participant IDs to ensure consistent lookup
  const sortedParticipants = [...participantIds].sort();

  // Find existing conversation with same participants and artwork
  let conversation = await this.findOne({
    participants: { $all: sortedParticipants, $size: sortedParticipants.length },
    artwork: artworkId,
    status: "active",
  });

  if (!conversation) {
    // Initialize unread counts
    const unreadCount = new Map();
    sortedParticipants.forEach((id) => unreadCount.set(id.toString(), 0));

    conversation = await this.create({
      participants: sortedParticipants,
      artwork: artworkId,
      unreadCount,
    });
  }

  return conversation;
};

// Instance method to increment unread count for a user
conversationSchema.methods.incrementUnread = async function (userId) {
  const userIdStr = userId.toString();
  const currentCount = this.unreadCount.get(userIdStr) || 0;
  this.unreadCount.set(userIdStr, currentCount + 1);
  return this.save();
};

// Instance method to reset unread count for a user
conversationSchema.methods.resetUnread = async function (userId) {
  this.unreadCount.set(userId.toString(), 0);
  return this.save();
};

// Instance method to update last message
conversationSchema.methods.updateLastMessage = async function (message) {
  this.lastMessage = {
    content:
      message.type === "offer"
        ? `Price offer: €${message.offer.amount}`
        : message.content,
    sender: message.sender,
    createdAt: message.createdAt || new Date(),
  };
  return this.save();
};

const Conversation = model("Conversation", conversationSchema);

module.exports = Conversation;