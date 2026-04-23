// frontend/src/hooks/useSocket.js

import { useEffect } from 'react';
import { getSocket } from '../services/socket.js';
import useAuthStore from '../store/authStore.js';
import useChatStore from '../store/chatStore.js';

// ─────────────────────────────────────────────
// SIMPLIFIED useSocket — No useRef guard
// WHY remove useRef guard:
// The ref was PREVENTING re-attachment after hot reload
// useEffect cleanup already handles duplicate listeners
// by calling socket.off() before socket.on()
// This is cleaner and more reliable
// ─────────────────────────────────────────────

const useSocket = () => {
  const { user, token } = useAuthStore();
  const {
    addMessage,
    setOnlineUsers,
    addOnlineUser,
    removeOnlineUser,
    setTypingUser,
  } = useChatStore();

  useEffect(() => {
    if (!user || !token) return;

    // ─────────────────────────────────────────
    // WAIT FOR SOCKET — poll every 200ms
    // WHY: socket.js connectSocket() is async in nature
    // The socket might not exist yet when this effect runs
    // We poll until we find a connected socket
    // ─────────────────────────────────────────
    let socket = null;
    let pollInterval = null;

    const setupListeners = (s) => {
      // Remove old listeners first to prevent duplicates
      s.off('newMessage');
      s.off('onlineUsers');
      s.off('userOnline');
      s.off('userOffline');
      s.off('typingStatus');
      s.off('messageError');

      console.log('🎧 Socket listeners attached for:', user.username);

      s.on('newMessage', (message) => {
        console.log('📩 newMessage:', message.content, 'from:', message.sender?.username);
        addMessage(message);
      });

      s.on('onlineUsers', (userIds) => {
        console.log('👥 onlineUsers received:', userIds);
        setOnlineUsers(userIds);
      });

      s.on('userOnline', (data) => {
        console.log('🟢 userOnline:', data.username, 'id:', data.userId);
        addOnlineUser(data.userId);
      });

      s.on('userOffline', (data) => {
        console.log('🔴 userOffline:', data.username);
        removeOnlineUser(data.userId);
      });

      s.on('typingStatus', (data) => {
        if (data.userId?.toString() === user._id?.toString()) return;
        setTypingUser(data.roomId, data.username, data.isTyping);
      });

      s.on('messageError', (data) => {
        console.error('❌ messageError:', data.message);
      });
    };

    const trySetup = () => {
      const currentSocket = getSocket();

      if (currentSocket?.connected) {
        socket = currentSocket;
        clearInterval(pollInterval);
        setupListeners(socket);
        return;
      }

      if (currentSocket && !currentSocket.connected) {
        // Socket exists but connecting — wait for connect
        currentSocket.once('connect', () => {
          socket = currentSocket;
          clearInterval(pollInterval);
          setupListeners(socket);
        });
        clearInterval(pollInterval);
      }
    };

    // Try immediately first
    trySetup();

    // If socket not ready — poll every 200ms
    if (!socket) {
      pollInterval = setInterval(trySetup, 200);
    }

    // ─────────────────────────────────────────
    // CLEANUP — runs when component unmounts
    // or when user/token changes
    // ─────────────────────────────────────────
    return () => {
      clearInterval(pollInterval);
      const s = getSocket();
      if (s) {
        s.off('newMessage');
        s.off('onlineUsers');
        s.off('userOnline');
        s.off('userOffline');
        s.off('typingStatus');
        s.off('messageError');
        console.log('🧹 Socket listeners cleaned up');
      }
    };

  }, [user?._id, token]); // only re-run if user or token changes
};

export default useSocket;