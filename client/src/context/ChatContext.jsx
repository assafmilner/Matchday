// client/src/context/ChatContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import api from "../utils/api";
import socketService from "../services/socketService";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  const [chatCache, setChatCache] = useState(new Map()); // הוסף cache מקומי

  const loadRecentChats = useCallback(async () => {
    if (loading) return;

    setLoading(true);
    try {
      const res = await api.get("/api/messages/recent");
      if (res.data.success) {
        setRecentChats(res.data.recentChats || []);
      }
    } catch (err) {
      console.error("Failed to load recent chats", err);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const markAsRead = useCallback((senderId = null) => {
    if (senderId) {
      setNotifications((prev) => prev.filter((n) => n.senderId !== senderId));
    } else {
      setNotifications([]);
    }
  }, []);

  const setActiveChat = useCallback((chatId) => {
    console.log("Setting active chat:", chatId);
    setActiveChatId(chatId);
  }, []);

  // פונקציה לעדכון ה-cache עם הודעה חדשה
  const addMessageToGlobalCache = useCallback(
    (message) => {
      const chatId =
        message.senderId._id === activeChatId
          ? message.receiverId._id
          : message.senderId._id;

      setChatCache((prev) => {
        const newCache = new Map(prev);
        const existingMessages = newCache.get(chatId) || [];

        // בדוק אם ההודעה כבר קיימת
        const messageExists = existingMessages.some(
          (msg) => msg._id === message._id
        );
        if (!messageExists) {
          const updatedMessages = [...existingMessages, message].sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          );
          newCache.set(chatId, updatedMessages);
          console.log(
            `Updated cache for chat ${chatId}, total messages:`,
            updatedMessages.length
          );
        }

        return newCache;
      });
    },
    [activeChatId]
  );

  // פונקציה לקבלת הודעות מה-cache
  const getCachedMessages = useCallback(
    (chatId) => {
      return chatCache.get(chatId) || [];
    },
    [chatCache]
  );

  // עדכון שיחות אחרונות
  const updateRecentChat = useCallback(
    (message) => {
      setRecentChats((prev) => {
        const updated = [...prev];
        const existingIndex = updated.findIndex(
          (chat) =>
            chat.user._id === message.senderId._id ||
            chat.user._id === message.receiverId._id
        );

        const otherUserId =
          message.senderId._id === activeChatId
            ? message.receiverId._id
            : message.senderId._id;
        const otherUser =
          message.senderId._id === activeChatId
            ? message.receiverId
            : message.senderId;

        if (existingIndex >= 0) {
          updated[existingIndex] = {
            ...updated[existingIndex],
            lastMessage: message.content,
            lastMessageTime: message.createdAt,
          };
          const updatedChat = updated.splice(existingIndex, 1)[0];
          updated.unshift(updatedChat);
        } else {
          updated.unshift({
            user: otherUser,
            lastMessage: message.content,
            lastMessageTime: message.createdAt,
          });
        }

        return updated.slice(0, 10);
      });
    },
    [activeChatId]
  );

  const addNotification = useCallback(
    (notification) => {
      if (activeChatId === notification.senderId) {
        console.log(
          "Chat is active, not adding notification for:",
          notification.senderId
        );
        return;
      }

      console.log("Adding notification from:", notification.senderName);
      setNotifications((prev) => {
        const exists = prev.some((n) => n.senderId === notification.senderId);
        if (exists) {
          return prev.map((n) =>
            n.senderId === notification.senderId
              ? {
                  ...n,
                  content: notification.content,
                  timestamp: new Date(notification.timestamp),
                }
              : n
          );
        }
        return [
          ...prev,
          {
            id: Date.now(),
            senderId: notification.senderId,
            senderName: notification.senderName,
            senderAvatar: notification.senderAvatar,
            content: notification.content,
            timestamp: new Date(notification.timestamp),
          },
        ];
      });
    },
    [activeChatId]
  );

  const showToast = useCallback(
    (message) => {
      if (activeChatId === message.senderId) {
        return;
      }

      if (window.location.pathname === "/messages") return;

      const toast = document.createElement("div");
      toast.className =
        "fixed bottom-6 left-6 bg-white shadow-lg border border-gray-300 px-4 py-3 rounded-lg z-50";
      toast.style.direction = "rtl";
      toast.innerHTML = `
      <div>
        <strong>${message.senderName}</strong><br/>
        <span style="font-size: 0.875rem;">${message.content.slice(0, 50)}${
        message.content.length > 50 ? "..." : ""
      }</span>
      </div>
    `;

      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 4000);
    },
    [activeChatId]
  );

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const initSocket = async () => {
      try {
        await socketService.connect(token);

        socketService.onReceiveMessage((msg) => {
          console.log(
            "📨 ChatContext received message from:",
            msg.senderId.name
          );

          // תמיד הוסף ל-cache
          addMessageToGlobalCache(msg);

          // עדכן שיחות אחרונות
          updateRecentChat(msg);

          const notification = {
            senderId: msg.senderId._id,
            senderName: msg.senderId.name,
            senderAvatar: msg.senderId.profilePicture,
            content: msg.content,
            timestamp: msg.createdAt,
          };

          addNotification(notification);
          showToast(notification);
        });
      } catch (error) {
        console.error("Socket connection failed:", error);
      }
    };

    initSocket();

    return () => {
      // אל תסיר listeners כאן!
    };
  }, [addMessageToGlobalCache, updateRecentChat, addNotification, showToast]);

  const value = {
    notifications,
    unreadCount: notifications.length,
    recentChats,
    loading,
    loadRecentChats,
    markAsRead,
    setActiveChat,
    activeChatId,
    getCachedMessages, // הוסף את זה
    addMessageToGlobalCache, // הוסף את זה
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within ChatProvider");
  }
  return context;
};
