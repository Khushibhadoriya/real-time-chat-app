// frontend/src/store/authStore.js

import { create } from 'zustand';
import api from '../services/api.js';
import { connectSocket, disconnectSocket } from '../services/socket.js';

// ─────────────────────────────────────────────
// AUTH STORE
// Manages: current user, login state, token
// Used by: every component that needs to know who is logged in
// ─────────────────────────────────────────────

const useAuthStore = create((set, get) => ({
  // ── STATE ──────────────────────────────────
  user: JSON.parse(localStorage.getItem('chatsphere_user')) || null,
  token: localStorage.getItem('chatsphere_token') || null,
  isLoading: false,
  error: null,

  // ── COMPUTED ───────────────────────────────
  // isAuthenticated: true if user exists
  isAuthenticated: () => !!get().token,

  // ── ACTIONS ────────────────────────────────

  // Register new user
  register: async (username, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register', {
        username,
        email,
        password,
      });

      const { token, user } = response.data;

      // Save to localStorage so user stays logged in on refresh
      localStorage.setItem('chatsphere_token', token);
      localStorage.setItem('chatsphere_user', JSON.stringify(user));

      // Connect socket after successful auth
      connectSocket(token);

      set({ user, token, isLoading: false });
      return { success: true };

    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      set({ error: message, isLoading: false });
      return { success: false, message };
    }
  },

  // Login existing user
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      localStorage.setItem('chatsphere_token', token);
      localStorage.setItem('chatsphere_user', JSON.stringify(user));

      connectSocket(token);

      set({ user, token, isLoading: false });
      return { success: true };

    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      set({ error: message, isLoading: false });
      return { success: false, message };
    }
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Even if API fails, we still clear local data
      console.error('Logout API error:', error);
    } finally {
      localStorage.removeItem('chatsphere_token');
      localStorage.removeItem('chatsphere_user');
      disconnectSocket();
      set({ user: null, token: null });
    }
  },

  // Clear any error messages
  clearError: () => set({ error: null }),
}));

export default useAuthStore;