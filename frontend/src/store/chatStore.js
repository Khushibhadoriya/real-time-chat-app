// frontend/src/store/chatStore.js

import { create } from 'zustand';
import api from '../services/api.js';
import { getSocket } from '../services/socket.js';

const useChatStore = create((set, get) => ({

  rooms: [],
  allRooms: [],
  activeRoom: null,
  messages: [],
  onlineUsers: [],
  typingUsers: {},
  isLoadingRooms: false,
  isLoadingMessages: false,

  fetchMyRooms: async () => {
    set({ isLoadingRooms: true });
    try {
      const response = await api.get('/rooms/my');
      set({ rooms: response.data.rooms, isLoadingRooms: false });
    } catch (error) {
      console.error('Fetch my rooms error:', error);
      set({ isLoadingRooms: false });
    }
  },

  fetchAllRooms: async () => {
    try {
      const response = await api.get('/rooms');
      set({ allRooms: response.data.rooms });
    } catch (error) {
      console.error('Fetch all rooms error:', error);
    }
  },

  setActiveRoom: (room) => {
    const socket = getSocket();
    const currentRoom = get().activeRoom;
    if (currentRoom) socket?.emit('leaveRoom', currentRoom._id);
    if (room) socket?.emit('joinRoom', room._id);
    set({ activeRoom: room, messages: [] });
  },

  createRoom: async (name, description, avatar) => {
    try {
      const response = await api.post('/rooms', { name, description, avatar });
      const newRoom = response.data.room;
      set((state) => ({ rooms: [newRoom, ...state.rooms] }));
      return { success: true, room: newRoom };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to create room' };
    }
  },

  joinRoom: async (roomId) => {
    try {
      const response = await api.post(`/rooms/${roomId}/join`);
      const joinedRoom = response.data.room;
      set((state) => ({
        rooms: [joinedRoom, ...state.rooms],
        allRooms: state.allRooms.map((r) => r._id === roomId ? joinedRoom : r),
      }));
      return { success: true, room: joinedRoom };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to join room' };
    }
  },

  fetchMessages: async (roomId) => {
    set({ isLoadingMessages: true });
    try {
      const response = await api.get(`/messages/${roomId}`);
      set({ messages: response.data.messages, isLoadingMessages: false });
    } catch (error) {
      console.error('Fetch messages error:', error);
      set({ isLoadingMessages: false });
    }
  },

  addMessage: (message) => {
    set((state) => ({
      messages: state.messages.some((m) => m._id === message._id)
        ? state.messages
        : [...state.messages, message],
    }));
  },

  sendMessage: (roomId, content) => {
    const socket = getSocket();
    if (!socket?.connected) {
      console.error('❌ Socket not connected');
      return;
    }
    console.log('📤 Sending message:', content, 'to room:', roomId);
    socket.emit('sendMessage', { roomId, content });
  },

  // ── ONLINE STATUS ──────────────────────────────────────────────
  // CRITICAL: Store everything as STRING
  // MongoDB IDs can come as objects or strings depending on context
  // Always .toString() prevents type mismatch bugs

  setOnlineUsers: (userIds) => {
    const stringIds = userIds.map(id => id.toString());
    console.log('💾 Setting online users:', stringIds);
    set({ onlineUsers: stringIds });
  },

  addOnlineUser: (userId) => {
    const id = userId.toString();
    set((state) => {
      if (state.onlineUsers.includes(id)) return state;
      console.log('➕ Adding online user:', id);
      return { onlineUsers: [...state.onlineUsers, id] };
    });
  },

  removeOnlineUser: (userId) => {
    const id = userId.toString();
    set((state) => ({
      onlineUsers: state.onlineUsers.filter(uid => uid !== id),
    }));
  },

  setTypingUser: (roomId, username, isTyping) => {
    set((state) => {
      const roomTypers = state.typingUsers[roomId] || [];
      const updated = isTyping
        ? roomTypers.includes(username) ? roomTypers : [...roomTypers, username]
        : roomTypers.filter(u => u !== username);
      return { typingUsers: { ...state.typingUsers, [roomId]: updated } };
    });
  },
}));

export default useChatStore;