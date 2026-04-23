// frontend/src/components/chat/MessageInput.jsx

import { useState, useRef, useCallback } from 'react';
import { Send } from 'lucide-react';
import { getSocket } from '../../services/socket.js';
import useChatStore from '../../store/chatStore.js';

// ─────────────────────────────────────────────
// MESSAGE INPUT
// Handles: typing, sending message, typing indicators
// ─────────────────────────────────────────────

const MessageInput = () => {
  const [message, setMessage] = useState('');
  const { activeRoom, sendMessage } = useChatStore();

  // useRef to store typing timeout — persists between renders without causing re-render
  // WHY ref not state: changing a ref doesn't trigger re-render (more efficient)
  const typingTimeoutRef = useRef(null);

  // Track if we're currently emitting "typing" to avoid spamming the server
  const isTypingRef = useRef(false);

  // ─────────────────────────────────────────
  // HANDLE TYPING INDICATOR
  // Emits 'typing' when user starts typing
  // Emits 'stopTyping' after 1.5s of no keystrokes
  // ─────────────────────────────────────────
  const handleTyping = useCallback(() => {
    const socket = getSocket();
    if (!socket || !activeRoom) return;

    // If not already marked as typing → emit typing event
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing', activeRoom._id);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // After 1.5s of no typing → emit stopTyping
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit('stopTyping', activeRoom._id);
    }, 1500);
  }, [activeRoom]);

  // ─────────────────────────────────────────
  // HANDLE INPUT CHANGE
  // ─────────────────────────────────────────
  const handleChange = (e) => {
    setMessage(e.target.value);
    handleTyping();
  };

  // ─────────────────────────────────────────
  // HANDLE SEND
  // ─────────────────────────────────────────
  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed || !activeRoom) return;

    // Send via socket (goes through chatStore)
    sendMessage(activeRoom._id, trimmed);

    // Clear input
    setMessage('');

    // Stop typing indicator immediately on send
    const socket = getSocket();
    if (socket && isTypingRef.current) {
      isTypingRef.current = false;
      socket.emit('stopTyping', activeRoom._id);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  // Send on Enter key (Shift+Enter = new line)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // prevent newline
      handleSend();
    }
  };

  return (
    <div className="px-4 py-4 border-t border-slate-800 bg-slate-950">
      <div className="flex items-center gap-3 bg-slate-800/50 rounded-2xl
                      px-4 py-2 border border-slate-700
                      focus-within:border-violet-500/50 transition-colors">

        {/* Text input */}
        <textarea
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={activeRoom ? `Message #${activeRoom.name}` : 'Select a room...'}
          disabled={!activeRoom}
          rows={1}
          className="flex-1 bg-transparent text-white text-sm placeholder-slate-500
                     outline-none resize-none py-2 max-h-32 leading-relaxed
                     disabled:cursor-not-allowed"
          style={{ scrollbarWidth: 'none' }}
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!message.trim() || !activeRoom}
          className="w-9 h-9 bg-violet-600 hover:bg-violet-500
                     disabled:bg-slate-700 disabled:cursor-not-allowed
                     rounded-xl flex items-center justify-center shrink-0
                     transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <Send size={16} className="text-white" />
        </button>

      </div>
    </div>
  );
};

export default MessageInput;