import { createContext, useState, useEffect, useContext, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { messagingAPI } from "../services/api";

const MessagingContext = createContext();

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5005";

export const MessagingProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({}); // conversationId -> [userIds]
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const typingTimeoutRef = useRef({});

  // Initialize socket connection when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      console.log("Socket connected");
      setIsConnected(true);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
      setIsConnected(false);
    });

    // Handle online users
    newSocket.on("users:online", (users) => {
      setOnlineUsers(users);
    });

    newSocket.on("user:status", ({ userId, isOnline }) => {
      setOnlineUsers((prev) =>
        isOnline ? [...new Set([...prev, userId])] : prev.filter((id) => id !== userId)
      );
    });

    // Handle new messages
    newSocket.on("message:new", ({ conversationId, message }) => {
      // Update messages if viewing this conversation
      if (activeConversation?._id === conversationId) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
      }

      // Update conversation list
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === conversationId
            ? {
                ...conv,
                lastMessage: {
                  content: message.content,
                  sender: message.sender,
                  createdAt: message.createdAt,
                },
                unreadCount:
                  message.sender._id !== user?._id && activeConversation?._id !== conversationId
                    ? (conv.unreadCount || 0) + 1
                    : conv.unreadCount,
              }
            : conv
        )
      );

      // Update global unread count
      if (message.sender._id !== user?._id && activeConversation?._id !== conversationId) {
        setUnreadCount((prev) => prev + 1);
      }
    });

    // Handle message notifications
    newSocket.on("notification:message", ({ conversationId, message }) => {
      // Could trigger toast notification here
      console.log("New message notification:", message);
    });

    // Handle read receipts
    newSocket.on("messages:read", ({ conversationId, userId }) => {
      if (activeConversation?._id === conversationId) {
        setMessages((prev) =>
          prev.map((msg) => ({
            ...msg,
            readBy: msg.readBy.some((r) => r.user === userId)
              ? msg.readBy
              : [...msg.readBy, { user: userId, readAt: new Date() }],
          }))
        );
      }
    });

    // Handle typing indicators
    newSocket.on("typing:update", ({ conversationId, userId, isTyping }) => {
      setTypingUsers((prev) => {
        const current = prev[conversationId] || [];
        if (isTyping) {
          return { ...prev, [conversationId]: [...new Set([...current, userId])] };
        }
        return { ...prev, [conversationId]: current.filter((id) => id !== userId) };
      });
    });

    // Handle offer events
    newSocket.on("offer:new", ({ conversationId, offer, offeredBy }) => {
      console.log("New offer:", offer, "from:", offeredBy);
    });

    newSocket.on("offer:response", ({ conversationId, messageId, status }) => {
      // Update message offer status
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? { ...msg, offer: { ...msg.offer, status } }
            : msg
        )
      );
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoadingConversations(true);
    try {
      const response = await messagingAPI.getConversations();
      setConversations(response.data.conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [isAuthenticated]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await messagingAPI.getUnreadCount();
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, [isAuthenticated]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(
    async (conversationId, options = {}) => {
      if (!conversationId) return;

      setIsLoadingMessages(true);
      try {
        const response = await messagingAPI.getMessages(conversationId, options);
        setMessages(response.data.messages);
        return response.data;
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setIsLoadingMessages(false);
      }
    },
    []
  );

  // Open a conversation
  const openConversation = useCallback(
    async (conversation) => {
      setActiveConversation(conversation);

      // Join socket room
      if (socket && isConnected) {
        // Leave previous room
        if (activeConversation) {
          socket.emit("conversation:leave", { conversationId: activeConversation._id });
        }
        socket.emit("conversation:join", { conversationId: conversation._id });
      }

      // Fetch messages
      await fetchMessages(conversation._id);

      // Mark as read
      try {
        await messagingAPI.markAsRead(conversation._id);
        setConversations((prev) =>
          prev.map((conv) =>
            conv._id === conversation._id ? { ...conv, unreadCount: 0 } : conv
          )
        );
        // Recalculate total unread
        fetchUnreadCount();
      } catch (error) {
        console.error("Error marking as read:", error);
      }
    },
    [socket, isConnected, activeConversation, fetchMessages, fetchUnreadCount]
  );

  // Close active conversation
  const closeConversation = useCallback(() => {
    if (socket && isConnected && activeConversation) {
      socket.emit("conversation:leave", { conversationId: activeConversation._id });
    }
    setActiveConversation(null);
    setMessages([]);
  }, [socket, isConnected, activeConversation]);

  // Start a new conversation
  const startConversation = useCallback(
    async (participantId, artworkId = null, initialMessage = "") => {
      try {
        const response = await messagingAPI.createConversation({
          participantId,
          artworkId,
          initialMessage,
        });

        const newConversation = response.data;

        // Add to conversations list if not already there
        setConversations((prev) => {
          if (prev.some((c) => c._id === newConversation._id)) {
            return prev;
          }
          return [newConversation, ...prev];
        });

        return newConversation;
      } catch (error) {
        console.error("Error starting conversation:", error);
        throw error;
      }
    },
    []
  );

  // Send a message
  const sendMessage = useCallback(
    async (content, type = "text", offer = null) => {
      if (!activeConversation || !socket || !isConnected) return;

      // Optimistic update
      const tempMessage = {
        _id: `temp-${Date.now()}`,
        conversation: activeConversation._id,
        sender: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          userName: user.userName,
          profilePicture: user.profilePicture,
        },
        content,
        type,
        offer: offer ? { amount: offer.amount, status: "pending" } : null,
        readBy: [{ user: user._id, readAt: new Date() }],
        createdAt: new Date().toISOString(),
        isPending: true,
      };

      setMessages((prev) => [...prev, tempMessage]);

      // Send via socket
      socket.emit("message:send", {
        conversationId: activeConversation._id,
        content,
        type,
        offer,
      });

      // Stop typing indicator
      stopTyping();
    },
    [activeConversation, socket, isConnected, user]
  );

  // Send typing indicator
  const startTyping = useCallback(() => {
    if (!activeConversation || !socket || !isConnected) return;

    socket.emit("typing:start", { conversationId: activeConversation._id });

    // Clear existing timeout
    if (typingTimeoutRef.current[activeConversation._id]) {
      clearTimeout(typingTimeoutRef.current[activeConversation._id]);
    }

    // Auto-stop after 3 seconds
    typingTimeoutRef.current[activeConversation._id] = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [activeConversation, socket, isConnected]);

  const stopTyping = useCallback(() => {
    if (!activeConversation || !socket || !isConnected) return;

    socket.emit("typing:stop", { conversationId: activeConversation._id });

    if (typingTimeoutRef.current[activeConversation._id]) {
      clearTimeout(typingTimeoutRef.current[activeConversation._id]);
    }
  }, [activeConversation, socket, isConnected]);

  // Make an offer
  const makeOffer = useCallback(
    async (amount) => {
      if (!activeConversation) return;

      await sendMessage(`Price offer: €${amount.toFixed(2)}`, "offer", { amount });
    },
    [activeConversation, sendMessage]
  );

  // Respond to an offer
  const respondToOffer = useCallback(
    async (messageId, status) => {
      if (!activeConversation || !socket || !isConnected) return;

      socket.emit("offer:respond", {
        conversationId: activeConversation._id,
        messageId,
        status,
      });
    },
    [activeConversation, socket, isConnected]
  );

  // Check if user is online
  const isUserOnline = useCallback(
    (userId) => onlineUsers.includes(userId),
    [onlineUsers]
  );

  // Get typing users for current conversation
  const getTypingUsers = useCallback(
    (conversationId) => typingUsers[conversationId] || [],
    [typingUsers]
  );

  // Load initial data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
      fetchUnreadCount();
    }
  }, [isAuthenticated, fetchConversations, fetchUnreadCount]);

  const value = {
    // State
    socket,
    isConnected,
    conversations,
    activeConversation,
    messages,
    unreadCount,
    onlineUsers,
    isLoadingConversations,
    isLoadingMessages,
    // Actions
    fetchConversations,
    fetchUnreadCount,
    fetchMessages,
    openConversation,
    closeConversation,
    startConversation,
    sendMessage,
    startTyping,
    stopTyping,
    makeOffer,
    respondToOffer,
    // Helpers
    isUserOnline,
    getTypingUsers,
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
};

export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error("useMessaging must be used within a MessagingProvider");
  }
  return context;
};

export default MessagingContext;